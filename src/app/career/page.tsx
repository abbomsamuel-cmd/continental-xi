"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { useHydrated } from "@/lib/useHydrated";
import { play } from "@/lib/sound";
import { useC, formAccent, formLabel } from "@/lib/career/copy";
import { useCareer, useCurrentPlayer } from "@/lib/career/store";
import { groupIntoChapters, YEARS_PER_CHAPTER, type TimelineChapter } from "@/lib/career/chapters";
import { careerStatus, statusToneColor } from "@/lib/career/status";
import { CareerProgression } from "@/components/career/CareerProgression";
import { careerRecords, legacyScore } from "@/lib/career/legacy";
import { rollChapter, finalizeChapter, intlOf, type ChapterRun, type RunChoices } from "@/lib/career/run";
import { RECOVERY_CHOICES, type RecoveryChoice } from "@/lib/career/injuries";
import { choiceOf, type CareerEventDef } from "@/lib/career/events";
import { resolveHonour, seasonTrophies, type ResolvedHonour } from "@/lib/career/competitions";
import { worldClubById, worldLeagueById } from "@/lib/career/world";
import { careerTotals, fmtMoney, fmtWage, seasonLabel } from "@/lib/career/util";
import { TrophyArt, type TrophyId } from "@/components/career/TrophyArt";
import type { CareerPlayer, CareerSeason, TransferOffer } from "@/lib/career/types";
import { ClubCrest } from "@/components/career/ClubCrest";
import { CountryFlag } from "@/components/career/CountryFlag";
import { LegacyCard } from "@/components/career/LegacyCard";

const LAST_AGE = 38;

export default function CareerPage() {
  const hydrated = useHydrated();
  const player = useCurrentPlayer();
  const saves = useCareer((s) => s.saves);
  if (!hydrated) return <div className="min-h-screen" />;
  if (!player) return <EmptyState hasSaves={saves.length > 0} />;
  return <Career key={player.id} player={player} />;
}

function EmptyState({ hasSaves }: { hasSaves: boolean }) {
  const c = useC();
  return (
    <div className="mx-auto max-w-md px-4 pt-32 text-center">
      <div className="text-5xl">⚽</div>
      <h1 className="mt-3 font-display text-2xl font-black text-white">{c("Start your career", "Empieza tu carrera")}</h1>
      <p className="mt-2 text-sm text-white/55">
        {c("Create a player and live an entire career — academy to retirement — in a few minutes.",
           "Crea un jugador y vive una carrera entera — de la cantera al retiro — en unos minutos.")}
      </p>
      <Link href="/career/new" className="btn btn-career mt-5">⚽ {c("Create Your Player", "Crea Tu Jugador")}</Link>
      {hasSaves && <Link href="/career/saves" className="btn btn-ghost mt-2 block">{c("Load a save", "Cargar partida")}</Link>}
    </div>
  );
}

/* ---------------- colour helpers (the Copero-style badges) ---------------- */
function ovrStyle(ovr: number): { bg: string; fg: string } {
  if (ovr >= 85) return { bg: "linear-gradient(135deg,#f6d878,#d9b13f)", fg: "#3a2c00" };
  if (ovr >= 80) return { bg: "linear-gradient(135deg,#bcd4ff,#8fb8ff)", fg: "#0a1836" };
  if (ovr >= 74) return { bg: "linear-gradient(135deg,#b3bccb,#8794a8)", fg: "#0e1626" };
  if (ovr >= 67) return { bg: "linear-gradient(135deg,#9aa3b2,#6f7a8c)", fg: "#0c111c" };
  return { bg: "linear-gradient(135deg,#e6a25b,#cf7d33)", fg: "#2a1600" };
}
function OvrBadge({ value, size = 34, labeled = false }: { value: number; size?: number; labeled?: boolean }) {
  const s = ovrStyle(value);
  if (!labeled) {
    return (
      <span className="grid shrink-0 place-items-center rounded-lg font-display font-black"
        style={{ width: size, height: size, background: s.bg, color: s.fg, fontSize: size * 0.42 }}>
        {value}
      </span>
    );
  }
  return (
    <span className="flex shrink-0 flex-col items-center justify-center rounded-xl leading-none"
      style={{ width: size, height: size * 1.05, background: s.bg, color: s.fg }}>
      <span className="text-[0.5rem] font-bold uppercase tracking-widest opacity-70">OVR</span>
      <span className="mt-0.5 font-display font-black" style={{ fontSize: size * 0.4 }}>{value}</span>
    </span>
  );
}

/* ============================ THE ONE SCREEN ============================ */
type Choice = { retire?: boolean; action?: Parameters<ReturnType<typeof useCareer.getState>["commitChapter"]>[1] };

function Career({ player }: { player: CareerPlayer }) {
  const c = useC();
  const { lang } = useLang();
  const es = lang === "es";
  const commitChapter = useCareer((s) => s.commitChapter);
  const retireCareer = useCareer((s) => s.retireCareer);

  // The chapter currently being resolved, and the player's decisions so far.
  const [run, setRun] = useState<ChapterRun | null>(null);
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState<RunChoices>({});
  const [justCommitted, setJustCommitted] = useState(false);
  const [simming, setSimming] = useState(false);
  const [celebrate, setCelebrate] = useState<ResolvedHonour[] | null>(null);
  const [showLegacy, setShowLegacy] = useState(false);
  const simTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (simTimer.current) clearTimeout(simTimer.current); }, []);

  const totals = careerTotals(player);
  const startAge = player.age - player.seasons.length;
  const chapters = groupIntoChapters(player.seasons, startAge);
  const intl = intlOf(player);
  const legacy = legacyScore(player, careerRecords(player), intl.caps, intl.goals);

  const hist = player.seasons;
  const ovrDelta = hist.length >= 2 ? hist[hist.length - 1].overall - hist[hist.length - 2].overall : 0;
  const status = careerStatus(player.age, player.overall, ovrDelta, { retired: player.retired, peakOverall: player.peakOverall });
  const tone = statusToneColor(status.tone);

  // The prompts the player must clear before the chapter commits.
  const prompts = useMemo(() => (run ? buildPrompts(run) : []), [run]);
  const current = run ? prompts[step] : null;

  const startChapter = () => {
    play("whistle");
    // A short "simulating" beat so two seasons feel like they actually play out.
    setSimming(true);
    setJustCommitted(false);
    simTimer.current = setTimeout(() => {
      setRun(rollChapter(player));
      setStep(0);
      setChoices({});
      setSimming(false);
      play("advance");
    }, 1150);
  };

  const advance = (patch: RunChoices) => {
    play("select");
    setChoices((ch) => ({ ...ch, ...patch, eventChoices: { ...ch.eventChoices, ...patch.eventChoices } }));
    setStep((s) => s + 1);
  };

  const finish = (final: Choice) => {
    if (!run) return;
    const fin = finalizeChapter(player, run, choices);
    const retire = final.retire || fin.forcedRetire || fin.player.age >= 40;
    // Anything the chapter's two seasons actually won — for the celebration.
    const won = run.result.seasons.flatMap((s) => seasonTrophies(s));
    commitChapter(fin.player, retire ? { type: "stay" } : (final.action ?? { type: "stay" }));
    if (retire) retireCareer(useCareer.getState().currentId ?? "");
    play(won.length || retire ? "trophy" : "advance");
    setRun(null); setStep(0); setChoices({}); setJustCommitted(true);
    if (won.length) setCelebrate(dedupeHonours(won));
    // The career ends on the Legacy Card — the emotional close of the whole run.
    if (retire) setShowLegacy(true);
  };

  return (
    <div className="relative mx-auto max-w-4xl px-3 pb-16 pt-20 sm:px-4 sm:pt-24">
      <div aria-hidden className="fixed inset-0 -z-10 bg-[#070709]" />
      <div className="grid gap-3 lg:grid-cols-[38fr_62fr]">

        {/* ============ LEFT — player + trophies + current action ============ */}
        <div className="space-y-3">
          <CareerProgression tier={legacy.tier} score={legacy.score} />
          <div className="rounded-2xl border border-white/10 bg-[#0c0c10] p-4 sm:p-5">
            {/* identity */}
            <div className="flex items-start gap-3">
              <OvrBadge value={player.overall} size={54} labeled />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <CountryFlag country={player.nationality} size={14} />
                  <span className="rounded bg-white/8 px-1.5 py-0.5 text-[0.58rem] font-bold text-white/70">#{player.shirtNumber} {player.position}</span>
                </div>
                <h1 className="mt-1 truncate font-display text-2xl font-black leading-none text-white">{player.name}</h1>
                <div className="mt-1 flex items-center gap-1.5">
                  <ClubCrest short={player.currentClubShort} colors={player.currentClubColors} size={16} />
                  <span className="truncate text-[0.82rem] font-semibold text-white/80">{player.currentClubName}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[0.5rem] font-bold uppercase tracking-widest text-white/35">{c("Age", "Edad")}</div>
                <div className="font-display text-xl font-black text-white">{player.age}</div>
                <div className="mt-1 text-[0.5rem] font-bold uppercase tracking-widest text-white/35">{c("Value", "Valor")}</div>
                <div className="font-display text-sm font-extrabold text-white">{fmtMoney(player.marketValue)}</div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full px-2.5 py-0.5 text-[0.64rem] font-bold" style={{ background: `${tone}1f`, color: tone }}>
                {es ? status.labelEs : status.label}
              </span>
              <span className="rounded-full px-2.5 py-0.5 text-[0.64rem] font-semibold" style={{ background: `${formAccent[player.form]}18`, color: formAccent[player.form] }}>
                {formLabel(player.form, lang)}
              </span>
              {intl.caps > 0 && (
                <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-[0.64rem] font-semibold text-white/70">
                  {intl.caps} {c("caps", "PJ")} · {intl.goals} {c("gls", "gol")}
                </span>
              )}
            </div>

            {/* stat line */}
            <div className="mt-4 grid grid-cols-3 divide-x divide-white/8 rounded-xl border border-white/8 bg-black/30 py-2.5 text-center">
              <BigStat n={totals.apps} k={c("APPS", "PJ")} icon="👕" />
              <BigStat n={totals.goals} k={c("GOALS", "GOLES")} icon="⚽" />
              <BigStat n={totals.assists} k={c("ASSISTS", "ASIST")} icon="👟" />
            </div>

            {/* trophy cabinet */}
            <TrophyCabinet seasons={player.seasons} intlHonours={player.intl?.majorHonours ?? []} />
          </div>

          {/* the current action — the beating heart of the one-screen loop */}
          <div className="rounded-2xl border border-white/10 bg-[#0c0c10] p-4 sm:p-5">
            {player.retired ? (
              <RetiredCard player={player} c={c} onLegacy={() => setShowLegacy(true)} />
            ) : simming ? (
              <SimmingCard player={player} c={c} />
            ) : !run ? (
              <IdleCard player={player} onPlay={startChapter} justCommitted={justCommitted} c={c} />
            ) : current?.kind === "injury" && run.injuryType ? (
              <InjuryCard run={run} onChoose={(recovery) => advance({ recovery })} c={c} es={es} />
            ) : current?.kind === "event" ? (
              <EventCard ev={current.ev} onChoose={(id) => advance({ eventChoices: { [current.ev.id]: id } })} c={c} es={es} />
            ) : (
              <DecisionCard player={player} run={run} choices={choices} onFinish={finish} c={c} es={es} />
            )}
          </div>
        </div>

        {/* ============ RIGHT — the age ladder ============ */}
        <div className="rounded-2xl border border-white/8 bg-[#0c0c10] p-2.5 sm:p-3">
          {/* column headers — the Copero career ledger */}
          <div className="grid grid-cols-[40px_1fr_42px_40px_40px_38px] items-center gap-2 px-2 pb-2 text-[0.5rem] font-bold uppercase tracking-[0.15em] text-white/30 sm:grid-cols-[46px_1fr_46px_46px_46px_44px]">
            <span>{c("Age", "Edad")}</span>
            <span>{c("Club", "Club")}</span>
            <span className="text-center">OVR</span>
            <span className="text-center">{c("Apps", "PJ")}</span>
            <span className="text-center">{c("Goals", "Gol")}</span>
            <span className="text-center">{c("Ast", "Asis")}</span>
          </div>
          <div className="space-y-1.5">
            {buildLadder(chapters, player).map((slot) => (
              <LadderRow key={slot.age} slot={slot} peak={totals.peakOverall}
                playing={(simming || !!run) && slot.state === "current"} simming={simming && slot.state === "current"} />
            ))}
            {intl.caps > 0 && (
              <NationalRow nation={player.nationality} caps={intl.caps} goals={intl.goals}
                assists={intl.assists ?? 0} honours={player.intl?.majorHonours ?? []} />
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {celebrate && <Celebration honours={celebrate} onDone={() => setCelebrate(null)} c={c} es={es} />}
      </AnimatePresence>
      <AnimatePresence>
        {showLegacy && player.retired && <LegacyCard player={player} onClose={() => setShowLegacy(false)} />}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- trophy-win celebration ---------------- */
function Celebration({ honours, onDone, c, es }: {
  honours: ResolvedHonour[]; onDone: () => void; c: (en: string, es: string) => string; es: boolean;
}) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onDone}
      className="fixed inset-0 z-[60] grid place-items-center bg-black/90 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.7, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="mx-4 rounded-3xl border border-gold/30 bg-gradient-to-b from-[#171205] to-[#0a0e1c] p-8 text-center shadow-2xl">
        <div className="text-[0.6rem] font-bold uppercase tracking-[0.4em] text-gold/70">{c("Silverware", "Título")}</div>
        <div className="mt-4 flex items-end justify-center gap-4">
          {honours.slice(0, 4).map((h, i) => (
            <motion.div key={h.id + i} initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1 + i * 0.12, type: "spring", stiffness: 260, damping: 14 }} className="flex flex-col items-center">
              <TrophyArt id={h.id} size={76} />
              <span className="mt-1.5 max-w-[7rem] text-[0.66rem] font-bold text-gold">{es ? h.es : h.en}</span>
            </motion.div>
          ))}
        </div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-5 font-display text-xl font-black text-white">{c("Champions!", "¡Campeón!")}</motion.p>
      </motion.div>
    </motion.div>
  );
}

function dedupeHonours(list: ResolvedHonour[]): ResolvedHonour[] {
  const seen = new Set<string>();
  return list.filter((h) => (seen.has(h.id) ? false : (seen.add(h.id), true)));
}

function BigStat({ n, k, icon }: { n: number; k: string; icon: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-[0.46rem] font-bold uppercase tracking-widest text-white/35">{k}</div>
      <div className="mt-0.5 flex items-center gap-1">
        <span className="text-[0.72rem] leading-none opacity-75">{icon}</span>
        <span className="font-display text-lg font-black text-white">{n}</span>
      </div>
    </div>
  );
}

/* ---------------- trophy cabinet — named, grouped, counted ---------------- */
interface TrophyWin { clubName: string; clubShort: string; clubColors: [string, string]; year: number; national: boolean }
interface TrophyGroup { id: TrophyId; en: string; es: string; wins: TrophyWin[] }

function TrophyCabinet({ seasons, intlHonours }: { seasons: CareerSeason[]; intlHonours: string[] }) {
  const c = useC();
  const { lang } = useLang();
  const es = lang === "es";
  const [open, setOpen] = useState<string | null>(null);

  // Group by the RESOLVED competition, remembering exactly where + when each was
  // won — so a Premier League title can never sit under a Brazilian trophy.
  const groups = new Map<string, TrophyGroup>();
  const add = (r: ResolvedHonour, win: TrophyWin) => {
    const g = groups.get(r.en) ?? { id: r.id, en: r.en, es: r.es, wins: [] };
    g.wins.push(win);
    groups.set(r.en, g);
  };
  for (const s of seasons) {
    for (const h of s.honours) {
      add(resolveHonour(h, s.clubId), { clubName: s.clubName, clubShort: s.clubShort, clubColors: s.clubColors, year: s.year, national: false });
    }
  }
  for (const h of intlHonours) {
    const name = h.split(" ·")[0].trim();
    const year = Number(h.match(/\b(20\d\d)\b/)?.[1] ?? 0);
    add(resolveHonour(name), { clubName: "", clubShort: "", clubColors: ["#8a94a8", "#5a6274"], year, national: true });
  }
  const list = [...groups.values()].sort((a, b) => b.wins.length - a.wins.length);
  const active = open ? groups.get(open) : null;

  return (
    <div className="mt-3 border-t border-white/8 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[0.5rem] font-bold uppercase tracking-widest text-white/35">{c("Trophy Cabinet", "Vitrina")}</span>
        {list.length > 0 && <span className="text-[0.5rem] font-bold text-gold/70">{list.reduce((n, g) => n + g.wins.length, 0)} {c("titles", "títulos")}</span>}
      </div>
      {list.length === 0 ? (
        <div className="flex items-center gap-2 opacity-40">
          <TrophyArt id="league-trophy" size={22} />
          <span className="text-[0.66rem] font-semibold uppercase tracking-widest text-white/40">{c("Empty Trophy Case", "Vitrina Vacía")}</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-x-1.5 gap-y-2.5 sm:grid-cols-4">
            {list.map((g) => {
              const isOpen = open === g.en;
              return (
                <button key={g.en} onClick={() => { setOpen(isOpen ? null : g.en); play("hover"); }}
                  className={`flex flex-col items-center rounded-lg px-1 py-1 text-center transition-colors ${isOpen ? "bg-gold/10" : "hover:bg-white/5"}`}>
                  <div className="relative">
                    <TrophyArt id={g.id} size={34} title={es ? g.es : g.en} />
                    {g.wins.length > 1 && (
                      <span className="absolute -right-1.5 -top-1 rounded-full bg-gold px-1 text-[0.52rem] font-black text-[#2a1e00]">×{g.wins.length}</span>
                    )}
                  </div>
                  <span className="mt-1 line-clamp-2 text-[0.55rem] font-semibold leading-tight text-white/60">{es ? g.es : g.en}</span>
                </button>
              );
            })}
          </div>

          {/* tap a trophy → where + when it was won */}
          <AnimatePresence initial={false}>
            {active && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }} className="overflow-hidden">
                <div className="mt-2 rounded-lg border border-gold/20 bg-black/30 p-2.5">
                  <div className="flex items-center gap-1.5">
                    <TrophyArt id={active.id} size={16} />
                    <span className="text-[0.7rem] font-bold text-gold">{es ? active.es : active.en}</span>
                    <span className="text-[0.6rem] text-white/40">×{active.wins.length}</span>
                  </div>
                  <div className="mt-1.5 space-y-1">
                    {[...active.wins].sort((a, b) => a.year - b.year).map((w, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[0.68rem] text-white/70">
                        {w.national ? <span className="text-[0.7rem]">🏴</span> : <ClubCrest short={w.clubShort} colors={w.clubColors} size={13} />}
                        <span className="min-w-0 flex-1 truncate">{w.national ? c("with your nation", "con tu selección") : w.clubName}</span>
                        {w.year > 0 && <span className="tabular-nums text-white/45">{w.year}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

/* ---------------- left-panel states ---------------- */
function IdleCard({ player, onPlay, justCommitted, c }: {
  player: CareerPlayer; onPlay: () => void; justCommitted: boolean; c: (en: string, es: string) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-[0.55rem] font-bold uppercase tracking-[0.25em]" style={{ color: "#b39cf5" }}>
          {justCommitted ? c("Chapter saved", "Capítulo guardado") : c("Next Chapter", "Próximo Capítulo")}
        </div>
        <div className="text-[0.6rem] font-bold text-white/45">{c("Season", "Temporada")} {seasonLabel(player.currentYear)}</div>
      </div>
      <div className="mt-1 font-display text-2xl font-black text-white sm:text-3xl">
        {c("Age", "Edad")} {player.age} <span className="text-white/25">→</span> {player.age + YEARS_PER_CHAPTER}
      </div>
      <p className="mt-1 text-[0.76rem] leading-relaxed text-white/45">
        {c("Two seasons play out at", "Se juegan dos temporadas en")} {player.currentClubName}. {c("Handle what comes, then choose your next move.", "Afronta lo que venga y elige tu próximo paso.")}
      </p>
      <button onClick={onPlay}
        className="mt-4 w-full rounded-xl py-3 font-display text-base font-black text-white transition-transform hover:-translate-y-0.5"
        style={{ background: "linear-gradient(135deg, #8b5cf6, #a78bfa)", boxShadow: "0 8px 24px rgba(139,92,246,0.4)" }}>
        ▶ {c("Play", "Jugar")}
      </button>
    </div>
  );
}

function SimmingCard({ player, c }: { player: CareerPlayer; c: (en: string, es: string) => string }) {
  return (
    <div className="py-2 text-center">
      <div className="text-[0.55rem] font-bold uppercase tracking-[0.25em] text-gold/70">
        {c("Season", "Temporada")} {seasonLabel(player.currentYear)}–{seasonLabel(player.currentYear + 1)}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }}
          className="h-2.5 w-2.5 rounded-full bg-gold" />
        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          className="h-2.5 w-2.5 rounded-full bg-gold" />
        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
          className="h-2.5 w-2.5 rounded-full bg-gold" />
      </div>
      <div className="mt-3 font-display text-lg font-black text-white">{c("Simulating…", "Simulando…")}</div>
      <p className="mt-1 text-[0.74rem] text-white/45">
        {c("Two seasons at", "Dos temporadas en")} {player.currentClubShort} · {c("Age", "Edad")} {player.age}→{player.age + YEARS_PER_CHAPTER}
      </p>
    </div>
  );
}

function InjuryCard({ run, onChoose, c, es }: {
  run: ChapterRun; onChoose: (r: RecoveryChoice) => void; c: (en: string, es: string) => string; es: boolean;
}) {
  const inj = run.injuryType!;
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/15 text-lg">🩺</span>
        <div>
          <div className="text-[0.52rem] font-bold uppercase tracking-widest text-red-300/80">{c("Injury", "Lesión")}</div>
          <h2 className="font-display text-lg font-black leading-none text-white">{es ? inj.titleEs : inj.titleEn}</h2>
        </div>
      </div>
      <p className="mt-2 text-[0.8rem] leading-relaxed text-white/55">
        {c("How you handle the recovery shapes what you get back.", "Cómo gestiones la recuperación decide lo que recuperas.")}
      </p>
      <div className="mt-3 space-y-2">
        {RECOVERY_CHOICES.map((r) => (
          <button key={r.id} onClick={() => onChoose(r.id)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:border-red-400/40 hover:bg-white/[0.06]">
            <div className="font-display text-[0.9rem] font-extrabold text-white">{es ? r.labelEs : r.labelEn}</div>
            <div className="mt-0.5 text-[0.72rem] leading-snug text-white/50">{es ? r.descEs : r.descEn}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function EventCard({ ev, onChoose, c, es }: {
  ev: CareerEventDef; onChoose: (choiceId: string) => void; c: (en: string, es: string) => string; es: boolean;
}) {
  const toneBar = ev.category === "positive" ? "#7ee081" : ev.category === "negative" ? "#ff6b6b" : "#8fb8ff";
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg text-lg" style={{ background: `${toneBar}1a` }}>{ev.icon}</span>
        <div>
          <div className="text-[0.52rem] font-bold uppercase tracking-widest" style={{ color: `${toneBar}cc` }}>
            {ev.category === "positive" ? c("Milestone", "Hito") : ev.category === "negative" ? c("Setback", "Contratiempo") : c("Decision", "Decisión")}
          </div>
          <h2 className="font-display text-lg font-black leading-tight text-white">{es ? ev.titleEs : ev.titleEn}</h2>
        </div>
      </div>
      <p className="mt-2 text-[0.82rem] leading-relaxed text-white/60">{es ? ev.bodyEs : ev.bodyEn}</p>

      {ev.choices && ev.choices.length ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {ev.choices.map((ch) => (
            <button key={ch.id} onClick={() => onChoose(ch.id)}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:border-gold/40 hover:bg-white/[0.06]">
              <div className="font-display text-[0.88rem] font-extrabold text-white">{es ? ch.labelEs : ch.labelEn}</div>
              <div className="mt-0.5 text-[0.7rem] leading-snug text-white/50">{es ? ch.descEs : ch.descEn}</div>
              <EffectChips e={choiceOf(ev, ch.id)?.effects} />
            </button>
          ))}
        </div>
      ) : (
        <button onClick={() => onChoose("__ok")} className="btn btn-career mt-3 w-full text-sm">{c("Continue", "Continuar")} →</button>
      )}
    </div>
  );
}

/** Small coloured risk/reward indicators, Copero-style. */
function EffectChips({ e }: { e?: { ovr?: number; marketPct?: number; trust?: number; injuryRisk?: number; reputationShift?: number } }) {
  if (!e) return null;
  const chips: { t: string; up: boolean }[] = [];
  if (e.ovr) chips.push({ t: `${e.ovr > 0 ? "+" : ""}${e.ovr} OVR`, up: e.ovr > 0 });
  if (e.marketPct) chips.push({ t: `${e.marketPct > 0 ? "+" : ""}${e.marketPct}% value`, up: e.marketPct > 0 });
  if (e.trust) chips.push({ t: `${e.trust > 0 ? "+" : ""}${e.trust} trust`, up: e.trust > 0 });
  if (e.reputationShift) chips.push({ t: `${e.reputationShift > 0 ? "+" : ""}rep`, up: e.reputationShift > 0 });
  if (e.injuryRisk && e.injuryRisk > 0) chips.push({ t: "injury risk", up: false });
  if (!chips.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {chips.map((ch, i) => (
        <span key={i} className="rounded px-1.5 py-0.5 text-[0.56rem] font-bold"
          style={{ background: ch.up ? "#7ee0811a" : "#ff6b6b1a", color: ch.up ? "#7ee081" : "#ff6b6b" }}>
          {ch.up ? "▲" : "▼"} {ch.t}
        </span>
      ))}
    </div>
  );
}

function DecisionCard({ player, run, choices, onFinish, c, es }: {
  player: CareerPlayer; run: ChapterRun; choices: RunChoices;
  onFinish: (final: Choice) => void; c: (en: string, es: string) => string; es: boolean;
}) {
  const preview = useMemo(() => finalizeChapter(player, run, choices), [player, run, choices]);
  if (preview.forcedRetire) {
    return (
      <div className="text-center">
        <div className="text-3xl">🎖️</div>
        <h2 className="mt-1 font-display text-lg font-black text-white">{c("A career-ending blow", "Un golpe que acaba la carrera")}</h2>
        <p className="mt-1 text-[0.8rem] text-white/55">{c("The injury proved one too many. It's time.", "La lesión fue una de más. Es la hora.")}</p>
        <button onClick={() => onFinish({ retire: true })} className="btn btn-career mt-3 w-full text-sm">{c("Hang Up the Boots", "Colgar las Botas")}</button>
      </div>
    );
  }
  const after = preview.player;
  return (
    <div>
      <div className="text-[0.55rem] font-bold uppercase tracking-[0.25em] text-gold/70">{c("Transfer Window", "Mercado de Fichajes")}</div>
      <p className="mt-1 text-[0.78rem] text-white/50">
        {run.result.offers.length > 0 ? c("Clubs have made their move.", "Los clubes han movido ficha.") : c("No offers this time. Stay and keep proving it.", "Sin ofertas esta vez. Quédate y sigue demostrando.")}
      </p>
      <div className="mt-3 space-y-2">
        {run.result.offers.map((o) => <OfferCard key={o.clubId} offer={o} onAccept={() => onFinish({ action: { type: "transfer", offer: o } })} c={c} es={es} />)}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => onFinish({ action: { type: "stay" } })} className="btn btn-secondary flex-1 text-sm">{c("Stay at", "Quedarme en")} {after.currentClubShort}</button>
        {run.result.contractExpiring && <button onClick={() => onFinish({ action: { type: "renew" } })} className="btn btn-career text-sm">{c("Renew", "Renovar")}</button>}
        {after.age >= 33 && <button onClick={() => onFinish({ retire: true })} className="btn btn-ghost text-sm text-white/50">{c("Retire", "Retirarme")}</button>}
      </div>
    </div>
  );
}

function OfferCard({ offer: o, onAccept, c, es }: {
  offer: TransferOffer; onAccept: () => void; c: (en: string, es: string) => string; es: boolean;
}) {
  const cl = worldClubById(o.clubId);
  const league = cl ? worldLeagueById(cl.leagueId) : undefined;
  if (!cl) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
      <span aria-hidden className="block h-0.5" style={{ background: `linear-gradient(90deg, ${cl.colors[0]}, ${cl.colors[1]})` }} />
      <div className="p-3">
        <div className="flex items-center gap-2.5">
          <ClubCrest short={cl.short} colors={cl.colors} size={34} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1"><span className="truncate font-display text-[0.92rem] font-extrabold text-white">{cl.name}</span><CountryFlag country={cl.country} size={11} /></div>
            <div className="text-[0.64rem] text-white/45">{league?.name}</div>
          </div>
          <span className="shrink-0 text-[0.58rem] font-bold text-gold">{"★".repeat(o.developmentStars)}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.68rem] text-white/60">
          <span>{fmtWage(o.wage)}</span><span>· {o.years} {c("yrs", "años")}</span><span>· {o.expectedApps[0]}–{o.expectedApps[1]} {c("apps", "PJ")}</span>
        </div>
        <p className="mt-1.5 text-[0.7rem] italic leading-snug text-white/50">{es ? o.reasonEs : o.reasonEn}</p>
        <button onClick={onAccept} className="btn btn-career mt-2 w-full text-sm">{c("Sign", "Fichar")}</button>
      </div>
    </div>
  );
}

function RetiredCard({ player, c, onLegacy }: {
  player: CareerPlayer; c: (en: string, es: string) => string; onLegacy: () => void;
}) {
  return (
    <div className="text-center">
      <div className="text-4xl">🥾</div>
      <h2 className="mt-1 font-display text-xl font-black text-white">{c("Your career has come to an end", "Tu carrera ha llegado a su fin")}</h2>
      <p className="mt-1 text-[0.8rem] text-white/50">
        {c("Hung up the boots at", "Colgaste las botas a los")} {player.age}.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <button onClick={onLegacy} className="btn btn-career w-full text-sm">🏆 {c("View Legacy Card", "Ver Tarjeta de Legado")}</button>
        <Link href="/career/timeline" className="btn btn-secondary w-full text-sm">{c("Career Timeline", "Trayectoria")}</Link>
        <Link href="/career/new" className="btn btn-ghost w-full text-sm text-white/60">{c("Play Again", "Jugar de Nuevo")}</Link>
      </div>
    </div>
  );
}

/* ---------------- the age ladder (right column) ---------------- */
type Slot = { age: number; chapter: TimelineChapter | null; state: "past" | "current" | "future" };

function buildLadder(chapters: TimelineChapter[], player: CareerPlayer): Slot[] {
  const byAge = new Map(chapters.map((ch) => [ch.fromAge, ch]));
  const start = player.age - player.seasons.length;
  const first = start - (start % YEARS_PER_CHAPTER);
  // Stop at the chapter the player is on (the "up next" row) instead of drawing
  // every empty age to 38 — a Copero-style compact ladder, no long dead tail.
  const last = Math.min(LAST_AGE, player.age);
  const out: Slot[] = [];
  for (let age = first; age <= last; age += YEARS_PER_CHAPTER) {
    const chapter = byAge.get(age) ?? null;
    const state: Slot["state"] = chapter ? "past" : age === player.age ? "current" : age < player.age ? "past" : "future";
    out.push({ age, chapter, state });
  }
  return out;
}

/** Relative luminance of a hex colour — decides age-square text contrast. */
function hexLum(hex: string): number {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((x) => x + x).join("") : h.padEnd(6, "0");
  const r = parseInt(v.slice(0, 2), 16), g = parseInt(v.slice(2, 4), 16), b = parseInt(v.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
const inkOn = (hex: string) => (hexLum(hex) > 0.6 ? "#0a0a0a" : "#ffffff");

/** Compact OVR chip, tier-coloured (orange / steel / gold) like the reference. */
function OvrChip({ value }: { value: number }) {
  const s = ovrStyle(value);
  return (
    <span className="grid h-8 w-full place-items-center rounded-md font-display text-[0.82rem] font-black"
      style={{ background: s.bg, color: s.fg }}>{value}</span>
  );
}

const AP_ICON = "👕", GL_ICON = "⚽", AS_ICON = "👟";
function StatCell({ icon, n }: { icon: string; n: number }) {
  return (
    <div className="flex items-center justify-center gap-1">
      <span className="text-[0.6rem] leading-none opacity-70">{icon}</span>
      <span className="font-display text-[0.88rem] font-black tabular-nums text-white">{n}</span>
    </div>
  );
}

/** Shared column template so headers + every row + the national row all align. */
const ROW_COLS = "grid grid-cols-[40px_1fr_42px_40px_40px_38px] items-center gap-2 sm:grid-cols-[46px_1fr_46px_46px_46px_44px]";

function LadderRow({ slot, peak, playing, simming }: { slot: Slot; peak: number; playing: boolean; simming: boolean }) {
  const c = useC();
  const { chapter: ch, state } = slot;
  const clubColor = ch?.clubColors?.[0] ?? "#3a4560";

  if (!ch) {
    const cur = state === "current";
    return (
      <div className={`${ROW_COLS} rounded-xl px-2 py-2.5 ${cur ? "" : "opacity-40"}`}
        style={{ background: cur ? "#8b5cf61c" : "#ffffff05", boxShadow: `inset 0 0 0 1px ${cur ? "#8b5cf655" : "rgba(255,255,255,0.05)"}` }}>
        <motion.span animate={simming ? { scale: [1, 1.12, 1] } : {}} transition={{ duration: 0.9, repeat: Infinity }}
          className="grid h-9 w-9 place-items-center rounded-lg font-display text-[0.9rem] font-black text-white"
          style={{ background: cur ? "#8b5cf6" : "#ffffff12" }}>{slot.age}</motion.span>
        <span className="flex items-center gap-2 text-[0.85rem] font-bold" style={{ color: cur ? "#c4b5fd" : "rgba(255,255,255,0.4)" }}>
          {cur && <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[0.7rem] text-white/60">?</span>}
          {cur ? (simming ? c("Simulating…", "Simulando…") : playing ? c("Playing…", "Jugando…") : c("Choosing club…", "Eligiendo club…")) : "—"}
        </span>
        <span /><span /><span /><span />
      </div>
    );
  }

  const trophies = ch.seasons.flatMap((s) => seasonTrophies(s));
  const best = ch.overallTo >= peak && peak > 0;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
      className={`${ROW_COLS} rounded-xl px-2 py-2 transition-[filter] hover:brightness-125`}
      style={{ background: `linear-gradient(90deg, ${clubColor}33, ${clubColor}0d 72%)`, boxShadow: `inset 0 0 0 1px ${best ? "rgba(242,201,76,0.4)" : "rgba(255,255,255,0.05)"}` }}>
      {/* age square, tinted with the club's own colour */}
      <span className="grid h-9 w-9 place-items-center rounded-lg font-display text-[0.92rem] font-black"
        style={{ background: clubColor, color: inkOn(clubColor), boxShadow: `0 2px 10px ${clubColor}55` }}>{ch.fromAge}</span>
      {/* club + trophies won that spell */}
      <div className="flex min-w-0 items-center gap-1.5">
        <ClubCrest short={ch.clubShort} colors={ch.clubColors} size={22} />
        <span className="truncate font-display text-[0.9rem] font-extrabold text-white">{ch.clubName}</span>
        {ch.transferred && <span className="shrink-0 text-[0.72rem] text-cyan-300" title={c("Transfer", "Traspaso")}>⇄</span>}
        {ch.injured && <span className="shrink-0 text-[0.72rem]" title={c("Injured this spell", "Lesionado en esta etapa")}>🩹</span>}
        <span className="flex shrink-0 items-center gap-0.5">
          {trophies.slice(0, 3).map((h, i) => <TrophyArt key={i} id={h.id} size={15} title={h.en} />)}
        </span>
      </div>
      <OvrChip value={ch.overallTo} />
      <StatCell icon={AP_ICON} n={ch.apps} />
      <StatCell icon={GL_ICON} n={ch.goals} />
      <StatCell icon={AS_ICON} n={ch.assists} />
    </motion.div>
  );
}

/** The national-team career, a gold row at the foot of the ledger. */
function NationalRow({ nation, caps, goals, assists, honours }: {
  nation: string; caps: number; goals: number; assists: number; honours: string[];
}) {
  const es = useLang().lang === "es";
  const trophies = honours.map((h) => resolveHonour(h.split(" ·")[0].trim())).slice(0, 3);
  return (
    <div className={`${ROW_COLS} mt-1 rounded-xl px-2 py-2`}
      style={{ background: "linear-gradient(90deg, rgba(242,201,76,0.24), rgba(242,201,76,0.05) 72%)", boxShadow: "inset 0 0 0 1px rgba(242,201,76,0.38)" }}>
      <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg" style={{ background: "#e6b81f" }}>
        <CountryFlag country={nation} size={20} />
      </span>
      <div className="flex min-w-0 items-center gap-1.5">
        <CountryFlag country={nation} size={20} />
        <span className="truncate font-display text-[0.9rem] font-extrabold text-white">{nation}</span>
        <span className="flex shrink-0 items-center gap-0.5">
          {trophies.map((h, i) => <TrophyArt key={i} id={h.id} size={15} title={es ? h.es : h.en} />)}
        </span>
      </div>
      <span className="grid h-8 place-items-center text-[0.58rem] font-bold uppercase tracking-widest text-[#f2c94c]/70">Int</span>
      <StatCell icon={AP_ICON} n={caps} />
      <StatCell icon={GL_ICON} n={goals} />
      <StatCell icon={AS_ICON} n={assists} />
    </div>
  );
}

/* ---------------- prompt queue ---------------- */
type Prompt = { kind: "injury" } | { kind: "event"; ev: CareerEventDef } | { kind: "transfer" };
function buildPrompts(run: ChapterRun): Prompt[] {
  const out: Prompt[] = [];
  if (run.injuryType) out.push({ kind: "injury" });
  for (const ev of run.events) out.push({ kind: "event", ev });
  out.push({ kind: "transfer" });
  return out;
}
