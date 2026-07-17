"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ShootoutData } from "@/lib/types";
import { TeamBadge } from "@/components/TeamBadge";
import { play, speakEvent } from "@/lib/sound";

interface SideRef {
  name: string;
  short: string;
  colors: [string, string];
}

/**
 * TV-style penalty shootout — kick by kick, never revealing the result early.
 * Watch Live (default on the big nights), Quick Shootout (faster but still each
 * kick), or Skip to Result. No sound plays before its kick is on screen.
 */
export function PenaltyShootout({
  shootout, home, away, accent = "#d4af37", roundLabel, defaultLive, onDone,
}: {
  shootout: ShootoutData;
  home: SideRef;
  away: SideRef;
  accent?: string;
  roundLabel?: string;
  /** semis / finals default to Watch Live; earlier rounds to Quick */
  defaultLive?: boolean;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"choose" | "live" | "quick">("choose");
  const [shown, setShown] = useState(0); // kicks revealed so far
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = shootout.kicks.length;
  const started = mode !== "choose";
  const finished = started && shown >= total;

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // advance one kick at a time in live/quick modes; when all shown, stop (the
  // finished state is derived — no setState in the effect body)
  useEffect(() => {
    if (!started || shown >= total) return;
    const k = shootout.kicks[shown];
    const step = mode === "live" ? (k.suddenDeath ? 1500 : 1350) : 620;
    // sudden-death tension — fires as the taker walks up, independent of the
    // outcome, so it can never spoil the kick
    if (k.suddenDeath && mode === "live") play("heartbeat");
    timer.current = setTimeout(() => {
      // sound only once the kick is on screen — never a spoiler.
      // goal → roar, saved → keeper denial, missed/post → sting.
      play(k.outcome === "goal" ? "goal" : k.outcome === "saved" ? "save" : "error");
      setShown((s) => s + 1);
    }, step);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [started, mode, shown, total, shootout.kicks]);

  const start = (m: "live" | "quick") => { setShown(0); setMode(m); play("whistle"); };
  const skip = () => { setShown(total); setMode((m) => (m === "choose" ? "quick" : m)); };

  // winning-penalty call — only after the deciding kick is on screen
  useEffect(() => {
    if (finished) {
      const w = shootout.winner === 0 ? home.name : away.name;
      speakEvent("shootoutwin", { team: w }, `so-${w}-${shootout.home}-${shootout.away}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const revealed = shootout.kicks.slice(0, shown);
  const homeScore = revealed.filter((k) => k.team === 0 && k.outcome === "goal").length;
  const awayScore = revealed.filter((k) => k.team === 1 && k.outcome === "goal").length;
  const current = shown > 0 ? shootout.kicks[shown - 1] : null;
  const inSuddenDeath = current?.suddenDeath || (finished && shootout.kicks.some((k) => k.suddenDeath));
  const winner = finished ? (shootout.winner === 0 ? home : away) : null;

  const markers = (team: 0 | 1) =>
    revealed.filter((k) => k.team === team).map((k) => (k.outcome === "goal" ? "goal" : "miss"));

  const OUTCOME_TEXT: Record<string, { label: string; color: string }> = {
    goal: { label: "GOAL!", color: "#2ee6a6" },
    saved: { label: "SAVED!", color: "#ff5a6a" },
    missed: { label: "MISSED!", color: "#ff9f43" },
    post: { label: "OFF THE POST!", color: "#ffcf5c" },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[145] flex items-center justify-center overflow-y-auto p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      style={{ background: "radial-gradient(120% 90% at 50% 15%, #0a1233, #020714 78%)" }}
    >
      <div className="w-full max-w-lg text-center">
        <div className="cl-heading text-[0.6rem] tracking-[0.45em]" style={{ color: accent }}>
          {roundLabel ? `${roundLabel} · ` : ""}Penalty Shootout
        </div>
        <h2 className="mt-1 font-display text-3xl font-extrabold text-white sm:text-4xl">🥅 Penalties</h2>

        {/* scoreboard */}
        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="flex flex-col items-center gap-1.5">
            <TeamBadge colors={home.colors} code={home.short} size={40} />
            <div className="truncate text-[0.7rem] font-bold text-white">{home.name}</div>
          </div>
          <div className="font-display text-4xl font-extrabold text-white">
            {homeScore}<span className="mx-1 text-white/35">–</span>{awayScore}
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <TeamBadge colors={away.colors} code={away.short} size={40} />
            <div className="truncate text-[0.7rem] font-bold text-white">{away.name}</div>
          </div>
        </div>

        {/* per-team markers */}
        <div className="mt-2 grid grid-cols-2 gap-3">
          {([0, 1] as const).map((team) => (
            <div key={team} className="flex flex-wrap justify-center gap-1">
              {markers(team).map((m, i) => (
                <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="grid h-5 w-5 place-items-center rounded-full text-[0.7rem]"
                  style={{ background: m === "goal" ? "rgba(46,230,166,0.2)" : "rgba(255,90,106,0.2)" }}>
                  {m === "goal" ? "✅" : "❌"}
                </motion.span>
              ))}
            </div>
          ))}
        </div>

        {inSuddenDeath && started && (
          <div className="mt-3 inline-block rounded-full border border-danger/50 bg-danger/15 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-danger">
            ⚡ Sudden Death
          </div>
        )}

        {/* mode chooser */}
        {mode === "choose" && (
          <div className="mt-6 flex flex-col gap-2.5">
            <button className="btn btn-gold btn-pulse" onClick={() => start(defaultLive ? "live" : "quick")} autoFocus>
              📡 Watch Live
            </button>
            <div className="flex gap-2">
              <button className="btn btn-ghost flex-1 text-xs" onClick={() => start("quick")}>⚡ Quick Shootout</button>
              <button className="btn btn-ghost flex-1 text-xs" onClick={skip}>⏭ Skip to Result</button>
            </div>
          </div>
        )}

        {/* current kick */}
        {started && !finished && current && (
          <div className="mt-5 min-h-[120px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={shown}
                initial={{ opacity: 0, y: 16, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className="rounded-2xl border p-4"
                style={{ borderColor: `${(current.team === 0 ? home : away).colors[0]}66`, background: `${(current.team === 0 ? home : away).colors[0]}12` }}
              >
                <div className="text-[0.6rem] font-bold uppercase tracking-widest text-white/50">
                  {(current.team === 0 ? home : away).name} · Kick {shown}
                </div>
                <div className="mt-1 font-display text-lg font-extrabold text-white">{current.taker}</div>
                <motion.div
                  initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.1 }}
                  className="mt-2 font-display text-2xl font-extrabold"
                  style={{ color: OUTCOME_TEXT[current.outcome].color }}
                >
                  {current.outcome === "goal" ? "⚽ " : "🧤 "}{OUTCOME_TEXT[current.outcome].label}
                </motion.div>
              </motion.div>
            </AnimatePresence>
            <button className="mt-4 text-[0.65rem] font-bold uppercase tracking-widest text-white/40 hover:text-white/70" onClick={skip}>
              Skip to result
            </button>
          </div>
        )}

        {/* result */}
        {finished && winner && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div className="font-display text-2xl font-extrabold" style={{ color: accent }}>
              {winner.name} win {Math.max(homeScore, awayScore)}–{Math.min(homeScore, awayScore)}
            </div>
            <div className="mt-1 text-xs text-white/55">on penalties</div>
            <button className="btn btn-gold btn-pulse mt-5" onClick={onDone}>Continue →</button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
