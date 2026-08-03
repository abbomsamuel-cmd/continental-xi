/**
 * The draw podium's geometry — one definition, shared by the stage that draws
 * it (components/spinner/PodiumStage.tsx) and by scripts/podium-check.ts,
 * which asserts the arrangement actually holds. Keeping the numbers here is
 * what stops the check from validating a podium the app doesn't render.
 *
 * Coordinates are "stage-y": pixels UP from the bottom edge of the stage box.
 * A plinth is positioned by its base (its foot), and every plinth is the same
 * height — the winner reads as taller because it stands further FORWARD on
 * the podium's top face, so it sits lower on screen and is scaled up, while
 * its neighbours are set further back, higher and smaller. Nothing changes
 * height, so the whole settle stays on transform/opacity.
 */

/** plinth column width */
export const PLINTH_W = 116;
export const PLINTH_GAP = 12;
/** centre-to-centre spacing — the reel translates in whole multiples of this */
export const ITEM_W = PLINTH_W + PLINTH_GAP;

export const PLINTH_H = 188;
export const STAGE_H = 322;

/** where every plinth's foot rests while the rank is still moving */
export const FLOOR = 86;

/** the podium's elliptical top face: front edge and back edge, in stage-y */
export const FACE_NEAR = 58;
export const FACE_FAR = 106;

/** the front rim, drawn over the plinths' feet */
export const RIM_BOTTOM = 30;
export const RIM_TOP = 82;

/** lowest point of the floodlight rigs — plinths must clear it */
export const RIG_BOTTOM = 296;

// a type alias, not an interface: Framer's animate target requires an implicit
// index signature, which TypeScript only infers for aliases
export type Pose = { x: number; y: number; scale: number; opacity: number };

/**
 * Where a plinth stands once the draw has settled, by SIGNED offset from the
 * winner (negative = left of it). `y` is a CSS translate, so positive moves
 * the plinth down the screen — i.e. forward on the podium.
 */
export function podiumPose(delta: number): Pose {
  const d = Math.abs(delta);
  const dir = Math.sign(delta);
  if (d === 0) return { x: 0, y: 22, scale: 1.18, opacity: 1 };
  if (d === 1) return { x: 0, y: 0, scale: 0.9, opacity: 0.95 };
  if (d === 2) return { x: -dir * 18, y: -10, scale: 0.78, opacity: 0.72 };
  // past the podium's edge — nothing to see
  return { x: -dir * 40, y: -16, scale: 0.7, opacity: 0 };
}

/** Alternating metals across the podium, gold reserved for the winner. */
export type Finish = "gold" | "silver" | "bronze";
export function finishFor(delta: number, index: number): Finish {
  if (delta === 0) return "gold";
  return index % 2 === 0 ? "bronze" : "silver";
}

/** A settled plinth's foot and crown, in stage-y. */
export function plinthSpan(pose: Pose): { base: number; top: number } {
  const base = FLOOR - pose.y;
  return { base, top: base + PLINTH_H * pose.scale };
}

/** A settled plinth's left and right edges, relative to the winner's centre. */
export function plinthEdges(delta: number, pose: Pose): { left: number; right: number } {
  const centre = delta * ITEM_W + pose.x;
  const half = (PLINTH_W * pose.scale) / 2;
  return { left: centre - half, right: centre + half };
}
