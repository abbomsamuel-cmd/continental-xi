import type { Position } from "./types";
import { POSITION_FAMILY, POSITION_GROUP } from "./formations";

/**
 * Position suitability — the football-real replacement for chemistry.
 * Natural position = full effectiveness, secondary = a small tactical
 * reduction, out-of-position = a meaningful one (worst for GK mismatches).
 */

export type SuitLevel = "natural" | "secondary" | "off";

export interface Suitability {
  level: SuitLevel;
  /** effectiveness multiplier applied to the player's rating in this slot */
  mult: number;
  label: string;
  /** accent used everywhere the level is shown */
  color: string;
  icon: string;
}

const NATURAL: Suitability = { level: "natural", mult: 1, label: "Natural", color: "#2ee6a6", icon: "●" };
const SECONDARY: Suitability = { level: "secondary", mult: 0.97, label: "Secondary", color: "#ffcf5c", icon: "◐" };
const OFF: Suitability = { level: "off", mult: 0.9, label: "Out of Position", color: "#ff5a6a", icon: "○" };
const OFF_GK: Suitability = { ...OFF, mult: 0.85 };

export function suitability(playerPos: Position, alts: Position[], slotPos: Position): Suitability {
  if (playerPos === slotPos || alts.includes(slotPos)) return NATURAL;
  if (
    POSITION_FAMILY[playerPos].includes(slotPos) ||
    alts.some((a) => POSITION_FAMILY[a]?.includes(slotPos)) ||
    POSITION_GROUP[playerPos] === POSITION_GROUP[slotPos]
  ) {
    return SECONDARY;
  }
  if (playerPos === "GK" || slotPos === "GK") return OFF_GK;
  return OFF;
}

/** Effective rating of a player when fielded in the given slot. */
export function effectiveRating(overall: number, playerPos: Position, alts: Position[], slotPos: Position): number {
  return overall * suitability(playerPos, alts, slotPos).mult;
}
