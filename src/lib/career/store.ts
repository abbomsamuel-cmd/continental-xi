"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clubById } from "./data";
import type {
  CareerCreationInput, CareerPlayer, CareerSave, CareerSeason,
  PotentialTier, ReputationTier, RoleTier,
} from "./types";

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

/** Seed a brand-new 16–18 year old. No progression here — that is Part 2. */
function seedPlayer(input: CareerCreationInput): CareerPlayer {
  const club = clubById(input.clubId);
  const colors = (club?.colors ?? ["#2a3550", "#0d1428"]) as [string, string];
  const tier = club?.tier ?? 2;
  const age = Math.max(16, Math.min(18, WORLD_START_YEAR - input.birthYear));

  const overall = rand(55, 68);
  const potentialTier = rollPotential();

  // plausible teenager economics, scaled by ability and the club's stature
  const valueBase = Math.pow(overall - 48, 1.7) * (0.12 + tier * 0.06);
  const marketValue = Math.round((valueBase * 1_000_000) / 250_000) * 250_000;
  const wage = Math.round((3_000 + (overall - 55) * 900 + tier * 1_400) / 500) * 500;

  const role: RoleTier = overall >= 64 ? "rotation" : "reserve";
  const reputation: ReputationTier = potentialTier === "wonderkid" ? "wonderkid" : "prospect";

  const debut: CareerSeason = {
    year: WORLD_START_YEAR,
    age,
    clubId: input.clubId,
    clubName: club?.name ?? "Free Agent",
    clubShort: club?.short ?? "FA",
    clubColors: colors,
    clubCountry: club?.country ?? "—",
    overall,
    apps: 0, goals: 0, assists: 0,
    honours: [],
  };

  return {
    id: uid(),
    name: input.name.trim() || "New Player",
    nationality: input.nationality,
    birthYear: input.birthYear,
    foot: input.foot,
    shirtNumber: input.shirtNumber,
    position: input.position,
    archetypeId: input.archetypeId,
    boyhoodClubId: input.clubId,
    age,
    overall,
    potentialTier,
    currentClubId: input.clubId,
    currentClubName: club?.name ?? "Free Agent",
    currentClubShort: club?.short ?? "FA",
    currentClubColors: colors,
    currentClubCountry: club?.country ?? "—",
    marketValue,
    wage,
    contractUntil: WORLD_START_YEAR + 3,
    role,
    reputation,
    traits: [],
    seasons: [debut],
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
    }),
    {
      // Its OWN key — Career saves never touch the Tournament save.
      name: "continentalxi-career-v1",
      version: 1,
      partialize: (s) => ({ saves: s.saves, currentId: s.currentId }),
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
