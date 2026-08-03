"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { seededRng, shuffle, hashString } from "@/lib/rng";
import { play } from "@/lib/sound";
import { useFxLevel } from "@/lib/fx";
import { Flag } from "@/components/Flag";
import { Sparks } from "@/components/fx/Atmosphere";
import {
  PodiumStage, StageHud, Plinth, podiumPose, finishFor,
  ITEM_W, PLINTH_W, PLINTH_GAP,
} from "@/components/spinner/PodiumStage";

/**
 * International draft spinners — the same podium presentation the club draw
 * uses, in each competition's colours. A rank of plinths slides across the
 * stage, decelerates, and the drawn nation rises centre stage onto gold while
 * its neighbours settle back onto silver and bronze.
 *
 * Flags and three-letter codes while the rank is moving; the country's full
 * name is the reveal, banner-style above the podium.
 */

const SPIN_MS = 3000;
const REVEAL_MS = 2300;
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

/** Build the rank: shuffled nations, drawn one at `target`, no dupes beside it. */
function useStrip(club: string, seasonLabel: string, colors: [string, string], reel: Entry[], target: number) {
  return useMemo(() => {
    const rng = seededRng(`strip-${club}-${seasonLabel}`);
    const len = target + 8;
    const looped: Entry[] = [];
    while (looped.length < len) looped.push(...shuffle(rng, [...reel]));
    const strip = looped.slice(0, len);
    strip[target] = { name: club, colors };
    for (let i = 0; i < strip.length; i++) {
      if (i !== target && nationOf(strip[i].name) === nationOf(club)) {
        strip[i] = reel[(hashString(club) + i * 7) % reel.length];
      }
    }
    return strip;
  }, [club, seasonLabel, colors, reel, target]);
}

/** Decelerating tick track + the stop beats, shared by both competitions. */
function useSpinSounds(onDone: () => void, onSettle: () => void) {
  useEffect(() => {
    let done = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let t = 100;
    let gap = 50;
    while (t < SPIN_MS - 150) {
      timers.push(setTimeout(() => play("click"), t));
      t += gap;
      gap *= 1.15;
    }
    timers.push(setTimeout(() => play("flip"), SPIN_MS));          // the stop impact
    timers.push(setTimeout(onSettle, SPIN_MS));                    // podium rises
    timers.push(setTimeout(() => play("win"), SPIN_MS + 500));     // name reveal
    timers.push(setTimeout(() => {
      if (done) return;
      done = true;
      play("select");
      onDone();
    }, SPIN_MS + REVEAL_MS));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/* ------------------------------------------------------------------ */
/*  The presentation both competitions share, palette-driven           */
/* ------------------------------------------------------------------ */

function NationPodium({
  club, seasonLabel, colors, reel, onDone, accent, kicker, compLine, sparks,
}: Props & { accent: string; kicker: string; compLine: string; sparks?: boolean }) {
  const fx = useFxLevel();
  const lite = fx !== "full";
  const target = lite ? 14 : 30;
  const strip = useStrip(club, seasonLabel, colors, reel, target);
  const [settled, setSettled] = useState(false);
  useSpinSounds(onDone, () => setSettled(true));

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-3 text-center">
        <p className="cl-heading text-[0.62rem] tracking-[0.4em]" style={{ color: accent }}>{kicker}</p>
      </div>

      <PodiumStage
        accent={accent}
        lite={lite}
        beamAt={settled ? 0.5 : undefined}
        overlay={sparks && settled ? <Sparks count={8} color={accent} /> : undefined}
      >
        <motion.div
          className="absolute bottom-0 flex items-end"
          style={{ left: -PLINTH_W / 2, gap: PLINTH_GAP, willChange: "transform" }}
          initial={{ x: 0 }}
          animate={
            lite
              // transform only: a filter animation would repaint every plinth
              // on every frame, which is what makes phones stutter
              ? { x: -(target * ITEM_W) }
              : { x: -(target * ITEM_W), filter: ["blur(0px)", "blur(5px)", "blur(2px)", "blur(0px)"] }
          }
          transition={{
            x: { duration: SPIN_MS / 1000, ease: EASE_SPIN },
            filter: { duration: SPIN_MS / 1000, times: [0, 0.18, 0.7, 1] },
          }}
        >
          {strip.map((it, i) => {
            const delta = i - target;
            const dist = Math.abs(delta);
            const isWinner = dist === 0;
            return (
              <motion.div
                key={i}
                style={{ transformOrigin: "50% 100%" }}
                animate={settled ? podiumPose(delta) : { x: 0, y: 0, scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 190, damping: 20, delay: settled ? Math.min(dist, 3) * 0.05 : 0 }}
              >
                <Plinth
                  finish={settled ? finishFor(delta, i) : "silver"}
                  lit={settled && isWinner}
                  dim={lite && !isWinner}
                  name={isWinner ? nationOf(it.name) : abbrOf(it.name)}
                  sub={isWinner ? seasonLabel : undefined}
                  badge={<Flag nationality={nationOf(it.name)} width={42} />}
                />
              </motion.div>
            );
          })}
        </motion.div>

        {/* the reveal: a banner over the podium rather than a screen wipe, so
            the winner standing on gold stays visible behind it */}
        {settled && (
          <motion.div
            className="absolute left-1/2 z-[26] text-center"
            style={{ top: 16 }}
            initial={{ opacity: 0, y: -10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            transition={{ delay: 0.35, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="font-display text-3xl font-black uppercase leading-none tracking-wide text-white sm:text-4xl"
              style={{ textShadow: `0 4px 26px ${accent}, 0 2px 10px rgba(0,0,0,0.8)` }}>
              {nationOf(club)}
            </div>
            <div className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.4em]" style={{ color: accent }}>
              {compLine} {seasonLabel}
            </div>
          </motion.div>
        )}

        <StageHud
          accent={accent}
          label={settled ? "Nation Drawn" : "Drawing Nation"}
          right={{ k: "YR", v: seasonLabel }}
          progressMs={SPIN_MS}
        />
      </PodiumStage>
    </div>
  );
}

/* ================================================================== */
/*  UEFA EURO — silver-blue stage, red accent                          */
/* ================================================================== */
export function EuroSpinner(props: Props) {
  return <NationPodium {...props} accent="#ff3b57" kicker="Crossing Europe" compLine="EURO" />;
}

/* ================================================================== */
/*  Copa América — gold and green, louder                              */
/* ================================================================== */
export function CopaSpinner(props: Props) {
  return <NationPodium {...props} accent="#00e676" kicker="🥁 Rolling Through the Américas" compLine="COPA AMÉRICA" sparks />;
}
