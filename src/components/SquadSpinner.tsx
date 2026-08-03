"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { CLUB_REGISTRY } from "@/lib/data/clubs";
import { seededRng, shuffle, hashString } from "@/lib/rng";
import { play } from "@/lib/sound";
import { useFxLevel } from "@/lib/fx";
import { TeamBadge } from "@/components/TeamBadge";
import { CrestLogo } from "@/components/CrestLogo";

const ITEM_W = 150; // px, incl. gap
const SPIN_MS = 3400;

interface Props {
  club: string;
  seasonLabel: string;
  colors: [string, string];
  /** custom filler entries (e.g. national squads) — defaults to the club registry */
  reel?: { name: string; colors: [string, string] }[];
  onDone: () => void;
}

function shortCode(name: string): string {
  const words = name.split(/\s+/).filter((w) => !["FC", "CF", "de", "La"].includes(w));
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}

/**
 * Slot-machine reel that scrolls through clubs and lands on the drafted squad.
 *
 * Phones get a deliberately cheaper reel. The expensive version animated a CSS
 * `filter: blur()` across the whole strip, which forces a full repaint of every
 * item on every frame — with 42 items each drawing a gradient-filled crest SVG,
 * that's what made it stutter. Under reduced fx the blur, the blurred floodlight
 * sweep and the 3D tilt are all dropped, the reel is less than half as long, and
 * only `transform` animates, which the compositor can handle on its own.
 */
export function SquadSpinner({ club, seasonLabel, colors, reel: reelPool, onDone }: Props) {
  const fx = useFxLevel();
  const lite = fx !== "full";
  // fewer items on a phone: each one is a crest SVG with its own gradients
  const targetIndex = lite ? 14 : 32;

  const done = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    play("select");
    onDone();
  };

  useEffect(() => {
    // decelerating tick sounds synced to the reel easing
    const timers: ReturnType<typeof setTimeout>[] = [];
    let t = 120;
    let gap = 55;
    while (t < SPIN_MS - 120) {
      timers.push(setTimeout(() => play("click"), t));
      t += gap;
      gap *= 1.16; // slow down
    }
    timers.push(setTimeout(() => play("flip"), SPIN_MS - 60)); // the stop impact
    const end = setTimeout(finish, SPIN_MS + 420);
    return () => { timers.forEach(clearTimeout); clearTimeout(end); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reel = useMemo(() => {
    const rng = seededRng(`${club}-${seasonLabel}`);
    const source = reelPool && reelPool.length ? reelPool : CLUB_REGISTRY;
    // repeat the source so short pools (e.g. 16 nations) still fill the reel
    const looped: { name: string; colors: [string, string] }[] = [];
    while (looped.length < targetIndex + 8) looped.push(...source.map((c) => ({ name: c.name, colors: c.colors })));
    const fillers = shuffle(rng, looped).slice(0, targetIndex + 8);
    const items = fillers.map((c) => ({ name: c.name, colors: c.colors, code: shortCode(c.name), season: "" }));
    items[targetIndex] = { name: club, colors, code: shortCode(club), season: seasonLabel };
    for (let i = 0; i < items.length; i++) {
      if (i !== targetIndex && items[i].name === club) {
        const alt = source[(hashString(club) + i) % source.length];
        items[i] = { name: alt.name, colors: alt.colors, code: shortCode(alt.name), season: "" };
      }
    }
    return items;
  }, [club, seasonLabel, colors, reelPool, targetIndex]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-3 flex flex-col items-center">
        <CrestLogo size={34} />
        <p className="mt-1 cl-heading text-[0.62rem] tracking-[0.35em] text-cyan">Drawing Your Squad</p>
      </div>

      <div
        className="cl-panel cl-streaks relative h-44 overflow-hidden rounded-2xl"
        style={lite ? undefined : { perspective: "760px", perspectiveOrigin: "50% 50%" }}
      >
        {/* the drum's curve — a plain gradient, cheap on every device */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[15]"
          style={{ background: "linear-gradient(180deg, rgba(2,6,16,0.92) 0%, rgba(2,6,16,0.35) 18%, transparent 42%, transparent 58%, rgba(2,6,16,0.35) 82%, rgba(2,6,16,0.92) 100%)" }} />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[16] h-1/2"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.10), transparent)" }} />

        {/* floodlight sweep — a blurred layer animating across, so full fx only */}
        {!lite && (
          <motion.div aria-hidden className="pointer-events-none absolute -inset-y-8 z-[17] w-40 blur-2xl"
            style={{ background: "linear-gradient(90deg, transparent, rgba(190,225,255,0.30), transparent)" }}
            initial={{ x: "-40%" }}
            animate={{ x: ["-40%", "760%"] }}
            transition={{ duration: SPIN_MS / 1000, ease: "easeOut" }} />
        )}

        {/* centre spotlight frame — kicks on the stop */}
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-32 w-[136px] -translate-x-1/2 -translate-y-1/2 rounded-2xl"
          style={{ boxShadow: "0 0 0 2px rgba(212,175,55,0.9), 0 0 34px 6px rgba(212,175,55,0.35)" }}
          animate={{ scale: [1, 1, 1.1, 1] }}
          transition={{ duration: SPIN_MS / 1000 + 0.2, times: [0, 0.92, 0.96, 1] }}
        />
        {/* stop flash */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10"
          style={{ background: "radial-gradient(40% 80% at 50% 50%, rgba(242,212,114,0.35), transparent 70%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1, 0] }}
          transition={{ duration: SPIN_MS / 1000 + 0.35, times: [0, 0.92, 0.95, 1] }}
        />
        <div className="pointer-events-none absolute left-1/2 top-1 z-20 -translate-x-1/2 border-x-8 border-t-[10px] border-x-transparent border-t-gold" />
        <div className="pointer-events-none absolute bottom-1 left-1/2 z-20 -translate-x-1/2 border-x-8 border-b-[10px] border-x-transparent border-b-gold" />
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-gradient-to-r from-[#071343] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-gradient-to-l from-[#071343] to-transparent" />

        <motion.div
          className="absolute top-1/2 flex items-stretch"
          style={{
            left: `calc(50% - ${ITEM_W / 2}px)`,
            gap: 10,
            willChange: "transform",
            ...(lite ? {} : { transformStyle: "preserve-3d" as const }),
          }}
          initial={lite ? { x: 0, y: "-50%" } : { x: 0, y: "-50%", rotateX: 9 }}
          animate={
            lite
              // transform only: no filter, so the compositor can run this
              // without repainting the strip every frame
              ? { x: -(targetIndex * ITEM_W), y: "-50%" }
              : {
                  x: -(targetIndex * ITEM_W),
                  y: "-50%",
                  rotateX: 9,
                  filter: ["blur(0px)", "blur(4px)", "blur(1.5px)", "blur(0px)"],
                }
          }
          transition={{
            x: { duration: SPIN_MS / 1000, ease: [0.08, 0.72, 0.1, 1] },
            filter: { duration: SPIN_MS / 1000, times: [0, 0.18, 0.72, 1] },
          }}
        >
          {reel.map((it, i) => {
            const isTarget = i === targetIndex;
            // depth falloff from the centre stop: neighbours sit back, far
            // items sit further back. Opacity is compositor-cheap so every
            // device gets it; blur is a repaint, so full fx only.
            const dist = Math.abs(i - targetIndex);
            const fade = Math.max(0.34, 1 - dist * 0.26);
            const soften = !lite && dist > 0 ? `blur(${Math.min(2, dist * 0.7)}px)` : undefined;
            return (
              <motion.div
                key={i}
                className="flex h-28 flex-col items-center justify-center gap-1.5 rounded-xl p-2 text-center"
                style={{
                  width: ITEM_W - 10,
                  background: isTarget
                    ? `linear-gradient(160deg, ${it.colors[0]}, ${it.colors[1]})`
                    : `linear-gradient(160deg, ${it.colors[0]}22, ${it.colors[1]}18)`,
                  border: `1px solid ${isTarget ? "rgba(212,175,55,0.8)" : "rgba(255,255,255,0.10)"}`,
                  opacity: isTarget ? 1 : fade,
                  filter: soften,
                  transform: isTarget ? undefined : `scale(${Math.max(0.86, 1 - dist * 0.045)})`,
                }}
                animate={isTarget ? { scale: [1, 1, 1.12, 1.06] } : undefined}
                transition={isTarget ? { duration: SPIN_MS / 1000 + 0.35, times: [0, 0.92, 0.96, 1] } : undefined}
              >
                {/* on a phone only the winner draws a full crest — the fillers
                    blur past at speed, so a two-tone disc is indistinguishable
                    and saves ~20 gradient-filled SVGs */}
                {lite && !isTarget ? (
                  <span aria-hidden className="grid h-10 w-10 place-items-center rounded-full text-[0.6rem] font-black text-white/90"
                    style={{ background: `linear-gradient(150deg, ${it.colors[0]}, ${it.colors[1]})` }}>
                    {it.code}
                  </span>
                ) : (
                  <TeamBadge colors={it.colors} code={it.code} size={40} />
                )}
                <span className={`line-clamp-2 text-[0.68rem] font-bold leading-tight ${isTarget ? "text-white" : "text-white/85"}`}>{it.name}</span>
                {it.season && <span className="text-[0.6rem] font-semibold text-gold">{it.season}</span>}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
