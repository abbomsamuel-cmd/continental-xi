"use client";

import { motion } from "framer-motion";
import type { GameMode, Player } from "@/lib/types";

function initials(name: string): string {
  const parts = name.split(" ");
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

function ratingColor(ovr: number): string {
  if (ovr >= 90) return "#f2d472";
  if (ovr >= 85) return "#d4af37";
  if (ovr >= 80) return "#22e0ff";
  return "#9fb3d1";
}

const ATTR_LABELS: [keyof Player["attributes"], string][] = [
  ["pace", "PAC"], ["shooting", "SHO"], ["passing", "PAS"],
  ["dribbling", "DRI"], ["defending", "DEF"], ["physical", "PHY"],
];

interface Props {
  player: Player;
  mode: GameMode;
  onSelect?: () => void;
  selected?: boolean;
  compact?: boolean;
  index?: number;
}

export function PlayerCard({ player, mode, onSelect, selected, compact, index = 0 }: Props) {
  const expert = mode === "expert";
  const [c1, c2] = player.colors;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={!onSelect}
      initial={{ y: 18, scale: 0.97 }}
      animate={{ y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 130, damping: 16 }}
      whileHover={onSelect ? { y: -8, scale: 1.03 } : undefined}
      whileTap={onSelect ? { scale: 0.97 } : undefined}
      className={`group relative w-full overflow-hidden rounded-2xl p-[1.5px] text-left transition-shadow ${
        selected ? "ring-2 ring-gold" : ""
      } ${onSelect ? "cursor-pointer" : "cursor-default"}`}
      style={{ background: `linear-gradient(150deg, ${c1}, ${c2})` }}
    >
      <div className="relative h-full rounded-2xl bg-[#050e22]/92 p-3 shimmer">
        {/* header row: rating + position */}
        <div className="flex items-start justify-between">
          <div className="leading-none">
            {!expert ? (
              <div className="font-display text-3xl font-extrabold" style={{ color: ratingColor(player.overall) }}>
                {player.overall}
              </div>
            ) : (
              <div className="font-display text-3xl font-extrabold text-muted">?</div>
            )}
            <div className="mt-0.5 text-[0.6rem] font-bold tracking-widest text-muted">
              {player.position}
            </div>
          </div>
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-sm font-extrabold"
            style={{ background: `linear-gradient(150deg, ${c1}, ${c2})`, color: "#fff" }}
          >
            {initials(player.name)}
          </div>
        </div>

        {/* name */}
        <div className="mt-2">
          <div className="font-display text-[0.95rem] font-bold leading-tight">{player.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[0.65rem] text-muted">
            <span>{player.nationality}</span>
            <span className="opacity-40">•</span>
            <span>{player.foot[0]}</span>
          </div>
        </div>

        {/* club + season (always shown, this is the expert challenge) */}
        <div className="mt-2 rounded-lg bg-white/5 px-2 py-1.5">
          <div className="text-[0.72rem] font-bold text-white">{player.club}</div>
          <div className="text-[0.62rem] text-cyan">{player.seasonLabel} · {player.league}</div>
        </div>

        {/* attributes — hidden in expert */}
        {!expert && !compact && (
          <div className="mt-2 grid grid-cols-3 gap-x-2 gap-y-1">
            {ATTR_LABELS.map(([k, label]) => (
              <div key={k} className="flex items-center justify-between text-[0.68rem]">
                <span className="text-muted">{label}</span>
                <span className="font-bold text-white">{player.attributes[k]}</span>
              </div>
            ))}
          </div>
        )}

        {/* stats footer */}
        <div className="mt-2 flex items-center justify-between border-t border-white/8 pt-1.5 text-[0.62rem] text-muted">
          {player.position === "GK" && player.cleanSheets !== undefined ? (
            <span>🧤 {player.cleanSheets} CS</span>
          ) : (
            <span>⚽ {player.goals}G · {player.assists}A</span>
          )}
          {!expert ? (
            <span className="flex gap-1.5">
              <span>SM {player.skillMoves}★</span>
              <span>WF {player.weakFoot}★</span>
            </span>
          ) : (
            <span className="text-cyan">Expert</span>
          )}
        </div>

        {onSelect && (
          <div className="pointer-events-none absolute inset-x-3 bottom-2 translate-y-3 rounded-lg bg-gold py-1 text-center text-[0.65rem] font-extrabold uppercase tracking-widest text-[#041022] opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
            Lock In
          </div>
        )}
      </div>
    </motion.button>
  );
}
