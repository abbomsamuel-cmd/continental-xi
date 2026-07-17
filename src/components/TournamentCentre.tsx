"use client";

import { motion } from "framer-motion";
import { TeamBadge } from "@/components/TeamBadge";
import { previewPrediction, type BootEntry } from "@/lib/broadcast";

/**
 * Tournament Centre panels — the between-rounds dashboard that makes a
 * campaign feel like a competition being covered on television:
 *
 *   MatchPreview    a TV pre-match show for the user's next knockout tie
 *   GoldenBootRace  live top-scorer leaderboard across the whole field
 *   HeadlinesPanel  evolving storylines derived from the standings
 *
 * All presentational — every number comes from matches already simulated.
 */

export interface PreviewTeam {
  name: string;
  short: string;
  colors: [string, string];
  strength: number;
  record: { w: number; d: number; l: number; gf: number; ga: number };
  form: ("W" | "D" | "L")[];
  topScorer?: { name: string; goals: number };
  keyPlayers?: string[];
  isUser?: boolean;
}

const FORM_STYLE: Record<"W" | "D" | "L", { bg: string; label: string }> = {
  W: { bg: "#2ee6a6", label: "W" },
  D: { bg: "rgba(255,255,255,0.35)", label: "D" },
  L: { bg: "#ff5a6a", label: "L" },
};

function FormPips({ form }: { form: ("W" | "D" | "L")[] }) {
  if (!form.length) return <span className="text-[0.6rem] text-white/35">—</span>;
  return (
    <span className="flex gap-1">
      {form.slice(-5).map((r, i) => (
        <span key={i} className="grid h-4 w-4 place-items-center rounded font-display text-[0.5rem] font-extrabold text-[#06101f]"
          style={{ background: FORM_STYLE[r].bg }}>
          {FORM_STYLE[r].label}
        </span>
      ))}
    </span>
  );
}

function PreviewColumn({ team, align }: { team: PreviewTeam; align: "left" | "right" }) {
  const right = align === "right";
  return (
    <div className={`min-w-0 space-y-2 ${right ? "text-right" : "text-left"}`}>
      <div className={`flex items-center gap-2.5 ${right ? "flex-row-reverse" : ""}`}>
        <TeamBadge colors={team.colors} code={team.short} size={40} />
        <div className="min-w-0">
          <div className="truncate font-display text-sm font-extrabold text-white">{team.name}</div>
          <div className="text-[0.6rem] text-white/45">Overall {Math.round(team.strength)}</div>
        </div>
      </div>
      <div className={`flex ${right ? "justify-end" : ""}`}><FormPips form={team.form} /></div>
      <div className="text-[0.64rem] text-white/60">
        {team.record.w}W · {team.record.d}D · {team.record.l}L
        <span className="text-white/35"> · </span>
        {team.record.gf}–{team.record.ga}
      </div>
      {team.topScorer && team.topScorer.goals > 0 && (
        <div className="truncate text-[0.62rem] text-white/55">⚽ {team.topScorer.name} ({team.topScorer.goals})</div>
      )}
      {team.keyPlayers && team.keyPlayers.length > 0 && (
        <div className="truncate text-[0.58rem] text-white/40">{team.keyPlayers.slice(0, 3).join(" · ")}</div>
      )}
    </div>
  );
}

/** The TV pre-match show for the user's next knockout tie. */
export function MatchPreview({
  roundLabel, compLabel, a, b, accent, soft,
}: {
  roundLabel: string;
  compLabel: string;
  a: PreviewTeam;
  b: PreviewTeam;
  accent: string;
  soft: string;
}) {
  const seed = Math.round(a.strength * 31 + b.strength * 7) + a.name.length * 13;
  const pred = previewPrediction(a, b, seed);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5"
    >
      <div className="flex items-center justify-between">
        <span className="cl-heading text-[0.55rem] tracking-[0.35em]" style={{ color: accent }}>
          {compLabel} · Pre-Match
        </span>
        <span className="rounded px-2 py-0.5 text-[0.55rem] font-extrabold uppercase tracking-wider"
          style={{ background: soft, color: accent }}>
          {roundLabel}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-start gap-3 sm:gap-6">
        <PreviewColumn team={a} align="left" />
        <div className="pt-2 text-center font-display text-lg font-extrabold text-white/60">VS</div>
        <PreviewColumn team={b} align="right" />
      </div>

      {/* win-probability bar — display-only, the engine never sees it */}
      <div className="mt-4">
        <div className="flex justify-between text-[0.58rem] font-bold text-white/55">
          <span>{pred.aPct}%</span>
          <span className="uppercase tracking-[0.3em] text-white/35">Prediction</span>
          <span>{pred.bPct}%</span>
        </div>
        <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div className="h-full" initial={{ width: "50%" }} animate={{ width: `${pred.aPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ background: `linear-gradient(90deg, ${a.colors[0]}, ${accent})` }} />
          <div className="h-full flex-1" style={{ background: "rgba(255,255,255,0.2)" }} />
        </div>
        <p className="mt-2 text-center text-[0.68rem] italic leading-relaxed text-white/55">{pred.line}</p>
      </div>
    </motion.div>
  );
}

/** Live Golden Boot leaderboard. */
export function GoldenBootRace({ entries, accent, soft }: { entries: BootEntry[]; accent: string; soft: string }) {
  if (!entries.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="cl-heading text-[0.55rem] tracking-[0.35em]" style={{ color: accent }}>👟 Golden Boot Race</span>
        <span className="text-[0.52rem] uppercase tracking-widest text-white/35">Live</span>
      </div>
      <div className="space-y-1.5">
        {entries.map((e, i) => (
          <motion.div key={e.player} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }} className="flex items-center gap-2">
            <span className="w-4 text-right font-display text-[0.62rem] font-extrabold text-white/45">{i + 1}</span>
            <TeamBadge colors={e.teamColors} code={e.teamShort} size={16} />
            <span className="min-w-0 flex-1 truncate text-[0.7rem] font-semibold text-white/85">{e.player}</span>
            <span className="flex items-center gap-1 rounded-full px-2 py-0.5 font-display text-[0.68rem] font-extrabold"
              style={i === 0 ? { background: soft, color: accent } : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}>
              {e.goals} ⚽
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/** Evolving tournament storylines. */
export function HeadlinesPanel({ lines, accent }: { lines: string[]; accent: string }) {
  if (!lines.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="mb-2.5 cl-heading text-[0.55rem] tracking-[0.35em]" style={{ color: accent }}>
        📰 Tournament Headlines
      </div>
      <div className="space-y-1.5">
        {lines.map((l, i) => (
          <motion.div key={l} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="flex items-start gap-2 text-[0.7rem] leading-snug text-white/70">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full" style={{ background: accent }} />
            {l}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
