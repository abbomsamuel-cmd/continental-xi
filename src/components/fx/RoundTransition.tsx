"use client";

import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Cinematic between-round overlay: tunnel light bars converge, the round title
 * slides in over the fixture line, then control is handed back via `onDone`.
 * Group-stage rounds run quicker than knockout nights — pass `duration` (ms).
 */
export function RoundTransition({
  show,
  title,
  subtitle,
  detail,
  accent = "#d4af37",
  duration = 1900,
  onDone,
}: {
  show: boolean;
  title: string;
  subtitle?: string;
  /** the fixture being played, e.g. "Croatia 2008 vs Spain 2012" */
  detail?: string;
  accent?: string;
  duration?: number;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!show) return;
    const id = setTimeout(onDone, duration);
    return () => clearTimeout(id);
  }, [show, duration, onDone]);

  const bars = useMemo(() => Array.from({ length: 7 }, (_, i) => i), []);
  const progressSecs = Math.max(0.6, (duration - 350) / 1000);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[130] flex items-center justify-center overflow-hidden"
          style={{ background: "radial-gradient(120% 90% at 50% 30%, #0a1440, #020714 75%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* converging tunnel light bars */}
          {bars.map((i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute top-0 h-full w-24"
              style={{
                left: `${(i / (bars.length - 1)) * 100}%`,
                background: `linear-gradient(to bottom, ${accent}22, transparent 70%)`,
                transformOrigin: "top center",
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: [0, 1, 0.5] }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: "easeOut" }}
            />
          ))}
          {/* floor glow, like the mouth of the tunnel */}
          <motion.div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/3"
            style={{ background: `radial-gradient(60% 100% at 50% 100%, ${accent}30, transparent 70%)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          />

          <div className="relative z-10 px-6 text-center">
            {subtitle && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="cl-heading text-[0.65rem] tracking-[0.45em]"
                style={{ color: accent }}
              >
                {subtitle}
              </motion.div>
            )}
            <motion.h2
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 160, damping: 16 }}
              className="mt-2 font-display text-4xl font-extrabold text-white sm:text-6xl"
            >
              {title}
            </motion.h2>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="mx-auto mt-4 h-px w-48"
              style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
            />
            {detail && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ delay: 0.55 }}
                className="mx-auto mt-4 max-w-sm text-sm font-semibold text-white/80"
              >
                {detail}
              </motion.p>
            )}
            {/* whistle-to-kickoff progress shimmer */}
            <motion.div className="mx-auto mt-6 h-1 w-40 overflow-hidden rounded-full bg-white/10">
              <motion.span
                className="block h-full rounded-full"
                style={{ background: accent }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: progressSecs, delay: 0.2, ease: "easeInOut" }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
