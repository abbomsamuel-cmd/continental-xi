"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import type { TournamentState } from "@/lib/types";
import { USER_TEAM_ID } from "@/lib/engine/tournament";
import { play } from "@/lib/sound";

// deterministic pseudo-random so render stays pure (lint-safe, SSR-safe)
function frac(n: number): number {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
}

function Confetti() {
  const pieces = useMemo(
    () => Array.from({ length: 90 }, (_, i) => ({
      id: i,
      x: frac(i * 1.13) * 100,
      delay: frac(i * 2.7) * 2.5,
      dur: 2.5 + frac(i * 3.9) * 2.5,
      color: ["#d4af37", "#22e0ff", "#ffffff", "#f2d472", "#2ee6a6"][i % 5],
      size: 5 + frac(i * 5.1) * 7,
      rot: frac(i * 7.3) * 360,
    })),
    [],
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

interface Props {
  tournament: TournamentState;
  teamName: string;
  onContinue: () => void;
}

export function TrophyCelebration({ tournament, teamName, onContinue }: Props) {
  const won = tournament.champion === USER_TEAM_ID;
  const awards = tournament.awards;
  const exitText = tournament.exit?.text ?? "Your run has ended";
  const reachedFinal = tournament.exit?.stage === "Final";

  useEffect(() => { play(won ? "trophy" : "lose"); }, [won]);

  const glow = won ? "rgba(212,175,55,0.55)" : reachedFinal ? "rgba(160,190,255,0.4)" : "rgba(255,90,106,0.35)";

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto p-4"
      style={{ background: `radial-gradient(120% 80% at 50% 30%, ${won ? "#0a1f6e" : "#0a1330"}, #020814 70%)` }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      {won && <Confetti />}
      {/* cinematic light burst */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1.4, 1.1], opacity: [0, 0.9, 0.5] }}
        transition={{ duration: 1.4, delay: 0.15, ease: "easeOut" }}
        style={{ width: 520, height: 520, borderRadius: "50%", background: `radial-gradient(circle, ${glow}, transparent 60%)`, filter: "blur(8px)" }}
      />
      <div className="relative z-10 w-full max-w-lg text-center">
        <motion.div
          initial={{ scale: 0, rotate: -25, y: 30 }}
          animate={{ scale: 1, rotate: 0, y: 0 }}
          transition={{ type: "spring", stiffness: 110, damping: 11, delay: 0.25 }}
          className="text-[8.5rem] leading-none"
          style={{ filter: `drop-shadow(0 0 45px ${glow})` }}
        >
          {won ? "🏆" : reachedFinal ? "🥈" : "🚪"}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="font-display text-4xl font-extrabold sm:text-5xl"
        >
          {won ? <span className="text-gradient-gold">Champions of Europe</span>
            : reachedFinal ? <span className="text-white/80">Runners-up</span>
            : <span className="text-white/80">Run Over</span>}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="mt-2 text-muted"
        >
          {won ? `${teamName} lift the trophy. A dynasty begins.` : `${teamName} — ${exitText}.`}
        </motion.p>

        {won && awards && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
            className="mt-6 grid grid-cols-3 gap-3"
          >
            {[
              { icon: "🥇", label: "Golden Ball", value: awards.goldenBall },
              { icon: "👟", label: "Golden Boot", value: `${awards.goldenBoot}`, sub: `${awards.topScorerGoals} goals` },
              { icon: "🧤", label: "Golden Glove", value: awards.goldenGlove },
            ].map((a) => (
              <div key={a.label} className="glass rounded-2xl p-3">
                <div className="text-2xl">{a.icon}</div>
                <div className="mt-1 text-[0.55rem] font-bold uppercase tracking-widest text-muted">{a.label}</div>
                <div className="mt-0.5 text-[0.72rem] font-bold text-white">{a.value}</div>
                {a.sub && <div className="text-[0.6rem] text-gold">{a.sub}</div>}
              </div>
            ))}
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
          className="btn btn-gold mt-8" onClick={onContinue}
        >
          {won ? "Save Trophy & Continue" : "Save Result & Continue"}
        </motion.button>
      </div>
    </motion.div>
  );
}
