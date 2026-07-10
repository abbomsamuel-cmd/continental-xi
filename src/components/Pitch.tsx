"use client";

import { motion } from "framer-motion";
import type { Formation, Player } from "@/lib/types";
import { computeChemistry } from "@/lib/chemistry";

function initials(name: string): string {
  const parts = name.split(" ");
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

function surname(name: string): string {
  return name.split(" ").pop() ?? name;
}

// FIFA-style chemistry links: green = strong, lime = good, amber = weak.
const LINK_COLORS = ["transparent", "rgba(255,207,92,0.75)", "rgba(126,217,87,0.8)", "rgba(46,230,166,0.95)"];

export type PitchVariant = "cl" | "euro" | "copa";

interface Props {
  formation: Formation;
  players: (Player | null)[];
  activeSlot?: number;
  onSlotClick?: (i: number) => void;
  showChem?: boolean;
  showRatings?: boolean;
  /** per-competition art direction — CL broadcast blue, EURO glass hexagons,
   *  Copa painted mural with shield slots */
  variant?: PitchVariant;
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

export function Pitch({ formation, players, activeSlot, onSlotClick, showChem = true, showRatings = true, variant = "cl" }: Props) {
  const chem = showChem ? computeChemistry(formation, players) : null;
  const board = BOARD[variant];

  // EURO: silver lines connect neighbouring occupied hex platforms
  const euroLinks = variant === "euro"
    ? formation.slots.flatMap((a, i) =>
        formation.slots.slice(i + 1).map((b, jo) => ({ a, b, i, j: i + 1 + jo }))
          .filter(({ a, b, j }) => players[i] && players[j] && Math.hypot(a.x - b.x, (a.y - b.y) * 1.1) < 32))
    : [];

  return (
    <div className="relative mx-auto aspect-[3/4] w-full max-w-md">
      <div
        className="absolute inset-0 overflow-hidden rounded-2xl"
        style={{ background: board.bg, border: board.border, boxShadow: variant === "copa" ? "inset 0 0 40px rgba(255,201,60,0.08)" : undefined }}
      >
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

        {/* pitch markings */}
        <svg viewBox="0 0 100 133" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <g fill="none" stroke={board.line} strokeWidth={variant === "copa" ? 0.55 : 0.4}
            strokeDasharray={variant === "copa" ? "2.2 1.3" : undefined}>
            <rect x="4" y="4" width="92" height="125" />
            <line x1="4" y1="66.5" x2="96" y2="66.5" />
            <circle cx="50" cy="66.5" r="11" />
            <circle cx="50" cy="66.5" r="0.8" fill={board.line} />
            <rect x="28" y="4" width="44" height="20" />
            <rect x="28" y="109" width="44" height="20" />
            <rect x="40" y="4" width="20" height="8" />
            <rect x="40" y="121" width="20" height="8" />
          </g>
        </svg>

        {/* chemistry links (CL) */}
        {chem && (
          <svg viewBox="0 0 100 133" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            {chem.links.filter((l) => l.strength > 0).map((l, i) => {
              const a = formation.slots[l.a];
              const b = formation.slots[l.b];
              return (
                <motion.line
                  key={i}
                  x1={a.x} y1={133 - a.y * 1.33} x2={b.x} y2={133 - b.y * 1.33}
                  stroke={LINK_COLORS[l.strength]}
                  strokeWidth={0.35 + l.strength * 0.28}
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: i * 0.03 }}
                />
              );
            })}
          </svg>
        )}

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

      {/* player cards */}
      {formation.slots.map((slot, i) => {
        const player = players[i];
        const active = activeSlot === i;
        return (
          <button
            key={i}
            onClick={() => onSlotClick?.(i)}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 focus:outline-none"
            style={{ left: `${slot.x}%`, top: `${100 - slot.y}%` }}
          >
            <motion.div
              initial={{ scale: 0, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 16, delay: i * 0.04 }}
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
                  /* CL broadcast card */
                  <div
                    className={`relative w-[62px] overflow-hidden rounded-xl ${active ? "ring-2 ring-gold" : ""}`}
                    style={{
                      boxShadow: active ? `0 0 18px ${board.slotGlow}` : "0 6px 16px rgba(0,0,0,0.55)",
                      background: `linear-gradient(160deg, ${player.colors[0]}, ${player.colors[1]})`,
                    }}
                  >
                    <div className="absolute inset-0 bg-black/45" />
                    <div className="relative flex items-start justify-between px-1.5 pt-1 leading-none">
                      {showRatings ? (
                        <span className="font-display text-[0.72rem] font-extrabold" style={{ color: ratingColor(player.overall) }}>
                          {player.overall}
                        </span>
                      ) : <span />}
                      {chem && (
                        <span
                          className="grid h-3.5 w-3.5 place-items-center rounded-full text-[0.46rem] font-extrabold text-[#041022]"
                          style={{ background: LINK_COLORS[Math.min(3, Math.max(1, Math.round(chem.perSlot[i] / 3.4))) as 1 | 2 | 3] }}
                        >
                          {chem.perSlot[i]}
                        </span>
                      )}
                    </div>
                    <div className="relative pb-1 pt-0.5 text-center font-display text-[0.9rem] font-extrabold leading-none text-white drop-shadow">
                      {initials(player.name)}
                    </div>
                    <div className="relative flex items-center justify-center gap-1 truncate bg-black/60 px-1 py-[2px] text-[0.5rem]">
                      <span className="font-bold uppercase tracking-wide text-cyan">{slot.pos}</span>
                      <span className="truncate font-semibold text-white/95">{surname(player.name)}</span>
                    </div>
                  </div>
                )
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
          </button>
        );
      })}
    </div>
  );
}
