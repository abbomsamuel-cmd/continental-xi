"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getAllPlayers, SQUADS, eraOf } from "@/lib/players";
import { CLUB_REGISTRY } from "@/lib/data/clubs";
import { PlayerCard } from "@/components/PlayerCard";
import type { Player } from "@/lib/types";

type Tab = "players" | "clubs" | "squads";

export default function DatabasePage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("players");
  const players = useMemo(() => getAllPlayers(), []);

  const q = query.trim().toLowerCase();

  const filteredPlayers = useMemo(() => {
    const list = q
      ? players.filter((p) =>
          [p.name, p.club, p.nationality, p.league, p.seasonLabel, p.coach, p.position, eraOf(p.season)]
            .join(" ").toLowerCase().includes(q))
      : players;
    return [...list].sort((a, b) => b.overall - a.overall).slice(0, 60);
  }, [players, q]);

  const filteredClubs = useMemo(() => {
    return CLUB_REGISTRY.filter((c) =>
      !q || [c.name, c.country, c.league].join(" ").toLowerCase().includes(q));
  }, [q]);

  const filteredSquads = useMemo(() => {
    return SQUADS.filter((s) =>
      !q || [s.club, s.coach, s.league, s.stadium, s.honor ?? "", `${s.season}`].join(" ").toLowerCase().includes(q));
  }, [q]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-24 sm:pt-28">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-extrabold sm:text-5xl">
          The <span className="text-gradient-gold">Archive</span>
        </h1>
        <p className="mt-2 text-muted">
          {players.length} rated players · {SQUADS.length} legendary squads · {CLUB_REGISTRY.length} clubs.
          Browse and search instantly by player, club, nation, league, manager, stadium or era.
        </p>
      </motion.div>

      <div className="sticky top-20 z-20 mt-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search anything… ‘Messi’, ‘2011’, ‘Bayern’, ‘Klopp’, ‘Tiki-Taka’"
          className="w-full rounded-2xl border border-white/12 bg-black/50 px-5 py-4 text-white outline-none backdrop-blur focus:border-gold"
        />
      </div>

      <div className="mt-4 flex gap-2">
        {(["players", "clubs", "squads"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`chip capitalize ${tab === t ? "bg-gold/20 text-gold" : "bg-white/6 text-muted"}`}
          >
            {t} ({t === "players" ? filteredPlayers.length : t === "clubs" ? filteredClubs.length : filteredSquads.length})
          </button>
        ))}
      </div>

      {tab === "players" && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {filteredPlayers.map((p: Player, i) => (
            <PlayerCard key={p.id} player={p} mode="classic" index={Math.min(i, 8)} />
          ))}
          {!filteredPlayers.length && <p className="col-span-full text-muted">No players found.</p>}
        </div>
      )}

      {tab === "clubs" && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClubs.map((c) => (
            <div key={c.name} className="glass flex items-center gap-3 rounded-2xl p-4">
              <span className="h-10 w-10 rounded-lg" style={{ background: `linear-gradient(150deg, ${c.colors[0]}, ${c.colors[1]})` }} />
              <div>
                <div className="font-display font-bold">{c.name}</div>
                <div className="text-xs text-muted">{c.country} · {c.league}</div>
              </div>
              <span className="ml-auto font-display text-lg font-extrabold text-gold">{c.coeff}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "squads" && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {filteredSquads.map((s) => (
            <div key={`${s.club}-${s.season}`} className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg" style={{ background: `linear-gradient(150deg, ${s.colors[0]}, ${s.colors[1]})` }} />
                <div>
                  <div className="font-display font-bold">{s.club} <span className="text-cyan">{s.season - 1}-{String(s.season).slice(2)}</span></div>
                  <div className="text-xs text-muted">{s.coach} · {s.stadium}</div>
                </div>
                <span className="ml-auto chip bg-white/6 text-muted">{eraOf(s.season)}</span>
              </div>
              {s.honor && <div className="mt-2 text-xs text-gold">🏅 {s.honor}</div>}
              <div className="mt-2 flex flex-wrap gap-1">
                {s.players.slice(0, 6).map((p) => (
                  <span key={p[0]} className="chip bg-black/30 text-white/70">{p[0].split(" ").pop()}</span>
                ))}
                <span className="chip bg-black/30 text-muted">+{Math.max(0, s.players.length - 6)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
