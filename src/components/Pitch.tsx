"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Formation, Player, Position } from "@/lib/types";
import { suitability } from "@/lib/suitability";
import { LineupCard } from "@/components/LineupCard";

export type PitchVariant = "cl" | "euro" | "copa";

/** A player being placed or moved — only its positions matter for the pitch. */
export interface PlacingPlayer {
  position: Position;
  altPositions: Position[];
  name?: string;
}

type Interaction =
  | { kind: "choose"; onSlot: (i: number) => void }
  | { kind: "place"; player: PlacingPlayer; onSlot: (i: number) => void }
  | { kind: "edit"; selectedSlots: number[]; moving: PlacingPlayer | null; onSlot: (i: number) => void };

interface Props {
  formation: Formation;
  players: (Player | null)[];
  showRatings?: boolean;
  variant?: PitchVariant;
  captainSlot?: number;
  interaction?: Interaction | null;
  compact?: boolean;
}

/**
 * Per-competition broadcast identity. Each is an ORIGINAL ContinentalXI look
 * inspired by elite football graphics — never a copy:
 *   cl   deep navy pitch, electric-blue + gold, European night
 *   euro bright green pitch, royal-blue frame, clean international
 *   copa emerald pitch, gold + warm accents, festive South America
 */
const BOARD: Record<PitchVariant, {
  bg: string; border: string; line: string; accent: string; slotGlow: string;
  nameAccent: string; badge: "crest" | "flag";
}> = {
  cl: {
    bg: "radial-gradient(135% 85% at 50% -14%, rgba(64,120,255,0.45), transparent 56%), radial-gradient(80% 55% at 88% 6%, rgba(140,95,255,0.2), transparent 60%), radial-gradient(80% 55% at 12% 6%, rgba(90,200,255,0.14), transparent 60%), repeating-linear-gradient(0deg, #071a52 0px, #071a52 44px, #0b2464 44px, #0b2464 88px)",
    border: "1.5px solid rgba(140,180,255,0.4)",
    line: "rgba(190,215,255,0.4)",
    accent: "#22e0ff", slotGlow: "rgba(212,175,55,0.65)", nameAccent: "#1546c8", badge: "crest",
  },
  euro: {
    bg: "radial-gradient(120% 85% at 50% -12%, rgba(27,79,255,0.4), transparent 58%), repeating-linear-gradient(0deg, #0e7a3f 0px, #0e7a3f 42px, #128a48 42px, #128a48 84px)",
    border: "1.5px solid rgba(27,79,255,0.6)",
    line: "rgba(255,255,255,0.55)",
    accent: "#37e0ff", slotGlow: "rgba(27,79,255,0.6)", nameAccent: "#1b3fd0", badge: "flag",
  },
  copa: {
    bg: "radial-gradient(120% 80% at 50% -10%, rgba(255,201,60,0.2), transparent 55%), repeating-linear-gradient(0deg, #0a5a34 0px, #0a5a34 42px, #0c6a3d 42px, #0c6a3d 84px)",
    border: "1.5px solid rgba(255,201,60,0.55)",
    line: "rgba(255,236,190,0.5)",
    accent: "#ffc93c", slotGlow: "rgba(255,201,60,0.7)", nameAccent: "#9a6b00", badge: "flag",
  },
};

// Map tactical coordinates (x,y 0-100, y=attack) into a safely-inset play area
// so no card — the goalkeeper included — ever clips the pitch edge.
function project(x: number, y: number): { left: string; top: string } {
  return { left: `${9 + x * 0.82}%`, top: `${9 + (100 - y) * 0.8}%` };
}

export function Pitch({
  formation, players, showRatings = true, variant = "cl", captainSlot, interaction = null, compact = false,
}: Props) {
  const board = BOARD[variant] ?? BOARD.cl;

  function slotInfo(i: number, slotPos: Position) {
    const filled = players[i];
    if (interaction?.kind === "choose") {
      return { tappable: !filled, draftable: !filled, target: null as null | ReturnType<typeof suitability>, dim: false, selected: false };
    }
    if (interaction?.kind === "place") {
      if (filled) return { tappable: false, draftable: false, target: null, dim: true, selected: false };
      const suit = suitability(interaction.player.position, interaction.player.altPositions, slotPos);
      return { tappable: suit.level !== "blocked", draftable: false, target: suit, dim: false, selected: false };
    }
    if (interaction?.kind === "edit") {
      const selected = interaction.selectedSlots.includes(i);
      if (interaction.moving) {
        const suit = suitability(interaction.moving.position, interaction.moving.altPositions, slotPos);
        const ok = suit.level !== "blocked" && !selected;
        return { tappable: ok || selected, draftable: false, target: selected ? null : suit, dim: !ok && !selected, selected };
      }
      return { tappable: !!filled, draftable: false, target: null, dim: false, selected };
    }
    return { tappable: false, draftable: false, target: null, dim: false, selected: false };
  }

  // sized so even the tightest row (three central mids ~15% apart) never
  // collides, from 320px up to desktop.
  const cardW = compact ? "w-[clamp(34px,9vw,42px)]" : "w-[clamp(38px,10vw,52px)]";
  const portraitH = compact ? "h-[clamp(22px,6vw,30px)]" : "h-[clamp(24px,6.5vw,34px)]";

  return (
    <div
      className="relative mx-auto aspect-[3/4] w-full max-w-md select-none"
      style={{ transform: "perspective(1200px) rotateX(2deg)", transformStyle: "preserve-3d" }}
    >
      <div
        className="absolute inset-0 overflow-hidden rounded-2xl"
        style={{ background: board.bg, border: board.border, boxShadow: `inset 0 0 60px rgba(0,0,0,0.32), 0 0 30px ${board.slotGlow.replace(/[\d.]+\)$/, "0.18)")}` }}
      >
        {/* floodlights + grounding vignette */}
        <div className="pointer-events-none absolute inset-0" aria-hidden
          style={{
            background:
              `radial-gradient(42% 30% at 8% 0%, ${board.accent}1f, transparent 70%),` +
              `radial-gradient(42% 30% at 92% 0%, ${board.accent}1f, transparent 70%),` +
              "radial-gradient(120% 45% at 50% 108%, rgba(0,0,0,0.45), transparent 65%)",
          }} />

        {/* CL: geometric light streaks + centre-circle glow for a broadcast night feel */}
        {variant === "cl" && (
          <>
            <div className="pointer-events-none absolute inset-0" aria-hidden
              style={{
                background: "repeating-linear-gradient(118deg, transparent 0 30px, rgba(130,175,255,0.06) 30px 31px)",
                maskImage: "linear-gradient(to bottom, #000, transparent 88%)",
                WebkitMaskImage: "linear-gradient(to bottom, #000, transparent 88%)",
              }} />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full" aria-hidden
              style={{ background: "radial-gradient(circle, rgba(120,170,255,0.14), transparent 70%)" }} />
          </>
        )}

        {/* pitch markings */}
        <svg viewBox="0 0 100 133" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <g fill="none" stroke={board.line} strokeWidth={variant === "cl" ? 0.45 : 0.55}>
            <rect x="4" y="4" width="92" height="125" rx="1" />
            <line x1="4" y1="66.5" x2="96" y2="66.5" />
            <circle cx="50" cy="66.5" r="11" />
            <circle cx="50" cy="66.5" r="0.8" fill={board.line} />
            <rect x="28" y="4" width="44" height="20" />
            <rect x="28" y="109" width="44" height="20" />
            <rect x="40" y="4" width="20" height="8" />
            <rect x="40" y="121" width="20" height="8" />
            <path d="M 42 24 A 9.5 9.5 0 0 0 58 24" />
            <path d="M 42 109 A 9.5 9.5 0 0 1 58 109" />
            <circle cx="50" cy="17" r="0.7" fill={board.line} />
            <circle cx="50" cy="116" r="0.7" fill={board.line} />
            <path d="M 4 8 A 4 4 0 0 0 8 4" />
            <path d="M 92 4 A 4 4 0 0 0 96 8" />
            <path d="M 8 129 A 4 4 0 0 0 4 125" />
            <path d="M 96 125 A 4 4 0 0 0 92 129" />
          </g>
        </svg>
      </div>

      {/* slots */}
      {formation.slots.map((slot, i) => {
        const player = players[i];
        const pos = project(slot.x, slot.y);
        const info = slotInfo(i, slot.pos);
        const tappable = info.tappable && !!interaction;
        const ownSuit = player ? suitability(player.position, player.altPositions, slot.pos) : null;
        const secondary = ownSuit && ownSuit.level !== "natural";

        return (
          <div
            key={i}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: pos.left, top: pos.top, opacity: info.dim ? 0.32 : 1 }}
          >
            <button
              type="button"
              disabled={!tappable}
              onClick={tappable ? () => interaction!.onSlot(i) : undefined}
              aria-label={player ? `${player.name}, ${slot.pos}` : `${slot.pos} slot`}
              className={`relative block min-h-[44px] min-w-[44px] focus:outline-none ${tappable ? "cursor-pointer" : "cursor-default"}`}
            >
              {/* grounding shadow */}
              {player && (
                <span aria-hidden className="absolute left-1/2 top-full h-2 w-10 -translate-x-1/2 -translate-y-1 rounded-full"
                  style={{ background: "radial-gradient(50% 100% at 50% 50%, rgba(0,0,0,0.5), transparent 70%)", filter: "blur(1.5px)" }} />
              )}
              {/* captain armband */}
              {player && captainSlot === i && (
                <span className="absolute -right-1.5 -top-1.5 z-20 grid h-5 w-5 place-items-center rounded-full font-display text-[0.6rem] font-extrabold text-[#041022]"
                  style={{ background: "linear-gradient(150deg, #f2d472, #d4af37)", boxShadow: "0 2px 8px rgba(0,0,0,0.55)" }} title="Captain">C</span>
              )}

              <AnimatePresence mode="popLayout">
                <motion.div
                  key={player ? player.id : info.target ? `t${i}` : info.draftable ? `d${i}` : "empty"}
                  initial={{ scale: 0.4, y: 8, opacity: 0 }}
                  animate={{ scale: info.selected ? 1.08 : 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.5, y: -8, opacity: 0 }}
                  whileHover={player && tappable ? { y: -3, scale: 1.06 } : undefined}
                  transition={{ type: "spring", stiffness: 240, damping: 18 }}
                >
                  {player ? (
                    <LineupCard
                      name={player.name}
                      overall={player.overall}
                      colors={player.colors}
                      seasonLabel={compact ? undefined : player.seasonLabel}
                      slotPos={slot.pos}
                      badge={board.badge}
                      nameAccent={board.nameAccent}
                      showRating={showRatings}
                      secondaryColor={secondary ? ownSuit!.color : undefined}
                      captain={captainSlot === i}
                      selected={info.selected}
                      slotGlow={board.slotGlow}
                      widthClass={cardW}
                      portraitClass={portraitH}
                    />
                  ) : info.target ? (
                    info.target.level === "blocked" ? (
                      <div className="grid h-[52px] w-[54px] place-items-center gap-0.5 rounded-xl border-2 border-dashed"
                        style={{ borderColor: "rgba(255,90,106,0.55)", background: "rgba(255,90,106,0.10)" }} title="This player cannot play here">
                        <span className="text-[0.85rem]" style={{ color: "#ff8b96" }}>⊘</span>
                        <span className="text-[0.42rem] font-bold uppercase tracking-wider text-white/45">{slot.pos}</span>
                      </div>
                    ) : (
                      <div className="grid h-[54px] w-[56px] animate-pulse place-items-center gap-0.5 rounded-xl"
                        style={{ background: `${info.target.color}20`, border: `2px solid ${info.target.color}`, boxShadow: `0 0 16px ${info.target.color}66`, animationDuration: "1.5s" }}>
                        <span className="font-display text-[0.72rem] font-extrabold" style={{ color: info.target.color }}>{slot.pos}</span>
                        <span className="text-[0.4rem] font-bold uppercase tracking-wide" style={{ color: info.target.color }}>{info.target.short}</span>
                      </div>
                    )
                  ) : info.draftable ? (
                    <div className="grid h-[54px] w-[56px] animate-pulse place-items-center gap-0.5 rounded-xl border-2 border-dashed"
                      style={{ borderColor: board.accent, background: `${board.accent}18`, boxShadow: `0 0 14px ${board.accent}44`, animationDuration: "1.8s" }}>
                      <span className="text-[0.9rem] leading-none" style={{ color: board.accent }}>＋</span>
                      <span className="font-display text-[0.62rem] font-extrabold" style={{ color: board.accent }}>{slot.pos}</span>
                    </div>
                  ) : (
                    <div className="grid h-[50px] w-[54px] place-items-center rounded-xl border border-dashed border-white/25 text-[0.58rem] font-bold text-white/45"
                      style={{ background: "rgba(6,18,50,0.5)" }}>
                      {slot.pos}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        );
      })}
    </div>
  );
}
