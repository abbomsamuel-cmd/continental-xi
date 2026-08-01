"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { GameMode, Player } from "@/lib/types";
import { Flag } from "@/components/Flag";

function surname(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? name;
}

function ratingColor(ovr: number): string {
  if (ovr >= 90) return "#33ffab";
  if (ovr >= 85) return "#00e676";
  if (ovr >= 80) return "#00f0ff";
  return "#94a3b8";
}

interface Props {
  player: Player;
  mode: GameMode;
  onSelect?: () => void;
  selected?: boolean;
  compact?: boolean;
  index?: number;
}

/** FUT-style minimal draft card: rating, position, surname, nation flag,
 *  season — no invented club badge, no fabricated portrait. A 3D tilt
 *  follows the pointer, like a physical card catching the light. */
export function PlayerCard({ player, mode, onSelect, selected, compact, index = 0 }: Props) {
  const expert = mode === "expert";
  const [c1] = player.colors;
  const rColor = ratingColor(player.overall);

  const ref = useRef<HTMLButtonElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 220, damping: 18 });
  const sry = useSpring(ry, { stiffness: 220, damping: 18 });
  const sheenX = useTransform(sry, [-10, 10], [0, 100]);
  const sheenY = useTransform(srx, [10, -10], [0, 100]);
  const sheenBg = useTransform([sheenX, sheenY], ([x, y]: number[]) =>
    `radial-gradient(340px circle at ${x}% ${y}%, rgba(255,255,255,0.16), transparent 62%)`);

  function onMove(e: ReactPointerEvent<HTMLButtonElement>) {
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return; // touch: no jittery tilt
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rx.set(py * -14);
    ry.set(px * 14);
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onSelect}
      disabled={!onSelect}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      initial={{ y: 18, scale: 0.97 }}
      animate={{ y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 130, damping: 16 }}
      whileHover={onSelect ? { y: -8, scale: 1.04 } : undefined}
      whileTap={onSelect ? { scale: 0.97 } : undefined}
      style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d", perspective: 900 }}
      className={`group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl p-[1.5px] text-left ${
        selected ? "ring-2 ring-cyan" : ""
      } ${onSelect ? "cursor-pointer" : "cursor-default"}`}
    >
      <div
        aria-hidden
        className="absolute inset-0 rounded-2xl"
        style={{ background: `linear-gradient(150deg, ${rColor}, ${c1})` }}
      />
      <div className="relative flex h-full flex-col rounded-2xl p-4"
        style={{ background: "linear-gradient(165deg, #182233 0%, #0a0e17 78%)" }}>
        {/* diagonal metallic sheen, follows the tilt */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ background: sheenBg }}
        />

        {/* header: rating + position, nation flag */}
        <div className="flex items-start justify-between" style={{ transform: "translateZ(30px)" }}>
          <div className="leading-none">
            {!expert ? (
              <div className="font-display text-4xl font-extrabold" style={{ color: rColor }}>
                {player.overall}
              </div>
            ) : (
              <div className="font-display text-4xl font-extrabold text-muted">?</div>
            )}
            <div className="mt-1 text-[0.62rem] font-bold tracking-widest text-muted">
              {player.position}
            </div>
          </div>
          <Flag nationality={player.nationality} className="text-2xl" />
        </div>

        {/* surname — the hero element */}
        <div className="flex flex-1 items-center justify-center" style={{ transform: "translateZ(20px)" }}>
          <div className="max-w-full truncate text-center font-display text-2xl font-extrabold uppercase leading-tight text-white">
            {expert ? "???" : surname(player.name)}
          </div>
        </div>

        {/* season — real historical fact, not club branding */}
        {!compact && (
          <div className="text-center text-[0.66rem] font-bold uppercase tracking-[0.2em] text-white/45" style={{ transform: "translateZ(20px)" }}>
            {expert ? player.position : player.seasonLabel}
          </div>
        )}

        {onSelect && (
          <div className="pointer-events-none absolute inset-x-3 bottom-2 translate-y-3 rounded-lg bg-cyan py-1 text-center text-[0.65rem] font-extrabold uppercase tracking-widest text-[#041022] opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
            Lock In
          </div>
        )}
      </div>
    </motion.button>
  );
}
