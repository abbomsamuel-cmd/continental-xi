"use client";

import type { Formation, Player } from "./types";

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
  cl: ["#0a1f5c", "#050f30"],
  euro: ["#12924c", "#0c6f3b"],
  copa: ["#126a3d", "#073a20"],
};

/** cohesive card identity — mirrors the on-screen TILE map */
const CARD: Record<string, {
  frame: string; card: string; portrait: string; sil: string;
  ratingBg: string; ratingInk: string; name: string; season: string; monogram: string;
}> = {
  cl: { frame: "#8a63ff", card: "#091a44", portrait: "#132a63", sil: "rgba(180,205,255,0.22)", ratingBg: "#e7c257", ratingInk: "#08131f", name: "#eef4ff", season: "#7fb0ff", monogram: "rgba(255,255,255,0.72)" },
  euro: { frame: "#5f92ff", card: "#f4f8ff", portrait: "#d0dfff", sil: "rgba(20,45,120,0.36)", ratingBg: "#2454e6", ratingInk: "#ffffff", name: "#0a1f5e", season: "#2f6bff", monogram: "rgba(20,45,120,0.5)" },
  copa: { frame: "#e7c257", card: "#0c4a2b", portrait: "#12603a", sil: "rgba(255,235,180,0.24)", ratingBg: "#ffce4d", ratingInk: "#3a2600", name: "#fff3d8", season: "#ffdf8a", monogram: "rgba(255,255,255,0.72)" },
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** shield outline: rounded top, straight sides, tapering to a bottom point. */
function shieldPath(ctx: CanvasRenderingContext2D, l: number, t: number, w: number, h: number) {
  const r = Math.min(w * 0.13, h * 0.1);
  const notch = t + h * 0.84;
  ctx.beginPath();
  ctx.moveTo(l + r, t);
  ctx.lineTo(l + w - r, t);
  ctx.quadraticCurveTo(l + w, t, l + w, t + r);
  ctx.lineTo(l + w, notch);
  ctx.lineTo(l + w / 2, t + h);
  ctx.lineTo(l, notch);
  ctx.lineTo(l, t + r);
  ctx.quadraticCurveTo(l, t, l + r, t);
  ctx.closePath();
}

/** One broadcast shield, centred at (x,y) — mirrors the on-screen tile. */
function drawCard(ctx: CanvasRenderingContext2D, o: ShareXIOpts, p: Player, _pos: string, x: number, y: number, scale: number) {
  const variant = o.variant ?? "cl";
  const s = CARD[variant] ?? CARD.cl;
  const w = 70 * scale, h = w * 1.34;
  const left = x - w / 2, top = y - h / 2;
  const isCap = !!o.captainId && p.id === o.captainId;
  const ph = w * 0.92; // portrait height

  ctx.save();
  ctx.textAlign = "center";

  // frame (border)
  shieldPath(ctx, left - 1.5 * scale, top - 1.5 * scale, w + 3 * scale, h + 3 * scale);
  ctx.fillStyle = isCap ? "#e7c257" : s.frame; ctx.fill();
  // card fill
  shieldPath(ctx, left, top, w, h);
  ctx.fillStyle = s.card; ctx.fill();

  // portrait region (clipped to card)
  ctx.save();
  shieldPath(ctx, left, top, w, h); ctx.clip();
  const grad = ctx.createLinearGradient(0, top, 0, top + ph);
  grad.addColorStop(0, s.portrait); grad.addColorStop(1, s.card);
  ctx.fillStyle = grad; ctx.fillRect(left, top, w, ph);
  // monogram
  ctx.fillStyle = s.monogram; ctx.font = `900 ${Math.round(26 * scale)}px ${FONT}`;
  ctx.fillText(initials(p.name), x, top + ph * 0.66);
  // club-colour accent bar
  const bar = ctx.createLinearGradient(left, 0, left + w, 0);
  bar.addColorStop(0, p.colors[0]); bar.addColorStop(1, p.colors[1]);
  ctx.fillStyle = bar; ctx.fillRect(left, top + ph - 2.5 * scale, w, 2.5 * scale);
  ctx.restore();

  // rating chip
  ctx.fillStyle = s.ratingBg;
  ctx.beginPath(); ctx.roundRect(left + 5 * scale, top + 5 * scale, 21 * scale, 14 * scale, 2.5 * scale); ctx.fill();
  ctx.fillStyle = s.ratingInk; ctx.font = `900 ${Math.round(12 * scale)}px ${FONT}`;
  ctx.fillText(String(p.overall), left + 15.5 * scale, top + 15 * scale);

  // badge (crest / flag) top-right
  const bx = left + w - 18 * scale, by = top + 5 * scale;
  if (variant === "cl") {
    ctx.fillStyle = p.colors[0];
    ctx.beginPath(); ctx.roundRect(bx, by, 12 * scale, 12 * scale, 2 * scale); ctx.fill();
    ctx.fillStyle = "#f2d472"; ctx.beginPath(); ctx.arc(bx + 6 * scale, by + 6 * scale, 2.2 * scale, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = p.colors[1]; ctx.fillRect(bx, by, 15 * scale, 10 * scale);
    ctx.fillStyle = p.colors[0]; ctx.beginPath();
    ctx.moveTo(bx, by); ctx.lineTo(bx + 15 * scale, by); ctx.lineTo(bx, by + 10 * scale); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 1 * scale; ctx.strokeRect(bx, by, 15 * scale, 10 * scale);
  }

  // surname (no position — the player stands in it)
  const last = p.name.trim().split(/\s+/).pop() ?? p.name;
  ctx.fillStyle = s.name; ctx.font = `900 ${Math.round(11 * scale)}px ${FONT}`;
  ctx.fillText((last.length > 11 ? last.slice(0, 10) + "…" : last).toUpperCase(), x, top + ph + 13 * scale);
  if (p.seasonLabel) {
    ctx.fillStyle = s.season; ctx.font = `700 ${Math.round(8 * scale)}px ${FONT}`;
    ctx.fillText(p.seasonLabel, x, top + ph + 24 * scale);
  }

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
    ctx.fillText(o.url ?? "continental-xi-snowy.vercel.app", colW / 2, H - 44);

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
    ctx.fillText(o.url ?? "continental-xi-snowy.vercel.app", W / 2, H - 20);
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
