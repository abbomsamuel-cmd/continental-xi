"use client";

import { motion } from "framer-motion";
import type { TableRow, TournamentState } from "@/lib/types";
import { qualificationBand, teamLabel } from "@/lib/engine/tournament";
import { TeamBadge } from "@/components/TeamBadge";

const BAND_STYLES: Record<string, { bar: string; label: string }> = {
  direct: { bar: "#2ee6a6", label: "Round of 16" },
  playoff: { bar: "#ffcf5c", label: "Play-offs" },
  out: { bar: "#ff5a6a", label: "Eliminated" },
};

// Section headers dropped in at the band boundaries, like the CL standings graphic.
const BAND_HEADER: Record<number, { text: string; color: string }> = {
  1: { text: "Straight to Round of 16", color: "#2ee6a6" },
  9: { text: "Knockout Phase Play-off Places", color: "#ffcf5c" },
  25: { text: "Elimination Places", color: "#ff5a6a" },
};

function FormDots({ form }: { form: ("W" | "D" | "L")[] }) {
  const color = { W: "#2ee6a6", D: "#9fb3d1", L: "#ff5a6a" };
  return (
    <div className="flex gap-0.5">
      {form.length === 0 && <span className="text-[0.6rem] text-muted">—</span>}
      {form.map((f, i) => (
        <span key={i} className="grid h-3.5 w-3.5 place-items-center rounded-full text-[0.5rem] font-bold text-[#041022]"
          style={{ background: color[f] }}>{f}</span>
      ))}
    </div>
  );
}

interface Props {
  rows: TableRow[];
  tournament: TournamentState;
  highlightUser?: boolean;
}

export function LeagueTable({ rows, tournament, highlightUser = true }: Props) {
  const prev = tournament.prevPositions;

  return (
    <div className="cl-panel overflow-hidden rounded-2xl">
      <div className="grid grid-cols-[28px_1fr_repeat(5,26px)_38px_40px] items-center gap-1 border-b border-white/10 px-3 py-2 text-[0.58rem] font-bold uppercase tracking-wider text-muted sm:grid-cols-[28px_1fr_repeat(7,28px)_44px_46px_90px] sm:text-[0.6rem]">
        <span>#</span>
        <span>Club</span>
        <span className="text-center">P</span>
        <span className="hidden text-center sm:block">W</span>
        <span className="hidden text-center sm:block">D</span>
        <span className="hidden text-center sm:block">L</span>
        <span className="text-center">GF</span>
        <span className="text-center">GA</span>
        <span className="text-center">GD</span>
        <span className="text-center text-cyan">Pts</span>
        <span className="hidden text-center sm:block">Form</span>
      </div>

      <div className="max-h-[560px] overflow-y-auto">
        {rows.map((r, i) => {
          const pos = i + 1;
          const band = qualificationBand(pos);
          const team = tournament.teams[r.teamId];
          const isUser = team.isUser;
          const moved = prev ? prev[r.teamId] - pos : 0;
          const header = BAND_HEADER[pos];
          return (
            <div key={r.teamId}>
              {header && (
                <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: header.color }} />
                  <span className="cl-heading text-[0.55rem] tracking-[0.2em]" style={{ color: header.color }}>{header.text}</span>
                  <span className="h-px flex-1" style={{ background: `${header.color}40` }} />
                </div>
              )}
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 130, damping: 20 }}
              className={`grid grid-cols-[28px_1fr_repeat(5,26px)_38px_40px] items-center gap-1 border-b border-white/5 px-3 py-2 text-xs sm:grid-cols-[28px_1fr_repeat(7,28px)_44px_46px_90px] ${
                isUser && highlightUser ? "bg-cyan/15" : "hover:bg-white/4"
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="h-4 w-1 rounded-full" style={{ background: BAND_STYLES[band].bar }} />
                <span className={`font-bold ${isUser ? "text-cyan" : "text-white/70"}`}>{pos}</span>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <TeamBadge colors={team.colors} code={team.short} size={20} />
                <span className={`truncate font-semibold ${isUser ? "text-cyan" : "text-white/90"}`}>
                  {isUser ? `${team.name} ★` : teamLabel(team)}
                </span>
                {moved !== 0 && (
                  <span className={`text-[0.6rem] ${moved > 0 ? "text-green" : "text-danger"}`}>
                    {moved > 0 ? "▲" : "▼"}
                  </span>
                )}
              </div>
              <span className="text-center text-white/70">{r.played}</span>
              <span className="hidden text-center text-white/70 sm:block">{r.won}</span>
              <span className="hidden text-center text-white/70 sm:block">{r.drawn}</span>
              <span className="hidden text-center text-white/70 sm:block">{r.lost}</span>
              <span className="text-center text-white/70">{r.gf}</span>
              <span className="text-center text-white/70">{r.ga}</span>
              <span className="text-center text-white/70">{r.gf - r.ga > 0 ? "+" : ""}{r.gf - r.ga}</span>
              <span className="text-center font-display font-extrabold text-cyan">{r.points}</span>
              <div className="hidden justify-center sm:flex"><FormDots form={r.form} /></div>
            </motion.div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-white/10 px-3 py-2 text-[0.6rem] text-muted">
        {Object.entries(BAND_STYLES).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: v.bar }} /> {v.label}
          </span>
        ))}
      </div>
    </div>
  );
}
