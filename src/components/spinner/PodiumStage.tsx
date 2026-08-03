"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import {
  PLINTH_W, PLINTH_H, STAGE_H, FLOOR, FACE_NEAR, FACE_FAR, RIM_BOTTOM, RIM_TOP,
  type Finish,
} from "@/lib/podium";

/**
 * The draw stage — a lit podium in a night stadium, which every spinner in
 * the app now stands on.
 *
 * The trick that makes the winner read as "taller" is that no plinth ever
 * changes height: they all stand at the same size with their feet tucked
 * behind the podium's front rim, and the reveal only translates them. Raising
 * one lifts its top above the rest while its base stays hidden, sinking one
 * pushes its base further behind the rim. That keeps the whole settle on
 * `transform` and `opacity`, which the compositor handles on its own — no
 * layout, no repaint, so it behaves the same on a phone as on a desktop.
 *
 * Badges are the app's own generated crests. Nothing here reproduces a real
 * club's mark.
 */

export { PLINTH_W, PLINTH_GAP, ITEM_W, STAGE_H, podiumPose, finishFor } from "@/lib/podium";

const FINISH: Record<Finish, { face: string; rim: string; glow: string }> = {
  gold: {
    face: "linear-gradient(96deg,#6a4a10 0%,#f8ecc0 14%,#e0bb46 32%,#a37f22 52%,#f4d67a 72%,#7a5a13 100%)",
    rim: "rgba(255,228,150,0.95)",
    glow: "rgba(226,182,66,0.55)",
  },
  silver: {
    face: "linear-gradient(96deg,#4a5568 0%,#e8eef7 15%,#aab7c9 33%,#6f7c90 53%,#dbe4f0 72%,#525e72 100%)",
    rim: "rgba(226,238,255,0.85)",
    glow: "rgba(190,215,255,0.4)",
  },
  bronze: {
    face: "linear-gradient(96deg,#4a2f1c 0%,#e0b48a 15%,#b07c50 33%,#7a5133 53%,#d9a878 72%,#4f3320 100%)",
    rim: "rgba(240,200,160,0.8)",
    glow: "rgba(200,140,90,0.4)",
  },
};

/** Deterministic 0–1 — crowds have to render identically on server and client. */
const frac = (n: number) => {
  const x = Math.sin(n * 127.1 + 11.7) * 43758.5453;
  return x - Math.floor(x);
};

/* ------------------------------------------------------------------ */
/*  A single podium column                                             */
/* ------------------------------------------------------------------ */

export function Plinth({
  finish, badge, name, sub, lit = false, dim = false,
}: {
  finish: Finish;
  /** crest, flag, whatever the draw is picking between */
  badge: ReactNode;
  name: string;
  /** era / season line under the name */
  sub?: string;
  /** winner treatment: stronger rim light and a halo */
  lit?: boolean;
  /** cheap mode — drops the sheen layer */
  dim?: boolean;
}) {
  const f = FINISH[finish];
  const disc = PLINTH_W * 0.6;
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: PLINTH_W,
        height: PLINTH_H,
        borderRadius: `${PLINTH_W / 2}px ${PLINTH_W / 2}px 5px 5px`,
        background: f.face,
        boxShadow: [
          `inset 0 0 0 1px ${f.rim}`,
          "inset 0 3px 12px rgba(255,255,255,0.35)",
          "inset 0 -20px 26px rgba(0,0,0,0.45)",
          "0 18px 30px rgba(0,0,0,0.55)",
          lit ? `0 0 40px 6px ${f.glow}` : "",
        ].filter(Boolean).join(", "),
      }}
    >
      {/* brushed-metal specular running down the column */}
      {!dim && (
        <span aria-hidden className="absolute inset-0" style={{
          background: "linear-gradient(90deg, rgba(0,0,0,0.38) 0%, rgba(255,255,255,0.05) 18%, rgba(255,255,255,0.34) 38%, rgba(255,255,255,0.02) 58%, rgba(0,0,0,0.34) 100%)",
        }} />
      )}

      {/* badge mount, recessed into the column */}
      <span
        className="absolute left-1/2 grid place-items-center rounded-full"
        style={{
          top: "9%",
          width: disc,
          height: disc,
          transform: "translateX(-50%)",
          background: "radial-gradient(62% 62% at 50% 28%, #17253c, #050b16)",
          boxShadow: `0 0 0 2px ${f.rim}, inset 0 3px 10px rgba(0,0,0,0.85)${lit ? `, 0 0 22px ${f.glow}` : ""}`,
        }}
      >
        {badge}
      </span>

      {/* engraved name plate */}
      <span className="absolute inset-x-[9%] rounded-[3px] px-1 py-1 text-center" style={{
        top: "52%",
        background: "linear-gradient(180deg, rgba(3,8,17,0.88), rgba(3,8,17,0.6))",
        boxShadow: `inset 0 0 0 1px ${f.rim.replace(/[\d.]+\)$/, "0.45)")}`,
      }}>
        <span className="line-clamp-2 block text-[0.55rem] font-extrabold uppercase leading-[1.15] tracking-wide text-white">
          {name}
        </span>
        {sub && (
          <span className="mt-0.5 block text-[0.48rem] font-bold tracking-[0.16em]" style={{ color: f.rim }}>
            {sub}
          </span>
        )}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The stage itself                                                   */
/* ------------------------------------------------------------------ */

export function PodiumStage({
  accent, lite, children, beamAt, overlay, className = "",
}: {
  /** competition colour — tints the sky wash and the podium LED */
  accent: string;
  /** cheap mode: fewer crowd dots, no blurred beams */
  lite: boolean;
  children: ReactNode;
  /** 0–1 across the stage; a hero beam falls here once the draw settles */
  beamAt?: number;
  /** full-bleed atmosphere layer (sparks, flashes) over the podium */
  overlay?: ReactNode;
  className?: string;
}) {
  const crowd = lite ? 90 : 260;
  const rigs = [7, 26, 50, 74, 93];

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl ${className}`}
      style={{
        height: STAGE_H,
        background:
          `radial-gradient(110% 70% at 50% -6%, ${accent}2e, transparent 60%),` +
          "radial-gradient(80% 46% at 50% 6%, rgba(150,196,255,0.20), transparent 72%)," +
          "linear-gradient(180deg,#040a16 0%,#08152c 44%,#03080f 100%)",
        border: "1px solid rgba(150,196,255,0.18)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 22px 60px rgba(0,0,0,0.5)",
      }}
    >
      {/* the bowl: two decks of crowd behind the lights */}
      <svg viewBox="0 0 1000 322" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        <path d="M0,74 L1000,74 L1000,180 L0,180 Z" fill="rgba(7,15,32,0.9)" />
        <path d="M0,178 L1000,178 L1000,196 L0,196 Z" fill="rgba(4,9,20,0.95)" />
        {Array.from({ length: crowd }).map((_, i) => (
          <rect
            key={i}
            x={frac(i * 1.7) * 1000}
            y={80 + Math.pow(frac(i * 3.3), 0.8) * 92}
            width={2.4}
            height={2.4}
            fill={`hsl(${210 + frac(i * 5.1) * 40}, ${30 + frac(i * 7.7) * 40}%, ${40 + frac(i * 9.3) * 45}%)`}
            opacity={0.35 + frac(i * 11.1) * 0.5}
          />
        ))}
        {/* LED fascia between the decks */}
        <rect x="0" y="172" width="1000" height="5" fill={accent} opacity="0.35" />
        {/* pitch, running away behind the podium */}
        <path d="M0,196 L1000,196 L1000,322 L0,322 Z" fill="url(#turf)" />
        <defs>
          <linearGradient id="turf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#125f34" />
            <stop offset="100%" stopColor="#05230f" />
          </linearGradient>
        </defs>
        {Array.from({ length: 7 }).map((_, i) => (
          i % 2 === 0 ? <rect key={i} x={i * 143} y="196" width="143" height="126" fill="rgba(255,255,255,0.035)" /> : null
        ))}
      </svg>

      {/* floodlight rigs and their beams */}
      {rigs.map((x, i) => (
        <div key={x} className="pointer-events-none absolute" style={{ left: `${x}%`, top: 6, transform: "translateX(-50%)" }}>
          <span className="grid grid-cols-4 gap-[2px] rounded-[3px] p-[3px]" style={{ background: "rgba(10,18,34,0.9)", boxShadow: "0 0 18px rgba(190,225,255,0.55)" }}>
            {Array.from({ length: 12 }).map((_, k) => (
              <span key={k} className="block h-[3px] w-[5px] rounded-[1px]" style={{ background: "#e8f4ff", opacity: 0.55 + frac(i * 13 + k) * 0.45 }} />
            ))}
          </span>
        </div>
      ))}
      {rigs.map((x, i) => (
        <div
          key={`beam-${x}`}
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: `${x}%`,
            top: 16,
            width: 240,
            height: STAGE_H - 60,
            transform: "translateX(-50%)",
            background: "linear-gradient(180deg, rgba(200,232,255,0.34), rgba(190,225,255,0.07) 46%, transparent 80%)",
            clipPath: "polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)",
            filter: lite ? undefined : "blur(7px)",
            mixBlendMode: "screen",
            opacity: i === 2 ? 0.9 : 0.6,
          }}
        />
      ))}

      {/* podium — top face first, the plinths stand on it, the front rim
          covers their feet so a raised plinth reads as a taller one */}
      <div aria-hidden className="pointer-events-none absolute" style={{
        left: "4%", right: "4%", bottom: FACE_NEAR, height: FACE_FAR - FACE_NEAR,
        borderRadius: "50%",
        background: "radial-gradient(58% 130% at 50% 0%, #3c4c68, #101a29 72%)",
        boxShadow: `inset 0 8px 20px rgba(0,0,0,0.6), 0 0 30px ${accent}22`,
        zIndex: 5,
      }} />

      {/* the plinths */}
      <div className="absolute left-1/2 z-10" style={{ bottom: FLOOR }}>{children}</div>

      {/* stage edges — plinths walk out of the light rather than off a cliff */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-[15] w-24"
        style={{ background: "linear-gradient(90deg, #04091a 10%, transparent)" }} />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-[15] w-24"
        style={{ background: "linear-gradient(270deg, #04091a 10%, transparent)" }} />

      {/* podium front rim + LED strip */}
      <div aria-hidden className="pointer-events-none absolute" style={{
        left: "4%", right: "4%", bottom: RIM_BOTTOM, height: RIM_TOP - RIM_BOTTOM,
        borderRadius: "0 0 50% 50% / 0 0 40px 40px",
        background: "linear-gradient(180deg,#28344a 0%,#141d2c 46%,#070d17 100%)",
        boxShadow: "0 22px 44px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.22)",
        zIndex: 20,
      }} />
      <div aria-hidden className="pointer-events-none absolute" style={{
        left: "6%", right: "6%", bottom: RIM_TOP - 20, height: 3,
        borderRadius: "50%",
        background: accent,
        boxShadow: `0 0 16px 3px ${accent}`,
        opacity: 0.75,
        zIndex: 21,
      }} />

      {overlay && <div className="pointer-events-none absolute inset-0 z-[24]">{overlay}</div>}

      {/* a hero beam onto the winner once it's known */}
      {beamAt !== undefined && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
          style={{
            left: `${beamAt * 100}%`,
            top: 12,
            width: 260,
            height: STAGE_H - 90,
            transform: "translateX(-50%)",
            background: `linear-gradient(180deg, ${accent}55, ${accent}18 44%, transparent 82%)`,
            clipPath: "polygon(42% 0%, 58% 0%, 100% 100%, 0% 100%)",
            filter: lite ? undefined : "blur(9px)",
            mixBlendMode: "screen",
            zIndex: 22,
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Broadcast HUD across the foot of the stage                         */
/* ------------------------------------------------------------------ */

export function StageHud({
  left, label, right, progressMs, accent, style,
}: {
  /** left readout, e.g. { k: "OVR", v: "87" } */
  left?: { k: string; v: string };
  label: string;
  right?: { k: string; v: string };
  /** fills over this many ms; omit for a static bar */
  progressMs?: number;
  accent: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className="absolute inset-x-3 bottom-3 z-30 overflow-hidden rounded-xl sm:inset-x-10"
      style={{
        background: "linear-gradient(180deg, rgba(6,12,24,0.94), rgba(3,7,15,0.94))",
        boxShadow: `inset 0 0 0 1px ${accent}55, 0 10px 26px rgba(0,0,0,0.6)`,
        ...style,
      }}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-1.5">
        <span className="flex shrink-0 items-baseline gap-1">
          {left && (
            <>
              <span className="text-[0.44rem] font-bold uppercase tracking-[0.22em] text-white/45">{left.k}</span>
              <span className="font-display text-base font-black leading-none text-white">{left.v}</span>
            </>
          )}
        </span>
        <span className="cl-heading truncate text-[0.6rem] font-black uppercase tracking-[0.3em] text-white">
          {label}
        </span>
        <span className="flex shrink-0 items-baseline gap-1">
          {right && (
            <>
              <span className="text-[0.44rem] font-bold uppercase tracking-[0.22em] text-white/45">{right.k}</span>
              <span className="font-display text-sm font-black leading-none text-white">{right.v}</span>
            </>
          )}
        </span>
      </div>
      <div className="h-[3px] w-full bg-white/8">
        <motion.div
          className="h-full"
          style={{ background: `linear-gradient(90deg, ${accent}, #ffffff)`, boxShadow: `0 0 10px ${accent}` }}
          initial={{ width: progressMs ? "0%" : "100%" }}
          animate={{ width: "100%" }}
          transition={{ duration: (progressMs ?? 0) / 1000, ease: "linear" }}
        />
      </div>
    </div>
  );
}
