"use client";

import { SITE_HOST } from "../site";

/**
 * Shareable Legacy Card — renders a finished career onto a portrait canvas and
 * hands it to the native share sheet (mobile) or downloads it as a PNG. Pure
 * client-side: no backend, nothing leaves the device unless the player shares.
 * Modelled on trophy-card.ts so the two share flows behave identically.
 */

export interface LegacyRecord {
  label: string;
  value: string;
}

export interface LegacyBar {
  label: string;
  points: number;
  max: number;
}

export interface LegacyCardOpts {
  name: string;
  subtitle: string;      // "Brazil · ST · Retired at 37"
  title: string;         // legacy tier title, e.g. "FOOTBALL LEGEND"
  score: number;         // 0–100
  peakOverall: number;
  accent: string;        // tier accent colour
  records: LegacyRecord[];   // up to 6 headline records
  trophyLine: string;    // "14 major honours"
  breakdown: LegacyBar[];    // factor rows (top 8 shown)
}

const W = 1080;
const H = 1350;
const SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif";

function frac(n: number): number {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
}

function roundedBar(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawCard(ctx: CanvasRenderingContext2D, o: LegacyCardOpts) {
  const { accent } = o;

  // ---- deep night background with a tier-coloured glow ----
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0c1230");
  bg.addColorStop(0.5, "#070d22");
  bg.addColorStop(1, "#02050f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, 250, 40, W / 2, 250, 660);
  glow.addColorStop(0, `${accent}44`);
  glow.addColorStop(1, `${accent}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 820);

  // faint confetti flecks
  const flecks = [accent, "#d4af37", "#ffffff", "#f2d472"];
  for (let i = 0; i < 70; i++) {
    ctx.save();
    ctx.translate(frac(i * 1.7) * W, frac(i * 3.1) * H * 0.92);
    ctx.rotate(frac(i * 5.3) * Math.PI);
    ctx.globalAlpha = 0.12 + frac(i * 7.9) * 0.32;
    ctx.fillStyle = flecks[i % flecks.length];
    ctx.fillRect(0, 0, 5 + frac(i * 9.1) * 7, 4 + frac(i * 11.3) * 4);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // ---- header ----
  ctx.textAlign = "center";
  ctx.fillStyle = accent;
  ctx.font = `700 30px ${SANS}`;
  ctx.fillText("CAREER  LEGACY", W / 2, 108);

  // player name
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 90px ${SANS}`;
  ctx.fillText(o.name, W / 2, 200, W - 120);

  // subtitle
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = `600 34px ${SANS}`;
  ctx.fillText(o.subtitle, W / 2, 252, W - 140);

  // ---- legacy title in a tier-gradient ----
  const tg = ctx.createLinearGradient(0, 300, 0, 384);
  tg.addColorStop(0, "#ffffff");
  tg.addColorStop(1, accent);
  ctx.fillStyle = tg;
  ctx.font = `900 78px ${SANS}`;
  ctx.fillText(o.title.toUpperCase(), W / 2, 372, W - 100);

  // ---- score dial ----
  const cx = W / 2, cy = 540, R = 118;
  ctx.lineWidth = 20;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  const frac01 = Math.max(0, Math.min(1, o.score / 100));
  const ring = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  ring.addColorStop(0, accent);
  ring.addColorStop(1, "#f2d472");
  ctx.strokeStyle = ring;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + frac01 * Math.PI * 2);
  ctx.stroke();
  ctx.lineCap = "butt";
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 92px ${SANS}`;
  ctx.fillText(String(o.score), cx, cy + 20);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `700 26px ${SANS}`;
  ctx.fillText("LEGACY SCORE", cx, cy + 66);
  // peak-overall chip beside the dial
  ctx.fillStyle = accent;
  ctx.font = `700 26px ${SANS}`;
  ctx.fillText(`PEAK OVR ${o.peakOverall}  ·  ${o.trophyLine.toUpperCase()}`, cx, cy + 150);

  // ---- headline records, three per row ----
  const recs = o.records.slice(0, 6);
  const gx = 80, gw = W - 160, cellW = gw / 3, ry = 760, cellH = 118;
  recs.forEach((r, i) => {
    const col = i % 3, rowI = Math.floor(i / 3);
    const x = gx + col * cellW, y = ry + rowI * (cellH + 16);
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    roundedBar(ctx, x + 8, y, cellW - 16, cellH, 18);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `900 52px ${SANS}`;
    ctx.fillText(r.value, x + cellW / 2, y + 62, cellW - 30);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = `700 22px ${SANS}`;
    ctx.fillText(r.label.toUpperCase(), x + cellW / 2, y + 96, cellW - 26);
  });

  // ---- factor breakdown bars ----
  const bars = o.breakdown.slice(0, 8);
  const bx = 96, bw = W - 300, byTop = 1030, rowGap = 34;
  ctx.textAlign = "left";
  bars.forEach((b, i) => {
    const y = byTop + i * rowGap;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = `600 22px ${SANS}`;
    ctx.fillText(b.label, bx, y + 4);
    const trackX = bx + 300, trackW = bw - 300;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundedBar(ctx, trackX, y - 13, trackW, 16, 8);
    ctx.fill();
    const p = b.max > 0 ? Math.max(0, Math.min(1, b.points / b.max)) : 0;
    const bar = ctx.createLinearGradient(trackX, 0, trackX + trackW, 0);
    bar.addColorStop(0, accent);
    bar.addColorStop(1, "#f2d472");
    ctx.fillStyle = bar;
    if (p > 0) {
      roundedBar(ctx, trackX, y - 13, Math.max(10, trackW * p), 16, 8);
      ctx.fill();
    }
  });

  // ---- footer ----
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = `700 26px ${SANS}`;
  ctx.fillText("CONTINENTAL XI  ·  CAREER MODE", W / 2, H - 60);
  ctx.fillStyle = accent;
  ctx.font = `600 24px ${SANS}`;
  ctx.fillText(SITE_HOST, W / 2, H - 26);
}

/** Render the Legacy Card and share it (mobile share sheet) or download a PNG. */
export async function shareLegacyCard(opts: LegacyCardOpts): Promise<"shared" | "downloaded"> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  drawCard(canvas.getContext("2d")!, opts);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
  );
  const safe = opts.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "career";
  const file = new File([blob], `continentalxi-legacy-${safe}.png`, { type: "image/png" });

  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `${opts.name} — Career Legacy` });
      return "shared";
    } catch {
      // dismissed — fall through to download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}
