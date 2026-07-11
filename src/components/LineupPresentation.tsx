"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Formation, Player } from "@/lib/types";
import { POSITION_GROUP } from "@/lib/formations";
import { CameraFlashes, Sparks } from "@/components/fx/Atmosphere";
import { LineupCard, type BadgeKind } from "@/components/LineupCard";
import type { PitchVariant } from "@/components/Pitch";
import { play } from "@/lib/sound";

/** Broadcast board look per competition — matches the pitch identities. */
const PRES: Record<PitchVariant, { bg: string; line: string; badge: BadgeKind; nameAccent: string }> = {
  cl: {
    bg: "radial-gradient(135% 85% at 50% -14%, rgba(64,120,255,0.42), transparent 56%), radial-gradient(80% 55% at 88% 6%, rgba(140,95,255,0.18), transparent 60%), repeating-linear-gradient(0deg, #071a52 0px, #071a52 44px, #0b2464 44px, #0b2464 88px)",
    line: "rgba(190,215,255,0.4)", badge: "crest", nameAccent: "#1546c8",
  },
  euro: {
    bg: "radial-gradient(120% 85% at 50% -12%, rgba(27,79,255,0.4), transparent 58%), repeating-linear-gradient(0deg, #0e7a3f 0px, #0e7a3f 42px, #128a48 42px, #128a48 84px)",
    line: "rgba(255,255,255,0.5)", badge: "flag", nameAccent: "#1b3fd0",
  },
  copa: {
    bg: "radial-gradient(120% 80% at 50% -10%, rgba(255,201,60,0.2), transparent 55%), repeating-linear-gradient(0deg, #0a5a34 0px, #0a5a34 42px, #0c6a3d 42px, #0c6a3d 84px)",
    line: "rgba(255,236,190,0.5)", badge: "flag", nameAccent: "#9a6b00",
  },
};

// same safe inset as the interactive pitch, so the GK & wingers stay inside
function project(x: number, y: number) {
  return { left: `${9 + x * 0.82}%`, top: `${9 + (100 - y) * 0.8}%` };
}

/**
 * Optional TV-style lineup presentation: competition intro, then the XI walks
 * out group by group — GK, defence, midfield, attack — captain highlighted,
 * tactic and overall revealed last. Skippable at any moment.
 */

interface Props {
  compLabel: string;
  teamName: string;
  formation: Formation;
  players: (Player | null)[];
  captainId?: string | null;
  tacticName?: string;
  overall: number;
  accent: string;
  variant?: PitchVariant;
  onDone: () => void;
}

const GROUP_ORDER = ["GK", "DEF", "MID", "ATT"] as const;

export function LineupPresentation({ compLabel, teamName, formation, players, captainId, tacticName, overall, accent, variant = "cl", onDone }: Props) {
  const board = PRES[variant] ?? PRES.cl;
  // entrance order: goalkeeper first, then the lines, right-to-left in each
  const order = useMemo(() => {
    const idx = formation.slots.map((s, i) => ({ i, g: POSITION_GROUP[s.pos], x: s.x }));
    const seq: number[] = [];
    for (const g of GROUP_ORDER) {
      seq.push(...idx.filter((s) => s.g === g).sort((a, b) => b.x - a.x).map((s) => s.i));
    }
    return seq;
  }, [formation]);

  const [step, setStep] = useState(-1); // -1 = intro card, then 0..10 players, then extras
  const total = order.length;

  useEffect(() => {
    play("whistle");
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setStep(0), 1600)); // intro hold
    for (let i = 1; i <= total + 2; i++) {
      timers.push(setTimeout(() => {
        setStep(i);
        if (i <= total) play("click");
        if (i === total + 1) play("win"); // captain + plates
      }, 1600 + i * 480));
    }
    return () => timers.forEach(clearTimeout);
  }, [total]);

  const revealed = new Set(order.slice(0, Math.max(0, Math.min(step, total))));
  const extrasIn = step > total;
  const captainSlot = captainId ? players.findIndex((p) => p?.id === captainId) : -1;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex flex-col items-center justify-center overflow-y-auto p-4"
      style={{ background: "radial-gradient(120% 90% at 50% 18%, #08133a, #020714 78%)" }}
    >
      <CameraFlashes count={14} />
      <Sparks count={8} color={accent} />

      {/* intro card */}
      <AnimatePresence>
        {step < 0 && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.06 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center"
          >
            <div className="cl-heading text-[0.7rem] tracking-[0.5em]" style={{ color: accent }}>{compLabel}</div>
            <h1 className="mt-3 font-display text-4xl font-extrabold text-white sm:text-6xl">{teamName}</h1>
            <div className="mt-2 text-sm font-bold uppercase tracking-[0.35em] text-white/60">{formation.name} · Starting XI</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* broadcast board */}
      <div className="relative w-full max-w-md">
        <div className="mb-2 flex items-end justify-between px-1">
          <div>
            <div className="cl-heading text-[0.55rem] tracking-[0.4em]" style={{ color: accent }}>{compLabel}</div>
            <div className="font-display text-xl font-extrabold text-white">{teamName}</div>
          </div>
          <div className="text-[0.65rem] font-bold uppercase tracking-widest text-white/55">{formation.name}</div>
        </div>

        <div
          className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl"
          style={{
            background: board.bg,
            border: `1.5px solid ${accent}66`,
            boxShadow: `0 24px 70px rgba(0,0,0,0.6), 0 0 44px ${accent}22`,
          }}
        >
          <svg viewBox="0 0 100 133" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            <g fill="none" stroke={board.line} strokeWidth="0.5">
              <rect x="4" y="4" width="92" height="125" rx="1" />
              <line x1="4" y1="66.5" x2="96" y2="66.5" />
              <circle cx="50" cy="66.5" r="11" />
              <rect x="28" y="4" width="44" height="20" />
              <rect x="28" y="109" width="44" height="20" />
            </g>
          </svg>

          {formation.slots.map((slot, i) => {
            const p = players[i];
            if (!p) return null;
            const shown = revealed.has(i);
            const isCap = extrasIn && i === captainSlot;
            const at = project(slot.x, slot.y);
            return (
              <AnimatePresence key={i}>
                {shown && (
                  <motion.div
                    initial={{ opacity: 0, y: 26, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: isCap ? 1.14 : 1 }}
                    transition={{ type: "spring", stiffness: 210, damping: 16 }}
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: at.left, top: at.top }}
                  >
                    <LineupCard
                      name={p.name}
                      overall={p.overall}
                      colors={p.colors}
                      seasonLabel={p.seasonLabel}
                      slotPos={slot.pos}
                      badge={board.badge}
                      nameAccent={board.nameAccent}
                      captain={isCap}
                      slotGlow="rgba(242,212,114,0.85)"
                      widthClass="w-[clamp(44px,13vw,58px)]"
                      portraitClass="h-[clamp(28px,8vw,40px)]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </div>

        {/* tactic + overall plates */}
        <AnimatePresence>
          {extrasIn && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center justify-center gap-3"
            >
              {tacticName && (
                <span className="chip px-4 py-1.5 text-[0.7rem]" style={{ background: `${accent}1e`, color: accent }}>
                  {tacticName}
                </span>
              )}
              <span className="rounded-xl px-4 py-1.5 font-display text-xl font-extrabold text-[#041022]"
                style={{ background: "linear-gradient(150deg, #f2d472, #d4af37)" }}>
                {overall} OVR
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-20 mt-5 flex gap-3">
        {extrasIn ? (
          <button className="btn btn-gold" onClick={onDone}>Continue →</button>
        ) : (
          <button className="btn btn-ghost text-xs" onClick={onDone}>Skip Presentation</button>
        )}
      </div>
    </motion.div>
  );
}
