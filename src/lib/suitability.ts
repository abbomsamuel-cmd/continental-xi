import type { Position } from "./types";
import { suitLevelOf, type SuitLevelRaw } from "./formations";

/**
 * Position suitability — the football-real replacement for chemistry.
 *
 *   natural (green)   the player's primary role — full effectiveness
 *   secondary (yellow) a role he can realistically cover — small reduction
 *   blocked (locked)  he cannot play here — never selectable in normal play
 *
 * There is no unrestricted "out of position" placement any more: a player may
 * only be fielded in a primary or secondary slot. `blocked` is used purely to
 * DISABLE a slot in the UI (and to degrade gracefully if a legacy save somehow
 * holds an illegal placement).
 */

export type SuitLevel = SuitLevelRaw; // "natural" | "secondary" | "blocked"

export interface Suitability {
  level: SuitLevel;
  /** effectiveness multiplier applied to the player's rating in this slot */
  mult: number;
  /** full descriptive label ("Natural Position") */
  label: string;
  /** compact label ("Natural") */
  short: string;
  /** accent used everywhere the level is shown */
  color: string;
  icon: string;
}

const NATURAL: Suitability = {
  level: "natural", mult: 1,
  label: "Natural Position", short: "Natural",
  color: "#2ee6a6", icon: "●",
};
const SECONDARY: Suitability = {
  level: "secondary", mult: 0.96,
  label: "Secondary Position", short: "Secondary",
  color: "#ffcf5c", icon: "◆",
};
const BLOCKED: Suitability = {
  level: "blocked", mult: 0.85,
  label: "Cannot play here", short: "Invalid",
  color: "#ff5a6a", icon: "⊘",
};

export function suitability(playerPos: Position, alts: Position[], slotPos: Position): Suitability {
  switch (suitLevelOf(playerPos, alts, slotPos)) {
    case "natural": return NATURAL;
    case "secondary": return SECONDARY;
    default: return BLOCKED;
  }
}

/** Effective rating of a player when fielded in the given slot. */
export function effectiveRating(overall: number, playerPos: Position, alts: Position[], slotPos: Position): number {
  return overall * suitability(playerPos, alts, slotPos).mult;
}
