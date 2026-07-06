"use client";

import { motion } from "framer-motion";
import type { KOTie, TournamentState } from "@/lib/types";
import { USER_TEAM_ID } from "@/lib/engine/tournament";

const ROUND_ORDER: KOTie["round"][] = ["Play-off", "Round of 16", "Quarter-final", "Semi-final", "Final"];

function TieRow({ tie, id, goals, tournament }: { tie: KOTie; id: string; goals: number | null; tournament: TournamentState }) {
  const t = tournament.teams[id];
  const won = tie.winner === id;
  return (
    <div className={`flex items-center justify-between gap-2 px-2 py-1 ${won ? "text-gold" : tie.winner ? "text-muted" : "text-white/85"}`}>
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="h-3.5 w-3.5 shrink-0 rounded" style={{ background: `linear-gradient(150deg, ${t.colors[0]}, ${t.colors[1]})` }} />
        <span className="truncate text-[0.72rem] font-semibold">{t.name}{t.isUser ? " ★" : ""}</span>
      </div>
      <span className="font-display text-sm font-bold">{goals ?? "–"}</span>
    </div>
  );
}

function TieCard({ tie, tournament, onClick }: { tie: KOTie; tournament: TournamentState; onClick?: () => void }) {
  const aGoals = tie.leg1 && tie.leg2 ? tie.leg1.awayGoals + tie.leg2.homeGoals : tie.leg1 ? tie.leg1.homeGoals : null;
  const bGoals = tie.leg1 && tie.leg2 ? tie.leg1.homeGoals + tie.leg2.awayGoals : tie.leg1 ? tie.leg1.awayGoals : null;
  const involvesUser = tie.teamA === USER_TEAM_ID || tie.teamB === USER_TEAM_ID;

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      className={`w-full rounded-xl border text-left ${involvesUser ? "border-gold/50 bg-gold/8" : "border-white/10 bg-white/4"} ${onClick ? "hover:border-cyan/50" : ""}`}
    >
      <TieRow tie={tie} id={tie.teamA} goals={aGoals} tournament={tournament} />
      <div className="h-px bg-white/8" />
      <TieRow tie={tie} id={tie.teamB} goals={bGoals} tournament={tournament} />
    </motion.button>
  );
}

interface Props {
  tournament: TournamentState;
  onTieClick?: (tie: KOTie) => void;
}

export function KnockoutBracket({ tournament, onTieClick }: Props) {
  const byRound = ROUND_ORDER.map((round) => ({
    round,
    ties: tournament.ties.filter((t) => t.round === round),
  })).filter((g) => g.ties.length);

  if (!byRound.length) {
    return <p className="text-center text-sm text-muted">Knockout ties appear once the league phase ends.</p>;
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-3">
      {byRound.map((group) => (
        <div key={group.round} className="min-w-[180px] flex-1">
          <h3 className="mb-2 text-center text-[0.65rem] font-bold uppercase tracking-widest text-cyan">
            {group.round}
          </h3>
          <div className="flex flex-col justify-around gap-2 h-full">
            {group.ties.map((tie, i) => (
              <TieCard key={i} tie={tie} tournament={tournament}
                onClick={onTieClick && (tie.leg1 || tie.leg2) ? () => onTieClick(tie) : undefined} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
