/** The shield silhouette shared by every player card (draft card, pitch
 *  tile) — a generic trading-card format (chamfered top corners, tapered
 *  point at the base), not a trace of any specific real card/logo design. */
export const SHIELD_CLIP = "polygon(10% 0%, 90% 0%, 100% 12%, 100% 72%, 50% 100%, 0% 72%, 0% 12%)";

/** Per-competition background texture behind each card's content — the same
 *  crosshatch/diamond/argyle language as the pitch's own PitchMosaic, redone
 *  as CSS repeating-gradients (not SVG defs) so dozens of card instances on
 * one screen never collide over a shared pattern id. */
export const CARD_MOSAIC: Record<"cl" | "euro" | "copa", string> = {
  cl:
    "repeating-linear-gradient(60deg, rgba(0,240,255,0.07) 0 1px, transparent 1px 14px)," +
    "repeating-linear-gradient(-60deg, rgba(0,240,255,0.07) 0 1px, transparent 1px 14px)",
  euro:
    "repeating-linear-gradient(45deg, rgba(27,63,208,0.07) 0 1px, transparent 1px 12px)," +
    "repeating-linear-gradient(-45deg, rgba(27,63,208,0.07) 0 1px, transparent 1px 12px)",
  copa:
    "repeating-linear-gradient(45deg, rgba(255,215,0,0.08) 0 1px, transparent 1px 16px)," +
    "repeating-linear-gradient(-45deg, rgba(255,215,0,0.08) 0 1px, transparent 1px 16px)",
};
