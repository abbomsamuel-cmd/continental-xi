import type { Formation, Player, TeamAnalysis } from "./types";
import { POSITION_GROUP } from "./formations";
import { suitability } from "./suitability";
import { tacticFit, type TacticId } from "./tactics";

const round = (v: number) => Math.round(v);

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;
}

/**
 * Full team analysis for a completed (or partial) XI. No chemistry anywhere —
 * the Base Squad OVR is built from understandable, tactic-INDEPENDENT football
 * components (a tactic never inflates it):
 *
 *   90%  average effective player rating (position suitability applied)
 *    6%  position suitability of the whole XI
 *    4%  experience & leadership
 *
 * Tactical Fit is computed separately (breakdown.tacticFit) and reported on its
 * own 0-100 scale — it shapes how the team plays, not how good the XI is.
 */
export function analyzeTeam(formation: Formation, players: (Player | null)[], tactic?: TacticId | null): TeamAnalysis {
  const filled = players
    .map((p, i) => ({ p, slot: formation.slots[i], i }))
    .filter((x): x is { p: Player; slot: (typeof formation.slots)[number]; i: number } => x.p !== null);

  const suitOf = (x: { p: Player; slot: { pos: Player["position"] } }) =>
    suitability(x.p.position, x.p.altPositions, x.slot.pos);
  const effOverall = (x: { p: Player; slot: { pos: Player["position"] } }) => x.p.overall * suitOf(x).mult;

  const byGroup = (g: string) => filled.filter((x) => POSITION_GROUP[x.slot.pos] === g);

  const gk = byGroup("GK");
  const def = byGroup("DEF");
  const mid = byGroup("MID");
  const att = byGroup("ATT");

  const attack = round(avg(att.map(effOverall)));
  const midfield = round(avg(mid.map(effOverall)));
  const defense = round(avg(def.map(effOverall)));
  const goalkeeper = round(avg(gk.map(effOverall)));

  // ---- the four explainable components ----
  const playerQuality = round(avg(filled.map((x) => x.p.overall)));
  const avgMult = filled.length ? avg(filled.map((x) => suitOf(x).mult)) : 1;
  const positionFit = round(avgMult * 100);
  const positionScore = round(avgMult * playerQuality); // suitability on the rating scale
  const fitScore = tactic && filled.length ? tacticFit(tactic, formation, players) : 74;

  const experience = round(avg(filled.map((x) => Math.min(99, 55 + x.p.apps * 2.4 + (x.p.overall - 75)))));
  const leadership = round(
    avg(filled.map((x) => {
      const base = x.p.overall - 8;
      const capBoost = ["CB", "CDM", "GK", "CM"].includes(x.p.position) ? 6 : 0;
      return Math.min(99, base + capBoost);
    })),
  );
  const expLead = round(experience * 0.6 + leadership * 0.4);

  const avgEffective = avg(filled.map(effOverall));
  // Base Squad OVR is tactic-INDEPENDENT — the honest quality of the XI (player
  // quality, position suitability, experience). Tactical Fit is reported
  // separately (breakdown.tacticFit) and never inflates this number.
  const overall = filled.length
    ? round(avgEffective * 0.9 + positionScore * 0.06 + expLead * 0.04)
    : 0;

  const possession = round(avg([...mid, ...att].map((x) => x.p.attributes.passing)) * 0.85 + midfield * 0.15);
  const counter = round(avg([...att, ...mid].map((x) => x.p.attributes.pace)) * 0.75 + attack * 0.25);
  const pressResistance = round(avg(mid.map((x) => (x.p.attributes.dribbling + x.p.attributes.passing) / 2)) || overall - 5);
  const setPieces = round(avg(filled.map((x) => x.p.attributes.physical)) * 0.4 + avg(def.map((x) => x.p.attributes.physical)) * 0.3 + goalkeeper * 0.3);
  const spread = Math.max(attack, midfield, defense) - Math.min(attack, midfield, defense);
  const balance = round(Math.max(40, 100 - spread * 2.5));

  // ---- readable strengths & weaknesses ----
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const lines: [string, number][] = [
    ["Attack", attack],
    ["Midfield", midfield],
    ["Defense", defense],
    ["Goalkeeper", goalkeeper],
  ];
  for (const [label, v] of lines) {
    if (v >= 88) strengths.push(`${label} is elite (${v})`);
    else if (v > 0 && v < 82) weaknesses.push(`${label} could be upgraded (${v})`);
  }
  const offenders = filled.filter((x) => suitOf(x).level === "blocked");
  const seconds = filled.filter((x) => suitOf(x).level === "secondary");
  if (filled.length >= 11 && offenders.length === 0 && seconds.length === 0) {
    strengths.push("Every starter in his natural position");
  }
  for (const o of offenders.slice(0, 2)) {
    weaknesses.push(`${o.p.name.split(" ").pop()} cannot play ${o.slot.pos} — reposition him`);
  }
  if (counter >= 85) strengths.push("Devastating on the counter");
  if (possession >= 86) strengths.push("Elite ball retention");
  if (expLead >= 88) strengths.push("Experienced, battle-hardened core");
  if (balance < 65) weaknesses.push("Unbalanced squad shape");
  if (avg([...def].map((x) => x.p.attributes.pace)) < 68 && def.length) weaknesses.push("Defensive line lacks pace");
  if (!strengths.length) strengths.push("A blank canvas — build identity through your picks");
  if (!weaknesses.length) weaknesses.push("No glaring weakness. The continent should worry.");

  // Captain suggestion: leadership positions weighted by overall & experience
  const captain =
    filled
      .map((x) => ({
        name: x.p.name,
        score: x.p.overall + x.p.apps + (["CB", "CDM", "GK", "CM"].includes(x.p.position) ? 8 : 0),
      }))
      .sort((a, b) => b.score - a.score)[0]?.name ?? "—";

  return {
    overall, attack, midfield, defense, goalkeeper,
    positionFit,
    breakdown: {
      playerQuality,
      positionSuitability: positionScore,
      tacticFit: fitScore,
      experience: expLead,
    },
    leadership, experience, possession, counter, pressResistance, setPieces, balance,
    strengths, weaknesses, captain,
    radar: [
      { label: "ATT", value: attack },
      { label: "MID", value: midfield },
      { label: "DEF", value: defense },
      { label: "GK", value: goalkeeper },
      { label: "FIT", value: positionFit },
      { label: "PACE", value: counter },
    ],
  };
}
