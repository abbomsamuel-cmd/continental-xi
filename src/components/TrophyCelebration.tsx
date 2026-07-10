"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { KOTie, MatchResult, TournamentState } from "@/lib/types";
import { USER_TEAM_ID, teamLabel } from "@/lib/engine/tournament";
import { CrestLogo } from "@/components/CrestLogo";
import { Fireworks } from "@/components/fx/Fireworks";
import { Confetti, CameraFlashes, RainOverlay } from "@/components/fx/Atmosphere";
import { useGame } from "@/lib/store";
import { shareTrophyCard } from "@/lib/trophy-card";
import { play } from "@/lib/sound";

interface Props {
  tournament: TournamentState;
  teamName: string;
  /** the user's final knockout tie — both legs shown so the aggregate is never confusing */
  tie?: KOTie;
  /** open the full match-statistics modal for one leg */
  onViewStats?: (leg: MatchResult) => void;
  onContinue: () => void;
}

/**
 * End-of-season ceremony. A win runs a staged sequence: arrival → the trophy
 * lift (fireworks, confetti, banner) → awards & Champions XI → continue.
 * A defeat gets the quiet, rain-soaked version.
 */
export function TrophyCelebration({ tournament, teamName, tie, onViewStats, onContinue }: Props) {
  const won = tournament.champion === USER_TEAM_ID;
  const awards = tournament.awards;
  const reachedFinal = tournament.exit?.stage === "Final";
  const exitText = tournament.exit?.text ?? "Your run has ended";
  const xi = useGame((s) => s.getXI)().filter(Boolean);

  // celebration stages: summary → (Lift the Trophy) → lift → awards revealed
  const [stage, setStage] = useState<"summary" | "lift">("summary");
  const [showAwards, setShowAwards] = useState(false);

  const kind = won ? "champion" : reachedFinal ? "runner" : "out";
  const theme = {
    champion: { glow: "rgba(212,175,55,0.6)", ring: "#d4af37", bg: "#0a1f6e", title: "Champions of Europe", emoji: "🏆" },
    runner: { glow: "rgba(180,200,255,0.45)", ring: "#c0c8d4", bg: "#0a1650", title: "Runners-up", emoji: "🥈" },
    out: { glow: "rgba(120,150,255,0.3)", ring: "#4a6bd6", bg: "#0a1330", title: "The Road Ends", emoji: "" },
  }[kind];

  useEffect(() => { play(won ? "win" : "lose"); }, [won]);

  const liftTrophy = () => {
    setStage("lift");
    play("trophy");
    // let the lift land before the honours roll out
    setTimeout(() => setShowAwards(true), 1800);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto p-4"
      style={{ background: `radial-gradient(130% 90% at 50% 25%, ${theme.bg}, #030b22 72%)` }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      {/* atmosphere layers */}
      {stage === "lift" && (
        <>
          <Fireworks count={9} palette={["#d4af37", "#f2d472", "#22e0ff", "#ffffff"]} />
          <Confetti count={140} />
          <CameraFlashes count={22} />
        </>
      )}
      {kind === "runner" && stage === "summary" && <Confetti count={60} colors={["#c0c8d4", "#9fb3d1", "#ffffff"]} />}
      {kind === "out" && <RainOverlay drops={44} opacity={0.4} />}

      {/* rotating starburst rays behind the emblem */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 620, height: 620,
          background: `conic-gradient(from 0deg, transparent 0 8deg, ${theme.glow} 8deg 10deg, transparent 10deg 18deg)`,
          maskImage: "radial-gradient(circle, #000 8%, transparent 62%)",
          WebkitMaskImage: "radial-gradient(circle, #000 8%, transparent 62%)",
        }}
        initial={{ rotate: 0, opacity: 0 }}
        animate={{ rotate: 360, opacity: stage === "lift" ? 0.8 : 0.5 }}
        transition={{ rotate: { duration: 26, repeat: Infinity, ease: "linear" }, opacity: { duration: 1 } }}
      />
      {/* light burst */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1.5, 1.15], opacity: [0, 0.85, 0.4] }}
        transition={{ duration: 1.5, delay: 0.1, ease: "easeOut" }}
        style={{ width: 560, height: 560, borderRadius: "50%", background: `radial-gradient(circle, ${theme.glow}, transparent 62%)`, filter: "blur(6px)" }}
      />

      <div className="relative z-10 w-full max-w-lg py-8 text-center">
        {/* emblem: crest at rest, trophy raised high once lifted */}
        <motion.div
          initial={{ scale: 0, rotate: -30, y: 40 }}
          animate={stage === "lift" ? { scale: 1.15, rotate: 0, y: -14 } : { scale: 1, rotate: 0, y: 0 }}
          transition={{ type: "spring", stiffness: 105, damping: 11, delay: stage === "lift" ? 0 : 0.25 }}
        >
          {won ? (
            <div className="text-[9rem] leading-none" style={{ filter: `drop-shadow(0 0 48px ${theme.glow})` }}>🏆</div>
          ) : (
            <div className="mx-auto w-fit" style={{ filter: `drop-shadow(0 0 40px ${theme.glow})`, opacity: kind === "out" ? 0.9 : 1 }}>
              <CrestLogo size={120} animated={false} />
            </div>
          )}
        </motion.div>
        {/* podium under the lifted trophy */}
        {won && (
          <motion.div
            aria-hidden
            className="mx-auto -mt-2 h-3 w-44 rounded-t-md"
            initial={{ opacity: 0, scaleX: 0.4 }}
            animate={{ opacity: stage === "lift" ? 1 : 0.35, scaleX: 1 }}
            transition={{ delay: 0.4 }}
            style={{ background: "linear-gradient(180deg, rgba(212,175,55,0.7), rgba(140,110,30,0.4))", boxShadow: "0 6px 24px rgba(212,175,55,0.35)" }}
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="mt-3 cl-heading text-[0.7rem] tracking-[0.4em]" style={{ color: theme.ring }}
        >
          {kind === "champion" ? "Season Complete" : kind === "runner" ? "The Final" : `${tournament.exit?.stage ?? ""}`}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, type: "spring", stiffness: 120 }}
          className="mt-1 font-display text-4xl font-extrabold sm:text-5xl"
        >
          {won ? <span className="text-gradient-gold text-shine">{theme.title}</span> : <span className="text-white/90">{theme.title}</span>}
        </motion.h1>

        {/* champions banner unfurls on the lift */}
        <AnimatePresence>
          {stage === "lift" && (
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
              className="mx-auto mt-3 w-fit rounded-md border border-gold/60 bg-gold/12 px-5 py-1.5"
            >
              <span className="cl-heading text-[0.62rem] tracking-[0.35em] text-gold">★ {teamName} · Champions ★</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="mx-auto mt-2 max-w-sm text-sm text-muted"
        >
          {won ? `${teamName} are the kings of Europe. Glory is yours.` : `${teamName} — ${exitText}.`}
        </motion.p>

        {/* honours: MVP, Golden Boot, Golden Glove — revealed after the lift */}
        {won && awards && (stage === "lift" ? showAwards : false) && (
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            className="mt-6 grid grid-cols-3 gap-3"
          >
            {[
              { icon: "🥇", label: "Player of the Tournament", value: awards.goldenBall },
              { icon: "👟", label: "Golden Boot", value: `${awards.goldenBoot}`, sub: `${awards.topScorerGoals} goals` },
              { icon: "🧤", label: "Golden Glove", value: awards.goldenGlove },
            ].map((a, i) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, rotateY: 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                transition={{ delay: i * 0.22, type: "spring", stiffness: 160, damping: 16 }}
                className="cl-panel rounded-2xl p-3"
              >
                <div className="text-2xl">{a.icon}</div>
                <div className="mt-1 text-[0.55rem] font-bold uppercase tracking-widest text-muted">{a.label}</div>
                <div className="mt-0.5 text-[0.72rem] font-bold text-white">{a.value}</div>
                {a.sub && <div className="text-[0.6rem] text-gold">{a.sub}</div>}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* the Champions XI, medals around their necks */}
        {won && stage === "lift" && showAwards && xi.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="cl-panel mx-auto mt-4 rounded-2xl p-4"
          >
            <div className="cl-heading mb-2 text-[0.58rem] tracking-[0.3em] text-cyan">Your Champions XI</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-left sm:grid-cols-3">
              {xi.map((p, i) => (
                <motion.div
                  key={p!.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.06 }}
                  className="flex items-center gap-1.5 text-[0.62rem]"
                >
                  <span aria-hidden>🥇</span>
                  <span className="w-6 shrink-0 font-bold text-cyan/80">{p!.position}</span>
                  <span className="truncate font-semibold text-white/90">{p!.name}</span>
                  <span className="ml-auto font-display font-extrabold text-gold">{p!.overall}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* final tie summary — sides computed from the actual legs, never by
            assuming the user is teamA (they can be either side of a tie) */}
        {stage === "summary" && tie && (tie.leg1 || tie.leg2) && (() => {
          const legsPlayed = [tie.leg1, tie.leg2].filter(Boolean) as MatchResult[];
          const userGoalsIn = (leg: MatchResult) => (leg.home === USER_TEAM_ID ? leg.homeGoals : leg.awayGoals);
          const oppGoalsIn = (leg: MatchResult) => (leg.home === USER_TEAM_ID ? leg.awayGoals : leg.homeGoals);
          const userAgg = legsPlayed.reduce((s, l) => s + userGoalsIn(l), 0);
          const oppAgg = legsPlayed.reduce((s, l) => s + oppGoalsIn(l), 0);
          const twoLegs = legsPlayed.length === 2;
          const decider = tie.leg2 ?? tie.leg1!;
          const pens = decider.penalties;
          const oppId = tie.teamA === USER_TEAM_ID ? tie.teamB : tie.teamA;
          const opp = tournament.teams[oppId];
          const legs: { label: string; leg: MatchResult }[] = twoLegs
            ? [
                { label: `1st Leg · ${tie.leg1!.home === USER_TEAM_ID ? "Home" : "Away"}`, leg: tie.leg1! },
                { label: `2nd Leg · ${tie.leg2!.home === USER_TEAM_ID ? "Home" : "Away"}`, leg: tie.leg2! },
              ]
            : [{ label: "Final · Neutral venue", leg: tie.leg1! }];
          return (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
              className="cl-panel mx-auto mt-6 max-w-sm rounded-2xl p-4 text-left"
            >
              <div className="cl-heading mb-2 text-center text-[0.55rem] tracking-[0.25em] text-cyan">
                {tie.round} · {twoLegs ? "Aggregate" : "Result"}
              </div>
              {/* aggregate line — always both sides, never just one leg */}
              <div className="flex items-center justify-between gap-2 text-sm font-bold">
                <span className="flex-1 truncate">{teamName}</span>
                <span className="font-display text-2xl">
                  {userAgg}<span className="mx-1 text-white/40">-</span>{oppAgg}
                </span>
                <span className="flex-1 truncate text-right">{teamLabel(opp)}</span>
              </div>
              {pens && (
                <div className="mt-1 text-center text-[0.65rem] font-bold text-gold">
                  Level on aggregate — penalty shootout {pens[0]}-{pens[1]}
                </div>
              )}
              {/* each leg, with its own full-stats button */}
              <div className="mt-3 space-y-1.5">
                {legs.map(({ label, leg }) => {
                  const homeName = leg.home === USER_TEAM_ID ? teamName : teamLabel(tournament.teams[leg.home]);
                  const awayName = leg.away === USER_TEAM_ID ? teamName : teamLabel(tournament.teams[leg.away]);
                  return (
                    <div key={label} className="flex items-center justify-between gap-2 rounded-lg bg-black/25 px-2.5 py-1.5 text-[0.62rem]">
                      <div className="min-w-0">
                        <div className="uppercase tracking-widest text-muted">{label}</div>
                        <div className="truncate font-semibold text-white">
                          {homeName} {leg.homeGoals}-{leg.awayGoals} {awayName}
                          {leg.penalties && <span className="text-gold"> · pens {leg.penalties[0]}-{leg.penalties[1]}</span>}
                        </div>
                      </div>
                      {onViewStats && (
                        <button
                          className="shrink-0 rounded-md border border-cyan/40 px-2 py-1 text-[0.58rem] font-bold uppercase tracking-wider text-cyan hover:bg-cyan/10"
                          onClick={() => onViewStats(leg)}
                        >
                          Full stats
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })()}

        {/* controls: winners lift first, everyone continues at the end */}
        {won && stage === "summary" && (
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
            className="btn btn-gold btn-pulse mt-8" onClick={liftTrophy}
          >
            🏆 Lift the Trophy
          </motion.button>
        )}
        {won && stage === "lift" && showAwards && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <button
              className="btn btn-ghost"
              onClick={() => {
                play("select");
                const legsPlayed = tie ? ([tie.leg1, tie.leg2].filter(Boolean) as MatchResult[]) : [];
                const userAgg = legsPlayed.reduce((s, l) => s + (l.home === USER_TEAM_ID ? l.homeGoals : l.awayGoals), 0);
                const oppAgg = legsPlayed.reduce((s, l) => s + (l.home === USER_TEAM_ID ? l.awayGoals : l.homeGoals), 0);
                const pens = (tie?.leg2 ?? tie?.leg1)?.penalties;
                const opp = tie ? tournament.teams[tie.teamA === USER_TEAM_ID ? tie.teamB : tie.teamA] : null;
                void shareTrophyCard({
                  compLabel: "Champions League",
                  title: "Champions of Europe",
                  teamName,
                  scoreLine: opp
                    ? `${teamName} ${userAgg}-${oppAgg} ${teamLabel(opp)}${pens ? ` · pens ${pens[0]}-${pens[1]}` : ""}`
                    : `${teamName} · Champions`,
                  accent: "#22e0ff",
                  players: xi.map((p) => ({ name: p!.name, position: p!.position, overall: p!.overall })),
                });
              }}
            >
              📸 Save Trophy Card
            </button>
            <button className="btn btn-gold" onClick={onContinue}>
              Continue to Your Profile
            </button>
          </motion.div>
        )}
        {!won && (
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
            className="btn btn-gold mt-8" onClick={onContinue}
          >
            Save Result & Continue
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
