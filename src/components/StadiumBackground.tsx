"use client";

import { useEffect, useRef } from "react";
import { useFxLevel } from "@/lib/fx";

/**
 * Canvas-based stadium atmosphere: sweeping floodlight beams with lens flares,
 * drifting smoke, floating ember particles, twinkling stars and occasional
 * camera flashes in the "stands". Pure canvas (no Three.js dependency) so it
 * stays lightweight and works everywhere. Respects reduced-motion.
 */
export function StadiumBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lvl = useFxLevel();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lite = lvl === "reduced";
    // phone simple mode: anything below full paints ONE static frame — no
    // continuous rAF loop draining the battery behind the UI
    const reduce = lvl !== "full" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let frame = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type P = { x: number; y: number; r: number; vy: number; vx: number; a: number; tw: number; star: boolean };
    type Smoke = { x: number; y: number; r: number; vx: number; a: number };
    type Flash = { x: number; y: number; t: number; life: number };
    let particles: P[] = [];
    let smoke: Smoke[] = [];
    let flashes: Flash[] = [];

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(lite ? 40 : 120, Math.floor((w * h) / (lite ? 26000 : 14000)));
      particles = Array.from({ length: count }, () => {
        const star = Math.random() > 0.55;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: star ? Math.random() * 1.3 + 0.3 : Math.random() * 2.4 + 0.6,
          vy: star ? 0 : -(Math.random() * 0.35 + 0.08),
          vx: star ? 0 : (Math.random() - 0.5) * 0.15,
          a: Math.random(),
          tw: Math.random() * 0.04 + 0.005,
          star,
        };
      });
      smoke = Array.from({ length: lite ? 0 : 5 }, () => ({
        x: Math.random() * w,
        y: h * (0.55 + Math.random() * 0.35),
        r: 120 + Math.random() * 180,
        vx: (Math.random() - 0.5) * 0.12,
        a: 0.03 + Math.random() * 0.03,
      }));
      flashes = [];
    };

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // sweeping floodlight beams from the top, each with a lens-flare head
      const beams = lite ? 2 : 3;
      for (let i = 0; i < beams; i++) {
        const cx = w * (0.2 + 0.3 * i) + Math.sin(t * 0.0004 + i) * w * 0.12;
        const hue = i % 2 === 0 ? "34, 224, 255" : "212, 175, 55";
        const grad = ctx.createLinearGradient(cx, 0, cx, h);
        grad.addColorStop(0, `rgba(${hue}, 0.11)`);
        grad.addColorStop(0.5, `rgba(${hue}, 0.025)`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx - 6, 0);
        ctx.lineTo(cx + 6, 0);
        ctx.lineTo(cx + w * 0.16, h);
        ctx.lineTo(cx - w * 0.16, h);
        ctx.closePath();
        ctx.fill();

        // flare: bright core + soft halo where the beam originates
        const halo = ctx.createRadialGradient(cx, 4, 0, cx, 4, 46);
        halo.addColorStop(0, `rgba(${hue}, 0.5)`);
        halo.addColorStop(0.3, `rgba(${hue}, 0.12)`);
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo;
        ctx.fillRect(cx - 46, -42, 92, 92);
        // horizontal anamorphic streak
        const streak = ctx.createLinearGradient(cx - 70, 0, cx + 70, 0);
        streak.addColorStop(0, "rgba(255,255,255,0)");
        streak.addColorStop(0.5, `rgba(${hue}, 0.28)`);
        streak.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = streak;
        ctx.fillRect(cx - 70, 3, 140, 1.6);
      }

      // drifting smoke banks near the bottom
      for (const s of smoke) {
        s.x += s.vx;
        if (s.x < -s.r) s.x = w + s.r;
        if (s.x > w + s.r) s.x = -s.r;
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
        g.addColorStop(0, `rgba(140, 170, 230, ${s.a})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
      }

      // stars + floating embers
      for (const p of particles) {
        if (p.star) {
          p.a += p.tw * (Math.sin(t * 0.002 + p.x) > 0 ? 1 : -1);
          p.a = Math.max(0.15, Math.min(1, p.a));
          ctx.fillStyle = `rgba(255,255,255,${p.a * 0.7})`;
        } else {
          p.y += p.vy;
          p.x += p.vx;
          if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
          ctx.fillStyle = `rgba(${Math.random() > 0.5 ? "212,175,55" : "34,224,255"},${p.a * 0.4})`;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // camera flashes popping in the lower "stands" band
      if (!lite && Math.random() < 0.02 && flashes.length < 6) {
        flashes.push({ x: Math.random() * w, y: h * (0.62 + Math.random() * 0.3), t: 0, life: 14 + Math.random() * 10 });
      }
      flashes = flashes.filter((f) => f.t < f.life);
      for (const f of flashes) {
        f.t++;
        const k = f.t / f.life;
        const alpha = k < 0.25 ? k / 0.25 : 1 - (k - 0.25) / 0.75;
        const r = 2 + k * 8;
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r * 3);
        g.addColorStop(0, `rgba(255,255,255,${alpha * 0.9})`);
        g.addColorStop(0.4, `rgba(200,225,255,${alpha * 0.25})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(f.x - r * 3, f.y - r * 3, r * 6, r * 6);
      }

      t += 16;
      if (!reduce) raf = requestAnimationFrame(loop);
    };
    // mobile performance mode paints every other frame — same look, half the work
    const loop = () => {
      frame++;
      if (lite && frame % 2 === 0) { raf = requestAnimationFrame(loop); t += 16; return; }
      draw();
    };

    resize();
    window.addEventListener("resize", resize);
    if (reduce) {
      draw();
    } else {
      raf = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [lvl]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute inset-0 scanlines opacity-40" />
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: "linear-gradient(to top, rgba(2,8,20,0.9), transparent)" }}
      />
    </div>
  );
}
