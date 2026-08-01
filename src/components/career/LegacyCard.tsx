"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useC } from "@/lib/career/copy";
import { useLang } from "@/lib/i18n";
import { play } from "@/lib/sound";
import {
  careerRecords, legacyScore, LEGACY_TIERS, type LegacyTier,
} from "@/lib/career/legacy";
import { intlOf } from "@/lib/career/run";
import { resolveHonour, type ResolvedHonour } from "@/lib/career/competitions";
import { shareLegacyCard } from "@/lib/career/legacy-card";
import { fmtMoney } from "@/lib/career/util";
import { TrophyArt, type TrophyId } from "@/components/career/TrophyArt";
import { CountryFlag } from "@/components/career/CountryFlag";
import type { CareerPlayer } from "@/lib/career/types";

/** Each legacy tier gets a signature colour — steel at the bottom, gold at the top. */
const TIER_ACCENT: Record<LegacyTier, string> = {
  graduate: "#9aa3b2",
  professional: "#8fb8ff",
  clubHero: "#5ec8d8",
  nationalHero: "#7ee081",
  elite: "#c9a7ff",
  worldClass: "#ffd88a",
  legend: "#f2c14e",
  goatCandidate: "#ffae57",
  goat: "#ffd54a",
};

interface TrophyTally { id: TrophyId; en: string; es: string; count: number }

/** Group every honour into resolved competitions with counts — the real art. */
function trophyTally(player: CareerPlayer): TrophyTally[] {
  const groups = new Map<TrophyId, TrophyTally>();
  const add = (r: ResolvedHonour) => {
    const g = groups.get(r.id) ?? { id: r.id, en: r.en, es: r.es, count: 0 };
    g.count += 1;
    groups.set(r.id, g);
  };
  for (const s of player.seasons) for (const h of s.honours) add(resolveHonour(h, s.clubId));
  for (const h of player.intl?.majorHonours ?? []) add(resolveHonour(h.split(" ·")[0].trim()));
  return [...groups.values()].sort((a, b) => b.count - a.count);
}

export function LegacyCard({ player, onClose }: { player: CareerPlayer; onClose: () => void }) {
  const c = useC();
  const { lang } = useLang();
  const es = lang === "es";
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"shared" | "downloaded" | null>(null);

  const { records, legacy, tally, intl } = useMemo(() => {
    const intlState = intlOf(player);
    const rec = careerRecords(player);
    const leg = legacyScore(player, rec, intlState.caps, intlState.goals);
    return { records: rec, legacy: leg, tally: trophyTally(player), intl: intlState };
  }, [player]);

  const accent = TIER_ACCENT[legacy.tier];
  const tierIndex = LEGACY_TIERS.indexOf(legacy.tier);

  const cells: { label: string; value: string }[] = [
    { label: c("Apps", "PJ"), value: String(records.totalApps) },
    { label: c("Goals", "Goles"), value: String(records.totalGoals) },
    { label: c("Assists", "Asist."), value: String(records.totalAssists) },
    { label: c("Titles", "Títulos"), value: String(records.totalTrophies) },
    { label: c("Caps", "Internac."), value: `${intl.caps}` },
    { label: c("Peak value", "Valor máx."), value: fmtMoney(records.peakMarketValue) },
  ];

  const share = async () => {
    setBusy(true);
    play("select");
    try {
      const res = await shareLegacyCard({
        name: player.name,
        subtitle: `${player.nationality} · ${player.position} · ${c("Retired at", "Retirado a los")} ${player.age}`,
        title: es ? legacy.titleEs : legacy.titleEn,
        score: legacy.score,
        peakOverall: records.peakOverall,
        accent,
        trophyLine: `${records.totalTrophies} ${c("major honours", "títulos")}`,
        records: cells,
        breakdown: legacy.breakdown.map((b) => ({
          label: es ? b.labelEs : b.labelEn, points: b.points, max: b.max,
        })),
      });
      setDone(res);
    } catch {
      /* canvas/share unavailable — leave the card open, no state change */
    } finally {
      setBusy(false);
    }
  };

  // score ring geometry
  const R = 52, CIRC = 2 * Math.PI * R;
  const filled = CIRC * Math.max(0, Math.min(1, legacy.score / 100));

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[55] grid place-items-center bg-black/80 p-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.86, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border p-6 shadow-2xl sm:p-7"
        style={{
          borderColor: `${accent}55`,
          background: `radial-gradient(120% 80% at 50% 0%, ${accent}22, #070d22 55%, #050910 100%)`,
        }}
      >
        <button onClick={onClose} aria-label="Close"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white">✕</button>

        {/* header */}
        <div className="text-center">
          <div className="text-[0.6rem] font-bold uppercase tracking-[0.4em]" style={{ color: accent }}>
            {c("Career Legacy", "Legado de Carrera")}
          </div>
          <h1 className="mt-2 font-display text-3xl font-black leading-none text-white">{player.name}</h1>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[0.78rem] font-semibold text-white/55">
            <CountryFlag country={player.nationality} size={13} />
            <span>{player.nationality}</span>
            <span className="text-white/25">·</span>
            <span>{player.position}</span>
            <span className="text-white/25">·</span>
            <span>{c("Retired at", "Retirado a los")} {player.age}</span>
          </div>
        </div>

        {/* tier title + score dial */}
        <div className="mt-5 flex items-center justify-center gap-5">
          <div className="relative grid h-32 w-32 shrink-0 place-items-center">
            <svg viewBox="0 0 128 128" className="absolute inset-0 -rotate-90">
              <circle cx="64" cy="64" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="11" />
              <motion.circle cx="64" cy="64" r={R} fill="none" stroke={accent} strokeWidth="11" strokeLinecap="round"
                strokeDasharray={CIRC} initial={{ strokeDashoffset: CIRC }} animate={{ strokeDashoffset: CIRC - filled }}
                transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }} />
            </svg>
            <div className="text-center">
              <div className="font-display text-4xl font-black text-white">{legacy.score}</div>
              <div className="text-[0.44rem] font-bold uppercase tracking-widest text-white/40">{c("Legacy", "Legado")}</div>
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-display text-2xl font-black leading-tight" style={{ color: accent }}>
              {es ? legacy.titleEs : legacy.titleEn}
            </div>
            <div className="mt-1 text-[0.72rem] font-semibold text-white/50">
              {c("Peak", "Máximo")} {records.peakOverall} OVR
              {records.peakOverallAge ? ` · ${c("age", "edad")} ${records.peakOverallAge}` : ""}
            </div>
            {/* tier ladder */}
            <div className="mt-2 flex items-center gap-1">
              {LEGACY_TIERS.map((t, i) => (
                <span key={t} className="h-1.5 rounded-full transition-all"
                  style={{ width: i === tierIndex ? 18 : 7, background: i <= tierIndex ? accent : "rgba(255,255,255,0.14)" }} />
              ))}
            </div>
          </div>
        </div>

        {/* headline records */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {cells.map((r) => (
            <div key={r.label} className="rounded-xl border border-white/8 bg-white/[0.03] px-2 py-2.5 text-center">
              <div className="font-display text-lg font-black leading-none text-white">{r.value}</div>
              <div className="mt-1 text-[0.5rem] font-bold uppercase tracking-widest text-white/40">{r.label}</div>
            </div>
          ))}
        </div>

        {/* trophy haul */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[0.55rem] font-bold uppercase tracking-widest text-white/40">{c("Honours", "Palmarés")}</span>
            {tally.length > 0 && <span className="text-[0.55rem] font-bold" style={{ color: accent }}>{records.totalTrophies} {c("titles", "títulos")}</span>}
          </div>
          {tally.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5 opacity-60">
              <TrophyArt id="league-trophy" size={20} />
              <span className="text-[0.7rem] font-semibold text-white/45">{c("A career without silverware — but a career all the same.", "Una carrera sin títulos — pero una carrera al fin y al cabo.")}</span>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-x-1 gap-y-2 sm:grid-cols-5">
              {tally.slice(0, 10).map((t) => (
                <div key={t.id} className="flex flex-col items-center text-center">
                  <div className="relative">
                    <TrophyArt id={t.id} size={34} title={es ? t.es : t.en} />
                    {t.count > 1 && <span className="absolute -right-1.5 -top-1 rounded-full px-1 text-[0.5rem] font-black text-[#2a1e00]" style={{ background: accent }}>×{t.count}</span>}
                  </div>
                  <span className="mt-1 line-clamp-2 text-[0.5rem] font-semibold leading-tight text-white/55">{es ? t.es : t.en}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* what the score is made of */}
        <div className="mt-5">
          <div className="mb-2 text-[0.55rem] font-bold uppercase tracking-widest text-white/40">{c("What defined the legacy", "Qué definió el legado")}</div>
          <div className="space-y-1.5">
            {legacy.breakdown.map((b) => {
              const p = b.max > 0 ? Math.max(0, Math.min(1, b.points / b.max)) : 0;
              return (
                <div key={b.labelEn} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 text-[0.62rem] font-semibold text-white/55">{es ? b.labelEs : b.labelEn}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${p * 100}%` }} transition={{ duration: 0.7, delay: 0.25 }}
                      className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${accent}, #f2d472)` }} />
                  </div>
                  <span className="w-9 shrink-0 text-right text-[0.6rem] font-bold tabular-nums text-white/45">{b.points}/{b.max}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* actions */}
        <div className="mt-6 flex flex-col gap-2">
          <button onClick={share} disabled={busy} className="btn btn-career w-full text-sm disabled:opacity-60">
            {busy ? c("Rendering…", "Generando…") : done === "shared" ? c("Shared ✓", "Compartido ✓") : done === "downloaded" ? c("Saved ✓ — share again", "Guardado ✓ — compartir otra vez") : `📸 ${c("Share Legacy Card", "Compartir Tarjeta")}`}
          </button>
          <div className="flex gap-2">
            <Link href="/career/new" className="btn btn-secondary flex-1 text-sm">{c("Play Again", "Jugar de Nuevo")}</Link>
            <button onClick={onClose} className="btn btn-ghost flex-1 text-sm text-white/60">{c("Close", "Cerrar")}</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
