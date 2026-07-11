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

interface Props {
  formation: Formation;
  players: (Player | null)[];
  activeSlot?: number;
  onSlotClick?: (i: number) => void;
  showRatings?: boolean;
  /** per-competition art direction — CL broadcast blue, EURO glass hexagons,
   *  Copa painted mural with shield slots */
  variant?: PitchVariant;
  /** placement mode: the player being placed — empty slots light up with
   *  green/yellow/red suitability and the rest of the board steps back */
  placing?: { position: Position; altPositions: Position[] } | null;
  /** slot index wearing the armband */
  captainSlot?: number;
}

function ratingColor(ovr: number): string {
  if (ovr >= 90) return "#f2d472";
  if (ovr >= 85) return "#ffd86b";
  if (ovr >= 80) return "#7ff0ff";
  return "#c8d6f0";
}

/* each competition paints its own board */
const BOARD: Record<PitchVariant, {
  bg: string; border: string; line: string; accent: string; slotGlow: string;
  clip?: string; // slot silhouette (shield / hexagon)
}> = {
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
    clip: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
  },
  copa: {
    bg: "radial-gradient(120% 80% at 50% -10%, rgba(255,138,61,0.22), transparent 55%), repeating-linear-gradient(0deg, #0a2e1c 0px, #0a2e1c 42px, #0d3a24 42px, #0d3a24 84px)",
    border: "1px solid rgba(255,201,60,0.45)",
    line: "rgba(255,214,120,0.38)",
    accent: "#ffc93c",
    slotGlow: "rgba(255,201,60,0.7)",
    clip: "polygon(50% 0%, 100% 14%, 100% 66%, 50% 100%, 0% 66%, 0% 14%)",
  },
};

export function Pitch({ formation, players, activeSlot, onSlotClick, showRatings = true, variant = "cl", placing = null, captainSlot }: Props) {
  // tolerate any unexpected variant value (e.g. a stale save) — never crash the board
  const board = BOARD[variant] ?? BOARD.cl;

  // EURO: silver lines connect neighbouring occupied hex platforms
  const euroLinks = variant === "euro"
    ? formation.slots.flatMap((a, i) =>
        formation.slots.slice(i + 1).map((b, jo) => ({ a, b, i, j: i + 1 + jo }))
          .filter(({ a, b, j }) => players[i] && players[j] && Math.hypot(a.x - b.x, (a.y - b.y) * 1.1) < 32))
    : [];

  return (
    <div
      className="relative mx-auto aspect-[3/4] w-full max-w-md"
      style={{ transform: "perspective(1100px) rotateX(2.5deg)", transformStyle: "preserve-3d" }}
    >
      <div
        className="absolute inset-0 overflow-hidden rounded-2xl"
        style={{ background: board.bg, border: board.border, boxShadow: variant === "copa" ? "inset 0 0 40px rgba(255,201,60,0.08)" : "inset 0 0 50px rgba(0,0,0,0.35)" }}
      >
        {/* stadium floodlights washing the top corners + grounding vignette */}
        <div className="pointer-events-none absolute inset-0" aria-hidden
          style={{
            background:
              `radial-gradient(42% 30% at 8% 0%, ${board.accent}1c, transparent 70%),` +
              `radial-gradient(42% 30% at 92% 0%, ${board.accent}1c, transparent 70%),` +
              "radial-gradient(120% 45% at 50% 108%, rgba(0,0,0,0.45), transparent 65%)",
          }} />
        {/* EURO: architectural hex lattice · Copa: crowd + confetti flecks */}
        {variant === "euro" && (
          <div className="absolute inset-0 opacity-20" aria-hidden
            style={{
              backgroundImage: "radial-gradient(rgba(140,190,255,0.8) 1px, transparent 1.4px)",
              backgroundSize: "24px 21px",
              maskImage: "linear-gradient(to bottom, #000, transparent 80%)",
              WebkitMaskImage: "linear-gradient(to bottom, #000, transparent 80%)",
            }} />
        )}
        {variant === "copa" && (
          <>
            {/* crowd silhouette band along the top */}
            <div className="absolute inset-x-0 top-0 h-10 opacity-60" aria-hidden
              style={{
                background: "radial-gradient(8px 8px at 10% 80%, #041a10 60%, transparent), radial-gradient(9px 9px at 24% 70%, #051f13 60%, transparent), linear-gradient(to bottom, rgba(2,12,7,0.9), transparent)",
              }} />
            {/* painted confetti flecks around the edges */}
            {Array.from({ length: 16 }, (_, i) => (
              <span key={i} aria-hidden className="absolute h-1.5 w-1 rounded-[1px]"
                style={{
                  left: `${(i * 61) % 100}%`,
                  top: i % 2 ? `${2 + (i * 7) % 10}%` : `${88 + (i * 5) % 10}%`,
                  background: ["#ffc93c", "#ff8a3d", "#17c97a", "#fff"][i % 4],
                  opacity: 0.5,
                  transform: `rotate(${(i * 47) % 90}deg)`,
                }} />
            ))}
          </>
        )}

        {/* pitch markings — boxes, arcs, corners, spots */}
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
            {/* penalty arcs */}
            <path d="M 42 24 A 9.5 9.5 0 0 0 58 24" />
            <path d="M 42 109 A 9.5 9.5 0 0 1 58 109" />
            {/* penalty spots */}
            <circle cx="50" cy="17" r="0.7" fill={board.line} />
            <circle cx="50" cy="116" r="0.7" fill={board.line} />
            {/* corner arcs */}
            <path d="M 4 8 A 4 4 0 0 0 8 4" />
            <path d="M 92 4 A 4 4 0 0 0 96 8" />
            <path d="M 8 129 A 4 4 0 0 0 4 125" />
            <path d="M 96 125 A 4 4 0 0 0 92 129" />
          </g>
        </svg>

        {/* silver architecture links (EURO) */}
        {euroLinks.length > 0 && (
          <svg viewBox="0 0 100 133" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            {euroLinks.map(({ a, b }, i) => (
              <motion.line
                key={i}
                x1={a.x} y1={133 - a.y * 1.33} x2={b.x} y2={133 - b.y * 1.33}
                stroke="rgba(219,230,255,0.4)"
                strokeWidth={0.35}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
              />
            ))}
          </svg>
        )}
      </div>

      {/* player cards — keyed by player so replacements animate in and out */}
      {formation.slots.map((slot, i) => {
        const player = players[i];
        const active = activeSlot === i;
        // placement mode: how well would the incoming player fit THIS slot?
        const suit = placing ? suitability(placing.position, placing.altPositions, slot.pos) : null;
        const placeTarget = !!placing && !player;
        return (
          <button
            key={i}
            onClick={() => onSlotClick?.(i)}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-opacity focus:outline-none"
            style={{
              left: `${slot.x}%`,
              top: `${100 - slot.y}%`,
              opacity: placing && player ? 0.35 : 1,
              pointerEvents: placing && player ? "none" : undefined,
            }}
          >
            {/* soft grounding shadow under the card */}
            {player && (
              <span
                aria-hidden
                className="absolute left-1/2 top-full h-2.5 w-12 -translate-x-1/2 -translate-y-1 rounded-full"
                style={{ background: "radial-gradient(50% 100% at 50% 50%, rgba(0,0,0,0.55), transparent 70%)", filter: "blur(1.5px)" }}
              />
            )}
            {/* the armband */}
            {player && captainSlot === i && (
              <span
                className="absolute -right-2 -top-2 z-20 grid h-5 w-5 place-items-center rounded-full font-display text-[0.62rem] font-extrabold text-[#041022]"
                style={{ background: "linear-gradient(150deg, #f2d472, #d4af37)", boxShadow: "0 2px 8px rgba(0,0,0,0.55)" }}
                title="Captain"
              >
                C
              </span>
            )}
            {/* suitability pip — only when the player is not in his natural role */}
            {player && (() => {
              const s = suitability(player.position, player.altPositions, slot.pos);
              return s.level !== "natural" ? (
                <span
                  className="absolute -left-1.5 -top-1.5 z-20 h-3 w-3 rounded-full"
                  style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }}
                  title={s.label}
                />
              ) : null;
            })()}
            <AnimatePresence mode="popLayout">
            <motion.div
              key={player ? player.id : placeTarget ? "target" : "empty"}
              initial={{ scale: 0.35, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.55, y: -10, opacity: 0 }}
              whileHover={player ? { y: -4, scale: 1.07 } : undefined}
              transition={{ type: "spring", stiffness: 230, damping: 17, delay: player ? 0 : i * 0.02 }}
            >
              {player ? (
                board.clip ? (
                  /* shield (Copa) / hexagon (EURO) platform + name plate below */
                  <div className="flex flex-col items-center">
                    <div
                      className="relative"
                      style={{
                        clipPath: board.clip,
                        background: active ? board.accent : `linear-gradient(160deg, ${board.accent}, ${board.accent}44)`,
                        padding: 2,
                        filter: `drop-shadow(0 0 ${active ? 14 : 8}px ${board.slotGlow})`,
                      }}
                    >
                      <div
                        className="flex h-[54px] w-[58px] flex-col items-center justify-center"
                        style={{ clipPath: board.clip, background: `linear-gradient(160deg, ${player.colors[0]}, ${player.colors[1]})` }}
                      >
                        <div className="absolute inset-0 bg-black/40" style={{ clipPath: board.clip }} />
                        {showRatings && (
                          <span className="relative font-display text-[0.72rem] font-extrabold leading-none" style={{ color: ratingColor(player.overall) }}>
                            {player.overall}
                          </span>
                        )}
                        <span className="relative font-display text-[0.85rem] font-extrabold leading-tight text-white drop-shadow">
                          {initials(player.name)}
                        </span>
                        <span className="relative text-[0.44rem] font-bold uppercase tracking-widest" style={{ color: board.accent }}>
                          {slot.pos}
                        </span>
                      </div>
                    </div>
                    <span className="mt-0.5 max-w-[70px] truncate rounded-md bg-black/60 px-1.5 py-[1.5px] text-[0.5rem] font-semibold text-white/95">
                      {surname(player.name)}
                    </span>
                  </div>
                ) : (
                  /* CL broadcast card — official-lineup finish */
                  <div
                    className={`relative w-[66px] overflow-hidden rounded-xl ${active ? "ring-2 ring-gold" : ""}`}
                    style={{
                      boxShadow: active
                        ? `0 0 18px ${board.slotGlow}`
                        : "0 10px 22px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.22)",
                      background: `linear-gradient(160deg, ${player.colors[0]}, ${player.colors[1]})`,
                      border: "1px solid rgba(255,255,255,0.22)",
                    }}
                  >
                    <div className="absolute inset-0 bg-black/45" />
                    {/* glass sheen */}
                    <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(115deg, rgba(255,255,255,0.16) 0%, transparent 38%)" }} />
                    <div className="relative flex items-start justify-between px-1 pt-1 leading-none">
                      {showRatings ? (
                        <span
                          className="rounded-md px-1 py-[1.5px] font-display text-[0.7rem] font-extrabold text-[#041022]"
                          style={{ background: "linear-gradient(150deg, #f2d472, #d4af37)", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
                        >
                          {player.overall}
                        </span>
                      ) : <span />}
                    </div>
                    <div className="relative pb-0.5 pt-1 text-center font-display text-[0.95rem] font-extrabold leading-none text-white drop-shadow">
                      {initials(player.name)}
                    </div>
                    <div className="relative mt-0.5 bg-black/60 px-1 pb-[3px] pt-[2px] text-center">
                      <div className="truncate text-[0.52rem] font-bold leading-tight text-white/95">{surname(player.name)}</div>
                      <div className="text-[0.44rem] font-bold uppercase tracking-[0.14em] text-cyan/90">
                        {slot.pos} · {player.seasonLabel}
                      </div>
                    </div>
                  </div>
                )
              ) : placeTarget && suit ? (
                /* placement target — suitability-lit, pulsing (CSS so exits
                   never hang), tappable */
                <div
                  className="flex h-[58px] w-[62px] animate-pulse flex-col items-center justify-center gap-0.5 rounded-xl"
                  style={{
                    background: `${suit.color}1f`,
                    border: `2px solid ${suit.color}`,
                    boxShadow: `0 0 16px ${suit.color}66`,
                    animationDuration: "1.6s",
                  }}
                >
                  <span className="font-display text-[0.72rem] font-extrabold" style={{ color: suit.color }}>{slot.pos}</span>
                  <span className="text-[0.42rem] font-bold uppercase tracking-wider" style={{ color: suit.color }}>
                    {suit.icon} {suit.label}
                  </span>
                  <span className="text-[0.44rem] font-bold text-white/70">{Math.round(suit.mult * 100)}%</span>
                </div>
              ) : (
                <div
                  className={`grid h-[52px] w-[60px] place-items-center text-[0.6rem] font-bold ${
                    board.clip ? "" : "rounded-xl border border-dashed"
                  } ${active ? "border-gold text-gold" : "border-white/35 text-white/55"}`}
                  style={{
                    background: board.clip ? `${board.accent}14` : "rgba(6,18,50,0.55)",
                    clipPath: board.clip,
                    boxShadow: board.clip ? `inset 0 0 0 1.5px ${active ? board.accent : "rgba(255,255,255,0.28)"}` : undefined,
                    color: active ? board.accent : undefined,
                  }}
                >
                  {slot.pos}
                </div>
              )}
            </motion.div>
            </AnimatePresence>
          </button>
        );
      })}
    </div>
  );
}
