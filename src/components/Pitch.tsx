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
    bg: "radial-gradient(120% 80% at 50% -10%, rgba(41,98,255,0.32), transparent 55%), repeating-linear-gradient(0deg, #071747 0px, #071747 42px, #0a1d55 42px, #0a1d55 84px)",
    border: "1px solid rgba(120,160,255,0.28)",
    line: "rgba(180,205,255,0.32)",
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

/** Player silhouette — the polished fallback when no portrait exists. */
function Silhouette() {
  return (
    <svg viewBox="0 0 24 24" className="absolute bottom-0 left-1/2 h-[115%] w-auto -translate-x-1/2" aria-hidden>
      <path d="M12 12.4c2.3 0 4.1-1.9 4.1-4.2S14.3 4 12 4 7.9 5.9 7.9 8.2 9.7 12.4 12 12.4zM12 14c-3.4 0-8 1.7-8 5.1V24h16v-4.9c0-3.4-4.6-5.1-8-5.1z"
        fill="rgba(255,255,255,0.16)" />
    </svg>
  );
}

/** Tiny original club crest (split shield + star) or nation flag (diagonal bicolor). */
function MiniBadge({ colors, kind }: { colors: [string, string]; kind: "crest" | "flag" }) {
  if (kind === "flag") {
    return (
      <svg viewBox="0 0 16 11" className="h-[11px] w-[16px]" aria-hidden>
        <clipPath id="fclip"><rect x="0" y="0" width="16" height="11" rx="1.5" /></clipPath>
        <g clipPath="url(#fclip)">
          <path d="M0 0 H16 V11 Z" fill={colors[1]} />
          <path d="M0 0 H16 V0 L0 11 Z" fill={colors[0]} />
        </g>
        <rect x="0.4" y="0.4" width="15.2" height="10.2" rx="1.3" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="0.8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 14 15" className="h-[14px] w-[13px]" aria-hidden>
      <path d="M7 0.6 12.7 2.4 V7.5 C12.7 11 10 13.4 7 14.4 4 13.4 1.3 11 1.3 7.5 V2.4 Z" fill={colors[0]} stroke="rgba(255,255,255,0.8)" strokeWidth="0.7" />
      <path d="M7 0.6 12.7 2.4 V7.5 C12.7 9 11.6 10.4 10.3 11.3 L7 6 Z" fill={colors[1]} opacity="0.85" />
      <circle cx="7" cy="6.4" r="1.5" fill="#f2d472" />
    </svg>
  );
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

  const cardW = compact ? "w-[clamp(36px,10vw,44px)]" : "w-[clamp(44px,12vw,64px)]";
  const portraitH = compact ? "h-[clamp(24px,6.5vw,32px)]" : "h-[clamp(28px,7.5vw,42px)]";

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
                    /* broadcast lineup card: portrait + crest/flag + white name ribbon */
                    <div
                      className={`relative ${cardW} overflow-hidden rounded-lg`}
                      style={{
                        border: `1.5px solid ${info.selected ? "#f2d472" : secondary ? ownSuit!.color : "rgba(255,255,255,0.4)"}`,
                        boxShadow: info.selected ? `0 0 18px ${board.slotGlow}` : "0 6px 14px rgba(0,0,0,0.5)",
                      }}
                    >
                      {/* portrait area */}
                      <div className={`relative flex ${portraitH} items-end justify-center overflow-hidden`}
                        style={{ background: `linear-gradient(165deg, ${player.colors[0]}, ${player.colors[1]})` }}>
                        <div className="absolute inset-0 bg-black/30" />
                        <Silhouette />
                        <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(115deg, rgba(255,255,255,0.22) 0%, transparent 42%)" }} />
                        {/* rating */}
                        {showRatings && (
                          <span className="absolute left-0.5 top-0.5 rounded px-1 font-display text-[0.58rem] font-extrabold leading-tight text-[#08131f]"
                            style={{ background: "linear-gradient(150deg, #f2d472, #d4af37)" }}>{player.overall}</span>
                        )}
                        {/* crest / flag */}
                        <span className="absolute right-0.5 top-0.5">
                          <MiniBadge colors={player.colors} kind={board.badge} />
                        </span>
                        {/* initials */}
                        <span className="relative z-[1] pb-0.5 font-display text-[0.86rem] font-extrabold leading-none text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
                          {initials(player.name)}
                        </span>
                        {/* secondary-position flag */}
                        {secondary && (
                          <span className="absolute bottom-0.5 left-0.5 grid h-3 w-3 place-items-center rounded-full text-[0.44rem] font-black"
                            style={{ background: ownSuit!.color, color: "#08131f" }} title={ownSuit!.label}>2</span>
                        )}
                      </div>
                      {/* white name ribbon */}
                      <div className="bg-[#f4f7ff] px-0.5 pb-[2px] pt-[1px] text-center">
                        <div className="truncate text-[0.5rem] font-extrabold leading-tight text-[#0a1428]">{surname(player.name)}</div>
                        <div className="text-[0.42rem] font-bold uppercase leading-tight tracking-[0.08em]" style={{ color: board.nameAccent }}>
                          {slot.pos}{!compact && player.seasonLabel ? ` · ${player.seasonLabel}` : ""}
                        </div>
                      </div>
                    </div>
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
