"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clubById, pickStartingClub } from "./data";
import { computeMarketValue, roleFromTrust } from "./engine";
import { potentialCeiling } from "./develop";
import type {
  CareerCreationInput, CareerPlayer, CareerSave,
  PotentialTier, ReputationTier, RoleTier, SeasonResult, TransferOffer,
} from "./types";

/** How a season is closed out at the transfer window. */
export type CommitAction =
  | { type: "stay" }
  | { type: "renew" }
  | { type: "transfer"; offer: TransferOffer };

const TRUST_FOR_ROLE: Record<string, number> = {
  captain: 82, star: 78, important: 66, starter: 50, rotation: 38, reserve: 26, notSelected: 14,
};

/** The career world's "now". A season starting here reads as its campaign. */
export const WORLD_START_YEAR = 2026;

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const rand = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));

function rollPotential(): PotentialTier {
  const r = Math.random();
  if (r < 0.06) return "wonderkid";
  if (r < 0.22) return "elite";
  if (r < 0.55) return "promising";
  if (r < 0.8) return "raw";
  return "unknown";
}

/** Seed a brand-new 16–18 year old at an auto-assigned small/home club. */
function seedPlayer(input: CareerCreationInput): CareerPlayer {
  // The player never picks the club — a teenager breaks through at a small side.
  const club = pickStartingClub(input.nationality);
  const colors = club.colors;
  const tier = club.tier;
  const age = Math.max(16, Math.min(18, WORLD_START_YEAR - input.birthYear));

  const id = uid();
  const overall = rand(54, 63);
  const potentialTier = rollPotential();
  const reputation: ReputationTier = potentialTier === "wonderkid" ? "wonderkid" : "prospect";

  // Same value model the season engine uses, so year one never jumps oddly.
  const ceiling = potentialCeiling({ id, potentialTier } as CareerPlayer);
  const marketValue = computeMarketValue(overall, ceiling, age, reputation, 6.8);
  const wage = Math.round((1_000 + (overall - 50) * 300 + tier * 700) / 250) * 250;

  const trust = 26;
  const role: RoleTier = "reserve";

  return {
    id,
    name: input.name.trim() || "New Player",
    nationality: input.nationality,
    birthYear: input.birthYear,
    foot: input.foot,
    shirtNumber: input.shirtNumber,
    position: input.position,
    archetypeId: input.archetypeId,
    boyhoodClubId: club.id,
    age,
    overall,
    potentialTier,
    currentClubId: club.id,
    currentClubName: club.name,
    currentClubShort: club.short,
    currentClubColors: colors,
    currentClubCountry: club.country,
    marketValue,
    wage,
    contractUntil: WORLD_START_YEAR + 3,
    role,
    reputation,
    traits: [],
    currentYear: WORLD_START_YEAR,
    form: "average",
    trust,
    trainingFocus: null,
    seasonsAtClub: 0,
    peakOverall: overall,
    national: { calledUp: false, caps: 0, goals: 0, captain: false },
    retired: false,
    seasons: [],
    startYear: WORLD_START_YEAR,
  };
}

interface CareerState {
  saves: CareerSave[];
  currentId: string | null;
  createCareer: (input: CareerCreationInput) => string;
  deleteCareer: (id: string) => void;
  setCurrent: (id: string | null) => void;
  renameCareer: (id: string, name: string) => void;
  commitSeason: (result: SeasonResult, action: CommitAction) => void;
  retireCareer: (id: string) => void;
}

export const useCareer = create<CareerState>()(
  persist(
    (set) => ({
      saves: [],
      currentId: null,

      createCareer: (input) => {
        const now = Date.now();
        const save: CareerSave = { id: uid(), player: seedPlayer(input), createdAt: now, updatedAt: now };
        set((s) => ({ saves: [save, ...s.saves].slice(0, 12), currentId: save.id }));
        return save.id;
      },

      deleteCareer: (id) =>
        set((s) => {
          const saves = s.saves.filter((x) => x.id !== id);
          return { saves, currentId: s.currentId === id ? (saves[0]?.id ?? null) : s.currentId };
        }),

      setCurrent: (id) => set({ currentId: id }),

      renameCareer: (id, name) =>
        set((s) => ({
          saves: s.saves.map((x) =>
            x.id === id ? { ...x, player: { ...x.player, name: name.trim() || x.player.name }, updatedAt: Date.now() } : x,
          ),
        })),

      commitSeason: (result, action) =>
        set((s) => {
          const save = s.saves.find((x) => x.id === s.currentId);
          if (!save) return {};
          const p = save.player;
          let np: CareerPlayer = {
            ...p,
            overall: result.overallTo,
            peakOverall: Math.max(p.peakOverall, result.overallTo),
            form: result.form,
            trust: result.trust,
            role: result.role,
            reputation: result.reputation,
            marketValue: result.marketValueTo,
            age: p.age + 1,
            currentYear: p.currentYear + 1,
            seasonsAtClub: result.seasonsAtClub,
            national: result.national,
            traits: [...p.traits, ...result.traitUnlocks.filter((t) => !p.traits.includes(t))],
            position: result.positionChange ?? p.position,
            seasons: [...p.seasons, result.season],
          };
          if (action.type === "renew") {
            np.contractUntil = np.currentYear + 4;
            np.wage = Math.round((np.wage * 1.15) / 500) * 500;
          } else if (action.type === "transfer") {
            const cl = clubById(action.offer.clubId);
            if (cl) {
              const trust = TRUST_FOR_ROLE[action.offer.role] ?? 45;
              np = {
                ...np,
                currentClubId: cl.id, currentClubName: cl.name, currentClubShort: cl.short,
                currentClubColors: cl.colors, currentClubCountry: cl.country,
                wage: action.offer.wage, contractUntil: np.currentYear + action.offer.years,
                seasonsAtClub: 0, trust, role: roleFromTrust(trust),
              };
            }
          }
          return { saves: s.saves.map((x) => (x.id === save.id ? { ...x, player: np, updatedAt: Date.now() } : x)) };
        }),

      retireCareer: (id) =>
        set((s) => ({
          saves: s.saves.map((x) => (x.id === id ? { ...x, player: { ...x.player, retired: true }, updatedAt: Date.now() } : x)),
        })),
    }),
    {
      // Its OWN key — Career saves never touch the Tournament save.
      name: "continentalxi-career-v1",
      version: 2,
      partialize: (s) => ({ saves: s.saves, currentId: s.currentId }),
      // v2 added the living-career fields (form, trust, currentYear, national…).
      // Backfill them for any Part-1 save and drop the unplayed debut row.
      migrate: (persisted, version) => {
        const s = (persisted ?? {}) as { saves?: CareerSave[]; currentId?: string | null };
        if (version >= 2) return s as { saves: CareerSave[]; currentId: string | null };
        const saves = (s.saves ?? []).map((sv) => {
          const p = sv.player as unknown as Record<string, unknown>;
          const rawSeasons = (p.seasons as { apps?: number; goals?: number; assists?: number; overall?: number }[] | undefined) ?? [];
          const seasons = rawSeasons.filter((x) => (x.apps ?? 0) + (x.goals ?? 0) + (x.assists ?? 0) > 0);
          const overall = (p.overall as number) ?? 60;
          p.seasons = seasons;
          p.currentYear = ((p.startYear as number) ?? 2026) + seasons.length;
          p.form = p.form ?? "average";
          p.trust = p.trust ?? (TRUST_FOR_ROLE[(p.role as string) ?? "reserve"] ?? 30);
          p.trainingFocus = p.trainingFocus ?? null;
          p.seasonsAtClub = p.seasonsAtClub ?? seasons.length;
          p.peakOverall = p.peakOverall ?? Math.max(overall, ...seasons.map((x) => x.overall ?? 0), overall);
          p.national = p.national ?? { calledUp: false, caps: 0, goals: 0, captain: false };
          p.retired = p.retired ?? false;
          return { ...sv, player: p as unknown as CareerPlayer };
        });
        return { saves, currentId: s.currentId ?? null };
      },
    },
  ),
);

/** The active career's player, or null. */
export function useCurrentPlayer(): CareerPlayer | null {
  return useCareer((s) => s.saves.find((x) => x.id === s.currentId)?.player ?? null);
}

export function useCurrentSave(): CareerSave | null {
  return useCareer((s) => s.saves.find((x) => x.id === s.currentId) ?? null);
}
