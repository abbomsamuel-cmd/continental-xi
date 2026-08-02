"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { MatchEvent, MatchResult, SimTeam } from "@/lib/types";
import { TeamBadge } from "@/components/TeamBadge";
import { teamLabel } from "@/lib/engine/tournament";
import { nationalTeamFlag } from "@/lib/flags";

function StatBar({ label, a, b, suffix = "", delay = 0 }: { label: string; a: number; b: number; suffix?: string; delay?: number }) {
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
        <motion.div className="bg-cyan" initial={{ width: 0 }} animate={{ width: `${aPct}%` }} transition={{ delay, duration: 0.6, ease: "easeOut" }} />
        <motion.div className="bg-cyan" initial={{ width: 0 }} animate={{ width: `${100 - aPct}%` }} transition={{ delay, duration: 0.6, ease: "easeOut" }} />
      </div>
    </div>
  );
}

const EVENT_ICON: Record<MatchEvent["type"], string> = {
  goal: "⚽", yellow: "🟨", red: "🟥", var: "📺", sub: "🔁", chance: "⚡",
};

/** Post-match team rating out of 10, from result + underlying numbers. */
function teamRating(gf: number, ga: number, xgFor: number, xgAgainst: number, possession: number): number {
  const r = 6.4 + (gf - ga) * 0.45 + (xgFor - xgAgainst) * 0.2 + (possession - 50) * 0.012;
  return Math.round(Math.min(9.8, Math.max(5.2, r)) * 10) / 10;
}

/** One-line tactical read of the match, straight from the stats. */
function tacticalSummary(result: MatchResult, homeName: string, awayName: string): string {
  const s = result.stats;
  const [hp] = s.possession;
  const domName = hp >= 50 ? homeName : awayName;
  const subName = hp >= 50 ? awayName : homeName;
  const domPoss = Math.max(hp, 100 - hp);
  const domGoals = hp >= 50 ? result.homeGoals : result.awayGoals;
  const subGoals = hp >= 50 ? result.awayGoals : result.homeGoals;
  if (domPoss >= 58 && domGoals > subGoals) return `${domName} controlled the tempo and turned ${domPoss}% possession into a deserved win.`;
  if (domPoss >= 58 && domGoals < subGoals) return `${subName} soaked up pressure and struck on the counter — possession isn't points.`;
  if (domPoss >= 58) return `${domName} dominated the ball but couldn't break the deadlock beyond what the scoreline shows.`;
  const totalXg = s.xg[0] + s.xg[1];
  if (totalXg >= 3.4) return "An open, end-to-end contest — both benches will sleep uneasily about the chances conceded.";
  if (totalXg <= 1.4) return "A cagey, tactical affair decided by fine margins and set-piece discipline.";
  return "An evenly-matched contest where midfield control swung minute by minute.";
}

interface Props {
  result: MatchResult;
  /** team lookup — works for both club tournaments and international mode */
  teams: Record<string, SimTeam>;
  title?: string;
  onClose: () => void;
}

export function MatchModal({ result, teams, title, onClose }: Props) {
  const home = teams[result.home];
  const away = teams[result.away];
  const s = result.stats;
  const homeName = teamLabel(home);
  const awayName = teamLabel(away);

  const goals = result.events.filter((e) => e.type === "goal");
  const cards = result.events.filter((e) => e.type === "yellow" || e.type === "red");
  const vars = result.events.filter((e) => e.type === "var");
  const timelineEvents = result.events.filter((e) => e.type !== "chance" && e.type !== "sub");

  const homeRating = teamRating(result.homeGoals, result.awayGoals, s.xg[0], s.xg[1], s.possession[0]);
  const awayRating = teamRating(result.awayGoals, result.homeGoals, s.xg[1], s.xg[0], s.possession[1]);

  // key moments: every goal + reds + VAR interventions, in minute order
  const keyMoments = [...goals, ...result.events.filter((e) => e.type === "red"), ...vars]
    .sort((a, b) => a.minute - b.minute)
    .slice(0, 6);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="glass-strong my-8 w-full max-w-lg overflow-hidden rounded-3xl"
          initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* broadcast scorebar */}
          <div className="relative px-5 pb-4 pt-5">
            <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: `linear-gradient(180deg, ${home.colors[0]}, ${home.colors[1]})` }} />
            <span aria-hidden className="absolute inset-y-0 right-0 w-1.5" style={{ background: `linear-gradient(180deg, ${away.colors[0]}, ${away.colors[1]})` }} />
            {title && <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-cyan">{title}</div>}
            <div className="flex items-center justify-between gap-2">
              <TeamHead name={homeName} colors={home.colors} code={home.short} country={nationalTeamFlag(home)} align="left" />
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.15 }}
                  className="font-display text-4xl font-extrabold"
                >
                  {result.homeGoals}<span className="mx-1 text-muted">-</span>{result.awayGoals}
                </motion.div>
                {result.penalties && (
                  <div className="text-[0.65rem] font-bold text-cyan">
                    pens {result.penalties[0]}-{result.penalties[1]}
                  </div>
                )}
                <div className="mt-1 text-[0.55rem] uppercase tracking-widest text-muted">Full Time</div>
              </div>
              <TeamHead name={awayName} colors={away.colors} code={away.short} country={nationalTeamFlag(away)} align="right" />
            </div>
            {/* team ratings */}
            <div className="mt-2 flex items-center justify-between text-[0.62rem] font-bold">
              <span className="rounded-md bg-white/8 px-2 py-0.5 text-white/80">Team rating <span className="text-cyan">{homeRating.toFixed(1)}</span></span>
              <span className="rounded-md bg-white/8 px-2 py-0.5 text-white/80">Team rating <span className="text-cyan">{awayRating.toFixed(1)}</span></span>
            </div>
          </div>

          <div className="px-5 pb-5">
            {/* MOTM */}
            <div className="rounded-xl bg-cyan/12 px-3 py-2 text-center text-xs">
              <span aria-hidden>⭐ </span>
              <span className="text-muted">Player of the Match · </span>
              <span className="font-bold text-cyan">{result.motm}</span>
            </div>

            {/* minute-by-minute timeline strip */}
            {timelineEvents.length > 0 && (
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-[0.55rem] font-bold uppercase tracking-widest text-muted">
                  <span>{homeName}</span><span>Timeline</span><span>{awayName}</span>
                </div>
                <div className="relative h-14 rounded-lg bg-black/25 px-2">
                  <span className="absolute inset-x-2 top-1/2 h-px bg-white/15" />
                  {[0, 15, 30, 45, 60, 75, 90].map((m) => (
                    <span key={m} className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-white/20" style={{ left: `${2 + (m / 96) * 96}%` }} />
                  ))}
                  {timelineEvents.map((e, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.07, type: "spring", stiffness: 300, damping: 16 }}
                      className="absolute -translate-x-1/2 cursor-default text-[0.7rem]"
                      style={{
                        left: `${2 + (Math.min(e.minute, 96) / 96) * 96}%`,
                        top: e.team === 0 ? "12%" : "58%",
                      }}
                      title={`${e.minute}' ${e.player}${e.assist ? ` (${e.assist})` : ""}${e.note ? ` — ${e.note}` : ""}`}
                    >
                      {EVENT_ICON[e.type]}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {/* goals & assists */}
            {goals.length > 0 && (
              <div className="mt-3 space-y-1">
                {goals.map((e, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs ${e.team === 1 ? "flex-row-reverse text-right" : ""}`}>
                    <span className="chip bg-white/8 text-white/70">{e.minute}{"'"}</span>
                    <span className="font-semibold">⚽ {e.player}</span>
                    {e.assist && <span className="text-muted">assist: {e.assist}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* cards + var */}
            {(cards.length > 0 || vars.length > 0) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {cards.map((e, i) => (
                  <span key={i} className="chip bg-white/6 text-white/70">
                    {e.type === "red" ? "🟥" : "🟨"} {e.player} {e.minute}{"'"}
                  </span>
                ))}
                {vars.map((e, i) => (
                  <span key={i} className="chip bg-cyan/15 text-cyan" title={e.note}>📺 VAR {e.minute}{"'"}</span>
                ))}
              </div>
            )}

            {/* key moments */}
            {keyMoments.length > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 text-[0.6rem] font-bold uppercase tracking-widest text-muted">Key Moments</div>
                <div className="space-y-1">
                  {keyMoments.map((e, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.08 }}
                      className="flex items-baseline gap-2 rounded-md bg-white/4 px-2 py-1 text-[0.68rem]"
                    >
                      <span className="w-7 shrink-0 font-display font-bold text-white/60">{e.minute}{"'"}</span>
                      <span className="text-white/85">
                        {e.type === "goal" && <>⚽ <b>{e.player}</b> scores for {e.team === 0 ? homeName : awayName}{e.assist ? `, teed up by ${e.assist}` : ""}.</>}
                        {e.type === "red" && <>🟥 <b>{e.player}</b> is sent off — {e.team === 0 ? homeName : awayName} down to ten.</>}
                        {e.type === "var" && <>📺 VAR intervenes{e.note ? ` — ${e.note}` : ""}.</>}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* momentum — filled swing chart */}
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[0.6rem] font-bold uppercase tracking-widest text-muted">
                <span className="text-cyan">◂ {home.short}</span><span>Momentum</span><span className="text-cyan">{away.short} ▸</span>
              </div>
              <svg viewBox="0 0 100 30" className="h-14 w-full">
                <defs>
                  <linearGradient id="momGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(0,240,255,0.5)" />
                    <stop offset="50%" stopColor="rgba(0,240,255,0.05)" />
                    <stop offset="50%" stopColor="rgba(0,240,255,0.05)" />
                    <stop offset="100%" stopColor="rgba(0,240,255,0.5)" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="15" x2="100" y2="15" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" />
                <polygon
                  points={`0,15 ${result.momentum.map((m, i) => `${(i / (result.momentum.length - 1)) * 100},${15 - m * 13}`).join(" ")} 100,15`}
                  fill="url(#momGrad)"
                />
                <polyline
                  points={result.momentum.map((m, i) => `${(i / (result.momentum.length - 1)) * 100},${15 - m * 13}`).join(" ")}
                  fill="none" stroke="#eaf1ff" strokeWidth="0.7" strokeOpacity="0.85"
                />
              </svg>
            </div>

            {/* stats */}
            <div className="mt-4 space-y-2.5">
              <StatBar label="Possession" a={s.possession[0]} b={s.possession[1]} suffix="%" delay={0.05} />
              <StatBar label="Expected Goals (xG)" a={s.xg[0]} b={s.xg[1]} delay={0.1} />
              <StatBar label="Shots" a={s.shots[0]} b={s.shots[1]} delay={0.15} />
              <StatBar label="On Target" a={s.onTarget[0]} b={s.onTarget[1]} delay={0.2} />
              <StatBar label="Corners" a={s.corners[0]} b={s.corners[1]} delay={0.25} />
              <StatBar label="Fouls" a={s.fouls[0]} b={s.fouls[1]} delay={0.3} />
              <StatBar label="Offsides" a={s.offsides[0]} b={s.offsides[1]} delay={0.35} />
              <StatBar label="Pass Accuracy" a={s.passAcc[0]} b={s.passAcc[1]} suffix="%" delay={0.4} />
            </div>

            {/* tactical summary */}
            <p className="mt-4 rounded-xl bg-white/4 px-3 py-2 text-center text-[0.7rem] italic leading-relaxed text-white/70">
              {tacticalSummary(result, homeName, awayName)}
            </p>

            <button className="btn btn-ghost mt-4 w-full" onClick={onClose}>Close</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function TeamHead({ name, colors, code, country, align }: { name: string; colors: [string, string]; code: string; country?: string; align: "left" | "right" }) {
  return (
    <div className={`flex flex-1 flex-col items-center gap-1 ${align === "left" ? "sm:items-start" : "sm:items-end"}`}>
      <TeamBadge colors={colors} code={code} size={40} nationality={country} />
      <span className="text-center text-[0.7rem] font-bold leading-tight">{name}</span>
    </div>
  );
}
