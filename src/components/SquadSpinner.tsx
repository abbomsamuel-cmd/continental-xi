"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { CLUB_REGISTRY } from "@/lib/data/clubs";
import { seededRng, shuffle, hashString } from "@/lib/rng";
import { play } from "@/lib/sound";

const ITEM_W = 168; // px, incl. gap
const TARGET_INDEX = 26; // where the winning club sits in the reel

interface Props {
  club: string;
  seasonLabel: string;
  colors: [string, string];
  onDone: () => void;
}

/** Slot-machine reel that scrolls through clubs and lands on the drafted squad. */
export function SquadSpinner({ club, seasonLabel, colors, onDone }: Props) {
  // Fire onDone exactly once — via the animation callback, with a timeout as a
  // guaranteed fallback so the reveal can never get stuck.
  const done = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    play("select");
    onDone();
  };
  useEffect(() => {
    const t = setTimeout(finish, 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deterministic reel (seeded by the target) so render stays pure.
  const reel = useMemo(() => {
    const rng = seededRng(`${club}-${seasonLabel}`);
    const fillers = shuffle(rng, CLUB_REGISTRY).slice(0, TARGET_INDEX + 8);
    const items = fillers.map((c) => ({ name: c.name, colors: c.colors, season: "" }));
    items[TARGET_INDEX] = { name: club, colors, season: seasonLabel };
    // avoid the exact target name appearing right before it
    for (let i = 0; i < items.length; i++) {
      if (i !== TARGET_INDEX && items[i].name === club) {
        items[i] = { name: CLUB_REGISTRY[(hashString(club) + i) % CLUB_REGISTRY.length].name, colors: items[i].colors, season: "" };
      }
    }
    return items;
  }, [club, seasonLabel, colors]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.3em] text-cyan">
        Drawing your squad…
      </p>
      <div className="relative h-28 overflow-hidden rounded-2xl glass">
        {/* center pointer */}
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-full w-[2px] -translate-x-1/2 bg-gold shadow-[0_0_14px_2px_rgba(212,175,55,0.6)]" />
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-gold" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 z-20 -translate-x-1/2 border-x-8 border-b-8 border-x-transparent border-b-gold" />
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#050e22] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#050e22] to-transparent" />

        <motion.div
          className="absolute top-1/2 flex"
          style={{ left: `calc(50% - ${ITEM_W / 2}px)`, gap: 8 }}
          initial={{ x: 0, y: "-50%" }}
          animate={{ x: -(TARGET_INDEX * ITEM_W), y: "-50%" }}
          transition={{ duration: 2.6, ease: [0.09, 0.72, 0.13, 1] }}
          onAnimationComplete={finish}
        >
          {reel.map((it, i) => (
            <div
              key={i}
              className="flex h-20 flex-col items-center justify-center rounded-xl p-2 text-center"
              style={{ width: ITEM_W - 8, background: `linear-gradient(150deg, ${it.colors[0]}22, ${it.colors[1]}18)`, border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="h-6 w-6 rounded-md" style={{ background: `linear-gradient(150deg, ${it.colors[0]}, ${it.colors[1]})` }} />
              <span className="mt-1 line-clamp-1 text-[0.72rem] font-bold text-white">{it.name}</span>
              {it.season && <span className="text-[0.6rem] text-cyan">{it.season}</span>}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
