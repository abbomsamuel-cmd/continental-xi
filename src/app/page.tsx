"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { CameraFlashes } from "@/components/fx/Atmosphere";
import { TeamBadge } from "@/components/TeamBadge";
import { ReportBug } from "@/components/ReportBug";
import { TrophyArt, type TrophyId } from "@/components/career/TrophyArt";
import { useGame } from "@/lib/store";
import { useCurrentPlayer } from "@/lib/career/store";
import { useHydrated } from "@/lib/useHydrated";
import { fxCount } from "@/lib/fx";
import { useT } from "@/lib/i18n";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { play } from "@/lib/sound";
import { getAllPlayers, SQUADS } from "@/lib/players";
import { USER_TEAM_ID, teamLabel } from "@/lib/engine/tournament";

/* ------------------------------------------------------------------ */
/*  The pitch hero — you're standing on the grass, kickoff spot, with   */
/*  the stands as a thin band overhead and the game modes as glowing    */
/*  markers scattered around you, like a game's own hub menu.           */
/* ------------------------------------------------------------------ */
// the stand roofline for the thin top band only — same tall-edges,
// dipping-corners shape as before, just cropped to a shorter strip
const STAND_ROOFLINE = "M-40 260 L-40 30 Q 130 55 260 95 Q 430 55 600 50 Q 770 55 940 95 Q 1070 55 1200 30 L1200 260 Z";
const STAND_ROOFLINE_STROKE = "M-40 30 Q 130 55 260 95 Q 430 55 600 50 Q 770 55 940 95 Q 1070 55 1200 30";

/** The roofline curve pushed down by `o` — used for the tier steps, so
 *  every deck follows the same sweep as the roof above it. */
function tierLine(o: number): string {
  return `M-40 ${30 + o} Q 130 ${55 + o} 260 ${95 + o} Q 430 ${55 + o} 600 ${50 + o} Q 770 ${55 + o} 940 ${95 + o} Q 1070 ${55 + o} 1200 ${30 + o}`;
}

function StandBand() {
  // the crowd has to fill the WHOLE bowl, right down to the pitch edge —
  // scattering it only across the upper rows leaves the lower decks
  // looking like empty navy paint
  const crowd = useMemo(() => {
    const rng = (seed: number) => { const x = Math.sin(seed * 999) * 43758.5453; return x - Math.floor(x); };
    const tint = ["rgba(226,236,252,0.62)", "rgba(196,214,242,0.55)", "rgba(255,246,224,0.45)"];
    return Array.from({ length: fxCount(460) }, (_, i) => {
      const x = rng(i + 50) * 1280 - 40;
      // biased toward the lower decks, which sit nearer the camera
      const y = 46 + Math.pow(rng(i), 0.78) * 206;
      return {
        x, y,
        r: 0.9 + rng(i + 90) * 1.15,
        d: 2 + rng(i + 130) * 4,
        delay: rng(i + 170) * 5,
        fill: tint[i % tint.length],
      };
    });
  }, []);
  const roofLights = useMemo(() => {
    const rng = (seed: number) => { const x = Math.sin(seed * 741) * 24298.331; return x - Math.floor(x); };
    return Array.from({ length: 14 }, (_, i) => {
      const x = -20 + (i / 13) * 1240;
      const k = Math.abs((x - 600) / 640);
      const y = 8 + Math.sin(k * Math.PI * 1.4) * 22 + k * 10;
      return { x, y, delay: rng(i) * 6 };
    });
  }, []);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[31%] min-h-[150px] overflow-hidden" aria-hidden>
      <svg viewBox="0 0 1200 260" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-full w-full">
        <defs>
          <linearGradient id="standsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0e2740" /><stop offset="100%" stopColor="#050d17" />
          </linearGradient>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(235,245,255,0.38)" /><stop offset="100%" stopColor="rgba(235,245,255,0)" />
          </linearGradient>
          <linearGradient id="ledGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(0,240,255,0.15)" /><stop offset="50%" stopColor="rgba(0,240,255,0.85)" /><stop offset="100%" stopColor="rgba(0,240,255,0.15)" />
          </linearGradient>
          <clipPath id="standClip"><path d={STAND_ROOFLINE} /></clipPath>
          <clipPath id="roofClip"><path d="M-40 0 L1240 0 L1200 30 Q 1070 55 940 95 Q 770 55 600 50 Q 430 55 260 95 Q 130 55 -40 30 Z" /></clipPath>
        </defs>

        <path d="M-40 0 L1240 0 L1200 30 Q 1070 55 940 95 Q 770 55 600 50 Q 430 55 260 95 Q 130 55 -40 30 Z" fill="url(#skyGrad)" opacity="0.5" />
        <g clipPath="url(#roofClip)" stroke="#dfeeff" strokeWidth="1" opacity="0.12">
          {Array.from({ length: 13 }).map((_, i) => {
            const x = -80 + i * 110;
            return <line key={i} x1={x} y1={-10} x2={x + 150} y2={120} />;
          })}
        </g>

        <path d={STAND_ROOFLINE} fill="url(#standsGrad)" />
        <path d={STAND_ROOFLINE_STROKE} stroke="url(#ledGrad)" strokeWidth="5" fill="none" opacity="0.8" className="led-sweep" />

        {roofLights.map((l, i) => (
          <circle key={i} cx={l.x} cy={l.y} r={2} fill="#dfeeff" style={{ animation: "floodFlicker 7s linear infinite", animationDelay: `${l.delay}s` }} />
        ))}

        {/* the seating decks, each following the roof's sweep */}
        <g clipPath="url(#standClip)">
          {[58, 112, 168].map((o) => (
            <path key={o} d={tierLine(o)} stroke="rgba(10,20,36,0.85)" strokeWidth="7" fill="none" />
          ))}
          {[58, 112, 168].map((o) => (
            <path key={`hi-${o}`} d={tierLine(o - 3)} stroke="rgba(148,178,220,0.16)" strokeWidth="1.5" fill="none" />
          ))}
        </g>

        <g clipPath="url(#standClip)">
          {crowd.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.fill}
              style={{ animation: `crowdFlicker ${d.d}s ease-in-out infinite`, animationDelay: `${d.delay}s` }} />
          ))}
        </g>

        {/* the lit fascia ring above the pitch, and the dark wall below it */}
        <path d={tierLine(196)} stroke="url(#ledGrad)" strokeWidth="9" fill="none" opacity="0.55" />
        <path d={tierLine(214)} stroke="rgba(3,8,18,0.9)" strokeWidth="22" fill="none" />

        <style>{`
          @keyframes crowdFlicker { 0%,100% { opacity: 0.25; } 50% { opacity: 0.85; } }
          @keyframes ledSweep { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -240; } }
          .led-sweep { stroke-dasharray: 40 200; animation: ledSweep 6s linear infinite; }
          @media (prefers-reduced-motion: reduce) { .led-sweep { animation: none; stroke-dasharray: none; } }
        `}</style>
      </svg>
    </div>
  );
}

/** The pitch in true first-person perspective — a real CSS 3D ground
 *  plane tilted away from the camera, so the mown stripes and markings
 *  converge toward the horizon exactly the way grass does when you're
 *  standing on it. The horizon sits at HORIZON%, where the stands end. */
const HORIZON = 30;

/** The single tone the hero's bottom fade and the page's top fade both
 *  resolve to. Because both gradients hit it at full opacity, the join
 *  between the pitch and the rest of the page is invisible. */
const PAGE_SEAM = "#04070e";

/**
 * The pitch, drawn as one projected scene.
 *
 * Everything — turf, mown bands, every marking, the goal — goes through the
 * same ground-plane projection below, so they genuinely share a vanishing
 * point instead of being separate layers that only roughly agree. World
 * coordinates are (x across 0..1, v from the far goal line 0 to the near
 * edge 1); the projection converts those to the SVG's own box.
 */
const SCENE_W = 1000;
const SCENE_H = 700;
/** Camera distance at the far goal line and at the near edge. The ratio sets
 *  how hard the pitch converges — smaller near value = deeper perspective. */
const D_FAR = 0.5;
const D_NEAR = 0.16;
/** Half-width of the pitch at the near edge, in viewBox units. Wider than the
 *  box on purpose, so the turf runs off both sides at the viewer's feet. */
const HALF_NEAR = 1180;
/** Headroom above the far goal line, for the goal frame and the hoarding —
 *  without it the crossbar projects to a negative Y and gets clipped. */
const Y_TOP = 118;

const camF = (v: number) => 1 / (D_NEAR + (D_FAR - D_NEAR) * (1 - v));
const F0 = camF(0);
const F1 = camF(1);

/** Screen Y for a depth v (0 = far goal line, 1 = nearest turf). */
function sceneY(v: number): number {
  return Y_TOP + ((camF(v) - F0) / (F1 - F0)) * (SCENE_H - Y_TOP);
}
/** Screen X for a point across the pitch at depth v. */
function sceneX(x: number, v: number): number {
  return SCENE_W / 2 + (x - 0.5) * 2 * (HALF_NEAR * (camF(v) / F1));
}
/** A closed run of world points as an SVG polygon `points` string. */
function scenePoly(pts: [number, number][]): string {
  return pts.map(([x, v]) => `${sceneX(x, v).toFixed(1)},${sceneY(v).toFixed(1)}`).join(" ");
}
/** An ellipse-in-perspective: a circle on the ground, sampled and projected. */
function sceneCircle(cxw: number, cvw: number, rx: number, rv: number, n = 48): string {
  return scenePoly(Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cxw + Math.cos(a) * rx, cvw + Math.sin(a) * rv] as [number, number];
  }));
}

function PitchScene() {
  const LINE = "rgba(238,246,255,0.62)";

  // mown bands run ACROSS the pitch, so they read as bands compressing toward
  // the far end rather than a sunburst radiating from the goal
  const bands = Array.from({ length: 11 }, (_, i) => [i / 11, (i + 1) / 11] as const);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ top: `${HORIZON}%` }} aria-hidden>
      <svg viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="turf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c7a49" />
            <stop offset="35%" stopColor="#17693e" />
            <stop offset="100%" stopColor="#0a3a20" />
          </linearGradient>
          <linearGradient id="hoard" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d1b2f" /><stop offset="100%" stopColor="#060e1c" />
          </linearGradient>
          <radialGradient id="flood" cx="0.5" cy="0" r="0.85">
            <stop offset="0%" stopColor="rgba(190,225,255,0.30)" />
            <stop offset="55%" stopColor="rgba(120,190,255,0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* turf */}
        <rect x="0" y="0" width={SCENE_W} height={SCENE_H} fill="url(#turf)" />

        {/* mown bands across the pitch */}
        <g>
          {bands.map(([a, b], i) => (
            i % 2 === 0 ? (
              <polygon key={i} fill="rgba(255,255,255,0.032)"
                points={scenePoly([[-0.6, a], [1.6, a], [1.6, b], [-0.6, b]])} />
            ) : null
          ))}
        </g>

        {/* the floodlit wash, brightest where the lights hit near the far end */}
        <rect x="0" y="0" width={SCENE_W} height={SCENE_H} fill="url(#flood)" />

        {/* markings */}
        <g fill="none" stroke={LINE} strokeWidth="2.4" strokeLinejoin="round">
          {/* touchlines + far goal line */}
          <polygon points={scenePoly([[0.02, 0], [0.98, 0], [0.98, 1], [0.02, 1]])} />
          {/* penalty area and six-yard box at the far end */}
          <polygon points={scenePoly([[0.19, 0], [0.81, 0], [0.81, 0.2], [0.19, 0.2]])} />
          <polygon points={scenePoly([[0.36, 0], [0.64, 0], [0.64, 0.075], [0.36, 0.075]])} />
          {/* the D — the arc outside the penalty area */}
          <polyline points={scenePoly(
            Array.from({ length: 26 }, (_, i) => {
              const a = Math.PI * (0.06 + (i / 25) * 0.88);
              return [0.5 + Math.cos(a) * 0.115, 0.2 + Math.sin(a) * 0.09] as [number, number];
            })
          )} />
          {/* halfway line and centre circle, near the viewer */}
          <polyline points={scenePoly([[0.02, 0.9], [0.98, 0.9]])} />
          <polygon points={sceneCircle(0.5, 0.9, 0.16, 0.09)} />
        </g>
        {/* penalty spot and centre spot */}
        <g fill={LINE}>
          <circle cx={sceneX(0.5, 0.13)} cy={sceneY(0.13)} r="2.6" />
          <circle cx={sceneX(0.5, 0.9)} cy={sceneY(0.9)} r="3.4" />
        </g>

        {/* advertising hoarding along the far touchline — this is what stops
            the grass butting into the stands as a hard horizontal seam */}
        <polygon points={scenePoly([[-0.35, -0.055], [1.35, -0.055], [1.35, 0], [-0.35, 0]])} fill="url(#hoard)" />
        <polyline points={scenePoly([[-0.35, -0.055], [1.35, -0.055]])} stroke="rgba(0,240,255,0.45)" strokeWidth="2" fill="none" />

        {/* the goal, standing ON the far goal line */}
        <GoalPosts />

        {/* the turf falls into shadow at the viewer's feet */}
        <rect x="0" y={SCENE_H * 0.72} width={SCENE_W} height={SCENE_H * 0.28} fill="url(#footShadow)" />
        <defs>
          <linearGradient id="footShadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(3,10,6,0)" /><stop offset="100%" stopColor="rgba(3,10,6,0.55)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/** Goal frame + net, planted on the far goal line and sized off the same
 *  projection so it sits in the scene rather than floating over it. */
function GoalPosts() {
  const LX = 0.395, RX = 0.605;      // posts, slightly wider than true scale so it reads
  const x1 = sceneX(LX, 0), x2 = sceneX(RX, 0);
  const base = sceneY(0);
  const h = (x2 - x1) * 0.34;         // crossbar height off the goal width
  const top = base - h;
  const post = Math.max(2.6, (x2 - x1) * 0.022);

  const verticals = 15;
  const horizontals = 7;

  return (
    <g>
      {/* net mesh */}
      <g stroke="rgba(226,240,255,0.30)" strokeWidth="0.7">
        {Array.from({ length: verticals }).map((_, i) => {
          const x = x1 + ((x2 - x1) * i) / (verticals - 1);
          return <line key={`v${i}`} x1={x} y1={top} x2={x + (x - (x1 + x2) / 2) * 0.06} y2={base} />;
        })}
        {Array.from({ length: horizontals }).map((_, i) => {
          const y = top + (h * i) / (horizontals - 1);
          const k = (i / (horizontals - 1)) * 0.03;
          return <line key={`h${i}`} x1={x1 - (x2 - x1) * k} y1={y} x2={x2 + (x2 - x1) * k} y2={y} />;
        })}
      </g>
      {/* frame */}
      <g fill="#eef4ff">
        <rect x={x1 - post / 2} y={top} width={post} height={h} rx={post / 2} />
        <rect x={x2 - post / 2} y={top} width={post} height={h} rx={post / 2} />
        <rect x={x1 - post / 2} y={top - post / 2} width={x2 - x1 + post} height={post} rx={post / 2} />
      </g>
      {/* the goal's shadow on the grass */}
      <ellipse cx={(x1 + x2) / 2} cy={base + 2} rx={(x2 - x1) * 0.6} ry={h * 0.05} fill="rgba(0,0,0,0.35)" />
    </g>
  );
}

function StandingShadow() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%] overflow-hidden" aria-hidden>
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: "-8%",
          width: "min(46vw, 420px)",
          height: "70%",
          background: "radial-gradient(50% 50% at 50% 50%, rgba(0,0,0,0.55), transparent 70%)",
        }}
      />
    </div>
  );
}

/* ---- daily challenge — same deterministic config as /daily ---- */
function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
function dailyConfig(key: string): { formation: string; mode: "classic" | "expert" } {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const forms = ["4-3-3", "4-2-3-1", "4-4-2", "3-5-2", "3-4-3", "4-1-2-1-2"];
  return { formation: forms[h % forms.length], mode: h % 3 === 0 ? "expert" : "classic" };
}

const COMP_META = {
  cl: { label: "Champions League", accent: "#00f0ff", href: "/tournament" },
  euro: { label: "UEFA EURO", accent: "#ff3b57", href: "/international" },
  copa: { label: "Copa América", accent: "#00e676", href: "/international" },
} as const;

/** icon + accent + translation keys; dates are static labels. */
const NEWS = [
  { date: "Jul 2026", icon: "🌐", titleKey: "news.bilingual.title", bodyKey: "news.bilingual.body" },
  { date: "Jul 2026", icon: "🎴", titleKey: "news.lineups.title", bodyKey: "news.lineups.body" },
  { date: "Jul 2026", icon: "🥅", titleKey: "news.shootout.title", bodyKey: "news.shootout.body" },
  { date: "Jul 2026", icon: "📱", titleKey: "news.mobile.title", bodyKey: "news.mobile.body" },
];

const FAQ_KEYS: { q: string; a: string; kind?: "comps" }[] = [
  { q: "faq.q1", a: "faq.a1" },
  { q: "faq.q2", a: "faq.a2" },
  { q: "faq.q3", a: "", kind: "comps" },
  { q: "faq.q4", a: "faq.a4" },
  { q: "faq.q5", a: "faq.a5" },
  { q: "faq.q6", a: "faq.a6" },
  { q: "faq.q7", a: "faq.a7" },
  { q: "faq.q8", a: "faq.a8" },
];

function SectionHeading({ kicker, title, right }: { kicker: string; title: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="cl-heading text-[0.6rem] tracking-[0.4em] text-cyan">{kicker}</div>
        <h2 className="mt-1 font-display text-xl font-extrabold sm:text-2xl">{title}</h2>
      </div>
      {right}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mode pins — game modes scattered around the player on the pitch,     */
/*  like options on a game's own hub menu, not cards in a web grid.      */
/* ------------------------------------------------------------------ */
interface Tile {
  href: string;
  icon: string;
  kicker: string;
  title: string;
  tag: string;
  cta: string;
  gradient: string;
  glow: string;
  ring: string;
  badge?: string;
  /** Original-art silverware standing in for the competition, from the
   *  app's own TrophyArt set. Real competition logos are registered
   *  trademarks, so they're never reproduced here — see the note in
   *  TrophyArt.tsx. Falls back to `icon` when a mode has no trophy. */
  art?: TrophyId;
}

/** Emblem for a mode: its trophy art if it has one, else its glyph. */
function ModeEmblem({ tile, size }: { tile: Tile; size: number }) {
  if (tile.art) return <TrophyArt id={tile.art} size={size} title={tile.title} />;
  return <span style={{ fontSize: size * 0.78, lineHeight: 1 }}>{tile.icon}</span>;
}

/** One card in the rail. The active card lifts, brightens and shows its
 *  strapline; the others sit back so the eye lands on one thing. */
function ModeCard({
  tile, active, onEnter, onFocus,
}: { tile: Tile; active: boolean; onEnter: (t: Tile) => void; onFocus: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={() => { play("select"); onEnter(tile); }}
      onPointerEnter={onFocus}
      onFocus={onFocus}
      animate={{ y: active ? -14 : 0, scale: active ? 1.06 : 0.94 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="group relative flex w-[122px] shrink-0 snap-center flex-col items-center gap-2 rounded-2xl px-3 py-3.5 text-center sm:w-[138px]"
      style={{
        background: active ? "rgba(11,20,36,0.9)" : "rgba(9,16,28,0.62)",
        border: `1px solid ${active ? tile.ring : "rgba(148,170,205,0.16)"}`,
        boxShadow: active ? `${tile.glow}, inset 0 1px 0 rgba(255,255,255,0.1)` : "0 8px 22px rgba(0,0,0,0.45)",
        backdropFilter: "blur(10px)",
      }}
      aria-current={active ? "true" : undefined}
    >
      <ModeEmblem tile={tile} size={active ? 40 : 34} />
      <span className="whitespace-nowrap text-[0.58rem] font-bold uppercase leading-tight tracking-[0.13em] text-white">
        {tile.title}
      </span>
      {tile.badge && (
        <span className="absolute -right-1 -top-1 rounded-full bg-white px-1.5 py-0.5 text-[0.48rem] font-black text-black">
          {tile.badge}
        </span>
      )}
      {active && (
        <span aria-hidden className="pointer-events-none absolute -bottom-3 left-1/2 h-3 w-[86%] -translate-x-1/2 rounded-[50%] blur-md"
          style={{ background: tile.ring }} />
      )}
    </motion.button>
  );
}

/** The mode rail — one clean row of cards standing on the grass, instead of
 *  markers scattered across it. Scroll-snaps on touch, arrows on desktop, and
 *  the stadium relights to whichever mode is centred. */
function ModeRail({
  tiles, active, setActive, onEnter,
}: {
  tiles: Tile[];
  active: number;
  setActive: (i: number) => void;
  onEnter: (t: Tile) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const go = (dir: -1 | 1) => {
    const next = Math.max(0, Math.min(tiles.length - 1, active + dir));
    setActive(next);
    ref.current?.querySelectorAll("button")[next]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    play("click");
  };

  return (
    <div className="absolute inset-x-0 z-20" style={{ bottom: "15%" }}>
      <div className="relative mx-auto flex max-w-4xl items-center gap-2 px-3">
        <button type="button" onClick={() => go(-1)} aria-label="Previous mode" disabled={active === 0}
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/45 text-lg text-white backdrop-blur-sm transition hover:bg-black/65 disabled:opacity-25 md:flex">
          &lsaquo;
        </button>

        <div ref={ref}
          className="flex flex-1 snap-x snap-mandatory items-end justify-start gap-2.5 overflow-x-auto px-2 pb-4 pt-6 [scrollbar-width:none] md:justify-center [&::-webkit-scrollbar]:hidden">
          {tiles.map((tile, i) => (
            <ModeCard key={tile.title} tile={tile} active={i === active} onEnter={onEnter} onFocus={() => setActive(i)} />
          ))}
        </div>

        <button type="button" onClick={() => go(1)} aria-label="Next mode" disabled={active === tiles.length - 1}
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/45 text-lg text-white backdrop-blur-sm transition hover:bg-black/65 disabled:opacity-25 md:flex">
          &rsaquo;
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={tiles[active]?.title}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="mt-1 px-6 text-center text-[0.72rem] font-medium text-white/70"
        >
          {tiles[active]?.tag}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

/** Full-screen "walking out to the pitch" beat between picking a mode and
 *  actually arriving — a brief cinematic instead of an instant page jump. */
function ModeTransition({ tile, onDone }: { tile: Tile; onDone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[200] flex cursor-pointer items-center justify-center overflow-hidden"
      style={{ background: tile.gradient }}
      onClick={onDone}
      onAnimationComplete={() => { const t = setTimeout(onDone, 750); return () => clearTimeout(t); }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 90% at 50% 50%, transparent 30%, rgba(0,0,0,0.6) 100%)" }} />
      {/* floodlight sweep, like walking out of the tunnel */}
      <motion.div aria-hidden className="pointer-events-none absolute -inset-x-1/4 -top-1/2 h-[200%] w-1/2 bg-white/15 blur-2xl"
        initial={{ x: "-120%", rotate: 12 }} animate={{ x: "220%", rotate: 12 }} transition={{ duration: 0.9, ease: "easeInOut" }} />
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 16, delay: 0.1 }}
        className="relative text-center"
      >
        <div className="flex justify-center drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"><ModeEmblem tile={tile} size={92} /></div>
        <div className="mt-4 font-display text-2xl font-black uppercase tracking-wide text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)] sm:text-4xl">
          {tile.title}
        </div>
        <div className="mt-2 text-[0.7rem] font-bold uppercase tracking-[0.35em] text-white/80">{tile.kicker}</div>
      </motion.div>
    </motion.div>
  );
}

/* ================================================================== */

export default function Home() {
  const mounted = useHydrated();
  const router = useRouter();
  const [entering, setEntering] = useState<Tile | null>(null);
  const [activeMode, setActiveMode] = useState(1); // Champions League leads
  const t = useT();
  const profile = useGame((s) => s.profile);
  const tournament = useGame((s) => s.tournament);
  const intl = useGame((s) => s.intl);
  const setup = useGame((s) => s.setup);
  const formation = useGame((s) => s.formation);
  const draftComplete = useGame((s) => s.draftComplete);
  const placedSlots = useGame((s) => s.placedSlots);
  const matchLog = useGame((s) => s.matchLog);
  const careerPlayer = useCurrentPlayer();
  const playerCount = getAllPlayers().length;

  /* ---- CONTINUE PLAYING: whatever the manager left on the desk ---- */
  const resume = mounted ? (() => {
    if (tournament) {
      const alive = tournament.phase !== "done";
      const nextFixture = tournament.fixtures.find(
        (f) => f.matchday === tournament.matchday && !f.result && (f.home === USER_TEAM_ID || f.away === USER_TEAM_ID),
      );
      const nextTie = tournament.ties.find((t) => !t.winner && (t.teamA === USER_TEAM_ID || t.teamB === USER_TEAM_ID));
      const opp = tournament.phase === "league" && nextFixture
        ? tournament.teams[nextFixture.home === USER_TEAM_ID ? nextFixture.away : nextFixture.home]
        : nextTie
          ? tournament.teams[nextTie.teamA === USER_TEAM_ID ? nextTie.teamB : nextTie.teamA]
          : null;
      const stage =
        tournament.phase === "league" ? t("stage.leaguePhase", { n: Math.min(tournament.matchday, 8) })
          : tournament.phase === "playoffs" ? t("stage.playoffs")
          : tournament.phase === "r16" ? t("stage.r16")
          : tournament.phase === "qf" ? t("stage.qf")
          : tournament.phase === "sf" ? t("stage.sf")
          : tournament.phase === "final" ? t("stage.final")
          : t("stage.clComplete");
      return {
        comp: "cl" as const, name: tournament.teams[USER_TEAM_ID].name, stage,
        opp: opp ? { name: teamLabel(opp), colors: opp.colors, short: opp.short } : null,
        href: "/tournament", cta: alive ? t("home.resume.continueTournament") : t("home.resume.collectResult"),
      };
    }
    if (intl) {
      const meta = COMP_META[intl.comp];
      const userTeam = intl.teams[intl.userKey];
      const nextFixture = intl.fixtures.find(
        (f) => f.matchday === intl.matchday && !f.result && (f.home === intl.userKey || f.away === intl.userKey),
      );
      const nextTie = intl.ties.find((t) => !t.winner && (t.teamA === intl.userKey || t.teamB === intl.userKey));
      const oppKey = intl.phase === "groups" && nextFixture
        ? (nextFixture.home === intl.userKey ? nextFixture.away : nextFixture.home)
        : nextTie
          ? (nextTie.teamA === intl.userKey ? nextTie.teamB : nextTie.teamA)
          : null;
      const opp = oppKey ? intl.teams[oppKey] : null;
      const stage =
        intl.phase === "groups" ? t("stage.groupStage", { n: Math.min(intl.matchday, 3) })
          : intl.phase === "r16" ? t("stage.r16")
          : intl.phase === "qf" ? t("stage.qf")
          : intl.phase === "sf" ? t("stage.sf")
          : intl.phase === "final" ? (nextTie?.round === "Third Place" ? t("stage.bronze") : t("stage.final"))
          : t("stage.intlComplete");
      return {
        comp: intl.comp, name: `${userTeam.name} ${userTeam.season ?? ""}`.trim(), stage,
        opp: opp ? { name: `${opp.name} ${opp.season ?? ""}`.trim(), colors: opp.colors, short: opp.short } : null,
        href: `${meta.href}?comp=${intl.comp}`, cta: intl.phase !== "done" ? t("home.resume.continueTournament") : t("home.resume.collectResult"),
      };
    }
    if (setup && !draftComplete) {
      const total = formation?.slots.length ?? 11;
      return {
        comp: (setup.pool === "clubs" ? "cl" : setup.pool) as "cl" | "euro" | "copa",
        name: t("home.resume.draftInProgress"), stage: t("home.resume.pickOf", { n: Math.min(placedSlots.length + 1, total), total }),
        opp: null, href: "/draft", cta: t("home.resume.continueDraft"),
      };
    }
    if (draftComplete) {
      return { comp: "cl" as const, name: t("home.resume.xiReady"), stage: t("home.resume.squadReview"), opp: null, href: "/squad", cta: t("home.resume.enterTournament") };
    }
    return null;
  })() : null;

  const resumeMeta = resume ? COMP_META[resume.comp] : null;

  /* ---- daily challenge + career state ---- */
  const dkey = todayKey();
  const dcfg = dailyConfig(dkey);
  const dailyPlayed = mounted && profile.drafts.some((d) => d.daily === dkey);
  const activeCareer = mounted && careerPlayer && !careerPlayer.retired ? careerPlayer : null;
  const anyCareer = mounted ? careerPlayer : null;

  /* ---- hall of champions ---- */
  const champions = mounted
    ? [
        ...profile.drafts.filter((d) => d.result === "champion").map((d) => ({
          key: `cl-${d.id}`, comp: "Champions Draft", accent: "#00f0ff",
          name: `${d.formation} · ${d.overall} OVR`, date: d.date, sub: `${d.players[0]?.name ?? ""} & co.`,
        })),
        ...(profile.intlResults ?? []).filter((r) => r.result === "champion").map((r, i) => ({
          key: `intl-${i}-${r.date}`, comp: r.comp === "euro" ? "UEFA EURO" : "Copa América",
          accent: r.comp === "euro" ? "#ff3b57" : "#00e676",
          name: `${r.nation} ${r.year}`, date: r.date, sub: "International champions",
        })),
      ].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 4)
    : [];

  const totalGoals = mounted ? profile.drafts.reduce((s, d) => s + (d.goals ?? 0), 0) : 0;
  const compsCompleted = mounted ? profile.drafts.length + (profile.intlResults?.length ?? 0) : 0;

  /* ---- the tiles ---- */
  const tiles: Tile[] = [
    {
      href: anyCareer ? "/career" : "/career/new", icon: "🎮",
      kicker: t("home.tile.career.kicker"), title: t("home.qa.career"),
      tag: activeCareer ? `${activeCareer.name} · ${t("home.career.ageClub", { age: activeCareer.age, club: activeCareer.currentClubShort ?? activeCareer.currentClubName })}` : t("home.tile.career.tag"),
      cta: anyCareer ? t("home.tile.continue") : t("home.tile.play"), badge: anyCareer ? undefined : t("home.tile.new"),
      gradient: "linear-gradient(150deg, #2e1065 0%, #4c1d95 48%, #6d28d9 78%, #ffd700 145%)",
      glow: "0 14px 46px rgba(109,40,217,0.4)", ring: "rgba(216,180,254,0.5)",
      art: "ballon-dor",
    },
    {
      href: "/draft", icon: "🏆", kicker: t("home.tile.cl.kicker"), title: "Champions League",
      tag: t("home.tile.cl.tag"), cta: t("home.tile.play"),
      gradient: "linear-gradient(150deg, #05070d 0%, #0f172a 45%, #0e5f6b 85%, #00f0ff 145%)",
      glow: "0 14px 46px rgba(0,240,255,0.32)", ring: "rgba(0,240,255,0.5)",
      art: "champions-league",
    },
    {
      href: "/international?comp=euro", icon: "🇪🇺", kicker: t("home.tile.euro.kicker"), title: "UEFA EURO",
      tag: t("home.tile.euro.tag"), cta: t("home.tile.play"),
      gradient: "linear-gradient(150deg, #050d2e 0%, #10236e 45%, #1b3fd0 78%, #ff3b57 145%)",
      glow: "0 14px 40px rgba(255,59,87,0.32)", ring: "rgba(255,59,87,0.5)",
      art: "euro",
    },
    {
      href: "/international?comp=copa", icon: "🌎", kicker: t("home.tile.copa.kicker"), title: "Copa América",
      tag: t("home.tile.copa.tag"), cta: t("home.tile.play"),
      gradient: "linear-gradient(150deg, #06251a 0%, #0a3520 45%, #0f6d43 78%, #ffd700 145%)",
      glow: "0 14px 40px rgba(255,215,0,0.3)", ring: "rgba(255,215,0,0.5)",
      art: "copa-america",
    },
    {
      href: "/daily", icon: "📅", kicker: t("home.tile.daily.kicker"), title: t("home.daily.kicker"),
      tag: `${dcfg.formation} · ${t(dcfg.mode === "expert" ? "draft.mode.expert.title" : "draft.mode.classic.title")}`,
      cta: dailyPlayed ? t("home.daily.viewResult") : t("home.tile.play"),
      gradient: "linear-gradient(150deg, #451a03 0%, #78350f 45%, #b45309 80%, #ffd700 145%)",
      glow: "0 14px 40px rgba(255,215,0,0.3)", ring: "rgba(255,215,0,0.5)",
      art: "domestic-cup",
    },
  ];

  return (
    <>
    <AnimatePresence>
      {entering && (
        <ModeTransition
          key={entering.title}
          tile={entering}
          onDone={() => router.push(entering.href)}
        />
      )}
    </AnimatePresence>
    <div className="relative pb-24">
      {/* ===================== PITCH HERO — you're the player, modes are options around you ===================== */}
      <section className="relative h-[100dvh] min-h-[640px] overflow-hidden">
        <StandBand />
        <PitchScene />
        <StandingShadow />

        <div className="absolute left-4 top-20 z-20 sm:left-6 sm:top-24">
          <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div className="cl-heading text-[0.6rem] tracking-[0.45em] text-cyan">{t("home.kicker")}</div>
            <h1 className="mt-1 font-display text-2xl font-black drop-shadow-[0_4px_18px_rgba(0,0,0,0.6)] sm:text-4xl">
              {t("home.welcome")} <span className="text-gradient-gold">{mounted ? profile.name : "Manager"}</span>
            </h1>
          </motion.div>
          <motion.div
            initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="mt-3 flex items-center gap-2.5"
          >
            <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3.5 py-2 text-[0.72rem] font-bold backdrop-blur-sm" style={{ border: "1px solid rgba(242,212,114,0.4)" }}>
              🏆 <span className="font-display text-base font-black text-gold">{mounted ? profile.trophies : 0}</span> <span className="text-gold/80">{t("home.trophiesLabel")}</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3.5 py-2 text-[0.72rem] font-bold backdrop-blur-sm" style={{ border: "1px solid rgba(34,224,255,0.35)" }}>
              🎖️ <span className="font-display text-base font-black text-cyan">{mounted ? profile.achievements.length : 0}</span><span className="text-cyan/70">/{ACHIEVEMENTS.length}</span>
            </span>
          </motion.div>
        </div>

        {/* the modes — one clean rail on the grass rather than markers
            scattered across it */}
        <ModeRail tiles={tiles} active={activeMode} setActive={setActiveMode} onEnter={setEntering} />

        {/* the near edge of the pitch falls into shadow, and the page
            continues out of that shadow — the two gradients below meet at
            the same solid tone so the hero and the content are one surface */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%]"
          style={{ background: `linear-gradient(to bottom, transparent, ${PAGE_SEAM} 88%, ${PAGE_SEAM})` }} />

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="absolute inset-x-0 bottom-6 z-20 flex flex-col items-center gap-2"
        >
          <span className="rounded-full bg-black/40 px-3.5 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.3em] text-white/60 backdrop-blur-sm">
            {t("home.play.kicker")}
          </span>
          <motion.span aria-hidden className="text-white/40"
            animate={{ y: [0, 5, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
            ⌄
          </motion.span>
        </motion.div>
      </section>

      {/* …and out the other side of that shadow, into the page */}
      <div aria-hidden className="pointer-events-none h-32 w-full"
        style={{ background: `linear-gradient(to bottom, ${PAGE_SEAM}, transparent)`, marginBottom: "-8rem" }} />

      <div className="relative mx-auto max-w-7xl px-4 pt-8 sm:pt-10 lg:px-6">
        {/* quick links */}
        <div className="flex justify-end gap-2">
          <Link href="/history" onClick={() => play("click")} className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.66rem] font-extrabold uppercase tracking-wider text-white/75 transition-colors hover:text-white">📜 {t("home.more.history")}</Link>
          <Link href="/stats" onClick={() => play("click")} className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.66rem] font-extrabold uppercase tracking-wider text-white/75 transition-colors hover:text-white">👔 {t("home.more.profile")}</Link>
        </div>

        {/* ===================== AT A GLANCE — status first, dashboard-style ===================== */}
        <section className="mt-6">
          <div className="glass rounded-2xl px-4 py-4 sm:px-6">
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
              {[
                { to: mounted ? profile.drafts.length : 0, suffix: "", label: t("home.stats.drafts"), icon: "🎴" },
                { to: mounted ? profile.trophies : 0, suffix: "", label: t("home.stats.trophies"), icon: "🏆" },
                { to: totalGoals, suffix: "", label: t("home.stats.goals"), icon: "⚽" },
                { to: mounted ? matchLog.length : 0, suffix: "", label: t("home.stats.matches"), icon: "📊" },
                { to: compsCompleted, suffix: "", label: t("home.stats.campaigns"), icon: "🗺️" },
                { to: mounted ? profile.achievements.length : 0, suffix: `/${ACHIEVEMENTS.length}`, label: t("home.stats.achievements"), icon: "🎖️" },
              ].map((c) => (
                <div key={c.label} className="text-center">
                  <div className="text-base" aria-hidden>{c.icon}</div>
                  <AnimatedCounter to={c.to} suffix={c.suffix} label={c.label} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== CONTINUE PLAYING (only if a save) ===================== */}
        {resume && resumeMeta && (
          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6">
            <div className={`shine relative overflow-hidden rounded-3xl p-5 sm:p-6 ${
              resume.comp === "euro" ? "euro-panel euro-grid" : resume.comp === "copa" ? "copa-panel copa-heat copa-gold-border" : "cl-panel cl-streaks"
            }`}>
              <CameraFlashes count={8} />
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="min-w-0">
                  <div className="cl-heading text-[0.58rem] tracking-[0.4em]" style={{ color: resumeMeta.accent }}>
                    ▶ {t("home.continueKicker")} · {resumeMeta.label}
                  </div>
                  <h2 className="mt-1.5 truncate font-display text-2xl font-black text-white sm:text-3xl">{resume.name}</h2>
                  <div className="mt-1 text-sm text-white/70">{resume.stage}</div>
                  {resume.opp && (
                    <div className="mt-3 flex w-fit items-center gap-2 rounded-xl bg-black/25 px-3 py-2">
                      <span className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/45">{t("home.next")}</span>
                      <TeamBadge colors={resume.opp.colors} code={resume.opp.short} size={22} />
                      <span className="font-display text-sm font-extrabold text-white">{resume.opp.name}</span>
                    </div>
                  )}
                </div>
                <Link href={resume.href} className={`btn btn-pulse text-base ${resume.comp === "euro" ? "btn-euro" : resume.comp === "copa" ? "btn-copa" : "btn-gold"}`} onClick={() => play("select")}>
                  ▶ {resume.cta}
                </Link>
              </div>
            </div>
          </motion.section>
        )}

        {/* ===================== CHAMPIONS + NEWS — denser side-by-side ===================== */}
        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:items-start">
          {champions.length > 0 && (
            <section>
              <SectionHeading
                kicker={t("home.champs.kicker")}
                title={t("home.champs.title")}
                right={mounted && profile.trophies > 0 ? (
                  <span className="chip bg-gold/15 text-gold">🏆 {t("home.champs.titlesWon", { n: profile.trophies, s: profile.trophies === 1 ? "" : "s" })}</span>
                ) : undefined}
              />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {champions.map((c, i) => (
                  <motion.div key={c.key}
                    initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                    className="shine relative overflow-hidden rounded-2xl p-4"
                    style={{ background: "linear-gradient(165deg, rgba(212,175,55,0.14), rgba(10,20,50,0.6))", border: "1px solid rgba(212,175,55,0.4)" }}>
                    <div className="text-2xl" aria-hidden>🏆</div>
                    <div className="mt-2 text-[0.58rem] font-bold uppercase tracking-[0.25em]" style={{ color: c.accent }}>{c.comp}</div>
                    <div className="mt-0.5 truncate font-display text-sm font-extrabold text-white">{c.name}</div>
                    <div className="mt-0.5 truncate text-[0.62rem] text-muted">{c.sub}</div>
                    <div className="mt-1 text-[0.58rem] text-white/40">{new Date(c.date).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          <section id="news" className="scroll-mt-24">
            <SectionHeading kicker={t("home.news.kicker")} title={t("home.news.title")} />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {NEWS.map((n, i) => (
                <motion.article key={n.titleKey}
                  initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -4 }} className="glass shine rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xl" aria-hidden>{n.icon}</span>
                    <span className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-white/35">{n.date}</span>
                  </div>
                  <h3 className="mt-2 font-display text-[0.85rem] font-extrabold text-white">{t(n.titleKey)}</h3>
                  <p className="mt-1 text-[0.68rem] leading-relaxed text-muted">{t(n.bodyKey)}</p>
                </motion.article>
              ))}
            </div>
          </section>
        </div>

        {/* ============== WHAT IS CONTINENTAL XI + FAQ ================ */}
        <section className="mt-14">
          <SectionHeading kicker={t("home.about.kicker")} title={t("home.about.title")} />
          <details className="faq-item glass mt-5 overflow-hidden rounded-2xl">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-sm font-extrabold text-white">
              {t("home.about.readSummary")}
              <span className="faq-plus grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/8 text-base font-bold text-cyan" aria-hidden>+</span>
            </summary>
            <div className="space-y-3 px-5 pb-5 text-[0.82rem] leading-relaxed text-white/70">
              <p>{t("about.p1")}</p><p>{t("about.p2")}</p><p>{t("about.p3")}</p><p>{t("about.p4")}</p>
            </div>
          </details>
        </section>

        <section id="faq" className="mt-12 scroll-mt-24">
          <SectionHeading kicker={t("home.faq.kicker")} title={t("home.faq.title")} />
          <div className="mt-5 space-y-3">
            {FAQ_KEYS.map((f) => (
              <details key={f.q} className="faq-item glass overflow-hidden rounded-2xl">
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-sm font-extrabold text-white">
                  {t(f.q)}
                  <span className="faq-plus grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/8 text-base font-bold text-cyan" aria-hidden>+</span>
                </summary>
                <div className="px-5 pb-5 text-[0.82rem] leading-relaxed text-white/70">
                  {f.kind === "comps" ? (
                    <span className="grid gap-2">
                      <span>🏆 <b>UEFA Champions League</b> — {t("faq.a3.cl")}</span>
                      <span>🇪🇺 <b>{t("mode.euro.title")}</b> — {t("faq.a3.euro")}</span>
                      <span>🌎 <b>Copa América</b> — {t("faq.a3.copa")}</span>
                    </span>
                  ) : t(f.a)}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ========================== FOOTER =========================== */}
        <footer className="mt-20 border-t border-white/8 pt-10">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <div className="font-display text-sm font-extrabold">CONTINENTAL <span className="text-gradient-gold">XI</span></div>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted/80">{t("home.footer.tagline")}</p>
              <div className="mt-3 text-xs"><ReportBug /></div>
            </div>
            <div>
              <div className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-muted">{t("home.footer.play")}</div>
              <div className="mt-2 grid gap-1.5 text-xs">
                <Link className="text-white/70 hover:text-gold" href="/career">{t("home.qa.career")}</Link>
                <Link className="text-white/70 hover:text-gold" href="/draft">{t("mode.cl.title")}</Link>
                <Link className="text-white/70 hover:text-gold" href="/international?comp=euro">{t("mode.euro.title")}</Link>
                <Link className="text-white/70 hover:text-gold" href="/international?comp=copa">Copa América</Link>
                <Link className="text-white/70 hover:text-gold" href="/daily">{t("home.qa.daily")}</Link>
              </div>
            </div>
            <div>
              <div className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-muted">{t("home.footer.explore")}</div>
              <div className="mt-2 grid gap-1.5 text-xs">
                <Link className="text-white/70 hover:text-gold" href="/history">{t("home.qa.history")}</Link>
                <Link className="text-white/70 hover:text-gold" href="/tournament">{t("tour.careerHub")}</Link>
                <Link className="text-white/70 hover:text-gold" href="/stats">{t("home.qa.profile")}</Link>
              </div>
            </div>
          </div>
          <p className="mt-10 pb-2 text-center text-[0.62rem] text-muted/60">
            {t("home.footer.stat", { squads: SQUADS.length, players: playerCount.toLocaleString() })}
          </p>
        </footer>
      </div>
    </div>
    </>
  );
}
