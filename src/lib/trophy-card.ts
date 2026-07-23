"use client";

import { SITE_HOST } from "./site";

/**
 * Shareable trophy card: renders the champion XI + score onto a canvas and
 * hands it to the native share sheet (mobile) or downloads it as a PNG.
 * Pure client-side — no backend, nothing leaves the device unless shared.
 */

export interface CardPlayer {
  name: string;
  position: string;
  overall?: number;
}

export interface TrophyCardOpts {
  compLabel: string;   // "CHAMPIONS LEAGUE" / "UEFA EURO" / "COPA AMÉRICA"
  title: string;       // "CHAMPIONS OF EUROPE" / "CHAMPIONS"
  teamName: string;
  scoreLine: string;   // "Guest Manager XI 2-2 Milan 2005 · pens 4-2"
  accent: string;      // competition accent
  players: CardPlayer[];
}

const W = 1080;
const H = 1350;

const GROUP_OF: Record<string, number> = {
  GK: 0,
  RB: 1, CB: 1, LB: 1, RWB: 1, LWB: 1,
  CDM: 2, CM: 2, RM: 2, LM: 2,
  CAM: 3,
  RW: 4, LW: 4, ST: 4, CF: 4,
};

function frac(n: number): number {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
}

function drawCard(ctx: CanvasRenderingContext2D, opts: TrophyCardOpts) {
  const { accent } = opts;
  const sans = "system-ui, -apple-system, 'Segoe UI', sans-serif";

  // ---- night-sky background with a golden glow ----
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0a1f52");
  bg.addColorStop(0.5, "#061a40");
  bg.addColorStop(1, "#02081b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, 210, 40, W / 2, 210, 620);
  glow.addColorStop(0, "rgba(212,175,55,0.32)");
  glow.addColorStop(1, "rgba(212,175,55,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 760);

  // confetti flecks
  const flecks = ["#d4af37", accent, "#ffffff", "#f2d472"];
  for (let i = 0; i < 90; i++) {
    ctx.save();
    ctx.translate(frac(i * 1.7) * W, frac(i * 3.1) * H * 0.9);
    ctx.rotate(frac(i * 5.3) * Math.PI);
    ctx.globalAlpha = 0.18 + frac(i * 7.9) * 0.4;
    ctx.fillStyle = flecks[i % flecks.length];
    ctx.fillRect(0, 0, 6 + frac(i * 9.1) * 8, 4 + frac(i * 11.3) * 5);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // ---- header ----
  ctx.textAlign = "center";
  ctx.fillStyle = accent;
  ctx.font = `700 30px ${sans}`;
  ctx.fillText(opts.compLabel.toUpperCase().split("").join("  "), W / 2, 96);

  ctx.font = "110px serif";
  ctx.fillText("🏆", W / 2, 224);

  const goldGrad = ctx.createLinearGradient(0, 250, 0, 330);
  goldGrad.addColorStop(0, "#f8e7a8");
  goldGrad.addColorStop(0.5, "#d4af37");
  goldGrad.addColorStop(1, "#a8842a");
  ctx.fillStyle = goldGrad;
  ctx.font = `900 84px ${sans}`;
  ctx.fillText(opts.title.toUpperCase(), W / 2, 330, W - 120);

  ctx.fillStyle = "#ffffff";
  ctx.font = `800 52px ${sans}`;
  ctx.fillText(opts.teamName, W / 2, 402, W - 140);

  // banner with the score
  ctx.font = `600 30px ${sans}`;
  const banner = opts.scoreLine;
  const bw = Math.min(W - 120, ctx.measureText(banner).width + 76);
  ctx.fillStyle = "rgba(212,175,55,0.13)";
  ctx.strokeStyle = "rgba(212,175,55,0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(W / 2 - bw / 2, 432, bw, 58, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f2d472";
  ctx.fillText(banner, W / 2, 471, W - 200);

  // ---- the pitch ----
  const px = 90, py = 540, pw = W - 180, ph = 620;
  const pitch = ctx.createLinearGradient(0, py, 0, py + ph);
  pitch.addColorStop(0, "rgba(23,90,60,0.55)");
  pitch.addColorStop(1, "rgba(10,45,32,0.65)");
  ctx.fillStyle = pitch;
  ctx.strokeStyle = "rgba(160,220,190,0.4)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, 22);
  ctx.fill();
  ctx.stroke();
  // markings: halfway line, centre circle, boxes
  ctx.beginPath();
  ctx.moveTo(px, py + ph / 2); ctx.lineTo(px + pw, py + ph / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(px + pw / 2, py + ph / 2, 64, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeRect(px + pw / 2 - 130, py, 260, 70);
  ctx.strokeRect(px + pw / 2 - 130, py + ph - 70, 260, 70);

  // ---- the XI, attackers at the top ----
  const rows: CardPlayer[][] = [[], [], [], [], []];
  for (const p of opts.players.slice(0, 11)) rows[GROUP_OF[p.position] ?? 2].push(p);
  // merge CAM row into MID when it would sit alone with nobody around it
  if (rows[3].length && rows[3].length + rows[2].length <= 5) {
    rows[2] = [...rows[2], ...rows[3]];
    rows[3] = [];
  }
  const drawnRows = rows.filter((r) => r.length > 0).reverse(); // ATT first
  const rowH = ph / (drawnRows.length + 0.4);

  drawnRows.forEach((row, ri) => {
    const y = py + rowH * (ri + 0.62);
    row.forEach((p, ci) => {
      const x = px + (pw / (row.length + 1)) * (ci + 1);
      // rating disc
      const disc = ctx.createLinearGradient(x - 34, y - 34, x + 34, y + 34);
      disc.addColorStop(0, "#f2d472");
      disc.addColorStop(1, "#b8912a");
      ctx.fillStyle = disc;
      ctx.beginPath();
      ctx.arc(x, y, 35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = "#0a1024";
      ctx.font = `900 30px ${sans}`;
      ctx.fillText(p.overall ? String(p.overall) : p.position, x, y + 11);
      // name plate
      const last = p.name.split(" ").length > 1 && p.name.length > 13
        ? p.name.split(" ").slice(-1)[0]
        : p.name;
      ctx.font = `700 23px ${sans}`;
      const nw = ctx.measureText(last).width + 26;
      ctx.fillStyle = "rgba(3,10,28,0.82)";
      ctx.beginPath();
      ctx.roundRect(x - nw / 2, y + 46, nw, 36, 9);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillText(last, x, y + 71);
    });
  });

  // ---- footer ----
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = `700 26px ${sans}`;
  ctx.fillText("CONTINENTAL XI", W / 2, H - 92);
  ctx.fillStyle = accent;
  ctx.font = `600 24px ${sans}`;
  ctx.fillText(SITE_HOST, W / 2, H - 54);
}

/** Render the card and share it (mobile share sheet) or download it as PNG. */
export async function shareTrophyCard(opts: TrophyCardOpts): Promise<"shared" | "downloaded"> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  drawCard(ctx, opts);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
  );
  const file = new File([blob], "continentalxi-champions.png", { type: "image/png" });

  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "ContinentalXI Champions" });
      return "shared";
    } catch {
      // user dismissed the sheet — fall through to download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "continentalxi-champions.png";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}
