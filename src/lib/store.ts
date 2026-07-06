"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  DraftRecord, Fixture, Formation, GameMode, KOTie, Player, Profile,
  TeamAnalysis, TournamentState,
} from "./types";
import { getFormation, POSITION_GROUP, positionFit } from "./formations";
import { getAllPlayers, squadPlayers } from "./players";
import { pickDraftSquad, draftOrder } from "./draft";
import { analyzeTeam } from "./analysis";
import { computeChemistry } from "./chemistry";
import { randomRng, seededRng, type Rng } from "./rng";
import {
  createTournament, playMatchday, playKnockoutStage, computeTable, USER_TEAM_ID,
} from "./engine/tournament";
import { checkAchievements } from "./achievements";
import { play, setSoundEnabled } from "./sound";

export interface DraftRound {
  index: number; // 0-based order in the draft
  slotIndex: number; // formation slot this round fills
  squadIndex: number; // offered squad
  chosenPlayerId?: string;
}

interface DraftSetup {
  mode: GameMode;
  formationName: string;
  daily?: string;
}

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

  // tournament
  tournament: TournamentState | null;

  // actions
  init: () => void;
  setProfileName: (name: string) => void;
  toggleSound: () => void;
  startDraft: (mode: GameMode, formationName: string, daily?: string) => void;
  choosePlayer: (playerId: string) => void;
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
): number {
  const slotIndex = rounds[roundIdx].slotIndex;
  const pos = formation.slots[slotIndex].pos;
  const recentSquads = rounds.slice(Math.max(0, roundIdx - 4), roundIdx).map((r) => r.squadIndex).filter((i) => i >= 0);
  const recentClubs = recentSquads.map((i) => SQUAD_META[i].club);
  const recentLeagues = recentSquads.map((i) => SQUAD_META[i].league);
  const lastClub = recentClubs[recentClubs.length - 1] ?? null;
  return pickDraftSquad(rng, pos, usedSquads, lastClub, recentClubs, recentLeagues);
}

// lightweight squad meta cache to avoid importing full SQUADS repeatedly
import { SQUADS } from "./players";
const SQUAD_META = SQUADS.map((s) => ({ club: s.club, league: s.league, season: s.season }));

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
      tournament: null,

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

      startDraft: (mode, formationName, daily) => {
        const formation = getFormation(formationName);
        const seed = daily ?? `draft-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
        const rng = daily ? seededRng(daily) : randomRng();
        const rounds = buildRounds(rng, formation);
        // pre-assign the first squad
        rounds[0].squadIndex = assignSquadForRound(rng, formation, rounds, 0, []);
        set({
          setup: { mode, formationName, daily },
          formation,
          rounds,
          currentRound: 0,
          picks: {},
          draftComplete: false,
          tournament: null,
          rngSeed: seed,
          lastUnlocked: [],
        });
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
            rng, formation, nextRounds, currentRound + 1, usedSquads,
          );
        }
        play("select");
        set({
          picks: newPicks,
          rounds: nextRounds,
          currentRound: isLast ? currentRound : currentRound + 1,
          draftComplete: isLast,
        });
        void setup;
      },

      getOfferedPlayers: () => {
        const { rounds, currentRound, formation, picks } = get();
        if (!formation) return [];
        const round = rounds[currentRound];
        if (!round || round.squadIndex < 0) return [];
        const pos = formation.slots[round.slotIndex].pos;
        const chosenIds = new Set(Object.values(picks));
        const chosenNames = new Set(
          Object.values(picks).map((id) => getAllPlayers().find((p) => p.id === id)?.name),
        );
        const roster = squadPlayers(round.squadIndex).filter(
          (p) => !chosenIds.has(p.id) && !chosenNames.has(p.name),
        );
        // rank by fit then overall, offer the 5 best sensible options
        return roster
          .map((p) => ({ p, fit: positionFit(p.position, p.altPositions, pos), grp: POSITION_GROUP[p.position] === POSITION_GROUP[pos] }))
          .sort((a, b) => b.fit - a.fit || b.p.overall - a.p.overall)
          .slice(0, 5)
          .map((x) => x.p);
      },

      getXI: () => {
        const { formation, picks } = get();
        if (!formation) return [];
        return formation.slots.map((_, i) => {
          const id = picks[i];
          return id ? getAllPlayers().find((p) => p.id === id) ?? null : null;
        });
      },

      getAnalysis: () => {
        const { formation } = get();
        if (!formation) return null;
        return analyzeTeam(formation, get().getXI());
      },

      finishDraftIntoTournament: (teamName) => {
        const { formation } = get();
        if (!formation) return;
        const xi = get().getXI();
        const analysis = analyzeTeam(formation, xi);
        const seed = `${get().rngSeed}-tourney`;
        const rng = seededRng(seed);
        const firstPlayer = xi.find(Boolean);
        const colors = firstPlayer?.colors ?? (["#D4AF37", "#061A40"] as [string, string]);
        const tournament = createTournament(rng, teamName || get().profile.name, analysis, colors);
        play("whistle");
        set({ tournament });
      },

      advanceLeague: () => {
        const { tournament, rngSeed } = get();
        if (!tournament || !rngSeed) return [];
        const rng = seededRng(`${rngSeed}-md${tournament.matchday}-${Math.random()}`);
        const players = get().getXI().filter(Boolean) as Player[];
        const played = playMatchday(rng, tournament, players);
        set({ tournament: { ...tournament } });
        return played;
      },

      advanceKnockout: () => {
        const { tournament, rngSeed } = get();
        if (!tournament || !rngSeed) return [];
        const rng = seededRng(`${rngSeed}-ko-${tournament.phase}-${Math.random()}`);
        const players = get().getXI().filter(Boolean) as Player[];
        const ties = playKnockoutStage(rng, tournament, players);
        if (tournament.phase === "done") {
          play(tournament.champion === USER_TEAM_ID ? "trophy" : "lose");
        }
        set({ tournament: { ...tournament } });
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

        let result: DraftRecord["result"] = "league";
        if (champion) result = "champion";
        else if (!tournament.userAlive) {
          const phase = tournament.phase;
          result = phase === "final" || tournament.ties.some((t) => t.round === "Final" && (t.teamA === USER_TEAM_ID || t.teamB === USER_TEAM_ID))
            ? "final"
            : deepestUserRound(tournament);
        }

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
      }),

      clearUnlocked: () => set({ lastUnlocked: [] }),
    }),
    {
      name: "champions-draft-v1",
      partialize: (s) => ({ profile: s.profile }),
      onRehydrateStorage: () => (state) => {
        state?.init();
      },
    },
  ),
);

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
