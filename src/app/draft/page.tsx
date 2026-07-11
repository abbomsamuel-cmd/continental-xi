"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { FORMATIONS } from "@/lib/formations";
import { Pitch } from "@/components/Pitch";
import { DraftRoundView } from "@/components/DraftRoundView";
import { WavingFlag } from "@/components/fx/WavingFlag";
import { Sparks } from "@/components/fx/Atmosphere";
import { COMP_SQUADS } from "@/lib/engine/international";
import { SQUADS } from "@/lib/players";
import type { GameMode } from "@/lib/types";
import type { Difficulty } from "@/lib/store";
import type { DraftPool } from "@/lib/players";
import { play } from "@/lib/sound";

const DIFFICULTIES: { id: Difficulty; title: string; body: string; rerolls: string }[] = [
  { id: "easy", title: "Easy", body: "Plenty of team re-rolls to shape a dream squad.", rerolls: "3 team re-rolls" },
  { id: "medium", title: "Medium", body: "A few re-rolls — pick your moments.", rerolls: "1 team re-roll" },
  { id: "hard", title: "Hard", body: "No re-rolls. Take what the reel gives you.", rerolls: "No re-rolls" },
];

/* Each competition is a different draft world — different colours, different
   rules, different feel. */
const COMP_THEME: Record<DraftPool, {
  label: string; sub: string; emoji: string; accent: string; soft: string;
  panel: string; heading: string; note: string; noteIcon: string; flags?: string[];
}> = {
  clubs: {
    label: "Champions League", sub: "Club · Europe", emoji: "🏆",
    accent: "#22e0ff", soft: "rgba(34,224,255,0.14)",
    panel: "cl-panel cl-streaks", heading: "text-gradient-gold",
    note: "Every rating is season-specific — your XI is built from player quality, position suitability, tactics and experience.",
    noteIcon: "🔗",
  },
  euro: {
    label: "UEFA EURO", sub: "International · UEFA", emoji: "🇪🇺",
    accent: "#37e0ff", soft: "rgba(55,224,255,0.14)",
    panel: "euro-panel euro-grid", heading: "text-gradient-euro",
    note: "National-team football — your XI is judged on attack, midfield, defence, goalkeeper, experience and balance.",
    noteIcon: "🏟️",
    flags: ["Spain", "France", "Germany", "Italy"],
  },
  copa: {
    label: "Copa América", sub: "International · CONMEBOL", emoji: "🌎",
    accent: "#ffc93c", soft: "rgba(255,201,60,0.14)",
    panel: "copa-panel copa-heat copa-gold-border", heading: "text-gradient-copa",
    note: "Pure footballing quality decides how far your selección goes — plus the tactics you choose.",
    noteIcon: "🎉",
    flags: ["Brazil", "Argentina", "Uruguay", "Chile"],
  },
};

export default function DraftPage() {
  const router = useRouter();
  const setup = useGame((s) => s.setup);
  const draftComplete = useGame((s) => s.draftComplete);
  const startDraft = useGame((s) => s.startDraft);
  const pendingPool = useGame((s) => s.pendingPool);
  const setPendingPool = useGame((s) => s.setPendingPool);

  const [mode, setMode] = useState<GameMode>("classic");
  const [formation, setFormation] = useState("4-3-3");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  // If a completed draft exists, jump to squad review
  useEffect(() => {
    if (draftComplete) router.replace("/squad");
  }, [draftComplete, router]);

  if (draftComplete) return null;
  if (setup) return <DraftRoundView />;

  const t = COMP_THEME[pendingPool];
  const ringStyle = (active: boolean) =>
    active ? { boxShadow: `0 0 0 2px ${t.accent}, 0 0 24px ${t.soft}` } : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-24 sm:pt-28">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="cl-heading text-[0.6rem] tracking-[0.4em]" style={{ color: t.accent }}>Draft Studio</div>
        <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">
          Build a <span className={t.heading}>{t.label}</span> XI
        </h1>
        <p className="mt-2 max-w-lg text-sm text-muted">
          Pick a position, spin for a legendary squad, then choose a player who genuinely fits
          the role — and where he plays. Choose your competition, shape and challenge to begin.
        </p>
      </motion.div>

      {/* COMPETITION — the first decision changes everything below */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted">Competition</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(COMP_THEME) as DraftPool[]).map((pool) => {
            const ct = COMP_THEME[pool];
            const active = pendingPool === pool;
            const squadCount = pool === "clubs" ? SQUADS.length : COMP_SQUADS[pool].length;
            const flagSquads = ct.flags
              ?.map((nation) => COMP_SQUADS[pool as "euro" | "copa"].find((s) => s.club === nation))
              .filter(Boolean);
            return (
              <button
                key={pool}
                onClick={() => { setPendingPool(pool); play("select"); }}
                className={`shine relative overflow-hidden rounded-2xl p-4 text-left transition-all ${ct.panel} ${active ? "" : "opacity-75 saturate-[0.7] hover:opacity-100 hover:saturate-100"}`}
                style={active ? { boxShadow: `0 0 0 2px ${ct.accent}, 0 0 26px ${ct.soft}` } : undefined}
              >
                {active && <Sparks count={5} color={ct.accent} />}
                <div className="flex items-start justify-between">
                  <span className="text-3xl" style={{ filter: `drop-shadow(0 4px 16px ${ct.soft})` }}>{ct.emoji}</span>
                  {active && <span className="chip" style={{ background: ct.soft, color: ct.accent }}>Selected</span>}
                </div>
                <div className="mt-2 cl-heading text-[0.55rem] tracking-[0.3em]" style={{ color: ct.accent }}>{ct.sub}</div>
                <div className="font-display text-lg font-extrabold text-white">{ct.label}</div>
                <div className="mt-1 text-[0.68rem] text-white/60">{squadCount} historic squads</div>
                {flagSquads && flagSquads.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {flagSquads.map((s) => <WavingFlag key={s!.club} colors={s!.colors} width={26} />)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {/* how this competition scores your XI */}
        <AnimatePresence mode="wait">
          <motion.div
            key={pendingPool}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-3 flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-[0.72rem] text-white/70"
            style={{ background: t.soft, border: `1px solid ${t.accent}33` }}
          >
            <span className="text-base">{t.noteIcon}</span> {t.note}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* MODE */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted">Game Mode</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            { id: "classic", title: "Classic", tag: "Show everything", body: "Ratings, all six attributes and full stats are visible on every card." },
            { id: "expert", title: "Expert", tag: "Knowledge test", body: "Overall and attributes hidden. Only name, club, position and season — reward real football knowledge." },
          ] as const).map((m) => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); play("click"); }}
              className="glass relative overflow-hidden rounded-2xl p-5 text-left transition-all hover:ring-1 hover:ring-white/20"
              style={ringStyle(mode === m.id)}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold">{m.title}</h3>
                <span className="chip" style={mode === m.id ? { background: t.soft, color: t.accent } : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                  {m.tag}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{m.body}</p>
            </button>
          ))}
        </div>
      </section>

      {/* FORMATION */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted">Formation</h2>
        <div className="grid gap-6 md:grid-cols-[1fr_auto]">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FORMATIONS.map((f) => (
              <button
                key={f.name}
                onClick={() => { setFormation(f.name); play("click"); }}
                className="glass rounded-xl px-3 py-4 text-center font-display font-bold transition-all"
                style={formation === f.name ? { color: t.accent, ...ringStyle(true) } : { color: "rgba(255,255,255,0.8)" }}
              >
                {f.name}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={formation}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-[280px] justify-self-center"
            >
              <Pitch
                formation={FORMATIONS.find((f) => f.name === formation)!}
                players={FORMATIONS.find((f) => f.name === formation)!.slots.map(() => null)}
                variant={pendingPool === "clubs" ? "cl" : pendingPool}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* DIFFICULTY */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted">Difficulty</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              onClick={() => { setDifficulty(d.id); play("click"); }}
              className="glass rounded-2xl p-4 text-left transition-all hover:ring-1 hover:ring-white/20"
              style={ringStyle(difficulty === d.id)}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">{d.title}</h3>
                <span className="chip" style={difficulty === d.id ? { background: t.soft, color: t.accent } : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                  {d.id === "hard" ? "🔥" : d.id === "medium" ? "⚖️" : "🎯"}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">{d.body}</p>
              <p className="mt-2 text-[0.68rem] font-semibold" style={{ color: t.accent }}>{d.rerolls}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-12 flex justify-center">
        <button
          className={`btn btn-pulse px-10 ${pendingPool === "copa" ? "btn-copa" : pendingPool === "euro" ? "btn-euro" : "btn-gold"}`}
          onClick={() => { startDraft(mode, formation, difficulty, undefined, pendingPool); play("select"); }}
        >
          {pendingPool === "clubs" ? "Begin Champions Draft →" : `Begin ${t.label} Draft →`}
        </button>
      </div>
    </div>
  );
}
