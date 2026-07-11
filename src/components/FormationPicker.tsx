"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FORMATIONS, POSITION_GROUP } from "@/lib/formations";
import { tacticById } from "@/lib/tactics";
import type { Formation } from "@/lib/types";

const GROUP_COLOR: Record<string, string> = { GK: "#f2d472", DEF: "#5aa9ff", MID: "#2ee6a6", ATT: "#ff8a5c" };

/** A tiny pitch that draws the formation's shape — dots coloured by unit. */
export function FormationGlyph({ formation, accent = "#22e0ff", size = 96 }: { formation: Formation; accent?: string; size?: number }) {
  return (
    <svg viewBox="0 0 100 128" width={size} height={size * 1.28} className="block" aria-hidden>
      <rect x="2" y="2" width="96" height="124" rx="6" fill="rgba(255,255,255,0.03)" stroke={`${accent}44`} strokeWidth="1" />
      <line x1="2" y1="64" x2="98" y2="64" stroke={`${accent}22`} strokeWidth="0.8" />
      <circle cx="50" cy="64" r="10" fill="none" stroke={`${accent}22`} strokeWidth="0.8" />
      {formation.slots.map((s, i) => {
        const cx = 8 + s.x * 0.84;
        const cy = 8 + (100 - s.y) * 1.12;
        return <circle key={i} cx={cx} cy={cy} r="3.6" fill={GROUP_COLOR[POSITION_GROUP[s.pos]]} opacity={0.92} />;
      })}
    </svg>
  );
}

interface Props {
  current: string;
  accent: string;
  /** disable formations that would drop players (e.g. mid-squad change) */
  isAllowed?: (formation: Formation) => boolean;
  onPick: (name: string) => void;
  onClose: () => void;
  title?: string;
}

/** Full-screen formation chooser with shape preview + best-for tactics. */
export function FormationPicker({ current, accent, isAllowed, onPick, onClose, title = "Choose Formation" }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto bg-black/80 p-3 pt-16 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
          className="glass-strong w-full max-w-3xl rounded-2xl p-4 sm:p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-extrabold sm:text-xl">{title}</h3>
            <button className="btn btn-ghost text-xs" onClick={onClose}>✕ Close</button>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
            {FORMATIONS.map((f) => {
              const allowed = isAllowed ? isAllowed(f) : true;
              const active = f.name === current;
              const tactics = (f.bestFor ?? []).map((id) => tacticById(id)).filter(Boolean).slice(0, 3);
              return (
                <button
                  key={f.name}
                  disabled={!allowed}
                  onClick={() => { if (allowed) onPick(f.name); }}
                  className={`rounded-xl border p-2.5 text-left transition-all ${allowed ? "hover:border-white/40 active:scale-95" : "cursor-not-allowed opacity-35"}`}
                  style={active ? { borderColor: accent, boxShadow: `0 0 0 1px ${accent}, 0 0 18px ${accent}33` } : { borderColor: "rgba(255,255,255,0.12)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-extrabold text-white">{f.name}</span>
                    {active && <span className="text-[0.55rem] font-bold uppercase tracking-wider" style={{ color: accent }}>Active</span>}
                  </div>
                  <div className="mx-auto mt-1.5 w-[72px]"><FormationGlyph formation={f} accent={accent} size={72} /></div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {tactics.map((t) => (
                      <span key={t!.id} className="rounded px-1 py-[1px] text-[0.5rem] font-bold" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }} title={t!.name}>
                        {t!.icon}
                      </span>
                    ))}
                  </div>
                  {!allowed && <div className="mt-1 text-[0.5rem] font-bold uppercase tracking-wide text-danger">Can’t hold XI</div>}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-[0.62rem] text-white/45">
            Coloured dots show the shape · <span style={{ color: GROUP_COLOR.DEF }}>defence</span> · <span style={{ color: GROUP_COLOR.MID }}>midfield</span> · <span style={{ color: GROUP_COLOR.ATT }}>attack</span>. Best-fit tactics shown as icons.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
