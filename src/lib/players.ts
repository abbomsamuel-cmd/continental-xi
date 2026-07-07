import type { Attributes, Player, Position, RawSquad } from "./types";
import { SQUADS_CLASSIC } from "./data/squads-classic";
import { SQUADS_MODERN } from "./data/squads-modern";
import { SQUADS_EXTRA } from "./data/squads-extra";
import { SQUAD_DEPTH } from "./data/squads-depth";
import { SQUAD_DEPTH_2 } from "./data/squads-depth2";
import { POSITION_GROUP } from "./formations";
import { hashString, mulberry32 } from "./rng";

export const SQUADS: RawSquad[] = [...SQUADS_CLASSIC, ...SQUADS_MODERN, ...SQUADS_EXTRA];

// Attribute profile per position: relative weight of each attribute vs overall.
const PROFILES: Record<string, [number, number, number, number, number, number]> = {
  // pace, shooting, passing, dribbling, defending, physical (delta vs overall)
  GK: [-25, -35, -18, -25, -30, -4],
  CB: [-10, -22, -8, -12, 2, 4],
  RB: [4, -16, -4, -4, -1, -2],
  LB: [4, -16, -4, -4, -1, -2],
  RWB: [6, -14, -3, -2, -4, -3],
  LWB: [6, -14, -3, -2, -4, -3],
  CDM: [-8, -12, 0, -5, -1, 3],
  CM: [-5, -8, 2, 0, -12, -3],
  CAM: [-3, -3, 3, 3, -25, -8],
  RM: [6, -8, 0, 2, -20, -8],
  LM: [6, -8, 0, 2, -20, -8],
  RW: [7, -4, -2, 4, -30, -10],
  LW: [7, -4, -2, 4, -30, -10],
  CF: [0, 2, -2, 2, -30, -6],
  ST: [2, 4, -8, -2, -34, -2],
};

const TRAIT_POOL: Record<string, string[]> = {
  GK: ["Sweeper Keeper", "Cat Reflexes", "Long Throw", "Command of Area"],
  DEF: ["Aerial Fortress", "Slide Tackle Master", "Bruiser", "Anticipate", "Long Ball Pass"],
  MID: ["Incisive Pass", "Tiki Taka", "Press Proven", "Long Shot Taker", "Relentless", "Pinged Pass"],
  ATT: ["Finesse Shot", "Power Shot", "Quick Step", "Trickster", "Poacher", "Chip Shot", "Rapid"],
};

const BODY_TYPES = ["Lean", "Average", "Stocky", "Tall & Lean", "Explosive"];

function clampAttr(v: number): number {
  return Math.max(30, Math.min(99, Math.round(v)));
}

function deriveAttributes(pos: Position, overall: number, seed: number): Attributes {
  const rng = mulberry32(seed);
  const p = PROFILES[pos];
  const jitter = () => (rng() - 0.5) * 8;
  return {
    pace: clampAttr(overall + p[0] + jitter()),
    shooting: clampAttr(overall + p[1] + jitter()),
    passing: clampAttr(overall + p[2] + jitter()),
    dribbling: clampAttr(overall + p[3] + jitter()),
    defending: clampAttr(overall + p[4] + jitter()),
    physical: clampAttr(overall + p[5] + jitter()),
  };
}

function seasonLabel(season: number): string {
  const start = season - 1;
  return `${start}-${String(season).slice(2)}`;
}

let cache: Player[] | null = null;

/** Expand every raw squad into full player objects. Deterministic across sessions. */
export function getAllPlayers(): Player[] {
  if (cache) return cache;
  const players: Player[] = [];
  for (const squad of SQUADS) {
    // merge in extra depth players, deduped by name (starters win)
    const key = `${squad.club}|${squad.season}`;
    const depth = [...(SQUAD_DEPTH[key] ?? []), ...(SQUAD_DEPTH_2[key] ?? [])];
    const seen = new Set<string>();
    const roster: typeof squad.players = [];
    for (const p of [...squad.players, ...depth]) {
      if (seen.has(p[0])) continue;
      seen.add(p[0]);
      roster.push(p);
    }
    for (const raw of roster) {
      const [name, nationality, position, overall, altPositions = [], stats = {}] = raw;
      const seed = hashString(`${name}|${squad.club}|${squad.season}`);
      const rng = mulberry32(seed + 7);
      const group = POSITION_GROUP[position];
      const traits: string[] = [];
      const pool = TRAIT_POOL[group];
      const nTraits = overall >= 90 ? 3 : overall >= 84 ? 2 : 1;
      while (traits.length < nTraits) {
        const t = pool[Math.floor(rng() * pool.length)];
        if (!traits.includes(t)) traits.push(t);
      }
      const wrAtt = group === "ATT" ? "High" : group === "MID" ? (rng() > 0.5 ? "High" : "Med") : "Med";
      const wrDef = group === "DEF" ? "High" : group === "MID" ? "Med" : rng() > 0.7 ? "Med" : "Low";
      players.push({
        id: `${squad.club}-${squad.season}-${name}`.replace(/\s+/g, "_"),
        name,
        nationality,
        position,
        altPositions,
        overall,
        attributes: deriveAttributes(position, overall, seed),
        club: squad.club,
        clubCountry: squad.country,
        league: squad.league,
        season: squad.season,
        seasonLabel: seasonLabel(squad.season),
        coach: squad.coach,
        stadium: squad.stadium,
        goals: stats.g ?? 0,
        assists: stats.a ?? 0,
        apps: 6 + Math.floor(rng() * 7),
        cleanSheets: position === "GK" ? stats.cs ?? Math.floor(rng() * 5) : undefined,
        traits,
        workRates: `${wrAtt}/${wrDef}`,
        skillMoves: position === "GK" ? 1 : Math.min(5, Math.max(2, Math.round((overall - 70) / 6) + (rng() > 0.5 ? 1 : 0))),
        weakFoot: Math.min(5, Math.max(2, 3 + Math.floor(rng() * 2))),
        foot: rng() > 0.24 ? "Right" : "Left",
        bodyType: BODY_TYPES[Math.floor(rng() * BODY_TYPES.length)],
        colors: squad.colors,
      });
    }
  }
  cache = players;
  return players;
}

export function getPlayer(id: string): Player | undefined {
  return getAllPlayers().find((p) => p.id === id);
}

export function squadPlayers(squadIndex: number): Player[] {
  const squad = SQUADS[squadIndex];
  const all = getAllPlayers();
  return all.filter((p) => p.club === squad.club && p.season === squad.season);
}

export const ERAS = [
  { label: "The Foundations", from: 1992, to: 1999 },
  { label: "Galácticos & Giants", from: 2000, to: 2008 },
  { label: "Tiki-Taka Wars", from: 2009, to: 2015 },
  { label: "Pressing Era", from: 2016, to: 2021 },
  { label: "New Format Age", from: 2022, to: 2026 },
];

export function eraOf(season: number): string {
  return ERAS.find((e) => season >= e.from && season <= e.to)?.label ?? "Unknown";
}
