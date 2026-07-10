"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  DraftRecord, Fixture, Formation, GameMode, IntlRecord, KOTie, LoggedMatch, Player, Profile,
  SimTeam, TeamAnalysis, TournamentState,
} from "./types";
import { getFormation, positionFit, canPlaySlot } from "./formations";
import { getPool, getPoolPlayers, poolSquadPlayers, type DraftPool } from "./players";
import { pickDraftSquad, draftOrder } from "./draft";
import { analyzeTeam } from "./analysis";
import { computeChemistry } from "./chemistry";
import { randomRng, seededRng, type Rng } from "./rng";
import {
  createTournament, playMatchday, playKnockoutStage, computeTable, USER_TEAM_ID,
} from "./engine/tournament";
import {
  createIntl, createIntlDraft, playIntlMatchday, playIntlRound, INTL_USER,
  type IntlComp, type IntlState,
} from "./engine/international";
import { checkAchievements } from "./achievements";
import { play, setSoundEnabled } from "./sound";

export interface DraftRound {
  index: number; // 0-based order in the draft
  slotIndex: number; // formation slot this round fills
  squadIndex: number; // offered squad
  chosenPlayerId?: string;
}

export type Difficulty = "easy" | "medium" | "hard";

interface DraftSetup {
  mode: GameMode;
  formationName: string;
  difficulty: Difficulty;
  daily?: string;
  /** squad pool this draft draws from — club history or a national tournament */
  pool: DraftPool;
}

const REROLLS_FOR: Record<Difficulty, number> = {
  easy: 3,
  medium: 1,
  hard: 0,
};

interface StoreState {
  hydrated: boolean;
  profile: Profile;

  // active draft
  setup: DraftSetup | null;
  formation: Formation | null;
  rounds: DraftRound[];
  currentRound: number;
  picks: Record<number, string>; // slotIndex -> playerId
  draftComplete: boolean;
  lastUnlocked: string[];
  rngSeed: string | null;
  rerolls: number;
  rerollNonce: number;

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
  choosePlayer: (playerId: string) => void;
  reroll: () => void;
  swapSlots: (a: number, b: number) => boolean;
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
});

function buildRounds(rng: Rng, formation: Formation): DraftRound[] {
  const order = draftOrder(rng, formation.slots.map((s) => s.pos));
  return order.map((slotIndex, index) => ({ index, slotIndex, squadIndex: -1 }));
}

function assignSquadForRound(
  rng: Rng, formation: Formation, rounds: DraftRound[], roundIdx: number, usedSquads: number[],
  pool: DraftPool,
): number {
  const squads = getPool(pool);
  const slotIndex = rounds[roundIdx].slotIndex;
  const pos = formation.slots[slotIndex].pos;
  const recentSquads = rounds.slice(Math.max(0, roundIdx - 4), roundIdx).map((r) => r.squadIndex).filter((i) => i >= 0);
  const recentClubs = recentSquads.map((i) => squads[i].club);
  const recentLeagues = recentSquads.map((i) => squads[i].league);
  const lastClub = recentClubs[recentClubs.length - 1] ?? null;
  return pickDraftSquad(rng, pos, usedSquads, lastClub, recentClubs, recentLeagues, pool);
}

export const useGame = create<StoreState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      profile: emptyProfile(),
      setup: null,
      formation: null,
      rounds: [],
      currentRound: 0,
      picks: {},
      draftComplete: false,
      lastUnlocked: [],
      rngSeed: null,
      rerolls: 0,
      rerollNonce: 0,
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
        const rng = daily ? seededRng(daily) : randomRng();
        const rounds = buildRounds(rng, formation);
        // pre-assign the first squad
        rounds[0].squadIndex = assignSquadForRound(rng, formation, rounds, 0, [], pool);
        set({
          setup: { mode, formationName, difficulty, daily, pool },
          formation,
          rounds,
          currentRound: 0,
          picks: {},
          draftComplete: false,
          tournament: null,
          rngSeed: seed,
          lastUnlocked: [],
          rerolls: REROLLS_FOR[difficulty],
          rerollNonce: 0,
        });
      },

      // Single re-roll: draws a genuinely different team for this round.
      reroll: () => {
        const { rounds, currentRound, formation, rngSeed, rerolls, rerollNonce, setup } = get();
        if (!formation || !rngSeed || rerolls <= 0) return;
        const pool = setup?.pool ?? "clubs";
        const squads = getPool(pool);
        const round = rounds[currentRound];
        const pos = formation.slots[round.slotIndex].pos;
        const usedSquads = rounds.slice(0, currentRound).map((r) => r.squadIndex).filter((i) => i >= 0);
        const currentClub = squads[round.squadIndex].club;
        const recent = rounds.slice(Math.max(0, currentRound - 4), currentRound).map((r) => r.squadIndex).filter((i) => i >= 0);
        const rng = seededRng(`${rngSeed}-rr-${currentRound}-${rerolls}-${Math.random()}`);
        const newIdx = pickDraftSquad(
          rng, pos, [...usedSquads, round.squadIndex], currentClub,
          recent.map((i) => squads[i].club), recent.map((i) => squads[i].league),
          pool,
        );
        const next = [...rounds];
        next[currentRound] = { ...round, squadIndex: newIdx };
        play("flip");
        set({ rounds: next, rerolls: rerolls - 1, rerollNonce: rerollNonce + 1 });
      },

      // Swap the players in two formation slots — only if each can legally play
      // the other's position. Returns true if the swap happened.
      swapSlots: (a, b) => {
        const { formation, picks, setup } = get();
        if (!formation || a === b) return false;
        const players = getPoolPlayers(setup?.pool ?? "clubs");
        const idA = picks[a];
        const idB = picks[b];
        const pA = idA ? players.find((p) => p.id === idA) : null;
        const pB = idB ? players.find((p) => p.id === idB) : null;
        const slotA = formation.slots[a].pos;
        const slotB = formation.slots[b].pos;
        // each moved player must be eligible for its new slot
        if (pA && !canPlaySlot(pA.position, pA.altPositions, slotB)) return false;
        if (pB && !canPlaySlot(pB.position, pB.altPositions, slotA)) return false;
        const next = { ...picks };
        if (idB) next[a] = idB; else delete next[a];
        if (idA) next[b] = idA; else delete next[b];
        play("click");
        set({ picks: next });
        return true;
      },

      choosePlayer: (playerId) => {
        const { rounds, currentRound, formation, picks, rngSeed, setup } = get();
        if (!formation || !rngSeed) return;
        const round = rounds[currentRound];
        const newPicks = { ...picks, [round.slotIndex]: playerId };
        const usedSquads = rounds.slice(0, currentRound + 1).map((r) => r.squadIndex).filter((i) => i >= 0);
        const nextRounds = [...rounds];

        const isLast = currentRound + 1 >= rounds.length;
        if (!isLast) {
          const rng = seededRng(`${rngSeed}-r${currentRound + 1}`);
          nextRounds[currentRound + 1].squadIndex = assignSquadForRound(
            rng, formation, nextRounds, currentRound + 1, usedSquads, setup?.pool ?? "clubs",
          );
        }
        play("select");
        set({
          picks: newPicks,
          rounds: nextRounds,
          currentRound: isLast ? currentRound : currentRound + 1,
          draftComplete: isLast,
        });
      },

      getOfferedPlayers: () => {
        const { rounds, currentRound, formation, picks, setup } = get();
        if (!formation) return [];
        const pool = setup?.pool ?? "clubs";
        const round = rounds[currentRound];
        if (!round || round.squadIndex < 0) return [];
        const pos = formation.slots[round.slotIndex].pos;
        const chosenIds = new Set(Object.values(picks));
        const chosenNames = new Set(
          Object.values(picks).map((id) => getPoolPlayers(pool).find((p) => p.id === id)?.name),
        );
        // Only players who can genuinely fill this slot (football-correct: a
        // winger can't be offered at CM, etc.), naturals first, up to 9.
        const roster = poolSquadPlayers(pool, round.squadIndex)
          .filter((p) => !chosenIds.has(p.id) && !chosenNames.has(p.name))
          .filter((p) => canPlaySlot(p.position, p.altPositions, pos))
          .map((p) => ({ p, fit: positionFit(p.position, p.altPositions, pos) }));
        return roster
          .sort((a, b) => b.fit - a.fit || b.p.overall - a.p.overall)
          .slice(0, 9)
          .map((x) => x.p);
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
        const { formation } = get();
        if (!formation) return null;
        return analyzeTeam(formation, get().getXI());
      },

      finishDraftIntoTournament: (teamName) => {
        const { formation, setup } = get();
        if (!formation) return;
        const xi = get().getXI();
        const analysis = analyzeTeam(formation, xi);
        const seed = `${get().rngSeed}-tourney`;
        const rng = seededRng(seed);
        const firstPlayer = xi.find(Boolean);
        const colors = firstPlayer?.colors ?? (["#D4AF37", "#061A40"] as [string, string]);
        const name = teamName || get().profile.name;
        play("whistle");
        const pool = setup?.pool ?? "clubs";
        if (pool === "euro" || pool === "copa") {
          // drafted XI of international legends enters its own tournament
          set({ intl: createIntlDraft(rng, pool, name, colors, analysis) });
          return;
        }
        set({ tournament: createTournament(rng, name, analysis, colors) });
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
        if (tournament.phase === "done") {
          play(tournament.champion === USER_TEAM_ID ? "trophy" : "lose");
        }
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
        const analysis = analyzeTeam(formation, xi);
        const chem = computeChemistry(formation, xi);
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
          chemistry: analysis.chemistry,
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
          partnerships: chem.partnerships.length,
          playersOver92,
          topOfLeague: userPos === 1,
          lostAKnockout,
          isDaily: !!setup.daily,
        });
        if (unlocked.length) play("win");
        set({
          profile: { ...provisional, achievements: [...provisional.achievements, ...unlocked] },
          lastUnlocked: unlocked,
        });
      },

      resetDraft: () => set({
        setup: null, formation: null, rounds: [], currentRound: 0, picks: {},
        draftComplete: false, tournament: null, rngSeed: null, lastUnlocked: [],
        rerolls: 0, rerollNonce: 0,
      }),

      clearUnlocked: () => set({ lastUnlocked: [] }),

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
        if (intl.phase === "done") {
          play(intl.champion === intl.userKey ? "trophy" : "lose");
        }
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
        set({
          profile: { ...profile, intlResults: [record, ...(profile.intlResults ?? [])].slice(0, 100) },
          intl: null,
        });
        // a drafted XI is single-use — lock it like the club mode
        if (drafted) get().resetDraft();
      },
    }),
    {
      name: "champions-draft-v1",
      version: 3,
      // v3 reworked knockout ties to cover the whole field — keep the profile,
      // drop any in-flight game saved under the old shape.
      migrate: (persisted, version) => {
        const p = persisted as Partial<StoreState>;
        const fresh = {
          setup: null, formation: null, rounds: [] as DraftRound[], currentRound: 0,
          picks: {} as Record<number, string>, draftComplete: false, rngSeed: null,
          tournament: null, rerolls: 0, intl: null,
        };
        if (version < 3) return { profile: p.profile ?? emptyProfile(), ...fresh };
        return {
          profile: p.profile ?? emptyProfile(),
          setup: p.setup ?? null, formation: p.formation ?? null,
          rounds: p.rounds ?? [], currentRound: p.currentRound ?? 0,
          picks: p.picks ?? {}, draftComplete: p.draftComplete ?? false,
          rngSeed: p.rngSeed ?? null, tournament: p.tournament ?? null,
          rerolls: p.rerolls ?? 0, intl: p.intl ?? null,
        };
      },
      // Persist the whole active game so a refresh never re-rolls or reloads
      // squads — you resume exactly where you left off.
      partialize: (s) => ({
        profile: s.profile,
        setup: s.setup,
        formation: s.formation,
        rounds: s.rounds,
        currentRound: s.currentRound,
        picks: s.picks,
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
