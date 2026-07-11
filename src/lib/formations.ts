import type { Formation, Position, PositionGroup } from "./types";

export const POSITION_GROUP: Record<Position, PositionGroup> = {
  GK: "GK",
  RB: "DEF", CB: "DEF", LB: "DEF", RWB: "DEF", LWB: "DEF",
  CDM: "MID", CM: "MID", CAM: "MID", RM: "MID", LM: "MID",
  RW: "ATT", LW: "ATT", CF: "ATT", ST: "ATT",
};

export const ALL_POSITIONS: Position[] = [
  "GK", "RB", "CB", "LB", "RWB", "LWB",
  "CDM", "CM", "CAM", "RM", "LM",
  "RW", "LW", "CF", "ST",
];

/**
 * Default secondary positions every player of a given role can realistically
 * cover. Deliberately conservative and football-correct — a right-back can
 * always shuttle up to right wing-back, a striker can drop to centre-forward,
 * a winger can play wide midfield. Explicit `altPositions` in the player data
 * ADD to these (they never remove), so a player's full secondary set is the
 * union of their listed alts and this fallback.
 *
 * These fallbacks are what keep every formation fillable while still blocking
 * absurd placements — a goalkeeper covers nothing, a centre-back covers nothing
 * by default (only genuine data gives a CB a full-back or midfield role).
 */
export const DEFAULT_SECONDARY: Record<Position, Position[]> = {
  GK: [],
  CB: [],
  RB: ["RWB"],
  LB: ["LWB"],
  RWB: ["RB", "RM"],
  LWB: ["LB", "LM"],
  CDM: ["CM"],
  CM: ["CAM"],
  CAM: ["CM"],
  RM: ["RW", "RWB"],
  LM: ["LW", "LWB"],
  RW: ["RM", "LW"],
  LW: ["LM", "RW"],
  CF: ["ST", "CAM"],
  ST: ["CF"],
};

/**
 * Every position a player can legally occupy, primary first then secondaries.
 * Primary = their natural role (green). Secondary = listed alts + defaults
 * (yellow). Anything not in this list is BLOCKED — no out-of-position placement.
 */
export function eligiblePositions(pos: Position, alts: Position[] = []): Position[] {
  const secondary: Position[] = [];
  const add = (p: Position) => { if (p !== pos && !secondary.includes(p)) secondary.push(p); };
  for (const a of alts) add(a);
  for (const d of DEFAULT_SECONDARY[pos]) add(d);
  return [pos, ...secondary];
}

/** Just the secondary (yellow) positions — everything eligible except the primary. */
export function secondaryPositions(pos: Position, alts: Position[] = []): Position[] {
  return eligiblePositions(pos, alts).slice(1);
}

export type SuitLevelRaw = "natural" | "secondary" | "blocked";

/** How a player relates to a slot: natural (green), secondary (yellow), or blocked. */
export function suitLevelOf(pos: Position, alts: Position[], slot: Position): SuitLevelRaw {
  if (slot === pos) return "natural";
  return eligiblePositions(pos, alts).includes(slot) ? "secondary" : "blocked";
}

/** True if a player (natural + alts) can legally fill the given slot. Strict: primary or secondary only. */
export function canPlaySlot(playerPos: Position, alts: Position[], slotPos: Position): boolean {
  return suitLevelOf(playerPos, alts, slotPos) !== "blocked";
}

// x: 0 (left) → 100 (right); y: 0 (own goal) → 100 (attack)
export const FORMATIONS: Formation[] = [
  {
    name: "4-3-3",
    bestFor: ["possession", "gegenpress", "balanced"],
    slots: [
      { pos: "GK", x: 50, y: 6 },
      { pos: "RB", x: 84, y: 22 }, { pos: "CB", x: 62, y: 18 }, { pos: "CB", x: 38, y: 18 }, { pos: "LB", x: 16, y: 22 },
      { pos: "CM", x: 68, y: 50 }, { pos: "CM", x: 50, y: 46 }, { pos: "CM", x: 32, y: 50 },
      { pos: "RW", x: 82, y: 76 }, { pos: "ST", x: 50, y: 85 }, { pos: "LW", x: 18, y: 76 },
    ],
  },
  {
    name: "4-3-3 (2)",
    bestFor: ["possession", "balanced", "counter"],
    slots: [
      { pos: "GK", x: 50, y: 6 },
      { pos: "RB", x: 84, y: 22 }, { pos: "CB", x: 62, y: 18 }, { pos: "CB", x: 38, y: 18 }, { pos: "LB", x: 16, y: 22 },
      { pos: "CM", x: 70, y: 52 }, { pos: "CDM", x: 50, y: 40 }, { pos: "CM", x: 30, y: 52 },
      { pos: "RW", x: 82, y: 76 }, { pos: "ST", x: 50, y: 85 }, { pos: "LW", x: 18, y: 76 },
    ],
  },
  {
    name: "4-3-3 (3)",
    bestFor: ["defensive", "gegenpress", "possession"],
    slots: [
      { pos: "GK", x: 50, y: 6 },
      { pos: "RB", x: 84, y: 22 }, { pos: "CB", x: 62, y: 18 }, { pos: "CB", x: 38, y: 18 }, { pos: "LB", x: 16, y: 22 },
      { pos: "CDM", x: 62, y: 40 }, { pos: "CDM", x: 38, y: 40 }, { pos: "CM", x: 50, y: 56 },
      { pos: "RW", x: 82, y: 76 }, { pos: "ST", x: 50, y: 85 }, { pos: "LW", x: 18, y: 76 },
    ],
  },
  {
    name: "4-2-3-1",
    bestFor: ["possession", "balanced", "gegenpress"],
    slots: [
      { pos: "GK", x: 50, y: 6 },
      { pos: "RB", x: 84, y: 22 }, { pos: "CB", x: 62, y: 18 }, { pos: "CB", x: 38, y: 18 }, { pos: "LB", x: 16, y: 22 },
      { pos: "CDM", x: 62, y: 40 }, { pos: "CDM", x: 38, y: 40 },
      { pos: "RM", x: 82, y: 62 }, { pos: "CAM", x: 50, y: 64 }, { pos: "LM", x: 18, y: 62 },
      { pos: "ST", x: 50, y: 86 },
    ],
  },
  {
    name: "4-4-2",
    bestFor: ["balanced", "direct", "counter"],
    slots: [
      { pos: "GK", x: 50, y: 6 },
      { pos: "RB", x: 84, y: 22 }, { pos: "CB", x: 62, y: 18 }, { pos: "CB", x: 38, y: 18 }, { pos: "LB", x: 16, y: 22 },
      { pos: "RM", x: 84, y: 52 }, { pos: "CM", x: 62, y: 48 }, { pos: "CM", x: 38, y: 48 }, { pos: "LM", x: 16, y: 52 },
      { pos: "ST", x: 60, y: 83 }, { pos: "ST", x: 40, y: 83 },
    ],
  },
  {
    name: "4-5-1",
    bestFor: ["defensive", "counter", "balanced"],
    slots: [
      { pos: "GK", x: 50, y: 6 },
      { pos: "RB", x: 84, y: 22 }, { pos: "CB", x: 62, y: 18 }, { pos: "CB", x: 38, y: 18 }, { pos: "LB", x: 16, y: 22 },
      { pos: "RM", x: 86, y: 54 }, { pos: "CM", x: 64, y: 48 }, { pos: "CAM", x: 50, y: 60 }, { pos: "CM", x: 36, y: 48 }, { pos: "LM", x: 14, y: 54 },
      { pos: "ST", x: 50, y: 85 },
    ],
  },
  {
    name: "4-1-2-1-2",
    bestFor: ["possession", "counter", "direct"],
    slots: [
      { pos: "GK", x: 50, y: 6 },
      { pos: "RB", x: 84, y: 22 }, { pos: "CB", x: 62, y: 18 }, { pos: "CB", x: 38, y: 18 }, { pos: "LB", x: 16, y: 22 },
      { pos: "CDM", x: 50, y: 38 },
      { pos: "CM", x: 72, y: 52 }, { pos: "CM", x: 28, y: 52 },
      { pos: "CAM", x: 50, y: 66 },
      { pos: "ST", x: 60, y: 85 }, { pos: "ST", x: 40, y: 85 },
    ],
  },
  {
    name: "4-1-4-1",
    bestFor: ["defensive", "balanced", "counter"],
    slots: [
      { pos: "GK", x: 50, y: 6 },
      { pos: "RB", x: 84, y: 22 }, { pos: "CB", x: 62, y: 18 }, { pos: "CB", x: 38, y: 18 }, { pos: "LB", x: 16, y: 22 },
      { pos: "CDM", x: 50, y: 40 },
      { pos: "RM", x: 84, y: 58 }, { pos: "CM", x: 62, y: 54 }, { pos: "CM", x: 38, y: 54 }, { pos: "LM", x: 16, y: 58 },
      { pos: "ST", x: 50, y: 85 },
    ],
  },
  {
    name: "4-2-2-2",
    bestFor: ["gegenpress", "direct", "counter"],
    slots: [
      { pos: "GK", x: 50, y: 6 },
      { pos: "RB", x: 84, y: 22 }, { pos: "CB", x: 62, y: 18 }, { pos: "CB", x: 38, y: 18 }, { pos: "LB", x: 16, y: 22 },
      { pos: "CDM", x: 62, y: 41 }, { pos: "CDM", x: 38, y: 41 },
      { pos: "CAM", x: 74, y: 62 }, { pos: "CAM", x: 26, y: 62 },
      { pos: "ST", x: 60, y: 85 }, { pos: "ST", x: 40, y: 85 },
    ],
  },
  {
    name: "3-5-2",
    bestFor: ["possession", "balanced", "gegenpress"],
    slots: [
      { pos: "GK", x: 50, y: 6 },
      { pos: "CB", x: 70, y: 19 }, { pos: "CB", x: 50, y: 16 }, { pos: "CB", x: 30, y: 19 },
      { pos: "RWB", x: 90, y: 46 }, { pos: "LWB", x: 10, y: 46 },
      { pos: "CM", x: 66, y: 50 }, { pos: "CDM", x: 50, y: 40 }, { pos: "CM", x: 34, y: 50 },
      { pos: "ST", x: 60, y: 83 }, { pos: "ST", x: 40, y: 83 },
    ],
  },
  {
    name: "3-4-3",
    bestFor: ["gegenpress", "possession", "direct"],
    slots: [
      { pos: "GK", x: 50, y: 6 },
      { pos: "CB", x: 70, y: 19 }, { pos: "CB", x: 50, y: 16 }, { pos: "CB", x: 30, y: 19 },
      { pos: "RM", x: 86, y: 50 }, { pos: "CM", x: 62, y: 44 }, { pos: "CM", x: 38, y: 44 }, { pos: "LM", x: 14, y: 50 },
      { pos: "RW", x: 78, y: 78 }, { pos: "ST", x: 50, y: 86 }, { pos: "LW", x: 22, y: 78 },
    ],
  },
  {
    name: "3-4-2-1",
    bestFor: ["possession", "balanced", "gegenpress"],
    slots: [
      { pos: "GK", x: 50, y: 6 },
      { pos: "CB", x: 70, y: 19 }, { pos: "CB", x: 50, y: 16 }, { pos: "CB", x: 30, y: 19 },
      { pos: "RM", x: 86, y: 48 }, { pos: "CM", x: 62, y: 42 }, { pos: "CM", x: 38, y: 42 }, { pos: "LM", x: 14, y: 48 },
      { pos: "CAM", x: 66, y: 66 }, { pos: "CAM", x: 34, y: 66 },
      { pos: "ST", x: 50, y: 86 },
    ],
  },
  {
    name: "5-3-2",
    bestFor: ["defensive", "counter", "balanced"],
    slots: [
      { pos: "GK", x: 50, y: 6 },
      { pos: "RWB", x: 90, y: 32 }, { pos: "CB", x: 70, y: 18 }, { pos: "CB", x: 50, y: 15 }, { pos: "CB", x: 30, y: 18 }, { pos: "LWB", x: 10, y: 32 },
      { pos: "CM", x: 66, y: 52 }, { pos: "CDM", x: 50, y: 44 }, { pos: "CM", x: 34, y: 52 },
      { pos: "ST", x: 60, y: 82 }, { pos: "ST", x: 40, y: 82 },
    ],
  },
  {
    name: "5-2-1-2",
    bestFor: ["defensive", "counter", "direct"],
    slots: [
      { pos: "GK", x: 50, y: 6 },
      { pos: "RWB", x: 90, y: 32 }, { pos: "CB", x: 70, y: 18 }, { pos: "CB", x: 50, y: 15 }, { pos: "CB", x: 30, y: 18 }, { pos: "LWB", x: 10, y: 32 },
      { pos: "CM", x: 62, y: 46 }, { pos: "CM", x: 38, y: 46 },
      { pos: "CAM", x: 50, y: 64 },
      { pos: "ST", x: 60, y: 84 }, { pos: "ST", x: 40, y: 84 },
    ],
  },
  {
    name: "5-4-1",
    bestFor: ["defensive", "counter", "balanced"],
    slots: [
      { pos: "GK", x: 50, y: 6 },
      { pos: "RWB", x: 90, y: 32 }, { pos: "CB", x: 70, y: 18 }, { pos: "CB", x: 50, y: 15 }, { pos: "CB", x: 30, y: 18 }, { pos: "LWB", x: 10, y: 32 },
      { pos: "RM", x: 82, y: 56 }, { pos: "CM", x: 60, y: 50 }, { pos: "CM", x: 40, y: 50 }, { pos: "LM", x: 18, y: 56 },
      { pos: "ST", x: 50, y: 84 },
    ],
  },
  {
    name: "4-3-2-1",
    bestFor: ["possession", "balanced", "defensive"],
    slots: [
      { pos: "GK", x: 50, y: 6 },
      { pos: "RB", x: 84, y: 22 }, { pos: "CB", x: 62, y: 18 }, { pos: "CB", x: 38, y: 18 }, { pos: "LB", x: 16, y: 22 },
      { pos: "CDM", x: 50, y: 38 }, { pos: "CM", x: 70, y: 50 }, { pos: "CM", x: 30, y: 50 },
      { pos: "CAM", x: 66, y: 68 }, { pos: "CAM", x: 34, y: 68 },
      { pos: "ST", x: 50, y: 85 },
    ],
  },
  {
    name: "4-4-1-1",
    bestFor: ["counter", "balanced", "direct"],
    slots: [
      { pos: "GK", x: 50, y: 6 },
      { pos: "RB", x: 84, y: 22 }, { pos: "CB", x: 62, y: 18 }, { pos: "CB", x: 38, y: 18 }, { pos: "LB", x: 16, y: 22 },
      { pos: "RM", x: 84, y: 50 }, { pos: "CM", x: 62, y: 46 }, { pos: "CM", x: 38, y: 46 }, { pos: "LM", x: 16, y: 50 },
      { pos: "CF", x: 50, y: 68 },
      { pos: "ST", x: 50, y: 86 },
    ],
  },
  {
    name: "4-2-4",
    bestFor: ["direct", "gegenpress", "counter"],
    slots: [
      { pos: "GK", x: 50, y: 6 },
      { pos: "RB", x: 84, y: 22 }, { pos: "CB", x: 62, y: 18 }, { pos: "CB", x: 38, y: 18 }, { pos: "LB", x: 16, y: 22 },
      { pos: "CM", x: 62, y: 46 }, { pos: "CM", x: 38, y: 46 },
      { pos: "RW", x: 87, y: 72 }, { pos: "LW", x: 13, y: 72 },
      { pos: "ST", x: 63, y: 86 }, { pos: "ST", x: 37, y: 86 },
    ],
  },
];

export function getFormation(name: string): Formation {
  return FORMATIONS.find((f) => f.name === name) ?? FORMATIONS[0];
}

export type FormationCategory = "Back Four" | "Back Three" | "Back Five";
export const FORMATION_CATEGORIES: FormationCategory[] = ["Back Four", "Back Three", "Back Five"];

/** Category from the defensive line — the first number of the formation name. */
export function formationCategory(f: Formation): FormationCategory {
  return f.name.startsWith("5") ? "Back Five" : f.name.startsWith("3") ? "Back Three" : "Back Four";
}

/** A short human description of a formation's shape, for the preview. */
export function formationShapeNote(f: Formation): { attack: string; mid: string; def: string } {
  const att = f.slots.filter((s) => POSITION_GROUP[s.pos] === "ATT");
  const mid = f.slots.filter((s) => POSITION_GROUP[s.pos] === "MID");
  const def = f.slots.filter((s) => POSITION_GROUP[s.pos] === "DEF");
  const wide = att.filter((s) => s.pos === "LW" || s.pos === "RW").length;
  const wingBacks = def.filter((s) => s.pos === "LWB" || s.pos === "RWB").length;
  return {
    attack: wide >= 2 ? "Wide front line" : att.length >= 2 ? "Twin strikers" : "Lone striker",
    mid: `${mid.length}-man midfield`,
    def: wingBacks ? "Wing-backs push on" : def.length >= 5 ? "Low block" : "Flat back line",
  };
}

interface Placeable { id: string; position: Position; altPositions: Position[] }

/**
 * Greedily fit a set of players into a formation's slots — natural roles first,
 * then any legal secondary. Returns slotIndex → playerId for those that fit; a
 * player who fits no remaining slot is simply left out (never forced into an
 * invalid position). Used for formation changes on both the draft and squad
 * screens so both agree on what a shape can and can't hold.
 */
export function greedyAssign(players: Placeable[], formation: Formation): Record<number, string> {
  const taken = new Set<number>();
  const out: Record<number, string> = {};
  const claim = (p: Placeable, prefer: (pos: Position) => boolean) => {
    const idx = formation.slots.findIndex((s, i) => !taken.has(i) && prefer(s.pos) && canPlaySlot(p.position, p.altPositions, s.pos));
    if (idx < 0) return false;
    taken.add(idx); out[idx] = p.id; return true;
  };
  const leftovers: Placeable[] = [];
  for (const p of players) { if (!claim(p, (pos) => pos === p.position)) leftovers.push(p); }
  for (const p of leftovers) claim(p, () => true);
  return out;
}

/** True if a formation can hold every one of these players in a legal position. */
export function formationCanHold(players: Placeable[], formation: Formation): boolean {
  return Object.keys(greedyAssign(players, formation)).length === players.length;
}
