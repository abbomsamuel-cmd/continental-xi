import type { Formation, Position, PositionGroup } from "./types";

export const POSITION_GROUP: Record<Position, PositionGroup> = {
  GK: "GK",
  RB: "DEF", CB: "DEF", LB: "DEF", RWB: "DEF", LWB: "DEF",
  CDM: "MID", CM: "MID", CAM: "MID", RM: "MID", LM: "MID",
  RW: "ATT", LW: "ATT", CF: "ATT", ST: "ATT",
};

/** Positions considered interchangeable without a rating penalty. */
export const POSITION_FAMILY: Record<Position, Position[]> = {
  GK: ["GK"],
  RB: ["RB", "RWB"], RWB: ["RWB", "RB", "RM"],
  LB: ["LB", "LWB"], LWB: ["LWB", "LB", "LM"],
  CB: ["CB"],
  CDM: ["CDM", "CM"], CM: ["CM", "CDM", "CAM"], CAM: ["CAM", "CM", "CF"],
  RM: ["RM", "RW", "RWB"], LM: ["LM", "LW", "LWB"],
  RW: ["RW", "RM"], LW: ["LW", "LM"],
  CF: ["CF", "ST", "CAM"], ST: ["ST", "CF"],
};

/**
 * Which positions may genuinely fill each slot. Football-correct: a winger can
 * cover the wings and wide midfield, NOT central midfield; a central mid can't
 * play out wide, etc. Used to decide which players a round offers and whether a
 * manual swap is legal.
 */
export const SLOT_ELIGIBLE: Record<Position, Position[]> = {
  GK: ["GK"],
  // Defenders interchange within the back line (full-backs can cover CB), but a
  // winger or forward can NEVER play full-back or CB.
  CB: ["CB", "RB", "LB"],
  RB: ["RB", "RWB", "CB"],
  LB: ["LB", "LWB", "CB"],
  // Wing-back is an attacking role, so it can be covered by the same-side
  // wide midfielder / winger too.
  RWB: ["RWB", "RB", "RM", "RW"],
  LWB: ["LWB", "LB", "LM", "LW"],
  // The central-midfield trio interchanges freely (CDM↔CM↔CAM) — but a winger
  // or wide midfielder can NEVER play a central slot.
  CDM: ["CDM", "CM", "CAM"],
  CM: ["CM", "CDM", "CAM"],
  CAM: ["CAM", "CM", "CDM", "CF"],
  // Wide midfielders and wingers are WIDE only — they play their side (and the
  // opposite wing), never central midfield.
  RM: ["RM", "RW"],
  LM: ["LM", "LW"],
  RW: ["RW", "RM", "LW"],
  LW: ["LW", "LM", "RW"],
  CF: ["CF", "ST", "CAM"],
  ST: ["ST", "CF", "CAM"],
};

/** True if a player (by natural + alt positions) can legally fill the given slot. */
export function canPlaySlot(playerPos: Position, alts: Position[], slotPos: Position): boolean {
  const ok = SLOT_ELIGIBLE[slotPos];
  return ok.includes(playerPos) || alts.some((a) => ok.includes(a));
}

// x: 0 (left) → 100 (right); y: 0 (own goal) → 100 (attack)
export const FORMATIONS: Formation[] = [
  {
    name: "4-3-3",
    slots: [
      { pos: "GK", x: 50, y: 5 },
      { pos: "RB", x: 85, y: 24 }, { pos: "CB", x: 63, y: 19 }, { pos: "CB", x: 37, y: 19 }, { pos: "LB", x: 15, y: 24 },
      { pos: "CDM", x: 50, y: 40 }, { pos: "CM", x: 70, y: 53 }, { pos: "CM", x: 30, y: 53 },
      { pos: "RW", x: 82, y: 76 }, { pos: "ST", x: 50, y: 85 }, { pos: "LW", x: 18, y: 76 },
    ],
  },
  {
    name: "4-2-3-1",
    slots: [
      { pos: "GK", x: 50, y: 5 },
      { pos: "RB", x: 85, y: 24 }, { pos: "CB", x: 63, y: 19 }, { pos: "CB", x: 37, y: 19 }, { pos: "LB", x: 15, y: 24 },
      { pos: "CDM", x: 62, y: 40 }, { pos: "CDM", x: 38, y: 40 },
      { pos: "RM", x: 82, y: 62 }, { pos: "CAM", x: 50, y: 63 }, { pos: "LM", x: 18, y: 62 },
      { pos: "ST", x: 50, y: 86 },
    ],
  },
  {
    name: "4-4-2",
    slots: [
      { pos: "GK", x: 50, y: 5 },
      { pos: "RB", x: 85, y: 24 }, { pos: "CB", x: 63, y: 19 }, { pos: "CB", x: 37, y: 19 }, { pos: "LB", x: 15, y: 24 },
      { pos: "RM", x: 84, y: 52 }, { pos: "CM", x: 62, y: 48 }, { pos: "CM", x: 38, y: 48 }, { pos: "LM", x: 16, y: 52 },
      { pos: "ST", x: 62, y: 82 }, { pos: "ST", x: 38, y: 82 },
    ],
  },
  {
    name: "4-1-2-1-2",
    slots: [
      { pos: "GK", x: 50, y: 5 },
      { pos: "RB", x: 85, y: 24 }, { pos: "CB", x: 63, y: 19 }, { pos: "CB", x: 37, y: 19 }, { pos: "LB", x: 15, y: 24 },
      { pos: "CDM", x: 50, y: 38 },
      { pos: "CM", x: 70, y: 52 }, { pos: "CM", x: 30, y: 52 },
      { pos: "CAM", x: 50, y: 66 },
      { pos: "ST", x: 62, y: 84 }, { pos: "ST", x: 38, y: 84 },
    ],
  },
  {
    name: "3-5-2",
    slots: [
      { pos: "GK", x: 50, y: 5 },
      { pos: "CB", x: 72, y: 19 }, { pos: "CB", x: 50, y: 16 }, { pos: "CB", x: 28, y: 19 },
      { pos: "RWB", x: 88, y: 46 }, { pos: "LWB", x: 12, y: 46 },
      { pos: "CM", x: 64, y: 48 }, { pos: "CDM", x: 50, y: 38 }, { pos: "CM", x: 36, y: 48 },
      { pos: "ST", x: 62, y: 82 }, { pos: "ST", x: 38, y: 82 },
    ],
  },
  {
    name: "3-4-3",
    slots: [
      { pos: "GK", x: 50, y: 5 },
      { pos: "CB", x: 72, y: 19 }, { pos: "CB", x: 50, y: 16 }, { pos: "CB", x: 28, y: 19 },
      { pos: "RM", x: 86, y: 50 }, { pos: "CM", x: 62, y: 44 }, { pos: "CM", x: 38, y: 44 }, { pos: "LM", x: 14, y: 50 },
      { pos: "RW", x: 78, y: 78 }, { pos: "ST", x: 50, y: 86 }, { pos: "LW", x: 22, y: 78 },
    ],
  },
  {
    name: "5-3-2",
    slots: [
      { pos: "GK", x: 50, y: 5 },
      { pos: "RWB", x: 90, y: 32 }, { pos: "CB", x: 70, y: 18 }, { pos: "CB", x: 50, y: 15 }, { pos: "CB", x: 30, y: 18 }, { pos: "LWB", x: 10, y: 32 },
      { pos: "CM", x: 66, y: 52 }, { pos: "CDM", x: 50, y: 44 }, { pos: "CM", x: 34, y: 52 },
      { pos: "ST", x: 62, y: 82 }, { pos: "ST", x: 38, y: 82 },
    ],
  },
  {
    name: "5-4-1",
    slots: [
      { pos: "GK", x: 50, y: 5 },
      { pos: "RWB", x: 90, y: 32 }, { pos: "CB", x: 70, y: 18 }, { pos: "CB", x: 50, y: 15 }, { pos: "CB", x: 30, y: 18 }, { pos: "LWB", x: 10, y: 32 },
      { pos: "RM", x: 82, y: 56 }, { pos: "CM", x: 60, y: 50 }, { pos: "CM", x: 40, y: 50 }, { pos: "LM", x: 18, y: 56 },
      { pos: "ST", x: 50, y: 84 },
    ],
  },
  {
    name: "4-3-2-1",
    slots: [
      { pos: "GK", x: 50, y: 5 },
      { pos: "RB", x: 85, y: 24 }, { pos: "CB", x: 63, y: 19 }, { pos: "CB", x: 37, y: 19 }, { pos: "LB", x: 15, y: 24 },
      { pos: "CDM", x: 50, y: 38 }, { pos: "CM", x: 70, y: 50 }, { pos: "CM", x: 30, y: 50 },
      { pos: "CAM", x: 66, y: 68 }, { pos: "CAM", x: 34, y: 68 },
      { pos: "ST", x: 50, y: 85 },
    ],
  },
  {
    name: "4-4-1-1",
    slots: [
      { pos: "GK", x: 50, y: 5 },
      { pos: "RB", x: 85, y: 24 }, { pos: "CB", x: 63, y: 19 }, { pos: "CB", x: 37, y: 19 }, { pos: "LB", x: 15, y: 24 },
      { pos: "RM", x: 84, y: 50 }, { pos: "CM", x: 62, y: 46 }, { pos: "CM", x: 38, y: 46 }, { pos: "LM", x: 16, y: 50 },
      { pos: "CF", x: 50, y: 68 },
      { pos: "ST", x: 50, y: 86 },
    ],
  },
  {
    name: "3-4-1-2",
    slots: [
      { pos: "GK", x: 50, y: 5 },
      { pos: "CB", x: 72, y: 19 }, { pos: "CB", x: 50, y: 16 }, { pos: "CB", x: 28, y: 19 },
      { pos: "RWB", x: 88, y: 46 }, { pos: "CM", x: 62, y: 44 }, { pos: "CM", x: 38, y: 44 }, { pos: "LWB", x: 12, y: 46 },
      { pos: "CAM", x: 50, y: 64 },
      { pos: "ST", x: 62, y: 84 }, { pos: "ST", x: 38, y: 84 },
    ],
  },
  {
    name: "4-2-2-2",
    slots: [
      { pos: "GK", x: 50, y: 5 },
      { pos: "RB", x: 85, y: 24 }, { pos: "CB", x: 63, y: 19 }, { pos: "CB", x: 37, y: 19 }, { pos: "LB", x: 15, y: 24 },
      { pos: "CDM", x: 62, y: 41 }, { pos: "CDM", x: 38, y: 41 },
      { pos: "CAM", x: 74, y: 62 }, { pos: "CAM", x: 26, y: 62 },
      { pos: "ST", x: 60, y: 85 }, { pos: "ST", x: 40, y: 85 },
    ],
  },
  {
    name: "4-2-4",
    slots: [
      { pos: "GK", x: 50, y: 5 },
      { pos: "RB", x: 85, y: 24 }, { pos: "CB", x: 63, y: 19 }, { pos: "CB", x: 37, y: 19 }, { pos: "LB", x: 15, y: 24 },
      { pos: "CM", x: 62, y: 46 }, { pos: "CM", x: 38, y: 46 },
      { pos: "RW", x: 87, y: 72 }, { pos: "LW", x: 13, y: 72 },
      { pos: "ST", x: 63, y: 86 }, { pos: "ST", x: 37, y: 86 },
    ],
  },
];

export function getFormation(name: string): Formation {
  return FORMATIONS.find((f) => f.name === name) ?? FORMATIONS[0];
}

/** How well a player with `playerPos` (+alts) fits a formation slot. 1 = natural, 0.9 = family, 0.75 = same group, 0.55 = off. */
export function positionFit(playerPos: Position, alts: Position[], slotPos: Position): number {
  if (playerPos === slotPos || alts.includes(slotPos)) return 1;
  if (POSITION_FAMILY[playerPos].includes(slotPos) || alts.some((a) => POSITION_FAMILY[a]?.includes(slotPos))) return 0.9;
  if (POSITION_GROUP[playerPos] === POSITION_GROUP[slotPos]) return 0.75;
  if (playerPos === "GK" || slotPos === "GK") return 0.2;
  return 0.55;
}
