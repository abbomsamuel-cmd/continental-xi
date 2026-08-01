"use client";

import type { Formation, Player } from "./types";
import { flagFor } from "./flags";
import { SITE_HOST } from "./site";

/**
 * Share XI — renders the finished lineup as a social image in three formats.
 * Pure client-side canvas; nothing leaves the device unless the user shares.
 */

export type ShareFormat = "square" | "landscape" | "portrait";

const SIZES: Record<ShareFormat, [number, number]> = {
  square: [1080, 1080],
  landscape: [1200, 675],
  portrait: [1080, 1350],
};

export interface ShareXIOpts {
  compLabel: string;      // "CHAMPIONS LEAGUE" / "UEFA EURO" / "COPA AMÉRICA"
  teamName: string;
  formation: Formation;
  players: (Player | null)[];
  captainId?: string | null;
  overall: number;
  tacticName?: string;
  accent: string;
  accent2: string;
  /** deep background pair per competition */
  bg: [string, string];
  /** competition identity for the pitch colour + badge style */
  variant?: "cl" | "euro" | "copa";
  url?: string;
}

const FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";

const GRASS: Record<string, [string, string]> = {
  cl: ["#0f172a", "#07090e"],
  euro: ["#12924c", "#0c6f3b"],
  copa: ["#126a3d", "#073a20"],
};

/** cohesive card identity — mirrors the on-screen V5 broadcast tile */
const CARD: Record<string, {
  radius: number; card0: string; card1: string; border: string;
  rating0: string; rating1: string; ratingInk: string;
  pos: string; name: string; season: string; hairline: string; accent0: string; accent1: string;
}> = {
  cl: {
    radius: 0.045, card0: "#182233", card1: "#0a0e17", border: "rgba(0,240,255,0.55)",
    rating0: "#baffff", rating1: "#00f0ff", ratingInk: "#04222b",
    pos: "#93e8ff", name: "#f4f7ff", season: "#9db9f5", hairline: "rgba(215,228,255,0.55)", accent0: "#1b3fd0", accent1: "#00f0ff",
  },
  euro: {
    radius: 0.13, card0: "#ffffff", card1: "#e9eefb", border: "rgba(255,59,87,0.6)",
    rating0: "#3a6cf0", rating1: "#1b3fd0", ratingInk: "#ffffff",
    pos: "#1b3fd0", name: "#0c1f60", season: "#41569e", hairline: "rgba(140,155,185,0.55)", accent0: "#1b3fd0", accent1: "#ff3b57",
  },
  copa: {
    radius: 0.08, card0: "#0f5a33", card1: "#062d18", border: "rgba(255,215,0,0.8)",
    rating0: "#fff2c0", rating1: "#ffd700", ratingInk: "#2a1d03",
    pos: "#7dffc4", name: "#fff8e8", season: "#f0cf8f", hairline: "rgba(255,215,0,0.5)", accent0: "#ffd700", accent1: "#00e676",
  },
};

/** One V5 broadcast tile, centred at (x,y) — mirrors the on-screen card. */
function drawCard(ctx: CanvasRenderingContext2D, o: ShareXIOpts, p: Player, pos: string, x: number, y: number, scale: number) {
  const variant = o.variant ?? "cl";
  const s = CARD[variant] ?? CARD.cl;
  const w = 74 * scale, h = w * 1.28;
  const left = x - w / 2, top = y - h / 2;
  const r = w * s.radius * (variant === "euro" ? 1 : 1.6); // px radius from the cqw-ish ratio
  const isCap = !!o.captainId && p.id === o.captainId;

  ctx.save();
  ctx.textAlign = "center";

  // soft realistic shadow under the tile
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 10 * scale; ctx.shadowOffsetY = 4 * scale;
  const bgGrad = ctx.createLinearGradient(0, top, 0, top + h);
  bgGrad.addColorStop(0, s.card0); bgGrad.addColorStop(1, s.card1);
  ctx.fillStyle = bgGrad;
  ctx.beginPath(); ctx.roundRect(left, top, w, h, r); ctx.fill();
  ctx.restore();

  // thin premium border (gold for the captain)
  ctx.strokeStyle = isCap ? "rgba(228,190,90,0.95)" : s.border; ctx.lineWidth = 1.2 * scale;
  ctx.beginPath(); ctx.roundRect(left, top, w, h, r); ctx.stroke();

  // everything else clips to the tile
  ctx.save();
  ctx.beginPath(); ctx.roundRect(left, top, w, h, r); ctx.clip();

  // docked rating tab, chamfered bottom-right — the V5 mark
  const tw = 23 * scale, th = 17 * scale;
  const tab = ctx.createLinearGradient(left, top, left, top + th);
  tab.addColorStop(0, s.rating0); tab.addColorStop(1, s.rating1);
  ctx.fillStyle = tab;
  ctx.beginPath();
  ctx.moveTo(left, top); ctx.lineTo(left + tw, top); ctx.lineTo(left + tw, top + th * 0.6);
  ctx.lineTo(left + tw * 0.78, top + th); ctx.lineTo(left, top + th); ctx.closePath(); ctx.fill();
  ctx.fillStyle = s.ratingInk; ctx.font = `900 ${Math.round(12.5 * scale)}px ${FONT}`;
  ctx.fillText(String(p.overall), left + tw / 2 - 1 * scale, top + th * 0.72);

  // position top centre
  ctx.fillStyle = s.pos; ctx.font = `900 ${Math.round(8.5 * scale)}px ${FONT}`;
  ctx.fillText(pos.toUpperCase(), x, top + 9.5 * scale);

  // nation flag + crest top right
  const flag = flagFor(p.nationality);
  const fx = left + w - 10 * scale;
  if (flag) {
    ctx.font = `${Math.round(8.5 * scale)}px ${FONT}`;
    ctx.fillText(flag, fx, top + 9.5 * scale);
  }
  if (variant === "cl") {
    const bx = fx - 5 * scale, by = top + (flag ? 13 : 5) * scale;
    ctx.fillStyle = p.colors[0];
    ctx.beginPath(); ctx.roundRect(bx, by, 10 * scale, 10 * scale, 2 * scale); ctx.fill();
    ctx.fillStyle = p.colors[1];
    ctx.beginPath(); ctx.moveTo(bx + 10 * scale, by); ctx.lineTo(bx + 10 * scale, by + 10 * scale); ctx.lineTo(bx, by + 10 * scale); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#f2d472"; ctx.beginPath(); ctx.arc(bx + 5 * scale, by + 5 * scale, 1.8 * scale, 0, Math.PI * 2); ctx.fill();
  } else if (!flag) {
    const bx = fx - 7 * scale, by = top + 5 * scale;
    ctx.fillStyle = p.colors[1]; ctx.fillRect(bx, by, 14 * scale, 9.5 * scale);
    ctx.fillStyle = p.colors[0]; ctx.beginPath();
    ctx.moveTo(bx, by); ctx.lineTo(bx + 14 * scale, by); ctx.lineTo(bx, by + 9.5 * scale); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 1 * scale; ctx.strokeRect(bx, by, 14 * scale, 9.5 * scale);
  }

  // surname — the largest element, auto-shrinking
  const last = (p.name.trim().split(/\s+/).pop() ?? p.name).toUpperCase();
  const nameSize = last.length > 13 ? 9 : last.length > 10 ? 10.5 : last.length > 7 ? 12 : 14;
  ctx.fillStyle = s.name; ctx.font = `900 ${Math.round(nameSize * scale)}px ${FONT}`;
  ctx.fillText(last, x, top + h * 0.58, w - 6 * scale);

  // hairline divider + season + competition baseline
  ctx.strokeStyle = s.hairline; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x - w * 0.28, top + h * 0.74); ctx.lineTo(x + w * 0.28, top + h * 0.74); ctx.stroke();
  if (p.seasonLabel) {
    ctx.fillStyle = s.season; ctx.font = `700 ${Math.round(6.8 * scale)}px ${FONT}`;
    ctx.fillText(p.seasonLabel, x, top + h * 0.87);
  }
  const bar = ctx.createLinearGradient(left, 0, left + w, 0);
  bar.addColorStop(0, s.accent0); bar.addColorStop(1, s.accent1);
  ctx.fillStyle = bar; ctx.fillRect(left, top + h - 2.2 * scale, w, 2.2 * scale);
  ctx.restore();

  // captain badge
  if (isCap) {
    ctx.fillStyle = "#f2d472";
    ctx.beginPath(); ctx.arc(left + w - 1 * scale, top + 1 * scale, 8 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#08131f"; ctx.font = `900 ${Math.round(10 * scale)}px ${FONT}`;
    ctx.fillText("C", left + w - 1 * scale, top + 4.5 * scale);
  }
  ctx.restore();
}

function drawPitchWithXI(
  ctx: CanvasRenderingContext2D,
  o: ShareXIOpts,
  px: number, py: number, pw: number, ph: number,
) {
  const variant = o.variant ?? "cl";
  const [g0, g1] = GRASS[variant] ?? GRASS.cl;
  // pitch panel — competition-coloured grass stripes
  ctx.save();
  ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 20); ctx.clip();
  const grass = ctx.createLinearGradient(0, py, 0, py + ph);
  grass.addColorStop(0, g0); grass.addColorStop(1, g1);
  ctx.fillStyle = grass; ctx.fillRect(px, py, pw, ph);
  // stripes
  ctx.fillStyle = "rgba(255,255,255,0.035)";
  for (let s = 0; s < ph; s += ph / 8) ctx.fillRect(px, py + s, pw, ph / 16);
  // markings
  const lineCol = variant === "cl" ? "rgba(190,215,255,0.4)" : variant === "euro" ? "rgba(255,255,255,0.5)" : "rgba(255,236,190,0.5)";
  ctx.strokeStyle = lineCol; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(px, py + ph / 2); ctx.lineTo(px + pw, py + ph / 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(px + pw / 2, py + ph / 2, ph * 0.1, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeRect(px + pw * 0.28, py, pw * 0.44, ph * 0.11);
  ctx.strokeRect(px + pw * 0.28, py + ph * 0.89, pw * 0.44, ph * 0.11);
  ctx.restore();
  ctx.strokeStyle = `${o.accent}88`; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 20); ctx.stroke();

  // players at their true formation coordinates (same inset as the live pitch)
  const scale = Math.min(pw, 620) / 470;
  o.formation.slots.forEach((slot, i) => {
    const p = o.players[i];
    if (!p) return;
    const x = px + ((8 + slot.x * 0.84) / 100) * pw;
    const y = py + ((6 + (100 - slot.y) * 0.8) / 100) * ph;
    drawCard(ctx, o, p, slot.pos, x, y, scale);
  });
}

function drawXI(ctx: CanvasRenderingContext2D, o: ShareXIOpts, W: number, H: number) {
  // background in the competition's colours
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, o.bg[0]);
  bg.addColorStop(1, o.bg[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 0, 40, W / 2, 0, H * 0.6);
  glow.addColorStop(0, `${o.accent}30`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H * 0.62);

  ctx.textAlign = "center";
  const landscape = W > H;

  if (landscape) {
    // header column left, pitch right
    const colW = W * 0.42;
    ctx.fillStyle = o.accent;
    ctx.font = `700 26px ${FONT}`;
    ctx.fillText(o.compLabel.toUpperCase().split("").join(" "), colW / 2, 84);
    ctx.fillStyle = "#fff";
    ctx.font = `900 52px ${FONT}`;
    ctx.fillText(o.teamName, colW / 2, 150, colW - 60);
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = `700 26px ${FONT}`;
    ctx.fillText(`${o.formation.name}${o.tacticName ? ` · ${o.tacticName}` : ""}`, colW / 2, 196);

    ctx.font = `900 170px ${FONT}`;
    const goldGrad = ctx.createLinearGradient(0, 250, 0, 420);
    goldGrad.addColorStop(0, "#f8e7a8");
    goldGrad.addColorStop(1, "#b8912a");
    ctx.fillStyle = goldGrad;
    ctx.fillText(String(o.overall), colW / 2, 420);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = `700 22px ${FONT}`;
    ctx.fillText("TEAM OVERALL", colW / 2, 456);

    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = `700 22px ${FONT}`;
    ctx.fillText("CONTINENTAL XI", colW / 2, H - 76);
    ctx.fillStyle = o.accent;
    ctx.font = `600 20px ${FONT}`;
    ctx.fillText(o.url ?? SITE_HOST, colW / 2, H - 44);

    drawPitchWithXI(ctx, o, colW + 20, 36, W - colW - 60, H - 72);
  } else {
    ctx.fillStyle = o.accent;
    ctx.font = `700 30px ${FONT}`;
    ctx.fillText(o.compLabel.toUpperCase().split("").join(" "), W / 2, 76);
    ctx.fillStyle = "#fff";
    ctx.font = `900 62px ${FONT}`;
    ctx.fillText(o.teamName, W / 2, 148, W - 120);
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = `700 28px ${FONT}`;
    ctx.fillText(
      `${o.formation.name}${o.tacticName ? ` · ${o.tacticName}` : ""} · OVR ${o.overall}`,
      W / 2, 196,
    );

    const ph = H - 320;
    drawPitchWithXI(ctx, o, 70, 232, W - 140, ph);

    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = `700 24px ${FONT}`;
    ctx.fillText("CONTINENTAL XI", W / 2, H - 52);
    ctx.fillStyle = o.accent;
    ctx.font = `600 22px ${FONT}`;
    ctx.fillText(o.url ?? SITE_HOST, W / 2, H - 20);
  }
}

/** Render + hand off: native share sheet when available, else PNG download. */
export async function shareXI(opts: ShareXIOpts, format: ShareFormat): Promise<"shared" | "downloaded"> {
  const [W, H] = SIZES[format];
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  drawXI(canvas.getContext("2d")!, opts, W, H);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
  );
  const file = new File([blob], `continentalxi-lineup-${format}.png`, { type: "image/png" });
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "My Continental XI" });
      return "shared";
    } catch { /* dismissed — fall through */ }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}
