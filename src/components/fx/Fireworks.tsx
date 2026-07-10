"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

/** Deterministic pseudo-random in [0,1), rounded so SSR output is stable. */
function frac(n: number): number {
  const x = Math.sin(n) * 43758.5453;
  return Math.round((x - Math.floor(x)) * 100) / 100;
}

/**
 * CSS/motion firework display: shells launch, burst into radial sparks and
 * fade. Pure transform/opacity animation — no canvas — so it composites on
 * the GPU. Sized to its nearest positioned ancestor.
 */
export function Fireworks({
  count = 6,
  palette = ["#ffd76b", "#f2d472", "#22e0ff", "#ffffff", "#ff8a3d"],
}: {
  count?: number;
  palette?: string[];
}) {
  const shells = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: 10 + frac(i * 3.7) * 80, // %
        y: 12 + frac(i * 5.3) * 38, // %
        delay: frac(i * 7.1) * 3.2,
        color: palette[i % palette.length],
        sparks: 12,
        size: 44 + frac(i * 9.7) * 60,
      })),
    [count, palette],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {shells.map((s) => (
        <div key={s.id} className="absolute" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
          {/* burst core flash */}
          <motion.span
            className="absolute rounded-full"
            style={{ width: 10, height: 10, marginLeft: -5, marginTop: -5, background: s.color, filter: "blur(1px)" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 3.2, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1.6, delay: s.delay, repeat: Infinity, repeatDelay: 2.4, ease: "easeOut" }}
          />
          {/* radial sparks */}
          {Array.from({ length: s.sparks }, (_, k) => {
            const a = (Math.PI * 2 * k) / s.sparks + frac(s.id * 13 + k) * 0.4;
            const d = s.size * (0.75 + frac(s.id * 17 + k) * 0.5);
            return (
              <motion.span
                key={k}
                className="absolute rounded-full"
                style={{ width: 4, height: 4, marginLeft: -2, marginTop: -2, background: s.color, boxShadow: `0 0 6px ${s.color}` }}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{
                  x: [0, Math.cos(a) * d],
                  y: [0, Math.sin(a) * d + 14],
                  opacity: [0, 1, 0],
                  scale: [1, 0.4],
                }}
                transition={{ duration: 1.7, delay: s.delay + 0.05, repeat: Infinity, repeatDelay: 2.3, ease: "easeOut" }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
