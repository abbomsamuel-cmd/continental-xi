"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { ACHIEVEMENTS } from "@/lib/achievements";
import type { DraftRecord } from "@/lib/types";
import { play } from "@/lib/sound";

const TIER_COLORS: Record<string, string> = {
  bronze: "#cd7f32", silver: "#c0c8d4", gold: "#d4af37", legendary: "#22e0ff",
};

function mode<T>(arr: T[]): T | null {
  if (!arr.length) return null;
  const counts = new Map<T, number>();
  for (const x of arr) counts.set(x, (counts.get(x) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function aggregate(drafts: DraftRecord[]) {
  const played = drafts.length;
  const champions = drafts.filter((d) => d.result === "champion").length;
  const finals = drafts.filter((d) => d.result === "final" || d.result === "champion").length;
  const semis = drafts.filter((d) => ["semi", "final", "champion"].includes(d.result ?? "")).length;
  const overalls = drafts.map((d) => d.overall);
  const allPlayers = drafts.flatMap((d) => d.players);
  return {
    played,
    champions,
    finals,
    semis,
    winPct: played ? Math.round((champions / played) * 100) : 0,
    avgOverall: overalls.length ? Math.round(overalls.reduce((a, b) => a + b, 0) / overalls.length) : 0,
    bestOverall: overalls.length ? Math.max(...overalls) : 0,
    favFormation: mode(drafts.map((d) => d.formation)) ?? "—",
    favClub: mode(allPlayers.map((p) => p.club)) ?? "—",
    mostDrafted: mode(allPlayers.map((p) => p.name)) ?? "—",
    totalGoals: drafts.reduce((s, d) => s + (d.goals ?? 0), 0),
  };
}

export default function StatsPage() {
  const profile = useGame((s) => s.profile);
  const setName = useGame((s) => s.setProfileName);
  const [tab, setTab] = useState<"stats" | "achievements" | "history">("stats");
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);

  const agg = useMemo(() => aggregate(profile.drafts), [profile.drafts]);
  const unlocked = new Set(profile.achievements);

  const resultCounts = useMemo(() => {
    const order = ["champion", "final", "semi", "quarter", "r16", "playoff", "league"];
    const labels: Record<string, string> = {
      champion: "Champion", final: "Final", semi: "Semi", quarter: "QF", r16: "R16", playoff: "Play-off", league: "League",
    };
    const counts = order.map((k) => ({ k, label: labels[k], n: profile.drafts.filter((d) => d.result === k).length }));
    const max = Math.max(1, ...counts.map((c) => c.n));
    return { counts, max };
  }, [profile.drafts]);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-24 sm:pt-28">
      {/* header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-strong flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#003b8e] to-[#061a40] font-display text-2xl font-extrabold text-gold gold-border">
            {profile.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            {editing ? (
              <div className="flex gap-2">
                <input value={nameInput} maxLength={24} onChange={(e) => setNameInput(e.target.value)}
                  className="rounded-lg border border-white/12 bg-black/30 px-3 py-1.5 text-white outline-none focus:border-gold" />
                <button className="btn btn-gold text-xs" onClick={() => { setName(nameInput); setEditing(false); play("click"); }}>Save</button>
              </div>
            ) : (
              <button onClick={() => { setEditing(true); setNameInput(profile.name); }} className="text-left">
                <h1 className="font-display text-2xl font-extrabold">{profile.name} <span className="text-xs text-muted">✎</span></h1>
              </button>
            )}
            <div className="mt-1 flex gap-3 text-sm text-muted">
              <span>🏆 {profile.trophies} titles</span>
              <span>🎖 {profile.achievements.length}/{ACHIEVEMENTS.length}</span>
              <span>📋 {agg.played} drafts</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* tabs */}
      <div className="mt-6 flex gap-2">
        {(["stats", "achievements", "history"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); play("click"); }}
            className={`chip capitalize ${tab === t ? "bg-gold/20 text-gold" : "bg-white/6 text-muted"}`}>{t}</button>
        ))}
      </div>

      {tab === "stats" && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Drafts Played", agg.played], ["CL Titles", agg.champions], ["Finals", agg.finals], ["Semi-finals", agg.semis],
              ["Win %", `${agg.winPct}%`], ["Avg Overall", agg.avgOverall], ["Best Overall", agg.bestOverall], ["Total Goals", agg.totalGoals],
            ].map(([label, value]) => (
              <div key={label} className="glass rounded-2xl px-3 py-4 text-center">
                <div className="font-display text-2xl font-extrabold text-gradient-gold">{value}</div>
                <div className="mt-1 text-[0.6rem] font-semibold uppercase tracking-widest text-muted">{label}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="glass rounded-2xl p-5">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted">Career Best Runs</h3>
              <div className="flex items-end gap-2" style={{ height: 140 }}>
                {resultCounts.counts.map((c) => (
                  <div key={c.k} className="flex flex-1 flex-col items-center gap-1">
                    <motion.div
                      className="w-full rounded-t-md bg-gradient-to-t from-[#003b8e] to-gold"
                      initial={{ height: 0 }}
                      animate={{ height: `${(c.n / resultCounts.max) * 110}px` }}
                      transition={{ type: "spring", stiffness: 100 }}
                    />
                    <span className="text-[0.55rem] text-white/70">{c.n}</span>
                    <span className="text-[0.5rem] uppercase text-muted">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass rounded-2xl p-5">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted">Favourites</h3>
              <dl className="space-y-2 text-sm">
                {[
                  ["Formation", agg.favFormation], ["Club drafted", agg.favClub],
                  ["Most-drafted player", agg.mostDrafted], ["Total tournament goals", `${agg.totalGoals}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-white/6 pb-1.5">
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-semibold text-white">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      )}

      {tab === "achievements" && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const have = unlocked.has(a.id);
            return (
              <div key={a.id}
                className={`glass rounded-2xl p-4 ${have ? "" : "opacity-45 grayscale"}`}
                style={have ? { borderColor: TIER_COLORS[a.tier] } : undefined}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{a.icon}</span>
                  <div>
                    <div className="font-display font-bold">{a.name}</div>
                    <span className="text-[0.55rem] font-bold uppercase tracking-widest" style={{ color: TIER_COLORS[a.tier] }}>
                      {a.tier}
                    </span>
                  </div>
                  {have && <span className="ml-auto text-green">✓</span>}
                </div>
                <p className="mt-2 text-xs text-muted">{a.description}</p>
              </div>
            );
          })}
        </div>
      )}

      {tab === "history" && (
        <div className="mt-6 space-y-2">
          {(profile.intlResults?.length ?? 0) > 0 && (
            <>
              <h3 className="pt-1 text-xs font-bold uppercase tracking-widest text-muted">International Campaigns</h3>
              {profile.intlResults!.map((r, i) => (
                <div key={i} className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <span className="chip bg-white/8 text-cyan">{r.comp === "euro" ? "🇪🇺 EURO" : "🌎 Copa América"}</span>
                    <div>
                      <div className="text-sm font-bold">{r.nation} {r.year}</div>
                      <div className="text-xs text-muted">{new Date(r.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <span className={`chip capitalize ${r.result === "champion" ? "bg-gold/20 text-gold" : "bg-white/8 text-muted"}`}>
                    {r.result === "champion" ? "🏆 Champion" : r.result}
                  </span>
                </div>
              ))}
              <h3 className="pt-3 text-xs font-bold uppercase tracking-widest text-muted">Champions Draft Runs</h3>
            </>
          )}
          {profile.drafts.length === 0 && <p className="text-muted">No drafts yet. Go build an XI!</p>}
          {profile.drafts.map((d) => (
            <div key={d.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <span className="chip bg-white/8 text-cyan">{d.formation}</span>
                <div>
                  <div className="text-sm font-bold">{d.overall} OVR{d.tactic ? ` · ${d.tactic}` : ""}</div>
                  <div className="text-xs text-muted">
                    {new Date(d.date).toLocaleDateString()} · {d.mode}{d.daily ? " · daily" : ""}
                  </div>
                </div>
              </div>
              <span className={`chip capitalize ${d.result === "champion" ? "bg-gold/20 text-gold" : "bg-white/8 text-muted"}`}>
                {d.result === "champion" ? "🏆 Champion" : d.result ?? "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
