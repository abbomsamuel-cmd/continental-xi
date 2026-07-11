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
  cl: ["#0b2464", "#071a52"],
  euro: ["#128a48", "#0e7a3f"],
  copa: ["#0c6a3d", "#0a5a34"],
};

function initials(name: string): string {
  const parts = name.split(" ");
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

/** One broadcast lineup card, centred at (x,y) — mirrors the on-screen card. */
function drawCard(ctx: CanvasRenderingContext2D, o: ShareXIOpts, p: Player, pos: string, x: number, y: number, scale: number) {
  const w = 74 * scale, ph = 46 * scale, rh = 26 * scale, h = ph + rh;
  const left = x - w / 2, top = y - h / 2, r = 8 * scale;
  const variant = o.variant ?? "cl";
  const nameAccent = variant === "copa" ? "#9a6b00" : variant === "euro" ? "#1b3fd0" : "#1546c8";
  ctx.save();

  // card clip
  ctx.beginPath(); ctx.roundRect(left, top, w, h, r); ctx.clip();

  // portrait
  const grad = ctx.createLinearGradient(left, top, left + w, top + ph);
  grad.addColorStop(0, p.colors[0]); grad.addColorStop(1, p.colors[1]);
  ctx.fillStyle = grad; ctx.fillRect(left, top, w, ph);
  ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(left, top, w, ph);

  // initials
  ctx.fillStyle = "#fff"; ctx.textAlign = "center";
  ctx.font = `900 ${Math.round(20 * scale)}px ${FONT}`;
  ctx.fillText(initials(p.name), x, top + ph * 0.68);

  // rating chip
  ctx.fillStyle = "#f2d472";
  ctx.beginPath(); ctx.roundRect(left + 3 * scale, top + 3 * scale, 22 * scale, 15 * scale, 3 * scale); ctx.fill();
  ctx.fillStyle = "#08131f"; ctx.font = `900 ${Math.round(12 * scale)}px ${FONT}`;
  ctx.fillText(String(p.overall), left + 14 * scale, top + 14 * scale);

  // badge (crest / flag) top-right
  const bx = left + w - 17 * scale, by = top + 4 * scale;
  if (variant === "cl") {
    ctx.fillStyle = p.colors[0];
    ctx.beginPath(); ctx.roundRect(bx, by, 13 * scale, 13 * scale, 2 * scale); ctx.fill();
    ctx.fillStyle = "#f2d472"; ctx.beginPath(); ctx.arc(bx + 6.5 * scale, by + 6.5 * scale, 2.4 * scale, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = p.colors[1]; ctx.fillRect(bx, by, 16 * scale, 11 * scale);
    ctx.fillStyle = p.colors[0]; ctx.beginPath();
    ctx.moveTo(bx, by); ctx.lineTo(bx + 16 * scale, by); ctx.lineTo(bx, by + 11 * scale); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 1 * scale;
  ctx.strokeRect(bx, by, (variant === "cl" ? 13 : 16) * scale, (variant === "cl" ? 13 : 11) * scale);

  // white name ribbon
  ctx.fillStyle = "#f4f7ff"; ctx.fillRect(left, top + ph, w, rh);
  const last = p.name.split(" ").pop() ?? p.name;
  ctx.fillStyle = "#0a1428"; ctx.font = `800 ${Math.round(12 * scale)}px ${FONT}`;
  ctx.fillText(last.length > 11 ? last.slice(0, 10) + "…" : last, x, top + ph + 11 * scale);
  ctx.fillStyle = nameAccent; ctx.font = `700 ${Math.round(9 * scale)}px ${FONT}`;
  ctx.fillText(`${pos}${p.seasonLabel ? " · " + p.seasonLabel : ""}`, x, top + ph + 21 * scale);

  ctx.restore();

  // border
  ctx.strokeStyle = o.captainId && p.id === o.captainId ? "#f2d472" : "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1.5 * scale;
  ctx.beginPath(); ctx.roundRect(left, top, w, h, r); ctx.stroke();

  // captain badge
  if (o.captainId && p.id === o.captainId) {
    ctx.fillStyle = "#f2d472";
    ctx.beginPath(); ctx.arc(left + w - 2 * scale, top + 1 * scale, 8 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#08131f"; ctx.textAlign = "center"; ctx.font = `900 ${Math.round(10 * scale)}px ${FONT}`;
    ctx.fillText("C", left + w - 2 * scale, top + 4.5 * scale);
  }
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
  const scale = Math.min(pw, 620) / 460;
  o.formation.slots.forEach((slot, i) => {
    const p = o.players[i];
    if (!p) return;
    const x = px + ((9 + slot.x * 0.82) / 100) * pw;
    const y = py + ((9 + (100 - slot.y) * 0.8) / 100) * ph;
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
