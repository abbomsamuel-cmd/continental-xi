"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Formation, Player, Position } from "@/lib/types";
import { suitability } from "@/lib/suitability";
import { LineupCard, EmptyTile, type SlotState } from "@/components/LineupCard";

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
 * Per-competition broadcast identity — original ContinentalXI looks inspired by
 * elite football graphics, never a copy:
 *   cl   deep navy pitch, electric-blue lighting + gold, European night
 *   euro bright green pitch, royal-blue frame, clean international broadcast
 *   copa emerald pitch, gold + warm accents, festive South America
 */
const BOARD: Record<PitchVariant, {
  bg: string; grass: string; frame: string; line: string; accent: string; slotGlow: string;
}> = {
  cl: {
    bg: "radial-gradient(120% 60% at 50% -10%, rgba(70,130,255,0.5), transparent 60%), radial-gradient(70% 45% at 88% 4%, rgba(150,100,255,0.22), transparent 62%), radial-gradient(70% 45% at 12% 4%, rgba(90,200,255,0.16), transparent 62%), linear-gradient(180deg, #0a1f5c 0%, #071845 55%, #050f30 100%)",
    grass: "repeating-linear-gradient(0deg, rgba(120,170,255,0.05) 0 46px, rgba(120,170,255,0.09) 46px 92px)",
    frame: "1px solid rgba(150,185,255,0.42)",
    line: "rgba(190,215,255,0.34)",
    accent: "#37e0ff", slotGlow: "rgba(242,212,114,0.75)",
  },
  euro: {
    bg: "radial-gradient(120% 60% at 50% -8%, rgba(27,79,255,0.42), transparent 60%), linear-gradient(180deg, #12924c 0%, #0f8446 55%, #0c6f3b 100%)",
    grass: "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 46px, rgba(0,0,0,0.05) 46px 92px)",
    frame: "1px solid rgba(120,160,255,0.6)",
    line: "rgba(255,255,255,0.5)",
    accent: "#37e0ff", slotGlow: "rgba(47,107,255,0.7)",
  },
  copa: {
    bg: "radial-gradient(120% 60% at 50% -8%, rgba(255,201,60,0.18), transparent 58%), linear-gradient(180deg, #126a3d 0%, #0c552f 55%, #073a20 100%)",
    grass: "repeating-linear-gradient(0deg, rgba(255,236,190,0.045) 0 46px, rgba(0,0,0,0.06) 46px 92px)",
    frame: "1px solid rgba(255,201,60,0.55)",
    line: "rgba(255,236,190,0.42)",
    accent: "#ffc93c", slotGlow: "rgba(255,201,60,0.75)",
  },
};

// Map tactical coords (x,y 0-100, y=attack) into an inset play area. The band is
// lifted up the pitch (GK & back line higher, more grass below the keeper) and
// spread wide so wingers/full-backs breathe.
function project(x: number, y: number): { left: string; top: string } {
  return { left: `${8 + x * 0.84}%`, top: `${6 + (100 - y) * 0.80}%` };
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

  // width is a % of the PITCH (container-query), so tiles scale with the pitch
  // and never overlap regardless of where the pitch is rendered.
  const cardW = "w-[11cqw]";

  return (
    <div
      className="relative mx-auto aspect-[7/10] w-full max-w-[440px] select-none"
      style={{ transform: "perspective(1400px) rotateX(1.5deg)", transformStyle: "preserve-3d", containerType: "inline-size" }}
    >
      <div
        className="absolute inset-0 overflow-hidden rounded-[18px]"
        style={{ background: board.bg, border: board.frame, boxShadow: `inset 0 0 70px rgba(0,0,0,0.35), 0 20px 50px rgba(0,0,0,0.5)` }}
      >
        {/* mowing stripes / grass texture */}
        <div className="pointer-events-none absolute inset-0" aria-hidden style={{ background: board.grass }} />

        {/* floodlight bloom top corners + grounding vignette */}
        <div className="pointer-events-none absolute inset-0" aria-hidden
          style={{
            background:
              `radial-gradient(40% 26% at 8% -2%, ${board.accent}22, transparent 70%),` +
              `radial-gradient(40% 26% at 92% -2%, ${board.accent}22, transparent 70%),` +
              "radial-gradient(130% 40% at 50% 112%, rgba(0,0,0,0.5), transparent 62%)",
          }} />

        {/* CL: soft light streaks + centre glow for a broadcast night feel */}
        {variant === "cl" && (
          <>
            <div className="pointer-events-none absolute inset-0" aria-hidden
              style={{
                background: "repeating-linear-gradient(118deg, transparent 0 34px, rgba(130,175,255,0.05) 34px 35px)",
                maskImage: "linear-gradient(to bottom, #000, transparent 90%)",
                WebkitMaskImage: "linear-gradient(to bottom, #000, transparent 90%)",
              }} />
            <div className="pointer-events-none absolute left-1/2 top-[46%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full" aria-hidden
              style={{ background: "radial-gradient(circle, rgba(120,170,255,0.13), transparent 70%)" }} />
          </>
        )}

        {/* pitch markings — subtle */}
        <svg viewBox="0 0 100 140" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <g fill="none" stroke={board.line} strokeWidth={0.4}>
            <rect x="5" y="5" width="90" height="130" rx="1" />
            <line x1="5" y1="70" x2="95" y2="70" />
            <circle cx="50" cy="70" r="11" />
            <circle cx="50" cy="70" r="0.7" fill={board.line} />
            <rect x="29" y="5" width="42" height="19" />
            <rect x="29" y="116" width="42" height="19" />
            <rect x="40" y="5" width="20" height="7" />
            <rect x="40" y="128" width="20" height="7" />
            <path d="M 42 24 A 9 9 0 0 0 58 24" />
            <path d="M 42 116 A 9 9 0 0 1 58 116" />
            <path d="M 5 9 A 4 4 0 0 0 9 5" />
            <path d="M 91 5 A 4 4 0 0 0 95 9" />
            <path d="M 9 135 A 4 4 0 0 0 5 131" />
            <path d="M 95 131 A 4 4 0 0 0 91 135" />
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

        const emptyState: SlotState = info.target
          ? info.target.level === "blocked" ? "blocked" : "target"
          : info.draftable ? "draftable"
          : info.selected ? "selected" : "idle";

        return (
          <div
            key={i}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: pos.left, top: pos.top, opacity: info.dim ? 0.3 : 1 }}
          >
            <button
              type="button"
              disabled={!tappable}
              onClick={tappable ? () => interaction!.onSlot(i) : undefined}
              aria-label={player ? `${player.name}, ${slot.pos}` : `${slot.pos} slot`}
              className={`relative block min-h-[44px] min-w-[44px] focus:outline-none ${tappable ? "cursor-pointer" : "cursor-default"}`}
            >
              {/* captain armband */}
              {player && captainSlot === i && (
                <span className="absolute -right-1.5 -top-1.5 z-30 grid h-5 w-5 place-items-center rounded-full font-display text-[0.6rem] font-extrabold text-[#041022]"
                  style={{ background: "linear-gradient(150deg, #f2d472, #d4af37)", boxShadow: "0 2px 8px rgba(0,0,0,0.55)" }} title="Captain">C</span>
              )}

              <AnimatePresence mode="popLayout">
                <motion.div
                  key={player ? player.id : `e${i}-${emptyState}`}
                  initial={{ scale: 0.9, y: 6, opacity: 0 }}
                  animate={{ scale: info.selected && player ? 1.06 : 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.85, y: -4, opacity: 0 }}
                  whileHover={player && tappable ? { y: -4, scale: 1.05 } : undefined}
                  transition={{ type: "spring", stiffness: 300, damping: 16 }}
                >
                  {/* grounding shadow — sells the "floating above the pitch" look */}
                  <span aria-hidden className="absolute left-1/2 top-full z-0 h-2 w-3/5 -translate-x-1/2 -translate-y-1 rounded-[100%]"
                    style={{ background: "radial-gradient(50% 100% at 50% 50%, rgba(0,0,0,0.5), transparent 72%)", filter: "blur(1.6px)" }} />
                  {player ? (
                    <LineupCard
                      name={player.name}
                      overall={player.overall}
                      colors={player.colors}
                      seasonLabel={compact ? undefined : player.seasonLabel}
                      slotPos={slot.pos}
                      clubLabel={compact ? undefined : player.club}
                      variant={variant}
                      showRating={showRatings}
                      secondaryColor={secondary ? ownSuit!.color : undefined}
                      captain={captainSlot === i}
                      selected={info.selected}
                      slotGlow={board.slotGlow}
                      widthClass={cardW}
                    />
                  ) : (
                    <EmptyTile
                      variant={variant}
                      pos={slot.pos}
                      state={emptyState}
                      color={info.target ? info.target.color : undefined}
                      sub={info.target && info.target.level !== "blocked" ? info.target.short : undefined}
                      widthClass={cardW}
                    />
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
