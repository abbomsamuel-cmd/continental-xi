"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { MatchResult } from "@/lib/types";
import { TeamBadge } from "@/components/TeamBadge";

/**
 * Quick Sim — a compact 2–4 second presentation for league-phase / group-stage
 * matches, and a clean recap after simulating a whole phase. Uses the same
 * already-simulated MatchResults as the live show; this is presentation only,
 * so a result can never differ from what the engine produced or the live match.
 */

export interface QuickTeamRef { name: string; short: string; colors: [string, string] }

export interface QuickMatch {
  home: QuickTeamRef;
  away: QuickTeamRef;
  hg: number;
  ag: number;
  userSide: 0 | 1;
  scorers: { name: string; side: 0 | 1; minute: number }[];
  result: MatchResult;
  md?: number;
}

export type QuickSimData =
  | ({ kind: "single"; posBefore: number; posAfter: number; qualLine?: string } & QuickMatch)
  | {
      kind: "phase";
      simmed: number; w: number; d: number; l: number; gf: number; ga: number;
      pos: number; qualified: boolean; qualification: string;
      matches: QuickMatch[];
    };

function Scoreline({ m, accent }: { m: QuickMatch; accent: string }) {
  const userWon = (m.userSide === 0 ? m.hg - m.ag : m.ag - m.hg) > 0;
  const draw = m.hg === m.ag;
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
        <span className="truncate text-[0.82rem] font-bold text-white">{m.home.name}</span>
        <TeamBadge colors={m.home.colors} code={m.home.short} size={26} />
      </div>
      <div className="shrink-0 rounded-lg px-2.5 py-1 font-display text-xl font-extrabold text-white"
        style={{ background: draw ? "rgba(255,255,255,0.08)" : userWon ? `${accent}22` : "rgba(255,90,106,0.14)" }}>
        {m.hg}<span className="mx-1 text-white/40">–</span>{m.ag}
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <TeamBadge colors={m.away.colors} code={m.away.short} size={26} />
        <span className="truncate text-[0.82rem] font-bold text-white">{m.away.name}</span>
      </div>
    </div>
  );
}

export function QuickSim({
  title, accent, emblem = "⚡", data, onDone, onViewMatch,
}: {
  title: string;
  accent: string;
  emblem?: string;
  /** null while the match(es) are being simulated behind the overlay */
  data: QuickSimData | null;
  onDone: () => void;
  onViewMatch?: (r: MatchResult) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[135] flex items-center justify-center overflow-y-auto p-4"
      style={{ background: "radial-gradient(130% 90% at 50% 20%, #0a1b4d, #030b22 74%)" }}
    >
      <div className="w-full max-w-lg">
        {/* header ident */}
        <div className="text-center">
          <div className="text-4xl" style={{ filter: `drop-shadow(0 0 24px ${accent}66)` }}>{emblem}</div>
          <div className="cl-heading mt-1 text-[0.62rem] tracking-[0.4em]" style={{ color: accent }}>{title}</div>
        </div>

        <AnimatePresence mode="wait">
          {/* SIMULATING */}
          {data === null && (
            <motion.div key="sim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 text-center">
              <div className="font-display text-2xl font-extrabold text-white">Simulating…</div>
              <div className="mx-auto mt-4 h-1 w-56 overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full rounded-full" style={{ background: accent }}
                  initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.4, ease: "easeInOut" }} />
              </div>
            </motion.div>
          )}

          {/* SINGLE MATCH RESULT */}
          {data && data.kind === "single" && (
            <motion.div key="single" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass mt-6 rounded-2xl p-5">
              <Scoreline m={data} accent={accent} />
              {data.scorers.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-[0.72rem]">
                  {data.scorers.map((s, i) => (
                    <div key={i} className={s.side === 0 ? "text-right" : ""} style={{ order: s.side === 0 ? 0 : 1 }}>
                      <span className="text-white/50">{s.minute}&apos;</span> <span className="font-semibold text-white/85">⚽ {s.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex items-center justify-center gap-2 text-[0.72rem] font-bold">
                <span className="text-white/50 uppercase tracking-widest">Table</span>
                <span className="text-white/70">{ordinal(data.posBefore)}</span>
                <motion.span aria-hidden initial={{ x: -4, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} style={{ color: accent }}>→</motion.span>
                <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.35, type: "spring", stiffness: 300 }}
                  className="font-display text-base font-extrabold" style={{ color: accent }}>{ordinal(data.posAfter)}</motion.span>
              </div>
              {data.qualLine && (
                <div className="mt-2 text-center text-[0.72rem] font-bold" style={{ color: accent }}>{data.qualLine}</div>
              )}
              <div className="mt-5 flex justify-center gap-2.5">
                {onViewMatch && <button className="btn btn-ghost text-xs" onClick={() => onViewMatch(data.result)}>Full stats</button>}
                <button className="btn btn-gold" onClick={onDone}>Continue →</button>
              </div>
            </motion.div>
          )}

          {/* PHASE SUMMARY */}
          {data && data.kind === "phase" && (
            <motion.div key="phase" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass mt-6 rounded-2xl p-5">
              <div className="text-center font-display text-xl font-extrabold text-white">
                {data.simmed} match{data.simmed === 1 ? "" : "es"} simulated
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[["Record", `${data.w}·${data.d}·${data.l}`], ["Goals", `${data.gf}–${data.ga}`], ["Position", ordinal(data.pos)]].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-black/25 px-2 py-2">
                    <div className="text-[0.5rem] font-bold uppercase tracking-widest" style={{ color: accent }}>{k}</div>
                    <div className="mt-0.5 font-display text-sm font-extrabold text-white">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-xl px-3 py-2 text-center text-[0.8rem] font-bold"
                style={{ background: data.qualified ? `${accent}18` : "rgba(255,90,106,0.14)", color: data.qualified ? accent : "#ff8b96" }}>
                {data.qualified ? "✓ " : ""}{data.qualification}
              </div>
              {/* compact result list */}
              <div className="mt-3 max-h-[34vh] space-y-1 overflow-y-auto">
                {data.matches.map((m, i) => {
                  const win = (m.userSide === 0 ? m.hg - m.ag : m.ag - m.hg);
                  const opp = m.userSide === 0 ? m.away : m.home;
                  const us = m.userSide === 0 ? m.hg : m.ag;
                  const them = m.userSide === 0 ? m.ag : m.hg;
                  return (
                    <button key={i} onClick={() => onViewMatch?.(m.result)} disabled={!onViewMatch}
                      className="flex w-full items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-left text-[0.72rem] transition-colors enabled:hover:bg-white/[0.07]">
                      <span className="grid h-4 w-4 shrink-0 place-items-center rounded text-[0.5rem] font-black"
                        style={{ background: win > 0 ? `${accent}` : win === 0 ? "rgba(255,255,255,0.2)" : "#ff5a6a", color: "#04101f" }}>
                        {win > 0 ? "W" : win === 0 ? "D" : "L"}
                      </span>
                      <span className="font-display font-extrabold text-white">{us}–{them}</span>
                      <span className="truncate text-white/60">vs {opp.name}</span>
                      {m.md && <span className="ml-auto shrink-0 text-white/35">MD{m.md}</span>}
                    </button>
                  );
                })}
              </div>
              <button className="btn btn-gold mt-4 w-full" onClick={onDone}>Continue →</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

/** Extract goalscorers (name, side, minute) from an already-simulated result. */
export function scorersOf(r: MatchResult): { name: string; side: 0 | 1; minute: number }[] {
  return r.events
    .filter((e) => e.type === "goal")
    .map((e) => ({ name: e.player, side: e.team as 0 | 1, minute: e.minute }));
}
