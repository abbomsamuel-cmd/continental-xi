"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { MatchResult, TournamentState } from "@/lib/types";

function StatBar({ label, a, b, suffix = "" }: { label: string; a: number; b: number; suffix?: string }) {
  const total = a + b || 1;
  const aPct = (a / total) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs font-semibold text-white/80">
        <span>{a}{suffix}</span>
        <span className="text-muted">{label}</span>
        <span>{b}{suffix}</span>
      </div>
      <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div className="bg-gold" initial={{ width: 0 }} animate={{ width: `${aPct}%` }} />
        <motion.div className="bg-cyan" initial={{ width: 0 }} animate={{ width: `${100 - aPct}%` }} />
      </div>
    </div>
  );
}

interface Props {
  result: MatchResult;
  tournament: TournamentState;
  title?: string;
  onClose: () => void;
}

export function MatchModal({ result, tournament, title, onClose }: Props) {
  const home = tournament.teams[result.home];
  const away = tournament.teams[result.away];
  const s = result.stats;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="glass-strong my-8 w-full max-w-lg rounded-3xl p-5"
          initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {title && <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-cyan">{title}</div>}

          {/* scoreline */}
          <div className="flex items-center justify-between gap-2">
            <TeamHead name={home.name} colors={home.colors} align="left" />
            <div className="text-center">
              <div className="font-display text-4xl font-extrabold">
                {result.homeGoals}<span className="mx-1 text-muted">-</span>{result.awayGoals}
              </div>
              {result.penalties && (
                <div className="text-[0.65rem] font-bold text-gold">
                  pens {result.penalties[0]}-{result.penalties[1]}
                </div>
              )}
              <div className="mt-1 text-[0.55rem] uppercase tracking-widest text-muted">Full Time</div>
            </div>
            <TeamHead name={away.name} colors={away.colors} align="right" />
          </div>

          {/* MOTM */}
          <div className="mt-3 rounded-xl bg-gold/12 px-3 py-2 text-center text-xs">
            <span className="text-muted">Player of the Match · </span>
            <span className="font-bold text-gold">{result.motm}</span>
          </div>

          {/* goals timeline */}
          {result.events.filter((e) => e.type === "goal").length > 0 && (
            <div className="mt-3 space-y-1">
              {result.events.filter((e) => e.type === "goal").map((e, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs ${e.team === 1 ? "flex-row-reverse text-right" : ""}`}>
                  <span className="chip bg-white/8 text-white/70">{e.minute}{"'"}</span>
                  <span className="font-semibold">⚽ {e.player}</span>
                  {e.assist && <span className="text-muted">({e.assist})</span>}
                </div>
              ))}
            </div>
          )}

          {/* cards + var */}
          {result.events.some((e) => e.type !== "goal" && e.type !== "chance") && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.events.filter((e) => e.type === "yellow" || e.type === "red").map((e, i) => (
                <span key={i} className="chip bg-white/6 text-white/70">
                  {e.type === "red" ? "🟥" : "🟨"} {e.player} {e.minute}{"'"}
                </span>
              ))}
              {result.events.filter((e) => e.type === "var").map((e, i) => (
                <span key={i} className="chip bg-cyan/15 text-cyan" title={e.note}>📺 VAR {e.minute}{"'"}</span>
              ))}
            </div>
          )}

          {/* momentum */}
          <div className="mt-4">
            <div className="mb-1 text-[0.6rem] font-bold uppercase tracking-widest text-muted">Momentum</div>
            <svg viewBox="0 0 100 30" className="h-12 w-full">
              <line x1="0" y1="15" x2="100" y2="15" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
              <polyline
                points={result.momentum.map((m, i) => `${(i / (result.momentum.length - 1)) * 100},${15 - m * 13}`).join(" ")}
                fill="none" stroke="#d4af37" strokeWidth="1.2"
              />
            </svg>
          </div>

          {/* stats */}
          <div className="mt-4 space-y-2.5">
            <StatBar label="Possession" a={s.possession[0]} b={s.possession[1]} suffix="%" />
            <StatBar label="Expected Goals (xG)" a={s.xg[0]} b={s.xg[1]} />
            <StatBar label="Shots" a={s.shots[0]} b={s.shots[1]} />
            <StatBar label="On Target" a={s.onTarget[0]} b={s.onTarget[1]} />
            <StatBar label="Corners" a={s.corners[0]} b={s.corners[1]} />
            <StatBar label="Fouls" a={s.fouls[0]} b={s.fouls[1]} />
            <StatBar label="Offsides" a={s.offsides[0]} b={s.offsides[1]} />
            <StatBar label="Pass Accuracy" a={s.passAcc[0]} b={s.passAcc[1]} suffix="%" />
          </div>

          <button className="btn btn-ghost mt-5 w-full" onClick={onClose}>Close</button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function TeamHead({ name, colors, align }: { name: string; colors: [string, string]; align: "left" | "right" }) {
  return (
    <div className={`flex flex-1 flex-col items-center gap-1 ${align === "left" ? "sm:items-start" : "sm:items-end"}`}>
      <span className="h-9 w-9 rounded-lg" style={{ background: `linear-gradient(150deg, ${colors[0]}, ${colors[1]})` }} />
      <span className="text-center text-[0.7rem] font-bold leading-tight">{name}</span>
    </div>
  );
}
