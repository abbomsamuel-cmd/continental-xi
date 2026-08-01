"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { seededRng, shuffle, hashString } from "@/lib/rng";
import { play } from "@/lib/sound";
import { Flag } from "@/components/Flag";
import { Sparks } from "@/components/fx/Atmosphere";

/**
 * International draft spinners — the EURO glides horizontally through Europe,
 * the Copa rolls vertically through South America. Flags and abbreviations
 * only while moving; the country's full name is the reveal.
 */

const SPIN_MS = 3000;
const REVEAL_MS = 2300;
const TARGET = 30; // index of the drawn nation in the strip
const STRIP_LEN = TARGET + 8;
const EASE_SPIN = [0.1, 0.75, 0.12, 1] as const;

interface Entry { name: string; colors: [string, string] }

interface Props {
  club: string;        // "Spain 2012"
  seasonLabel: string; // "2012"
  colors: [string, string];
  reel: Entry[];
  onDone: () => void;
}

const nationOf = (name: string) => name.replace(/\s*\d{4}$/, "").trim();
const abbrOf = (name: string) => {
  const w = nationOf(name).split(/\s+/);
  return (w.length === 1 ? w[0].slice(0, 3) : w.map((x) => x[0]).join("").slice(0, 3)).toUpperCase();
};

function FlagGlyph({ name, size }: { name: string; size: number }) {
  return <Flag nationality={nationOf(name)} width={size * 1.4} />;
}

/** Build the strip: shuffled nations, drawn one at TARGET, no dupes beside it. */
function useStrip(club: string, seasonLabel: string, colors: [string, string], reel: Entry[]) {
  return useMemo(() => {
    const rng = seededRng(`strip-${club}-${seasonLabel}`);
    const looped: Entry[] = [];
    while (looped.length < STRIP_LEN) looped.push(...shuffle(rng, [...reel]));
    const strip = looped.slice(0, STRIP_LEN);
    strip[TARGET] = { name: club, colors };
    for (let i = 0; i < strip.length; i++) {
      if (i !== TARGET && nationOf(strip[i].name) === nationOf(club)) {
        strip[i] = reel[(hashString(club) + i * 7) % reel.length];
      }
    }
    return strip;
  }, [club, seasonLabel, colors, reel]);
}

/** Decelerating tick track + the final stop beats, shared by both spinners. */
function useSpinSounds(onDone: () => void) {
  const done = useRef(false);
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let t = 100;
    let gap = 50;
    while (t < SPIN_MS - 150) {
      timers.push(setTimeout(() => play("click"), t));
      t += gap;
      gap *= 1.15;
    }
    timers.push(setTimeout(() => play("flip"), SPIN_MS));         // the stop impact
    timers.push(setTimeout(() => play("win"), SPIN_MS + 500));     // name reveal
    timers.push(setTimeout(() => {
      if (!done.current) { done.current = true; play("select"); onDone(); }
    }, SPIN_MS + REVEAL_MS));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/* ------------------------------------------------------------------ */
/*  The staged reveal both competitions share: impact → flag grows →   */
/*  country name → season. Palette-driven so each comp keeps its skin. */
/* ------------------------------------------------------------------ */
function Reveal({ club, seasonLabel, accent, compLine }: {
  club: string; seasonLabel: string; accent: string; compLine: string;
}) {
  return (
    <motion.div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}
    >
      {/* impact rings */}
      {[0, 1].map((r) => (
        <motion.span
          key={r}
          className="absolute rounded-full"
          style={{ width: 110, height: 110, border: `1.5px solid ${accent}` }}
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{ scale: 2.6 + r, opacity: 0 }}
          transition={{ duration: 0.9, delay: r * 0.12, ease: "easeOut" }}
        />
      ))}
      <motion.div
        initial={{ scale: 0.45, y: 0 }}
        animate={{ scale: [0.45, 1.18, 1] }}
        transition={{ duration: 0.55, times: [0, 0.7, 1], ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 10px 34px ${accent}66)` }}
      >
        <FlagGlyph name={club} size={74} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-3 font-display text-3xl font-extrabold uppercase tracking-wide text-white sm:text-4xl"
      >
        {nationOf(club)}
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85, duration: 0.5 }}
        className="mt-1 text-[0.7rem] font-bold uppercase tracking-[0.4em]"
        style={{ color: accent }}
      >
        {compLine} {seasonLabel}
      </motion.div>
    </motion.div>
  );
}

/* ================================================================== */
/*  UEFA EURO — bright, clean, silver-blue infinite horizontal glide   */
/* ================================================================== */
const EURO_TILE = 92; // px incl. gap

export function EuroSpinner({ club, seasonLabel, colors, reel, onDone }: Props) {
  const strip = useStrip(club, seasonLabel, colors, reel);
  const [phase, setPhase] = useState<"spin" | "reveal">("spin");
  useSpinSounds(onDone);
  useEffect(() => {
    const id = setTimeout(() => setPhase("reveal"), SPIN_MS + 60);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-3 text-center">
        <p className="cl-heading text-[0.62rem] tracking-[0.4em] text-[#ff3b57]">Crossing Europe</p>
      </div>

      <div
        className="relative h-44 overflow-hidden rounded-3xl"
        style={{
          background: "linear-gradient(170deg, rgba(219,230,255,0.10), rgba(27,79,255,0.10) 55%, rgba(6,16,50,0.5))",
          border: "1px solid rgba(219,230,255,0.4)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 18px 50px rgba(0,0,0,0.4), 0 0 40px rgba(55,224,255,0.12)",
        }}
      >
        {/* clean silver centre frame */}
        <AnimatePresence>
          {phase === "spin" && (
            <motion.div key="frame" exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-20">
              <motion.div
                className="absolute left-1/2 top-1/2 h-[104px] w-[84px] -translate-x-1/2 -translate-y-1/2 rounded-2xl"
                style={{ border: "1.5px solid rgba(219,230,255,0.85)", boxShadow: "0 0 26px rgba(55,224,255,0.4)" }}
                animate={{ scale: [1, 1, 1.1, 1] }}
                transition={{ duration: SPIN_MS / 1000 + 0.15, times: [0, 0.93, 0.97, 1] }}
              />
              <div className="absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-[#081233] to-transparent" />
              <div className="absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-[#081233] to-transparent" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* the glide — flags only, motion-blurred while fast */}
        {phase === "spin" && (
          <motion.div
            className="absolute top-1/2 flex items-center"
            style={{ left: `calc(50% - ${EURO_TILE / 2}px)`, gap: 14 }}
            initial={{ x: 0, y: "-50%" }}
            animate={{
              x: -(TARGET * EURO_TILE),
              y: "-50%",
              filter: ["blur(0px)", "blur(5px)", "blur(2px)", "blur(0px)"],
            }}
            transition={{
              x: { duration: SPIN_MS / 1000, ease: EASE_SPIN },
              filter: { duration: SPIN_MS / 1000, times: [0, 0.18, 0.7, 1] },
            }}
          >
            {strip.map((it, i) => (
              <div
                key={i}
                className="flex h-[96px] flex-col items-center justify-center gap-1.5 rounded-2xl"
                style={{
                  width: EURO_TILE - 14,
                  background: "linear-gradient(165deg, rgba(255,255,255,0.10), rgba(140,180,255,0.05))",
                  border: "1px solid rgba(219,230,255,0.22)",
                }}
              >
                <FlagGlyph name={it.name} size={34} />
                <span className="text-[0.62rem] font-extrabold tracking-[0.2em] text-white/75">{abbrOf(it.name)}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* the reveal */}
        <AnimatePresence>
          {phase === "reveal" && (
            <Reveal club={club} seasonLabel={seasonLabel} accent="#ff3b57" compLine="EURO" />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Copa América — gold & green vertical drum, vibrant and loud        */
/* ================================================================== */
const COPA_TILE = 84; // px incl. gap, vertical

export function CopaSpinner({ club, seasonLabel, colors, reel, onDone }: Props) {
  const strip = useStrip(club, seasonLabel, colors, reel);
  const [phase, setPhase] = useState<"spin" | "reveal">("spin");
  useSpinSounds(onDone);
  useEffect(() => {
    const id = setTimeout(() => setPhase("reveal"), SPIN_MS + 60);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-3 text-center">
        <p className="cl-heading text-[0.62rem] tracking-[0.4em] text-[#00e676]">🥁 Rolling Through the Américas</p>
      </div>

      <div
        className="relative mx-auto h-[300px] max-w-[300px] overflow-hidden rounded-3xl"
        style={{
          background: "linear-gradient(180deg, rgba(0,230,118,0.14), rgba(6,37,26,0.75) 55%, rgba(14,165,233,0.10))",
          border: "2px solid rgba(255,215,0,0.55)",
          boxShadow: "inset 0 0 40px rgba(0,230,118,0.15), 0 18px 50px rgba(0,0,0,0.5), 0 0 44px rgba(255,215,0,0.18)",
        }}
      >
        <Sparks count={8} color="#00e676" />

        {/* golden side pointers + centre band */}
        <AnimatePresence>
          {phase === "spin" && (
            <motion.div key="frame" exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-20">
              <motion.div
                className="absolute inset-x-3 top-1/2 h-[86px] -translate-y-1/2 rounded-2xl"
                style={{ border: "2px solid rgba(255,215,0,0.9)", boxShadow: "0 0 30px rgba(255,215,0,0.4), inset 0 0 24px rgba(255,215,0,0.12)" }}
                animate={{ scale: [1, 1, 1.08, 1] }}
                transition={{ duration: SPIN_MS / 1000 + 0.15, times: [0, 0.93, 0.97, 1] }}
              />
              <div className="absolute left-1 top-1/2 -translate-y-1/2 border-y-[10px] border-l-[14px] border-y-transparent" style={{ borderLeftColor: "#ffd700" }} />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 border-y-[10px] border-r-[14px] border-y-transparent" style={{ borderRightColor: "#ffd700" }} />
              <div className="absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-[#04140c] to-transparent" />
              <div className="absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-[#04140c] to-transparent" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* the vertical drum */}
        {phase === "spin" && (
          <motion.div
            className="absolute left-1/2 flex flex-col items-center"
            style={{ top: `calc(50% - ${COPA_TILE / 2}px)`, gap: 12 }}
            initial={{ y: 0, x: "-50%" }}
            animate={{
              y: -(TARGET * COPA_TILE),
              x: "-50%",
              filter: ["blur(0px)", "blur(5px)", "blur(2px)", "blur(0px)"],
            }}
            transition={{
              y: { duration: SPIN_MS / 1000, ease: EASE_SPIN },
              filter: { duration: SPIN_MS / 1000, times: [0, 0.18, 0.7, 1] },
            }}
          >
            {strip.map((it, i) => (
              <div
                key={i}
                className="flex w-[210px] items-center justify-between gap-3 rounded-2xl px-4"
                style={{
                  height: COPA_TILE - 12,
                  background: `linear-gradient(120deg, ${it.colors[0]}30, rgba(6,37,26,0.5))`,
                  border: "1px solid rgba(255,201,60,0.25)",
                }}
              >
                <FlagGlyph name={it.name} size={30} />
                <span className="font-display text-lg font-extrabold tracking-[0.25em] text-white/85">{abbrOf(it.name)}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* the reveal */}
        <AnimatePresence>
          {phase === "reveal" && (
            <Reveal club={club} seasonLabel={seasonLabel} accent="#00e676" compLine="COPA AMÉRICA" />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
