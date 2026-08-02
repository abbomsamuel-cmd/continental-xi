/**
 * The pitch's ground-plane projection.
 *
 * The tactical board is drawn in perspective: the far end (attack) recedes
 * toward a horizon, so the touchlines converge, the centre circle reads as an
 * ellipse, and cards deeper up the pitch sit closer together and render
 * slightly smaller. That's what makes the board look like grass you're
 * standing over rather than a flat diagram.
 *
 * Everything that needs to agree on where a slot lands — the card layer, the
 * painted markings, the chemistry lines, and scripts/overlap-check.ts — goes
 * through this module. It used to be duplicated between the component and the
 * check, and they had already drifted (the component rendered 12.5cqw cards
 * while the check validated 12cqw ones), so the invariant was being verified
 * against a card 4% smaller than the one that shipped.
 *
 * Tactical coordinates are the formation ones: x 0-100 left→right, y 0-100
 * with y=0 at your own goal (nearest the viewer) and y=100 at the opponent's.
 */

/** Card width as a percentage of board width, at the near plane (scale 1). */
export const CARD_W_PCT = 12.5;
/** LineupCard's aspect: height = width × this. */
export const CARD_ASPECT = 1.28;
/** Board aspect (width / height). */
export const BOARD_ASPECT = 7 / 10;

/* --- projection constants (tuned against overlap-check; see notes below) --- */

/** Depth strength. Higher = more aggressive convergence toward the horizon.
 *  Raising this squeezes the far end and risks overlaps up the pitch.
 *  These five values were picked by searching the space against
 *  scripts/overlap-check.ts: this is the most pronounced perspective that
 *  still holds zero overlap across all 18 formations. Change one and re-run
 *  `npx tsx scripts/overlap-check.ts` before trusting it. */
const K = 0.30;
/** Screen % (from top) of the near touchline (y=0) and the far one (y=100). */
const Y_NEAR = 94;
const Y_FAR = 4;
/** Horizontal half-spread at the near plane. */
const X_SPREAD = 0.84;
/** Card scale at the near and far planes. */
const SCALE_NEAR = 0.98;
const SCALE_FAR = 0.88;

/** Perspective foreshortening at depth t ∈ [0,1]; s(0)=1 at the near plane. */
const s = (t: number) => 1 / (1 + K * t);
const S_FAR = s(1);

export interface Projected {
  /** % from the left edge of the board. */
  leftPct: number;
  /** % from the top edge of the board. */
  topPct: number;
  /** Size multiplier for anything standing at this point. */
  scale: number;
  /** 0 at the near touchline, 1 at the far one — handy for z-ordering. */
  depth: number;
}

/** Project a tactical coordinate onto the board. */
export function projectPoint(x: number, y: number): Projected {
  const t = Math.max(0, Math.min(1, y / 100));
  const f = s(t);
  // normalised so depth runs 0→1 across the pitch regardless of K
  const depth = (1 - f) / (1 - S_FAR);
  return {
    leftPct: 50 + (x - 50) * X_SPREAD * f,
    topPct: Y_NEAR - (Y_NEAR - Y_FAR) * depth,
    scale: SCALE_NEAR + (SCALE_FAR - SCALE_NEAR) * depth,
    depth,
  };
}

/** Same projection, formatted for CSS positioning. */
export function projectSlot(x: number, y: number): { left: string; top: string; scale: number; depth: number } {
  const p = projectPoint(x, y);
  return { left: `${p.leftPct}%`, top: `${p.topPct}%`, scale: p.scale, depth: p.depth };
}

/** Project a run of points into an SVG polygon/polyline `points` string, in
 *  the 0-100 × 0-100 viewBox the markings layer uses. */
export function projectPath(pts: [number, number][]): string {
  return pts.map(([x, y]) => {
    const p = projectPoint(x, y);
    return `${p.leftPct.toFixed(2)},${p.topPct.toFixed(2)}`;
  }).join(" ");
}
