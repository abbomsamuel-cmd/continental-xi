"use client";

import { useEffect, useRef } from "react";

/**
 * Canvas-based stadium atmosphere: drifting particles + twinkling stars +
 * sweeping stadium light beams. Pure canvas (no Three.js dependency needed)
 * so it stays lightweight and works everywhere. Respects reduced-motion.
 */
export function StadiumBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type P = { x: number; y: number; r: number; vy: number; vx: number; a: number; tw: number; star: boolean };
    let particles: P[] = [];

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(120, Math.floor((w * h) / 14000));
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
    };

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // sweeping light beams from top
      const beams = 3;
      for (let i = 0; i < beams; i++) {
        const cx = w * (0.2 + 0.3 * i) + Math.sin(t * 0.0004 + i) * w * 0.12;
        const grad = ctx.createLinearGradient(cx, 0, cx, h);
        const hue = i % 2 === 0 ? "34, 224, 255" : "212, 175, 55";
        grad.addColorStop(0, `rgba(${hue}, 0.10)`);
        grad.addColorStop(0.5, `rgba(${hue}, 0.02)`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx - 6, 0);
        ctx.lineTo(cx + 6, 0);
        ctx.lineTo(cx + w * 0.16, h);
        ctx.lineTo(cx - w * 0.16, h);
        ctx.closePath();
        ctx.fill();
      }

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
      t += 16;
      if (!reduce) raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    if (reduce) {
      draw();
    } else {
      raf = requestAnimationFrame(draw);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

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
