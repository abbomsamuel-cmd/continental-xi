"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Formation, Player } from "@/lib/types";
import { POSITION_GROUP } from "@/lib/formations";
import { CameraFlashes, Sparks } from "@/components/fx/Atmosphere";
import { LineupCard } from "@/components/LineupCard";
import type { PitchVariant } from "@/components/Pitch";
import { play } from "@/lib/sound";

/** Broadcast graphic identity per competition — matches the pitch tiles and the
 *  reference lineup art (CL European night, EURO clean international, Copa gold). */
const PRES: Record<PitchVariant, {
  page: string; bg: string; grass: string; line: string; frame: string;
  accent: string; emblem: string; title: string; topTag: string; footTag: string;
}> = {
  cl: {
    page: "radial-gradient(120% 90% at 50% 12%, #0a1c52, #02040f 78%)",
    bg: "radial-gradient(120% 60% at 50% -10%, rgba(70,130,255,0.5), transparent 60%), radial-gradient(70% 45% at 88% 4%, rgba(150,100,255,0.22), transparent 62%), linear-gradient(180deg, #0a1f5c 0%, #071845 55%, #050f30 100%)",
    grass: "repeating-linear-gradient(0deg, rgba(120,170,255,0.05) 0 46px, rgba(120,170,255,0.09) 46px 92px)",
    line: "rgba(190,215,255,0.32)", frame: "rgba(212,175,55,0.5)",
    accent: "#37e0ff", emblem: "🏆", title: "CHAMPIONS LEAGUE XI", topTag: "BUILD YOUR LEGACY", footTag: "CHOOSE LEGENDS. WRITE HISTORY.",
  },
  euro: {
    page: "radial-gradient(120% 90% at 50% 12%, #0a2a66, #04102e 80%)",
    bg: "radial-gradient(120% 60% at 50% -8%, rgba(27,79,255,0.4), transparent 60%), linear-gradient(180deg, #12924c 0%, #0f8446 55%, #0c6f3b 100%)",
    grass: "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 46px, rgba(0,0,0,0.05) 46px 92px)",
    line: "rgba(255,255,255,0.5)", frame: "rgba(120,160,255,0.6)",
    accent: "#7fb0ff", emblem: "🏆", title: "EURO · STARTING XI", topTag: "YOUR NATION · YOUR XI", footTag: "YOUR NATION. YOUR XI. YOUR MOMENT.",
  },
  copa: {
    page: "radial-gradient(120% 90% at 50% 12%, #0c3a22, #04160c 80%)",
    bg: "radial-gradient(120% 60% at 50% -8%, rgba(255,201,60,0.18), transparent 58%), linear-gradient(180deg, #126a3d 0%, #0c552f 55%, #073a20 100%)",
    grass: "repeating-linear-gradient(0deg, rgba(255,236,190,0.045) 0 46px, rgba(0,0,0,0.06) 46px 92px)",
    line: "rgba(255,236,190,0.4)", frame: "rgba(255,201,60,0.6)",
    accent: "#ffc93c", emblem: "🏆", title: "COPA AMÉRICA XI", topTag: "ONE CONTINENT · ONE PASSION", footTag: "ONE CONTINENT. ONE PASSION. ONE TROPHY.",
  },
};

// same inset as the interactive pitch
function project(x: number, y: number) {
  return { left: `${8 + x * 0.84}%`, top: `${8 + (100 - y) * 0.72}%` };
}

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

function StatBlock({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="text-center">
      <div className="text-[0.5rem] font-bold uppercase tracking-[0.2em] text-white/45">{label}</div>
      <div className="font-display text-sm font-extrabold leading-tight" style={{ color: accent }}>{value}</div>
    </div>
  );
}

export function LineupPresentation({ compLabel, teamName, formation, players, captainId, tacticName, overall, variant = "cl", onDone }: Props) {
  const p = PRES[variant] ?? PRES.cl;
  const order = useMemo(() => {
    const idx = formation.slots.map((s, i) => ({ i, g: POSITION_GROUP[s.pos], x: s.x }));
    const seq: number[] = [];
    for (const g of GROUP_ORDER) {
      seq.push(...idx.filter((s) => s.g === g).sort((a, b) => b.x - a.x).map((s) => s.i));
    }
    return seq;
  }, [formation]);

  const [step, setStep] = useState(-1);
  const total = order.length;

  useEffect(() => {
    play("whistle");
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setStep(0), 1500));
    for (let i = 1; i <= total + 2; i++) {
      timers.push(setTimeout(() => {
        setStep(i);
        if (i <= total) play("click");
        if (i === total + 1) play("win");
      }, 1500 + i * 440));
    }
    return () => timers.forEach(clearTimeout);
  }, [total]);

  const revealed = new Set(order.slice(0, Math.max(0, Math.min(step, total))));
  const extrasIn = step > total;
  const captainSlot = captainId ? players.findIndex((pl) => pl?.id === captainId) : -1;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex flex-col items-center justify-center overflow-y-auto p-3 sm:p-5"
      style={{ background: p.page }}
    >
      <CameraFlashes count={14} />
      <Sparks count={8} color={p.accent} />

      {/* intro flash */}
      <AnimatePresence>
        {step < 0 && (
          <motion.div key="intro"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.06 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center">
            <div className="cl-heading text-[0.7rem] tracking-[0.5em]" style={{ color: p.accent }}>{compLabel}</div>
            <h1 className="mt-3 font-display text-4xl font-extrabold text-white sm:text-6xl">{teamName}</h1>
            <div className="mt-2 text-sm font-bold uppercase tracking-[0.35em] text-white/60">{formation.name} · Starting XI</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THE BROADCAST GRAPHIC */}
      <div className="relative w-full max-w-[540px] overflow-hidden rounded-[20px]"
        style={{ border: `1px solid ${p.frame}`, boxShadow: `0 30px 80px rgba(0,0,0,0.65), 0 0 50px ${p.accent}18` }}>

        {/* header bar */}
        <div className="flex items-center justify-between gap-2 px-4 py-3"
          style={{ background: "linear-gradient(180deg, rgba(3,9,26,0.96), rgba(3,9,26,0.86))", borderBottom: `1px solid ${p.frame}` }}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-base" style={{ background: `${p.accent}22`, border: `1px solid ${p.frame}` }}>{p.emblem}</span>
            <div className="min-w-0">
              <div className="truncate font-display text-sm font-extrabold uppercase leading-tight tracking-wide text-white">{p.title}</div>
              <div className="truncate text-[0.5rem] font-bold uppercase tracking-[0.3em]" style={{ color: p.accent }}>{p.topTag}</div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <StatBlock label="Formation" value={formation.name} accent="#fff" />
            {tacticName && <StatBlock label="Tactic" value={tacticName} accent={p.accent} />}
            <div className="grid h-10 w-10 place-items-center rounded-lg font-display text-lg font-extrabold text-[#08131f]"
              style={{ background: "linear-gradient(150deg, #f7dd84, #d4af37)", boxShadow: "0 2px 10px rgba(212,175,55,0.4)" }}>{overall}</div>
          </div>
        </div>

        {/* pitch */}
        <div className="relative aspect-[7/9] w-full overflow-hidden" style={{ background: p.bg }}>
          <div className="pointer-events-none absolute inset-0" style={{ background: p.grass }} />
          <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(130% 40% at 50% 112%, rgba(0,0,0,0.5), transparent 62%)" }} />
          <svg viewBox="0 0 100 128" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            <g fill="none" stroke={p.line} strokeWidth="0.4">
              <rect x="5" y="4" width="90" height="120" rx="1" />
              <line x1="5" y1="64" x2="95" y2="64" />
              <circle cx="50" cy="64" r="10" />
              <rect x="30" y="4" width="40" height="17" />
              <rect x="30" y="107" width="40" height="17" />
            </g>
          </svg>

          {formation.slots.map((slot, i) => {
            const pl = players[i];
            if (!pl) return null;
            const shown = revealed.has(i);
            const isCap = extrasIn && i === captainSlot;
            const at = project(slot.x, slot.y);
            return (
              <AnimatePresence key={i}>
                {shown && (
                  <motion.div
                    initial={{ opacity: 0, y: 22, scale: 0.6 }}
                    animate={{ opacity: 1, y: 0, scale: isCap ? 1.12 : 1 }}
                    transition={{ type: "spring", stiffness: 220, damping: 16 }}
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: at.left, top: at.top }}
                  >
                    {isCap && (
                      <span className="absolute -right-1.5 -top-1.5 z-30 grid h-5 w-5 place-items-center rounded-full font-display text-[0.6rem] font-extrabold text-[#041022]"
                        style={{ background: "linear-gradient(150deg, #f2d472, #d4af37)", boxShadow: "0 2px 8px rgba(0,0,0,0.55)" }}>C</span>
                    )}
                    <LineupCard
                      name={pl.name}
                      overall={pl.overall}
                      colors={pl.colors}
                      seasonLabel={pl.seasonLabel}
                      variant={variant}
                      captain={isCap}
                      slotGlow="rgba(242,212,114,0.85)"
                      widthClass="w-[clamp(46px,13vw,60px)]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </div>

        {/* footer tagline */}
        <div className="flex items-center justify-between px-4 py-2.5"
          style={{ background: "linear-gradient(0deg, rgba(3,9,26,0.96), rgba(3,9,26,0.86))", borderTop: `1px solid ${p.frame}` }}>
          <span className="truncate font-display text-[0.62rem] font-extrabold uppercase tracking-[0.2em]" style={{ color: p.accent }}>{p.footTag}</span>
          <span className="shrink-0 text-[0.55rem] font-bold uppercase tracking-widest text-white/40">CONTINENTAL XI</span>
        </div>
      </div>

      <div className="relative z-20 mt-5 flex gap-3">
        {extrasIn ? (
          <button className="btn btn-gold" onClick={onDone}>Continue →</button>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={onDone}>Skip</button>
        )}
      </div>
    </motion.div>
  );
}
