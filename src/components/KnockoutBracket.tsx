"use client";

import { motion } from "framer-motion";
import type { KOTie, TournamentState } from "@/lib/types";
import { USER_TEAM_ID, teamLabel } from "@/lib/engine/tournament";
import { TeamBadge } from "@/components/TeamBadge";
import { CrestLogo } from "@/components/CrestLogo";

const ROUND_ORDER: KOTie["round"][] = ["Play-off", "Round of 16", "Quarter-final", "Semi-final", "Final"];
const ROUND_LABEL: Record<KOTie["round"], string> = {
  "Play-off": "KNOCKOUT PLAY-OFF",
  "Round of 16": "ROUND OF 16",
  "Quarter-final": "QUARTER-FINAL",
  "Semi-final": "SEMI-FINAL",
  "Final": "THE FINAL",
};

function TieCard({ tie, tournament, onClick, index }: { tie: KOTie; tournament: TournamentState; onClick?: () => void; index: number }) {
  const a = tournament.teams[tie.teamA];
  const b = tournament.teams[tie.teamB];
  const twoLeg = !!(tie.leg1 && tie.leg2);
  const aAgg = tie.leg1 && tie.leg2 ? tie.leg1.awayGoals + tie.leg2.homeGoals : tie.leg1 ? tie.leg1.homeGoals : null;
  const bAgg = tie.leg1 && tie.leg2 ? tie.leg1.homeGoals + tie.leg2.awayGoals : tie.leg1 ? tie.leg1.awayGoals : null;
  const pens = tie.leg2?.penalties ?? tie.leg1?.penalties;
  const played = aAgg !== null;
  const userWon = tie.winner === USER_TEAM_ID;
  const isFinal = tie.round === "Final";

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`cl-panel cl-streaks relative w-full overflow-hidden rounded-2xl p-4 text-left ${
        onClick ? "hover:brightness-110" : ""
      } ${tie.winner && !userWon ? "opacity-90" : ""}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="cl-heading text-[0.6rem] tracking-[0.25em] text-cyan">{ROUND_LABEL[tie.round]}</span>
        {isFinal && <span className="text-lg">🏆</span>}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TeamBadge colors={a.colors} code={a.short} size={40} />
          <span className={`truncate text-sm font-bold ${userWon ? "text-gold" : "text-white"}`}>{teamLabel(a)}</span>
        </div>
        <div className="px-2 text-center">
          {played ? (
            <div className="cl-heading text-2xl text-white">
              {aAgg}<span className="mx-1 text-white/50">-</span>{bAgg}
            </div>
          ) : (
            <div className="cl-heading text-lg text-white/40">vs</div>
          )}
          {pens && <div className="text-[0.6rem] font-bold text-gold">pens {pens[0]}-{pens[1]}</div>}
          {twoLeg && <div className="text-[0.55rem] uppercase tracking-widest text-white/40">agg</div>}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
          <span className={`truncate text-sm font-bold ${tie.winner === b.id ? "text-gold" : "text-white"}`}>{teamLabel(b)}</span>
          <TeamBadge colors={b.colors} code={b.short} size={40} />
        </div>
      </div>

      {twoLeg && tie.leg1 && tie.leg2 && (
        <div className="mt-2 flex justify-center gap-3 text-[0.6rem] text-white/50">
          <span>1st leg {tie.leg1.homeGoals}-{tie.leg1.awayGoals}</span>
          <span>·</span>
          <span>2nd leg {tie.leg2.homeGoals}-{tie.leg2.awayGoals}</span>
        </div>
      )}

      {tie.winner && (
        <div className={`mt-2 text-center text-[0.62rem] font-bold uppercase tracking-widest ${userWon ? "text-green" : "text-danger"}`}>
          {userWon ? (isFinal ? "Champions of Europe" : "You advance") : "Knocked out"}
        </div>
      )}
      {onClick && played && (
        <div className="mt-1 text-center text-[0.55rem] text-cyan/70">tap for match detail</div>
      )}
    </motion.button>
  );
}

interface Props {
  tournament: TournamentState;
  onTieClick?: (tie: KOTie) => void;
}

/** The user's road to the final, styled after Champions League bracket graphics. */
export function KnockoutBracket({ tournament, onTieClick }: Props) {
  const ties = ROUND_ORDER
    .map((round) => tournament.ties.find((t) => t.round === round))
    .filter((t): t is KOTie => !!t);

  if (!ties.length) {
    return <p className="text-center text-sm text-muted">Your knockout road appears once the league phase ends.</p>;
  }

  return (
    <div className="relative mx-auto max-w-md">
      <div className="mb-4 flex flex-col items-center">
        <CrestLogo size={40} />
        <span className="cl-heading mt-1 text-xs tracking-[0.3em] text-white/70">Road to the Final</span>
      </div>
      <div className="relative flex flex-col gap-3">
        {/* connecting spine */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-gradient-to-b from-cyan/40 via-white/15 to-gold/40" />
        {ties.map((tie, i) => (
          <div key={i} className="relative z-10">
            <TieCard
              tie={tie}
              tournament={tournament}
              index={i}
              onClick={onTieClick && (tie.leg1 || tie.leg2) ? () => onTieClick(tie) : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
