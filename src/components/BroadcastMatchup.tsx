"use client";

import { tacticById, tacticFitBand, tacticMatchupSummary, type TacticId } from "@/lib/tactics";

/**
 * The broadcast rail beside the lineup — the panel a TV feed puts either side
 * of the teamsheet before kick-off. Everything on it is real: the tactical
 * style, its fit against this XI, and which styles it beats or struggles
 * against, all straight out of lib/tactics.ts. Nothing here is decorative
 * filler; if there's no tactic chosen yet it says so rather than inventing a
 * number.
 */

const PANEL = "rgba(9,17,33,0.82)";

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-white/8 py-1.5 last:border-0">
      <span className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-white/45">{label}</span>
      <span className="font-display text-[0.78rem] font-extrabold" style={{ color: accent ?? "#e8f2ff" }}>{value}</span>
    </div>
  );
}

/** A meter, 0-100, in the broadcast blue-to-cyan ramp. */
function Meter({ label, value, accent }: { label: string; value: number; accent: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="mt-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-white/45">{label}</span>
        <span className="font-display text-[0.72rem] font-extrabold" style={{ color: accent }}>{v}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${v}%`, background: `linear-gradient(90deg, ${accent}66, ${accent})`, boxShadow: `0 0 8px ${accent}80` }} />
      </div>
    </div>
  );
}

export function BroadcastMatchup({
  side, teamName, overall, tacticId, tacticFit, accent, className = "",
}: {
  side: "left" | "right";
  teamName: string;
  overall?: number;
  tacticId?: TacticId | null;
  /** 0-100 tactical fit for this XI, from tacticFit() */
  tacticFit?: number;
  accent: string;
  className?: string;
}) {
  const tactic = tacticById(tacticId);
  const band = typeof tacticFit === "number" ? tacticFitBand(tacticFit) : null;
  const matchup = tactic ? tacticMatchupSummary(tactic.id) : null;

  return (
    <aside
      className={`relative overflow-hidden rounded-2xl border p-3.5 backdrop-blur-sm ${className}`}
      style={{ background: PANEL, borderColor: `${accent}44`, boxShadow: `0 0 24px ${accent}22, inset 0 1px 0 rgba(255,255,255,0.06)` }}
    >
      {/* the lit edge a broadcast panel always has, on the side facing the pitch */}
      <span aria-hidden className="pointer-events-none absolute inset-y-0 w-[2px]"
        style={{ [side === "left" ? "right" : "left"]: 0, background: `linear-gradient(180deg, transparent, ${accent}, transparent)` } as React.CSSProperties} />

      <div className="text-[0.5rem] font-bold uppercase tracking-[0.3em]" style={{ color: accent }}>Matchup</div>
      <div className="mt-1 truncate font-display text-sm font-black uppercase text-white">{teamName}</div>

      <div className="mt-3">
        {typeof overall === "number" && <Row label="Squad OVR" value={String(overall)} accent={accent} />}
        <Row label="Style" value={tactic ? `${tactic.icon} ${tactic.name}` : "Not set"} accent={tactic ? undefined : "#ff8b96"} />
        {band && <Row label="Fit" value={band.band} accent={band.color} />}
      </div>

      {typeof tacticFit === "number" && <Meter label="Tactical fit" value={tacticFit} accent={accent} />}

      {matchup && (
        <div className="mt-3 space-y-1.5">
          {matchup.beats.length > 0 && (
            <div>
              <div className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-emerald-300/70">Counters</div>
              <div className="mt-0.5 text-[0.62rem] font-semibold leading-snug text-white/75">{matchup.beats.join(" · ")}</div>
            </div>
          )}
          {matchup.loses.length > 0 && (
            <div>
              <div className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-rose-300/70">Vulnerable to</div>
              <div className="mt-0.5 text-[0.62rem] font-semibold leading-snug text-white/75">{matchup.loses.join(" · ")}</div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
