import type { Formation, Player, TeamAnalysis } from "./types";
import { POSITION_GROUP, positionFit } from "./formations";
import { computeChemistry } from "./chemistry";

const round = (v: number) => Math.round(v);

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;
}

/** Full team analysis for a completed (or partial) XI. */
export function analyzeTeam(formation: Formation, players: (Player | null)[]): TeamAnalysis {
  const filled = players
    .map((p, i) => ({ p, slot: formation.slots[i], i }))
    .filter((x): x is { p: Player; slot: (typeof formation.slots)[number]; i: number } => x.p !== null);

  const effOverall = (x: { p: Player; slot: { pos: Player["position"] } }) =>
    x.p.overall * positionFit(x.p.position, x.p.altPositions, x.slot.pos);

  const byGroup = (g: string) => filled.filter((x) => POSITION_GROUP[x.slot.pos] === g);

  const gk = byGroup("GK");
  const def = byGroup("DEF");
  const mid = byGroup("MID");
  const att = byGroup("ATT");

  const chem = computeChemistry(formation, players);

  const attack = round(avg(att.map(effOverall)));
  const midfield = round(avg(mid.map(effOverall)));
  const defense = round(avg(def.map(effOverall)));
  const goalkeeper = round(avg(gk.map(effOverall)));
  const overall = round(avg(filled.map(effOverall)));

  const experience = round(avg(filled.map((x) => Math.min(99, 55 + x.p.apps * 2.4 + (x.p.overall - 75)))));
  const leadership = round(
    avg(filled.map((x) => {
      const base = x.p.overall - 8;
      const capBoost = ["CB", "CDM", "GK", "CM"].includes(x.p.position) ? 6 : 0;
      return Math.min(99, base + capBoost);
    })),
  );
  const possession = round(avg([...mid, ...att].map((x) => x.p.attributes.passing)) * 0.7 + chem.total * 0.3);
  const counter = round(avg([...att, ...mid].map((x) => x.p.attributes.pace)) * 0.75 + attack * 0.25);
  const pressResistance = round(avg(mid.map((x) => (x.p.attributes.dribbling + x.p.attributes.passing) / 2)) || overall - 5);
  const setPieces = round(avg(filled.map((x) => x.p.attributes.physical)) * 0.4 + avg(def.map((x) => x.p.attributes.physical)) * 0.3 + goalkeeper * 0.3);
  const spread = Math.max(attack, midfield, defense) - Math.min(attack, midfield, defense);
  const balance = round(Math.max(40, 100 - spread * 2.5));

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
  if (chem.total >= 75) strengths.push(`Outstanding chemistry (${chem.total})`);
  else if (chem.total < 45) weaknesses.push(`Low chemistry (${chem.total}) — link clubs, nations and eras`);
  if (chem.partnerships.length) strengths.push(`Historic links: ${chem.partnerships.join(", ")}`);
  if (counter >= 85) strengths.push("Devastating on the counter");
  if (balance < 65) weaknesses.push("Unbalanced squad shape");
  if (!strengths.length) strengths.push("A blank canvas — build identity through your picks");
  if (!weaknesses.length) weaknesses.push("No glaring weakness. Europe should worry.");

  // Captain: leadership positions weighted by overall & experience
  const captain =
    filled
      .map((x) => ({
        name: x.p.name,
        score: x.p.overall + x.p.apps + (["CB", "CDM", "GK", "CM"].includes(x.p.position) ? 8 : 0),
      }))
      .sort((a, b) => b.score - a.score)[0]?.name ?? "—";

  return {
    overall, attack, midfield, defense, goalkeeper,
    chemistry: chem.total,
    leadership, experience, possession, counter, pressResistance, setPieces, balance,
    strengths, weaknesses, captain,
    radar: [
      { label: "ATT", value: attack },
      { label: "MID", value: midfield },
      { label: "DEF", value: defense },
      { label: "GK", value: goalkeeper },
      { label: "CHEM", value: chem.total },
      { label: "PACE", value: counter },
    ],
  };
}
