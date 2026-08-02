"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { GameMode, Player } from "@/lib/types";
import { Flag } from "@/components/Flag";
import { ClubCrest } from "@/components/ClubCrest";
import { RemoteBadge } from "@/components/RemoteBadge";
import { clubBadgeUrlFor, flagUrlFor } from "@/lib/badge-sources";
import { SHIELD_CLIP, CARD_MOSAIC } from "@/lib/cardShape";

function surname(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? name;
}

/** First and last initial — "Thierry Henry" → "TH", "Ronaldinho" → "R". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** The six attributes in the order every football card has shown them. */
const STAT_KEYS: [string, keyof Player["attributes"]][] = [
  ["PAC", "pace"], ["SHO", "shooting"], ["PAS", "passing"],
  ["DRI", "dribbling"], ["DEF", "defending"], ["PHY", "physical"],
];

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
  variant?: "cl" | "euro" | "copa";
}

/** FUT-style minimal draft card: rating, position, surname, nation flag,
 *  season — no invented club badge, no fabricated portrait. A 3D tilt
 *  follows the pointer, like a physical card catching the light. */
export function PlayerCard({ player, mode, onSelect, selected, compact, index = 0, variant = "cl" }: Props) {
  const expert = mode === "expert";
  const [c1] = player.colors;
  const rColor = ratingColor(player.overall);
  // an explicit URL on the player wins; otherwise ask the shared source map,
  // which is empty until someone hooks one up
  const flagSrc = player.nationFlagUrl ?? flagUrlFor(player.nationality);
  const crestSrc = player.clubBadgeUrl ?? clubBadgeUrlFor(player.club);

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
      className={`group relative block aspect-[3/4] w-full p-[1.5px] text-left ${
        selected ? "ring-2 ring-cyan" : ""
      } ${onSelect ? "cursor-pointer" : "cursor-default"}`}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: `linear-gradient(150deg, ${rColor}, ${c1})`, clipPath: SHIELD_CLIP }}
      />
      {/* The shield clip runs full-width only to 72% of the height, then
          tapers to a point. Padding is in PERCENT, not rems, so the safe
          area scales with the card instead of drifting at large sizes —
          full-width content below ~76% gets its edges cut off. */}
      <div className="relative flex h-full flex-col px-[8%] pb-[24%] pt-[6%]"
        style={{ background: "linear-gradient(165deg, #182233 0%, #0a0e17 78%)", clipPath: SHIELD_CLIP }}>
        {/* per-competition background texture */}
        <span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: CARD_MOSAIC[variant] }} />
        {/* diagonal metallic sheen, follows the tilt */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ background: sheenBg, clipPath: SHIELD_CLIP }}
        />

        {/* header: rating, position and flag stacked left; club crest right */}
        <div className="flex items-start justify-between gap-2" style={{ transform: "translateZ(30px)" }}>
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
            <RemoteBadge
              src={flagSrc}
              alt={player.nationality}
              width="1.6rem"
              className="mt-1.5 rounded-[2px] object-contain drop-shadow-md"
            >
              <Flag nationality={player.nationality} className="mt-1.5 block text-xl drop-shadow-md" />
            </RemoteBadge>
          </div>

          {/* club crest — hidden in expert mode, where it would give the club
              away before you've had a chance to guess the player */}
          {!expert && !compact && (
            <RemoteBadge
              src={crestSrc}
              alt={player.club}
              width="2.4rem"
              className="object-contain drop-shadow-md"
            >
              <div className="relative grid place-items-center drop-shadow-md" style={{ width: "2.4rem" }}>
                <ClubCrest colors={player.colors} seed={player.club} width="100%" textBacking />
                <span
                  className="absolute font-display font-black leading-none"
                  style={{
                    fontSize: "0.66rem",
                    background: "linear-gradient(180deg, #ffffff 10%, #cfdcec 55%, #8593ab 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    textShadow: "0 1px 2px rgba(0,0,0,0.55)",
                  }}
                >
                  {initials(player.name)}
                </span>
              </div>
            </RemoteBadge>
          )}
        </div>

        {/* surname — the hero element */}
        <div className="flex flex-1 items-center justify-center" style={{ transform: "translateZ(20px)" }}>
          <div className="max-w-full truncate text-center font-display text-2xl font-extrabold uppercase leading-tight text-white">
            {expert ? "???" : surname(player.name)}
          </div>
        </div>

        {/* the six attributes. Sits inside the shield's full-width band —
            anything below ~76% of the height gets clipped by the taper. */}
        {!expert && !compact && (
          <div
            className="mb-1 grid grid-cols-3 gap-x-1 gap-y-0.5"
            style={{ transform: "translateZ(24px)" }}
          >
            {STAT_KEYS.map(([label, key]) => (
              <div key={label} className="flex items-baseline justify-center gap-1">
                <span className="font-display text-[0.82rem] font-extrabold leading-none text-white">
                  {player.attributes[key]}
                </span>
                <span className="text-[0.5rem] font-bold uppercase tracking-wider text-white/45">
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}

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
