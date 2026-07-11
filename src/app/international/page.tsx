"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import {
  COMP_SQUADS, groupTable, squadKey, INTL_USER, type IntlComp, type IntlState,
} from "@/lib/engine/international";
import { shareTrophyCard, type CardPlayer } from "@/lib/trophy-card";
import type { KOTie, MatchResult, Player, RawSquad, TableRow } from "@/lib/types";
import { MatchModal } from "@/components/MatchModal";
import { TeamBadge } from "@/components/TeamBadge";
import { CrestLogo } from "@/components/CrestLogo";
import { TiltCard } from "@/components/fx/TiltCard";
import { WavingFlag } from "@/components/fx/WavingFlag";
import { RoundTransition } from "@/components/fx/RoundTransition";
import { Fireworks } from "@/components/fx/Fireworks";
import { RainOverlay, CameraFlashes, Confetti, Sparks } from "@/components/fx/Atmosphere";
import { EuroScene, CopaScene } from "@/components/fx/Scenes";
import { LiveMatch, SimStyleChoice, type LiveLeg } from "@/components/LiveMatch";
import { play } from "@/lib/sound";

/* ================================================================== */
/*  Per-competition identity — two completely different worlds        */
/* ================================================================== */
const THEMES: Record<IntlComp, {
  title: string; sub: string; emoji: string; accent: string; accent2: string; soft: string;
  panel: string; heading: string; blurb: string; champs: string[];
  confetti: string[]; fireworks: string[];
}> = {
  euro: {
    title: "UEFA EURO", sub: "European Championship", emoji: "🏆",
    accent: "#37e0ff", accent2: "#8fb8ff", soft: "rgba(55,224,255,0.16)",
    panel: "euro-panel euro-grid",
    heading: "text-gradient-euro",
    blurb: "Sixteen historic national sides. Four groups. One summer of silver.",
    champs: ["Spain", "France", "Germany", "Italy", "Portugal", "Netherlands", "Denmark", "Greece"],
    confetti: ["#37e0ff", "#dbe6ff", "#ffffff", "#1b4fff", "#8fb8ff"],
    fireworks: ["#37e0ff", "#dbe6ff", "#ffffff", "#5b8cff"],
  },
  copa: {
    title: "Copa América", sub: "CONMEBOL", emoji: "🏆",
    accent: "#ffc93c", accent2: "#ff8a3d", soft: "rgba(255,201,60,0.16)",
    panel: "copa-panel copa-heat",
    heading: "text-gradient-copa",
    blurb: "Twelve legendary selecciones. Three groups. The oldest prize in football.",
    champs: ["Argentina", "Brazil", "Uruguay", "Chile", "Colombia", "Bolivia"],
    confetti: ["#ffc93c", "#ff8a3d", "#17c97a", "#ffffff", "#fff2c9"],
    fireworks: ["#ffc93c", "#ff8a3d", "#17c97a", "#ffffff"],
  },
};

/* ================================================================== */

function squadRating(sq: RawSquad): number {
  const sorted = [...sq.players].sort((a, b) => b[3] - a[3]);
  const xi = sorted.slice(0, 11);
  return Math.round(xi.reduce((s, p) => s + p[3], 0) / Math.max(1, xi.length));
}

function legendsOf(sq: RawSquad, n = 3): string[] {
  return [...sq.players].sort((a, b) => b[3] - a[3]).slice(0, n).map((p) => p[0]);
}

function starCount(rating: number): number {
  return Math.max(1, Math.min(5, Math.round((rating - 78) / 3)));
}

const label = (intl: IntlState, key: string) => {
  const t = intl.teams[key];
  return t ? `${t.name} ${t.season ?? ""}`.trim() : key;
};

const PHASE_BURST: Record<string, string> = {
  r16: "Through to the Round of 16",
  qf: "Through to the Quarter-finals",
  sf: "Through to the Semi-finals",
  final: "You're in the Final",
};

export default function InternationalPage() {
  return (
    <Suspense fallback={null}>
      <International />
    </Suspense>
  );
}

function International() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intl = useGame((s) => s.intl);
  const startIntl = useGame((s) => s.startIntl);
  const advanceGroups = useGame((s) => s.advanceIntlGroups);
  const advanceKO = useGame((s) => s.advanceIntlKO);
  const endIntl = useGame((s) => s.endIntl);
  const setPendingPool = useGame((s) => s.setPendingPool);
  const resetDraft = useGame((s) => s.resetDraft);

  const [selectingState, setSelecting] = useState<IntlComp | null>(null);
  const [modal, setModal] = useState<{ result: MatchResult; title?: string } | null>(null);
  const [dismissedEnd, setDismissedEnd] = useState(false);
  // cinematic advance flow: whistle → tunnel transition → simulate → burst
  const [transition, setTransition] = useState<{ title: string; subtitle: string } | null>(null);
  const [burst, setBurst] = useState<string | null>(null);
  // Live Match mode — the big nights can be watched minute by minute
  const [simChoice, setSimChoice] = useState<string | null>(null);
  const [live, setLive] = useState<{ legs: LiveLeg[]; title: string; prevPhase: string } | null>(null);
  const pendingFn = useRef<(() => void) | null>(null);
  // synchronous double-click guard — React state alone races (two fast clicks
  // both see idle state and would advance two rounds at once)
  const busyRef = useRef(false);

  // Result sting plays only when the end ceremony actually appears — never at
  // simulation time — so a Live Match watched first is never spoiled by sound.
  const ceremonyVisible = !!intl && intl.phase === "done" && !dismissedEnd && !modal && !live;
  const wonFinal = !!intl && intl.champion === intl.userKey;
  useEffect(() => {
    if (ceremonyVisible) play(wonFinal ? "trophy" : "lose");
  }, [ceremonyVisible, wonFinal]);

  // deep link from the home screen mode cards: /international?comp=euro —
  // derived, not synced via effect, so the URL stays the source of truth
  const paramComp = ((): IntlComp | null => {
    const c = searchParams.get("comp");
    return c === "euro" || c === "copa" ? c : null;
  })();
  const selecting = selectingState ?? (!intl ? paramComp : null);

  const runCinematic = (title: string, subtitle: string, fn: () => void) => {
    if (busyRef.current) return;
    busyRef.current = true;
    play("whistle");
    pendingFn.current = fn;
    setTransition({ title, subtitle });
  };

  // celebrate qualification into a new knockout round — but only if the user
  // is actually in it (Copa semi-final losers drop to the bronze final
  // instead). Elimination and the final are handled by the end overlay.
  const fireBurstIfQualified = (prevPhase: string | undefined) => {
    const next = useGame.getState().intl;
    const userInPhase =
      next &&
      (next.phase !== "final" ||
        next.ties.some((k) => k.round === "Final" && !k.winner && (k.teamA === next.userKey || k.teamB === next.userKey)));
    if (next && prevPhase && next.phase !== prevPhase && PHASE_BURST[next.phase] && userInPhase) {
      play("win");
      setBurst(PHASE_BURST[next.phase]);
      setTimeout(() => setBurst(null), 2700);
    }
  };

  const onTransitionDone = () => {
    const prevPhase = useGame.getState().intl?.phase;
    pendingFn.current?.();
    pendingFn.current = null;
    setTransition(null);
    busyRef.current = false;
    fireBurstIfQualified(prevPhase);
  };

  // Live Match: simulate the round immediately, then replay the user's match
  // minute by minute before revealing what it means for the tournament.
  const startLive = (roundTitle: string) => {
    if (busyRef.current) return;
    const state = useGame.getState();
    const prevPhase = state.intl?.phase;
    if (!prevPhase) return;
    busyRef.current = true;
    setSimChoice(null);
    play("whistle");
    state.advanceIntlKO();
    const next = useGame.getState().intl;
    const playedRounds: KOTie["round"][] = prevPhase === "sf" ? ["Semi-final"] : ["Final", "Third Place"];
    const tie = next?.ties.find(
      (k) => playedRounds.includes(k.round) && k.leg1 && (k.teamA === next.userKey || k.teamB === next.userKey),
    );
    if (!tie?.leg1) {
      // should never happen — fall back to the normal reveal
      busyRef.current = false;
      fireBurstIfQualified(prevPhase);
      return;
    }
    setLive({ legs: [{ result: tie.leg1 }], title: roundTitle, prevPhase });
  };

  const onLiveDone = () => {
    const prevPhase = live?.prevPhase;
    setLive(null);
    busyRef.current = false;
    fireBurstIfQualified(prevPhase);
  };

  /* ---------------------------- LOBBY ---------------------------- */
  if (!intl && !selecting) {
    return (
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:pt-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="cl-heading text-[0.62rem] tracking-[0.4em] text-cyan">National Teams</div>
          <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-5xl">
            International <span className="text-gradient-gold text-shine">Tournaments</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Lead a historic national team through a full tournament — group stage, knockouts,
            and a final. Every squad rated for that exact summer.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {(["euro", "copa"] as IntlComp[]).map((comp, i) => {
            const t = THEMES[comp];
            const editions = new Set(COMP_SQUADS[comp].map((s) => s.season)).size;
            const flagSquads = t.champs
              .map((nation) => COMP_SQUADS[comp].find((s) => s.club === nation))
              .filter((s): s is RawSquad => !!s)
              .slice(0, 5);
            return (
              <motion.div key={comp} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}>
                <TiltCard className={`shine h-full overflow-hidden rounded-3xl ${t.panel}`}>
                  <div className="relative flex h-full flex-col p-7 text-left" style={{ transformStyle: "preserve-3d" }}>
                    <Sparks count={8} color={t.accent} />
                    {/* trophy with glow rings */}
                    <div className="tilt-layer relative w-fit" style={{ ["--z" as string]: "44px" }}>
                      <motion.span
                        aria-hidden
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                        style={{ width: 90, height: 90, border: `1px solid ${t.soft}` }}
                        animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: i * 0.5 }}
                      />
                      <motion.div
                        className="relative text-6xl"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                        style={{ filter: `drop-shadow(0 0 26px ${t.soft})` }}
                      >
                        {t.emoji}
                      </motion.div>
                    </div>

                    <div className="tilt-layer mt-3" style={{ ["--z" as string]: "28px" }}>
                      <div className="cl-heading text-[0.6rem] tracking-[0.35em]" style={{ color: t.accent }}>{t.sub}</div>
                      <h2 className={`mt-1 font-display text-3xl font-extrabold ${t.heading}`}>{t.title}</h2>
                      <p className="mt-2 text-sm text-white/70">{t.blurb}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-[0.62rem]">
                      <span className="chip" style={{ background: t.soft, color: t.accent }}>{COMP_SQUADS[comp].length} historic squads</span>
                      <span className="chip bg-white/8 text-white/70">{editions} editions</span>
                    </div>

                    {/* waving flags of the past champions */}
                    <div className="mt-4">
                      <div className="text-[0.55rem] uppercase tracking-[0.3em] text-white/40">Past Champions</div>
                      <div className="mt-1.5 flex items-end gap-1.5">
                        {flagSquads.map((s, fi) => (
                          <motion.span key={s.club} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + fi * 0.08 }} title={s.club}>
                            <WavingFlag colors={s.colors} width={40} />
                          </motion.span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 pt-1">
                      <button
                        className="btn btn-gold text-[0.7rem]"
                        onClick={() => {
                          resetDraft();
                          setPendingPool(comp);
                          play("select");
                          router.push("/draft");
                        }}
                      >
                        🎴 Draft Your XI →
                      </button>
                      <button
                        className="btn btn-ghost text-[0.7rem]"
                        onClick={() => { setSelecting(comp); play("click"); }}
                      >
                        Lead a Nation
                      </button>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>

      </div>
    );
  }

  /* ------------------------- NATION SELECT ------------------------- */
  if (!intl && selecting) {
    const t = THEMES[selecting];
    const squads = [...COMP_SQUADS[selecting]].sort((a, b) => squadRating(b) - squadRating(a));
    return (
      <>
        {selecting === "euro" ? <EuroScene /> : <CopaScene />}
        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-24 sm:pt-28">
          <div className="flex items-center justify-between">
            <div>
              <div className="cl-heading text-[0.6rem] tracking-[0.35em]" style={{ color: t.accent }}>{t.title}</div>
              <h1 className={`font-display text-3xl font-extrabold sm:text-4xl ${t.heading}`}>Choose Your Nation</h1>
              <p className="mt-1 text-sm text-muted">Pick the squad you will lead — other nations draw a random vintage.</p>
            </div>
            <button className="btn btn-ghost text-xs" onClick={() => { setSelecting(null); router.replace("/international"); play("click"); }}>← Back</button>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {squads.map((sq, i) => {
              const rating = squadRating(sq);
              const stars = starCount(rating);
              const legends = legendsOf(sq);
              return (
                <motion.button
                  key={squadKey(sq)}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 11) * 0.045 }}
                  whileHover={{ y: -5, scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => {
                    startIntl(selecting, squadKey(sq));
                    setSelecting(null);
                    setDismissedEnd(false);
                    play("select");
                  }}
                  className={`shine group relative overflow-hidden rounded-2xl p-4 text-left ${t.panel} ${selecting === "copa" ? "copa-gold-border" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <WavingFlag colors={sq.colors} width={46} />
                      <div>
                        <div className="font-display text-base font-extrabold leading-tight text-white">{sq.club}</div>
                        <div className="text-[0.65rem] font-bold" style={{ color: t.accent }}>{sq.season}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl font-extrabold" style={{ color: t.accent, textShadow: `0 0 18px ${t.soft}` }}>{rating}</div>
                      <div className="-mt-0.5 text-[0.6rem] tracking-wide" style={{ color: t.accent }} aria-label={`${stars} of 5 stars`}>
                        {"★".repeat(stars)}<span className="opacity-25">{"★".repeat(5 - stars)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 line-clamp-1 text-[0.66rem] font-semibold text-white/75">{sq.honor}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[0.62rem] text-white/45">
                    <span aria-hidden>🎙️</span> {sq.coach}
                  </div>

                  {/* legends strip — revealed on hover */}
                  <div className="grid grid-rows-[0fr] transition-all duration-300 group-hover:mt-2.5 group-hover:grid-rows-[1fr]">
                    <div className="overflow-hidden">
                      <div className="flex flex-wrap gap-1">
                        {legends.map((name) => (
                          <span key={name} className="chip" style={{ background: t.soft, color: t.accent }}>{name}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  if (!intl) return null;
  const t = THEMES[intl.comp];
  const isDone = intl.phase === "done";
  const won = intl.champion === intl.userKey;
  const userLabel = label(intl, intl.userKey);

  const userFixtures = intl.fixtures.filter((f) => f.home === intl.userKey || f.away === intl.userKey);
  const userTies = intl.ties.filter((k) => k.teamA === intl.userKey || k.teamB === intl.userKey);
  const lastUserMatch = (() => {
    const tie = userTies[userTies.length - 1];
    if (tie?.leg1) return tie.leg1;
    const played = userFixtures.filter((f) => f.result);
    return played[played.length - 1]?.result;
  })();

  // Copa medal round: the user might be in the bronze final, not the final
  const userFinalTie = intl.ties.find(
    (k) => !k.winner && (k.round === "Final" || k.round === "Third Place") && (k.teamA === intl.userKey || k.teamB === intl.userKey),
  );
  const inBronze = intl.phase === "final" && userFinalTie?.round === "Third Place";
  // the pre-match showdown panel on medal night
  const showdownTie = intl.phase === "final"
    ? userFinalTie ?? intl.ties.find((k) => k.round === "Final" && !k.winner) ?? null
    : null;

  const roundTitle =
    intl.phase === "groups" ? `Matchday ${Math.min(intl.matchday, 3)}`
      : intl.phase === "r16" ? "Round of 16"
      : intl.phase === "qf" ? "Quarter-finals"
      : intl.phase === "sf" ? "Semi-finals"
      : inBronze ? "The Bronze Final"
      : "The Final";

  // fixture line shown inside the tunnel transition
  const nextOpponentDetail = (() => {
    if (intl.phase === "groups") {
      const f = intl.fixtures.find(
        (x) => x.matchday === intl.matchday && !x.result && (x.home === intl.userKey || x.away === intl.userKey),
      );
      if (!f) return undefined;
      return `${label(intl, f.home)}  vs  ${label(intl, f.away)}`;
    }
    const tie = intl.ties.find(
      (k) => !k.winner && (k.teamA === intl.userKey || k.teamB === intl.userKey),
    );
    return tie ? `${label(intl, tie.teamA)}  vs  ${label(intl, tie.teamB)}` : undefined;
  })();

  /* ------------------------- TOURNAMENT VIEW ------------------------- */
  return (
    <>
      {intl.comp === "euro" ? <EuroScene /> : <CopaScene />}
      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-24 pt-24 sm:pt-28">
        {/* themed header */}
        <div className={`shine relative overflow-hidden rounded-3xl p-5 ${t.panel} ${intl.comp === "copa" ? "copa-gold-border" : "euro-neon"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CrestLogo size={40} />
              <div>
                <div className="cl-heading text-[0.6rem] tracking-[0.35em]" style={{ color: t.accent }}>{t.title}</div>
                <h1 className={`font-display text-2xl font-extrabold sm:text-3xl ${t.heading}`}>{userLabel}</h1>
                <div className="text-xs text-white/60">
                  {intl.phase === "groups" ? `Group stage · Matchday ${Math.min(intl.matchday, 3)} of 3`
                    : isDone ? intl.exit?.text
                    : roundTitle}
                </div>
              </div>
            </div>
            <div>
              {intl.phase === "groups" && (
                <button className="btn btn-gold btn-pulse" disabled={!!transition} onClick={() => runCinematic(roundTitle, t.title, advanceGroups)}>
                  {transition ? "Playing…" : `Play ${roundTitle}`}
                </button>
              )}
              {["r16", "qf"].includes(intl.phase) && (
                <button className="btn btn-gold btn-pulse" disabled={!!transition} onClick={() => runCinematic(roundTitle, t.title, advanceKO)}>
                  {transition ? "Playing…" : `Play ${roundTitle}`}
                </button>
              )}
              {intl.phase === "sf" && (
                <button className="btn btn-gold btn-pulse" disabled={!!transition || !!live} onClick={() => { setSimChoice(roundTitle); play("click"); }}>
                  {transition || live ? "Playing…" : `Play ${roundTitle}`}
                </button>
              )}
              {isDone && dismissedEnd && (
                <button className="btn btn-gold" onClick={() => { endIntl(); play("click"); }}>Finish & Save</button>
              )}
            </div>
          </div>

          {/* phase progress pips */}
          <div className="mt-4 flex gap-1.5">
            {(intl.comp === "euro" ? ["groups", "r16", "qf", "sf", "final"] : ["groups", "qf", "sf", "final"]).map((p) => {
              const order = ["groups", "r16", "qf", "sf", "final", "done"];
              const active = order.indexOf(intl.phase) >= order.indexOf(p);
              return (
                <span key={p} className="h-1.5 flex-1 rounded-full transition-colors duration-500"
                  style={{ background: active ? t.accent : "rgba(255,255,255,0.1)", boxShadow: active ? `0 0 10px ${t.soft}` : "none" }} />
              );
            })}
          </div>
        </div>

        {/* FINAL SHOWDOWN — cinematic pre-match presentation (the user's medal
            match: the final itself, or Copa's bronze final) */}
        {showdownTie && (
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className={`relative mt-6 overflow-hidden rounded-3xl p-6 text-center ${t.panel}`}
            >
              <CameraFlashes count={16} />
              <Sparks count={10} color={t.accent} />
              <div className="cl-heading text-[0.65rem] tracking-[0.45em]" style={{ color: t.accent }}>
                {inBronze ? "One Last Stand · Bronze" : "One Night · One Trophy"}
              </div>
              <h2 className={`mt-1 font-display text-4xl font-extrabold sm:text-5xl ${t.heading}`}>
                {inBronze ? "THIRD-PLACE MATCH" : "THE FINAL"}
              </h2>
              <div className="mx-auto mt-1 h-px w-40" style={{ background: `linear-gradient(90deg, transparent, ${t.accent}, transparent)` }} />

              <div className="mx-auto mt-6 grid max-w-2xl grid-cols-[1fr_auto_1fr] items-center gap-3">
                {[intl.teams[showdownTie.teamA], intl.teams[showdownTie.teamB]].map((team, side) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, x: side === 0 ? -40 : 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + side * 0.15, type: "spring", stiffness: 120, damping: 16 }}
                    className={`flex flex-col items-center gap-2 rounded-2xl bg-black/25 p-4 ${team.id === intl.userKey ? "ring-1" : ""}`}
                    style={{ order: side === 0 ? 0 : 2, ...(team.id === intl.userKey ? { boxShadow: `0 0 22px ${t.soft}`, borderColor: t.accent } : {}) }}
                  >
                    <WavingFlag colors={team.colors} width={54} />
                    <TeamBadge colors={team.colors} code={team.short} size={44} />
                    <div className="font-display text-sm font-extrabold text-white">{team.name} {team.season}</div>
                    {team.id === intl.userKey && <span className="chip" style={{ background: t.soft, color: t.accent }}>Your Nation</span>}
                  </motion.div>
                ))}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 12 }}
                  className="font-display text-3xl font-extrabold text-white/80" style={{ order: 1 }}
                >
                  VS
                </motion.div>
              </div>

              <p className="mx-auto mt-5 max-w-sm text-xs italic text-white/50">
                {inBronze
                  ? "The dream is gone, but a medal is not — ninety minutes to leave with silverware."
                  : "The anthems fade, the flags are raised, and ninety minutes stand between you and history."}
              </p>
              <button className="btn btn-gold btn-pulse mt-5" disabled={!!transition || !!live}
                onClick={() => { setSimChoice(roundTitle); play("click"); }}>
                {transition || live ? "Playing…" : inBronze ? "⚽ Kick Off the Bronze Final" : "⚽ Kick Off the Final"}
              </button>
            </motion.div>
        )}

        {/* GROUP STAGE */}
        {(intl.phase === "groups" || isDone) && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {intl.groups.map((_, gi) => (
              <GroupCard key={gi} intl={intl} gi={gi} theme={t} />
            ))}
          </div>
        )}

        {/* user's group fixtures */}
        {userFixtures.length > 0 && (intl.phase === "groups" || (isDone && intl.ties.length === 0)) && (
          <div className="glass mt-4 rounded-2xl p-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">Your Matches</h3>
            <div className="grid gap-2 sm:grid-cols-3">
              {userFixtures.map((f, i) => {
                const isHome = f.home === intl.userKey;
                const opp = intl.teams[isHome ? f.away : f.home];
                const r = f.result;
                const uf = r ? (isHome ? r.homeGoals : r.awayGoals) : null;
                const oa = r ? (isHome ? r.awayGoals : r.homeGoals) : null;
                const color = r ? (uf! > oa! ? "text-green" : uf! < oa! ? "text-danger" : "text-white/70") : "text-muted";
                return (
                  <motion.button key={i} disabled={!r}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    whileHover={r ? { scale: 1.02 } : undefined}
                    onClick={() => r && setModal({ result: r, title: `Group stage · MD ${f.matchday}` })}
                    className="flex items-center justify-between rounded-lg bg-white/4 px-2.5 py-2 text-left disabled:opacity-60">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <TeamBadge colors={opp.colors} code={opp.short} size={18} />
                      <span className="truncate text-xs font-semibold">{opp.name} {opp.season}</span>
                    </span>
                    <span className={`font-display text-sm font-bold ${color}`}>{r ? `${uf}-${oa}` : `MD${f.matchday}`}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* KNOCKOUT BRACKET */}
        {intl.ties.length > 0 && (
          <IntlBracket intl={intl} theme={t}
            onTieClick={(tie) => tie.leg1 && setModal({ result: tie.leg1, title: tie.round })} />
        )}

        <div className="mt-8 flex justify-center">
          <button className="btn btn-ghost text-xs" onClick={() => { endIntl(); play("click"); }}>
            Abandon Tournament
          </button>
        </div>

        {/* match stats modal */}
        <AnimatePresence>
          {modal && (
            <MatchModal result={modal.result} teams={intl.teams} title={modal.title} onClose={() => setModal(null)} />
          )}
        </AnimatePresence>

        {/* tunnel transition between rounds — group nights run quicker */}
        <RoundTransition
          show={!!transition}
          title={transition?.title ?? ""}
          subtitle={transition?.subtitle}
          detail={nextOpponentDetail}
          accent={t.accent}
          duration={intl.phase === "groups" ? 1350 : 1900}
          onDone={onTransitionDone}
        />

        {/* QUALIFICATION BURST */}
        <AnimatePresence>
          {burst && (
            <motion.div
              className="pointer-events-none fixed inset-0 z-[125] flex items-center justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/55" />
              <Fireworks count={7} palette={[...t.fireworks]} />
              <CameraFlashes count={18} />
              <motion.div
                initial={{ scale: 0.7, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 1.05, opacity: 0 }}
                transition={{ type: "spring", stiffness: 170, damping: 15 }}
                className="relative z-10 text-center"
              >
                <div className="text-6xl" style={{ filter: `drop-shadow(0 0 30px ${t.soft})` }}>🎆</div>
                <div className="cl-heading mt-2 text-[0.65rem] tracking-[0.4em]" style={{ color: t.accent }}>{t.title}</div>
                <div className={`mt-1 font-display text-3xl font-extrabold sm:text-5xl ${t.heading}`}>{burst}</div>
                <div className="mt-2 text-sm text-white/70">{userLabel}</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CHOOSE SIMULATION STYLE — the big nights deserve the choice */}
        <AnimatePresence>
          {simChoice && (
            <SimStyleChoice
              title={`${t.title} · ${simChoice}`}
              accent={t.accent}
              onLive={() => startLive(simChoice)}
              onQuick={() => { setSimChoice(null); runCinematic(simChoice, t.title, advanceKO); }}
              onCancel={() => { setSimChoice(null); play("click"); }}
            />
          )}
        </AnimatePresence>

        {/* LIVE MATCH — minute-by-minute broadcast of the user's match */}
        <AnimatePresence>
          {live && (
            <LiveMatch
              legs={live.legs}
              homeOf={(r) => intl.teams[r.home]}
              awayOf={(r) => intl.teams[r.away]}
              title={live.title}
              subtitle={t.title}
              accent={t.accent}
              onDone={onLiveDone}
            />
          )}
        </AnimatePresence>

        {/* END OVERLAY — triumph or heartbreak */}
        <AnimatePresence>
          {isDone && !dismissedEnd && !modal && !live && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto p-4"
              style={{ background: `radial-gradient(130% 90% at 50% 25%, ${won ? "#3d2f05" : "#0a1330"}, #030b22 72%)` }}
            >
              {won ? (
                <>
                  <Fireworks count={9} palette={[...t.fireworks, "#f2d472"]} />
                  <Confetti count={130} colors={[...t.confetti]} />
                  <CameraFlashes count={20} />
                </>
              ) : (
                <>
                  <RainOverlay drops={56} opacity={0.55} />
                  <div className="pointer-events-none absolute inset-0 bg-black/35" />
                </>
              )}

              <div className="relative z-10 w-full max-w-md text-center">
                {!won && (
                  <motion.div
                    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3, duration: 0.5 }}
                    className={`mx-auto mb-5 w-fit rounded-md border px-4 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.35em] ${
                      intl.exit?.text.startsWith("Bronze")
                        ? "border-amber-400/60 bg-amber-400/15 text-amber-300"
                        : "border-danger/60 bg-danger/15 text-danger"
                    }`}
                  >
                    {intl.exit?.stage === "Final" ? "So Close"
                      : intl.exit?.text.startsWith("Bronze") ? "Bronze Medal" : "Eliminated"}
                  </motion.div>
                )}
                <motion.div
                  initial={{ scale: 0, rotate: -25, y: 30 }} animate={{ scale: 1, rotate: 0, y: 0 }}
                  transition={{ type: "spring", stiffness: 110, damping: 11, delay: 0.15 }}
                  className="text-[7.5rem] leading-none"
                  style={{ filter: `drop-shadow(0 0 45px ${won ? "rgba(212,175,55,0.6)" : t.soft})`, opacity: won ? 1 : 0.85 }}
                >
                  {won ? "🏆"
                    : intl.exit?.stage === "Final" ? "🥈"
                    : intl.exit?.text.startsWith("Bronze") ? "🥉" : "🌧️"}
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                  className="cl-heading mt-2 text-[0.65rem] tracking-[0.4em]" style={{ color: t.accent }}>
                  {t.title}
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                  className="mt-1 font-display text-4xl font-extrabold"
                >
                  {won
                    ? <span className="text-gradient-gold text-shine">{intl.exit?.text}</span>
                    : <span className="text-white/90">{intl.exit?.text}</span>}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: won ? 1 : 0.55 }} transition={{ delay: 0.75 }}
                  className="mt-2 text-sm text-muted"
                >
                  {userLabel}
                </motion.p>

                {won && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
                    className="mx-auto mt-4 w-fit rounded-xl px-5 py-2"
                    style={{ background: `linear-gradient(120deg, ${t.soft}, transparent)`, border: `1px solid ${t.accent}55` }}
                  >
                    <span className="cl-heading text-[0.62rem] tracking-[0.35em]" style={{ color: t.accent }}>
                      ★ Champions · {intl.teams[intl.userKey].season ?? ""} vintage immortalised ★
                    </span>
                  </motion.div>
                )}

                {lastUserMatch && (
                  <motion.button
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                    className="mt-5 rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider"
                    style={{ borderColor: t.soft, color: t.accent }}
                    onClick={() => { setDismissedEnd(true); setModal({ result: lastUserMatch, title: "Your final match" }); }}
                  >
                    View final match stats
                  </motion.button>
                )}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="mt-6 flex flex-wrap justify-center gap-3">
                  <button className="btn btn-ghost text-xs" onClick={() => setDismissedEnd(true)}>View bracket</button>
                  {won && (
                    <button
                      className="btn btn-ghost text-xs"
                      onClick={() => {
                        play("select");
                        const finalTie = intl.ties.find((k) => k.round === "Final" && k.winner === intl.userKey);
                        const leg = finalTie?.leg1;
                        const scoreLine = leg && finalTie
                          ? `${label(intl, leg.home)} ${leg.homeGoals}-${leg.awayGoals} ${label(intl, leg.away)}${leg.penalties ? ` · pens ${leg.penalties[0]}-${leg.penalties[1]}` : ""}`
                          : `${userLabel} · Champions`;
                        // drafted XIs carry their real picks; a led nation shows
                        // its strongest XI from that vintage's squad
                        let players: CardPlayer[];
                        if (intl.userKey === INTL_USER) {
                          players = (useGame.getState().getXI().filter(Boolean) as Player[])
                            .map((p) => ({ name: p.name, position: p.position, overall: p.overall }));
                        } else {
                          const squad = COMP_SQUADS[intl.comp].find((s) => squadKey(s) === intl.userKey);
                          const all = (squad?.players ?? []).map((p) => ({ name: p[0], position: p[2] as string, overall: p[3] }));
                          const gk = all.filter((p) => p.position === "GK").sort((a, b) => b.overall - a.overall).slice(0, 1);
                          const outfield = all.filter((p) => p.position !== "GK").sort((a, b) => b.overall - a.overall).slice(0, 10);
                          players = [...gk, ...outfield];
                        }
                        void shareTrophyCard({
                          compLabel: t.title,
                          title: "Champions",
                          teamName: userLabel,
                          scoreLine,
                          accent: t.accent,
                          players,
                        });
                      }}
                    >
                      📸 Save Trophy Card
                    </button>
                  )}
                  <button className="btn btn-gold" onClick={() => { endIntl(); play("click"); }}>
                    {won ? "Lift the Trophy" : "Save & Return"}
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

/* ================================================================== */
/*  Group table card — qualification line, waving flags, live glow    */
/* ================================================================== */
type Theme = (typeof THEMES)[IntlComp];

function GroupCard({ intl, gi, theme }: { intl: IntlState; gi: number; theme: Theme }) {
  const rows: TableRow[] = groupTable(intl, gi);
  const qualifyCut = 2;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.08 }}
      className={`shine overflow-hidden rounded-2xl ${theme.panel} ${intl.comp === "copa" ? "copa-gold-border" : ""}`}
    >
      <div className="flex items-center justify-between px-3 pt-2.5">
        <span className="cl-heading text-[0.6rem] tracking-[0.3em]" style={{ color: theme.accent }}>
          Group {String.fromCharCode(65 + gi)}
        </span>
        <span className="text-[0.5rem] uppercase tracking-[0.2em] text-white/30">
          Top {qualifyCut} + best thirds qualify
        </span>
      </div>
      <div className="grid grid-cols-[24px_1fr_repeat(3,30px)_34px] items-center gap-1 px-3 py-1 text-[0.55rem] font-bold uppercase tracking-wider text-white/40">
        <span>#</span><span>Team</span><span className="text-center">P</span><span className="text-center">GD</span><span className="text-center">GF</span><span className="text-center" style={{ color: theme.accent }}>Pts</span>
      </div>
      {rows.map((r, i) => {
        const team = intl.teams[r.teamId];
        const isUser = r.teamId === intl.userKey;
        const qualified = i < qualifyCut;
        return (
          <div key={r.teamId}>
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 140, damping: 20 }}
              className="grid grid-cols-[24px_1fr_repeat(3,30px)_34px] items-center gap-1 border-t border-white/5 px-3 py-1.5 text-xs"
              style={isUser ? { background: `linear-gradient(90deg, ${theme.soft}, transparent)` } : undefined}
            >
              <span className="flex items-center gap-1">
                <span className="h-3.5 w-[3px] rounded-full" style={{ background: qualified ? "#2ee6a6" : "rgba(255,255,255,0.15)", boxShadow: qualified ? "0 0 6px rgba(46,230,166,0.6)" : "none" }} />
                <span className={`font-bold ${qualified ? "text-green" : "text-white/50"}`}>{i + 1}</span>
              </span>
              <span className="flex min-w-0 items-center gap-1.5">
                <TeamBadge colors={team.colors} code={team.short} size={18} />
                <span className={`truncate font-semibold ${isUser ? "" : "text-white/90"}`} style={isUser ? { color: theme.accent } : undefined}>
                  {team.name} {team.season}{isUser ? " ★" : ""}
                </span>
              </span>
              <span className="text-center text-white/70">{r.played}</span>
              <span className="text-center text-white/70">{r.gf - r.ga > 0 ? "+" : ""}{r.gf - r.ga}</span>
              <span className="text-center text-white/70">{r.gf}</span>
              <span className="text-center font-display font-extrabold" style={{ color: theme.accent }}>{r.points}</span>
            </motion.div>
            {/* the qualification line — third place can still sneak through */}
            {i === qualifyCut - 1 && (
              <div className="relative mx-3 h-px" style={{ background: "linear-gradient(90deg, rgba(46,230,166,0.7), rgba(46,230,166,0.1))" }}>
                <span className="absolute -top-[3px] right-0 text-[0.45rem] font-bold uppercase tracking-[0.2em] text-green/70">qualification</span>
              </div>
            )}
            {i === qualifyCut && (
              <div className="relative mx-3 h-px" style={{ background: "linear-gradient(90deg, rgba(255,207,92,0.5), rgba(255,207,92,0.05))" }}>
                <span className="absolute -top-[3px] right-0 text-[0.45rem] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(255,207,92,0.7)" }}>best thirds</span>
              </div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}

/* ================================================================== */
/*  Compact two-sided 8-team bracket (single-leg ties)                 */
/* ================================================================== */
function IntlBracket({ intl, theme, onTieClick }: {
  intl: IntlState; theme: Theme; onTieClick: (tie: KOTie) => void;
}) {
  const by = (r: KOTie["round"]) => intl.ties.filter((k) => k.round === r);
  const r16 = by("Round of 16");
  const qf = by("Quarter-final"); const sf = by("Semi-final");
  const fin = by("Final")[0] ?? null; const third = by("Third Place")[0] ?? null;
  const pad = (arr: KOTie[], n: number) => { const o: (KOTie | null)[] = [...arr]; while (o.length < n) o.push(null); return o; };
  const hasR16 = r16.length > 0;
  const R16 = pad(r16, 8);
  const QF = pad(qf, 4); const SF = pad(sf, 2);

  const cell = (tie: KOTie | null, key: string, delay = 0) => tie ? (
    <motion.button
      key={key} disabled={!tie.leg1} onClick={() => onTieClick(tie)}
      initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 20 }}
      className={`w-full overflow-hidden rounded-lg text-left ${tie.leg1 ? "hover:brightness-125" : ""}`}
      style={{
        background: "rgba(0,0,0,0.32)",
        border: `1px solid ${tie.teamA === intl.userKey || tie.teamB === intl.userKey ? theme.accent : theme.soft}`,
        boxShadow: tie.teamA === intl.userKey || tie.teamB === intl.userKey ? `0 0 14px ${theme.soft}` : undefined,
      }}>
      {[tie.teamA, tie.teamB].map((id) => {
        const team = intl.teams[id];
        const goals = tie.leg1 ? (id === tie.teamA ? tie.leg1.homeGoals : tie.leg1.awayGoals) : null;
        const won = tie.winner === id;
        return (
          <div key={id} className={`flex items-center justify-between gap-1 px-1.5 py-1 ${won ? "" : tie.winner ? "text-white/40" : "text-white/90"}`}
            style={won ? { color: theme.accent, background: `linear-gradient(90deg, ${theme.soft}, transparent)` } : undefined}>
            <span className="flex min-w-0 items-center gap-1">
              <TeamBadge colors={team.colors} code={team.short} size={15} />
              <span className="truncate text-[0.58rem] font-bold">{team.name} {team.season}</span>
            </span>
            <span className="font-display text-[0.68rem] font-extrabold">{goals ?? ""}</span>
          </div>
        );
      })}
      {tie.leg1?.penalties && (
        <div className="bg-black/40 px-1.5 py-[1px] text-center text-[0.48rem] font-bold" style={{ color: theme.accent }}>
          pens {tie.leg1.penalties[0]}-{tie.leg1.penalties[1]}
        </div>
      )}
    </motion.button>
  ) : (
    <div key={key} className="grid h-[42px] w-full place-items-center rounded-lg border border-dashed border-white/20 text-white/25"
      style={{ background: "rgba(0,0,0,0.2)" }}>🛡️</div>
  );

  const championName = intl.champion ? `${intl.teams[intl.champion].name} ${intl.teams[intl.champion].season}` : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={`relative mt-6 overflow-hidden rounded-3xl p-4 ${theme.panel} ${intl.comp === "copa" ? "copa-gold-border" : ""}`}
    >
      {championName && <Fireworks count={4} palette={[...theme.fireworks]} />}
      <div className="mb-3 text-center cl-heading text-xs tracking-[0.35em]" style={{ color: theme.accent }}>Knockout Stage</div>
      <div className="overflow-x-auto pb-1">
        <div
          className={`mx-auto grid gap-2 ${hasR16 ? "min-w-[1020px] max-w-[1300px] grid-cols-7" : "min-w-[720px] max-w-[980px] grid-cols-5"}`}
          style={{ minHeight: hasR16 ? 340 : 240 }}
        >
          {hasR16 && (
            <div className="flex flex-col justify-around gap-2">
              {[R16[0], R16[1], R16[2], R16[3]].map((k, i) => cell(k, `r16l${i}`, i * 0.06))}
            </div>
          )}
          <div className="flex flex-col justify-around gap-2">{[QF[0], QF[1]].map((k, i) => cell(k, `ql${i}`, i * 0.08))}</div>
          <div className="flex flex-col justify-around gap-2">{[SF[0]].map((k, i) => cell(k, `sl${i}`, 0.2))}</div>
          <div className="flex flex-col items-center justify-center gap-2">
            <motion.div
              className="text-4xl"
              animate={championName ? { y: [0, -6, 0], scale: [1, 1.08, 1] } : undefined}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              style={{ filter: `drop-shadow(0 0 18px ${theme.soft})` }}
            >
              🏆
            </motion.div>
            <span className="cl-heading text-[0.55rem] tracking-[0.3em]" style={{ color: theme.accent }}>Final</span>
            {cell(fin, "final", 0.3)}
            {third && (
              <div className="w-full">
                <div className="mb-1 text-center text-[0.5rem] uppercase tracking-[0.25em] text-white/40">Third Place</div>
                {cell(third, "third", 0.4)}
              </div>
            )}
            {championName && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-center">
                <div className="text-[0.5rem] uppercase tracking-[0.25em] text-white/40">Champions</div>
                <div className={`text-[0.7rem] font-extrabold ${theme.heading}`}>{championName}</div>
              </motion.div>
            )}
          </div>
          <div className="flex flex-col justify-around gap-2">{[SF[1]].map((k, i) => cell(k, `sr${i}`, 0.2))}</div>
          <div className="flex flex-col justify-around gap-2">{[QF[2], QF[3]].map((k, i) => cell(k, `qr${i}`, i * 0.08))}</div>
          {hasR16 && (
            <div className="flex flex-col justify-around gap-2">
              {[R16[4], R16[5], R16[6], R16[7]].map((k, i) => cell(k, `r16r${i}`, i * 0.06))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
