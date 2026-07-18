"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The single source of truth for live-match timing.
 *
 * One requestAnimationFrame loop advances a simulation clock from ELAPSED real
 * time × the current speed multiplier — never a chain of independent setTimeouts.
 * Because speed and pause are read from a ref every frame, changing speed or
 * pausing mid-animation is seamless: progress is preserved, nothing restarts,
 * duplicates or skips.
 *
 * Each time the integer minute advances, `onMinute(m)` fires (imperative — safe
 * to setState, play a cue, mount an overlay) and may return a HOLD in ms. While
 * a hold is active the clock freezes, so a critical moment (goal, card, VAR)
 * always gets its full readable animation and the next event can never overlap
 * it. Holds are supplied already scaled for the current speed, with floors, so
 * the big moments stay understandable even at 4×.
 *
 * dt is clamped per frame, so returning from a background tab (where rAF is
 * throttled/paused) never jumps the match clock. Cleanup cancels the loop on
 * unmount or when the clock goes inactive — no leaks, no stray timers.
 */

export type SimSpeed = 1 | 2 | 4;

interface MatchClockOpts {
  endMinute: number;
  speed: SimSpeed;
  paused: boolean;
  /** run only while true (e.g. intro finished AND match not over) */
  active: boolean;
  /** base real milliseconds per simulated minute at 1× */
  msPerMinute: number;
  /** fired once when the integer minute increments; return a hold (ms) to freeze the clock for a readable beat */
  onMinute: (minute: number) => number;
  /** fired once when the clock reaches full time */
  onFinish: () => void;
}

const MAX_FRAME_MS = 90; // clamp so a backgrounded tab can't fast-forward the clock

export function useMatchClock(opts: MatchClockOpts): number {
  const [minute, setMinute] = useState(0);
  // latest opts every frame — the loop never restarts on speed/pause/state change
  const ref = useRef(opts);
  useEffect(() => { ref.current = opts; }); // sync after every render (never during)

  useEffect(() => {
    if (!opts.active) return;
    // fresh clock for this leg — the first frame emits minute 0 (floor(0) > -1)
    const st = { sim: 0, lastM: -1, holdUntil: 0, finished: false };
    let raf = 0;
    let prev = performance.now();

    const loop = (now: number) => {
      const o = ref.current;
      let dt = now - prev;
      prev = now;
      if (dt > MAX_FRAME_MS) dt = MAX_FRAME_MS; // ignore the gap from a hidden tab

      if (o.paused) {
        // keep any active hold "remaining" instead of expiring while frozen
        if (st.holdUntil > now) st.holdUntil += dt;
        raf = requestAnimationFrame(loop);
        return;
      }

      if (!st.finished && now >= st.holdUntil) {
        st.sim = Math.min(o.endMinute, st.sim + (dt * o.speed) / o.msPerMinute);
        const m = Math.floor(st.sim);
        if (m > st.lastM) {
          st.lastM = m;
          setMinute(m);
          const hold = o.onMinute(m);
          if (hold > 0) st.holdUntil = now + hold;
        }
        if (st.sim >= o.endMinute) {
          st.finished = true;
          o.onFinish();
        }
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [opts.active]);

  return minute;
}

/** Readable beat durations (ms) per event, per speed — floored so the big
 *  moments never become impossible to follow. 0 = no full-screen hold (the
 *  event stays a timeline update only). */
const HOLD: Record<string, Record<SimSpeed, number>> = {
  goal: { 1: 3200, 2: 1800, 4: 1100 },
  red: { 1: 2800, 2: 1700, 4: 1050 },
  var: { 1: 2800, 2: 1700, 4: 1050 },
  ht: { 1: 2200, 2: 1400, 4: 900 },
  yellow: { 1: 1600, 2: 1050, 4: 750 },
  sub: { 1: 1500, 2: 1000, 4: 0 },
  save: { 1: 1100, 2: 800, 4: 550 },
  chance: { 1: 650, 2: 480, 4: 0 },
};

export function beatHold(kind: string, speed: SimSpeed): number {
  return HOLD[kind]?.[speed] ?? 0;
}
