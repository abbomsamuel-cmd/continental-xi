"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { useHydrated } from "@/lib/useHydrated";
import { play } from "@/lib/sound";
import { useC, formAccent, formLabel } from "@/lib/career/copy";
import { useCareer, useCurrentPlayer } from "@/lib/career/store";
import { groupIntoChapters, type TimelineChapter } from "@/lib/career/chapters";
import { careerStatus, statusToneColor } from "@/lib/career/status";
import { worldClubById, worldLeagueById } from "@/lib/career/world";
import { careerTotals, fmtMoney } from "@/lib/career/util";
import type { CareerPlayer } from "@/lib/career/types";
import { CountryFlag } from "@/components/career/CountryFlag";
import { ClubCrest } from "@/components/career/ClubCrest";

export default function CareerOverview() {
  const hydrated = useHydrated();
  const player = useCurrentPlayer();
  const saves = useCareer((s) => s.saves);
  if (!hydrated) return <div className="min-h-screen" />;
  if (!player) return <EmptyState hasSaves={saves.length > 0} />;
  return <CareerHome player={player} />;
}

function EmptyState({ hasSaves }: { hasSaves: boolean }) {
  const c = useC();
  return (
    <div className="mx-auto max-w-md px-4 pt-32 text-center">
      <div className="text-5xl">⚽</div>
      <h1 className="mt-3 font-display text-2xl font-black text-white">{c("Start your career", "Empieza tu carrera")}</h1>
      <p className="mt-2 text-sm text-white/55">
        {c("Create a player and live a whole career — from the academy to retirement — in a few minutes.",
           "Crea un jugador y vive una carrera entera — de la cantera al retiro — en unos minutos.")}
      </p>
      <Link href="/career/new" className="btn btn-gold mt-5">⚽ {c("Create Your Player", "Crea Tu Jugador")}</Link>
      {hasSaves && <Link href="/career/saves" className="btn btn-ghost mt-2 block">{c("Load a save", "Cargar partida")}</Link>}
    </div>
  );
}

/** The whole of Career Mode on one screen: who you are, what's next, what you did. */
function CareerHome({ player }: { player: CareerPlayer }) {
  const c = useC();
  const { lang } = useLang();
  const es = lang === "es";
  const totals = careerTotals(player);
  const startAge = player.age - player.seasons.length;
  const chapters = groupIntoChapters(player.seasons, startAge);
  const club = worldClubById(player.currentClubId);
  const league = club ? worldLeagueById(club.leagueId) : undefined;

  const hist = player.seasons;
  const ovrDelta = hist.length >= 2 ? hist[hist.length - 1].overall - hist[hist.length - 2].overall : 0;
  const status = careerStatus(player.age, player.overall, ovrDelta, { retired: player.retired, peakOverall: player.peakOverall });
  const tone = statusToneColor(status.tone);

  const isKeeperish = player.position === "GK" || ["CB", "LB", "RB"].includes(player.position);
  const trophies = countHonours(chapters);

  return (
    <div className="mx-auto max-w-6xl px-3 pb-16 pt-20 sm:px-4 sm:pt-24">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f1d]">
        <div className="grid gap-0 lg:grid-cols-[38fr_62fr]">

          {/* ---------------- LEFT: who you are + what's next ---------------- */}
          <div className="border-b border-white/8 p-4 sm:p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-start gap-3">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-gold/30 bg-gold/10">
                <span className="font-display text-2xl font-black text-gold">{player.overall}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <CountryFlag country={player.nationality} size={14} />
                  <span className="truncate font-display text-lg font-black leading-tight text-white">{player.name}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.72rem] text-white/55">
                  <span className="rounded bg-white/8 px-1.5 py-0.5 font-bold text-white/80">{player.position}</span>
                  <span>#{player.shirtNumber}</span>
                  <span className="text-white/25">·</span>
                  <span>{c("Age", "Edad")} {player.age}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <ClubCrest short={player.currentClubShort} colors={player.currentClubColors} size={16} />
                  <span className="truncate text-[0.78rem] font-semibold text-white/80">{player.currentClubName}</span>
                </div>
                {league && <div className="text-[0.64rem] text-white/35">{league.name}</div>}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full px-2.5 py-0.5 text-[0.66rem] font-bold" style={{ background: `${tone}1f`, color: tone }}>
                {es ? status.labelEs : status.label}
              </span>
              <span className="rounded-full px-2.5 py-0.5 text-[0.66rem] font-semibold"
                style={{ background: `${formAccent[player.form]}18`, color: formAccent[player.form] }}>
                {formLabel(player.form, lang)}
              </span>
              <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-[0.66rem] font-semibold text-white/70">
                {fmtMoney(player.marketValue)}
              </span>
            </div>

            {/* career totals — one row, not five cards */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-white/8 bg-black/25 px-3 py-2.5">
              <Total n={totals.apps} k={c("APPS", "PJ")} />
              <Total n={isKeeperish ? totals.goals : totals.goals} k={c("GOALS", "GOLES")} />
              <Total n={totals.assists} k={c("ASSISTS", "ASIST")} />
              <Total n={totals.honours} k={c("TROPHIES", "TÍTULOS")} />
              <Total n={totals.clubs} k={c("CLUBS", "CLUBES")} />
              {player.national.caps > 0 && <Total n={player.national.caps} k={c("CAPS", "INTL")} />}
            </div>

            {/* trophy cabinet */}
            {trophies.length > 0 && (
              <div className="mt-3">
                <div className="mb-1.5 text-[0.52rem] font-bold uppercase tracking-widest text-white/35">{c("Trophy Cabinet", "Vitrina")}</div>
                <div className="flex flex-wrap gap-1.5">
                  {trophies.map(({ name, n }) => (
                    <span key={name} title={name}
                      className="rounded-lg border border-gold/25 bg-gold/[0.07] px-2 py-1 text-[0.68rem] font-bold text-gold">
                      ★ {name}{n > 1 && <span className="ml-1 opacity-70">×{n}</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* the decision */}
            <div className="mt-4 rounded-xl border border-white/10 bg-[#0b1122] p-3.5">
              {player.retired ? (
                <>
                  <div className="text-[0.52rem] font-bold uppercase tracking-widest text-white/35">{c("Career Complete", "Carrera Completa")}</div>
                  <p className="mt-1 text-[0.8rem] text-white/60">
                    {c("You hung up your boots at", "Colgaste las botas a los")} {player.age}. {c("Peak", "Pico")} {totals.peakOverall} OVR.
                  </p>
                  <Link href="/career/timeline" className="btn btn-gold mt-3 w-full text-sm">{c("View Full Career", "Ver Carrera Completa")}</Link>
                </>
              ) : (
                <>
                  <div className="text-[0.52rem] font-bold uppercase tracking-widest text-gold/70">{c("Next Chapter", "Próximo Capítulo")}</div>
                  <div className="mt-1 font-display text-2xl font-black text-white">
                    {c("Age", "Edad")} {player.age} <span className="text-white/30">→</span> {player.age + 2}
                  </div>
                  <p className="mt-1 text-[0.74rem] text-white/45">
                    {c("Two seasons, one summary. Then you decide what comes next.",
                       "Dos temporadas, un resumen. Luego decides qué sigue.")}
                  </p>
                  <Link href="/career/season" onClick={() => play("whistle")} className="btn btn-gold mt-3 w-full text-sm">
                    ▶ {c("Play Chapter", "Jugar Capítulo")}
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* ---------------- RIGHT: the story so far ---------------- */}
          <div className="p-4 sm:p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-sm font-black uppercase tracking-widest text-white/70">{c("Career", "Trayectoria")}</h2>
              {chapters.length > 0 && (
                <Link href="/career/timeline" className="text-[0.66rem] font-semibold text-gold/80 hover:text-gold">
                  {c("Full timeline", "Ver todo")} →
                </Link>
              )}
            </div>

            {chapters.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-white/12 py-10 text-center">
                <div className="text-2xl">📖</div>
                <p className="mt-2 text-[0.8rem] text-white/45">
                  {c("Your story starts here. Play your first chapter.", "Tu historia empieza aquí. Juega tu primer capítulo.")}
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-1.5">
                <div className="hidden grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 px-2.5 text-[0.5rem] font-bold uppercase tracking-widest text-white/25 sm:grid">
                  <span>{c("Age", "Edad")}</span><span>{c("Club", "Club")}</span>
                  <span className="text-right">OVR</span><span className="w-8 text-right">{c("PJ", "PJ")}</span>
                  <span className="w-8 text-right">{c("G", "G")}</span><span className="w-8 text-right">{c("A", "A")}</span>
                </div>
                {chapters.map((ch) => <ChapterRow key={ch.fromAge} ch={ch} peak={totals.peakOverall} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Total({ n, k }: { n: number; k: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="font-display text-base font-extrabold text-white">{n}</span>
      <span className="text-[0.5rem] font-bold uppercase tracking-widest text-white/35">{k}</span>
    </div>
  );
}

/** One two-year chapter. Colour supports the numbers; it never shouts over them. */
function ChapterRow({ ch, peak }: { ch: TimelineChapter; peak: number }) {
  const delta = ch.overallTo - ch.overallFrom;
  const best = ch.overallTo >= peak && peak > 0;
  const border = best ? "border-gold/30 bg-gold/[0.05]" : "border-white/8 bg-[#0b1122]";
  return (
    <div className={`grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-xl border px-2.5 py-2 sm:grid-cols-[auto_1fr_auto_auto_auto_auto] ${border}`}>
      <span className="font-display text-[0.78rem] font-black tabular-nums text-white/70">{ch.fromAge}–{ch.toAge}</span>

      <div className="flex min-w-0 items-center gap-1.5">
        {ch.transferred && <span className="shrink-0 text-[0.7rem] text-cyan-300" title="Transfer">⇄</span>}
        <ClubCrest short={ch.clubShort} colors={ch.clubColors} size={16} />
        <span className="truncate text-[0.78rem] font-semibold text-white/85">{ch.clubName}</span>
        <span className="hidden truncate text-[0.62rem] text-white/30 md:inline">{ch.leagueName}</span>
        {ch.honours.map((h, i) => <span key={i} className="shrink-0 text-[0.66rem] text-gold" title={h}>★</span>)}
      </div>

      <span className="flex items-center gap-1 font-display text-[0.78rem] font-extrabold tabular-nums text-white">
        {ch.overallTo}
        {delta !== 0 && (
          <span className="text-[0.62rem]" style={{ color: delta > 0 ? "#7ee081" : "#ff6b6b" }}>
            {delta > 0 ? "▲" : "▼"}{Math.abs(delta)}
          </span>
        )}
      </span>

      <span className="hidden w-8 text-right text-[0.72rem] tabular-nums text-white/55 sm:block">{ch.apps}</span>
      <span className="hidden w-8 text-right text-[0.72rem] font-bold tabular-nums text-white/80 sm:block">{ch.goals}</span>
      <span className="hidden w-8 text-right text-[0.72rem] tabular-nums text-white/55 sm:block">{ch.assists}</span>
    </div>
  );
}

function countHonours(chapters: TimelineChapter[]): { name: string; n: number }[] {
  const map = new Map<string, number>();
  for (const ch of chapters) for (const h of ch.honours) map.set(h, (map.get(h) ?? 0) + 1);
  return [...map].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n);
}
