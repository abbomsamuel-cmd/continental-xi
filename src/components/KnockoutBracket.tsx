"use client";

import { motion } from "framer-motion";
import type { KOTie, TournamentState } from "@/lib/types";
import { USER_TEAM_ID, teamLabel } from "@/lib/engine/tournament";
import { TeamBadge } from "@/components/TeamBadge";
import { CrestLogo } from "@/components/CrestLogo";

interface Props {
  tournament: TournamentState;
  onTieClick?: (tie: KOTie) => void;
}

/** Aggregate goals for teamA / teamB of a tie (single-leg final = leg1 only). */
function agg(tie: KOTie): [number | null, number | null] {
  if (tie.leg1 && tie.leg2) return [tie.leg1.awayGoals + tie.leg2.homeGoals, tie.leg1.homeGoals + tie.leg2.awayGoals];
  if (tie.leg1) return [tie.leg1.homeGoals, tie.leg1.awayGoals];
  return [null, null];
}

function TeamRow({ id, tie, tournament, goals }: { id: string; tie: KOTie; tournament: TournamentState; goals: number | null }) {
  const t = tournament.teams[id];
  const won = tie.winner === id;
  const decided = !!tie.winner;
  return (
    <div className={`flex items-center justify-between gap-1 px-1.5 py-1 ${won ? "text-gold" : decided ? "text-white/45" : "text-white/90"}`}>
      <span className="flex min-w-0 items-center gap-1">
        <TeamBadge colors={t.colors} code={t.short} size={16} />
        <span className="truncate text-[0.58rem] font-bold leading-tight">
          {t.isUser ? `${t.name} ★` : teamLabel(t)}
        </span>
      </span>
      <span className="font-display text-[0.68rem] font-extrabold">{goals ?? ""}</span>
    </div>
  );
}

function MiniTie({ tie, tournament, onClick }: { tie: KOTie; tournament: TournamentState; onClick?: () => void }) {
  const [aAgg, bAgg] = agg(tie);
  const user = tie.teamA === USER_TEAM_ID || tie.teamB === USER_TEAM_ID;
  const pens = tie.leg2?.penalties ?? tie.leg1?.penalties;
  return (
    <motion.button
      onClick={onClick}
      disabled={!onClick}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`w-full overflow-hidden rounded-lg text-left ${user ? "ring-1 ring-gold" : ""} ${onClick ? "cursor-pointer hover:brightness-125" : "cursor-default"}`}
      style={{
        background: "linear-gradient(160deg, rgba(20,45,120,0.9), rgba(8,20,60,0.95))",
        border: "1px solid rgba(120,160,255,0.25)",
        boxShadow: user ? "0 0 12px rgba(212,175,55,0.35)" : "0 3px 8px rgba(0,0,0,0.4)",
      }}
    >
      <TeamRow id={tie.teamA} tie={tie} tournament={tournament} goals={aAgg} />
      <div className="h-px bg-white/10" />
      <TeamRow id={tie.teamB} tie={tie} tournament={tournament} goals={bAgg} />
      {pens && (
        <div className="bg-black/30 px-1.5 py-[1px] text-center text-[0.48rem] font-bold text-gold">
          pens {pens[0]}-{pens[1]}
        </div>
      )}
    </motion.button>
  );
}

/** Undrawn future slot — the empty shield of broadcast brackets. */
function EmptyTie() {
  return (
    <div
      className="grid h-[46px] w-full place-items-center rounded-lg border border-dashed border-white/20 text-white/25"
      style={{ background: "rgba(8,18,50,0.4)" }}
    >
      <span className="text-sm">🛡️</span>
    </div>
  );
}

function pad(ties: KOTie[], n: number): (KOTie | null)[] {
  const out: (KOTie | null)[] = [...ties];
  while (out.length < n) out.push(null);
  return out;
}

/**
 * Full two-sided knockout bracket — play-offs on the outer edges, R16 → QF →
 * SF converging on the trophy and the final in the middle, like the official
 * Champions League bracket graphics.
 */
export function KnockoutBracket({ tournament, onTieClick }: Props) {
  const by = (r: KOTie["round"]) => tournament.ties.filter((t) => t.round === r);
  const po = pad(by("Play-off"), 8);
  const r16 = pad(by("Round of 16"), 8);
  const qf = pad(by("Quarter-final"), 4);
  const sf = pad(by("Semi-final"), 2);
  const fin = by("Final")[0] ?? null;

  if (!by("Play-off").length) {
    return <p className="text-center text-sm text-muted">The knockout bracket is drawn once the league phase ends.</p>;
  }

  const cell = (tie: KOTie | null, key: string) =>
    tie ? (
      <MiniTie key={key} tie={tie} tournament={tournament}
        onClick={onTieClick && (tie.leg1 || tie.leg2) ? () => onTieClick(tie) : undefined} />
    ) : (
      <EmptyTie key={key} />
    );

  const columns: { title: string; items: React.ReactNode[] }[] = [
    { title: "Play-offs", items: po.slice(0, 4).map((t, i) => cell(t, `pol${i}`)) },
    { title: "Round of 16", items: r16.slice(0, 4).map((t, i) => cell(t, `r16l${i}`)) },
    { title: "Quarter-finals", items: qf.slice(0, 2).map((t, i) => cell(t, `qfl${i}`)) },
    { title: "Semi-finals", items: sf.slice(0, 1).map((t, i) => cell(t, `sfl${i}`)) },
    { title: "Final", items: [] }, // rendered specially
    { title: "Semi-finals", items: sf.slice(1, 2).map((t, i) => cell(t, `sfr${i}`)) },
    { title: "Quarter-finals", items: qf.slice(2, 4).map((t, i) => cell(t, `qfr${i}`)) },
    { title: "Round of 16", items: r16.slice(4, 8).map((t, i) => cell(t, `r16r${i}`)) },
    { title: "Play-offs", items: po.slice(4, 8).map((t, i) => cell(t, `por${i}`)) },
  ];

  const championName = tournament.champion ? teamLabel(tournament.teams[tournament.champion]) : null;

  return (
    <div className="cl-panel cl-streaks overflow-hidden rounded-3xl p-4">
      <div className="mb-3 text-center">
        <span className="cl-heading text-xs tracking-[0.35em] text-white/80">Road to the Final</span>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="mx-auto grid min-w-[1080px] max-w-[1400px] grid-cols-9 gap-2" style={{ minHeight: 420 }}>
          {columns.map((col, ci) =>
            ci === 4 ? (
              /* center: trophy + final */
              <div key="center" className="flex flex-col items-center justify-center gap-2 px-1">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 120, damping: 12 }}
                  className="text-5xl"
                  style={{ filter: "drop-shadow(0 0 22px rgba(212,175,55,0.5))" }}
                >
                  🏆
                </motion.div>
                <span className="cl-heading text-[0.6rem] tracking-[0.3em] text-gold">Final</span>
                {fin ? cell(fin, "final") : <EmptyTie />}
                {championName && (
                  <div className="mt-1 text-center">
                    <div className="text-[0.5rem] uppercase tracking-[0.25em] text-muted">Champions</div>
                    <div className="text-[0.7rem] font-extrabold text-gradient-gold">{championName}</div>
                  </div>
                )}
                <CrestLogo size={26} animated={false} />
              </div>
            ) : (
              <div key={`${col.title}-${ci}`} className="flex flex-col">
                <div className="mb-1.5 text-center text-[0.5rem] font-bold uppercase tracking-[0.2em] text-cyan/80">
                  {col.title}
                </div>
                <div className="flex flex-1 flex-col justify-around gap-2">{col.items}</div>
              </div>
            ),
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-[0.6rem] text-muted">
        Your ties glow gold · tap any played tie for both legs & full match stats
      </p>
    </div>
  );
}
