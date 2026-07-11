"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Formation, Player, Position } from "@/lib/types";
import { suitability } from "@/lib/suitability";

function initials(name: string): string {
  const parts = name.split(" ");
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}
function surname(name: string): string {
  return name.split(" ").pop() ?? name;
}

export type PitchVariant = "cl" | "euro" | "copa";

/** A player being placed or moved — only its positions matter for the pitch. */
export interface PlacingPlayer {
  position: Position;
  altPositions: Position[];
  name?: string;
}

type Interaction =
  /** choosing which empty slot to draft for */
  | { kind: "choose"; onSlot: (i: number) => void }
  /** placing a specific chosen player into an eligible open slot */
  | { kind: "place"; player: PlacingPlayer; onSlot: (i: number) => void }
  /** squad edit / captain / compare: tap a player to select, then tap a valid destination */
  | { kind: "edit"; selectedSlots: number[]; moving: PlacingPlayer | null; onSlot: (i: number) => void };

interface Props {
  formation: Formation;
  players: (Player | null)[];
  showRatings?: boolean;
  variant?: PitchVariant;
  captainSlot?: number;
  interaction?: Interaction | null;
  /** compact circular markers instead of cards — used on the narrowest screens */
  compact?: boolean;
}

/* each competition paints its own board — these identities already work, so we
   keep them and only fix the geometry, cards and interaction on top. */
const BOARD: Record<PitchVariant, { bg: string; border: string; line: string; accent: string; slotGlow: string }> = {
  cl: {
    bg: "radial-gradient(120% 80% at 50% -10%, rgba(41,98,255,0.30), transparent 55%), repeating-linear-gradient(0deg, #071747 0px, #071747 42px, #0a1d55 42px, #0a1d55 84px)",
    border: "1px solid rgba(120,160,255,0.25)",
    line: "rgba(180,205,255,0.30)",
    accent: "#22e0ff",
    slotGlow: "rgba(212,175,55,0.65)",
  },
  euro: {
    bg: "radial-gradient(120% 90% at 50% -10%, rgba(27,79,255,0.35), transparent 60%), linear-gradient(160deg, #071233 0%, #050d2e 55%, #040a20 100%)",
    border: "1px solid rgba(219,230,255,0.35)",
    line: "rgba(219,230,255,0.32)",
    accent: "#37e0ff",
    slotGlow: "rgba(55,224,255,0.6)",
  },
  copa: {
    bg: "radial-gradient(120% 80% at 50% -10%, rgba(255,138,61,0.22), transparent 55%), repeating-linear-gradient(0deg, #0a2e1c 0px, #0a2e1c 42px, #0d3a24 42px, #0d3a24 84px)",
    border: "1px solid rgba(255,201,60,0.45)",
    line: "rgba(255,214,120,0.38)",
    accent: "#ffc93c",
    slotGlow: "rgba(255,201,60,0.7)",
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

  // resolve how each slot behaves under the current interaction
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
        // a player is picked up — light valid destinations (empty or swap)
        const suit = suitability(interaction.moving.position, interaction.moving.altPositions, slotPos);
        const ok = suit.level !== "blocked" && !selected;
        return { tappable: ok || selected, draftable: false, target: selected ? null : suit, dim: !ok && !selected, selected };
      }
      return { tappable: !!filled, draftable: false, target: null, dim: false, selected };
    }
    return { tappable: false, draftable: false, target: null, dim: false, selected: false };
  }

  const cardW = compact ? "w-[clamp(36px,10vw,44px)]" : "w-[clamp(42px,11.5vw,60px)]";

  return (
    <div
      className="relative mx-auto aspect-[3/4] w-full max-w-md select-none"
      style={{ transform: "perspective(1200px) rotateX(2deg)", transformStyle: "preserve-3d" }}
    >
      <div
        className="absolute inset-0 overflow-hidden rounded-2xl"
        style={{ background: board.bg, border: board.border, boxShadow: variant === "copa" ? "inset 0 0 40px rgba(255,201,60,0.08)" : "inset 0 0 50px rgba(0,0,0,0.35)" }}
      >
        {/* floodlights + grounding vignette */}
        <div className="pointer-events-none absolute inset-0" aria-hidden
          style={{
            background:
              `radial-gradient(42% 30% at 8% 0%, ${board.accent}1c, transparent 70%),` +
              `radial-gradient(42% 30% at 92% 0%, ${board.accent}1c, transparent 70%),` +
              "radial-gradient(120% 45% at 50% 108%, rgba(0,0,0,0.45), transparent 65%)",
          }} />

        {/* pitch markings */}
        <svg viewBox="0 0 100 133" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <g fill="none" stroke={board.line} strokeWidth={variant === "copa" ? 0.55 : 0.45}
            strokeDasharray={variant === "copa" ? "2.2 1.3" : undefined}>
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

        // suitability of the CURRENTLY-placed player in this slot (for the border)
        const ownSuit = player ? suitability(player.position, player.altPositions, slot.pos) : null;

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
                    /* placed player card — suitability shown as the card's border */
                    <div
                      className={`relative ${cardW} overflow-hidden rounded-xl`}
                      style={{
                        background: `linear-gradient(160deg, ${player.colors[0]}, ${player.colors[1]})`,
                        border: `2px solid ${info.selected ? "#f2d472" : ownSuit && ownSuit.level !== "natural" ? ownSuit.color : "rgba(255,255,255,0.28)"}`,
                        boxShadow: info.selected
                          ? `0 0 18px ${board.slotGlow}`
                          : "0 8px 18px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.2)",
                      }}
                    >
                      <div className="absolute inset-0 bg-black/50" />
                      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(115deg, rgba(255,255,255,0.16) 0%, transparent 40%)" }} />
                      <div className="relative flex items-center justify-between px-0.5 pt-0.5 leading-none">
                        {showRatings ? (
                          <span className="rounded px-1 py-[0.5px] font-display text-[0.6rem] font-extrabold text-[#041022]"
                            style={{ background: "linear-gradient(150deg, #f2d472, #d4af37)" }}>{player.overall}</span>
                        ) : <span />}
                        {ownSuit && ownSuit.level !== "natural" && (
                          <span className="grid h-3 w-3 place-items-center rounded-full text-[0.46rem] font-black"
                            style={{ background: ownSuit.color, color: "#08131f" }} title={ownSuit.label}>{ownSuit.level === "secondary" ? "2" : "!"}</span>
                        )}
                      </div>
                      <div className="relative pb-px text-center font-display text-[0.82rem] font-extrabold leading-none text-white drop-shadow">
                        {initials(player.name)}
                      </div>
                      <div className="relative bg-black/55 px-0.5 pb-[2px] pt-[1px] text-center">
                        <div className="truncate text-[0.48rem] font-bold leading-tight text-white/95">{surname(player.name)}</div>
                        <div className="text-[0.4rem] font-bold uppercase tracking-[0.1em] leading-tight" style={{ color: board.accent }}>{slot.pos}</div>
                      </div>
                    </div>
                  ) : info.target ? (
                    /* placement target — green (natural) / yellow (secondary) / locked (blocked) */
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
                    /* choose-a-position target */
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
