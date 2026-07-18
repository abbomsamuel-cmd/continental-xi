"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  DraftRecord, Fixture, Formation, GameMode, IntlRecord, KOTie, LoggedMatch, Player, Position, Profile,
  SimTeam, TeamAnalysis, TournamentState,
} from "./types";
import { getFormation, canPlaySlot, greedyAssign, POSITION_GROUP } from "./formations";
import { getPool, getPoolPlayers, poolSquadPlayers, type DraftPool } from "./players";
import { pickDraftSquad } from "./draft";
import { analyzeTeam } from "./analysis";
import { tacticEngineAdjust, tacticFit, type TacticId } from "./tactics";
import { randomRng, seededRng, type Rng } from "./rng";
import {
  createTournament, playMatchday, playKnockoutStage, computeTable, USER_TEAM_ID,
} from "./engine/tournament";
import {
  createIntl, createIntlDraft, playIntlMatchday, playIntlRound, INTL_USER,
  type IntlComp, type IntlState,
} from "./engine/international";
import { checkAchievements } from "./achievements";
import { detectEggs } from "./easter-eggs";
import { play, setSoundEnabled } from "./sound";

export type Difficulty = "easy" | "medium" | "hard";
/** How the "Complete Squad with AI" assistant fills the remaining slots.
 *  RELAXED is the default: a fair, believable XI built mostly from 75–87 rated
 *  players — never an auto super-team. "best" is the opt-in advanced mode. */
export type AiStrategy = "relaxed" | "youthful" | "experienced" | "random" | "best";

/** Scarcer positions are filled first so the assistant never runs out of a rare
 *  role (a lone goalkeeper) after spending it elsewhere. */
function aiScarcity(pos: Position): number {
  return pos === "GK" ? 0 : POSITION_GROUP[pos] === "DEF" ? 1 : 2;
}

/** Running squad-level context so the assistant keeps the XI fair and varied. */
interface AiCtx { stars: number; club: Record<string, number>; nation: Record<string, number> }
/** Bumped each completion so a "regenerate" yields a genuinely different XI. */
let aiSeedBump = 0;

/** How desirable a rating is for the fair (non-"best") modes — peaks at 78–84,
 *  85–87 is used sparingly, 88+ is strongly avoided. */
function bandScore(overall: number): number {
  if (overall >= 78 && overall <= 84) return 10;
  if (overall >= 75 && overall <= 77) return 7;
  if (overall >= 85 && overall <= 87) return 5;
  if (overall >= 88) return -24;
  return 3;
}

/**
 * Pick a candidate for a slot. All candidates are already position-legal and
 * unused. Fair modes stay inside a 75–87 band, cap elite players (≤2 rated
 * 86–87, none 88+ unless nothing else fits), keep ≤3 from any club, and add
 * club/nation variety so the XI feels different every time. "best" ignores the
 * band and simply takes the strongest legal player.
 */
function aiPick(cands: Player[], slotPos: Position, strategy: AiStrategy, rand: () => number, ctx: AiCtx): Player | undefined {
  if (!cands.length) return undefined;
  const clubOk = (p: Player) => (ctx.club[p.club] ?? 0) < 3;

  let pool: Player[];
  if (strategy === "best") {
    pool = cands.filter(clubOk);
    if (!pool.length) pool = cands;
  } else {
    // fair band: ≤87, no more stars once we already have two, respect club cap
    pool = cands.filter((p) => p.overall <= 87 && !(ctx.stars >= 2 && p.overall >= 86) && clubOk(p));
    if (!pool.length) pool = cands.filter((p) => p.overall <= 87 && clubOk(p));
    if (!pool.length) pool = cands; // last resort — never leave a slot empty
  }

  const natural = (p: Player) => (p.position === slotPos ? 12 : 0);
  const variety = (p: Player) => (ctx.club[p.club] ?? 0) * 3 + (ctx.nation[p.nationality] ?? 0) * 1.5;
  const score = (p: Player) => {
    if (strategy === "best") return p.overall + natural(p);
    let s = bandScore(p.overall) + natural(p) - variety(p) + rand() * 4;
    if (strategy === "youthful") s += Math.max(0, p.season - 1995) * 0.12;      // recent vintages
    else if (strategy === "experienced") s += Math.max(0, 2005 - p.season) * 0.12; // classic vintages
    else if (strategy === "random") s += rand() * 9;                             // extra spread
    return s;
  };
  return [...pool].sort((a, b) => score(b) - score(a))[0];
}

interface DraftSetup {
  mode: GameMode;
  formationName: string;
  difficulty: Difficulty;
  daily?: string;
  /** squad pool this draft draws from — club history or a national tournament */
  pool: DraftPool;
  /** tactical style — must be chosen before entering the tournament */
  tactic?: TacticId;
}

const REROLLS_FOR: Record<Difficulty, number> = {
  easy: 3,
  medium: 1,
  hard: 0,
};

interface StoreState {
  hydrated: boolean;
  profile: Profile;

  // active draft — position-first: the user picks the slot to draft for, the
  // spinner draws a squad, only players eligible at that position are offered,
  // then the user chooses which open valid slot the pick fills.
  setup: DraftSetup | null;
  formation: Formation | null;
  picks: Record<number, string>; // slotIndex -> playerId
  /** slot filled at each pick, in order — powers Undo */
  placedSlots: number[];
  /** the slot currently being drafted for (drives the spin + eligibility); null = choose a position */
  targetSlot: number | null;
  /** squad drawn for the current target slot */
  spinSquadIndex: number;
  /** increments on every fresh draw so the spinner re-mounts and reveals */
  spinNonce: number;
  /** squad indexes already drawn this draft (avoid immediate repeats) */
  drawnSquads: number[];
  /** the armband — player id, chosen by the user before kick-off */
  captainId: string | null;
  draftComplete: boolean;
  lastUnlocked: string[];
  /** cosmetic emblems discovered on the last finished run — drives the egg toast */
  lastEggs: string[];
  rngSeed: string | null;
  rerolls: number;

  // tournament
  tournament: TournamentState | null;

  // international mode (EURO / Copa América) — fully independent of the draft
  intl: IntlState | null;
  /** pool the next draft should use (set by the International lobby) */
  pendingPool: DraftPool;
  setPendingPool: (pool: DraftPool) => void;

  /** lifetime reviewable log of every match the user's team played */
  matchLog: LoggedMatch[];

  // actions
  init: () => void;
  setProfileName: (name: string) => void;
  toggleSound: () => void;
  startDraft: (mode: GameMode, formationName: string, difficulty: Difficulty, daily?: string, pool?: DraftPool) => void;
  /** the user taps an empty slot on the pitch → spin a squad for that position */
  beginRound: (slotIndex: number) => void;
  /** free re-spin (used when the drawn squad has no eligible player) */
  respinSquad: () => void;
  /** back out of the current spin without placing anyone */
  cancelRound: () => void;
  /** place the chosen player into an open, eligible slot (may differ from the target) */
  choosePlayer: (playerId: string, slotIndex: number) => void;
  /** fill every remaining empty slot with valid players under the chosen strategy — returns how many were placed */
  completeWithAI: (strategy: AiStrategy) => number;
  undoLastPick: () => void;
  setTactic: (t: TacticId) => void;
  setCaptain: (playerId: string | null) => void;
  reroll: () => void;
  swapSlots: (a: number, b: number) => boolean;
  changeFormation: (formationName: string) => void;
  getOfferedPlayers: () => Player[];
  getXI: () => (Player | null)[];
  getAnalysis: () => TeamAnalysis | null;
  finishDraftIntoTournament: (teamName: string) => void;
  advanceLeague: () => Fixture[];
  advanceKnockout: () => KOTie[];
  getTable: () => ReturnType<typeof computeTable>;
  recordResult: () => void;
  resetDraft: () => void;
  clearUnlocked: () => void;
  clearEggs: () => void;

  // international actions
  startIntl: (comp: IntlComp, squadKey: string) => void;
  advanceIntlGroups: () => void;
  advanceIntlKO: () => void;
  endIntl: () => void;
}

const emptyProfile = (): Profile => ({
  name: "Guest Manager",
  createdAt: new Date().toISOString(),
  trophies: 0,
  achievements: [],
  drafts: [],
  soundOn: true,
  eggs: [],
});

/** Draw a squad that offers eligible players for `slotPos`, avoiding recent repeats. */
function drawSquadForSlot(
  rng: Rng, pool: DraftPool, slotPos: Position, drawnSquads: number[], excludeIndex: number,
): number {
  const squads = getPool(pool);
  const used = excludeIndex >= 0 ? [...drawnSquads, excludeIndex] : drawnSquads;
  const recent = drawnSquads.slice(-4);
  const recentClubs = recent.map((i) => squads[i]?.club).filter(Boolean) as string[];
  const recentLeagues = recent.map((i) => squads[i]?.league).filter(Boolean) as string[];
  const lastClub = excludeIndex >= 0 ? squads[excludeIndex]?.club ?? null : recentClubs[recentClubs.length - 1] ?? null;
  return pickDraftSquad(rng, slotPos, used, lastClub, recentClubs, recentLeagues, pool);
}

export const useGame = create<StoreState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      profile: emptyProfile(),
      setup: null,
      formation: null,
      picks: {},
      placedSlots: [],
      targetSlot: null,
      spinSquadIndex: -1,
      spinNonce: 0,
      drawnSquads: [],
      captainId: null,
      draftComplete: false,
      lastUnlocked: [],
      lastEggs: [],
      rngSeed: null,
      rerolls: 0,
      tournament: null,
      intl: null,
      pendingPool: "clubs",
      matchLog: [],
      setPendingPool: (pool) => set({ pendingPool: pool }),

      init: () => {
        setSoundEnabled(get().profile.soundOn);
        set({ hydrated: true });
      },

      setProfileName: (name) => set((s) => ({ profile: { ...s.profile, name: name || "Guest Manager" } })),

      toggleSound: () => set((s) => {
        const soundOn = !s.profile.soundOn;
        setSoundEnabled(soundOn);
        return { profile: { ...s.profile, soundOn } };
      }),

      startDraft: (mode, formationName, difficulty, daily, pool = "clubs") => {
        const formation = getFormation(formationName);
        const seed = daily ?? `draft-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
        set({
          setup: { mode, formationName, difficulty, daily, pool },
          formation,
          picks: {},
          placedSlots: [],
          targetSlot: null,
          spinSquadIndex: -1,
          spinNonce: 0,
          drawnSquads: [],
          captainId: null,
          draftComplete: false,
          tournament: null,
          rngSeed: seed,
          lastUnlocked: [],
          lastEggs: [],
          rerolls: REROLLS_FOR[difficulty],
        });
      },

      // The user tapped an empty slot on the pitch — draw a squad for that
      // position and start the spin.
      beginRound: (slotIndex) => {
        const { formation, picks, placedSlots, rngSeed, setup, drawnSquads, spinNonce } = get();
        if (!formation || !rngSeed) return;
        if (picks[slotIndex] !== undefined) return; // slot already filled
        if (get().targetSlot !== null) return; // a spin is already in flight
        const pool = setup?.pool ?? "clubs";
        const pos = formation.slots[slotIndex].pos;
        const rng = seededRng(`${rngSeed}-slot${slotIndex}-${placedSlots.length}-${Math.random()}`);
        const squadIndex = drawSquadForSlot(rng, pool, pos, drawnSquads, -1);
        set({
          targetSlot: slotIndex,
          spinSquadIndex: squadIndex,
          drawnSquads: [...drawnSquads, squadIndex],
          spinNonce: spinNonce + 1,
        });
      },

      // Free re-spin — draw a different team for the CURRENT target slot without
      // consuming a re-roll. Used when the squad has no eligible player.
      respinSquad: () => {
        const { formation, targetSlot, rngSeed, setup, drawnSquads, spinNonce, spinSquadIndex } = get();
        if (!formation || targetSlot === null || !rngSeed) return;
        const pool = setup?.pool ?? "clubs";
        const pos = formation.slots[targetSlot].pos;
        const rng = seededRng(`${rngSeed}-respin${targetSlot}-${spinNonce}-${Math.random()}`);
        const squadIndex = drawSquadForSlot(rng, pool, pos, drawnSquads, spinSquadIndex);
        play("flip");
        set({
          spinSquadIndex: squadIndex,
          drawnSquads: [...drawnSquads, squadIndex],
          spinNonce: spinNonce + 1,
        });
      },

      // Paid re-roll — a different team for the current slot, from the budget.
      reroll: () => {
        const { rerolls } = get();
        if (rerolls <= 0) return;
        get().respinSquad();
        set({ rerolls: rerolls - 1 });
      },

      // Abandon the current spin without placing anyone (back to choose-a-slot).
      cancelRound: () => {
        if (get().targetSlot === null) return;
        set({ targetSlot: null, spinSquadIndex: -1 });
      },

      // Swap the players in two formation slots — only if BOTH players can
      // legally occupy the destination. Illegal swaps are blocked.
      swapSlots: (a, b) => {
        const { formation, picks } = get();
        if (!formation || a === b) return false;
        const players = getPoolPlayers(get().setup?.pool ?? "clubs");
        const idA = picks[a];
        const idB = picks[b];
        if (!idA && !idB) return false;
        const pA = idA ? players.find((p) => p.id === idA) : null;
        const pB = idB ? players.find((p) => p.id === idB) : null;
        // player A must be able to play slot B, player B must be able to play slot A
        if (pA && !canPlaySlot(pA.position, pA.altPositions, formation.slots[b].pos)) return false;
        if (pB && !canPlaySlot(pB.position, pB.altPositions, formation.slots[a].pos)) return false;
        const next = { ...picks };
        if (idB) next[a] = idB; else delete next[a];
        if (idA) next[b] = idA; else delete next[b];
        play("click");
        set({ picks: next });
        return true;
      },

      // The player chose WHICH open, eligible slot the pick fills — never
      // auto-placed, never into a blocked position.
      choosePlayer: (playerId, slotIndex) => {
        const { formation, picks, placedSlots, setup } = get();
        if (!formation) return;
        if (picks[slotIndex] !== undefined) return; // occupied
        const player = getPoolPlayers(setup?.pool ?? "clubs").find((p) => p.id === playerId);
        if (!player) return;
        // strict: the destination must be a primary or secondary position
        if (!canPlaySlot(player.position, player.altPositions, formation.slots[slotIndex].pos)) return;
        const newPicks = { ...picks, [slotIndex]: playerId };
        const complete = Object.keys(newPicks).length >= formation.slots.length;
        play("select");
        set({
          picks: newPicks,
          placedSlots: [...placedSlots, slotIndex],
          targetSlot: null,
          spinSquadIndex: -1,
          draftComplete: complete,
        });
      },

      // Fill every remaining empty slot with valid players. Same eligibility
      // rules as a manual pick (never a GK at CB, never an invalid slot) and no
      // duplicate player or duplicate name. Scarce positions go first so a lone
      // keeper is never crowded out.
      completeWithAI: (strategy) => {
        const { formation, picks, placedSlots, setup } = get();
        if (!formation) return 0;
        const pool = setup?.pool ?? "clubs";
        const all = getPoolPlayers(pool);
        const byId = new Map(all.map((p) => [p.id, p]));
        const usedIds = new Set(Object.values(picks));
        const usedNames = new Set(
          Object.values(picks).map((id) => byId.get(id)?.name).filter(Boolean) as string[],
        );
        const newPicks = { ...picks };
        const newPlaced = [...placedSlots];
        const empty = formation.slots
          .map((s, i) => ({ i, pos: s.pos }))
          .filter((o) => newPicks[o.i] === undefined)
          .sort((a, b) => aiScarcity(a.pos) - aiScarcity(b.pos));
        // seed varies per fill (matchday/board state) so the same open board can
        // regenerate a genuinely different XI, but each fill is self-consistent.
        let seed = (placedSlots.length * 131 + empty.length * 17 + 7 + aiSeedBump) & 0x7fffffff;
        aiSeedBump = (aiSeedBump + 101) & 0x7fffffff;
        const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
        // squad-level context seeded from the manual picks already on the board
        const ctx: AiCtx = { stars: 0, club: {}, nation: {} };
        for (const id of Object.values(picks)) {
          const p = byId.get(id);
          if (!p) continue;
          if (p.overall >= 86 && p.overall <= 87) ctx.stars++;
          ctx.club[p.club] = (ctx.club[p.club] ?? 0) + 1;
          ctx.nation[p.nationality] = (ctx.nation[p.nationality] ?? 0) + 1;
        }
        let filled = 0;
        for (const slot of empty) {
          const candidates = all.filter(
            (p) => !usedIds.has(p.id) && !usedNames.has(p.name) && canPlaySlot(p.position, p.altPositions, slot.pos),
          );
          const chosen = aiPick(candidates, slot.pos, strategy, rand, ctx);
          if (!chosen) continue; // no valid player for this slot — leave it open
          newPicks[slot.i] = chosen.id;
          newPlaced.push(slot.i);
          usedIds.add(chosen.id);
          usedNames.add(chosen.name);
          if (chosen.overall >= 86 && chosen.overall <= 87) ctx.stars++;
          ctx.club[chosen.club] = (ctx.club[chosen.club] ?? 0) + 1;
          ctx.nation[chosen.nationality] = (ctx.nation[chosen.nationality] ?? 0) + 1;
          filled++;
        }
        const complete = Object.keys(newPicks).length >= formation.slots.length;
        set({
          picks: newPicks,
          placedSlots: newPlaced,
          targetSlot: null,
          spinSquadIndex: -1,
          draftComplete: complete,
        });
        return filled;
      },

      // Take back the last pick — the player returns to the pool.
      undoLastPick: () => {
        const { placedSlots, picks } = get();
        if (!placedSlots.length) return;
        const lastSlot = placedSlots[placedSlots.length - 1];
        const next = { ...picks };
        delete next[lastSlot];
        play("flip");
        set({
          picks: next,
          placedSlots: placedSlots.slice(0, -1),
          targetSlot: null,
          spinSquadIndex: -1,
          draftComplete: false,
        });
      },

      setTactic: (t) => set((s) => (s.setup ? { setup: { ...s.setup, tactic: t } } : {})),
      setCaptain: (playerId) => set({ captainId: playerId }),

      // Only players who can genuinely play the chosen position are offered —
      // no goalkeepers for a midfield slot, no strikers who can't drop deep.
      getOfferedPlayers: () => {
        const { formation, picks, setup, targetSlot, spinSquadIndex } = get();
        if (!formation || targetSlot === null || spinSquadIndex < 0) return [];
        const pool = setup?.pool ?? "clubs";
        const slotPos = formation.slots[targetSlot].pos;
        const chosenIds = new Set(Object.values(picks));
        const chosenNames = new Set(
          Object.values(picks).map((id) => getPoolPlayers(pool).find((p) => p.id === id)?.name),
        );
        return poolSquadPlayers(pool, spinSquadIndex)
          .filter((p) => !chosenIds.has(p.id) && !chosenNames.has(p.name))
          .filter((p) => canPlaySlot(p.position, p.altPositions, slotPos))
          .sort((a, b) => b.overall - a.overall)
          .slice(0, 12);
      },

      // Switch formation mid-draft — keep every player who still fits a slot of
      // the same position, drop those whose slot vanished so the user replaces
      // them. Never auto-place anyone into an invalid role.
      changeFormation: (formationName) => {
        const { formation, picks, placedSlots, setup, captainId } = get();
        if (!formation || !setup) return;
        const next = getFormation(formationName);
        const players = getPoolPlayers(setup.pool ?? "clubs");
        // remap placed players into the new shape (natural first, then eligible)
        const placed = placedSlots
          .map((slot) => players.find((p) => p.id === picks[slot]))
          .filter(Boolean) as Player[];
        const newPicks = greedyAssign(placed, next);
        // preserve pick order for Undo by sorting new slots by original order
        const orderOf = new Map(placed.map((p, idx) => [p.id, idx]));
        const newOrder = Object.entries(newPicks)
          .sort((a, b) => (orderOf.get(a[1]) ?? 0) - (orderOf.get(b[1]) ?? 0))
          .map(([slot]) => Number(slot));
        const stillCaptain = captainId && Object.values(newPicks).includes(captainId) ? captainId : null;
        play("flip");
        set({
          formation: next,
          setup: { ...setup, formationName },
          picks: newPicks,
          placedSlots: newOrder,
          targetSlot: null,
          spinSquadIndex: -1,
          captainId: stillCaptain,
          draftComplete: Object.keys(newPicks).length >= next.slots.length,
        });
      },

      getXI: () => {
        const { formation, picks, setup } = get();
        if (!formation) return [];
        const players = getPoolPlayers(setup?.pool ?? "clubs");
        return formation.slots.map((_, i) => {
          const id = picks[i];
          return id ? players.find((p) => p.id === id) ?? null : null;
        });
      },

      getAnalysis: () => {
        const { formation, setup } = get();
        if (!formation) return null;
        return analyzeTeam(formation, get().getXI(), setup?.tactic ?? null);
      },

      finishDraftIntoTournament: (teamName) => {
        const { formation, setup } = get();
        if (!formation) return;
        const xi = get().getXI();
        const tactic = setup?.tactic ?? null;
        const analysis = analyzeTeam(formation, xi, tactic);
        const fit = tactic ? tacticFit(tactic, formation, xi) : 74;
        const tacticAdj = tacticEngineAdjust(tactic, fit);
        const seed = `${get().rngSeed}-tourney`;
        const rng = seededRng(seed);
        const firstPlayer = xi.find(Boolean);
        const colors = firstPlayer?.colors ?? (["#D4AF37", "#061A40"] as [string, string]);
        const name = teamName || get().profile.name;
        play("whistle");
        const pool = setup?.pool ?? "clubs";
        if (pool === "euro" || pool === "copa") {
          // drafted XI of international legends enters its own tournament
          set({ intl: createIntlDraft(rng, pool, name, colors, analysis, tacticAdj, tactic) });
          return;
        }
        set({ tournament: createTournament(rng, name, analysis, colors, tacticAdj, tactic) });
      },

      advanceLeague: () => {
        const { tournament, rngSeed } = get();
        // phase guard: a stray second call must never replay/resolve the league
        if (!tournament || !rngSeed || tournament.phase !== "league") return [];
        const rng = seededRng(`${rngSeed}-md${tournament.matchday}-${Math.random()}`);
        const players = get().getXI().filter(Boolean) as Player[];
        const played = playMatchday(rng, tournament, players);
        const entries = played
          .filter((f) => f.result && (f.home === USER_TEAM_ID || f.away === USER_TEAM_ID))
          .map((f) => logEntry("cl", `Matchday ${f.matchday}`, tournament.teams, f.result!));
        set({ tournament: { ...tournament }, matchLog: pushLog(get().matchLog, entries) });
        return played;
      },

      advanceKnockout: () => {
        const { tournament, rngSeed } = get();
        // phase guard: only live knockout phases may advance a round
        if (!tournament || !rngSeed) return [];
        if (!["playoffs", "r16", "qf", "sf", "final"].includes(tournament.phase)) return [];
        const rng = seededRng(`${rngSeed}-ko-${tournament.phase}-${Math.random()}`);
        const players = get().getXI().filter(Boolean) as Player[];
        const ties = playKnockoutStage(rng, tournament, players);
        const entries: LoggedMatch[] = [];
        for (const t of ties.filter((t) => t.teamA === USER_TEAM_ID || t.teamB === USER_TEAM_ID)) {
          if (t.leg1) entries.push(logEntry("cl", t.leg2 ? `${t.round} · 1st Leg` : t.round, tournament.teams, t.leg1));
          if (t.leg2) entries.push(logEntry("cl", `${t.round} · 2nd Leg`, tournament.teams, t.leg2));
        }
        // NB: no result audio here — it would spoil a Live Match watched after
        // this simulation. Win/defeat sound is played by the reveal UI instead.
        set({ tournament: { ...tournament }, matchLog: pushLog(get().matchLog, entries) });
        return ties;
      },

      getTable: () => {
        const { tournament } = get();
        if (!tournament) return [];
        return computeTable(tournament);
      },

      recordResult: () => {
        const { tournament, formation, setup, profile } = get();
        if (!tournament || !formation || !setup) return;
        const xi = get().getXI();
        const analysis = analyzeTeam(formation, xi, setup.tactic ?? null);
        const table = computeTable(tournament);
        const userPos = table.findIndex((r) => r.teamId === USER_TEAM_ID) + 1;
        const champion = tournament.champion === USER_TEAM_ID;

        const STAGE_RESULT: Record<string, DraftRecord["result"]> = {
          "Final": "final", "Semi-final": "semi", "Quarter-final": "quarter",
          "Round of 16": "r16", "Play-off": "playoff", "League Phase": "league",
        };
        let result: DraftRecord["result"] = "league";
        if (champion) result = "champion";
        else if (tournament.exit) result = STAGE_RESULT[tournament.exit.stage] ?? "league";
        else if (!tournament.userAlive) result = deepestUserRound(tournament);

        const goals = Object.values(tournament.userGoals).reduce((s, g) => s + g, 0);
        const record: DraftRecord = {
          id: `${Date.now()}`,
          date: new Date().toISOString(),
          mode: setup.mode,
          formation: setup.formationName,
          overall: analysis.overall,
          tactic: setup.tactic,
          players: xi.filter(Boolean).map((p) => ({
            name: p!.name, club: p!.club, season: p!.season, position: p!.position, overall: p!.overall,
          })),
          result,
          goals,
          daily: setup.daily,
        };

        const lostAKnockout = tournament.ties.some(
          (t) => (t.teamA === USER_TEAM_ID || t.teamB === USER_TEAM_ID) && t.winner && t.winner !== USER_TEAM_ID,
        );
        const playersOver90 = xi.filter((p) => p && p.overall >= 90).length;
        const playersOver92 = xi.filter((p) => p && p.overall >= 92).length;
        const newProfileDrafts = [record, ...profile.drafts].slice(0, 200);
        const provisional: Profile = {
          ...profile,
          drafts: newProfileDrafts,
          trophies: profile.trophies + (champion ? 1 : 0),
        };
        const unlocked = checkAchievements({
          profile: provisional,
          analysis,
          record,
          playersOver90,
          playersOver92,
          topOfLeague: userPos === 1,
          lostAKnockout,
          isDaily: !!setup.daily,
        });
        // hidden cosmetic emblems — derived purely from the XI + outcome
        const startedXI = xi.filter(Boolean) as Player[];
        const captainName = startedXI.find((p) => p.id === get().captainId)?.name ?? null;
        const eggs = detectEggs({ xi: startedXI, captainName, champion }, provisional.eggs ?? []);
        if (unlocked.length) play("win");
        if (eggs.length) play("unlock");
        set({
          profile: {
            ...provisional,
            achievements: [...provisional.achievements, ...unlocked],
            eggs: [...(provisional.eggs ?? []), ...eggs],
          },
          lastUnlocked: unlocked,
          lastEggs: eggs,
        });
      },

      resetDraft: () => set({
        setup: null, formation: null, picks: {},
        placedSlots: [], targetSlot: null, spinSquadIndex: -1, spinNonce: 0,
        drawnSquads: [], captainId: null,
        draftComplete: false, tournament: null, rngSeed: null, lastUnlocked: [],
        rerolls: 0,
      }),

      clearUnlocked: () => set({ lastUnlocked: [] }),
      clearEggs: () => set({ lastEggs: [] }),

      // ---- International mode (EURO / Copa América) ----

      startIntl: (comp, key) => {
        const rng = randomRng();
        play("whistle");
        set({ intl: createIntl(rng, comp, key) });
      },

      advanceIntlGroups: () => {
        const { intl } = get();
        // phase guard — a stray double call must never replay a matchday
        if (!intl || intl.phase !== "groups") return;
        const md = intl.matchday;
        const userPlayers = intl.userKey === INTL_USER ? (get().getXI().filter(Boolean) as Player[]) : undefined;
        playIntlMatchday(randomRng(), intl, userPlayers);
        const entries = intl.fixtures
          .filter((f) => f.matchday === md && f.result && (f.home === intl.userKey || f.away === intl.userKey))
          .map((f) => logEntry(intl.comp, `Group Stage · Matchday ${md}`, intl.teams, f.result!));
        set({ intl: { ...intl }, matchLog: pushLog(get().matchLog, entries) });
      },

      advanceIntlKO: () => {
        const { intl } = get();
        if (!intl || !["r16", "qf", "sf", "final"].includes(intl.phase)) return;
        const playedRounds: KOTie["round"][] =
          intl.phase === "r16" ? ["Round of 16"] :
          intl.phase === "qf" ? ["Quarter-final"] :
          intl.phase === "sf" ? ["Semi-final"] : ["Final", "Third Place"];
        const userPlayers = intl.userKey === INTL_USER ? (get().getXI().filter(Boolean) as Player[]) : undefined;
        playIntlRound(randomRng(), intl, userPlayers);
        const entries = intl.ties
          .filter((t) => playedRounds.includes(t.round) && t.leg1 && (t.teamA === intl.userKey || t.teamB === intl.userKey))
          .map((t) => logEntry(intl.comp, t.round === "Final" ? "The Final" : t.round, intl.teams, t.leg1!));
        // no result audio here — the reveal UI plays win/defeat so a Live Match
        // watched after this simulation is never spoiled.
        set({ intl: { ...intl }, matchLog: pushLog(get().matchLog, entries) });
      },

      endIntl: () => {
        const { intl, profile } = get();
        if (!intl) return;
        const stage = intl.exit?.stage ?? "Group Stage";
        const result =
          intl.champion === intl.userKey ? "champion" :
          stage === "Final" ? "final" :
          stage === "Third Place" ? "third" :
          stage === "Semi-final" ? "semi" :
          stage === "Quarter-final" ? "quarter" :
          stage === "Round of 16" ? "r16" : "groups";
        const drafted = intl.userKey === INTL_USER;
        const [nation, year] = drafted
          ? [intl.teams[INTL_USER]?.name ?? "Your XI", new Date().getFullYear()]
          : (([n, y]) => [n, Number(y)] as const)(intl.userKey.split("|"));
        const record = {
          comp: intl.comp, nation: String(nation), year: Number(year),
          result: result as IntlRecord["result"],
          date: new Date().toISOString(),
        };
        // hidden emblems: only a drafted XI has a lineup to inspect (AI nations
        // don't). Detect before resetDraft clears the picks.
        let eggs: string[] = [];
        if (drafted) {
          const startedXI = get().getXI().filter(Boolean) as Player[];
          const captainName = startedXI.find((p) => p.id === get().captainId)?.name ?? null;
          eggs = detectEggs({ xi: startedXI, captainName, champion: intl.champion === intl.userKey }, profile.eggs ?? []);
        }
        if (eggs.length) play("unlock");
        set({
          profile: {
            ...profile,
            intlResults: [record, ...(profile.intlResults ?? [])].slice(0, 100),
            eggs: [...(profile.eggs ?? []), ...eggs],
          },
          lastEggs: eggs,
          intl: null,
        });
        // a drafted XI is single-use — lock it like the club mode
        if (drafted) get().resetDraft();
      },
    }),
    {
      name: "champions-draft-v1",
      version: 4,
      // v4 replaced the pre-baked draft order with position-first drafting.
      // Always keep the profile & match log; any in-flight draft from an older
      // shape is dropped (its structure no longer loads safely).
      migrate: (persisted, version) => {
        const p = persisted as Partial<StoreState> & { rounds?: unknown };
        const fresh = {
          setup: null, formation: null,
          picks: {} as Record<number, string>, placedSlots: [] as number[],
          targetSlot: null, spinSquadIndex: -1, spinNonce: 0, drawnSquads: [] as number[],
          captainId: null, draftComplete: false, rngSeed: null,
          tournament: null, rerolls: 0, intl: null,
        };
        return {
          profile: p.profile ?? emptyProfile(),
          matchLog: p.matchLog ?? [],
          ...(version < 4
            ? fresh
            : {
                setup: p.setup ?? null, formation: p.formation ?? null,
                picks: p.picks ?? {}, placedSlots: p.placedSlots ?? [],
                targetSlot: p.targetSlot ?? null,
                spinSquadIndex: p.spinSquadIndex ?? -1,
                spinNonce: p.spinNonce ?? 0, drawnSquads: p.drawnSquads ?? [],
                captainId: p.captainId ?? null,
                draftComplete: p.draftComplete ?? false,
                rngSeed: p.rngSeed ?? null, tournament: p.tournament ?? null,
                rerolls: p.rerolls ?? 0, intl: p.intl ?? null,
              }),
        };
      },
      // Persist the whole active game so a refresh never re-rolls or reloads
      // squads — you resume exactly where you left off.
      partialize: (s) => ({
        profile: s.profile,
        setup: s.setup,
        formation: s.formation,
        picks: s.picks,
        placedSlots: s.placedSlots,
        targetSlot: s.targetSlot,
        spinSquadIndex: s.spinSquadIndex,
        spinNonce: s.spinNonce,
        drawnSquads: s.drawnSquads,
        captainId: s.captainId,
        draftComplete: s.draftComplete,
        rngSeed: s.rngSeed,
        tournament: s.tournament,
        rerolls: s.rerolls,
        intl: s.intl,
        matchLog: s.matchLog,
      }),
      onRehydrateStorage: () => (state) => {
        state?.init();
      },
    },
  ),
);

// ---- match-history log helpers ----

let logSeq = 0;
function logEntry(
  comp: LoggedMatch["comp"], round: string, teams: Record<string, SimTeam>, result: import("./types").MatchResult,
): LoggedMatch {
  const ref = (t: SimTeam) => ({ name: t.name, short: t.short, colors: t.colors, season: t.season });
  return {
    id: `${Date.now()}-${logSeq++}`,
    date: new Date().toISOString(),
    comp,
    round,
    home: ref(teams[result.home]),
    away: ref(teams[result.away]),
    result,
  };
}

/** Newest first, capped so localStorage never bloats. */
function pushLog(log: LoggedMatch[], entries: LoggedMatch[]): LoggedMatch[] {
  if (!entries.length) return log;
  return [...entries.slice().reverse(), ...log].slice(0, 150);
}

function deepestUserRound(t: TournamentState): DraftRecord["result"] {
  const rounds = t.ties
    .filter((tie) => tie.teamA === USER_TEAM_ID || tie.teamB === USER_TEAM_ID)
    .map((tie) => tie.round);
  if (rounds.includes("Semi-final")) return "semi";
  if (rounds.includes("Quarter-final")) return "quarter";
  if (rounds.includes("Round of 16")) return "r16";
  if (rounds.includes("Play-off")) return "playoff";
  return "league";
}
