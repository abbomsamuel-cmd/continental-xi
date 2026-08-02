"use client";

import { tacticById, tacticFitBand, tacticFitReasons, type TacticId } from "@/lib/tactics";
import type { Formation, Player } from "@/lib/types";

/**
 * The tactical readout that sits beside the pitch — the broadcast panel a
 * coverage feed drops over the grass while it talks through a shape.
 *
 * Deliberately meters, not sliders. The engine models six DISCRETE styles
 * (lib/tactics.ts), not continuous dials, so a draggable slider would imply
 * a control that doesn't exist. These read out real computed values:
 * per-phase ratings from the squad analysis, and the fit of the chosen style
 * against this XI with the engine's own reasons for the number.
 */

const PANEL = "rgba(9,17,33,0.82)";

function Meter({ label, value, accent }: { label: string; value: number; accent: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-white/45">{label}</span>
        <span className="font-display text-[0.72rem] font-extrabold tabular-nums" style={{ color: accent }}>{v}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${v}%`, background: `linear-gradient(90deg, ${accent}55, ${accent})`, boxShadow: `0 0 8px ${accent}70` }} />
      </div>
    </div>
  );
}

export function TacticalPanel({
  phases, tacticId, tacticFit, formation, players, accent, className = "",
}: {
  /** phase ratings from getAnalysis(): attack / midfield / defense / goalkeeper */
  phases: { label: string; value: number }[];
  tacticId?: TacticId | null;
  tacticFit?: number;
  formation: Formation;
  players: (Player | null)[];
  accent: string;
  className?: string;
}) {
  const tactic = tacticById(tacticId);
  const band = typeof tacticFit === "number" ? tacticFitBand(tacticFit) : null;
  const reasons = tactic ? tacticFitReasons(tactic.id, formation, players).slice(0, 3) : [];

  return (
    <aside
      className={`relative overflow-hidden rounded-2xl border p-3.5 backdrop-blur-sm ${className}`}
      style={{ background: PANEL, borderColor: `${accent}44`, boxShadow: `0 0 24px ${accent}22, inset 0 1px 0 rgba(255,255,255,0.06)` }}
    >
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[2px]"
        style={{ background: `linear-gradient(180deg, transparent, ${accent}, transparent)` }} />

      <div className="text-[0.5rem] font-bold uppercase tracking-[0.3em]" style={{ color: accent }}>Tactical</div>
      <div className="mt-1 truncate font-display text-sm font-black uppercase text-white">
        {tactic ? `${tactic.icon} ${tactic.name}` : "No style set"}
      </div>

      <div className="mt-3 space-y-2">
        {phases.map((p) => <Meter key={p.label} label={p.label} value={p.value} accent={accent} />)}
        {typeof tacticFit === "number" && band && (
          <div className="pt-1">
            <Meter label={`Fit — ${band.band}`} value={tacticFit} accent={band.color} />
          </div>
        )}
      </div>

      {reasons.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-white/8 pt-2.5">
          {reasons.map((r) => (
            <li key={r} className="text-[0.6rem] leading-snug text-white/65">
              <span style={{ color: accent }}>·</span> {r}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
