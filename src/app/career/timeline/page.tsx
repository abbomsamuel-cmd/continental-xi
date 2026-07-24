"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { useHydrated } from "@/lib/useHydrated";
import { play } from "@/lib/sound";
import { useC } from "@/lib/career/copy";
import { useCurrentPlayer } from "@/lib/career/store";
import { groupIntoChapters, type TimelineChapter } from "@/lib/career/chapters";
import { careerTotals, seasonLabel } from "@/lib/career/util";
import type { CareerPlayer } from "@/lib/career/types";
import { ClubCrest } from "@/components/career/ClubCrest";
import { CountryFlag } from "@/components/career/CountryFlag";

export default function TimelinePage() {
  const hydrated = useHydrated();
  const player = useCurrentPlayer();
  const c = useC();

  if (!hydrated) return <div className="min-h-screen" />;
  if (!player) {
    return (
      <div className="mx-auto max-w-md px-4 pt-32 text-center">
        <p className="text-white/55">{c("No active career.", "No hay carrera activa.")}</p>
        <Link href="/career/new" className="btn btn-gold mt-4">⚽ {c("Create Your Player", "Crea Tu Jugador")}</Link>
      </div>
    );
  }
  return <Timeline player={player} />;
}

function Timeline({ player }: { player: CareerPlayer }) {
  const c = useC();
  const totals = careerTotals(player);
  const startAge = player.age - player.seasons.length;
  const chapters = groupIntoChapters(player.seasons, startAge);
  const peakSeason = player.seasons.reduce<null | { overall: number; age: number }>(
    (best, s) => (!best || s.overall > best.overall ? { overall: s.overall, age: s.age } : best), null,
  );

  return (
    <div className="mx-auto max-w-4xl px-3 pb-16 pt-20 sm:px-4 sm:pt-24">
      <div className="flex items-center gap-3">
        <CountryFlag country={player.nationality} size={22} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl font-black text-white sm:text-3xl">{player.name}</h1>
          <div className="text-[0.7rem] uppercase tracking-widest text-white/40">{c("Career Timeline", "Trayectoria")}</div>
        </div>
        <Link href="/career" className="shrink-0 text-[0.68rem] font-semibold text-white/40 hover:text-white/80">← {c("Back", "Atrás")}</Link>
      </div>

      {/* the career at a glance */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-white/10 bg-[#0b1122] px-4 py-3">
        <Stat n={chapters.length} k={c("CHAPTERS", "CAPÍTULOS")} />
        <Stat n={totals.clubs} k={c("CLUBS", "CLUBES")} />
        <Stat n={totals.apps} k={c("APPS", "PJ")} />
        <Stat n={totals.goals} k={c("GOALS", "GOLES")} />
        <Stat n={totals.assists} k={c("ASSISTS", "ASIST")} />
        <Stat n={totals.honours} k={c("TROPHIES", "TÍTULOS")} />
        {peakSeason && (
          <div className="flex items-baseline gap-1">
            <span className="font-display text-base font-extrabold text-gold">{peakSeason.overall}</span>
            <span className="text-[0.5rem] font-bold uppercase tracking-widest text-white/35">{c("PEAK @", "PICO @")}{peakSeason.age}</span>
          </div>
        )}
      </div>

      {chapters.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/12 py-14 text-center">
          <div className="text-3xl">📖</div>
          <p className="mt-2 text-sm text-white/45">{c("Nothing written yet. Play your first chapter.", "Nada escrito aún. Juega tu primer capítulo.")}</p>
          <Link href="/career/season" className="btn btn-gold mt-4">▶ {c("Play Chapter", "Jugar Capítulo")}</Link>
        </div>
      ) : (
        <div className="mt-3 space-y-1.5">
          {chapters.map((ch, i) => (
            <ChapterRow key={ch.fromAge} ch={ch} peak={totals.peakOverall} last={i === chapters.length - 1 && player.retired} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ n, k }: { n: number; k: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="font-display text-base font-extrabold text-white">{n}</span>
      <span className="text-[0.5rem] font-bold uppercase tracking-widest text-white/35">{k}</span>
    </div>
  );
}

/** One two-year chapter; tap to unfold the individual seasons inside it. */
function ChapterRow({ ch, peak, last }: { ch: TimelineChapter; peak: number; last: boolean }) {
  const c = useC();
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const delta = ch.overallTo - ch.overallFrom;
  const best = ch.overallTo >= peak && peak > 0;

  const accent = last ? "border-white/20 bg-white/[0.04]"
    : best ? "border-gold/30 bg-gold/[0.05]"
    : delta < 0 ? "border-red-400/20 bg-[#0b1122]"
    : "border-white/8 bg-[#0b1122]";

  return (
    <div className={`overflow-hidden rounded-xl border ${accent}`}>
      <button onClick={() => { setOpen((o) => !o); play("hover"); }}
        className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2.5 text-left sm:grid-cols-[auto_1fr_auto_auto_auto_auto]">
        <span className="font-display text-[0.82rem] font-black tabular-nums text-white/75">{ch.fromAge}–{ch.toAge}</span>

        <div className="flex min-w-0 items-center gap-1.5">
          {ch.transferred && <span className="shrink-0 text-[0.72rem] text-cyan-300" title={c("Transfer", "Traspaso")}>⇄</span>}
          <ClubCrest short={ch.clubShort} colors={ch.clubColors} size={18} />
          <span className="truncate text-[0.82rem] font-semibold text-white/90">{ch.clubName}</span>
          <span className="hidden truncate text-[0.64rem] text-white/30 md:inline">{ch.leagueName}</span>
          {ch.honours.map((h, i) => <span key={i} className="shrink-0 text-[0.7rem] text-gold" title={h}>★</span>)}
          {last && <span className="shrink-0 rounded bg-white/10 px-1.5 text-[0.56rem] font-bold uppercase text-white/60">{c("Retired", "Retirado")}</span>}
        </div>

        <span className="flex items-center gap-1 font-display text-[0.82rem] font-extrabold tabular-nums text-white">
          {ch.overallTo}
          {delta !== 0 && (
            <span className="text-[0.64rem]" style={{ color: delta > 0 ? "#7ee081" : "#ff6b6b" }}>
              {delta > 0 ? "▲" : "▼"}{Math.abs(delta)}
            </span>
          )}
        </span>

        <span className="hidden w-9 text-right text-[0.74rem] tabular-nums text-white/55 sm:block">{ch.apps}</span>
        <span className="hidden w-9 text-right text-[0.74rem] font-bold tabular-nums text-white/85 sm:block">{ch.goals}</span>
        <span className="hidden w-9 text-right text-[0.74rem] tabular-nums text-white/55 sm:block">{ch.assists}</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }} className="overflow-hidden border-t border-white/8 bg-black/25">
            <div className="space-y-1 p-3">
              {ch.seasons.map((s) => (
                <div key={s.year} className="flex items-center gap-2 text-[0.74rem]">
                  <span className="w-16 shrink-0 tabular-nums text-white/40">{seasonLabel(s.year)}</span>
                  <span className="w-7 shrink-0 tabular-nums text-white/40">{s.age}</span>
                  <ClubCrest short={s.clubShort} colors={s.clubColors} size={13} />
                  <span className="min-w-0 flex-1 truncate text-white/70">{s.clubName}</span>
                  <span className="w-8 text-right font-bold tabular-nums text-white/80">{s.overall}</span>
                  <span className="w-8 text-right tabular-nums text-white/50">{s.apps}</span>
                  <span className="w-8 text-right tabular-nums text-white/80">{s.goals}</span>
                  <span className="w-8 text-right tabular-nums text-white/50">{s.assists}</span>
                </div>
              ))}
              {ch.honours.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border-t border-white/8 pt-2">
                  {ch.honours.map((h, i) => (
                    <span key={i} className="rounded-full bg-gold/12 px-2 py-0.5 text-[0.64rem] font-bold text-gold">★ {h}</span>
                  ))}
                </div>
              )}
              <div className="pt-1 text-[0.62rem] text-white/30">{lang === "es" ? "Toca para cerrar" : "Tap to collapse"}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
