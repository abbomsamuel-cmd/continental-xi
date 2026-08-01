import type { Formation, MatchResult, Position } from "@/lib/types";
import { POSITION_GROUP } from "@/lib/formations";
import { frac, matchSeed } from "@/lib/broadcast";

/**
 * Spatial synthesis for the live match pitch canvas — PRESENTATION ONLY,
 * exactly like broadcast.ts. `simulateMatch()` never produces x/y positions
 * (it's a statistical Poisson model, not a positional simulation), so this
 * module fabricates a plausible-looking 90 minutes of player/ball movement
 * from an already-final MatchResult + the two starting formations. It can
 * never change a score, an event, or a stat — it only decorates them.
 *
 * Deterministic: everything is keyed off matchSeed(result) + minute (reusing
 * broadcast.ts's frac()), so the same match always animates identically on
 * every replay — no Math.random() anywhere.
 *
 * Shared pitch space: 0-100 on both axes. Home attacks toward y=100 (their
 * own formation slots already use that convention from formations.ts); away
 * is mirrored (x'=100-x, y'=100-y) so their own goal sits at y=100 in this
 * shared frame and they attack toward y=0.
 *
 * Known simplification: substitutions are not visually swapped — the eleven
 * dots per team stay mapped to the starting XI's formation slots for the
 * full match. MatchEvent's `sub` entries carry player names only, not which
 * slot/position they replace, so a faithful swap isn't derivable from the
 * data without guessing.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface DotState {
  id: string;
  team: 0 | 1;
  pos: Vec2;
  role: Position;
}

export interface BallState {
  pos: Vec2;
  possessor: 0 | 1;
  /** 0-1 height cue for a lofted-pass/shot arc — not real physics */
  z: number;
}

export interface PitchFrame {
  minute: number;
  possession: 0 | 1;
  dots: DotState[];
  ball: BallState;
}

const FORWARD_DRIFT: Record<string, number> = { GK: 1.5, DEF: 7, MID: 13, ATT: 19 };
const RETREAT_DRIFT: Record<string, number> = { GK: 0.5, DEF: 2, MID: 4, ATT: 6 };

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** One frame of synthesized positions for the given minute. Call once per
 *  minute tick (from useMatchClock's onMinute) — the canvas renderer lerps
 *  between successive frames itself for smooth motion. */
export function synthesizeFrame(
  result: MatchResult,
  homeFormation: Formation,
  awayFormation: Formation,
  minute: number,
): PitchFrame {
  const seed = matchSeed(result);

  if (minute <= 0) {
    return { minute: 0, possession: 0, ball: { pos: { x: 50, y: 50 }, possessor: 0, z: 0.1 }, dots: kickoffDots(homeFormation, awayFormation) };
  }

  const possWeight = clamp(result.stats.possession[0] / 100, 0.15, 0.85);
  let possession: 0 | 1 = frac(seed + minute * 12.9898) < possWeight ? 0 : 1;

  // a goal or a big chance this exact minute snaps possession/positions to
  // whoever the event belongs to, overriding the ambient possession roll
  const liveEvent = result.events.find((e) => e.minute === minute && (e.type === "goal" || e.type === "chance"));
  if (liveEvent) possession = liveEvent.team;

  const dots: DotState[] = [];
  ([homeFormation, awayFormation] as const).forEach((formation, teamIdx) => {
    const team = teamIdx as 0 | 1;
    const mirror = team === 1;
    const forwardDir = team === 0 ? 1 : -1;
    const hasBall = possession === team;
    formation.slots.forEach((slot, i) => {
      const group = POSITION_GROUP[slot.pos];
      const baseX = mirror ? 100 - slot.x : slot.x;
      const baseY = mirror ? 100 - slot.y : slot.y;
      const driftAmt = hasBall ? FORWARD_DRIFT[group] : -RETREAT_DRIFT[group];
      const j = seed + teamIdx * 977 + i * 53 + minute * 3.1;
      const jitterX = (frac(j) - 0.5) * 5;
      const jitterY = (frac(j + 11.3) - 0.5) * 3;
      dots.push({
        id: `${team}-${i}`,
        team,
        role: slot.pos,
        pos: { x: clamp(baseX + jitterX, 3, 97), y: clamp(baseY + forwardDir * driftAmt + jitterY, 3, 97) },
      });
    });
  });

  let ball: BallState;
  if (liveEvent) {
    const goalY = liveEvent.team === 0 ? 96 : 4; // shooting at the opponent's goal
    ball = {
      pos: { x: clamp(50 + (frac(seed + minute * 5.7) - 0.5) * 30, 4, 96), y: goalY },
      possessor: liveEvent.team,
      z: 0.7,
    };
  } else {
    const forwardDir = possession === 0 ? 1 : -1;
    const push = 18 + frac(seed + minute * 6.6) * 14;
    ball = {
      pos: {
        x: clamp(50 + (frac(seed + minute * 4.2) - 0.5) * 48, 4, 96),
        y: clamp(50 + forwardDir * push, 4, 96),
      },
      possessor: possession,
      z: 0.1 + frac(seed + minute * 9.1) * 0.15,
    };
  }

  return { minute, possession, dots, ball };
}

function kickoffDots(homeFormation: Formation, awayFormation: Formation): DotState[] {
  const dots: DotState[] = [];
  ([homeFormation, awayFormation] as const).forEach((formation, teamIdx) => {
    const team = teamIdx as 0 | 1;
    const mirror = team === 1;
    formation.slots.forEach((slot, i) => {
      dots.push({
        id: `${team}-${i}`,
        team,
        role: slot.pos,
        pos: { x: mirror ? 100 - slot.x : slot.x, y: mirror ? 100 - slot.y : slot.y },
      });
    });
  });
  return dots;
}

/** Static shot-map data — every goal/chance event plotted at a synthesized
 *  origin, for a post-match "SofaScore-style" overlay. No live loop needed. */
export interface ShotMarker {
  minute: number;
  team: 0 | 1;
  outcome: "goal" | "chance";
  pos: Vec2;
}

export function synthesizeShotMap(result: MatchResult): ShotMarker[] {
  const seed = matchSeed(result);
  return result.events
    .filter((e) => e.type === "goal" || e.type === "chance")
    .map((e) => {
      const forwardDir = e.team === 0 ? 1 : -1;
      const depth = 68 + frac(seed + e.minute * 8.3) * 24; // shot origin, edge-of-box to close-range
      return {
        minute: e.minute,
        team: e.team,
        outcome: e.type === "goal" ? "goal" : "chance",
        pos: {
          x: clamp(50 + (frac(seed + e.minute * 3.4) - 0.5) * 56, 4, 96),
          y: clamp(50 + forwardDir * depth * 0.46, 4, 96),
        },
      };
    });
}
