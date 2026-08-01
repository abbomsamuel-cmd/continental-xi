"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useFxLevel } from "@/lib/fx";

/**
 * Per-screen background ambience: a handful of slowly-drifting light motes and
 * two soft, blurred spotlights tinted to the current route. Sits above the
 * global stadium canvas but behind all content (z-0). Everything animates with
 * transform/opacity only and is silenced by the global reduced-motion rule, so
 * it stays cheap and calm. Deterministic positions → no hydration mismatch.
 */

// stable pseudo-random in [0,1) — two decimals so SSR and CSR serialize alike
function frac(n: number): number {
  const x = Math.sin(n) * 43758.5453;
  return Math.round((x - Math.floor(x)) * 100) / 100;
}

type Theme = { motes: string[]; spotA: string; spotB: string };

// keyed by the first path segment; each screen owns a colour temperature
const THEMES: Record<string, Theme> = {
  "": { motes: ["#d4af37", "#00f0ff", "#ffffff"], spotA: "rgba(0,240,255,0.16)", spotB: "rgba(27,63,208,0.12)" },
  draft: { motes: ["#d4af37", "#00f0ff", "#ffffff"], spotA: "rgba(27,63,208,0.16)", spotB: "rgba(0,240,255,0.13)" },
  tournament: { motes: ["#d4af37", "#00f0ff", "#ffffff"], spotA: "rgba(0,240,255,0.17)", spotB: "rgba(27,63,208,0.12)" },
  squad: { motes: ["#d4af37", "#00f0ff", "#ffffff"], spotA: "rgba(27,63,208,0.15)", spotB: "rgba(0,240,255,0.12)" },
  history: { motes: ["#9fb3d1", "#00f0ff", "#ffffff"], spotA: "rgba(0,240,255,0.12)", spotB: "rgba(27,63,208,0.12)" },
  stats: { motes: ["#d4af37", "#00f0ff", "#ffffff"], spotA: "rgba(0,240,255,0.15)", spotB: "rgba(27,63,208,0.1)" },
  daily: { motes: ["#00f0ff", "#7dfaff", "#ffffff"], spotA: "rgba(0,240,255,0.16)", spotB: "rgba(27,63,208,0.12)" },
  international: { motes: ["#ff3b57", "#00e676", "#ffffff"], spotA: "rgba(255,59,87,0.14)", spotB: "rgba(0,230,118,0.12)" },
};

export function Ambience() {
  const pathname = usePathname();
  const lvl = useFxLevel();
  const seg = (pathname ?? "/").split("/").filter(Boolean)[0] ?? "";
  const theme = THEMES[seg] ?? THEMES[""];
  const moteCount = lvl === "full" ? 16 : 0;

  // one calm field of motes; re-seeded per route so screens feel distinct
  const motes = useMemo(() => {
    const seed = seg.length + 1;
    return Array.from({ length: moteCount }, (_, i) => {
      const k = (i + 1) * seed;
      return {
        id: i,
        left: frac(k * 1.7) * 100,
        size: 2 + frac(k * 2.3) * 4,
        dur: 16 + frac(k * 3.1) * 18,
        delay: -frac(k * 4.7) * 20,
        drift: (frac(k * 5.9) - 0.5) * 12,
        color: theme.motes[i % theme.motes.length],
        startY: frac(k * 6.7) * 100,
        maxOpacity: 0.18 + frac(k * 7.3) * 0.32,
      };
    });
  }, [seg, theme.motes, moteCount]);

  // phone simple mode: no decorative layer at all below the full FX level
  if (lvl !== "full") return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* two soft spotlights that breathe across the frame — full mode only
          (a full-screen blur is the single most expensive layer on phones) */}
      {lvl === "full" && (
        <>
          <div
            className="aurora absolute -top-[12%] left-[8%] h-[52vh] w-[48vw] rounded-full"
            style={{ background: `radial-gradient(circle, ${theme.spotA}, transparent 68%)` }}
          />
          <div
            className="aurora absolute bottom-[-10%] right-[6%] h-[48vh] w-[44vw] rounded-full"
            style={{ background: `radial-gradient(circle, ${theme.spotB}, transparent 68%)`, animationDelay: "-8s" }}
          />
        </>
      )}
      {/* drifting light motes */}
      {motes.map((m) => (
        <span
          key={m.id}
          className="absolute rounded-full"
          style={{
            left: `${m.left}%`,
            top: `${m.startY}%`,
            width: m.size,
            height: m.size,
            background: m.color,
            boxShadow: `0 0 ${m.size * 2.5}px ${m.color}`,
            // custom props drive the keyframe drift + peak opacity
            "--mote-x": `${m.drift}px`,
            "--mote-o": m.maxOpacity,
            opacity: 0,
            animation: `moteFloat ${m.dur}s ease-in-out ${m.delay}s infinite`,
            willChange: "transform, opacity",
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
