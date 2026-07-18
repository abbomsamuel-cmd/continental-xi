"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TeamBadge } from "@/components/TeamBadge";
import { CameraFlashes, Sparks } from "@/components/fx/Atmosphere";
import { useFxLevel } from "@/lib/fx";
import { play } from "@/lib/sound";

/**
 * Cinematic stage introduction — the moment between rounds is a broadcast
 * ident, not a loading screen: competition mark → round title → the teams
 * walking in from opposite sides → a premium "preparing" shimmer. Knockout
 * nights escalate (more light, more flashes), and the Final gets the full
 * treatment: trophy, countdown, kick-off whistle.
 */

type Variant = "cl" | "euro" | "copa";
// escalating knockout tiers: R16 (clean TV package) < QF (more drama) < SF
// (only four remain) < Final (trophy + countdown). "ko" is a generic alias → R16.
type Stage = "ko" | "r16" | "qf" | "sf" | "final";

interface IntroTeam {
  name: string;
  short: string;
  colors: [string, string];
}

const PAL: Record<Variant, { emblem: string; glow: string; page: string }> = {
  cl: { emblem: "★", glow: "rgba(41,98,255,0.45)", page: "radial-gradient(120% 90% at 50% 30%, #0a1440, #020714 75%)" },
  euro: { emblem: "✦", glow: "rgba(27,79,255,0.5)", page: "radial-gradient(120% 90% at 50% 30%, #081b56, #030818 75%)" },
  copa: { emblem: "◆", glow: "rgba(23,201,122,0.4)", page: "radial-gradient(120% 90% at 50% 30%, #0a3a24, #02120a 75%)" },
};

/** How dramatic each tier feels: flashes, glow strength, spark count, and the
 *  atmosphere line shown under the fixture. */
const STAGE_CFG: Record<Stage, { flashes: number; glow: number; sparks: number; note: string; prep: string }> = {
  r16: { flashes: 10, glow: 0.55, sparks: 0, note: "Round of 16 · The knockouts begin", prep: "Kick-off approaching…" },
  ko: { flashes: 10, glow: 0.55, sparks: 0, note: "Round of 16 · The knockouts begin", prep: "Kick-off approaching…" },
  qf: { flashes: 16, glow: 0.72, sparks: 8, note: "Quarter-final · Eight left standing", prep: "Out of the tunnel…" },
  sf: { flashes: 18, glow: 0.82, sparks: 12, note: "Semi-final · Only four remain", prep: "The tension builds…" },
  final: { flashes: 24, glow: 0.92, sparks: 16, note: "The Final · One match for everything", prep: "The anthem fades…" },
};

export function RoundTransition({
  show,
  title,
  subtitle,
  detail,
  accent = "#d4af37",
  duration = 1900,
  variant = "cl",
  teams,
  stage = "ko",
  stadium,
  onDone,
}: {
  show: boolean;
  title: string;
  subtitle?: string;
  /** fallback fixture line when no team refs are passed */
  detail?: string;
  accent?: string;
  duration?: number;
  variant?: Variant;
  /** the user's fixture — teams animate in from opposite sides */
  teams?: { a: IntroTeam; b: IntroTeam } | null;
  /** escalation: r16 < qf < sf < final (trophy + countdown + whistle) */
  stage?: Stage;
  /** venue for the R16/QF/SF broadcast package */
  stadium?: string;
  onDone: () => void;
}) {
  const pal = PAL[variant];
  const cfg = STAGE_CFG[stage] ?? STAGE_CFG.ko;
  const isFinal = stage === "final";
  const [count, setCount] = useState<number | null>(null);
  const doneRef = useRef(false);
  // mobile performance mode keeps stage intros short (200–400ms feel per beat)
  const lvl = useFxLevel();
  const dur = lvl === "full" ? duration : Math.max(1100, Math.round(duration * 0.5));

  useEffect(() => {
    if (!show) return;
    doneRef.current = false;
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDone();
    };
    play("advance");
    const timers: ReturnType<typeof setTimeout>[] = [setTimeout(finish, dur)];
    // the Final counts itself in: 3 · 2 · 1 · whistle
    if (isFinal && dur >= 3200) {
      [3, 2, 1].forEach((n, i) => {
        timers.push(setTimeout(() => { setCount(n); play("tick"); }, dur - 1700 + i * 450));
      });
      timers.push(setTimeout(() => { setCount(null); play("whistle"); }, dur - 300));
    }
    return () => { timers.forEach(clearTimeout); setCount(null); };
  }, [show, dur, onDone, isFinal]);

  const skipNow = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    play("click");
    onDone();
  };

  const bars = useMemo(() => Array.from({ length: 7 }, (_, i) => i), []);
  const flashCount = cfg.flashes;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[130] flex items-center justify-center overflow-hidden"
          style={{ background: pal.page }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* converging tunnel light bars */}
          {bars.map((i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute top-0 h-full w-24"
              style={{
                left: `${(i / (bars.length - 1)) * 100}%`,
                background: `linear-gradient(to bottom, ${accent}${isFinal ? "33" : "22"}, transparent 70%)`,
                transformOrigin: "top center",
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: [0, 1, 0.5] }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: "easeOut" }}
            />
          ))}
          {/* stadium glow + fog */}
          <motion.div
            aria-hidden
            className="fx-glow absolute left-1/2 top-[-16%] h-[60vh] w-[85vw] -translate-x-1/2 rounded-full"
            style={{ background: `radial-gradient(circle, ${pal.glow}, transparent 65%)`, filter: "blur(46px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: cfg.glow }} transition={{ duration: 0.8 }}
          />
          <motion.div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/3"
            style={{ background: `radial-gradient(60% 100% at 50% 100%, ${accent}30, transparent 70%)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          />
          <CameraFlashes count={flashCount} />
          {cfg.sparks > 0 && <Sparks count={cfg.sparks} color={accent} />}

          <div className="relative z-10 w-full max-w-2xl px-6 text-center">
            {/* competition ident */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-4xl"
              style={{ color: accent, textShadow: `0 0 34px ${accent}` }}
            >
              {isFinal ? "🏆" : pal.emblem}
            </motion.div>
            {subtitle && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="cl-heading mt-2 text-[0.65rem] tracking-[0.45em]"
                style={{ color: accent }}
              >
                {subtitle}
              </motion.div>
            )}
            <motion.h2
              initial={{ opacity: 0, scale: 0.85, y: 26 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 160, damping: 16 }}
              className="mt-2 font-display text-4xl font-extrabold text-white sm:text-6xl"
            >
              {title}
            </motion.h2>
            {!isFinal && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                className="mt-2 text-[0.7rem] font-bold uppercase tracking-[0.32em] text-white/60">
                {cfg.note}
              </motion.div>
            )}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="mx-auto mt-4 h-px w-48"
              style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
            />

            {/* the fixture: teams walk in from opposite sides */}
            {teams ? (
              <div className="mx-auto mt-6 flex max-w-lg items-center justify-center gap-4 sm:gap-8">
                <motion.div
                  initial={{ x: -70, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.55, type: "spring", stiffness: 130, damping: 15 }}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <TeamBadge colors={teams.a.colors} code={teams.a.short} size={56} />
                  <div className="max-w-[10rem] font-display text-[0.8rem] font-extrabold leading-tight text-white">{teams.a.name}</div>
                </motion.div>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 0.75, type: "spring", stiffness: 240, damping: 14 }}
                  className="font-display text-xl font-extrabold sm:text-2xl" style={{ color: accent }}
                >
                  VS
                </motion.div>
                <motion.div
                  initial={{ x: 70, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.55, type: "spring", stiffness: 130, damping: 15 }}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <TeamBadge colors={teams.b.colors} code={teams.b.short} size={56} />
                  <div className="max-w-[10rem] font-display text-[0.8rem] font-extrabold leading-tight text-white">{teams.b.name}</div>
                </motion.div>
              </div>
            ) : detail ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ delay: 0.55 }}
                className="mx-auto mt-4 max-w-sm text-sm font-semibold text-white/80"
              >
                {detail}
              </motion.p>
            ) : null}

            {/* venue — the TV broadcast package (not the Final, which counts in) */}
            {stadium && !isFinal && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
                className="mt-4 flex items-center justify-center gap-2 text-[0.72rem] font-semibold text-white/55"
              >
                <span aria-hidden>🏟️</span>
                <span className="uppercase tracking-[0.2em]">{stadium}</span>
              </motion.div>
            )}

            {/* the Final counts itself in */}
            <AnimatePresence mode="popLayout">
              {count !== null && (
                <motion.div
                  key={count}
                  initial={{ scale: 2.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="mt-5 font-display text-5xl font-extrabold"
                  style={{ color: accent, textShadow: `0 0 30px ${accent}` }}
                >
                  {count}
                </motion.div>
              )}
            </AnimatePresence>

            {/* premium preparing shimmer — a travelling light, not a bar */}
            {count === null && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mx-auto mt-6 w-56">
                <div className="relative h-px overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
                  <motion.span
                    className="absolute top-0 h-px w-20"
                    style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
                    animate={{ left: ["-30%", "110%"] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
                <div className="mt-2 text-[0.56rem] uppercase tracking-[0.4em] text-white/40">
                  {cfg.prep}
                </div>
              </motion.div>
            )}
          </div>

          {/* anything longer than 2s can always be skipped */}
          {dur > 2000 && (
            <button
              onClick={skipNow}
              className="absolute bottom-5 right-5 rounded-full border border-white/20 bg-black/30 px-4 py-1.5 text-[0.62rem] font-bold uppercase tracking-widest text-white/70 transition-colors hover:text-white"
            >
              Skip ⏭
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
