"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CLUB_REGISTRY } from "@/lib/data/clubs";
import { seededRng, shuffle, hashString } from "@/lib/rng";
import { shortCode } from "@/lib/club-key";
import { play } from "@/lib/sound";
import { useFxLevel } from "@/lib/fx";
import { TeamBadge } from "@/components/TeamBadge";
import { CrestLogo } from "@/components/CrestLogo";
import {
  PodiumStage, StageHud, Plinth, podiumPose, finishFor,
  ITEM_W, PLINTH_W, PLINTH_GAP,
} from "@/components/spinner/PodiumStage";

const SPIN_MS = 3400;
const SETTLE_MS = 950; // podium settle before the draft round takes over

interface Props {
  club: string;
  seasonLabel: string;
  colors: [string, string];
  /** custom filler entries (e.g. national squads) — defaults to the club registry */
  reel?: { name: string; colors: [string, string] }[];
  /** squad rating for the broadcast bar */
  ovr?: number;
  /** formation being drafted into, for the broadcast bar */
  formation?: string;
  onDone: () => void;
}

/**
 * The club draw, staged as a podium presentation.
 *
 * A rank of plinths slides across the podium and decelerates; when it stops
 * the drawn club is centre stage, rises onto gold, and its neighbours settle
 * back onto silver and bronze. The settle is pure `transform`/`opacity` (see
 * PodiumStage for why nothing changes height), so it costs the same on a
 * phone as on a desktop.
 *
 * Phones still get a deliberately cheaper reel on top of that: the motion
 * softening during the slide is a `filter: blur()`, which forces a full
 * repaint of every plinth on every frame, so it's dropped along with the
 * blurred light beams, the reel is less than half as long, and only the
 * winner draws a full crest.
 */
export function SquadSpinner({ club, seasonLabel, colors, reel: reelPool, ovr, formation, onDone }: Props) {
  const fx = useFxLevel();
  const lite = fx !== "full";
  // fewer plinths on a phone: each one is a crest SVG with its own gradients
  const targetIndex = lite ? 14 : 30;
  const [settled, setSettled] = useState(false);

  const done = useRef(false);

  useEffect(() => {
    // decelerating tick track synced to the reel easing
    const timers: ReturnType<typeof setTimeout>[] = [];
    let t = 120;
    let gap = 55;
    while (t < SPIN_MS - 120) {
      timers.push(setTimeout(() => play("click"), t));
      t += gap;
      gap *= 1.16; // slow down
    }
    timers.push(setTimeout(() => play("flip"), SPIN_MS - 60));   // the stop impact
    timers.push(setTimeout(() => setSettled(true), SPIN_MS));    // podium rises
    timers.push(setTimeout(() => play("win"), SPIN_MS + 200));
    timers.push(setTimeout(() => {
      if (done.current) return;
      done.current = true;
      play("select");
      onDone();
    }, SPIN_MS + SETTLE_MS));
    return () => timers.forEach(clearTimeout);
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
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-3 flex flex-col items-center">
        <CrestLogo size={34} />
        <p className="mt-1 cl-heading text-[0.62rem] tracking-[0.35em] text-cyan">Drawing Your Squad</p>
      </div>

      <PodiumStage accent="#00f0ff" lite={lite} beamAt={settled ? 0.5 : undefined}>
        <motion.div
          className="absolute bottom-0 flex items-end"
          style={{ left: -PLINTH_W / 2, gap: PLINTH_GAP, willChange: "transform" }}
          initial={{ x: 0 }}
          animate={
            lite
              // transform only: no filter, so the compositor can run this
              // without repainting the rank of plinths every frame
              ? { x: -(targetIndex * ITEM_W) }
              : { x: -(targetIndex * ITEM_W), filter: ["blur(0px)", "blur(5px)", "blur(1.5px)", "blur(0px)"] }
          }
          transition={{
            x: { duration: SPIN_MS / 1000, ease: [0.08, 0.72, 0.1, 1] },
            filter: { duration: SPIN_MS / 1000, times: [0, 0.18, 0.72, 1] },
          }}
        >
          {reel.map((it, i) => {
            const delta = i - targetIndex;
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
                  name={it.name}
                  sub={it.season || undefined}
                  badge={
                    // on a phone only the winner draws a full crest — the rest
                    // slide past at speed, so a two-tone disc is indistinguishable
                    // and saves ~20 gradient-filled SVGs
                    lite && !isWinner ? (
                      <span aria-hidden className="grid h-10 w-10 place-items-center rounded-full text-[0.58rem] font-black text-white/90"
                        style={{ background: `linear-gradient(150deg, ${it.colors[0]}, ${it.colors[1]})` }}>
                        {it.code}
                      </span>
                    ) : (
                      <TeamBadge colors={it.colors} code={it.code} size={44} clubName={it.name} />
                    )
                  }
                />
              </motion.div>
            );
          })}
        </motion.div>

        {/* era plate on the front of the podium, once the club is known */}
        {settled && (
          <motion.div
            // centring lives in the motion props: Framer owns `transform` on
            // anything it animates and would drop a `-translate-x-1/2` class
            className="absolute left-1/2 z-[25] rounded-md px-3 py-1"
            style={{
              bottom: 74,
              background: "linear-gradient(180deg, rgba(6,12,24,0.95), rgba(3,7,15,0.95))",
              boxShadow: "inset 0 0 0 1px rgba(212,175,55,0.75), 0 0 22px rgba(212,175,55,0.3)",
            }}
            initial={{ opacity: 0, y: 8, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            transition={{ delay: 0.2, duration: 0.35 }}
          >
            <span className="cl-heading whitespace-nowrap text-[0.58rem] font-black tracking-[0.28em] text-gold">
              ERA · {seasonLabel}
            </span>
          </motion.div>
        )}

        <StageHud
          accent="#00f0ff"
          left={ovr ? { k: "OVR", v: String(Math.round(ovr)) } : undefined}
          label={settled ? "Squad Locked" : "Drawing Club"}
          right={formation ? { k: "POS", v: formation } : undefined}
          progressMs={SPIN_MS}
        />
      </PodiumStage>
    </div>
  );
}
