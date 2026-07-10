"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { seededRng, shuffle } from "@/lib/rng";
import { play } from "@/lib/sound";
import { Confetti, Sparks } from "@/components/fx/Atmosphere";

const SEGMENTS = 16;
const SPIN_MS = 3600;
const TURNS = 4; // full revolutions before settling

interface Props {
  club: string;        // the drawn nation, e.g. "Brazil 2007"
  seasonLabel: string;
  colors: [string, string];
  reel: { name: string; colors: [string, string] }[];
  onDone: () => void;
}

/** Big circular Carnival Draft Wheel — the Copa América draw. A painted
 *  roulette of selecciones spins under a golden pointer, confetti flying. */
export function CarnivalWheel({ club, seasonLabel, colors, reel, onDone }: Props) {
  const done = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    play("goal");
    onDone();
  };

  useEffect(() => {
    // drum-roll ticks that decelerate with the wheel
    const timers: ReturnType<typeof setTimeout>[] = [];
    let t = 100;
    let gap = 46;
    while (t < SPIN_MS - 200) {
      timers.push(setTimeout(() => play("click"), t));
      t += gap;
      gap *= 1.14;
    }
    const end = setTimeout(finish, SPIN_MS + 700);
    return () => { timers.forEach(clearTimeout); clearTimeout(end); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const TARGET = 4; // segment index that ends up under the pointer
  const segments = useMemo(() => {
    const rng = seededRng(`wheel-${club}-${seasonLabel}`);
    const pool = shuffle(rng, [...reel]);
    const items: { name: string; colors: [string, string] }[] = [];
    while (items.length < SEGMENTS) items.push(...pool);
    const segs = items.slice(0, SEGMENTS).map((s) => ({ ...s, target: false }));
    segs[TARGET] = { name: club, colors, target: true };
    // no accidental duplicate of the drawn nation elsewhere on the wheel
    for (let i = 0; i < segs.length; i++) {
      if (i !== TARGET && segs[i].name === club) segs[i] = { ...pool[(i * 3) % pool.length], target: false };
    }
    return segs;
  }, [club, seasonLabel, colors, reel]);

  const segAngle = 360 / SEGMENTS;
  // rotate so the TARGET segment's centre lands under the top pointer
  const finalRotation = TURNS * 360 - (TARGET * segAngle + segAngle / 2);

  // SVG wedge path for one segment
  const wedge = (i: number) => {
    const r = 100;
    const a0 = ((i * segAngle - 90) * Math.PI) / 180;
    const a1 = (((i + 1) * segAngle - 90) * Math.PI) / 180;
    return `M 0 0 L ${r * Math.cos(a0)} ${r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)} Z`;
  };
  const short = (name: string) => {
    const w = name.replace(/\d{4}/g, "").trim().split(/\s+/);
    return (w.length === 1 ? w[0].slice(0, 3) : w.map((x) => x[0]).join("").slice(0, 3)).toUpperCase();
  };

  return (
    <div className="relative mx-auto w-full max-w-md">
      <Confetti count={60} colors={["#ffc93c", "#ff8a3d", "#17c97a", "#ffffff", "#ff5a6a"]} />
      <div className="mb-2 text-center">
        <p className="cl-heading text-[0.62rem] tracking-[0.35em] text-[#ffc93c]">🥁 The Carnival Draw</p>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-[380px]">
        {/* festival glow behind the wheel */}
        <div className="absolute inset-[-8%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,201,60,0.28), rgba(23,201,122,0.12) 55%, transparent 72%)", filter: "blur(6px)" }} />
        <Sparks count={10} color="#ffc93c" />

        {/* the pointer */}
        <div className="absolute left-1/2 top-[-14px] z-20 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 3, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
            className="border-x-[16px] border-t-[26px] border-x-transparent"
            style={{ borderTopColor: "#ffc93c", filter: "drop-shadow(0 4px 10px rgba(255,201,60,0.7))" }}
          />
        </div>

        {/* spinning wheel */}
        <motion.svg
          viewBox="-104 -104 208 208"
          className="absolute inset-0 h-full w-full"
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, finalRotation + 9, finalRotation] }}
          transition={{
            duration: SPIN_MS / 1000,
            times: [0, 0.86, 1],
            ease: [[0.12, 0.6, 0.18, 1], "easeOut"],
          }}
          style={{ filter: "drop-shadow(0 14px 40px rgba(0,0,0,0.6))" }}
        >
          {/* painted rim */}
          <circle r="103" fill="#06251a" />
          <circle r="103" fill="none" stroke="#ffc93c" strokeWidth="2.5" />
          <circle r="98" fill="none" stroke="rgba(255,138,61,0.6)" strokeWidth="1" strokeDasharray="2 5" />
          {segments.map((s, i) => (
            <g key={i}>
              <path d={wedge(i)} fill={`${s.colors[0]}`} opacity={s.target ? 1 : 0.62} stroke="#06251a" strokeWidth="1.4" />
              {/* inner tint from the second colour */}
              <path d={wedge(i)} fill={s.colors[1]} opacity={s.target ? 0.35 : 0.22}
                transform="scale(0.55)" />
              <text
                transform={`rotate(${i * segAngle + segAngle / 2}) translate(0 -76)`}
                textAnchor="middle"
                fontSize="11"
                fontWeight="900"
                fill={s.target ? "#fff" : "rgba(255,255,255,0.85)"}
                style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.55)", strokeWidth: 2.5 }}
              >
                {short(s.name)}
              </text>
            </g>
          ))}
          {/* hub */}
          <circle r="26" fill="#06251a" stroke="#ffc93c" strokeWidth="2" />
          <text textAnchor="middle" dy="7" fontSize="20">⚽</text>
        </motion.svg>

        {/* rotating light trail while spinning */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ background: "conic-gradient(from 0deg, transparent 0 84%, rgba(255,201,60,0.35) 92%, transparent 100%)" }}
          initial={{ rotate: 0, opacity: 1 }}
          animate={{ rotate: 720, opacity: [1, 1, 0] }}
          transition={{ duration: SPIN_MS / 1000, ease: "easeOut" }}
        />
      </div>

      {/* the landing banner */}
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: (SPIN_MS - 300) / 1000, type: "spring", stiffness: 220, damping: 15 }}
        className="mx-auto mt-4 w-fit rounded-2xl px-6 py-2.5 text-center"
        style={{
          background: `linear-gradient(140deg, ${colors[0]}, ${colors[1]})`,
          border: "2px solid rgba(255,201,60,0.8)",
          boxShadow: "0 0 30px rgba(255,201,60,0.4)",
        }}
      >
        <div className="font-display text-lg font-extrabold text-white drop-shadow">{club}</div>
        <div className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-[#fff2c9]">¡La selección elegida!</div>
      </motion.div>
    </div>
  );
}
