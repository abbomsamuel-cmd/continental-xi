import { FORMATIONS } from "../src/lib/formations";

// Mirror the Pitch V6 geometry exactly.
const PITCH_W = 540;
const PITCH_H = (PITCH_W * 10) / 7; // aspect 7/10
const CARD_W_PCT = 12; // w-[12cqw]
const cardWpx = (CARD_W_PCT / 100) * PITCH_W;
const cardHpx = cardWpx * 1.28; // LineupCard aspect 1/1.28
const halfW = cardWpx / 2;
const halfH = cardHpx / 2;

const proj = (x: number, y: number) => ({
  cx: ((8 + x * 0.84) / 100) * PITCH_W,
  cy: ((5 + (100 - y) * 0.84) / 100) * PITCH_H,
});

let worst = 0;
let fails = 0;
for (const f of FORMATIONS) {
  const cards = f.slots.map((s) => {
    const { cx, cy } = proj(s.x, s.y);
    return { pos: s.pos, l: cx - halfW, r: cx + halfW, t: cy - halfH, b: cy + halfH, cx, cy };
  });
  // also flag cards escaping the pitch bounds
  for (const c of cards) {
    if (c.l < -2 || c.r > PITCH_W + 2 || c.t < -2 || c.b > PITCH_H + 2) {
      console.log(`  OUT OF BOUNDS ${f.name} ${c.pos}: l=${c.l.toFixed(0)} r=${c.r.toFixed(0)} t=${c.t.toFixed(0)} b=${c.b.toFixed(0)}`);
      fails++;
    }
  }
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const a = cards[i], b = cards[j];
      const ix = Math.min(a.r, b.r) - Math.max(a.l, b.l);
      const iy = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      if (ix > 0 && iy > 0) {
        const area = ix * iy;
        const pct = (area / (cardWpx * cardHpx)) * 100;
        worst = Math.max(worst, pct);
        console.log(`  OVERLAP ${f.name}: ${a.pos}(${f.slots[i].x},${f.slots[i].y}) × ${b.pos}(${f.slots[j].x},${f.slots[j].y}) = ${pct.toFixed(1)}% (${ix.toFixed(0)}×${iy.toFixed(0)}px)`);
        fails++;
      }
    }
  }
}
console.log(fails === 0 ? "\n✅ ALL 18 FORMATIONS: zero card overlap, all in bounds" : `\n❌ ${fails} problems, worst overlap ${worst.toFixed(1)}%`);
process.exit(fails === 0 ? 0 : 1);
