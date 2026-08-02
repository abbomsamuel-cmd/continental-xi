"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { GameMode, Player } from "@/lib/types";
import { Flag } from "@/components/Flag";
import { ClubCrest } from "@/components/ClubCrest";
import { RemoteBadge } from "@/components/RemoteBadge";
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
      <div className="relative flex h-full flex-col px-4 pb-[15%] pt-4"
        style={{ background: "linear-gradient(165deg, #182233 0%, #0a0e17 78%)", clipPath: SHIELD_CLIP }}>
        {/* per-competition background texture */}
        <span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: CARD_MOSAIC[variant] }} />
        {/* diagonal metallic sheen, follows the tilt */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ background: sheenBg, clipPath: SHIELD_CLIP }}
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
          <RemoteBadge src={player.nationFlagUrl} alt={player.nationality} width="1.9rem" className="rounded-[2px] shadow">
            <Flag nationality={player.nationality} className="text-2xl" />
          </RemoteBadge>
        </div>

        {/* monogram + surname — no portrait, so the player's initials are set
            on their club's own crest, which carries that club's real kit
            pattern. Hidden in expert mode, where the crest would give the
            club away before you've guessed. */}
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5" style={{ transform: "translateZ(20px)" }}>
          {!expert && !compact && (
            <div className="relative grid place-items-center" style={{ width: "44%" }}>
              <RemoteBadge src={player.clubBadgeUrl} alt={player.club} width="100%">
                <>
                  <ClubCrest colors={player.colors} seed={player.club} width="100%" textBacking />
                  <span
                    className="absolute font-display font-black leading-none"
                    style={{
                      fontSize: "1.05rem",
                      background: "linear-gradient(180deg, #ffffff 10%, #cfdcec 55%, #8593ab 100%)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                      textShadow: "0 1px 2px rgba(0,0,0,0.55)",
                    }}
                  >
                    {initials(player.name)}
                  </span>
                </>
              </RemoteBadge>
            </div>
          )}
          <div className="max-w-full truncate text-center font-display text-2xl font-extrabold uppercase leading-tight text-white">
            {expert ? "???" : surname(player.name)}
          </div>
        </div>

        {/* the six attributes — already on every player, never shown until now.
            Hidden in expert mode (where the whole point is guessing) and on
            compact cards, which are too small to read them. */}
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
