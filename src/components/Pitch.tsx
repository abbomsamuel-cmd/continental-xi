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

interface Props {
  formation: Formation;
  players: (Player | null)[];
  activeSlot?: number;
  onSlotClick?: (i: number) => void;
  showChem?: boolean;
  showRatings?: boolean;
}

function ratingColor(ovr: number): string {
  if (ovr >= 90) return "#f2d472";
  if (ovr >= 85) return "#ffd86b";
  if (ovr >= 80) return "#7ff0ff";
  return "#c8d6f0";
}

export function Pitch({ formation, players, activeSlot, onSlotClick, showChem = true, showRatings = true }: Props) {
  const chem = showChem ? computeChemistry(formation, players) : null;

  return (
    <div className="relative mx-auto aspect-[3/4] w-full max-w-md">
      {/* deep-blue broadcast pitch */}
      <div
        className="absolute inset-0 overflow-hidden rounded-2xl"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, rgba(41,98,255,0.30), transparent 55%), repeating-linear-gradient(0deg, #071747 0px, #071747 42px, #0a1d55 42px, #0a1d55 84px)",
          border: "1px solid rgba(120,160,255,0.25)",
        }}
      >
        {/* pitch markings */}
        <svg viewBox="0 0 100 133" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <g fill="none" stroke="rgba(180,205,255,0.30)" strokeWidth="0.4">
            <rect x="4" y="4" width="92" height="125" />
            <line x1="4" y1="66.5" x2="96" y2="66.5" />
            <circle cx="50" cy="66.5" r="11" />
            <circle cx="50" cy="66.5" r="0.8" fill="rgba(180,205,255,0.4)" />
            <rect x="28" y="4" width="44" height="20" />
            <rect x="28" y="109" width="44" height="20" />
            <rect x="40" y="4" width="20" height="8" />
            <rect x="40" y="121" width="20" height="8" />
          </g>
        </svg>

        {/* chemistry links */}
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
                <div
                  className={`relative w-[52px] overflow-hidden rounded-[10px] ${active ? "ring-2 ring-gold" : ""}`}
                  style={{
                    boxShadow: active ? "0 0 16px rgba(212,175,55,0.6)" : "0 5px 14px rgba(0,0,0,0.5)",
                    background: `linear-gradient(160deg, ${player.colors[0]}, ${player.colors[1]})`,
                  }}
                >
                  <div className="absolute inset-0 bg-black/45" />
                  <div className="relative px-1 pt-0.5">
                    <div className="flex items-center justify-between leading-none">
                      {showRatings ? (
                        <span className="font-display text-[0.62rem] font-extrabold" style={{ color: ratingColor(player.overall) }}>
                          {player.overall}
                        </span>
                      ) : <span />}
                      <span className="text-[0.5rem] font-bold uppercase tracking-wide text-cyan">{slot.pos}</span>
                    </div>
                    <div className="py-0.5 text-center font-display text-[0.72rem] font-extrabold leading-none text-white drop-shadow">
                      {initials(player.name)}
                    </div>
                  </div>
                  <div className="relative truncate bg-black/55 px-1 py-[1px] text-center text-[0.5rem] font-semibold text-white/95">
                    {surname(player.name)}
                  </div>
                  {chem && (
                    <span
                      className="absolute right-0 top-0 grid h-3 w-3 place-items-center rounded-bl-[6px] text-[0.42rem] font-bold text-[#041022]"
                      style={{ background: LINK_COLORS[Math.min(3, Math.max(1, Math.round(chem.perSlot[i] / 3.4))) as 1 | 2 | 3] }}
                    >
                      {chem.perSlot[i]}
                    </span>
                  )}
                </div>
              ) : (
                <div
                  className={`grid h-11 w-[52px] place-items-center rounded-[10px] border border-dashed text-[0.55rem] font-bold ${
                    active ? "border-gold text-gold" : "border-white/35 text-white/55"
                  }`}
                  style={{ background: "rgba(6,18,50,0.55)" }}
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
