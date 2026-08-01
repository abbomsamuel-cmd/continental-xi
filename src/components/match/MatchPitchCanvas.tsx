"use client";

import { useEffect, useRef } from "react";
import type { Formation, MatchResult } from "@/lib/types";
import { synthesizeFrame, synthesizeShotMap, type PitchFrame, type Vec2 } from "@/lib/engine/pitch-anim";
import { useFxLevel } from "@/lib/fx";

interface TeamRef {
  colors: [string, string];
  short: string;
}

interface Props {
  result: MatchResult;
  home: TeamRef;
  away: TeamRef;
  homeFormation: Formation;
  awayFormation: Formation;
  /** current minute — drive this from the parent's useMatchClock() */
  minute: number;
  paused?: boolean;
  /** "live" animates dots + ball toward the minute's synthesized frame;
   *  "shotmap" draws a static goal/chance overlay and needs no clock at all */
  mode?: "live" | "shotmap";
  className?: string;
}

const LERP_K_FULL = 0.12;
const LERP_K_REDUCED = 0.22; // fewer redraws, so each one should close more distance

/** Live 2D pitch — player dots + ball, synthesized from an already-final
 *  MatchResult (see lib/engine/pitch-anim.ts). Canvas + rAF, modeled directly
 *  on StadiumBackground.tsx: dpr-clamped sizing, useFxLevel()-gated fidelity,
 *  a single static redraw (no continuous loop) under data-fx="off". */
export function MatchPitchCanvas({ result, home, away, homeFormation, awayFormation, minute, paused, mode = "live", className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lvl = useFxLevel();

  // latest props every frame, read from inside the rAF loop without restarting it
  const propsRef = useRef({ result, home, away, homeFormation, awayFormation, minute, paused, mode, lvl });
  useEffect(() => { propsRef.current = { result, home, away, homeFormation, awayFormation, minute, paused, mode, lvl }; });

  const targetRef = useRef<PitchFrame | null>(null);
  const drawnDotsRef = useRef<Map<string, Vec2>>(new Map());
  const drawnBallRef = useRef<Vec2>({ x: 50, y: 50 });
  const drawnBallZRef = useRef(0);
  const drawRef = useRef<() => void>(() => {});

  // recompute the target frame whenever the minute (or the match itself) changes
  useEffect(() => {
    if (mode !== "live") return;
    const frame = synthesizeFrame(result, homeFormation, awayFormation, minute);
    const firstFrame = targetRef.current === null;
    targetRef.current = frame;
    if (firstFrame) {
      // snap on the very first frame — nothing to lerp from yet
      for (const d of frame.dots) drawnDotsRef.current.set(d.id, { ...d.pos });
      drawnBallRef.current = { ...frame.ball.pos };
      drawnBallZRef.current = frame.ball.z;
    }
  }, [result, homeFormation, awayFormation, minute, mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let frameCount = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    // shared pitch space (0-100, y=100 = home's attacking end) mapped onto
    // the canvas the same way Pitch.tsx projects formation slots: x left to
    // right, y=100 at the top of the view.
    const toScreen = (p: Vec2): [number, number] => [4 + (p.x / 100) * (w > 0 ? w * 0.92 : 0), 4 + ((100 - p.y) / 100) * (h > 0 ? h * 0.92 : 0)];

    const drawPitch = () => {
      ctx.clearRect(0, 0, w, h);
      const turf = ctx.createLinearGradient(0, 0, 0, h);
      turf.addColorStop(0, "#0f172a");
      turf.addColorStop(1, "#07090e");
      ctx.fillStyle = turf;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(226,232,240,0.28)";
      ctx.lineWidth = 1;
      const pad = Math.min(w, h) * 0.03;
      ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
      ctx.beginPath();
      ctx.moveTo(pad, h / 2);
      ctx.lineTo(w - pad, h / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.13, 0, Math.PI * 2);
      ctx.stroke();
    };

    const drawDot = (pos: Vec2, color: string) => {
      const [x, y] = toScreen(pos);
      const r = Math.max(3, Math.min(w, h) * 0.016);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      if (propsRef.current.lvl === "full") {
        ctx.beginPath();
        ctx.arc(x, y, r + 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const drawBall = (pos: Vec2, z: number) => {
      const [x, y] = toScreen(pos);
      const r = Math.max(2.5, Math.min(w, h) * 0.011);
      if (propsRef.current.lvl !== "off") {
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.6, r * (1 + z), r * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,0,0,${0.35 - z * 0.15})`;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(x, y - z * r * 4, r, 0, Math.PI * 2);
      ctx.fillStyle = "#f8fafc";
      ctx.fill();
      ctx.strokeStyle = "rgba(10,14,23,0.6)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    };

    const drawShotMap = () => {
      const { result: r, home: h_, away: a_ } = propsRef.current;
      drawPitch();
      for (const s of synthesizeShotMap(r)) {
        const [x, y] = toScreen(s.pos);
        const color = s.outcome === "goal" ? "#00f0ff" : (s.team === 0 ? h_.colors[0] : a_.colors[0]);
        ctx.beginPath();
        ctx.arc(x, y, s.outcome === "goal" ? 5 : 3.5, 0, Math.PI * 2);
        if (s.outcome === "goal") {
          ctx.fillStyle = color;
          ctx.fill();
        } else {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      }
    };

    const draw = () => {
      if (w === 0 || h === 0) return;
      const p = propsRef.current;
      if (p.mode === "shotmap") { drawShotMap(); return; }

      const target = targetRef.current;
      drawPitch();
      if (!target) return;

      const k = p.lvl === "reduced" ? LERP_K_REDUCED : LERP_K_FULL;
      const drawn = drawnDotsRef.current;
      for (const d of target.dots) {
        const cur = drawn.get(d.id) ?? { ...d.pos };
        cur.x += (d.pos.x - cur.x) * k;
        cur.y += (d.pos.y - cur.y) * k;
        drawn.set(d.id, cur);
        drawDot(cur, d.team === 0 ? p.home.colors[0] : p.away.colors[0]);
      }
      const ball = drawnBallRef.current;
      ball.x += (target.ball.pos.x - ball.x) * k;
      ball.y += (target.ball.pos.y - ball.y) * k;
      drawnBallZRef.current += (target.ball.z - drawnBallZRef.current) * k;
      drawBall(ball, drawnBallZRef.current);
    };

    const loop = () => {
      const p = propsRef.current;
      if (p.mode === "shotmap" || p.lvl === "off") { raf = 0; return; } // no continuous loop needed
      if (!p.paused) {
        frameCount++;
        // "reduced" halves the redraw rate — same easing, half the work
        if (p.lvl !== "reduced" || frameCount % 2 === 0) draw();
      }
      raf = requestAnimationFrame(loop);
    };

    drawRef.current = draw;
    resize();
    window.addEventListener("resize", resize);
    if (mode === "shotmap" || lvl === "off") {
      draw(); // one static frame, no rAF loop
    } else {
      raf = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
    // re-mount the loop when fidelity mode or view mode changes; per-frame
    // data (minute/paused/teams) is read live from propsRef instead
  }, [lvl, mode]);

  // "off" mode has no continuous rAF loop, so force one redraw whenever the
  // target frame actually changes (minute ticks) — still no per-frame work
  useEffect(() => {
    if (lvl !== "off") return;
    drawRef.current();
  }, [minute, lvl]);

  return (
    <div className={`relative aspect-[7/10] w-full overflow-hidden rounded-2xl ${className ?? ""}`}>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
