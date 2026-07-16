"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MatchResult } from "@/lib/types";
import { TeamBadge } from "@/components/TeamBadge";
import { CameraFlashes } from "@/components/fx/Atmosphere";
import { play, startAmbience, stopAmbience } from "@/lib/sound";

/**
 * Matchday broadcast — replaces the old loading bar with a "Soccer Saturday"
 * style live results show. Every fixture in the round appears WAITING, goes
 * LIVE, ticks its goals in with real minutes, then hits FULL TIME while a
 * mini table re-sorts itself and a news ticker rolls along the bottom.
 *
 * The show mounts BEFORE the round is simulated (fixtures === null renders a
 * cinematic "preparing" beat) so the page behind never flashes a result — no
 * spoilers. Once fixtures arrive the reveal begins, with ×1/×2/×4 pacing.
 */

type Comp = "cl" | "euro" | "copa";

export interface MDTeamRef {
  id: string;
  name: string;
  short: string;
  colors: [string, string];
  isUser?: boolean;
}

export interface MDFixtureView {
  home: MDTeamRef;
  away: MDTeamRef;
  result: MatchResult;
}

export interface MiniRow {
  id: string;
  name: string;
  short: string;
  colors: [string, string];
  points: number;
  gd: number;
  isUser?: boolean;
}

const PAL: Record<Comp, { accent: string; soft: string; page: string; emblem: string; glow: string }> = {
  cl: {
    accent: "#d4af37", soft: "rgba(212,175,55,0.15)", emblem: "★",
    page: "radial-gradient(120% 90% at 50% 12%, #0a1b4d, #020714 78%)",
    glow: "rgba(41,98,255,0.35)",
  },
  euro: {
    accent: "#37e0ff", soft: "rgba(55,224,255,0.14)", emblem: "✦",
    page: "radial-gradient(120% 90% at 50% 12%, #081b56, #030818 78%)",
    glow: "rgba(27,79,255,0.4)",
  },
  copa: {
    accent: "#ffc93c", soft: "rgba(255,201,60,0.14)", emblem: "◆",
    page: "radial-gradient(120% 90% at 50% 12%, #0a3a24, #02120a 78%)",
    glow: "rgba(23,201,122,0.35)",
  },
};

function frac(n: number): number {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
}

// league/group nights run brisk — the knockout theatre lives elsewhere
const DURATION = 7200;
const TICK = 150;

interface GoalBeat {
  fixture: number;
  team: 0 | 1;
  minute: number;
  player: string;
  at: number; // elapsed ms when it reveals
}

interface Schedule {
  liveAt: number[];
  ftAt: number[];
  goals: GoalBeat[];
  endAt: number;
}

function buildSchedule(fixtures: MDFixtureView[]): Schedule {
  const liveAt = fixtures.map((_, i) => 300 + frac(i * 3.7) * 700);
  const ftAt = fixtures.map((_, i) => DURATION - 900 + frac(i * 7.1) * 800);
  const goals: GoalBeat[] = [];
  fixtures.forEach((f, i) => {
    f.result.events
      .filter((e) => e.type === "goal")
      .forEach((e) => {
        const t = liveAt[i] + 500 + (e.minute / 95) * (ftAt[i] - liveAt[i] - 800);
        goals.push({ fixture: i, team: e.team as 0 | 1, minute: e.minute, player: e.player, at: t });
      });
  });
  goals.sort((a, b) => a.at - b.at);
  return { liveAt, ftAt, goals, endAt: Math.max(...ftAt, 0) + 400 };
}

/* ------------------------------------------------------------------ */
/*  One fixture row                                                    */
/* ------------------------------------------------------------------ */

function statusOf(i: number, elapsed: number, s: Schedule): "waiting" | "live" | "ft" {
  if (elapsed >= s.ftAt[i]) return "ft";
  if (elapsed >= s.liveAt[i]) return "live";
  return "waiting";
}

/** Score shown mid-show comes from revealed goal beats; at FT it snaps to the
 *  engine's true final score so the two can never disagree. */
function scoreOf(f: MDFixtureView, i: number, elapsed: number, s: Schedule): [number, number] {
  if (elapsed >= s.ftAt[i]) return [f.result.homeGoals, f.result.awayGoals];
  let h = 0, a = 0;
  for (const g of s.goals) {
    if (g.fixture !== i || g.at > elapsed) continue;
    if (g.team === 0) h++; else a++;
  }
  return [h, a];
}

/** The broadcast clock of one fixture, mapped onto real match minutes. */
function minuteOf(i: number, elapsed: number, s: Schedule): number {
  const t = (elapsed - s.liveAt[i]) / (s.ftAt[i] - s.liveAt[i]);
  return Math.max(1, Math.min(90, Math.round(t * 90)));
}

function FixtureRowCard({
  f, i, elapsed, s, accent, soft,
}: {
  f: MDFixtureView; i: number; elapsed: number; s: Schedule; accent: string; soft: string;
}) {
  const status = statusOf(i, elapsed, s);
  const [h, a] = scoreOf(f, i, elapsed, s);
  const justScored = s.goals.find((g) => g.fixture === i && g.at <= elapsed && elapsed - g.at < 1800);

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 rounded-xl border border-white/8 bg-black/35 px-2.5 py-2 backdrop-blur-sm"
      style={justScored ? { boxShadow: `0 0 16px ${soft}`, borderColor: `${accent}66` } : undefined}
    >
      <TeamBadge colors={f.home.colors} code={f.home.short} size={22} />
      <span className="min-w-0 flex-1 truncate text-[0.68rem] font-semibold text-white/85">{f.home.short}</span>
      <div className="flex w-14 items-center justify-center font-display text-sm font-extrabold">
        {status === "waiting" ? (
          <span className="text-white/30">vs</span>
        ) : (
          <span className="flex items-center gap-1 text-white">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={`h${h}`} initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }}>{h}</motion.span>
            </AnimatePresence>
            <span className="text-white/35">–</span>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={`a${a}`} initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }}>{a}</motion.span>
            </AnimatePresence>
          </span>
        )}
      </div>
      <span className="min-w-0 flex-1 truncate text-right text-[0.68rem] font-semibold text-white/85">{f.away.short}</span>
      <TeamBadge colors={f.away.colors} code={f.away.short} size={22} />
      <span
        className="w-12 shrink-0 rounded px-1 py-0.5 text-center text-[0.5rem] font-extrabold uppercase tracking-wider"
        style={
          status === "ft" ? { background: soft, color: accent }
            : status === "live" ? { background: "rgba(255,60,80,0.18)", color: "#ff8896" }
            : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }
        }
      >
        {status === "ft" ? "FT" : status === "live" ? `${minuteOf(i, elapsed, s)}'` : "SOON"}
      </span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  The user's fixture — the hero card                                 */
/* ------------------------------------------------------------------ */

function HeroFixture({
  f, i, elapsed, s, accent, soft,
}: {
  f: MDFixtureView; i: number; elapsed: number; s: Schedule; accent: string; soft: string;
}) {
  const status = statusOf(i, elapsed, s);
  const [h, a] = scoreOf(f, i, elapsed, s);
  const revealed = s.goals.filter((g) => g.fixture === i && g.at <= elapsed);
  const homeScorers = revealed.filter((g) => g.team === 0);
  const awayScorers = revealed.filter((g) => g.team === 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative overflow-hidden rounded-2xl border p-3.5 sm:p-4"
      style={{ borderColor: `${accent}50`, background: `linear-gradient(150deg, ${soft}, rgba(0,0,0,0.45))`, boxShadow: `0 14px 44px rgba(0,0,0,0.4), 0 0 24px ${soft}` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[0.52rem] font-extrabold uppercase tracking-[0.3em]" style={{ color: accent }}>Your Match</span>
        <span
          className="flex items-center gap-1.5 rounded px-1.5 py-0.5 font-display text-[0.58rem] font-extrabold uppercase tracking-wider"
          style={status === "ft" ? { background: soft, color: accent } : { background: "rgba(255,60,80,0.18)", color: "#ff8896" }}
        >
          {status !== "ft" && (
            <motion.span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500"
              animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
          )}
          {status === "ft" ? "FULL TIME" : `${minuteOf(i, elapsed, s)}'`}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <TeamBadge colors={f.home.colors} code={f.home.short} size={34} />
          <span className="truncate font-display text-[0.8rem] font-extrabold text-white">{f.home.name}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 font-display text-2xl font-extrabold text-white">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={`h${h}`} initial={{ y: -18, opacity: 0, scale: 1.25 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 18, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}>{h}</motion.span>
          </AnimatePresence>
          <span className="text-white/35">–</span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={`a${a}`} initial={{ y: -18, opacity: 0, scale: 1.25 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 18, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}>{a}</motion.span>
          </AnimatePresence>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2 text-right">
          <span className="truncate font-display text-[0.8rem] font-extrabold text-white">{f.away.name}</span>
          <TeamBadge colors={f.away.colors} code={f.away.short} size={34} />
        </div>
      </div>
      {/* scorers, each under their own side — never a jumbled centre line */}
      {revealed.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-x-4 text-[0.6rem] text-white/60">
          <div className="space-y-0.5">
            {homeScorers.map((g, k) => (
              <motion.div key={k} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                ⚽ {g.player} {g.minute}&apos;
              </motion.div>
            ))}
          </div>
          <div className="space-y-0.5 text-right">
            {awayScorers.map((g, k) => (
              <motion.div key={k} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                {g.player} {g.minute}&apos; ⚽
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Live mini table                                                    */
/* ------------------------------------------------------------------ */

function liveTable(base: MiniRow[], fixtures: MDFixtureView[], elapsed: number, s: Schedule): MiniRow[] {
  const rows = new Map(base.map((r) => [r.id, { ...r }]));
  fixtures.forEach((f, i) => {
    if (statusOf(i, elapsed, s) !== "ft") return;
    const [h, a] = [f.result.homeGoals, f.result.awayGoals];
    const hr = rows.get(f.home.id);
    const ar = rows.get(f.away.id);
    if (hr) { hr.points += h > a ? 3 : h === a ? 1 : 0; hr.gd += h - a; }
    if (ar) { ar.points += a > h ? 3 : a === h ? 1 : 0; ar.gd += a - h; }
  });
  return [...rows.values()].sort((x, y) => y.points - x.points || y.gd - x.gd);
}

function MiniTable({
  base, fixtures, elapsed, s, accent, soft,
}: {
  base: MiniRow[]; fixtures: MDFixtureView[]; elapsed: number; s: Schedule; accent: string; soft: string;
}) {
  const sorted = liveTable(base, fixtures, elapsed, s);
  // small groups show whole; big league shows a window around the user
  let view = sorted.map((r, i) => ({ ...r, pos: i + 1 }));
  if (view.length > 8) {
    const ui = view.findIndex((r) => r.isUser);
    const lo = Math.max(0, Math.min(ui - 3, view.length - 7));
    view = view.slice(lo, lo + 7);
  }
  return (
    <div className="rounded-2xl border border-white/8 bg-black/35 p-3 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[0.52rem] font-bold uppercase tracking-[0.3em] text-white/40">Standings · Live</span>
        <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
          className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
      </div>
      <div className="space-y-1">
        {view.map((r) => (
          <motion.div
            key={r.id} layout transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1"
            style={r.isUser ? { background: soft, boxShadow: `inset 0 0 0 1px ${accent}44` } : undefined}
          >
            <span className="w-4 text-right font-display text-[0.62rem] font-extrabold text-white/50">{r.pos}</span>
            <TeamBadge colors={r.colors} code={r.short} size={16} />
            <span className={`min-w-0 flex-1 truncate text-[0.65rem] font-semibold ${r.isUser ? "text-white" : "text-white/75"}`}>{r.name}</span>
            <span className="w-7 text-right text-[0.6rem] text-white/45">{r.gd > 0 ? `+${r.gd}` : r.gd}</span>
            <motion.span key={r.points} initial={{ scale: 1.3, color: accent }} animate={{ scale: 1, color: "#ffffff" }}
              className="w-6 text-right font-display text-[0.72rem] font-extrabold">{r.points}</motion.span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The broadcast overlay                                              */
/* ------------------------------------------------------------------ */

export function MatchdayLive({
  comp, compName, title, fixtures, baseTable, onDone,
}: {
  comp: Comp;
  compName: string;
  /** e.g. "Matchday 3" */
  title: string;
  /** null while the round is still being prepared — shows the cinematic beat */
  fixtures: MDFixtureView[] | null;
  /** standings BEFORE this round — points animate in as results land */
  baseTable: MiniRow[];
  onDone: () => void;
}) {
  const pal = PAL[comp];
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      className="fixed inset-0 z-[130] overflow-y-auto"
      style={{ background: pal.page }}
    >
      {/* stadium night backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-[-18%] h-[60vh] w-[85vw] -translate-x-1/2 rounded-full opacity-50"
          style={{ background: `radial-gradient(circle, ${pal.glow}, transparent 65%)`, filter: "blur(46px)" }} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-display text-[38vw] font-extrabold leading-none opacity-[0.04]"
          style={{ color: pal.accent }}>
          {pal.emblem}
        </div>
        <CameraFlashes count={10} />
        <div className="absolute inset-x-0 bottom-0 h-[20vh]" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }} />
      </div>

      {fixtures === null ? (
        <MatchdayPrep pal={pal} compName={compName} title={title} />
      ) : (
        <MatchdayShow pal={pal} compName={compName} title={title} fixtures={fixtures} baseTable={baseTable} onDone={onDone} />
      )}
    </motion.div>
  );
}

/** The cinematic beat while the round simulates — never a bare loading bar. */
function MatchdayPrep({ pal, compName, title }: { pal: (typeof PAL)["cl"]; compName: string; title: string }) {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-6 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
        className="text-5xl" style={{ color: pal.accent, textShadow: `0 0 40px ${pal.accent}` }}>
        {pal.emblem}
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="cl-heading mt-3 text-[0.65rem] tracking-[0.5em]" style={{ color: pal.accent }}>
        {compName.toUpperCase()}
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, type: "spring", stiffness: 160, damping: 15 }}
        className="mt-1 font-display text-4xl font-extrabold text-white sm:text-6xl">
        {title.toUpperCase()}
      </motion.h2>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="mt-3 text-[0.7rem] uppercase tracking-[0.3em] text-white/50">
        Preparing the fixtures…
      </motion.div>
      {/* premium loader: three pulsing lights, not a bar */}
      <div className="mt-5 flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="h-2 w-2 rounded-full" style={{ background: pal.accent }}
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1.15, 0.85] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }} />
        ))}
      </div>
    </div>
  );
}

function MatchdayShow({
  pal, compName, title, fixtures, baseTable, onDone,
}: {
  pal: (typeof PAL)["cl"]; compName: string; title: string;
  fixtures: MDFixtureView[]; baseTable: MiniRow[]; onDone: () => void;
}) {
  const s = useMemo(() => buildSchedule(fixtures), [fixtures]);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(1);
  const doneRef = useRef(false);

  const userIdx = fixtures.findIndex((f) => f.home.isUser || f.away.isUser);
  const others = fixtures.map((f, i) => ({ f, i })).filter(({ i }) => i !== userIdx);
  const completed = fixtures.filter((_, i) => statusOf(i, elapsed, s) === "ft").length;
  const allDone = completed >= fixtures.length && elapsed > s.endAt;

  // the broadcast clock — speed scales how much show-time each tick advances
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => Math.min(e + TICK * speed, s.endAt + 500)), TICK);
    return () => clearInterval(id);
  }, [s.endAt, speed]);

  // ambience + kick-off whistle
  useEffect(() => {
    play("whistle");
    startAmbience(0.013);
    return () => stopAmbience(0.5);
  }, []);

  // audio beats: user goals roar, other results tick softly
  const userGoals = s.goals.filter((g) => g.fixture === userIdx && g.at <= elapsed).length;
  const prevUserGoals = useRef(0);
  useEffect(() => {
    if (userGoals > prevUserGoals.current) play("goal");
    prevUserGoals.current = userGoals;
  }, [userGoals]);
  const prevCompleted = useRef(0);
  useEffect(() => {
    if (completed > prevCompleted.current && completed < fixtures.length) play("tick");
    if (completed >= fixtures.length && prevCompleted.current < fixtures.length) play("whistle");
    prevCompleted.current = completed;
  }, [completed, fixtures.length]);

  // hand back automatically once the show wraps
  useEffect(() => {
    if (!allDone || doneRef.current) return;
    const id = setTimeout(() => { doneRef.current = true; onDone(); }, 2600);
    return () => clearTimeout(id);
  }, [allDone, onDone]);

  const finishNow = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };
  const skipToEnd = () => { setElapsed(s.endAt + 500); play("click"); };

  // ticker: goal flashes take priority, otherwise rotating facts
  const facts = useMemo(() => {
    const sorted = [...baseTable].sort((x, y) => y.points - x.points || y.gd - x.gd);
    const leader = sorted[0];
    const user = sorted.find((r) => r.isUser);
    const userPos = user ? sorted.indexOf(user) + 1 : 0;
    const out = [
      `${fixtures.length} fixtures across the continent tonight`,
      leader ? `${leader.name} top the table on ${leader.points} points` : "",
      user ? `${user.name} sit ${ordinal(userPos)} — every point matters tonight` : "",
      `${compName} · ${title}`,
    ].filter(Boolean);
    return out;
  }, [baseTable, fixtures.length, compName, title]);

  const flash = [...s.goals].reverse().find((g) => g.at <= elapsed && elapsed - g.at < 2100);
  const flashFx = flash ? fixtures[flash.fixture] : null;
  const tickerText = flash && flashFx
    ? `⚽ GOAL! ${flashFx.home.short} ${scoreOf(flashFx, flash.fixture, elapsed, s)[0]}–${scoreOf(flashFx, flash.fixture, elapsed, s)[1]} ${flashFx.away.short} — ${flash.player} ${flash.minute}'`
    : facts[Math.floor(elapsed / 2600) % facts.length];

  return (
    <>
      <div className="relative mx-auto w-full max-w-3xl px-3 pb-16 pt-6 sm:px-6 sm:pt-9">
        {/* header */}
        <div className="text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="cl-heading flex items-center justify-center gap-2 text-[0.62rem] tracking-[0.45em]" style={{ color: pal.accent }}>
            <span>{pal.emblem}</span>{compName.toUpperCase()}<span>{pal.emblem}</span>
          </motion.div>
          <motion.h2 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12, type: "spring", stiffness: 170, damping: 16 }}
            className="mt-1 font-display text-4xl font-extrabold text-white sm:text-5xl">
            {title.toUpperCase()}
          </motion.h2>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-1 text-[0.7rem] text-white/55">
            {allDone ? "All results in." : "Simulating tonight's fixtures…"}
          </motion.div>
        </div>

        {/* progress tracker + pacing controls */}
        <div className="mx-auto mt-4 max-w-sm">
          <div className="flex items-center justify-between text-[0.58rem] font-bold uppercase tracking-widest text-white/45">
            <span>{completed} / {fixtures.length} completed</span>
            {!allDone && (
              <span className="flex items-center gap-2">
                {[1, 2, 4].map((x) => (
                  <button key={x} onClick={() => { setSpeed(x); play("click"); }}
                    className="rounded-full px-2 py-0.5 font-extrabold transition-colors"
                    style={speed === x ? { background: pal.accent, color: "#06101f" } : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)" }}>
                    ×{x}
                  </button>
                ))}
                <button onClick={skipToEnd} className="text-white/50 transition-colors hover:text-white">Skip ⏭</button>
              </span>
            )}
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/8">
            <motion.div className="h-full rounded-full" animate={{ width: `${(completed / fixtures.length) * 100}%` }}
              transition={{ duration: 0.5 }} style={{ background: pal.accent }} />
          </div>
        </div>

        {/* user hero fixture */}
        {userIdx >= 0 && (
          <div className="mt-4">
            <HeroFixture f={fixtures[userIdx]} i={userIdx} elapsed={elapsed} s={s} accent={pal.accent} soft={pal.soft} />
          </div>
        )}

        <div className="mt-3 grid gap-3 md:grid-cols-[1.35fr_1fr]">
          {/* the rest of the continent */}
          <div className="grid content-start gap-1.5 sm:grid-cols-1">
            {others.map(({ f, i }) => (
              <FixtureRowCard key={i} f={f} i={i} elapsed={elapsed} s={s} accent={pal.accent} soft={pal.soft} />
            ))}
          </div>
          {/* standings live */}
          <div className="md:sticky md:top-4 md:self-start">
            <MiniTable base={baseTable} fixtures={fixtures} elapsed={elapsed} s={s} accent={pal.accent} soft={pal.soft} />
            <AnimatePresence>
              {allDone && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-center">
                  <button className="btn btn-gold btn-pulse w-full" onClick={finishNow}>Continue →</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* news ticker */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-white/10 bg-black/60 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2">
          <span className="shrink-0 rounded px-1.5 py-0.5 font-display text-[0.55rem] font-extrabold tracking-widest"
            style={{ background: pal.accent, color: "#06101f" }}>
            {flash ? "GOAL FLASH" : "LATEST"}
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={tickerText}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="min-w-0 flex-1 truncate text-[0.7rem] font-semibold text-white/80"
            >
              {tickerText}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
