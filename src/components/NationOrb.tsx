"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { seededRng, shuffle } from "@/lib/rng";
import { play } from "@/lib/sound";
import { TeamBadge } from "@/components/TeamBadge";

const ORBIT_COUNT = 10;
const SPIN_MS = 3400;
const APPLE = [0.22, 1, 0.36, 1] as const; // premium deceleration

interface Props {
  club: string;
  seasonLabel: string;
  colors: [string, string];
  reel: { name: string; colors: [string, string] }[];
  onDone: () => void;
}

function short(name: string): string {
  const w = name.replace(/\d{4}/g, "").trim().split(/\s+/);
  return (w.length === 1 ? w[0].slice(0, 3) : w.map((x) => x[0]).join("").slice(0, 3)).toUpperCase();
}

/** EURO Nation Selector Orb — a glass sphere above a metallic platform.
 *  Nations orbit inside it, decelerate, and the chosen one locks into the
 *  centre with a holographic ripple. Minimal, silver, expensive. */
export function NationOrb({ club, seasonLabel, colors, reel, onDone }: Props) {
  const done = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    play("select");
    onDone();
  };

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let t = 160;
    let gap = 120;
    while (t < SPIN_MS - 400) {
      timers.push(setTimeout(() => play("hover"), t));
      t += gap;
      gap *= 1.22;
    }
    timers.push(setTimeout(() => play("win"), SPIN_MS - 150));
    const end = setTimeout(finish, SPIN_MS + 900);
    return () => { timers.forEach(clearTimeout); clearTimeout(end); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orbiters = useMemo(() => {
    const rng = seededRng(`orb-${club}-${seasonLabel}`);
    const pool = shuffle(rng, [...reel]).filter((r) => r.name !== club);
    const items: { name: string; colors: [string, string] }[] = [];
    while (items.length < ORBIT_COUNT) items.push(...pool);
    return items.slice(0, ORBIT_COUNT);
  }, [club, seasonLabel, reel]);

  const spinTurns = 900; // degrees the constellation travels before settling

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="mb-2 text-center">
        <p className="cl-heading text-[0.62rem] tracking-[0.4em] text-[#37e0ff]">Nation Selector</p>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-[360px]">
        {/* aurora wash behind the orb */}
        <div className="aurora absolute inset-[-10%] rounded-full opacity-50"
          style={{ background: "radial-gradient(circle, rgba(27,79,255,0.35), transparent 65%)" }} />

        {/* hex lattice inside the sphere's bounds */}
        <div className="absolute inset-[7%] overflow-hidden rounded-full opacity-25" aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(rgba(140,190,255,0.7) 1.2px, transparent 1.3px)",
            backgroundSize: "26px 22px",
            maskImage: "radial-gradient(circle, #000 55%, transparent 72%)",
            WebkitMaskImage: "radial-gradient(circle, #000 55%, transparent 72%)",
          }} />

        {/* the glass sphere */}
        <div className="absolute inset-[7%] rounded-full"
          style={{
            background:
              "radial-gradient(85% 85% at 32% 24%, rgba(255,255,255,0.18), rgba(120,170,255,0.06) 42%, rgba(6,16,50,0.35) 100%)",
            border: "1.5px solid rgba(190,215,255,0.4)",
            boxShadow: "inset 0 0 60px rgba(90,140,255,0.25), 0 24px 70px rgba(0,0,0,0.55), 0 0 44px rgba(55,224,255,0.22)",
            backdropFilter: "blur(2px)",
          }} />
        {/* crystal highlight */}
        <div className="absolute left-[24%] top-[14%] h-[16%] w-[26%] rounded-full opacity-60"
          style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.55), transparent)", filter: "blur(4px)" }} />

        {/* orbiting nations — the constellation decelerates to a stop */}
        <motion.div
          className="absolute inset-0"
          initial={{ rotate: 0 }}
          animate={{ rotate: spinTurns }}
          transition={{ duration: SPIN_MS / 1000, ease: APPLE }}
        >
          {orbiters.map((o, i) => {
            const a = (i / ORBIT_COUNT) * Math.PI * 2;
            return (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2"
                style={{ x: `${Math.cos(a) * 118}px`, y: `${Math.sin(a) * 118}px`, translateX: "-50%", translateY: "-50%" }}
                initial={{ rotate: 0, opacity: 0.9 }}
                animate={{ rotate: -spinTurns, opacity: [0.9, 0.9, 0.25] }}
                transition={{
                  rotate: { duration: SPIN_MS / 1000, ease: APPLE },
                  opacity: { duration: SPIN_MS / 1000, times: [0, 0.8, 1] },
                }}
              >
                <TeamBadge colors={o.colors} code={short(o.name)} size={34} />
              </motion.div>
            );
          })}
        </motion.div>

        {/* holographic lock-in of the chosen nation */}
        <div className="absolute inset-0 grid place-items-center">
          {[0, 1, 2].map((r) => (
            <motion.span
              key={r}
              className="absolute rounded-full"
              style={{ width: 90, height: 90, border: "1px solid rgba(55,224,255,0.55)" }}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.4, 2.4], opacity: [0, 0.7, 0] }}
              transition={{ delay: (SPIN_MS - 250) / 1000 + r * 0.18, duration: 1.1, ease: "easeOut" }}
            />
          ))}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: (SPIN_MS - 300) / 1000, type: "spring", stiffness: 190, damping: 15 }}
            className="relative"
            style={{ filter: "drop-shadow(0 0 26px rgba(55,224,255,0.6))" }}
          >
            <TeamBadge colors={colors} code={short(club)} size={72} />
          </motion.div>
        </div>

        {/* metallic platform */}
        <div className="absolute inset-x-[16%] bottom-[1%] h-[7%] rounded-[50%]"
          style={{
            background: "linear-gradient(180deg, rgba(219,230,255,0.5), rgba(90,110,160,0.25) 55%, rgba(10,20,50,0.1))",
            boxShadow: "0 10px 34px rgba(55,224,255,0.25)",
            filter: "blur(0.4px)",
          }} />
      </div>

      {/* the reveal plate */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: (SPIN_MS - 150) / 1000, duration: 0.5, ease: APPLE }}
        className="mx-auto mt-3 w-fit rounded-xl px-6 py-2 text-center"
        style={{
          background: "linear-gradient(140deg, rgba(219,230,255,0.14), rgba(27,79,255,0.10))",
          border: "1px solid rgba(219,230,255,0.45)",
          boxShadow: "0 0 26px rgba(55,224,255,0.25)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="font-display text-lg font-extrabold text-white">{club}</div>
        <div className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-[#8fb8ff]">Nation locked in</div>
      </motion.div>
    </div>
  );
}
