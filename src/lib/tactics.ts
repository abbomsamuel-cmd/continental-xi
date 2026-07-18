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

/** The attribute aggregates a tactic cares about, computed once per XI. */
interface SquadProfile { pas: number; dri: number; pac: number; phy: number; sho: number; dfn: number; gk: number; balance: number }

function squadProfile(formation: Formation, players: (Player | null)[]): SquadProfile | null {
  const filled: { p: Player; g: string }[] = [];
  players.forEach((p, i) => {
    if (p) filled.push({ p, g: POSITION_GROUP[formation.slots[i].pos] });
  });
  if (!filled.length) return null;
  const of = (g: string) => filled.filter((x) => x.g === g).map((x) => x.p);
  const all = filled.map((x) => x.p);
  return {
    pas: avg(all.filter((p) => p.position !== "GK").map((p) => p.attributes.passing)),
    dri: avg(of("MID").map((p) => p.attributes.dribbling)) || avg(all.map((p) => p.attributes.dribbling)),
    pac: avg([...of("ATT"), ...of("MID")].map((p) => p.attributes.pace)),
    phy: avg(all.map((p) => p.attributes.physical)),
    sho: avg(of("ATT").map((p) => p.attributes.shooting)) || 70,
    dfn: avg(of("DEF").map((p) => p.attributes.defending)) || 70,
    gk: avg(of("GK").map((p) => p.overall)) || 70,
    balance: 100 - Math.abs(of("ATT").length * 3 - of("DEF").length * 2.5),
  };
}

function fitFromProfile(tactic: TacticId, A: SquadProfile): number {
  switch (tactic) {
    case "possession": return toRating(A.pas * 0.6 + A.dri * 0.4);
    case "gegenpress": return toRating(A.pac * 0.45 + A.phy * 0.35 + A.pas * 0.2);
    case "counter": return toRating(A.pac * 0.5 + A.dfn * 0.3 + A.sho * 0.2);
    case "balanced": return Math.round(clamp(72 + (A.balance - 80) * 0.15 + (A.pas - 78) * 0.4, 68, 88));
    case "defensive": return toRating(A.dfn * 0.5 + A.gk * 0.25 + A.phy * 0.25);
    case "direct": return toRating(A.phy * 0.4 + A.sho * 0.3 + A.pas * 0.3);
  }
}

/** How well this XI suits each tactical style (0–100 rating scale). */
export function tacticFit(tactic: TacticId, formation: Formation, players: (Player | null)[]): number {
  const A = squadProfile(formation, players);
  return A ? fitFromProfile(tactic, A) : 70;
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

/* ------------------------------------------------------------------ */
/*  Style-vs-style matchup — a rock/paper/scissors layer, bounded to  */
/*  ±5% of expected goals. A tactic that counters the opponent's      */
/*  shape reads the tie better: it creates a little more and concedes  */
/*  a little less. Never decisive alone, but it rewards picking the    */
/*  right approach for the opponent in front of you.                   */
/* ------------------------------------------------------------------ */

// EDGES[a][b] > 0 ⇒ style `a` has the upper hand over style `b`. The
// reverse pairing is the negation (computed in matchupEdge), so each
// rivalry is written exactly once and the table can never contradict itself.
const EDGES: Partial<Record<TacticId, Partial<Record<TacticId, number>>>> = {
  possession: { defensive: 0.8, direct: 0.6 },  // patient control unpicks a block, keeps it from a long-ball side
  gegenpress: { possession: 0.8, defensive: 0.5 }, // the press punishes slow build-up and a passive block
  counter: { possession: 1.0, gegenpress: 0.8 }, // fast breaks are lethal against high, committed lines
  defensive: { counter: 1.0 },                   // a low block gives the counter nothing to run into
  direct: { gegenpress: 1.0, defensive: 0.6, counter: 0.4 }, // going long bypasses the press and tests a block in the air
};

/** −1..1 edge of `mine` over `opp`. 0 if either is missing, equal, or Balanced. */
export function matchupEdge(mine?: TacticId | null, opp?: TacticId | null): number {
  if (!mine || !opp || mine === opp) return 0;
  const fwd = EDGES[mine]?.[opp];
  if (fwd !== undefined) return fwd;
  const rev = EDGES[opp]?.[mine];
  if (rev !== undefined) return -rev;
  return 0;
}

/** The expected-goals multiplier the matchup applies to the home side (±5%). */
export function matchupAttackMult(mine?: TacticId | null, opp?: TacticId | null): number {
  return 1 + matchupEdge(mine, opp) * 0.05;
}

/* ---- readable interpretation of a Tactical Fit score ---- */
export type FitBand = "Excellent" | "Strong" | "Functional" | "Weak" | "Poor";
export function tacticFitBand(fit: number): { band: FitBand; color: string; note: string } {
  if (fit >= 90) return { band: "Excellent", color: "#2ee6a6", note: "This XI is tailor-made for it." };
  if (fit >= 80) return { band: "Strong", color: "#7ee081", note: "A natural fit for these players." };
  if (fit >= 70) return { band: "Functional", color: "#f2d472", note: "Workable, with a few rough edges." };
  if (fit >= 60) return { band: "Weak", color: "#f5a15a", note: "The squad profile doesn't quite suit it." };
  return { band: "Poor", color: "#ff6b6b", note: "A poor match for this XI's strengths." };
}

/** 1–3 short, honest reasons this XI does (or doesn't) suit the style. */
export function tacticFitReasons(tactic: TacticId, formation: Formation, players: (Player | null)[]): string[] {
  const A = squadProfile(formation, players);
  if (!A) return [];
  const hi = (v: number) => v >= 82, lo = (v: number) => v < 74;
  const out: string[] = [];
  const push = (good: boolean, gtxt: string, btxt: string) => out.push((good ? "＋ " : "－ ") + (good ? gtxt : btxt));
  switch (tactic) {
    case "possession":
      if (hi(A.pas) || lo(A.pas)) push(!lo(A.pas), "Sharp passing range makes control natural", "Limited passing undercuts patient build-up");
      if (hi(A.dri) || lo(A.dri)) push(!lo(A.dri), "Dribblers to unlock a set defence", "Few ball-carriers to break lines");
      break;
    case "gegenpress":
      if (hi(A.pac) || lo(A.pac)) push(!lo(A.pac), "Pace to win the ball high and hurt them", "Not enough pace to sustain the press");
      if (hi(A.phy) || lo(A.phy)) push(!lo(A.phy), "Physicality to press for 90 minutes", "Legs may fade in a pressing game");
      break;
    case "counter":
      if (hi(A.pac) || lo(A.pac)) push(!lo(A.pac), "Blistering pace to punish on the break", "Short of the pace transitions demand");
      if (hi(A.dfn) || lo(A.dfn)) push(!lo(A.dfn), "A defensive base to spring from", "The defensive block is a worry");
      break;
    case "balanced":
      push(!lo(A.pas), "A rounded XI that adapts to any tie", "A rounded XI, no single defining edge");
      break;
    case "defensive":
      if (hi(A.dfn) || lo(A.dfn)) push(!lo(A.dfn), "Defenders to marshal a stubborn low block", "The back line lacks defensive steel");
      if (hi(A.gk) || lo(A.gk)) push(!lo(A.gk), "A goalkeeper to keep it tight", "Goalkeeping won't bail out a siege");
      break;
    case "direct":
      if (hi(A.phy) || lo(A.phy)) push(!lo(A.phy), "Power to win the first and second ball", "Lacks the physique direct play needs");
      if (hi(A.sho) || lo(A.sho)) push(!lo(A.sho), "Finishers to convert early service", "Forwards may waste the early service");
      break;
  }
  return out.slice(0, 3);
}

/** Which styles this one beats / struggles against, by name. */
export function tacticMatchupSummary(tactic: TacticId): { beats: string[]; loses: string[] } {
  const beats: string[] = [], loses: string[] = [];
  for (const other of TACTICS) {
    if (other.id === tactic) continue;
    const e = matchupEdge(tactic, other.id);
    if (e >= 0.5) beats.push(other.name);
    else if (e <= -0.5) loses.push(other.name);
  }
  return { beats, loses };
}

/* ---- deterministic AI opponent styles (no rng needed via hash01) ---- */

/** Stable 0..1 hash of a string, so AI tactics are deterministic per team. */
export function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}

/** Give an AI side a believable style from its attack/defense lean. `r` is a 0..1 selector. */
export function pickAiTactic(attack: number, defense: number, r: number): TacticId {
  const bal = attack - defense;
  if (bal > 4) return r < 0.4 ? "gegenpress" : r < 0.7 ? "possession" : "direct";
  if (bal < -4) return r < 0.45 ? "defensive" : r < 0.8 ? "counter" : "balanced";
  return r < 0.25 ? "possession" : r < 0.45 ? "balanced" : r < 0.65 ? "counter" : r < 0.85 ? "gegenpress" : "direct";
}
