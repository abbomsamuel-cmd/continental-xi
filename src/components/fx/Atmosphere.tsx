"use client";

import { useMemo } from "react";
import { motion, MotionConfig } from "framer-motion";
import { useFxLevel } from "@/lib/fx";

/** Scale a particle count by the effective FX level (0 hides the layer).
 *  Phone simple mode ("reduced") drops decorative particles entirely. */
function scaled(full: number, lvl: "full" | "reduced" | "off"): number {
  return lvl === "full" ? full : 0;
}

function frac(n: number): number {
  const x = Math.sin(n) * 43758.5453;
  // two decimals — coarser values serialize identically on server and client,
  // so SSR never reports a hydration mismatch from float formatting
  return Math.round((x - Math.floor(x)) * 100) / 100;
}

/** Falling rain streaks — the elimination-night weather. Transform-only. */
export function RainOverlay({ drops = 42, opacity = 0.5 }: { drops?: number; opacity?: number }) {
  const lvl = useFxLevel();
  const n = scaled(drops, lvl);
  const rain = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        id: i,
        x: frac(i * 1.37) * 100,
        len: 34 + frac(i * 2.9) * 50,
        dur: 0.7 + frac(i * 4.1) * 0.9,
        delay: frac(i * 6.3) * 1.4,
        alpha: 0.12 + frac(i * 8.7) * 0.25,
      })),
    [n],
  );
  if (n === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity }} aria-hidden>
      {rain.map((r) => (
        <span
          key={r.id}
          className="absolute top-0 w-px"
          style={{
            left: `${r.x}%`,
            height: r.len,
            background: `linear-gradient(to bottom, transparent, rgba(190,215,255,${r.alpha}))`,
            animation: `rainFall ${r.dur}s linear ${r.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/** Camera flashes popping across the stands. */
export function CameraFlashes({ count = 14 }: { count?: number }) {
  const lvl = useFxLevel();
  const n = scaled(count, lvl);
  const flashes = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        id: i,
        x: frac(i * 3.1) * 100,
        y: 35 + frac(i * 5.7) * 60,
        dur: 2.2 + frac(i * 7.3) * 3.4,
        delay: frac(i * 9.1) * 4,
        size: 3 + frac(i * 11.3) * 5,
      })),
    [n],
  );
  if (n === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {flashes.map((f) => (
        <span
          key={f.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            width: f.size,
            height: f.size,
            boxShadow: "0 0 12px 4px rgba(255,255,255,0.7)",
            animation: `flashPop ${f.dur}s ease-out ${f.delay}s infinite`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

/** Golden confetti rain for celebrations. */
export function Confetti({
  count = 110,
  colors = ["#d4af37", "#22e0ff", "#ffffff", "#f2d472", "#8a7bff"],
}: {
  count?: number;
  colors?: string[];
}) {
  const lvl = useFxLevel();
  // confetti is the ONE celebration layer phones keep — a light fall, so a
  // championship never feels dead on mobile
  const n = lvl === "off" ? 0 : lvl === "reduced" ? Math.min(24, count) : count;
  const pieces = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        id: i,
        x: frac(i * 1.13) * 100,
        delay: frac(i * 2.7) * 2.5,
        dur: 2.4 + frac(i * 3.9) * 2.6,
        color: colors[i % colors.length],
        size: 5 + frac(i * 5.1) * 7,
        rot: frac(i * 7.3) * 360,
        sway: (frac(i * 9.9) - 0.5) * 80,
      })),
    [n, colors],
  );
  if (n === 0) return null;
  return (
    // local override: confetti must still FALL on phones even though the root
    // MotionGate disables transform animations below the full FX level
    <MotionConfig reducedMotion="never">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {pieces.map((p) => (
          <motion.div
            key={p.id}
            className="absolute top-[-10%]"
            style={{ left: `${p.x}%`, width: p.size, height: p.size * 1.6, background: p.color, borderRadius: 2 }}
            initial={{ y: -40, x: 0, rotate: p.rot, opacity: 1 }}
            animate={{ y: "115vh", x: p.sway, rotate: p.rot + 540, opacity: [1, 1, 0.4] }}
            transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </div>
    </MotionConfig>
  );
}

/** Rising sparks / embers for hot celebration scenes. */
export function Sparks({ count = 22, color = "#ffd76b" }: { count?: number; color?: string }) {
  const lvl = useFxLevel();
  const n = scaled(count, lvl);
  const sparks = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        id: i,
        x: frac(i * 2.3) * 100,
        size: 2 + frac(i * 4.9) * 3,
        dur: 3 + frac(i * 6.1) * 4,
        delay: frac(i * 8.3) * 5,
        drift: (frac(i * 10.7) - 0.5) * 60,
      })),
    [n],
  );
  if (n === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {sparks.map((s) => (
        <motion.span
          key={s.id}
          className="absolute bottom-0 rounded-full"
          style={{ left: `${s.x}%`, width: s.size, height: s.size, background: color, boxShadow: `0 0 8px ${color}` }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: "-92vh", x: s.drift, opacity: [0, 0.9, 0] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
