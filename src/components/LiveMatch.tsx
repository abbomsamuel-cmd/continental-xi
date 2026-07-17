"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MatchResult, Player } from "@/lib/types";
import { TeamBadge } from "@/components/TeamBadge";
import { PenaltyShootout } from "@/components/PenaltyShootout";
import { CameraFlashes } from "@/components/fx/Atmosphere";
import {
  buildFeed, extendedStats, liveRating, matchStory, matchSeed,
  refereeName, attendance, type FeedLine, type FeedKind,
} from "@/lib/broadcast";
import { useGame } from "@/lib/store";
import { useFxLevel } from "@/lib/fx";
import {
  play, startAmbience, stopAmbience, swellAmbience, hushAmbience,
} from "@/lib/sound";

/**
 * Live Match 2.0 — a broadcast, not a dashboard. Replays an already-simulated
 * MatchResult like a TV production: cinematic intro, premium scoreboard,
 * full-screen broadcast overlays on the big moments (GOAL / VAR / cards /
 * subs), a living crowd that swells and hushes with the play, live momentum,
 * live ratings, expanded stats and a full-time studio recap. There is no
 * narrator — the picture and the stadium tell the story. The simulation
 * engine is never touched: everything here is presentation over the result.
 */

interface LiveTeamRef {
  name: string;
  short: string;
  colors: [string, string];
  season?: number;
  isUser?: boolean;
}

export interface LiveLeg {
  result: MatchResult;
  /** e.g. "1st Leg", "2nd Leg" — omitted for single-match ties */
  label?: string;
}

export type BroadcastVariant = "cl" | "euro" | "copa";

/* ------------------------------------------------------------------ */
/*  Competition identity                                               */
/* ------------------------------------------------------------------ */

const VARIANTS: Record<BroadcastVariant, {
  accent: string; soft: string; page: string; emblem: string; compLabel: string;
  introGlow: string;
}> = {
  cl: {
    accent: "#d4af37", soft: "rgba(212,175,55,0.16)",
    page: "radial-gradient(120% 90% at 50% 15%, #0a1b4d, #020714 78%)",
    emblem: "★", compLabel: "Champions Draft",
    introGlow: "rgba(41,98,255,0.4)",
  },
  euro: {
    accent: "#37e0ff", soft: "rgba(55,224,255,0.15)",
    page: "radial-gradient(120% 90% at 50% 15%, #081b56, #030818 78%)",
    emblem: "✦", compLabel: "UEFA EURO",
    introGlow: "rgba(27,79,255,0.45)",
  },
  copa: {
    accent: "#ffc93c", soft: "rgba(255,201,60,0.15)",
    page: "radial-gradient(120% 90% at 50% 15%, #0a3a24, #02120a 78%)",
    emblem: "◆", compLabel: "Copa América",
    introGlow: "rgba(23,201,122,0.4)",
  },
};

/* ------------------------------------------------------------------ */
/*  Per-event visual identity                                          */
/* ------------------------------------------------------------------ */

const EVENT_STYLE: Record<FeedKind, { icon: string; color: string; big?: boolean }> = {
  kickoff: { icon: "🟢", color: "#eaf1ff" },
  goal: { icon: "⚽", color: "#2ee6a6", big: true },
  yellow: { icon: "🟨", color: "#ffcf5c" },
  red: { icon: "🟥", color: "#ff5a6a", big: true },
  var: { icon: "📺", color: "#5aa8ff" },
  chance: { icon: "⚡", color: "#ff8a3d" },
  save: { icon: "🧤", color: "#2ee6a6" },
  corner: { icon: "🚩", color: "#9fb3d1" },
  sub: { icon: "🔁", color: "#b58cff" },
  midfield: { icon: "▪", color: "#9fb3d1" },
  crossbar: { icon: "💥", color: "#ff8a3d", big: true },
  atmo: { icon: "📣", color: "#9fb3d1" },
  ht: { icon: "⏸", color: "#7fb0ff", big: true },
  secondhalf: { icon: "🟢", color: "#eaf1ff" },
  ft: { icon: "🏁", color: "#d4af37", big: true },
};

/** The one sound each beat is allowed to make, ranked so a busy minute plays
 *  only its most important cue — never a pile-up. */
const EVENT_SOUND: Partial<Record<FeedKind, Parameters<typeof play>[0]>> = {
  goal: "goal", red: "card", crossbar: "crossbar", save: "save",
  var: "var", chance: "kick", sub: "sub", yellow: "card",
  ht: "whistle", secondhalf: "whistle",
};
const SOUND_PRIORITY: FeedKind[] = ["goal", "red", "crossbar", "save", "var", "ht", "secondhalf", "chance", "sub", "yellow"];

const MS_PER_MINUTE = 340; // ~32s for a full match at ×1

function frac(n: number): number {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
}

/** Ease a final stat towards its full-time value as the clock runs. */
function liveStat(finalVal: number, minute: number, endMinute: number, wobbleSeed: number): number {
  const t = Math.min(1, minute / endMinute);
  const eased = t * t * (3 - 2 * t);
  const wobble = minute >= endMinute ? 0 : (frac(wobbleSeed + minute * 3.7) - 0.5) * 0.12;
  return Math.max(0, finalVal * Math.min(1, eased + wobble));
}

/* ================================================================== */
/*  Cinematic broadcast overlays — the big moments, told with graphics */
/*  and crowd instead of a narrator. GOAL / VAR / card / substitution.  */
/* ================================================================== */

type BroadcastCue =
  | { kind: "goal"; team: 0 | 1; player: string; assist?: string; minute: number; h: number; a: number }
  | { kind: "card"; team: 0 | 1; player: string; minute: number; red: boolean }
  | { kind: "var"; minute: number }
  | { kind: "sub"; team: 0 | 1; player: string; off?: string; minute: number };

type BVariant = (typeof VARIANTS)[BroadcastVariant];

/** Full-screen TV insert that animates in on a key moment and clears itself. */
function BroadcastOverlay({
  cue, home, away, v,
}: {
  cue: BroadcastCue; home: LiveTeamRef; away: LiveTeamRef; v: BVariant;
}) {
  const lvl = useFxLevel();
  const rich = lvl === "full";
  const side = ("team" in cue ? cue.team : 0) === 0 ? home : away;
  const teamCol = side.colors[0];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="pointer-events-none fixed inset-0 z-[148] flex items-center justify-center overflow-hidden"
    >
      {/* dim + moment glow behind the insert */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 50% 50%, rgba(2,6,16,0.55), rgba(2,6,16,0.82))" }} />
      {rich && (
        <div className="absolute inset-0" aria-hidden
          style={{ background: `radial-gradient(60% 40% at 50% 46%, ${cue.kind === "goal" ? `${teamCol}55` : `${v.accent}33`}, transparent 70%)` }} />
      )}

      {cue.kind === "goal" && (
        <div className="relative w-full max-w-2xl px-5 text-center">
          {/* sweeping colour banner */}
          <motion.div
            initial={{ x: rich ? "-120%" : 0, opacity: rich ? 1 : 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 130, damping: 18 }}
            className="relative mx-auto flex items-center justify-center"
            style={{
              background: `linear-gradient(100deg, ${side.colors[0]}, ${side.colors[1] ?? side.colors[0]})`,
              clipPath: "polygon(4% 0, 100% 0, 96% 100%, 0 100%)",
              padding: "0.5rem 2.5rem", boxShadow: `0 12px 40px ${teamCol}66`,
            }}
          >
            <span className="font-display font-black uppercase tracking-tight text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.6)]"
              style={{ fontSize: "clamp(2.8rem, 12vw, 6rem)", lineHeight: 0.95 }}>
              Goal
            </span>
            {rich && (
              <motion.span aria-hidden className="absolute inset-0"
                initial={{ x: "-140%" }} animate={{ x: "140%" }} transition={{ delay: 0.35, duration: 0.8, ease: "easeOut" }}
                style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.55) 50%, transparent 60%)" }} />
            )}
          </motion.div>

          <motion.div
            initial={{ y: 22, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.18, duration: 0.4 }}
            className="mt-5"
          >
            <div className="font-display font-extrabold uppercase text-white" style={{ fontSize: "clamp(1.4rem, 6vw, 2.6rem)", letterSpacing: "0.01em" }}>
              {cue.player}
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider text-white/70">
              <span>{side.name}</span>
              <span className="rounded-full px-2 py-0.5 text-[0.7rem]" style={{ background: `${v.accent}22`, color: v.accent }}>{cue.minute}&apos;</span>
              {cue.assist && <span className="text-white/55">assist · {cue.assist}</span>}
            </div>
            {/* updated score */}
            <div className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-white/12 bg-black/45 px-5 py-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-white/70">{home.short}</span>
              <span className="font-display text-3xl font-black text-white">{cue.h}<span className="mx-1.5 text-white/35">–</span>{cue.a}</span>
              <span className="text-xs font-extrabold uppercase tracking-widest text-white/70">{away.short}</span>
            </div>
          </motion.div>
        </div>
      )}

      {cue.kind === "var" && (
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="relative flex flex-col items-center rounded-2xl border border-white/15 bg-black/60 px-8 py-6"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg text-2xl" style={{ background: `${v.accent}22`, border: `1px solid ${v.accent}66` }}>📺</span>
            <span className="font-display text-4xl font-black tracking-[0.2em] text-white">VAR</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.35em]" style={{ color: v.accent }}>
            Checking
            {rich && [0, 1, 2].map((i) => (
              <motion.span key={i} animate={{ opacity: [0.25, 1, 0.25] }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}>·</motion.span>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
            className="mt-3 rounded-full px-4 py-1 text-[0.7rem] font-extrabold uppercase tracking-[0.25em]"
            style={{ background: "rgba(46,230,166,0.16)", color: "#2ee6a6", border: "1px solid rgba(46,230,166,0.4)" }}
          >
            Decision Confirmed
          </motion.div>
        </motion.div>
      )}

      {cue.kind === "card" && (
        <motion.div
          initial={{ rotate: rich ? -14 : 0, y: -30, opacity: 0 }} animate={{ rotate: 0, y: 0, opacity: 1 }} exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 180, damping: 15 }}
          className="relative flex items-center gap-5 px-4"
        >
          <div className="h-24 w-16 rounded-md shadow-2xl sm:h-28 sm:w-20"
            style={{ background: cue.red ? "linear-gradient(160deg,#ff5a6a,#c81e2c)" : "linear-gradient(160deg,#ffd93d,#e0a800)", boxShadow: `0 14px 40px ${cue.red ? "rgba(255,90,106,0.5)" : "rgba(255,207,60,0.45)"}` }} />
          <div className="text-left">
            <div className="font-display text-2xl font-black uppercase text-white sm:text-3xl">{cue.red ? "Red Card" : "Yellow Card"}</div>
            <div className="mt-1 font-display text-lg font-extrabold text-white/90">{cue.player}</div>
            <div className="mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/55">
              <span>{side.name}</span>
              <span className="rounded-full px-2 py-0.5" style={{ background: `${v.accent}22`, color: v.accent }}>{cue.minute}&apos;</span>
            </div>
          </div>
        </motion.div>
      )}

      {cue.kind === "sub" && (
        <motion.div
          initial={{ y: -28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0, y: 18 }}
          transition={{ type: "spring", stiffness: 180, damping: 16 }}
          className="relative flex flex-col items-center rounded-2xl border border-white/15 bg-black/60 px-7 py-5"
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-8 rounded-full" style={{ background: side.colors[0] }} />
            <span className="font-display text-xl font-black uppercase tracking-[0.15em] text-white sm:text-2xl">Substitution</span>
            <span className="rounded-full px-2 py-0.5 text-[0.7rem] font-extrabold" style={{ background: `${v.accent}22`, color: v.accent }}>{cue.minute}&apos;</span>
          </div>
          <div className="mt-3 grid gap-1.5 text-sm">
            <div className="flex items-center gap-2 font-bold text-[#2ee6a6]"><span className="text-base">▲</span>{cue.player}</div>
            {cue.off && <div className="flex items-center gap-2 font-bold text-[#ff8a8a]"><span className="text-base">▼</span>{cue.off}</div>}
          </div>
          <div className="mt-1.5 text-[0.62rem] font-bold uppercase tracking-widest text-white/45">{side.name}</div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ================================================================== */
/*  Cinematic intro — competition ident → round → teams → kick-off     */
/* ================================================================== */

function MatchIntro({
  variant, round, home, away, stadium, legLabel, onDone,
}: {
  variant: BroadcastVariant; round: string; home: LiveTeamRef; away: LiveTeamRef;
  stadium?: string; legLabel?: string; onDone: () => void;
}) {
  const v = VARIANTS[variant];
  const [step, setStep] = useState(0);
  const doneRef = useRef(false);
  // mobile performance mode halves the intro — still cinematic, never sluggish
  const lvl = useFxLevel();
  const m = lvl === "full" ? 1 : 0.5;

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    play("whistle");
    onDone();
  };

  useEffect(() => {
    play("advance");
    const timers = [
      setTimeout(() => setStep(1), 1150 * m),
      setTimeout(() => setStep(2), 2250 * m),
      setTimeout(() => setStep(3), 3600 * m),
      setTimeout(finish, 5000 * m),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.45 } }}
      className="fixed inset-0 z-[150] flex items-center justify-center overflow-hidden"
      style={{ background: v.page }}
    >
      {/* anthem-night glow + flashes */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="fx-glow absolute left-1/2 top-[-20%] h-[70vh] w-[80vw] -translate-x-1/2 rounded-full opacity-60"
          style={{ background: `radial-gradient(circle, ${v.introGlow}, transparent 65%)`, filter: "blur(40px)" }} />
        <CameraFlashes count={14} />
      </div>

      <div className="relative z-10 px-6 text-center">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="ident" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.5 }}>
              <div className="text-6xl sm:text-7xl" style={{ color: v.accent, textShadow: `0 0 44px ${v.accent}` }}>{v.emblem}</div>
              <div className="cl-heading mt-3 text-lg tracking-[0.5em] text-white sm:text-2xl">{v.compLabel.toUpperCase()}</div>
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="round" initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.45 }}>
              <div className="cl-heading text-[0.65rem] tracking-[0.5em]" style={{ color: v.accent }}>{v.compLabel}</div>
              <div className="mt-2 font-display text-4xl font-extrabold text-white sm:text-6xl">{round}</div>
              {legLabel && <div className="mt-2 text-sm font-bold uppercase tracking-[0.3em] text-white/60">{legLabel}</div>}
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="teams" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-5 sm:gap-9">
              <motion.div initial={{ x: -70, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 130, damping: 15 }} className="flex flex-col items-center gap-2.5">
                <TeamBadge colors={home.colors} code={home.short} size={72} />
                <div className="max-w-[9rem] font-display text-sm font-extrabold text-white sm:max-w-none sm:text-lg">{home.name}</div>
              </motion.div>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.25, type: "spring", stiffness: 240, damping: 14 }}
                className="font-display text-2xl font-extrabold sm:text-3xl" style={{ color: v.accent }}>
                VS
              </motion.div>
              <motion.div initial={{ x: 70, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 130, damping: 15 }} className="flex flex-col items-center gap-2.5">
                <TeamBadge colors={away.colors} code={away.short} size={72} />
                <div className="max-w-[9rem] font-display text-sm font-extrabold text-white sm:max-w-none sm:text-lg">{away.name}</div>
              </motion.div>
            </motion.div>
          )}
          {step === 3 && (
            <motion.div key="venue" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div className="text-3xl">🏟️</div>
              <div className="mt-2 font-display text-xl font-extrabold text-white sm:text-2xl">{stadium ?? "A cauldron under the lights"}</div>
              <div className="mt-1.5 text-[0.7rem] uppercase tracking-[0.3em] text-white/50">The players walk out · the anthem fades</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={finish}
        className="absolute bottom-6 right-6 rounded-full border border-white/20 bg-black/30 px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-white/70 backdrop-blur transition-colors hover:text-white"
      >
        Skip intro ⏭
      </button>
    </motion.div>
  );
}

/* ================================================================== */
/*  Broadcast scoreboard                                               */
/* ================================================================== */

function Scoreboard({
  home, away, hGoals, aGoals, minute, endMinute, finished, clockLabel, v,
  compLine, aggNote, pens, lastGoal,
}: {
  home: LiveTeamRef; away: LiveTeamRef; hGoals: number; aGoals: number;
  minute: number; endMinute: number; finished: boolean; clockLabel: string;
  v: (typeof VARIANTS)["cl"]; compLine: string; aggNote: string | null;
  pens: [number, number] | null; lastGoal: { team: 0 | 1; minute: number } | null;
}) {
  const glow = (team: 0 | 1) =>
    lastGoal && lastGoal.team === team && minute - lastGoal.minute <= 2 && !finished
      ? { filter: `drop-shadow(0 0 14px ${v.accent})` }
      : undefined;
  const winner: 0 | 1 | null = finished
    ? pens ? (pens[0] > pens[1] ? 0 : 1) : hGoals > aGoals ? 0 : aGoals > hGoals ? 1 : null
    : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur">
      {/* competition + round line */}
      <div className="flex items-center justify-center gap-2 border-b border-white/8 px-3 py-1.5">
        <span style={{ color: v.accent }}>{v.emblem}</span>
        <span className="cl-heading text-[0.55rem] tracking-[0.35em] text-white/65">{compLine}</span>
        <span style={{ color: v.accent }}>{v.emblem}</span>
      </div>
      <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: `linear-gradient(180deg, ${home.colors[0]}, ${home.colors[1]})` }} />
      <div className="absolute inset-y-0 right-0 w-1.5" style={{ background: `linear-gradient(180deg, ${away.colors[0]}, ${away.colors[1]})` }} />

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3.5 sm:px-7">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
          <motion.div style={glow(0)} animate={glow(0) ? { scale: [1, 1.12, 1] } : {}} transition={{ duration: 0.7 }}>
            <TeamBadge colors={home.colors} code={home.short} size={44} />
          </motion.div>
          <div className="min-w-0">
            <div className={`truncate font-display text-sm font-extrabold sm:text-lg ${winner === 0 ? "" : "text-white"}`}
              style={winner === 0 ? { color: v.accent } : undefined}>
              {home.name}
            </div>
            {home.season ? <div className="text-[0.6rem] text-white/45">{home.season}</div> : null}
          </div>
        </div>

        <div className="px-1 text-center sm:px-3">
          <div className="flex items-center justify-center gap-2.5 font-display text-4xl font-extrabold sm:text-5xl">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={`h${hGoals}`} initial={{ y: -26, opacity: 0, scale: 1.3 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 26, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }} className="text-white">{hGoals}</motion.span>
            </AnimatePresence>
            <span className="text-2xl text-white/30 sm:text-3xl">–</span>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={`a${aGoals}`} initial={{ y: -26, opacity: 0, scale: 1.3 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 26, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }} className="text-white">{aGoals}</motion.span>
            </AnimatePresence>
          </div>
          <div className="mx-auto mt-1.5 flex w-fit items-center gap-1.5 rounded-md px-2.5 py-0.5 font-display text-[0.68rem] font-extrabold tracking-widest"
            style={{ background: v.soft, color: v.accent }}>
            {!finished && minute !== 45 && (
              <motion.span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500"
                animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
            )}
            {clockLabel}
          </div>
          {pens && <div className="mt-1 text-[0.62rem] font-bold text-white/70">Penalties {pens[0]}–{pens[1]}</div>}
          {aggNote && <div className="mt-1 text-[0.58rem] text-white/50">{aggNote}</div>}
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2.5 text-right sm:gap-3.5">
          <div className="min-w-0">
            <div className={`truncate font-display text-sm font-extrabold sm:text-lg ${winner === 1 ? "" : "text-white"}`}
              style={winner === 1 ? { color: v.accent } : undefined}>
              {away.name}
            </div>
            {away.season ? <div className="text-[0.6rem] text-white/45">{away.season}</div> : null}
          </div>
          <motion.div style={glow(1)} animate={glow(1) ? { scale: [1, 1.12, 1] } : {}} transition={{ duration: 0.7 }}>
            <TeamBadge colors={away.colors} code={away.short} size={44} />
          </motion.div>
        </div>
      </div>

      {/* match progress strip */}
      <div className="h-1 w-full bg-white/6">
        <div className="h-full transition-[width] duration-300"
          style={{ width: `${(Math.min(minute, endMinute) / endMinute) * 100}%`, background: `linear-gradient(90deg, ${v.accent}88, ${v.accent})` }} />
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Momentum graph — pressure bars, goals & cards along the timeline   */
/* ================================================================== */

function MomentumChart({
  r, minute, endMinute, home, away, v,
}: {
  r: MatchResult; minute: number; endMinute: number;
  home: LiveTeamRef; away: LiveTeamRef; v: (typeof VARIANTS)["cl"];
}) {
  const W = 320, H = 78, MID = H / 2;
  const n = r.momentum.length;
  const visibleSamples = Math.max(1, Math.min(n, Math.ceil((minute / endMinute) * n)));
  const barW = W / n - 2;

  return (
    <div className="glass rounded-2xl p-3.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[0.55rem] font-bold uppercase tracking-[0.3em] text-white/40">Momentum</span>
        <span className="flex items-center gap-2 text-[0.55rem] text-white/50">
          <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-full" style={{ background: home.colors[0] }} />{home.short}</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-full" style={{ background: away.colors[0] }} />{away.short}</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} className="w-full" aria-hidden>
        <line x1="0" y1={MID} x2={W} y2={MID} stroke="rgba(255,255,255,0.14)" strokeWidth="1" strokeDasharray="3 4" />
        {r.momentum.slice(0, visibleSamples).map((m, i) => {
          const x = (i / n) * W + 1;
          const h = Math.abs(m) * (MID - 6);
          const up = m >= 0;
          return (
            <rect key={i} x={x} y={up ? MID - h : MID} width={barW} height={Math.max(2, h)} rx={1.5}
              fill={up ? home.colors[0] : away.colors[0]} opacity={0.32 + Math.abs(m) * 0.6} />
          );
        })}
        {/* event markers */}
        {r.events.filter((e) => e.minute <= minute).map((e, i) => {
          const x = Math.min(W - 6, (e.minute / endMinute) * W);
          if (e.type === "goal") {
            return <text key={i} x={x} y={e.team === 0 ? 11 : H + 8} fontSize="10" textAnchor="middle">⚽</text>;
          }
          if (e.type === "yellow" || e.type === "red") {
            return <rect key={i} x={x - 2} y={e.team === 0 ? 4 : H - 2} width="4" height="6" rx="1"
              fill={e.type === "red" ? "#ff5a6a" : "#ffcf5c"} />;
          }
          return null;
        })}
        {/* now cursor */}
        {minute < endMinute && (
          <line x1={(minute / endMinute) * W} y1="2" x2={(minute / endMinute) * W} y2={H + 4}
            stroke={v.accent} strokeWidth="1.5" opacity="0.8" />
        )}
      </svg>
    </div>
  );
}

/* ================================================================== */
/*  Commentary card                                                    */
/* ================================================================== */

function FeedCard({ line, latest, v }: { line: FeedLine; latest: boolean; v: (typeof VARIANTS)["cl"] }) {
  const st = EVENT_STYLE[line.kind];
  const minuteLabel = line.minute > 90 ? `90+${line.minute - 90}'` : `${line.minute}'`;
  if (st.big) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -18, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className={`mb-2 overflow-hidden rounded-xl border p-3 ${latest ? "" : "opacity-85"}`}
        style={{ borderColor: `${st.color}55`, background: `linear-gradient(100deg, ${st.color}1c, transparent 70%)` }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl leading-none">{st.icon}</span>
          <span className="font-display text-[0.6rem] font-extrabold tracking-widest" style={{ color: st.color }}>{minuteLabel}</span>
          <span className="min-w-0 flex-1 font-display text-[0.82rem] font-extrabold leading-snug text-white">{line.text}</span>
        </div>
        {line.sub && <div className="mt-1 pl-8 text-[0.66rem] text-white/55">{line.sub}</div>}
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}
      className={`flex gap-2.5 border-b border-white/5 px-1 py-2 last:border-0 ${latest ? "" : "opacity-75"}`}
    >
      <span className="w-9 shrink-0 text-right font-display text-[0.68rem] font-extrabold" style={{ color: v.accent }}>{minuteLabel}</span>
      <span className="shrink-0 text-sm leading-5">{st.icon}</span>
      <span className="min-w-0">
        <span className="block text-[0.73rem] leading-snug" style={{ color: line.kind === "midfield" || line.kind === "atmo" ? "rgba(255,255,255,0.6)" : st.color }}>
          {line.text}
        </span>
        {line.sub && <span className="block text-[0.6rem] text-white/40">{line.sub}</span>}
      </span>
    </motion.div>
  );
}

/* ================================================================== */
/*  Live ratings                                                       */
/* ================================================================== */

interface RatedPlayer { name: string; position?: string; team: 0 | 1 }

function ratingColor(x: number): string {
  return x >= 8 ? "#d4af37" : x >= 7 ? "#2ee6a6" : x >= 6 ? "#eaf1ff" : "#ff5a6a";
}

function RatingsPanel({
  r, minute, finished, players, home, away,
}: {
  r: MatchResult; minute: number; finished: boolean;
  players: RatedPlayer[]; home: LiveTeamRef; away: LiveTeamRef;
}) {
  const rated = players
    .map((p) => ({ ...p, rating: liveRating(r, { name: p.name, team: p.team, position: p.position, minute, finished }) }))
    .sort((a, b) => b.rating - a.rating);
  const sides: [LiveTeamRef, LiveTeamRef] = [home, away];

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[0.55rem] font-bold uppercase tracking-[0.3em] text-white/40">Live Player Ratings</span>
        <span className="text-[0.55rem] text-white/40">{finished ? "Final" : "Updating live"}</span>
      </div>
      <div className="space-y-1.5">
        {rated.map((p) => (
          <div key={`${p.team}-${p.name}`} className="flex items-center gap-2.5">
            <span className="h-4 w-1 shrink-0 rounded-full" style={{ background: sides[p.team].colors[0] }} />
            {p.position && <span className="w-8 shrink-0 text-[0.55rem] font-bold uppercase text-white/40">{p.position}</span>}
            <span className={`min-w-0 flex-1 truncate text-[0.72rem] font-semibold ${finished && r.motm === p.name ? "text-gold" : "text-white/85"}`}>
              {p.name}{finished && r.motm === p.name ? " ⭐" : ""}
            </span>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/8 sm:w-24">
              <motion.div className="h-full rounded-full" animate={{ width: `${((p.rating - 4) / 6) * 100}%` }}
                transition={{ duration: 0.6 }} style={{ background: ratingColor(p.rating) }} />
            </div>
            <motion.span key={p.rating} initial={{ scale: 1.25 }} animate={{ scale: 1 }}
              className="w-8 shrink-0 text-right font-display text-[0.78rem] font-extrabold" style={{ color: ratingColor(p.rating) }}>
              {p.rating.toFixed(1)}
            </motion.span>
          </div>
        ))}
        {rated.length === 0 && <p className="py-2 text-center text-[0.68rem] text-white/45">Ratings appear as the match develops…</p>}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Star performer card (live player of the match)                     */
/* ================================================================== */

function StarPerformer({
  r, minute, finished, players, v,
}: {
  r: MatchResult; minute: number; finished: boolean; players: RatedPlayer[]; v: (typeof VARIANTS)["cl"];
}) {
  const rated = players.map((p) => ({
    ...p,
    rating: liveRating(r, { name: p.name, team: p.team, position: p.position, minute, finished }),
  }));
  const star = finished
    ? rated.find((p) => p.name === r.motm) ?? rated.sort((a, b) => b.rating - a.rating)[0]
    : rated.sort((a, b) => b.rating - a.rating)[0];
  if (!star) return null;

  const goals = r.events.filter((e) => e.minute <= minute && e.type === "goal" && e.player === star.name).length;
  const assists = r.events.filter((e) => e.minute <= minute && e.type === "goal" && e.assist === star.name).length;
  const seed = matchSeed(r) + star.name.length * 31;
  const isGK = star.position === "GK";
  const extra: [string, string][] = isGK
    ? [["Saves", `${Math.max(0, r.stats.onTarget[star.team === 0 ? 1 : 0] - (star.team === 0 ? r.awayGoals : r.homeGoals))}`], ["Claims", `${1 + Math.floor(frac(seed) * 3)}`]]
    : [["Key passes", `${1 + Math.floor(frac(seed + 3) * 3) + assists}`], ["Dribbles", `${Math.floor(frac(seed + 7) * 4)}`]];

  return (
    <div className="glass relative overflow-hidden rounded-2xl p-4">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full opacity-25" style={{ background: `radial-gradient(circle, ${v.accent}, transparent 70%)` }} />
      <div className="text-[0.55rem] font-bold uppercase tracking-[0.3em] text-white/40">
        {finished ? "⭐ Player of the Match" : "⭐ Star Performer"}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl font-display text-base font-extrabold text-white"
          style={{ background: `linear-gradient(150deg, ${v.accent}44, rgba(0,0,0,0.4))`, border: `1px solid ${v.accent}55` }}>
          {star.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-sm font-extrabold text-white">{star.name}</div>
          {star.position && <div className="text-[0.6rem] uppercase tracking-wider text-white/45">{star.position}</div>}
        </div>
        <motion.div key={star.rating} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
          className="rounded-lg px-2.5 py-1 font-display text-lg font-extrabold"
          style={{ background: v.soft, color: ratingColor(star.rating) }}>
          {star.rating.toFixed(1)}
        </motion.div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
        {[["Goals", `${goals}`], ["Assists", `${assists}`], ...extra].map(([k, val]) => (
          <div key={k} className="rounded-lg bg-white/5 px-1 py-1.5">
            <div className="font-display text-sm font-extrabold text-white">{val}</div>
            <div className="text-[0.48rem] uppercase tracking-wider text-white/40">{k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Statistics panel (expanded, animated)                              */
/* ================================================================== */

function StatsPanel({
  r, minute, endMinute, finished, home, away, v, condensed,
}: {
  r: MatchResult; minute: number; endMinute: number; finished: boolean;
  home: LiveTeamRef; away: LiveTeamRef; v: (typeof VARIANTS)["cl"]; condensed?: boolean;
}) {
  const all = useMemo(() => extendedStats(r), [r]);
  const rows = condensed ? all.slice(0, 6) : all;
  // possession converges from 50/50 to the final split
  const possT = Math.min(1, minute / 60);

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[0.62rem] font-bold text-white/70"><TeamBadge colors={home.colors} code={home.short} size={16} />{home.short}</span>
        <span className="text-[0.55rem] font-bold uppercase tracking-[0.3em] text-white/40">{condensed ? "Key Stats" : "Match Statistics"}</span>
        <span className="flex items-center gap-1.5 text-[0.62rem] font-bold text-white/70">{away.short}<TeamBadge colors={away.colors} code={away.short} size={16} /></span>
      </div>
      <div className="space-y-2.5">
        {rows.map((row) => {
          const isPoss = row.label === "Possession";
          const hv = finished ? row.h : isPoss ? Math.round(50 + (row.h - 50) * possT) : liveStat(row.h, minute, endMinute, row.h * 13 + 1);
          const av = finished ? row.a : isPoss ? Math.round(50 + (row.a - 50) * possT) : liveStat(row.a, minute, endMinute, row.a * 17 + 2);
          const share = hv + av > 0 ? (hv / (hv + av)) * 100 : 50;
          const fmt = (x: number) => `${x.toFixed(row.decimals ?? 0)}${row.suffix ?? ""}`;
          return (
            <div key={row.label}>
              <div className="flex items-baseline justify-between text-[0.7rem]">
                <span className="font-display font-extrabold text-white">{fmt(hv)}</span>
                <span className="text-[0.55rem] uppercase tracking-widest text-white/45">{row.label}</span>
                <span className="font-display font-extrabold text-white">{fmt(av)}</span>
              </div>
              <div className="mt-1 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-white/8">
                <motion.div className="h-full rounded-l-full" animate={{ width: `${share}%` }} transition={{ duration: 0.5 }}
                  style={{ background: `linear-gradient(90deg, ${home.colors[0]}, ${v.accent})` }} />
                <div className="h-full flex-1 rounded-r-full" style={{ background: "rgba(255,255,255,0.14)" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Match facts                                                        */
/* ================================================================== */

function FactsPanel({
  r, home, away, round, comp, stadium, legLabel, finished,
}: {
  r: MatchResult; home: LiveTeamRef; away: LiveTeamRef;
  round: string; comp: string; stadium?: string; legLabel?: string; finished: boolean;
}) {
  const rows: [string, string][] = [
    ["Competition", comp],
    ["Round", `${round}${legLabel ? ` · ${legLabel}` : ""}`],
    ["Fixture", `${home.name} vs ${away.name}`],
    ["Venue", stadium ?? "Continental Arena"],
    ["Referee", refereeName(r)],
    ["Attendance", attendance(r).toLocaleString()],
    ...(finished ? [["Player of the Match", r.motm] as [string, string]] : []),
  ];
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-2 text-[0.55rem] font-bold uppercase tracking-[0.3em] text-white/40">Match Facts</div>
      <dl className="space-y-2 text-[0.74rem]">
        {rows.map(([k, val]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 border-b border-white/6 pb-1.5 last:border-0">
            <dt className="shrink-0 text-white/45">{k}</dt>
            <dd className="min-w-0 truncate text-right font-semibold text-white">{val}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ================================================================== */
/*  Full-time studio board                                             */
/* ================================================================== */

function FullTimeBoard({
  r, home, away, v, round, pens, story, onContinue, continueLabel, players,
}: {
  r: MatchResult; home: LiveTeamRef; away: LiveTeamRef; v: (typeof VARIANTS)["cl"];
  round: string; pens: [number, number] | null; story: string;
  onContinue: () => void; continueLabel: string; players: RatedPlayer[];
}) {
  const winnerIdx: 0 | 1 | null = pens
    ? (pens[0] > pens[1] ? 0 : 1)
    : r.homeGoals > r.awayGoals ? 0 : r.awayGoals > r.homeGoals ? 1 : null;
  const winner = winnerIdx === null ? null : winnerIdx === 0 ? home : away;
  const scorers = (team: 0 | 1) =>
    r.events.filter((e) => e.type === "goal" && e.team === team).map((e) => `${e.player} ${e.minute}'`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
      className="overflow-hidden rounded-2xl border"
      style={{ borderColor: `${v.accent}45`, background: `linear-gradient(160deg, ${v.soft}, rgba(0,0,0,0.5))` }}
    >
      <div className="p-4 text-center sm:p-5">
        <div className="cl-heading text-[0.6rem] tracking-[0.45em]" style={{ color: v.accent }}>FULL TIME · {round.toUpperCase()}</div>
        <div className="mt-1.5 font-display text-2xl font-extrabold text-white sm:text-3xl">
          {home.short} {r.homeGoals}–{r.awayGoals} {away.short}
          {pens ? <span className="ml-2 text-base text-white/70">({pens[0]}–{pens[1]} pens)</span> : null}
        </div>
        {winner && (
          <div className="mt-1 text-sm font-bold" style={{ color: v.accent }}>
            {winner.name} {pens ? "win on penalties" : r.homeGoals === r.awayGoals ? "" : "take it"} 🏆
          </div>
        )}

        {/* scorers */}
        <div className="mx-auto mt-3 grid max-w-md grid-cols-2 gap-3 text-[0.68rem]">
          {[0, 1].map((t) => (
            <div key={t} className={t === 0 ? "text-right" : "text-left"}>
              {scorers(t as 0 | 1).map((s) => <div key={s} className="text-white/75">⚽ {s}</div>)}
              {scorers(t as 0 | 1).length === 0 && <div className="text-white/30">—</div>}
            </div>
          ))}
        </div>

        {/* the story of the match */}
        <p className="mx-auto mt-4 max-w-lg text-[0.76rem] leading-relaxed text-white/70">{story}</p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[0.62rem] text-white/50">
          <span>⭐ {r.motm}</span>
          <span>Possession {r.stats.possession[0]}%–{r.stats.possession[1]}%</span>
          <span>xG {r.stats.xg[0].toFixed(2)}–{r.stats.xg[1].toFixed(2)}</span>
        </div>

        <button className="btn btn-gold btn-pulse mt-5" onClick={onContinue}>{continueLabel}</button>
      </div>
      {/* players strip: top three performers */}
      <div className="flex justify-center gap-2 border-t border-white/8 bg-black/25 px-3 py-2">
        {players
          .map((p) => ({ ...p, rating: liveRating(r, { name: p.name, team: p.team, minute: 200, finished: true }) }))
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 3)
          .map((p) => (
            <span key={p.name} className="flex items-center gap-1.5 rounded-full bg-white/6 px-2.5 py-1 text-[0.6rem] text-white/70">
              {p.name.split(" ").pop()}
              <span className="font-display font-extrabold" style={{ color: ratingColor(p.rating) }}>{p.rating.toFixed(1)}</span>
            </span>
          ))}
      </div>
    </motion.div>
  );
}

/* ================================================================== */
/*  The broadcast itself                                               */
/* ================================================================== */

type Tab = "overview" | "timeline" | "stats" | "ratings" | "facts";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "stats", label: "Statistics" },
  { id: "ratings", label: "Ratings" },
  { id: "facts", label: "Facts" },
];

export function LiveMatch({
  legs,
  homeOf,
  awayOf,
  title,
  subtitle,
  accent,
  variant = "cl",
  stadium,
  onDone,
}: {
  legs: LiveLeg[];
  /** resolve the home/away side of a given result to displayable team refs */
  homeOf: (r: MatchResult) => LiveTeamRef;
  awayOf: (r: MatchResult) => LiveTeamRef;
  title: string;
  subtitle?: string;
  accent?: string;
  variant?: BroadcastVariant;
  stadium?: string;
  onDone: () => void;
}) {
  const v = accent ? { ...VARIANTS[variant], accent, soft: `${accent}26` } : VARIANTS[variant];
  const [legIdx, setLegIdx] = useState(0);
  const leg = legs[legIdx];
  const r = leg.result;
  const home = homeOf(r);
  const away = awayOf(r);

  const endMinute = useMemo(() => Math.max(90, ...r.events.map((e) => e.minute)), [r]);
  const feed = useMemo(() => buildFeed(r, home, away), [r]); // eslint-disable-line react-hooks/exhaustive-deps
  const story = useMemo(() => matchStory(r, home, away, title), [r]); // eslint-disable-line react-hooks/exhaustive-deps

  // players for ratings: the user's XI (from the store) + every opponent name
  // that appears in the events
  const players = useMemo<RatedPlayer[]>(() => {
    const userSide: 0 | 1 | null = home.isUser ? 0 : away.isUser ? 1 : null;
    const out: RatedPlayer[] = [];
    if (userSide !== null) {
      const xi = useGame.getState().getXI().filter(Boolean) as Player[];
      xi.forEach((p) => out.push({ name: p.name, position: p.position, team: userSide }));
    }
    const known = new Set(out.map((p) => p.name));
    for (const e of r.events) {
      for (const name of [e.player, e.assist]) {
        if (!name || known.has(name) || name === "VAR Review") continue;
        const team = e.team as 0 | 1;
        if (team === (home.isUser ? 0 : away.isUser ? 1 : -1)) continue;
        known.add(name);
        out.push({ name, team });
      }
    }
    return out;
  }, [r]); // eslint-disable-line react-hooks/exhaustive-deps

  const [introDone, setIntroDone] = useState(false);
  const [minute, setMinute] = useState(0);
  // the current full-screen broadcast overlay (GOAL / VAR / card / sub)
  const [cue, setCue] = useState<BroadcastCue | null>(null);
  const cueTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [finished, setFinished] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  // a shootout is watched (or skipped) before its score is ever revealed
  const [shootoutDone, setShootoutDone] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const hasShootout = !!r.shootout;
  const pensRevealed = !hasShootout || shootoutDone;

  const goalsAt = (team: 0 | 1, m: number) =>
    r.events.filter((e) => e.type === "goal" && e.team === team && e.minute <= m).length;
  const hGoals = finished ? r.homeGoals : goalsAt(0, minute);
  const aGoals = finished ? r.awayGoals : goalsAt(1, minute);
  const lastGoal = useMemo(() => {
    const g = r.events.filter((e) => e.type === "goal" && e.minute <= minute);
    const last = g[g.length - 1];
    return last ? { team: last.team as 0 | 1, minute: last.minute } : null;
  }, [r.events, minute]);

  // the clock — only once the intro has handed over
  useEffect(() => {
    if (!introDone || paused || finished) return;
    if (minute >= endMinute) {
      const id = setTimeout(() => { setFinished(true); play("whistle"); }, 700);
      return () => clearTimeout(id);
    }
    // linger on the big beats: half-time and any goal minute
    const isBeat = minute === 45 || r.events.some((e) => e.type === "goal" && e.minute === minute);
    const id = setTimeout(() => setMinute((m) => m + 1), (isBeat ? MS_PER_MINUTE * 3.2 : MS_PER_MINUTE) / speed);
    return () => clearTimeout(id);
  }, [minute, paused, speed, finished, endMinute, r.events, introDone]);

  // one cue per beat, most important first — never a sound pile-up
  useEffect(() => {
    if (!introDone || finished) return;
    const here = feed.filter((l) => l.minute === minute);
    if (!here.length) return;
    for (const kind of SOUND_PRIORITY) {
      const line = here.find((l) => l.kind === kind);
      if (line) {
        const cue = EVENT_SOUND[kind];
        if (cue) play(cue);
        break;
      }
    }
    // the atmosphere carries the story — the crowd swells and hushes with the
    // play, and the big moments get a full-screen broadcast overlay. No voice.
    const goal = r.events.find((e) => e.type === "goal" && e.minute === minute);
    const red = r.events.find((e) => e.type === "red" && e.minute === minute);
    const yellow = r.events.find((e) => e.type === "yellow" && e.minute === minute);
    const sub = r.events.find((e) => e.type === "sub" && e.minute === minute);
    const beat = here[0];

    // build the overlay for this beat (goal outranks red > var > yellow > sub)
    let next: BroadcastCue | null = null;
    if (goal) {
      next = {
        kind: "goal", team: goal.team as 0 | 1, player: goal.player, assist: goal.assist,
        minute, h: goalsAt(0, minute), a: goalsAt(1, minute),
      };
    } else if (red) {
      next = { kind: "card", team: red.team as 0 | 1, player: red.player, minute, red: true };
    } else if (beat?.kind === "var") {
      next = { kind: "var", minute };
    } else if (yellow) {
      next = { kind: "card", team: yellow.team as 0 | 1, player: yellow.player, minute, red: false };
    } else if (sub) {
      next = { kind: "sub", team: sub.team as 0 | 1, player: sub.player, off: sub.assist, minute };
    }

    // dynamic crowd: eruptions for goals, a rise for chances/saves, a hush
    // when the officials go to the monitor
    if (goal) swellAmbience(0.08, 2.4);
    else if (beat?.kind === "var") hushAmbience(2.2);
    else if (beat?.kind === "save" || beat?.kind === "crossbar") swellAmbience(0.045, 1.0);
    else if (beat?.kind === "chance") swellAmbience(0.03, 0.7);

    // show the overlay (deferred into a timer so it lands just after the net
    // ripple + scoreboard tick — never before the viewer sees it) and auto-clear
    if (next) {
      const c = next;
      cueTimers.current.forEach(clearTimeout);
      const show = c.kind === "goal" ? 420 : 120;
      const hold = c.kind === "goal" ? 3600 : c.kind === "var" ? 3000 : 2400;
      cueTimers.current = [
        setTimeout(() => setCue(c), show),
        setTimeout(() => setCue((cur) => (cur === c ? null : cur)), show + hold),
      ];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minute, feed, introDone, finished]);

  // clear any pending overlay timers on unmount / leg change
  useEffect(() => () => { cueTimers.current.forEach(clearTimeout); }, [legIdx]);

  // stop scheduling overlays once we reach full time (render gates on !finished)
  useEffect(() => {
    if (finished) cueTimers.current.forEach(clearTimeout);
  }, [finished]);

  // crowd bed: rises after the intro, falls at the whistle
  useEffect(() => {
    if (introDone && !finished) startAmbience();
    if (finished) stopAmbience();
    return () => stopAmbience(0.5);
  }, [introDone, finished]);

  // keep the newest commentary in view
  useEffect(() => {
    feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [minute]);

  const visible = feed.filter((l) => l.minute <= minute && (l.kind !== "ft" || finished)).reverse();
  const clockLabel = finished
    ? r.penalties ? "FT · PENS" : "FULL TIME"
    : minute === 45 ? "HALF TIME" : minute >= 90 ? `90+${minute - 90}'` : `${minute}'`;

  const skip = () => { setMinute(endMinute); setFinished(true); play("whistle"); };

  const nextLeg = legIdx < legs.length - 1;
  const continueFrom = () => {
    if (nextLeg) {
      setLegIdx(legIdx + 1);
      setMinute(0);
      setFinished(false);
      setShootoutDone(false);
      setPaused(false);
      setIntroDone(false);
      setTab("overview");
    } else {
      onDone();
    }
  };

  // aggregate line for two-legged ties (shown on the second leg)
  const aggNote = legs.length === 2 && legIdx === 1 ? (() => {
    const l1 = legs[0].result;
    // sides swap between legs: leg1 home == leg2 away
    const homeAgg = (finished ? r.homeGoals : hGoals) + l1.awayGoals;
    const awayAgg = (finished ? r.awayGoals : aGoals) + l1.homeGoals;
    return `Aggregate ${homeAgg}–${awayAgg}`;
  })() : null;

  const compLine = `${subtitle ?? v.compLabel} · ${title}${leg.label ? ` · ${leg.label}` : ""}`;
  const pens = finished && r.penalties && pensRevealed ? r.penalties : null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[140] overflow-y-auto"
      style={{ background: v.page }}
    >
      {/* stadium ambience layer */}
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="fx-glow absolute left-[12%] top-[-14%] h-[46vh] w-[42vw] rounded-full opacity-35"
          style={{ background: `radial-gradient(circle, ${v.introGlow}, transparent 65%)`, filter: "blur(46px)" }} />
        <div className="fx-glow absolute right-[8%] top-[20%] h-[38vh] w-[36vw] rounded-full opacity-25"
          style={{ background: `radial-gradient(circle, ${v.soft}, transparent 65%)`, filter: "blur(42px)" }} />
        <CameraFlashes count={8} />
        {/* crowd silhouette band */}
        <div className="absolute inset-x-0 bottom-0 h-[22vh]"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)" }} />
      </div>

      <div className="relative mx-auto w-full max-w-3xl p-3 pb-10 sm:p-6">
        <Scoreboard
          home={home} away={away} hGoals={hGoals} aGoals={aGoals}
          minute={minute} endMinute={endMinute} finished={finished}
          clockLabel={introDone ? clockLabel : "PRE-MATCH"} v={v} compLine={compLine}
          aggNote={aggNote} pens={pens} lastGoal={lastGoal}
        />

        {/* controls */}
        {!finished && introDone && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button className="btn btn-ghost px-4 py-1.5 text-[0.68rem]" onClick={() => { setPaused((p) => !p); play("click"); }}>
              {paused ? "▶ Resume" : "⏸ Pause"}
            </button>
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => { setSpeed(s); play("click"); }}
                className="rounded-full px-3 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-wider transition-colors"
                style={speed === s ? { background: v.accent, color: "#06101f" } : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }}
              >
                ×{s}
              </button>
            ))}
            <button className="btn btn-ghost px-4 py-1.5 text-[0.68rem]" onClick={skip}>⏭ Skip to Result</button>
          </div>
        )}

        {/* FULL-TIME STUDIO — the story of the night */}
        <AnimatePresence>
          {finished && pensRevealed && (
            <div className="mt-3">
              <FullTimeBoard
                r={r} home={home} away={away} v={v} round={title} pens={pens} story={story}
                onContinue={continueFrom}
                continueLabel={nextLeg ? "Continue to the 2nd Leg →" : "Continue →"}
                players={players}
              />
            </div>
          )}
        </AnimatePresence>

        {/* tab bar */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              onClick={() => { setTab(tb.id); play("click"); }}
              className="shrink-0 rounded-full px-3.5 py-1.5 text-[0.62rem] font-extrabold uppercase tracking-wider transition-colors"
              style={tab === tb.id ? { background: v.soft, color: v.accent, boxShadow: `inset 0 0 0 1px ${v.accent}55` } : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)" }}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {/* tab content */}
        <div className="mt-3">
          {tab === "overview" && (
            <div className="grid gap-3 md:grid-cols-[1.3fr_1fr]">
              <div className="space-y-3">
                <MomentumChart r={r} minute={minute} endMinute={endMinute} home={home} away={away} v={v} />
                <div ref={feedRef} className="glass max-h-[34vh] overflow-y-auto rounded-2xl p-3">
                  <AnimatePresence initial={false}>
                    {visible.slice(0, 6).map((l, i) => (
                      <FeedCard key={`${l.minute}-${l.kind}-${l.text}`} line={l} latest={i === 0} v={v} />
                    ))}
                  </AnimatePresence>
                  {visible.length === 0 && (
                    <div className="px-1 py-3 text-center text-[0.7rem] text-white/50">The teams are in the tunnel…</div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <StarPerformer r={r} minute={minute} finished={finished} players={players} v={v} />
                <StatsPanel r={r} minute={minute} endMinute={endMinute} finished={finished} home={home} away={away} v={v} condensed />
              </div>
            </div>
          )}
          {tab === "timeline" && (
            <div className="glass max-h-[58vh] overflow-y-auto rounded-2xl p-3">
              <AnimatePresence initial={false}>
                {visible.map((l, i) => (
                  <FeedCard key={`${l.minute}-${l.kind}-${l.text}`} line={l} latest={i === 0} v={v} />
                ))}
              </AnimatePresence>
              {visible.length === 0 && (
                <div className="px-1 py-3 text-center text-[0.7rem] text-white/50">The teams are in the tunnel…</div>
              )}
            </div>
          )}
          {tab === "stats" && (
            <StatsPanel r={r} minute={minute} endMinute={endMinute} finished={finished} home={home} away={away} v={v} />
          )}
          {tab === "ratings" && (
            <RatingsPanel r={r} minute={minute} finished={finished} players={players} home={home} away={away} />
          )}
          {tab === "facts" && (
            <FactsPanel r={r} home={home} away={away} round={title} comp={subtitle ?? v.compLabel} stadium={stadium} legLabel={leg.label} finished={finished} />
          )}
        </div>
      </div>

      {/* TV broadcast intro — plays before each leg, skippable */}
      <AnimatePresence>
        {!introDone && (
          <MatchIntro
            variant={variant} round={title} home={home} away={away}
            stadium={stadium} legLabel={leg.label}
            onDone={() => setIntroDone(true)}
          />
        )}
      </AnimatePresence>

      {/* cinematic broadcast overlay — GOAL / VAR / card / substitution */}
      <AnimatePresence>
        {introDone && !finished && cue && (
          <BroadcastOverlay cue={cue} home={home} away={away} v={v} />
        )}
      </AnimatePresence>

      {/* penalty shootout — plays out before the score is ever revealed */}
      <AnimatePresence>
        {finished && hasShootout && !shootoutDone && r.shootout && (
          <PenaltyShootout
            shootout={r.shootout}
            home={{ name: home.name, short: home.short, colors: home.colors }}
            away={{ name: away.name, short: away.short, colors: away.colors }}
            accent={v.accent}
            roundLabel={title}
            defaultLive
            onDone={() => setShootoutDone(true)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** The pre-match "Choose Simulation Style" prompt for the big nights. */
export function SimStyleChoice({
  title,
  accent = "#d4af37",
  onQuick,
  onLive,
  onCancel,
}: {
  title: string;
  accent?: string;
  onQuick: () => void;
  onLive: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[135] flex items-center justify-center p-4"
      style={{ background: "rgba(2,7,20,0.85)" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.92, y: 18 }} animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="glass-strong w-full max-w-md rounded-3xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cl-heading text-[0.6rem] tracking-[0.4em]" style={{ color: accent }}>{title}</div>
        <h2 className="mt-1 font-display text-2xl font-extrabold text-white">Choose Simulation Style</h2>
        <div className="mt-5 grid gap-3">
          <button
            className="shine rounded-2xl border p-4 text-left transition-transform hover:scale-[1.02]"
            style={{ borderColor: `${accent}55`, background: `linear-gradient(140deg, ${accent}1a, transparent)` }}
            onClick={onLive}
          >
            <div className="flex items-center gap-2 font-display text-base font-extrabold text-white">
              <span className="grid h-8 w-8 place-items-center rounded-lg text-lg" style={{ background: `${accent}22` }}>📡</span>
              Live Match
              <span className="chip ml-auto" style={{ background: `${accent}22`, color: accent }}>Broadcast</span>
            </div>
            <p className="mt-1.5 text-[0.72rem] leading-relaxed text-white/60">
              The full TV experience — cinematic intro, commentary, momentum, live ratings
              and statistics. Pause, speed up ×2/×4, or skip to the result at any time.
            </p>
          </button>
          <button
            className="rounded-2xl border border-white/12 bg-white/4 p-4 text-left transition-transform hover:scale-[1.02]"
            onClick={onQuick}
          >
            <div className="flex items-center gap-2 font-display text-base font-extrabold text-white">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/8 text-lg">⚡</span>
              Quick Sim
            </div>
            <p className="mt-1.5 text-[0.72rem] leading-relaxed text-white/60">
              Straight to the result with the cinematic reveal.
            </p>
          </button>
        </div>
        <button className="mt-4 text-[0.65rem] font-bold uppercase tracking-widest text-white/40 hover:text-white/70" onClick={onCancel}>
          Not yet — back to the build-up
        </button>
      </motion.div>
    </motion.div>
  );
}
