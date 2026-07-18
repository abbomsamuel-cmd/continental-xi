import { beatHold, type SimSpeed } from "../src/lib/match-clock";

/**
 * Headless replica of useMatchClock's stepping logic (must mirror the loop in
 * src/lib/match-clock.ts). Drives synthetic frames and asserts the invariants
 * the live-sim spec demands at 1× / 3× and across speed changes, pauses
 * and background-tab gaps.
 */
const MAX_FRAME_MS = 90;
const MS_PER_MINUTE = 340;

interface Frame { dt: number; speed: SimSpeed; paused: boolean }

function run(frames: Frame[], endMinute: number, holdAt: Record<number, string>) {
  const st = { sim: 0, lastM: -1, holdUntil: 0, finished: false };
  let clock = 0;
  const fires: number[] = [];
  let finishCount = 0;
  let maxJump = 0;
  for (const f of frames) {
    let dt = f.dt;
    if (dt > MAX_FRAME_MS) dt = MAX_FRAME_MS;
    clock += f.dt; // real wall clock uses the true dt
    if (f.paused) { if (st.holdUntil > clock) st.holdUntil += dt; continue; }
    if (!st.finished && clock >= st.holdUntil) {
      const before = Math.floor(st.sim);
      st.sim = Math.min(endMinute, st.sim + (dt * f.speed) / MS_PER_MINUTE);
      const m = Math.floor(st.sim);
      maxJump = Math.max(maxJump, m - before);
      if (m > st.lastM) {
        st.lastM = m;
        fires.push(m);
        const hold = beatHold(holdAt[m] ?? "", f.speed);
        if (hold > 0) st.holdUntil = clock + hold;
      }
      if (st.sim >= endMinute) { st.finished = true; finishCount++; }
    }
  }
  return { fires, finishCount, maxJump };
}

function framesFor(seconds: number, speed: SimSpeed, fps = 60): Frame[] {
  const n = Math.round(seconds * fps);
  return Array.from({ length: n }, () => ({ dt: 1000 / fps, speed, paused: false }));
}

let pass = 0, fail = 0;
const ok = (cond: boolean, msg: string) => { if (cond) pass++; else { fail++; console.log("  ✗ " + msg); } };

const END = 94;
const HOLDS = { 30: "goal", 45: "ht", 60: "yellow", 78: "var" } as Record<number, string>;

// 1× — full run. Budget: ~94 min × 340ms + holds(goal3.2+ht2.2+yellow1.6+var2.8=9.8s) ≈ 42s. Give 70s.
for (const sp of [1, 3] as SimSpeed[]) {
  const budget = 70 / sp + 12; // seconds of real time, generous
  const { fires, finishCount, maxJump } = run(framesFor(budget, sp), END, HOLDS);
  const uniq = new Set(fires);
  ok(fires.length === uniq.size, `${sp}×: every minute fires at most once (dups: ${fires.length - uniq.size})`);
  ok(fires.every((m, i) => i === 0 || m > fires[i - 1]), `${sp}×: minutes strictly increasing`);
  ok(fires[0] === 0, `${sp}×: first fire is minute 0`);
  ok(Math.max(...fires) === END, `${sp}×: reaches end minute ${END} (got ${Math.max(...fires)})`);
  ok(finishCount === 1, `${sp}×: finish fires exactly once (got ${finishCount})`);
  ok(maxJump <= 1, `${sp}×: no minute skipped in a single frame (maxJump ${maxJump})`);
}

// speed change 1×→3× mid-run: still monotonic, one finish, no skips
{
  const frames = [...framesFor(8, 1), ...framesFor(40, 3)];
  const { fires, finishCount, maxJump } = run(frames, END, HOLDS);
  ok(new Set(fires).size === fires.length, "speed-change: no duplicate minutes");
  ok(finishCount === 1, "speed-change: finish once");
  ok(maxJump <= 1, "speed-change: no skipped minute");
  ok(Math.max(...fires) === END, "speed-change: still reaches end");
}

// background tab: one 5-second frozen gap must NOT jump the clock
{
  const frames = [...framesFor(3, 1), { dt: 5000, speed: 1 as SimSpeed, paused: false }, ...framesFor(60, 1)];
  const { fires, maxJump, finishCount } = run(frames, END, HOLDS);
  ok(maxJump <= 1, `background gap: clamp prevents jump (maxJump ${maxJump})`);
  ok(finishCount === 1, "background gap: finish once");
  ok(new Set(fires).size === fires.length, "background gap: no dup minutes");
}

// pause: no minutes advance while paused
{
  const paused: Frame[] = Array.from({ length: 300 }, () => ({ dt: 16.7, speed: 1, paused: true }));
  const frames = [...framesFor(2, 1), ...paused, ...framesFor(60, 1)];
  const beforePause = run(framesFor(2, 1), END, HOLDS).fires.length;
  const withPause = run([...framesFor(2, 1), ...paused], END, HOLDS).fires.length;
  ok(beforePause === withPause, `pause: clock frozen while paused (${beforePause} vs ${withPause})`);
  const { finishCount } = run(frames, END, HOLDS);
  ok(finishCount === 1, "pause then resume: finishes once");
}

// hold correctness: 3× stays clearly readable (goal above its 1.2s minimum)
ok(beatHold("goal", 3) === 1400, "3× goal hold 1400ms (≥1.2s minimum)");
ok(beatHold("goal", 1) === 3200, "1× goal hold 3200ms");
ok(beatHold("var", 3) === 1700, "3× VAR hold 1700ms (≥1.5s minimum)");

console.log(fail === 0 ? `\n✅ match clock: ${pass} invariants hold` : `\n❌ ${fail} failed, ${pass} passed`);
process.exit(fail === 0 ? 0 : 1);
