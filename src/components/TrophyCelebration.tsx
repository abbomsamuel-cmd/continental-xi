"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import type { TournamentState } from "@/lib/types";
import { USER_TEAM_ID } from "@/lib/engine/tournament";
import { CrestLogo } from "@/components/CrestLogo";
import { play } from "@/lib/sound";

function Confetti({ color }: { color: boolean }) {
  const pieces = useMemo(
    () => Array.from({ length: 110 }, (_, i) => ({
      id: i,
      x: frac(i * 1.13) * 100,
      delay: frac(i * 2.7) * 2.5,
      dur: 2.4 + frac(i * 3.9) * 2.6,
      color: (color ? ["#d4af37", "#22e0ff", "#ffffff", "#f2d472", "#8a7bff"] : ["#c0c8d4", "#9fb3d1", "#ffffff"])[i % (color ? 5 : 3)],
      size: 5 + frac(i * 5.1) * 7,
      rot: frac(i * 7.3) * 360,
    })),
    [color],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute top-[-10%]"
          style={{ left: `${p.x}%`, width: p.size, height: p.size * 1.6, background: p.color, borderRadius: 2 }}
          initial={{ y: -40, rotate: p.rot, opacity: 1 }}
          animate={{ y: "115vh", rotate: p.rot + 540, opacity: [1, 1, 0.4] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
}

function frac(n: number): number {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
}

interface Props {
  tournament: TournamentState;
  teamName: string;
  onContinue: () => void;
}

export function TrophyCelebration({ tournament, teamName, onContinue }: Props) {
  const won = tournament.champion === USER_TEAM_ID;
  const awards = tournament.awards;
  const reachedFinal = tournament.exit?.stage === "Final";
  const exitText = tournament.exit?.text ?? "Your run has ended";

  const kind = won ? "champion" : reachedFinal ? "runner" : "out";
  const theme = {
    champion: { glow: "rgba(212,175,55,0.6)", ring: "#d4af37", bg: "#0a1f6e", title: "Champions of Europe", emoji: "🏆" },
    runner: { glow: "rgba(180,200,255,0.45)", ring: "#c0c8d4", bg: "#0a1650", title: "Runners-up", emoji: "🥈" },
    out: { glow: "rgba(120,150,255,0.3)", ring: "#4a6bd6", bg: "#0a1330", title: "The Road Ends", emoji: "" },
  }[kind];

  useEffect(() => { play(won ? "trophy" : "lose"); }, [won]);

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto p-4"
      style={{ background: `radial-gradient(130% 90% at 50% 25%, ${theme.bg}, #030b22 72%)` }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      {(won || reachedFinal) && <Confetti color={won} />}

      {/* rotating starburst rays behind the emblem */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 620, height: 620,
          background: `conic-gradient(from 0deg, transparent 0 8deg, ${theme.glow} 8deg 10deg, transparent 10deg 18deg)`,
          maskImage: "radial-gradient(circle, #000 8%, transparent 62%)",
          WebkitMaskImage: "radial-gradient(circle, #000 8%, transparent 62%)",
        }}
        initial={{ rotate: 0, opacity: 0 }}
        animate={{ rotate: 360, opacity: 0.5 }}
        transition={{ rotate: { duration: 26, repeat: Infinity, ease: "linear" }, opacity: { duration: 1 } }}
      />
      {/* light burst */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1.5, 1.15], opacity: [0, 0.85, 0.4] }}
        transition={{ duration: 1.5, delay: 0.1, ease: "easeOut" }}
        style={{ width: 560, height: 560, borderRadius: "50%", background: `radial-gradient(circle, ${theme.glow}, transparent 62%)`, filter: "blur(6px)" }}
      />

      <div className="relative z-10 w-full max-w-lg text-center">
        <motion.div
          initial={{ scale: 0, rotate: -30, y: 40 }}
          animate={{ scale: 1, rotate: 0, y: 0 }}
          transition={{ type: "spring", stiffness: 105, damping: 11, delay: 0.25 }}
        >
          {won ? (
            <div className="text-[9rem] leading-none" style={{ filter: `drop-shadow(0 0 48px ${theme.glow})` }}>🏆</div>
          ) : (
            <div className="mx-auto w-fit" style={{ filter: `drop-shadow(0 0 40px ${theme.glow})`, opacity: kind === "out" ? 0.9 : 1 }}>
              <CrestLogo size={120} animated={false} />
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="mt-1 cl-heading text-[0.7rem] tracking-[0.4em]" style={{ color: theme.ring }}
        >
          {kind === "champion" ? "Season Complete" : kind === "runner" ? "The Final" : `${tournament.exit?.stage ?? ""}`}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, type: "spring", stiffness: 120 }}
          className="mt-1 font-display text-4xl font-extrabold sm:text-5xl"
        >
          {won ? <span className="text-gradient-gold">{theme.title}</span> : <span className="text-white/90">{theme.title}</span>}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="mx-auto mt-2 max-w-sm text-sm text-muted"
        >
          {won ? `${teamName} are the kings of Europe. Glory is yours.` : `${teamName} — ${exitText}.`}
        </motion.p>

        {won && awards && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
            className="mt-6 grid grid-cols-3 gap-3"
          >
            {[
              { icon: "🥇", label: "Golden Ball", value: awards.goldenBall },
              { icon: "👟", label: "Golden Boot", value: `${awards.goldenBoot}`, sub: `${awards.topScorerGoals} goals` },
              { icon: "🧤", label: "Golden Glove", value: awards.goldenGlove },
            ].map((a) => (
              <div key={a.label} className="cl-panel rounded-2xl p-3">
                <div className="text-2xl">{a.icon}</div>
                <div className="mt-1 text-[0.55rem] font-bold uppercase tracking-widest text-muted">{a.label}</div>
                <div className="mt-0.5 text-[0.72rem] font-bold text-white">{a.value}</div>
                {a.sub && <div className="text-[0.6rem] text-gold">{a.sub}</div>}
              </div>
            ))}
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.15 }}
          className="btn btn-gold mt-8" onClick={onContinue}
        >
          {won ? "Lift the Trophy & Continue" : "Save Result & Continue"}
        </motion.button>
      </div>
    </motion.div>
  );
}
