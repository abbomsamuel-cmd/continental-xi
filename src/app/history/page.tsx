"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import type { LoggedMatch, SimTeam } from "@/lib/types";
import { MatchModal } from "@/components/MatchModal";
import { TeamBadge } from "@/components/TeamBadge";
import { play } from "@/lib/sound";

const COMP_META: Record<LoggedMatch["comp"], { label: string; accent: string; chip: string }> = {
  cl: { label: "Champions Draft", accent: "#00f0ff", chip: "rgba(0,240,255,0.14)" },
  euro: { label: "UEFA EURO", accent: "#ff3b57", chip: "rgba(255,59,87,0.14)" },
  copa: { label: "Copa América", accent: "#00e676", chip: "rgba(0,230,118,0.14)" },
};

/** Rebuild the minimal team lookup MatchModal needs from a logged entry. */
function teamsOf(m: LoggedMatch): Record<string, SimTeam> {
  const mk = (side: LoggedMatch["home"], id: string): SimTeam => ({
    id, name: side.name, short: side.short, country: "", colors: side.colors,
    strength: 0, attack: 0, defense: 0, isUser: false, pot: 0, season: side.season,
  });
  return {
    [m.result.home]: mk(m.home, m.result.home),
    [m.result.away]: mk(m.away, m.result.away),
  };
}

export default function HistoryPage() {
  const mounted = useHydrated();
  const matchLog = useGame((s) => s.matchLog);
  const [filter, setFilter] = useState<"all" | LoggedMatch["comp"]>("all");
  const [open, setOpen] = useState<LoggedMatch | null>(null);

  const shown = useMemo(
    () => (filter === "all" ? matchLog : matchLog.filter((m) => m.comp === filter)),
    [matchLog, filter],
  );

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-28 sm:pt-32">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="cl-heading text-[0.62rem] tracking-[0.4em] text-cyan">Every Match, Remembered</div>
        <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">
          Match <span className="text-gradient-gold">History</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Every game your teams have played, with the full post-match report a tap away.
        </p>
      </motion.div>

      {/* competition filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(["all", "cl", "euro", "copa"] as const).map((f) => {
          const active = filter === f;
          const meta = f === "all" ? null : COMP_META[f];
          return (
            <button
              key={f}
              onClick={() => { setFilter(f); play("click"); }}
              className="chip transition-all"
              style={{
                background: active ? (meta?.chip ?? "rgba(212,175,55,0.16)") : "rgba(255,255,255,0.05)",
                color: active ? (meta?.accent ?? "#d4af37") : "rgba(255,255,255,0.55)",
                border: `1px solid ${active ? (meta?.accent ?? "#d4af37") + "66" : "rgba(255,255,255,0.1)"}`,
              }}
            >
              {f === "all" ? "All competitions" : meta!.label}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div className="glass mt-8 rounded-2xl p-10 text-center">
          <div className="text-4xl opacity-60">📼</div>
          <h2 className="mt-3 font-display text-xl font-extrabold">No matches on tape yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Play a league night or a tournament match and every result will be archived here, stats and all.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {shown.map((m, i) => {
            const meta = COMP_META[m.comp];
            const d = new Date(m.date);
            const dateLabel = d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
            return (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.04 }}
                whileHover={{ scale: 1.008, x: 3 }}
                onClick={() => { setOpen(m); play("click"); }}
                className="glass shine flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left"
              >
                <span aria-hidden className="h-9 w-1 shrink-0 rounded-full" style={{ background: meta.accent }} />
                <div className="hidden w-28 shrink-0 sm:block">
                  <div className="text-[0.6rem] font-bold uppercase tracking-wider" style={{ color: meta.accent }}>{meta.label}</div>
                  <div className="text-[0.6rem] text-muted">{dateLabel}</div>
                </div>
                <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
                  <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
                    <span className="truncate text-xs font-bold text-white/90">{m.home.name} {m.home.season ?? ""}</span>
                    <TeamBadge colors={m.home.colors} code={m.home.short} size={22} />
                  </span>
                  <span className="shrink-0 rounded-md bg-black/30 px-2 py-0.5 font-display text-sm font-extrabold">
                    {m.result.homeGoals}–{m.result.awayGoals}
                    {m.result.penalties && <span className="ml-1 text-[0.55rem] text-gold">p</span>}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    <TeamBadge colors={m.away.colors} code={m.away.short} size={22} />
                    <span className="truncate text-xs font-bold text-white/90">{m.away.name} {m.away.season ?? ""}</span>
                  </span>
                </div>
                <div className="hidden w-36 shrink-0 text-right sm:block">
                  <div className="truncate text-[0.62rem] font-semibold text-white/60">{m.round}</div>
                  <div className="truncate text-[0.58rem] text-muted">⭐ {m.result.motm}</div>
                </div>
                <span aria-hidden className="shrink-0 text-white/30">›</span>
              </motion.button>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <MatchModal
            result={open.result}
            teams={teamsOf(open)}
            title={`${COMP_META[open.comp].label} · ${open.round}`}
            onClose={() => setOpen(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
