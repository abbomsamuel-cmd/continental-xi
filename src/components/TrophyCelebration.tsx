"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { KOTie, MatchResult, TournamentState } from "@/lib/types";
import { USER_TEAM_ID, teamLabel } from "@/lib/engine/tournament";
import { CrestLogo } from "@/components/CrestLogo";
import { TeamBadge } from "@/components/TeamBadge";
import { Pitch } from "@/components/Pitch";
import { Fireworks } from "@/components/fx/Fireworks";
import { Confetti, CameraFlashes, RainOverlay, Sparks } from "@/components/fx/Atmosphere";
import { useGame } from "@/lib/store";
import { shareTrophyCard } from "@/lib/trophy-card";
import { campaignStory } from "@/lib/broadcast";
import { play } from "@/lib/sound";

/* ------------------------------------------------------------------ */
/*  Campaign digest — record, journey and story from the tournament    */
/* ------------------------------------------------------------------ */

function campaignDigest(tournament: TournamentState, teamName: string) {
  const userMatches: MatchResult[] = [
    ...tournament.fixtures.filter((f) => f.result && (f.home === USER_TEAM_ID || f.away === USER_TEAM_ID)).map((f) => f.result!),
    ...tournament.ties
      .filter((t) => t.teamA === USER_TEAM_ID || t.teamB === USER_TEAM_ID)
      .flatMap((t) => [t.leg1, t.leg2].filter(Boolean) as MatchResult[]),
  ];
  const rec = userMatches.reduce(
    (acc, r) => {
      const uf = r.home === USER_TEAM_ID ? r.homeGoals : r.awayGoals;
      const oa = r.home === USER_TEAM_ID ? r.awayGoals : r.homeGoals;
      acc.gf += uf; acc.ga += oa;
      if (uf > oa) acc.w++; else if (uf === oa) acc.d++; else acc.l++;
      return acc;
    },
    { w: 0, d: 0, l: 0, gf: 0, ga: 0 },
  );
  const scorer = Object.entries(tournament.userGoals).sort((a, b) => b[1] - a[1])[0];
  const won = tournament.champion === USER_TEAM_ID;
  const outcome: "champion" | "runner" | "out" =
    won ? "champion" : tournament.exit?.stage === "Final" ? "runner" : "out";
  const story = campaignStory({
    teamName, outcome, exitStage: tournament.exit?.stage, ...rec,
    cleanSheets: tournament.userCleanSheets,
    topScorer: scorer ? { name: scorer[0], goals: scorer[1] } : undefined,
    seed: rec.gf * 31 + rec.ga * 7 + rec.w * 13 + (tournament.userSeed ?? 3),
  });
  const ROUNDS = ["Play-off", "Round of 16", "Quarter-final", "Semi-final", "Final"];
  const played = new Set(
    tournament.ties.filter((t) => (t.teamA === USER_TEAM_ID || t.teamB === USER_TEAM_ID) && t.leg1).map((t) => t.round as string),
  );
  const journey = ["League Phase", ...ROUNDS.filter((r) => played.has(r))];
  return { rec, scorer, story, journey, matches: userMatches.length };
}

/* ---- horizontal journey timeline, the ending stage highlighted ---- */
function JourneyTimeline({ steps, accent }: { steps: string[]; accent: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        return (
          <motion.span key={s + i} className="flex items-center"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.1 }}>
            <span className="rounded-full px-2.5 py-1 text-[0.56rem] font-extrabold uppercase tracking-wider"
              style={last ? { background: `${accent}26`, color: accent, boxShadow: `inset 0 0 0 1px ${accent}66` } : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
              {s}
            </span>
            {!last && <span className="mx-0.5 text-[0.6rem]" style={{ color: `${accent}88` }}>→</span>}
          </motion.span>
        );
      })}
    </div>
  );
}

/* ---- clean statistics grid (metric cards, not giant capsules) ---- */
function StatGrid({ cells, accent }: { cells: [string, string][]; accent: string }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {cells.map(([k, v], i) => (
        <motion.div key={k} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
          className="rounded-xl bg-black/25 px-2.5 py-2">
          <div className="text-[0.5rem] font-bold uppercase tracking-widest" style={{ color: accent }}>{k}</div>
          <div className="mt-0.5 truncate font-display text-[0.92rem] font-extrabold text-white">{v}</div>
        </motion.div>
      ))}
    </div>
  );
}

interface Props {
  tournament: TournamentState;
  teamName: string;
  tie?: KOTie;
  onViewStats?: (leg: MatchResult) => void;
  onContinue: () => void;
}

/**
 * Tournament End Screen 2.0 — a wide, premium two-column ending. The hero result
 * dominates the left; the tournament summary, journey, mini tactical XI and
 * awards sit on the right. Champion is gold + fireworks; runner-up is silver
 * particles (no confetti); eliminations dim the floodlights and escalate by
 * stage. The result is always the focus, in one glance.
 */
export function TrophyCelebration({ tournament, teamName, tie, onViewStats, onContinue }: Props) {
  const router = useRouter();
  const won = tournament.champion === USER_TEAM_ID;
  const awards = tournament.awards;
  const reachedFinal = tournament.exit?.stage === "Final";
  const exitText = tournament.exit?.text ?? "Your run has ended";
  const stageName = tournament.exit?.stage ?? "";
  const kind = won ? "champion" : reachedFinal ? "runner" : "out";

  const outTier: "sf" | "qf" | "r16" | "league" | "generic" =
    /Semi/.test(stageName) ? "sf"
      : /Quarter/.test(stageName) ? "qf"
        : /Round of 16|Play-?off/.test(stageName) ? "r16"
          : /League/.test(stageName) ? "league" : "generic";
  const MESSAGE: Record<string, string> = {
    champion: `${teamName} are the kings of Europe. Glory is yours.`,
    runner: "One match away from European glory.",
    sf: `Heartbreak — one step from the Final. A campaign ${teamName} won't forget.`,
    qf: `Among the final eight. A brave run from ${teamName} ends here.`,
    r16: `Your European journey ends in the Round of 16.`,
    league: `The league phase was the end of the road this time.`,
    generic: exitText,
  };
  const message = kind === "champion" ? MESSAGE.champion : kind === "runner" ? MESSAGE.runner : MESSAGE[outTier];

  const rawXi = useGame((s) => s.getXI)();
  const xi = rawXi.filter(Boolean);
  const formationObj = useGame.getState().formation;
  const formationName = useGame.getState().setup?.formationName;
  const captainName = xi.find((p) => p!.id === useGame.getState().captainId)?.name;
  const squadOverall = useGame.getState().getAnalysis()?.overall;
  const digest = useMemo(() => campaignDigest(tournament, teamName), [tournament, teamName]);

  const theme = {
    champion: { ring: "#f2d472", accent: "#22e0ff", bg: "#0a1f6e", label: "Champions of Europe", emoji: "🏆" },
    runner: { ring: "#c8d2e0", accent: "#c8d2e0", bg: "#0a1533", label: "Runners-up", emoji: "🥈" },
    out: { ring: "#5f8bff", accent: "#5f8bff", bg: "#0a1330", label: stageName || "The Road Ends", emoji: "" },
  }[kind];

  const [celebrateKey, setCelebrateKey] = useState(0);
  // outcome audio lands a beat AFTER the screen paints — never before the visual
  useEffect(() => {
    const id = setTimeout(() => play(won ? "win" : "lose"), 450);
    return () => clearTimeout(id);
  }, [won]);

  // the final tie, resolved from the actual legs (the user can be either side)
  const finalTie = useMemo(() => {
    if (!tie || (!tie.leg1 && !tie.leg2)) return null;
    const legs = [tie.leg1, tie.leg2].filter(Boolean) as MatchResult[];
    const ug = (l: MatchResult) => (l.home === USER_TEAM_ID ? l.homeGoals : l.awayGoals);
    const og = (l: MatchResult) => (l.home === USER_TEAM_ID ? l.awayGoals : l.homeGoals);
    const oppId = tie.teamA === USER_TEAM_ID ? tie.teamB : tie.teamA;
    return {
      userAgg: legs.reduce((s, l) => s + ug(l), 0),
      oppAgg: legs.reduce((s, l) => s + og(l), 0),
      opp: tournament.teams[oppId], round: tie.round, twoLegs: legs.length === 2,
      pens: (tie.leg2 ?? tie.leg1)?.penalties, legs,
    };
  }, [tie, tournament.teams]);

  const shareCard = () => {
    play("select");
    const opp = finalTie?.opp;
    void shareTrophyCard({
      compLabel: "Champions League",
      title: won ? "Champions of Europe" : theme.label,
      teamName,
      scoreLine: finalTie && opp
        ? `${teamName} ${finalTie.userAgg}-${finalTie.oppAgg} ${teamLabel(opp)}${finalTie.pens ? ` · pens ${finalTie.pens[0]}-${finalTie.pens[1]}` : ""}`
        : `${teamName} · ${theme.label}`,
      accent: "#22e0ff",
      players: xi.map((p) => ({ name: p!.name, position: p!.position, overall: p!.overall })),
    });
  };

  const statCells: [string, string][] = [
    ["Matches", `${digest.matches}`],
    ["Record", `${digest.rec.w}W · ${digest.rec.d}D · ${digest.rec.l}L`],
    ["Goals", `${digest.rec.gf}–${digest.rec.ga}`],
    ...(formationName ? [["Formation", formationName] as [string, string]] : []),
    ...(squadOverall ? [["Squad OVR", `${squadOverall}`] as [string, string]] : []),
    ...(captainName ? [["Captain", captainName] as [string, string]] : []),
    ...(digest.scorer ? [["Top Scorer", `${digest.scorer[0]} · ${digest.scorer[1]}`] as [string, string]] : []),
  ];
  const journeySteps = [...digest.journey, won ? "🏆 Champions" : kind === "runner" ? "Runners-up" : "Eliminated"];

  return (
    <motion.div
      className="fixed inset-0 z-[120] overflow-y-auto"
      style={{ background: `radial-gradient(130% 80% at 50% 0%, ${theme.bg}, #030b1e 70%)` }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      {/* atmosphere per outcome */}
      <div key={celebrateKey} className="pointer-events-none fixed inset-0">
        {kind === "champion" && (<><Fireworks count={9} palette={["#d4af37", "#f2d472", "#22e0ff", "#ffffff"]} /><Confetti count={130} /><CameraFlashes count={20} /></>)}
        {kind === "runner" && (<><Sparks count={18} color="#c8d2e0" /><CameraFlashes count={8} /></>)}
        {kind === "out" && (<>
          <RainOverlay drops={outTier === "sf" ? 60 : outTier === "qf" ? 48 : 40} opacity={outTier === "sf" ? 0.5 : 0.4} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 50% 0%, transparent 32%, rgba(2,6,18,0.72) 100%)" }} />
        </>)}
      </div>

      {/* content — wide, two-column, clear of the navbar */}
      <div className="relative mx-auto w-full max-w-[1400px] px-4 pb-16 pt-24 sm:px-6 lg:pt-28">
        <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">

          {/* ============ LEFT · HERO ============ */}
          <div>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 90, damping: 16 }}
              className="glass relative overflow-hidden rounded-3xl p-6 sm:p-9"
              style={{ boxShadow: `0 30px 90px rgba(0,0,0,0.6), inset 0 0 60px ${theme.ring}12` }}>
              {/* competition mosaic wash */}
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{ background: "repeating-linear-gradient(60deg, #fff 0 1px, transparent 1px 22px), repeating-linear-gradient(-60deg, #fff 0 1px, transparent 1px 22px)" }} />
              <div className="relative">
                <div className="flex items-center gap-3">
                  {won ? <div className="text-5xl" style={{ filter: `drop-shadow(0 0 26px ${theme.ring}88)` }}>🏆</div>
                    : kind === "runner" ? <div className="text-5xl">🥈</div>
                      : <CrestLogo size={54} animated={false} />}
                  <div className="cl-heading text-[0.72rem] tracking-[0.4em]" style={{ color: theme.ring }}>
                    {won ? "CHAMPIONS OF EUROPE" : theme.label.toUpperCase()}
                  </div>
                </div>

                <h1 className="mt-4 font-display text-4xl font-black leading-none sm:text-6xl">
                  {won ? <span className="text-gradient-gold text-shine">{teamName}</span> : <span className="text-white">{teamName}</span>}
                </h1>

                {/* big score vs opponent, or league placing */}
                {finalTie ? (
                  <div className="mt-6 flex flex-wrap items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-3">
                      <TeamBadge colors={tournament.teams[USER_TEAM_ID].colors} code={tournament.teams[USER_TEAM_ID].short} size={44} />
                      <span className="font-display text-5xl font-black text-white sm:text-7xl">{finalTie.userAgg}</span>
                    </div>
                    <span className="font-display text-3xl font-black text-white/30 sm:text-5xl">–</span>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-5xl font-black text-white sm:text-7xl">{finalTie.oppAgg}</span>
                      <TeamBadge colors={finalTie.opp.colors} code={finalTie.opp.short} size={44} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-display text-lg font-extrabold text-white">{teamLabel(finalTie.opp)}</div>
                      <div className="text-[0.68rem] font-bold uppercase tracking-widest text-white/50">
                        Champions League · {finalTie.round}{finalTie.twoLegs ? " · Aggregate" : ""}
                        {finalTie.pens ? ` · pens ${finalTie.pens[0]}-${finalTie.pens[1]}` : ""}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6">
                    <span className="font-display text-5xl font-black text-white sm:text-6xl">
                      {tournament.userSeed ? `${tournament.userSeed}${nth(tournament.userSeed)}` : "—"}
                    </span>
                    <span className="ml-2 text-sm font-bold uppercase tracking-widest text-white/50">in the league phase</span>
                  </div>
                )}

                <p className="mt-5 max-w-xl text-[0.95rem] leading-relaxed text-white/70">{message}</p>
              </div>
            </motion.div>

            {/* actions — immediately below the hero, no scrolling required */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="mt-4 flex flex-wrap gap-2.5">
              <button className="btn btn-gold" onClick={() => { play("select"); router.push("/draft"); }}>🔁 Play Again</button>
              <button className="btn btn-secondary" onClick={() => { play("select"); onContinue(); }}>📊 Tournament Stats</button>
              <button className="btn btn-ghost" onClick={shareCard}>📸 Share XI</button>
              {won && <button className="btn btn-ghost" onClick={() => { play("trophy"); setCelebrateKey((k) => k + 1); }}>🎆 Replay</button>}
              <button className="btn btn-ghost" onClick={() => { play("click"); router.push("/"); }}>🏠 Home</button>
            </motion.div>

            {/* match legs — compact, for two-legged ties */}
            {finalTie && finalTie.twoLegs && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="mt-4 grid gap-2 sm:grid-cols-2">
                {finalTie.legs.map((leg, i) => {
                  const hn = leg.home === USER_TEAM_ID ? teamName : teamLabel(tournament.teams[leg.home]);
                  const an = leg.away === USER_TEAM_ID ? teamName : teamLabel(tournament.teams[leg.away]);
                  return (
                    <div key={i} className="flex items-center justify-between gap-2 rounded-xl bg-black/25 px-3 py-2 text-[0.72rem]">
                      <div className="min-w-0">
                        <div className="text-[0.5rem] font-bold uppercase tracking-widest text-white/40">{i === 0 ? "First Leg" : "Second Leg"}</div>
                        <div className="truncate font-semibold text-white/85">{hn} {leg.homeGoals}–{leg.awayGoals} {an}</div>
                      </div>
                      {onViewStats && <button className="shrink-0 rounded-md border border-cyan/40 px-2 py-1 text-[0.56rem] font-bold uppercase tracking-wider text-cyan hover:bg-cyan/10" onClick={() => onViewStats(leg)}>Stats</button>}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* ============ RIGHT · SUMMARY ============ */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
            {/* champion awards */}
            {won && awards && (
              <div className="glass rounded-2xl p-4">
                <div className="cl-heading mb-2.5 text-[0.56rem] tracking-[0.3em]" style={{ color: theme.ring }}>Tournament Awards</div>
                <div className="grid grid-cols-3 gap-2">
                  {[{ i: "🥇", l: "Golden Ball", v: awards.goldenBall }, { i: "👟", l: "Golden Boot", v: awards.goldenBoot, s: `${awards.topScorerGoals} goals` }, { i: "🧤", l: "Golden Glove", v: awards.goldenGlove }].map((a) => (
                    <div key={a.l} className="rounded-xl bg-black/25 p-2 text-center">
                      <div className="text-xl">{a.i}</div>
                      <div className="mt-0.5 text-[0.48rem] font-bold uppercase tracking-widest text-white/45">{a.l}</div>
                      <div className="mt-0.5 truncate text-[0.66rem] font-bold text-white">{a.v}</div>
                      {a.s && <div className="text-[0.56rem]" style={{ color: theme.ring }}>{a.s}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* one Tournament Summary panel: timeline + stats + short recap */}
            <div className="glass rounded-2xl p-4 sm:p-5">
              <div className="cl-heading mb-2.5 text-[0.56rem] tracking-[0.3em]" style={{ color: theme.ring }}>Tournament Journey</div>
              <JourneyTimeline steps={journeySteps} accent={theme.ring} />
              <div className="mt-4"><StatGrid cells={statCells} accent={theme.ring} /></div>
              <p className="mt-3.5 text-[0.76rem] leading-relaxed text-white/60">{digest.story}</p>
            </div>

            {/* mini tactical pitch — the XI they built */}
            {formationObj && xi.length > 0 && (
              <div className="glass rounded-2xl p-3 sm:p-4">
                <div className="cl-heading mb-2 text-[0.56rem] tracking-[0.3em]" style={{ color: theme.ring }}>Your Starting XI</div>
                <div className="mx-auto max-w-[320px]">
                  <Pitch formation={formationObj} players={rawXi} variant="cl" showRatings compact />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function nth(n: number): string {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}
