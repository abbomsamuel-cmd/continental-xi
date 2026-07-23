import { positionById } from "./data";
import type { AttrDelta, CareerPlayer, TrainingFocus } from "./types";

/** Deterministic per-player hidden ceiling, from the (hidden) potential tier. */
function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

export function potentialCeiling(p: CareerPlayer): number {
  const base = { wonderkid: 93, elite: 89, promising: 84, raw: 80, unknown: 82 }[p.potentialTier];
  return Math.min(96, base + (hash(p.id) % 4));
}

/** How much a player still grows at a given age (negative = decline). */
function ageFactor(age: number): number {
  if (age <= 20) return 1.0;
  if (age <= 23) return 0.78;
  if (age <= 26) return 0.5;
  if (age <= 29) return 0.28;
  if (age <= 32) return 0.08;
  if (age <= 34) return -0.12;
  return -0.3;
}

const TRAIN_ATTR: Record<TrainingFocus, string> = {
  finishing: "Finishing", passing: "Passing", pace: "Pace", strength: "Strength",
  dribbling: "Dribbling", defending: "Defending", weakFoot: "Weak Foot",
  leadership: "Leadership", goalkeeping: "Goalkeeping",
};

/**
 * Season development — growth toward the hidden ceiling, scaled by age, how the
 * season actually went (avgRating), and playing time (trust). Slows after ~29,
 * declines in the mid-30s. Returns the overall move and a readable attribute
 * breakdown for the development report.
 */
export function developSeason(
  p: CareerPlayer, avgRating: number, trust: number,
): { overallFrom: number; overallTo: number; attrDeltas: AttrDelta[] } {
  const ceiling = potentialCeiling(p);
  const af = ageFactor(p.age);
  const perf = Math.max(0.25, Math.min(1.7, 0.5 + (avgRating - 6.6) * 0.55));
  const minutes = Math.max(0.3, Math.min(1.15, trust / 65));

  let overallDelta: number;
  if (af >= 0) {
    overallDelta = (ceiling - p.overall) * af * perf * minutes * 0.34;
    overallDelta = Math.max(0, Math.min(4, overallDelta));
  } else {
    // decline — worse form/less play accelerates it slightly
    overallDelta = af * (2 - perf * 0.6);
    overallDelta = Math.max(-3, Math.min(0, overallDelta));
  }
  const rounded = Math.round(overallDelta);
  const overallTo = Math.max(40, Math.min(99, p.overall + rounded));

  // spread the move across the position's key attributes (+ training focus)
  const attrs = [...positionById(p.position).attributes];
  const trained = p.trainingFocus ? TRAIN_ATTR[p.trainingFocus] : null;
  if (trained && !attrs.includes(trained)) attrs.unshift(trained);
  const deltas: AttrDelta[] = [];
  let remaining = rounded;
  attrs.slice(0, 4).forEach((label, i) => {
    let d = 0;
    if (remaining > 0) { d = i === 0 ? Math.ceil(remaining / 2) : Math.max(0, Math.round(remaining / 3)); }
    else if (remaining < 0) { d = i === 0 ? Math.floor(remaining / 2) : Math.max(-1, Math.round(remaining / 3)); }
    if (label === trained && d < 2 && rounded >= 0) d += 1; // training pays off
    remaining -= d;
    deltas.push({ label, delta: d });
  });
  return { overallFrom: p.overall, overallTo, attrDeltas: deltas };
}
