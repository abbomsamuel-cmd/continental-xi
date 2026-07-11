"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MatchResult } from "@/lib/types";
import { TeamBadge } from "@/components/TeamBadge";
import { PenaltyShootout } from "@/components/PenaltyShootout";
import { play } from "@/lib/sound";

/**
 * Live Match Mode — replays an already-simulated MatchResult minute by minute
 * like a Football Manager broadcast: kick-off, goals, cards, saves, half-time,
 * penalties, full time. Pause / ×2 / ×4 / skip-to-result controls, and the
 * statistics panel fills in live as the match unfolds.
 */

interface LiveTeamRef {
  name: string;
  short: string;
  colors: [string, string];
  season?: number;
}

export interface LiveLeg {
  result: MatchResult;
  /** e.g. "1st Leg", "2nd Leg" — omitted for single-match ties */
  label?: string;
}

interface FeedLine {
  minute: number;
  icon: string;
  text: string;
  sub?: string;
  team?: 0 | 1;
  kind: "system" | "event" | "filler" | "goal";
}

/** Deterministic pseudo-random from the match itself, so replays look identical. */
function frac(n: number): number {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
}

const MS_PER_MINUTE = 340; // ~32s for a full match at ×1

const CHANCE_LINES = [
  "drills one just wide of the far post!",
  "gets a shot away — deflected behind for a corner.",
  "curls an effort towards the top corner… over the bar!",
  "breaks in behind but the flag is up. Offside.",
  "hits a first-time volley straight at the keeper.",
  "wins a free-kick in a dangerous position.",
];
const SAVE_LINES = [
  "HUGE SAVE! The keeper gets fingertips to it!",
  "What a stop — turned around the post at full stretch!",
  "Point-blank save! How has that stayed out?",
];
const MIDFIELD_LINES = [
  "A patient spell of possession, probing for an opening.",
  "Crunching tackle in the middle of the park.",
  "The press wins the ball back high up the pitch.",
  "Tempo drops for a moment — both benches are up, shouting instructions.",
];

/** Build the full minute-by-minute script for one leg. */
function buildScript(r: MatchResult, home: LiveTeamRef, away: LiveTeamRef): FeedLine[] {
  const teamName = (t: 0 | 1) => (t === 0 ? home.name : away.name);
  const seed = r.homeGoals * 97 + r.awayGoals * 31 + r.stats.shots[0] * 7 + r.stats.shots[1] * 3;
  const lines: FeedLine[] = [{ minute: 1, icon: "🟢", text: "Kick-off!", sub: "The referee gets us underway.", kind: "system" }];
  const used = new Set<number>(r.events.map((e) => e.minute));

  // real events
  for (const e of r.events) {
    if (e.type === "goal") {
      lines.push({
        minute: e.minute, icon: "⚽", team: e.team, kind: "goal",
        text: `GOAL! ${e.player} scores for ${teamName(e.team)}!`,
        sub: e.assist ? `Assisted by ${e.assist}.` : "A moment of individual brilliance.",
      });
    } else if (e.type === "yellow") {
      lines.push({ minute: e.minute, icon: "🟨", team: e.team, kind: "event", text: `Yellow card — ${e.player}`, sub: teamName(e.team) });
    } else if (e.type === "red") {
      lines.push({ minute: e.minute, icon: "🟥", team: e.team, kind: "event", text: `RED CARD! ${e.player} is off!`, sub: `${teamName(e.team)} are down to ten.` });
    } else if (e.type === "var") {
      lines.push({ minute: e.minute, icon: "📺", team: e.team, kind: "event", text: "VAR review…", sub: e.note });
    }
  }

  // filler commentary drawn deterministically from the stats
  const freeMinute = (n: number) => {
    let m = 4 + Math.floor(frac(seed + n * 13.7) * 86);
    let guard = 0;
    while ((used.has(m) || m === 45 || m === 46) && guard++ < 40) m = 4 + Math.floor(frac(seed + n * 13.7 + guard * 3.1) * 86);
    used.add(m);
    return m;
  };
  const saves = Math.max(0, Math.min(3, r.stats.onTarget[0] + r.stats.onTarget[1] - r.homeGoals - r.awayGoals - 2));
  const chances = Math.min(5, Math.max(2, Math.round((r.stats.shots[0] + r.stats.shots[1]) / 6)));
  let n = 0;
  for (let i = 0; i < chances; i++) {
    const team = (frac(seed + i * 7.3) > r.stats.shots[1] / (r.stats.shots[0] + r.stats.shots[1] || 1) ? 0 : 1) as 0 | 1;
    lines.push({
      minute: freeMinute(n++), icon: "⚡", team, kind: "filler",
      text: `${teamName(team)} ${CHANCE_LINES[Math.floor(frac(seed + i * 5.1) * CHANCE_LINES.length)]}`,
    });
  }
  for (let i = 0; i < saves; i++) {
    lines.push({ minute: freeMinute(n++), icon: "🧤", kind: "filler", text: SAVE_LINES[Math.floor(frac(seed + i * 9.7) * SAVE_LINES.length)] });
  }
  for (let i = 0; i < 2; i++) {
    lines.push({ minute: freeMinute(n++), icon: "🎙️", kind: "filler", text: MIDFIELD_LINES[Math.floor(frac(seed + i * 11.3) * MIDFIELD_LINES.length)] });
  }

  // structural beats
  const htScore = (t: 0 | 1) => r.events.filter((e) => e.type === "goal" && e.team === t && e.minute <= 45).length;
  lines.push({ minute: 45, icon: "⏸", text: `HALF TIME — ${home.short} ${htScore(0)}-${htScore(1)} ${away.short}`, sub: "The players head down the tunnel.", kind: "system" });
  lines.push({ minute: 46, icon: "🟢", text: "Second half under way.", sub: "No changes at the break — or are there? The shape looks different.", kind: "system" });

  lines.sort((a, b) => a.minute - b.minute || (a.kind === "system" ? -1 : 1));
  return lines;
}

/** Ease a final stat towards its full-time value as the clock runs. */
function liveStat(finalVal: number, minute: number, endMinute: number, wobbleSeed: number): number {
  const t = Math.min(1, minute / endMinute);
  const eased = t * t * (3 - 2 * t);
  const wobble = minute >= endMinute ? 0 : (frac(wobbleSeed + minute * 3.7) - 0.5) * 0.12;
  return Math.max(0, finalVal * Math.min(1, eased + wobble));
}

export function LiveMatch({
  legs,
  homeOf,
  awayOf,
  title,
  subtitle,
  accent = "#d4af37",
  onDone,
}: {
  legs: LiveLeg[];
  /** resolve the home/away side of a given result to displayable team refs */
  homeOf: (r: MatchResult) => LiveTeamRef;
  awayOf: (r: MatchResult) => LiveTeamRef;
  title: string;
  subtitle?: string;
  accent?: string;
  onDone: () => void;
}) {
  const [legIdx, setLegIdx] = useState(0);
  const leg = legs[legIdx];
  const r = leg.result;
  const home = homeOf(r);
  const away = awayOf(r);

  const endMinute = useMemo(() => Math.max(90, ...r.events.map((e) => e.minute)), [r]);
  const script = useMemo(() => buildScript(r, home, away), [r]); // eslint-disable-line react-hooks/exhaustive-deps

  const [minute, setMinute] = useState(0);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [finished, setFinished] = useState(false);
  // a shootout is watched (or skipped) before its score is ever revealed
  const [shootoutDone, setShootoutDone] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const hasShootout = !!r.shootout;
  const pensRevealed = !hasShootout || shootoutDone;

  const goalsAt = (team: 0 | 1, m: number) =>
    r.events.filter((e) => e.type === "goal" && e.team === team && e.minute <= m).length;
  const hGoals = finished ? r.homeGoals : goalsAt(0, minute);
  const aGoals = finished ? r.awayGoals : goalsAt(1, minute);

  // the clock
  useEffect(() => {
    if (paused || finished) return;
    if (minute >= endMinute) {
      const id = setTimeout(() => { setFinished(true); play("whistle"); }, 700);
      return () => clearTimeout(id);
    }
    // linger on the big beats: half-time and any goal minute
    const isBeat = minute === 45 || r.events.some((e) => e.type === "goal" && e.minute === minute);
    const id = setTimeout(() => setMinute((m) => m + 1), (isBeat ? MS_PER_MINUTE * 3.2 : MS_PER_MINUTE) / speed);
    return () => clearTimeout(id);
  }, [minute, paused, speed, finished, endMinute, r.events]);

  // goal sting
  useEffect(() => {
    if (r.events.some((e) => e.type === "goal" && e.minute === minute)) play("goal");
  }, [minute, r.events]);

  // keep the newest commentary in view
  useEffect(() => {
    feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [minute]);

  const visible = script.filter((l) => l.minute <= minute).reverse();
  const clockLabel = finished
    ? r.penalties ? "FT · PENS" : "FULL TIME"
    : minute === 45 ? "HT" : minute >= 90 ? `90+${minute - 90}'` : `${minute}'`;

  const stat = (pair: [number, number], decimals = 0): [string, string, number] => {
    const h = liveStat(pair[0], minute, endMinute, pair[0] * 13 + 1);
    const a = liveStat(pair[1], minute, endMinute, pair[1] * 17 + 2);
    const hv = finished ? pair[0] : h;
    const av = finished ? pair[1] : a;
    const share = hv + av > 0 ? (hv / (hv + av)) * 100 : 50;
    return [hv.toFixed(decimals), av.toFixed(decimals), share];
  };
  // possession converges from 50/50 to the final split
  const possT = Math.min(1, minute / 60);
  const possH = finished ? r.stats.possession[0] : Math.round(50 + (r.stats.possession[0] - 50) * possT);

  const rows: { label: string; h: string; a: string; share: number }[] = [
    { label: "Possession", h: `${possH}%`, a: `${100 - possH}%`, share: possH },
    ...([
      ["Shots", r.stats.shots, 0],
      ["On Target", r.stats.onTarget, 0],
      ["xG", r.stats.xg, 2],
      ["Corners", r.stats.corners, 0],
      ["Fouls", r.stats.fouls, 0],
    ] as [string, [number, number], number][]).map(([label, pair, d]) => {
      const [h, a, share] = stat(pair, d);
      return { label, h, a, share };
    }),
  ];

  const skip = () => { setMinute(endMinute); setFinished(true); play("whistle"); };

  const nextLeg = legIdx < legs.length - 1;
  const continueFrom = () => {
    if (nextLeg) {
      setLegIdx(legIdx + 1);
      setMinute(0);
      setFinished(false);
      setShootoutDone(false);
      setPaused(false);
      play("whistle");
    } else {
      onDone();
    }
  };

  // aggregate line for two-legged ties (shown on the second leg)
  const aggNote = legs.length === 2 && legIdx === 1 ? (() => {
    const l1 = legs[0].result;
    // sides swap between legs: leg1 home == leg2 away
    const homeAgg = (finished ? r.homeGoals : hGoals) + l1.awayGoals;
    const awayAgg = (finished ? r.awayGoals : aGoals) + l1.homeGoals;
    return `Aggregate ${homeAgg}-${awayAgg}`;
  })() : null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[140] flex items-center justify-center overflow-y-auto p-3 sm:p-6"
      style={{ background: "radial-gradient(120% 90% at 50% 20%, #081233, #020714 78%)" }}
    >
      <div className="w-full max-w-3xl">
        {/* broadcast header */}
        <div className="text-center">
          <div className="cl-heading text-[0.6rem] tracking-[0.45em]" style={{ color: accent }}>
            {subtitle ? `${subtitle} · ` : ""}{title}{leg.label ? ` · ${leg.label}` : ""} · LIVE
          </div>
        </div>

        {/* scoreboard */}
        <div className="relative mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/45">
          <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: `linear-gradient(180deg, ${home.colors[0]}, ${home.colors[1]})` }} />
          <div className="absolute inset-y-0 right-0 w-1.5" style={{ background: `linear-gradient(180deg, ${away.colors[0]}, ${away.colors[1]})` }} />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <TeamBadge colors={home.colors} code={home.short} size={38} />
              <div className="min-w-0">
                <div className="truncate font-display text-sm font-extrabold text-white sm:text-base">{home.name}</div>
                {home.season ? <div className="text-[0.6rem] text-white/45">{home.season}</div> : null}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 font-display text-3xl font-extrabold sm:text-4xl">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span key={`h${hGoals}`} initial={{ y: -18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 18, opacity: 0 }} className="text-white">{hGoals}</motion.span>
                </AnimatePresence>
                <span className="text-white/35">–</span>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span key={`a${aGoals}`} initial={{ y: -18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 18, opacity: 0 }} className="text-white">{aGoals}</motion.span>
                </AnimatePresence>
              </div>
              <div
                className="mx-auto mt-1 w-fit rounded-md px-2 py-0.5 font-display text-[0.65rem] font-extrabold tracking-widest"
                style={{ background: `${accent}22`, color: accent }}
              >
                {clockLabel}
              </div>
              {finished && r.penalties && pensRevealed && (
                <div className="mt-1 text-[0.62rem] font-bold text-white/70">Penalties {r.penalties[0]}–{r.penalties[1]}</div>
              )}
              {aggNote && <div className="mt-1 text-[0.58rem] text-white/50">{aggNote}</div>}
            </div>
            <div className="flex min-w-0 items-center justify-end gap-2.5 text-right">
              <div className="min-w-0">
                <div className="truncate font-display text-sm font-extrabold text-white sm:text-base">{away.name}</div>
                {away.season ? <div className="text-[0.6rem] text-white/45">{away.season}</div> : null}
              </div>
              <TeamBadge colors={away.colors} code={away.short} size={38} />
            </div>
          </div>
          {/* match progress strip */}
          <div className="h-1 w-full bg-white/6">
            <div className="h-full transition-[width] duration-300" style={{ width: `${(Math.min(minute, endMinute) / endMinute) * 100}%`, background: accent }} />
          </div>
        </div>

        {/* controls */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button
            className="btn btn-ghost px-4 py-1.5 text-[0.68rem]"
            onClick={() => { setPaused((p) => !p); play("click"); }}
            disabled={finished}
          >
            {paused ? "▶ Resume" : "⏸ Pause"}
          </button>
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => { setSpeed(s); play("click"); }}
              disabled={finished}
              className="rounded-full px-3 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-wider transition-colors"
              style={speed === s
                ? { background: accent, color: "#06101f" }
                : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }}
            >
              ×{s}
            </button>
          ))}
          {!finished && (
            <button className="btn btn-ghost px-4 py-1.5 text-[0.68rem]" onClick={skip}>⏭ Skip to Result</button>
          )}
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[1.25fr_1fr]">
          {/* commentary feed */}
          <div ref={feedRef} className="glass max-h-[42vh] overflow-y-auto rounded-2xl p-3 md:max-h-[46vh]">
            <AnimatePresence initial={false}>
              {finished && (
                <motion.div
                  initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-2 rounded-xl border px-3 py-2.5 text-center"
                  style={{ borderColor: `${accent}66`, background: `${accent}14` }}
                >
                  <div className="font-display text-sm font-extrabold" style={{ color: accent }}>
                    FULL TIME — {home.short} {r.homeGoals}-{r.awayGoals} {away.short}
                    {r.penalties && pensRevealed ? ` (${r.penalties[0]}–${r.penalties[1]} pens)` : ""}
                  </div>
                  <div className="mt-0.5 text-[0.65rem] text-white/60">⭐ Player of the Match: {r.motm}</div>
                </motion.div>
              )}
              {finished && r.penalties && pensRevealed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2 rounded-lg bg-white/5 px-3 py-2 text-[0.7rem] text-white/70">
                  🥅 Level after extra time — decided on penalties, {r.penalties[0]}–{r.penalties[1]}.
                </motion.div>
              )}
              {visible.map((l, i) => (
                <motion.div
                  key={`${l.minute}-${l.text}`}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-2.5 border-b border-white/5 px-1 py-2 last:border-0 ${i === 0 ? "" : "opacity-80"}`}
                  style={l.kind === "goal" ? { background: `linear-gradient(90deg, ${accent}18, transparent)`, borderRadius: 10 } : undefined}
                >
                  <span className="w-9 shrink-0 text-right font-display text-[0.7rem] font-extrabold" style={{ color: accent }}>
                    {l.minute > 90 ? `90+${l.minute - 90}'` : `${l.minute}'`}
                  </span>
                  <span className="shrink-0 text-sm leading-5">{l.icon}</span>
                  <span className="min-w-0">
                    <span className={`block text-[0.74rem] leading-snug ${l.kind === "goal" ? "font-extrabold text-white" : l.kind === "system" ? "font-bold text-white/85" : "text-white/70"}`}>
                      {l.text}
                    </span>
                    {l.sub && <span className="block text-[0.62rem] text-white/45">{l.sub}</span>}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {visible.length === 0 && (
              <div className="px-1 py-3 text-center text-[0.7rem] text-white/50">The teams are in the tunnel…</div>
            )}
          </div>

          {/* live statistics */}
          <div className="glass rounded-2xl p-4">
            <div className="mb-2 text-[0.58rem] font-bold uppercase tracking-[0.3em] text-white/40">Live Statistics</div>
            <div className="space-y-2.5">
              {rows.map((row) => (
                <div key={row.label}>
                  <div className="flex items-baseline justify-between text-[0.7rem]">
                    <span className="font-display font-extrabold text-white">{row.h}</span>
                    <span className="text-[0.58rem] uppercase tracking-widest text-white/45">{row.label}</span>
                    <span className="font-display font-extrabold text-white">{row.a}</span>
                  </div>
                  <div className="mt-1 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-l-full transition-[width] duration-500" style={{ width: `${row.share}%`, background: `linear-gradient(90deg, ${home.colors[0]}, ${accent})` }} />
                    <div className="h-full flex-1 rounded-r-full" style={{ background: "rgba(255,255,255,0.14)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* full-time continue — hidden while a shootout still has to be watched */}
        <AnimatePresence>
          {finished && pensRevealed && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-4 flex justify-center">
              <button className="btn btn-gold btn-pulse" onClick={continueFrom}>
                {nextLeg ? "Continue to the 2nd Leg →" : "Continue →"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* penalty shootout — plays out before the score is ever revealed */}
      <AnimatePresence>
        {finished && hasShootout && !shootoutDone && r.shootout && (
          <PenaltyShootout
            shootout={r.shootout}
            home={{ name: home.name, short: home.short, colors: home.colors }}
            away={{ name: away.name, short: away.short, colors: away.colors }}
            accent={accent}
            roundLabel={title}
            defaultLive
            onDone={() => setShootoutDone(true)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** The pre-match "Choose Simulation Style" prompt for the big nights. */
export function SimStyleChoice({
  title,
  accent = "#d4af37",
  onQuick,
  onLive,
  onCancel,
}: {
  title: string;
  accent?: string;
  onQuick: () => void;
  onLive: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[135] flex items-center justify-center p-4"
      style={{ background: "rgba(2,7,20,0.85)" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.92, y: 18 }} animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="glass-strong w-full max-w-md rounded-3xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cl-heading text-[0.6rem] tracking-[0.4em]" style={{ color: accent }}>{title}</div>
        <h2 className="mt-1 font-display text-2xl font-extrabold text-white">Choose Simulation Style</h2>
        <div className="mt-5 grid gap-3">
          <button
            className="shine rounded-2xl border p-4 text-left transition-transform hover:scale-[1.02]"
            style={{ borderColor: `${accent}55`, background: `linear-gradient(140deg, ${accent}1a, transparent)` }}
            onClick={onLive}
          >
            <div className="flex items-center gap-2 font-display text-base font-extrabold text-white">
              <span className="grid h-8 w-8 place-items-center rounded-lg text-lg" style={{ background: `${accent}22` }}>📡</span>
              Live Match
              <span className="chip ml-auto" style={{ background: `${accent}22`, color: accent }}>New</span>
            </div>
            <p className="mt-1.5 text-[0.72rem] leading-relaxed text-white/60">
              Watch it unfold minute by minute — commentary, goals, cards and live statistics.
              Pause, speed up ×2/×4, or skip to the result at any time.
            </p>
          </button>
          <button
            className="rounded-2xl border border-white/12 bg-white/4 p-4 text-left transition-transform hover:scale-[1.02]"
            onClick={onQuick}
          >
            <div className="flex items-center gap-2 font-display text-base font-extrabold text-white">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/8 text-lg">⚡</span>
              Quick Sim
            </div>
            <p className="mt-1.5 text-[0.72rem] leading-relaxed text-white/60">
              Straight to the result with the cinematic reveal.
            </p>
          </button>
        </div>
        <button className="mt-4 text-[0.65rem] font-bold uppercase tracking-widest text-white/40 hover:text-white/70" onClick={onCancel}>
          Not yet — back to the build-up
        </button>
      </motion.div>
    </motion.div>
  );
}
