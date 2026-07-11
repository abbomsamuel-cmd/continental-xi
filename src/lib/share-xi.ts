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
  url?: string;
}

const FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";

function drawPitchWithXI(
  ctx: CanvasRenderingContext2D,
  o: ShareXIOpts,
  px: number, py: number, pw: number, ph: number,
) {
  // pitch panel
  const grass = ctx.createLinearGradient(0, py, 0, py + ph);
  grass.addColorStop(0, "rgba(24,84,58,0.55)");
  grass.addColorStop(1, "rgba(9,40,28,0.7)");
  ctx.fillStyle = grass;
  ctx.strokeStyle = "rgba(170,225,195,0.45)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, 20);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, 20);
  ctx.clip();
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(px, py + ph / 2); ctx.lineTo(px + pw, py + ph / 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(px + pw / 2, py + ph / 2, ph * 0.1, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeRect(px + pw * 0.28, py, pw * 0.44, ph * 0.11);
  ctx.strokeRect(px + pw * 0.28, py + ph * 0.89, pw * 0.44, ph * 0.11);
  ctx.restore();

  // players at their true formation coordinates (attack at the top)
  const scale = Math.min(pw, 560) / 400; // disc sizing tuned per canvas width
  o.formation.slots.forEach((slot, i) => {
    const p = o.players[i];
    if (!p) return;
    const x = px + (slot.x / 100) * (pw * 0.86) + pw * 0.07;
    const y = py + ((100 - slot.y) / 100) * (ph * 0.82) + ph * 0.06;
    const r = 30 * scale;

    const disc = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    disc.addColorStop(0, p.colors[0]);
    disc.addColorStop(1, p.colors[1]);
    ctx.fillStyle = disc;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = `900 ${Math.round(19 * scale)}px ${FONT}`;
    ctx.fillText(String(p.overall), x, y + 7 * scale);

    // captain armband
    if (o.captainId && p.id === o.captainId) {
      ctx.fillStyle = "#f2d472";
      ctx.beginPath(); ctx.arc(x + r * 0.75, y - r * 0.75, 11 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#041022";
      ctx.font = `900 ${Math.round(13 * scale)}px ${FONT}`;
      ctx.fillText("C", x + r * 0.75, y - r * 0.75 + 4.5 * scale);
    }

    // name plate
    const last = p.name.split(" ").length > 1 && p.name.length > 12 ? p.name.split(" ").slice(-1)[0] : p.name;
    ctx.font = `700 ${Math.round(15 * scale)}px ${FONT}`;
    const nw = ctx.measureText(last).width + 18;
    ctx.fillStyle = "rgba(3,10,28,0.85)";
    ctx.beginPath(); ctx.roundRect(x - nw / 2, y + r + 4, nw, 24 * scale, 7); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(last, x, y + r + 4 + 17 * scale);
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
