import type { Formation, Player } from "./types";
import { POSITION_GROUP } from "./formations";

/**
 * Tactical styles — chosen before every tournament. Each style scores how
 * well the current XI suits it (0–100 rating scale) and nudges the match
 * engine realistically: small, explainable, never game-breaking.
 */

export type TacticId = "possession" | "gegenpress" | "counter" | "balanced" | "defensive" | "direct";

export interface Tactic {
  id: TacticId;
  name: string;
  icon: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  bestFor: string;
  /** tiny formation-diagram hint rendered as three row-widths (DEF/MID/ATT emphasis 0-2) */
  shape: [number, number, number];
}

export const TACTICS: Tactic[] = [
  {
    id: "possession", name: "Possession", icon: "🎼",
    description: "Control the ball, starve the opponent, and probe until the opening appears.",
    strengths: ["Territorial control", "Fewer chances conceded"],
    weaknesses: ["Vulnerable to fast breaks", "Needs technical players"],
    bestFor: "Passing, dribbling, intelligent midfielders and ball-playing defenders.",
    shape: [1, 2, 1],
  },
  {
    id: "gegenpress", name: "Gegenpress", icon: "⚡",
    description: "Win the ball back within seconds of losing it, high up the pitch.",
    strengths: ["Chances from turnovers", "Suffocates weak defences"],
    weaknesses: ["Exhausting", "Space in behind when beaten"],
    bestFor: "Pace, stamina, work rate, pressing forwards and athletic midfielders.",
    shape: [1, 2, 2],
  },
  {
    id: "counter", name: "Counter Attack", icon: "🗡️",
    description: "Absorb pressure, then strike with speed the moment the ball turns over.",
    strengths: ["Deadly transitions", "Solid defensive block"],
    weaknesses: ["Less control", "Struggles against deep blocks"],
    bestFor: "Speed, direct passing, defensive structure and clinical forwards.",
    shape: [2, 1, 2],
  },
  {
    id: "balanced", name: "Balanced", icon: "⚖️",
    description: "No extremes — adapt to the match in front of you.",
    strengths: ["Works with any squad", "No obvious weakness"],
    weaknesses: ["No special edge either"],
    bestFor: "Squads without a single defining identity.",
    shape: [1, 1, 1],
  },
  {
    id: "defensive", name: "Defensive", icon: "🛡️",
    description: "A low block, disciplined lines, and clean sheets as the foundation.",
    strengths: ["Very hard to break down", "Wins tight knockout ties"],
    weaknesses: ["Few chances created", "Invites pressure"],
    bestFor: "Defenders, defensive midfielders, goalkeeper quality and physicality.",
    shape: [2, 1, 0],
  },
  {
    id: "direct", name: "Direct Football", icon: "🎯",
    description: "Get it forward early — crosses, long balls and second-ball dominance.",
    strengths: ["Aerial threat", "Bypasses the press"],
    weaknesses: ["Cheap ball losses", "Predictable when read"],
    bestFor: "Physical forwards, crossing, long passing and powerful midfielders.",
    shape: [1, 1, 2],
  },
];

export const tacticById = (id: string | undefined | null): Tactic | undefined =>
  TACTICS.find((t) => t.id === id);

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const avg = (n: number[]) => (n.length ? n.reduce((s, x) => s + x, 0) / n.length : 0);
const toRating = (metric: number) => Math.round(clamp(48 + (metric - 76) * 1.9, 45, 99));

/** How well this XI suits each tactical style (0–100 rating scale). */
export function tacticFit(tactic: TacticId, formation: Formation, players: (Player | null)[]): number {
  const filled: { p: Player; g: string }[] = [];
  players.forEach((p, i) => {
    if (p) filled.push({ p, g: POSITION_GROUP[formation.slots[i].pos] });
  });
  if (!filled.length) return 70;
  const of = (g: string) => filled.filter((x) => x.g === g).map((x) => x.p);
  const all = filled.map((x) => x.p);
  const A = {
    pas: avg(all.filter((p) => p.position !== "GK").map((p) => p.attributes.passing)),
    dri: avg(of("MID").map((p) => p.attributes.dribbling)) || avg(all.map((p) => p.attributes.dribbling)),
    pac: avg([...of("ATT"), ...of("MID")].map((p) => p.attributes.pace)),
    phy: avg(all.map((p) => p.attributes.physical)),
    sho: avg(of("ATT").map((p) => p.attributes.shooting)) || 70,
    dfn: avg(of("DEF").map((p) => p.attributes.defending)) || 70,
    gk: avg(of("GK").map((p) => p.overall)) || 70,
    balance: 100 - Math.abs(of("ATT").length * 3 - of("DEF").length * 2.5),
  };
  switch (tactic) {
    case "possession": return toRating(A.pas * 0.6 + A.dri * 0.4);
    case "gegenpress": return toRating(A.pac * 0.45 + A.phy * 0.35 + A.pas * 0.2);
    case "counter": return toRating(A.pac * 0.5 + A.dfn * 0.3 + A.sho * 0.2);
    case "balanced": return Math.round(clamp(72 + (A.balance - 80) * 0.15 + (A.pas - 78) * 0.4, 68, 88));
    case "defensive": return toRating(A.dfn * 0.5 + A.gk * 0.25 + A.phy * 0.25);
    case "direct": return toRating(A.phy * 0.4 + A.sho * 0.3 + A.pas * 0.3);
  }
}

/**
 * Engine nudge for the chosen style: a fraction of a rating point per side of
 * the ball, scaled by how well the XI suits the style. Max ±2.5 — real, never
 * absurd.
 */
export function tacticEngineAdjust(tactic: TacticId | undefined | null, fit: number): { attack: number; defense: number } {
  if (!tactic) return { attack: 0, defense: 0 };
  const b = clamp((fit - 70) / 9, -2, 2.5); // suitability-scaled base bonus
  switch (tactic) {
    case "possession": return { attack: b * 0.55, defense: b * 0.55 };
    case "gegenpress": return { attack: b * 0.95, defense: b * 0.35 - 0.4 };
    case "counter": return { attack: b * 0.5, defense: b * 0.8 };
    case "balanced": return { attack: b * 0.45, defense: b * 0.45 };
    case "defensive": return { attack: -0.7, defense: b * 1.1 + 0.3 };
    case "direct": return { attack: b * 0.8, defense: b * 0.2 };
  }
}
