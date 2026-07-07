"use client";

import { motion } from "framer-motion";
import type { Formation, Player } from "@/lib/types";
import { computeChemistry } from "@/lib/chemistry";

function initials(name: string): string {
  const parts = name.split(" ");
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

const LINK_COLORS = ["transparent", "rgba(159,179,209,0.4)", "rgba(34,224,255,0.6)", "rgba(212,175,55,0.9)"];

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
  if (ovr >= 85) return "#d4af37";
  if (ovr >= 80) return "#22e0ff";
  return "#9fb3d1";
}

export function Pitch({ formation, players, activeSlot, onSlotClick, showChem = true, showRatings = true }: Props) {
  const chem = showChem ? computeChemistry(formation, players) : null;

  return (
    <div className="relative mx-auto aspect-[3/4] w-full max-w-md">
      {/* pitch */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl gold-border"
        style={{
          background:
            "repeating-linear-gradient(0deg, #0a3d1f 0px, #0a3d1f 40px, #0c471f 40px, #0c471f 80px)",
        }}
      >
        <div className="absolute inset-0 opacity-90"
          style={{ background: "radial-gradient(120% 80% at 50% 0%, rgba(34,224,255,0.12), transparent 55%)" }} />
        {/* pitch markings */}
        <svg viewBox="0 0 100 133" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <g fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4">
            <rect x="4" y="4" width="92" height="125" />
            <line x1="4" y1="66.5" x2="96" y2="66.5" />
            <circle cx="50" cy="66.5" r="11" />
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
                  strokeWidth={l.strength * 0.35}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: i * 0.03 }}
                />
              );
            })}
          </svg>
        )}
      </div>

      {/* player tokens */}
      {formation.slots.map((slot, i) => {
        const player = players[i];
        const active = activeSlot === i;
        return (
          <button
            key={i}
            onClick={() => onSlotClick?.(i)}
            className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
            style={{ left: `${slot.x}%`, top: `${100 - slot.y}%` }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: i * 0.04 }}
              className={`relative grid place-items-center rounded-full text-center transition-all ${
                active ? "ring-2 ring-gold" : ""
              }`}
            >
              {player ? (
                <div
                  className="grid h-11 w-11 place-items-center rounded-full text-[0.62rem] font-extrabold shadow-lg sm:h-12 sm:w-12"
                  style={{
                    background: `linear-gradient(150deg, ${player.colors[0]}, ${player.colors[1]})`,
                    color: "#fff",
                    boxShadow: active ? "0 0 18px rgba(212,175,55,0.6)" : "0 4px 12px rgba(0,0,0,0.5)",
                  }}
                >
                  {initials(player.name)}
                  {showRatings && (
                    <span
                      className="absolute -left-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-[#050e22] text-[0.5rem] font-extrabold"
                      style={{ color: ratingColor(player.overall) }}
                    >
                      {player.overall}
                    </span>
                  )}
                  {chem && (
                    <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-[#050e22] text-[0.5rem] font-bold text-gold">
                      {chem.perSlot[i]}
                    </span>
                  )}
                </div>
              ) : (
                <div
                  className={`grid h-11 w-11 place-items-center rounded-full border-2 border-dashed text-[0.55rem] font-bold sm:h-12 sm:w-12 ${
                    active ? "border-gold text-gold animate-pulse" : "border-white/30 text-white/50"
                  }`}
                  style={{ background: "rgba(5,14,34,0.6)" }}
                >
                  {slot.pos}
                </div>
              )}
              <span className="mt-0.5 block max-w-[64px] truncate text-[0.55rem] font-semibold text-white/90 drop-shadow">
                {player ? player.name.split(" ").pop() : ""}
              </span>
            </motion.div>
          </button>
        );
      })}
    </div>
  );
}
