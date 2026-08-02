/**
 * The formation coordinates in lib/formations.ts are hand-tuned so that no two
 * cards on the pitch ever overlap. This asserts that still holds — now against
 * the PROJECTED positions, since the board is drawn in perspective and cards
 * scale with depth (nearer = larger, which is where overlaps would appear).
 *
 * Geometry comes from lib/pitch-projection.ts rather than being re-declared
 * here; the two had already drifted once (12 vs 12.5cqw), which meant this
 * check was passing against a card smaller than the one that shipped.
 */
import { FORMATIONS } from "../src/lib/formations";
import { CARD_W_PCT, CARD_ASPECT, BOARD_ASPECT, projectPoint } from "../src/lib/pitch-projection";

const PITCH_W = 540;
const PITCH_H = PITCH_W / BOARD_ASPECT;

let worst = 0;
let fails = 0;

for (const f of FORMATIONS) {
  const cards = f.slots.map((sl) => {
    const p = projectPoint(sl.x, sl.y);
    // a card standing at this point is scaled by its depth
    const w = (CARD_W_PCT / 100) * PITCH_W * p.scale;
    const h = w * CARD_ASPECT;
    const cx = (p.leftPct / 100) * PITCH_W;
    const cy = (p.topPct / 100) * PITCH_H;
    return { pos: sl.pos, l: cx - w / 2, r: cx + w / 2, t: cy - h / 2, b: cy + h / 2, w, h };
  });

  for (const c of cards) {
    if (c.l < -2 || c.r > PITCH_W + 2 || c.t < -2 || c.b > PITCH_H + 2) {
      console.log(`  OUT OF BOUNDS ${f.name} ${c.pos}: l=${c.l.toFixed(0)} r=${c.r.toFixed(0)} t=${c.t.toFixed(0)} b=${c.b.toFixed(0)}`);
      fails++;
    }
  }

  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const a = cards[i], b = cards[j];
      const ox = Math.min(a.r, b.r) - Math.max(a.l, b.l);
      const oy = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      if (ox > 0 && oy > 0) {
        const area = ox * oy;
        const pct = (area / Math.min(a.w * a.h, b.w * b.h)) * 100;
        worst = Math.max(worst, pct);
        console.log(`  OVERLAP ${f.name}: ${a.pos} × ${b.pos} — ${pct.toFixed(1)}%`);
        fails++;
      }
    }
  }
}

console.log(fails === 0
  ? `\n✅ ALL ${FORMATIONS.length} FORMATIONS: zero card overlap, all in bounds (projected, ${CARD_W_PCT}cqw)`
  : `\n❌ ${fails} problems, worst overlap ${worst.toFixed(1)}%`);
process.exit(fails === 0 ? 0 : 1);
