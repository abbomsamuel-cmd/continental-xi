"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { LeagueTable } from "@/components/LeagueTable";
import { MatchModal } from "@/components/MatchModal";
import { KnockoutBracket } from "@/components/KnockoutBracket";
import { TrophyCelebration } from "@/components/TrophyCelebration";
import { AchievementToast } from "@/components/AchievementToast";
import { CrestLogo } from "@/components/CrestLogo";
import { TeamBadge } from "@/components/TeamBadge";
import { RoundTransition } from "@/components/fx/RoundTransition";
import { Fireworks } from "@/components/fx/Fireworks";
import { CameraFlashes, Sparks, RainOverlay } from "@/components/fx/Atmosphere";
import { LiveMatch, SimStyleChoice, type LiveLeg } from "@/components/LiveMatch";
import { MatchdayLive, type MDFixtureView, type MiniRow } from "@/components/MatchdayLive";
import { QuickSim, scorersOf, type QuickSimData, type QuickMatch } from "@/components/QuickSim";
import { MatchPreview, GoldenBootRace, HeadlinesPanel, type PreviewTeam } from "@/components/TournamentCentre";
import { goldenBootRace, tournamentHeadlines, knockoutVenue } from "@/lib/broadcast";
import { hashString } from "@/lib/rng";
import { PageBoundary } from "@/components/PageBoundary";
import { USER_TEAM_ID, teamLabel } from "@/lib/engine/tournament";
import { matchupEdge, tacticById } from "@/lib/tactics";
import type { Fixture, KOTie, MatchResult, SimTeam, TournamentState } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { play } from "@/lib/sound";

const PHASE_LABEL: Record<string, string> = {
  league: "League Phase", playoffs: "Knockout Play-offs", r16: "Round of 16",
  qf: "Quarter-finals", sf: "Semi-finals", final: "Final", done: "Complete",
};

/** Shown in the qualification burst when the user advances INTO this phase. */
const PHASE_BURST: Record<string, string> = {
  playoffs: "Into the Knockout Play-offs",
  r16: "Through to the Round of 16",
  qf: "Through to the Quarter-finals",
  sf: "Through to the Semi-finals",
  final: "You're in the Final",
};

/** Broadcast-ready team ref for the matchday results show. */
function mdRef(t: SimTeam) {
  return { id: t.id, name: t.isUser ? t.name : teamLabel(t), short: t.short, colors: t.colors, isUser: t.isUser };
}

/** Plain-language qualification outcome once the league phase has resolved. */
function phaseQualLine(t: TournamentState | null): string {
  if (!t) return "";
  const pos = t.userSeed ?? 0;
  if (!t.userAlive || t.phase === "done") return t.exit?.text ?? "Eliminated in the league phase";
  if (pos >= 1 && pos <= 8) return "Qualified directly for the Round of 16";
  return `Into the play-off round · finished ${pos}${pos ? nth(pos) : ""}`;
}
function nth(n: number): string {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}

/** Skeleton shown while the persisted save rehydrates and in the static HTML —
 *  never a blank page on refresh, shared links or incognito. */
function TournamentLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-24 sm:pt-28" aria-hidden>
      <div className="cl-panel cl-streaks h-32 animate-pulse rounded-3xl" />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="glass h-24 animate-pulse rounded-2xl" />)}
      </div>
      <div className="glass mt-8 h-64 animate-pulse rounded-2xl" />
    </div>
  );
}

export default function TournamentPage() {
  const t = useT();
  return (
    <PageBoundary title={t("common.wentWrong")} body={t("common.wentWrongBody")} retry={t("common.retry")}>
      <TournamentInner />
    </PageBoundary>
  );
}

function TournamentInner() {
  const router = useRouter();
  const t = useT();
  const tournament = useGame((s) => s.tournament);
  const advanceKnockout = useGame((s) => s.advanceKnockout);
  const getTable = useGame((s) => s.getTable);
  const recordResult = useGame((s) => s.recordResult);
  const resetDraft = useGame((s) => s.resetDraft);
  const lastUnlocked = useGame((s) => s.lastUnlocked);

  const [modal, setModal] = useState<{ result: MatchResult; title?: string } | null>(null);
  const [saved, setSaved] = useState(false);
  // cinematic advance flow: whistle → tunnel transition → simulate → burst
  const [transition, setTransition] = useState<{ title: string; subtitle: string } | null>(null);
  const [burst, setBurst] = useState<string | null>(null);
  // Live Match mode — semi-finals and the final can be watched minute by minute
  const [simChoice, setSimChoice] = useState<string | null>(null);
  const [live, setLive] = useState<{ legs: LiveLeg[]; title: string; prevPhase: string } | null>(null);
  // Matchday broadcast — league nights play out as a live results show.
  // fixtures === null while the round simulates behind the opaque overlay,
  // so the page can never flash a result early.
  const [matchdayShow, setMatchdayShow] = useState<{
    fixtures: MDFixtureView[] | null; baseTable: MiniRow[]; title: string; prevPhase: string;
  } | null>(null);
  // Quick Sim — a fast compact result instead of the full broadcast show.
  // data === null while it simulates behind the opaque overlay (no early flash).
  const [quickShow, setQuickShow] = useState<{ data: QuickSimData | null; title: string } | null>(null);
  const [quickConfirm, setQuickConfirm] = useState(false);
  const [quickStopEarly, setQuickStopEarly] = useState(true);
  const pendingFn = useRef<(() => void) | null>(null);
  // Synchronous double-click guard: React state alone lets two fast clicks both
  // see idle state and advance TWO rounds at once — you'd watch one opponent
  // and "lose" to the next round's team you never saw. The ref closes that gap.
  const busyRef = useRef(false);

  // wait for the persisted save to rehydrate — a hard refresh of /tournament
  // must resume the campaign, and without one this page is the Career Hub
  const hydrated = useGame((s) => s.hydrated);
  const profile = useGame((s) => s.profile);
  const intl = useGame((s) => s.intl);

  if (!hydrated) return <TournamentLoading />;
  if (!tournament) return <CareerHub profile={profile} intlActive={!!intl} />;

  const table = getTable();
  const userRow = table.findIndex((r) => r.teamId === USER_TEAM_ID) + 1;
  const isLeague = tournament.phase === "league";
  const isDone = tournament.phase === "done";
  const userFixtures = tournament.fixtures.filter(
    (f) => (f.home === USER_TEAM_ID || f.away === USER_TEAM_ID),
  );

  const runCinematic = (title: string, fn: () => void) => {
    if (busyRef.current) return;
    busyRef.current = true;
    play("whistle");
    pendingFn.current = fn;
    setTransition({ title, subtitle: "Champions Draft" });
  };

  const fireBurstIfQualified = (prevPhase: string | undefined) => {
    const next = useGame.getState().tournament;
    if (next && prevPhase && next.phase !== prevPhase && PHASE_BURST[next.phase]) {
      play("win");
      setBurst(PHASE_BURST[next.phase]);
      setTimeout(() => setBurst(null), 2700);
    }
  };

  const onTransitionDone = () => {
    const prevPhase = useGame.getState().tournament?.phase;
    pendingFn.current?.();
    pendingFn.current = null;
    setTransition(null);
    busyRef.current = false;
    fireBurstIfQualified(prevPhase);
  };

  // Matchday broadcast: mount the opaque show FIRST (prep beat), then simulate
  // behind it — the page can never flash the new results before the reveal.
  const startMatchdayShow = () => {
    if (busyRef.current) return;
    busyRef.current = true;
    play("whistle");
    const state = useGame.getState();
    const prevPhase = state.tournament?.phase ?? "league";
    const md = state.tournament?.matchday ?? 1;
    // standings BEFORE the round — points animate in as results land
    const baseTable: MiniRow[] = state.getTable().map((row) => {
      const team = state.tournament!.teams[row.teamId];
      return { ...mdRef(team), points: row.points, gd: row.gf - row.ga };
    });
    setMatchdayShow({ fixtures: null, baseTable, title: `Matchday ${md}`, prevPhase });
    setTimeout(() => {
      const played = useGame.getState().advanceLeague();
      const teams = useGame.getState().tournament?.teams;
      if (!played.length || !teams) {
        setMatchdayShow(null);
        busyRef.current = false;
        fireBurstIfQualified(prevPhase);
        return;
      }
      const fixtures: MDFixtureView[] = played
        .filter((f) => f.result)
        .map((f) => ({ home: mdRef(teams[f.home]), away: mdRef(teams[f.away]), result: f.result! }));
      setMatchdayShow((prev) => (prev ? { ...prev, fixtures } : prev));
    }, 1000);
  };

  const onMatchdayDone = () => {
    const prevPhase = matchdayShow?.prevPhase;
    setMatchdayShow(null);
    busyRef.current = false;
    fireBurstIfQualified(prevPhase);
  };

  // Quick Sim: same engine as the live show, just a compact result. Mounts the
  // opaque overlay FIRST, then simulates behind it — never a spoiler flash.
  const quickSimSingle = () => {
    if (busyRef.current) return;
    busyRef.current = true;
    play("whistle");
    const md = useGame.getState().tournament?.matchday ?? 1;
    setQuickShow({ data: null, title: `Matchday ${md}` });
    setTimeout(() => {
      const before = useGame.getState().getTable().findIndex((x) => x.teamId === USER_TEAM_ID) + 1;
      const played = useGame.getState().advanceLeague();
      const st = useGame.getState();
      const teams = st.tournament?.teams;
      const userFix = played.find((f) => f.result && (f.home === USER_TEAM_ID || f.away === USER_TEAM_ID));
      if (!userFix?.result || !teams) { setQuickShow(null); busyRef.current = false; return; }
      const r = userFix.result;
      const posAfter = st.getTable().findIndex((x) => x.teamId === USER_TEAM_ID) + 1;
      const data: QuickSimData = {
        kind: "single",
        home: mdRef(teams[r.home]), away: mdRef(teams[r.away]),
        hg: r.homeGoals, ag: r.awayGoals, userSide: r.home === USER_TEAM_ID ? 0 : 1,
        scorers: scorersOf(r), result: r,
        posBefore: before, posAfter,
        qualLine: st.tournament?.phase !== "league" ? phaseQualLine(st.tournament) : undefined,
      };
      setQuickShow((prev) => (prev ? { ...prev, data } : prev));
    }, 900);
  };

  const quickSimPhase = () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setQuickConfirm(false);
    play("whistle");
    const stopEarly = quickStopEarly;
    setQuickShow({ data: null, title: "League Phase" });
    setTimeout(() => {
      const matches: QuickMatch[] = [];
      let w = 0, d = 0, l = 0, gf = 0, ga = 0;
      // each advanceLeague plays one matchday; after MD8 it resolves the phase
      // and the phase flips, ending the loop naturally.
      while (useGame.getState().tournament?.phase === "league") {
        const played = useGame.getState().advanceLeague();
        if (!played.length) break;
        const st = useGame.getState();
        const teams = st.tournament!.teams;
        const uf = played.find((f) => f.result && (f.home === USER_TEAM_ID || f.away === USER_TEAM_ID));
        if (uf?.result) {
          const r = uf.result;
          const side: 0 | 1 = r.home === USER_TEAM_ID ? 0 : 1;
          const us = side === 0 ? r.homeGoals : r.awayGoals;
          const them = side === 0 ? r.awayGoals : r.homeGoals;
          gf += us; ga += them; if (us > them) w++; else if (us === them) d++; else l++;
          matches.push({ home: mdRef(teams[r.home]), away: mdRef(teams[r.away]), hg: r.homeGoals, ag: r.awayGoals, userSide: side, scorers: scorersOf(r), result: r, md: uf.matchday });
        }
        if (stopEarly && !st.tournament?.userAlive) break;
      }
      const t = useGame.getState().tournament!;
      const pos = t.userSeed ?? (useGame.getState().getTable().findIndex((x) => x.teamId === USER_TEAM_ID) + 1);
      setQuickShow((prev) => (prev ? {
        ...prev,
        data: { kind: "phase", simmed: matches.length, w, d, l, gf, ga, pos, qualified: t.userAlive, qualification: phaseQualLine(t), matches },
      } : prev));
    }, 900);
  };

  const onQuickDone = () => {
    setQuickShow(null);
    busyRef.current = false;
    fireBurstIfQualified("league");
  };

  // Live Match: simulate the round now, then broadcast the user's tie minute
  // by minute (both legs of a semi, or the single-night final).
  const startLive = (roundTitle: string) => {
    if (busyRef.current) return;
    const state = useGame.getState();
    const prevPhase = state.tournament?.phase;
    if (!prevPhase) return;
    busyRef.current = true;
    setSimChoice(null);
    play("whistle");
    state.advanceKnockout();
    const next = useGame.getState().tournament;
    const round = prevPhase === "sf" ? "Semi-final" : "Final";
    const tie = next?.ties.find(
      (k) => k.round === round && k.leg1 && (k.teamA === USER_TEAM_ID || k.teamB === USER_TEAM_ID),
    );
    if (!tie?.leg1) {
      busyRef.current = false;
      fireBurstIfQualified(prevPhase);
      return;
    }
    const legs: LiveLeg[] = tie.leg2
      ? [{ result: tie.leg1, label: "1st Leg" }, { result: tie.leg2, label: "2nd Leg" }]
      : [{ result: tie.leg1 }];
    setLive({ legs, title: roundTitle, prevPhase });
  };

  const onLiveDone = () => {
    const prevPhase = live?.prevPhase;
    setLive(null);
    busyRef.current = false;
    fireBurstIfQualified(prevPhase);
  };

  // End of season: save the result, then LOCK it — the draft is cleared so it
  // can never be replayed or reused. The user starts fresh next time.
  const endSeason = () => {
    recordResult();
    setSaved(true);
    resetDraft();
    router.push("/stats");
  };

  const eliminatedInLeague = isDone && tournament.exit?.stage === "League Phase";
  // the undecided final, when we're on final night — drives the showdown panel
  const finalShowdown = tournament.phase === "final" && !isDone
    ? tournament.ties.find((k) => k.round === "Final" && !k.winner) ?? null
    : null;
  // ties now cover the WHOLE field — the user's road is the filtered subset
  const userTies = tournament.ties.filter((t) => t.teamA === USER_TEAM_ID || t.teamB === USER_TEAM_ID);
  const lastTie = userTies[userTies.length - 1];
  const nextTie = userTies.find((t) => !t.winner);

  // ---- career-hub numbers: the whole campaign at a glance ----
  const campaignMatches: MatchResult[] = [
    ...userFixtures.filter((f) => f.result).map((f) => f.result!),
    ...userTies.flatMap((t) => [t.leg1, t.leg2].filter(Boolean) as MatchResult[]),
  ];
  const record = campaignMatches.reduce(
    (acc, r) => {
      const uf = r.home === USER_TEAM_ID ? r.homeGoals : r.awayGoals;
      const oa = r.home === USER_TEAM_ID ? r.awayGoals : r.homeGoals;
      acc.gf += uf; acc.ga += oa;
      if (uf > oa) acc.w++; else if (uf === oa) acc.d++; else acc.l++;
      return acc;
    },
    { w: 0, d: 0, l: 0, gf: 0, ga: 0 },
  );
  const lastResult = campaignMatches[campaignMatches.length - 1];

  // ---- tournament centre: every played match across the WHOLE field ----
  const allMatches: MatchResult[] = [
    ...tournament.fixtures.filter((f) => f.result).map((f) => f.result!),
    ...tournament.ties.flatMap((t) => [t.leg1, t.leg2].filter(Boolean) as MatchResult[]),
  ];
  const bootRace = goldenBootRace(allMatches, (id) => tournament.teams[id]);
  const REMAINING: Record<string, number> = { playoffs: 24, r16: 16, qf: 8, sf: 4, final: 2 };
  const headlines = tournamentHeadlines({
    rows: table.slice(0, 4).map((r) => ({
      name: tournament.teams[r.teamId].isUser ? tournament.teams[r.teamId].name : teamLabel(tournament.teams[r.teamId]),
      points: r.points,
      isUser: tournament.teams[r.teamId].isUser,
      unbeaten: r.played > 0 && r.lost === 0,
    })),
    topScorer: bootRace[0] ? { player: bootRace[0].player, goals: bootRace[0].goals, teamShort: bootRace[0].teamShort } : undefined,
    stageLabel: PHASE_LABEL[tournament.phase] ?? "",
    userName: tournament.teams[USER_TEAM_ID].name,
    userAlive: tournament.userAlive,
    remaining: REMAINING[tournament.phase],
    seed: allMatches.length * 13 + (tournament.userSeed ?? 1),
  });
  // pre-match show data for one side of the user's next tie
  const previewSide = (id: string): PreviewTeam => {
    const team = tournament.teams[id];
    const ms = allMatches.filter((m) => m.home === id || m.away === id);
    const rec = ms.reduce(
      (acc, m) => {
        const uf = m.home === id ? m.homeGoals : m.awayGoals;
        const oa = m.home === id ? m.awayGoals : m.homeGoals;
        acc.gf += uf; acc.ga += oa;
        if (uf > oa) acc.w++; else if (uf === oa) acc.d++; else acc.l++;
        return acc;
      },
      { w: 0, d: 0, l: 0, gf: 0, ga: 0 },
    );
    const form = ms.slice(-5).map((m) => {
      const uf = m.home === id ? m.homeGoals : m.awayGoals;
      const oa = m.home === id ? m.awayGoals : m.homeGoals;
      return uf > oa ? "W" : uf === oa ? "D" : "L";
    }) as ("W" | "D" | "L")[];
    const tally = new Map<string, number>();
    for (const m of ms) {
      const side = m.home === id ? 0 : 1;
      for (const e of m.events) if (e.type === "goal" && e.team === side) tally.set(e.player, (tally.get(e.player) ?? 0) + 1);
    }
    const scorer = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
    const keyPlayers = team.isUser
      ? (useGame.getState().getXI().filter(Boolean).sort((a, b) => b!.overall - a!.overall).slice(0, 3).map((p) => p!.name))
      : undefined;
    return {
      name: team.isUser ? team.name : teamLabel(team),
      short: team.short, colors: team.colors, strength: team.strength,
      record: rec, form, keyPlayers, isUser: team.isUser,
      topScorer: scorer ? { name: scorer[0], goals: scorer[1] } : undefined,
    };
  };
  const nextOpp = (() => {
    if (isLeague) {
      const f = tournament.fixtures.find(
        (x) => x.matchday === tournament.matchday && !x.result && (x.home === USER_TEAM_ID || x.away === USER_TEAM_ID),
      );
      return f ? { team: tournament.teams[f.home === USER_TEAM_ID ? f.away : f.home], home: f.home === USER_TEAM_ID } : null;
    }
    return nextTie ? { team: tournament.teams[nextTie.teamA === USER_TEAM_ID ? nextTie.teamB : nextTie.teamA], home: null } : null;
  })();

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-24 sm:pt-28">
      {/* header */}
      <div className="cl-panel cl-streaks shine relative overflow-hidden rounded-3xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CrestLogo size={44} />
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-cyan">{PHASE_LABEL[tournament.phase]}</div>
              <h1 className="font-display text-2xl font-extrabold sm:text-4xl">
                {tournament.teams[USER_TEAM_ID].name}
              </h1>
              <div className="text-sm text-muted">
                {isLeague
                  ? `Matchday ${Math.min(tournament.matchday, 8)} of 8 · Currently ${ordinal(userRow)}`
                  : isDone
                    ? tournament.exit?.text ?? "Run complete"
                    : `Finished ${ordinal(tournament.userSeed ?? userRow)} in the league phase · your road to the final`}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {isLeague && (() => {
              const busy = !!matchdayShow || !!quickShow || tournament.matchday > 8;
              return (
                <div className="flex flex-wrap items-center gap-2">
                  <button className="btn btn-gold btn-pulse" disabled={busy} onClick={startMatchdayShow}>
                    {matchdayShow ? "Playing…" : tournament.matchday > 8 ? "Phase Done" : `▶ Play Matchday ${tournament.matchday}`}
                  </button>
                  <button className="btn btn-secondary" disabled={busy} onClick={quickSimSingle}
                    title="Instantly simulate this matchday and view the result.">
                    ⏩ Quick Sim
                  </button>
                  {tournament.matchday <= 8 && (
                    <button className="btn btn-ghost text-xs" disabled={busy} onClick={() => { setQuickConfirm(true); play("click"); }}
                      title="Instantly simulate every remaining league-phase match.">
                      ⏩ Sim League Phase
                    </button>
                  )}
                </div>
              );
            })()}
            {!isLeague && !isDone && !["final", "sf"].includes(tournament.phase) && (
              <button className="btn btn-gold btn-pulse" disabled={!!transition}
                onClick={() => runCinematic(PHASE_LABEL[tournament.phase], advanceKnockout)}>
                {transition ? "Playing…" : `Play ${PHASE_LABEL[tournament.phase]}`}
              </button>
            )}
            {tournament.phase === "sf" && !isDone && (
              <button className="btn btn-gold btn-pulse" disabled={!!transition || !!live}
                onClick={() => { setSimChoice("Semi-finals"); play("click"); }}>
                {transition || live ? "Playing…" : "Play Semi-finals"}
              </button>
            )}
            {isDone && !saved && (
              <button className="btn btn-gold" onClick={endSeason}>Finish & Lock In</button>
            )}
          </div>
        </div>

        {/* phase progress pips */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {["league", "playoffs", "r16", "qf", "sf", "final"].map((p) => {
            const order = ["league", "playoffs", "r16", "qf", "sf", "final", "done"];
            const active = order.indexOf(tournament.phase) >= order.indexOf(p);
            return (
              <span key={p} className="h-1.5 flex-1 rounded-full transition-colors duration-500"
                style={{ background: active ? "#d4af37" : "rgba(255,255,255,0.1)", boxShadow: active ? "0 0 10px rgba(212,175,55,0.35)" : "none" }} />
            );
          })}
        </div>
      </div>

      {/* CAREER HUB — the campaign at a glance */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="glass rounded-2xl p-3.5">
          <div className="text-[0.55rem] font-bold uppercase tracking-[0.25em] text-muted">{t("tour.record")}</div>
          <div className="mt-1 font-display text-xl font-extrabold">
            <span className="text-green">{record.w}W</span>
            <span className="mx-1 text-white/50">{record.d}D</span>
            <span className="text-danger">{record.l}L</span>
          </div>
          <div className="text-[0.62rem] text-muted">{record.gf} scored · {record.ga} conceded</div>
        </div>
        <div className="glass rounded-2xl p-3.5">
          <div className="text-[0.55rem] font-bold uppercase tracking-[0.25em] text-muted">{t("tour.lastResult")}</div>
          {lastResult ? (() => {
            const isHome = lastResult.home === USER_TEAM_ID;
            const uf = isHome ? lastResult.homeGoals : lastResult.awayGoals;
            const oa = isHome ? lastResult.awayGoals : lastResult.homeGoals;
            const opp = tournament.teams[isHome ? lastResult.away : lastResult.home];
            return (
              <>
                <div className={`mt-1 font-display text-xl font-extrabold ${uf > oa ? "text-green" : uf < oa ? "text-danger" : "text-white/80"}`}>
                  {uf}–{oa}
                </div>
                <div className="flex items-center gap-1.5 text-[0.62rem] text-muted">
                  <TeamBadge colors={opp.colors} code={opp.short} size={14} />
                  <span className="truncate">vs {teamLabel(opp)}</span>
                </div>
              </>
            );
          })() : (
            <div className="mt-1 text-sm text-muted">{t("tour.seasonStarts")}</div>
          )}
        </div>
        <div className="glass rounded-2xl p-3.5">
          <div className="text-[0.55rem] font-bold uppercase tracking-[0.25em] text-muted">{t("tour.nextOpponent")}</div>
          {nextOpp ? (
            <>
              <div className="mt-1 flex items-center gap-2">
                <TeamBadge colors={nextOpp.team.colors} code={nextOpp.team.short} size={22} />
                <span className="truncate font-display text-sm font-extrabold text-white">{teamLabel(nextOpp.team)}</span>
              </div>
              <div className="text-[0.62rem] text-muted">
                {nextOpp.home === null ? "Two legs — or one final night" : nextOpp.home ? "At home" : "Away from home"}
              </div>
              {nextOpp.team.tactic && (() => {
                const ot = tacticById(nextOpp.team.tactic)!;
                const ut = tournament.teams[USER_TEAM_ID].tactic;
                const edge = matchupEdge(ut, nextOpp.team.tactic);
                return (
                  <div className="mt-1.5 text-[0.6rem]">
                    <span className="text-white/45">Likely to play </span>
                    <span className="font-semibold text-white/85">{ot.icon} {ot.name}</span>
                    {ut && (
                      <span className="ml-1 font-bold" style={{ color: edge > 0.3 ? "#7ee081" : edge < -0.3 ? "#f5a15a" : "#cfd6e6" }}>
                        · {edge > 0.3 ? "your style has the edge" : edge < -0.3 ? "a tricky matchup" : "evenly matched"}
                      </span>
                    )}
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="mt-1 text-sm text-muted">{isDone ? t("tour.campaignOver") : t("tour.waitingDraw")}</div>
          )}
        </div>
        <div className="glass flex flex-col justify-between rounded-2xl p-3.5">
          <div className="text-[0.55rem] font-bold uppercase tracking-[0.25em] text-muted">{t("tour.managerDesk")}</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5 text-[0.62rem]">
            <Link className="chip bg-white/8 text-white/80 hover:text-gold" href="/squad" onClick={() => play("click")}>{t("tour.squad")}</Link>
            <Link className="chip bg-white/8 text-white/80 hover:text-gold" href="/history" onClick={() => play("click")}>{t("nav.history")}</Link>
            <Link className="chip bg-white/8 text-white/80 hover:text-gold" href="/stats" onClick={() => play("click")}>{t("tour.trophyCabinet")}</Link>
          </div>
        </div>
      </div>

      {/* FINAL SHOWDOWN — neutral-venue night presentation */}
      {finalShowdown && (
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="cl-panel cl-streaks relative mt-6 overflow-hidden rounded-3xl p-6 text-center"
          >
            <CameraFlashes count={16} />
            <Sparks count={10} color="#d4af37" />
            <div className="cl-heading text-[0.65rem] tracking-[0.45em] text-cyan">Neutral Venue · One Night</div>
            <h2 className="mt-1 font-display text-4xl font-extrabold text-gradient-gold text-shine sm:text-5xl">THE FINAL</h2>
            <div className="mx-auto mt-1 h-px w-40" style={{ background: "linear-gradient(90deg, transparent, #d4af37, transparent)" }} />
            <div className="mx-auto mt-6 grid max-w-2xl grid-cols-[1fr_auto_1fr] items-center gap-3">
              {[tournament.teams[finalShowdown.teamA], tournament.teams[finalShowdown.teamB]].map((team, side) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, x: side === 0 ? -40 : 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + side * 0.15, type: "spring", stiffness: 120, damping: 16 }}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-black/25 p-4"
                  style={{ order: side === 0 ? 0 : 2, ...(team.isUser ? { boxShadow: "0 0 22px rgba(212,175,55,0.35)", border: "1px solid rgba(212,175,55,0.5)" } : {}) }}
                >
                  <TeamBadge colors={team.colors} code={team.short} size={48} />
                  <div className="font-display text-sm font-extrabold text-white">{team.isUser ? team.name : teamLabel(team)}</div>
                  {team.isUser && <span className="chip bg-gold/15 text-gold">Your XI</span>}
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
              The anthem plays, the giant crest unfurls across the centre circle, and ninety minutes stand between you and immortality.
            </p>
            <button className="btn btn-gold btn-pulse mt-5" disabled={!!transition || !!live}
              onClick={() => { setSimChoice("The Final"); play("click"); }}>
              {transition || live ? "Playing…" : "⚽ Kick Off the Final"}
            </button>
          </motion.div>
      )}

      {isLeague ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div>
            <LeagueTable rows={table} tournament={tournament} />
          </div>
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="glass rounded-2xl p-4">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted">Your Fixtures</h3>
              <div className="space-y-2">
                {userFixtures.map((f, i) => (
                  <FixtureRow key={i} fixture={f} onView={(r, t) => setModal({ result: r, title: t })} />
                ))}
                {userFixtures.length === 0 && <p className="text-sm text-muted">Schedule loading…</p>}
              </div>
            </div>
            <GoldenBootRace entries={bootRace.slice(0, 5)} accent="#d4af37" soft="rgba(212,175,55,0.15)" />
            <HeadlinesPanel lines={headlines} accent="#d4af37" />
          </div>
        </div>
      ) : eliminatedInLeague ? (
        <div className="mt-8 space-y-6">
          <div className="glass-strong relative overflow-hidden rounded-2xl p-6 text-center">
            <RainOverlay drops={30} opacity={0.35} />
            <div className="mx-auto w-fit opacity-70" style={{ filter: "grayscale(0.4)" }}>
              <CrestLogo size={56} animated={false} />
            </div>
            <div className="mx-auto mt-3 h-px w-40" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)" }} />
            <h2 className="mt-3 font-display text-2xl font-extrabold text-white/90">The Road Ends Here</h2>
            <p className="mt-1 text-muted">{tournament.exit?.text}</p>
            <p className="mt-1 text-sm text-cyan">Only the top 24 advance — you missed the knockouts.</p>
          </div>
          <LeagueTable rows={table} tournament={tournament} />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {nextTie && !isDone && tournament.phase !== "final" && (
            <MatchPreview
              roundLabel={PHASE_LABEL[tournament.phase] ?? tournament.phase}
              compLabel="Champions Draft"
              a={previewSide(nextTie.teamA === USER_TEAM_ID ? USER_TEAM_ID : nextTie.teamB === USER_TEAM_ID ? USER_TEAM_ID : nextTie.teamA)}
              b={previewSide(nextTie.teamA === USER_TEAM_ID ? nextTie.teamB : nextTie.teamA)}
              accent="#d4af37"
              soft="rgba(212,175,55,0.15)"
            />
          )}
          <KnockoutBracket
            tournament={tournament}
            onTieClick={(tie: KOTie) => {
              const r = tie.leg2 ?? tie.leg1;
              if (r) setModal({ result: r, title: `${tie.round}${tie.leg2 ? " · 2nd Leg" : ""}` });
            }}
          />
          {tournament.phase === "playoffs" && (tournament.userSeed ?? 99) <= 8 && (
            <p className="text-center text-sm text-green">
              ★ Top-8 finish — you qualify directly for the Round of 16. Simulate the play-offs to learn your opponent.
            </p>
          )}
          {nextTie && !isDone && tournament.phase !== "final" && (
            <p className="text-center text-sm text-muted">
              Next: <span className="text-gold">{PHASE_LABEL[tournament.phase]}</span> — win or your run ends here.
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <GoldenBootRace entries={bootRace} accent="#d4af37" soft="rgba(212,175,55,0.15)" />
            <HeadlinesPanel lines={headlines} accent="#d4af37" />
          </div>
          <details className="glass rounded-2xl p-4">
            <summary className="cursor-pointer text-sm font-bold uppercase tracking-widest text-muted">
              Final League Table
            </summary>
            <div className="mt-3"><LeagueTable rows={table} tournament={tournament} /></div>
          </details>
        </div>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <button
          className="btn btn-ghost text-xs"
          onClick={() => { resetDraft(); play("click"); router.push("/draft"); }}
        >
          {t("tour.newDraft")}
        </button>
        {saved && <button className="btn btn-ghost text-xs" onClick={() => router.push("/stats")}>{t("tour.viewProfile")}</button>}
      </div>

      <AnimatePresence>
        {modal && (
          <MatchModal result={modal.result} teams={tournament.teams} title={modal.title} onClose={() => setModal(null)} />
        )}
      </AnimatePresence>

      {/* cinematic stage intro between knockout rounds — escalates to the Final */}
      <RoundTransition
        show={!!transition}
        title={transition?.title ?? ""}
        subtitle={transition?.subtitle}
        variant="cl"
        stage={tournament.phase === "sf" ? "sf" : tournament.phase === "final" ? "final" : tournament.phase === "qf" ? "qf" : "r16"}
        stadium={knockoutVenue(hashString(`${tournament.phase}-${tournament.matchday}-${USER_TEAM_ID}`))}
        teams={(() => {
          const tie = tournament.ties.find(
            (k) => !k.winner && (k.teamA === USER_TEAM_ID || k.teamB === USER_TEAM_ID),
          );
          if (!tie) return null;
          const user = tournament.teams[USER_TEAM_ID];
          const opp = tournament.teams[tie.teamA === USER_TEAM_ID ? tie.teamB : tie.teamA];
          return {
            a: { name: user.name, short: user.short, colors: user.colors },
            b: { name: teamLabel(opp), short: opp.short, colors: opp.colors },
          };
        })()}
        detail="Simulating the round — you have a bye"
        accent="#d4af37"
        duration={tournament.phase === "final" ? 5200 : tournament.phase === "sf" ? 4400 : tournament.phase === "qf" ? 4200 : 3400}
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
            <Fireworks count={7} palette={["#00f0ff", "#7dfaff", "#c8d2e0", "#ffffff"]} />
            <CameraFlashes count={18} />
            <motion.div
              initial={{ scale: 0.7, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 1.05, opacity: 0 }}
              transition={{ type: "spring", stiffness: 170, damping: 15 }}
              className="relative z-10 text-center"
            >
              <div className="text-6xl" style={{ filter: "drop-shadow(0 0 30px rgba(212,175,55,0.5))" }}>🎆</div>
              <div className="cl-heading mt-2 text-[0.65rem] tracking-[0.4em] text-cyan">Champions Draft</div>
              <div className="mt-1 font-display text-3xl font-extrabold text-gradient-cyan sm:text-5xl">{burst}</div>
              <div className="mt-2 text-sm text-white/70">{tournament.teams[USER_TEAM_ID].name}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHOOSE SIMULATION STYLE — semi-finals and the final */}
      <AnimatePresence>
        {simChoice && (
          <SimStyleChoice
            title={`Champions Draft · ${simChoice}`}
            onLive={() => startLive(simChoice)}
            onQuick={() => { setSimChoice(null); runCinematic(simChoice, advanceKnockout); }}
            onCancel={() => { setSimChoice(null); play("click"); }}
          />
        )}
      </AnimatePresence>

      {/* MATCHDAY BROADCAST — the league night results show */}
      <AnimatePresence>
        {matchdayShow && (
          <MatchdayLive
            comp="cl"
            compName="Champions Draft"
            title={matchdayShow.title}
            fixtures={matchdayShow.fixtures}
            baseTable={matchdayShow.baseTable}
            zones={{ direct: 8, secondary: 24 }}
            onDone={onMatchdayDone}
          />
        )}
      </AnimatePresence>

      {/* QUICK SIM — compact result / phase recap */}
      <AnimatePresence>
        {quickShow && (
          <QuickSim
            title={`Champions Draft · ${quickShow.title}`}
            accent="#00f0ff" emblem="🏆"
            data={quickShow.data}
            onDone={onQuickDone}
            onViewMatch={(r) => setModal({ result: r, title: "Match statistics" })}
          />
        )}
      </AnimatePresence>

      {/* QUICK SIM LEAGUE PHASE — confirmation */}
      <AnimatePresence>
        {quickConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] flex items-end justify-center p-4 sm:items-center"
            style={{ background: "rgba(2,7,20,0.82)" }}
            onClick={() => setQuickConfirm(false)} role="dialog" aria-modal="true" aria-label="Quick Sim league phase"
          >
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="glass w-full max-w-md rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <span aria-hidden className="text-xl">⏩</span>
                <h3 className="font-display text-lg font-extrabold text-white">Quick Sim the remaining league phase?</h3>
              </div>
              <p className="mt-1.5 text-[0.78rem] leading-relaxed text-white/65">
                This instantly simulates your remaining matches and updates the table. You&apos;ll still be able to review every result afterward.
              </p>
              <button onClick={() => { setQuickStopEarly((v) => !v); play("click"); }} aria-pressed={quickStopEarly}
                className="mt-3 flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors"
                style={{ borderColor: quickStopEarly ? "#00f0ff" : "rgba(255,255,255,0.12)", background: quickStopEarly ? "rgba(0,240,255,0.12)" : "transparent" }}>
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md border" style={{ borderColor: "#00f0ff", background: quickStopEarly ? "#00f0ff" : "transparent" }}>
                  {quickStopEarly && <span className="text-[0.6rem] font-black text-[#04101f]">✓</span>}
                </span>
                <span className="text-[0.74rem] font-semibold text-white/85">Stop if qualification or elimination is confirmed</span>
              </button>
              <div className="mt-5 flex gap-2.5">
                <button className="btn btn-ghost flex-1" onClick={() => { setQuickConfirm(false); play("click"); }}>Cancel</button>
                <button className="btn btn-gold flex-1" onClick={quickSimPhase}>⏩ Quick Sim Remaining</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIVE MATCH — minute-by-minute broadcast of the user's tie */}
      <AnimatePresence>
        {live && (
          <LiveMatch
            legs={live.legs}
            homeOf={(r) => tournament.teams[r.home]}
            awayOf={(r) => tournament.teams[r.away]}
            title={live.title}
            subtitle="Champions Draft"
            variant="cl"
            onDone={onLiveDone}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDone && !saved && !modal && !live && (
          <TrophyCelebration
            tournament={tournament}
            teamName={tournament.teams[USER_TEAM_ID].name}
            tie={lastTie}
            onViewStats={(leg) => setModal({ result: leg, title: "Match statistics" })}
            onContinue={endSeason}
          />
        )}
      </AnimatePresence>

      {saved && lastUnlocked.length > 0 && <AchievementToast ids={lastUnlocked} />}
    </div>
  );
}

function FixtureRow({ fixture, onView }: { fixture: Fixture; onView: (r: MatchResult, title: string) => void }) {
  const tournament = useGame((s) => s.tournament)!;
  const isHome = fixture.home === USER_TEAM_ID;
  const oppId = isHome ? fixture.away : fixture.home;
  const opp = tournament.teams[oppId];
  const r = fixture.result;
  let outcome = "";
  let color = "text-muted";
  if (r) {
    const uf = isHome ? r.homeGoals : r.awayGoals;
    const oa = isHome ? r.awayGoals : r.homeGoals;
    outcome = `${uf}-${oa}`;
    color = uf > oa ? "text-green" : uf < oa ? "text-danger" : "text-white/70";
  }
  return (
    <button
      disabled={!r}
      onClick={() => r && onView(r, `Matchday ${fixture.matchday}`)}
      className="flex w-full items-center justify-between rounded-lg bg-white/4 px-2.5 py-1.5 text-left transition-colors hover:bg-white/8 disabled:opacity-60"
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="text-[0.6rem] text-muted">{isHome ? "H" : "A"}</span>
        <span className="h-3.5 w-3.5 shrink-0 rounded" style={{ background: `linear-gradient(150deg, ${opp.colors[0]}, ${opp.colors[1]})` }} />
        <span className="truncate text-xs font-semibold">{teamLabel(opp)}</span>
      </div>
      <span className={`font-display text-sm font-bold ${color}`}>{outcome || "–"}</span>
    </button>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/* ================================================================== */
/*  Career Hub — what /tournament shows when no CL campaign is live.   */
/*  Trophy cabinet, past campaigns, and the doors into a new one.      */
/* ================================================================== */

const RESULT_LABEL: Record<string, string> = {
  champion: "🏆 Champions", final: "🥈 Runners-up", third: "🥉 Third place",
  semi: "Semi-finals", quarter: "Quarter-finals", r16: "Round of 16",
  playoff: "Play-offs", league: "League phase", groups: "Group stage",
};

function CareerHub({ profile, intlActive }: { profile: ReturnType<typeof useGame.getState>["profile"]; intlActive: boolean }) {
  const t = useT();
  const campaigns = [
    ...profile.drafts.map((d) => ({
      key: `cl-${d.id}`, comp: "Champions League", accent: "#00f0ff",
      name: `${d.formation} · ${d.overall} OVR`, result: d.result ?? "league", date: d.date,
    })),
    ...(profile.intlResults ?? []).map((r, i) => ({
      key: `intl-${i}-${r.date}`, comp: r.comp === "euro" ? "UEFA EURO" : "Copa América",
      accent: r.comp === "euro" ? "#ff3b57" : "#00e676",
      name: `${r.nation} ${r.year}`, result: r.result, date: r.date,
    })),
  ].sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const clTitles = profile.drafts.filter((d) => d.result === "champion").length;
  const euroTitles = (profile.intlResults ?? []).filter((r) => r.comp === "euro" && r.result === "champion").length;
  const copaTitles = (profile.intlResults ?? []).filter((r) => r.comp === "copa" && r.result === "champion").length;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-24 sm:pt-28">
      <div className="cl-panel cl-streaks shine relative overflow-hidden rounded-3xl p-6">
        <Sparks count={8} color="#d4af37" />
        <div className="cl-heading text-[0.6rem] tracking-[0.4em] text-cyan">{t("tour.careerHub")}</div>
        <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">
          {t("tour.noCampaign")}
        </h1>
        <p className="mt-2 max-w-lg text-sm text-muted">{t("tour.noCampaignBody")}</p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link href="/draft" className="btn btn-cyan btn-pulse" onClick={() => play("select")}>{t("tour.startNewDraft")}</Link>
          <Link href="/international" className="btn btn-ghost" onClick={() => play("click")}>{t("home.leadNation")}</Link>
        </div>
      </div>

      {intlActive && (
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          className="euro-panel euro-grid shine mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4"
        >
          <div>
            <div className="cl-heading text-[0.58rem] tracking-[0.3em] text-cyan">{t("tour.activeCampaign")}</div>
            <div className="font-display font-extrabold text-white">{t("tour.intlInProgress")}</div>
          </div>
          <Link href="/international" className="btn btn-cyan text-xs" onClick={() => play("select")}>{t("common.continue")}</Link>
        </motion.div>
      )}

      {/* trophy cabinet */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "Champions League", n: clTitles, accent: "#00f0ff" },
          { label: "UEFA EURO", n: euroTitles, accent: "#ff3b57" },
          { label: "Copa América", n: copaTitles, accent: "#00e676" },
        ].map((t) => (
          <div key={t.label} className="glass rounded-2xl p-4 text-center">
            <div className="text-2xl" aria-hidden style={{ filter: t.n ? "none" : "grayscale(1) opacity(0.4)" }}>🏆</div>
            <div className="mt-1 font-display text-2xl font-extrabold" style={{ color: t.n ? t.accent : "rgba(255,255,255,0.35)" }}>{t.n}</div>
            <div className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-muted">{t.label}</div>
          </div>
        ))}
      </div>

      {/* past campaigns */}
      <div className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted">{t("tour.pastCampaigns")}</h2>
        {campaigns.length === 0 ? (
          <div className="glass mt-3 rounded-2xl border-dashed p-6 text-center text-sm text-muted">
            {t("tour.pastEmpty")}
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {campaigns.slice(0, 8).map((c) => (
              <div key={c.key} className="glass flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="h-5 w-1 shrink-0 rounded-full" style={{ background: c.accent }} />
                  <div className="min-w-0">
                    <div className="truncate font-display text-sm font-extrabold text-white">{c.name}</div>
                    <div className="text-[0.6rem] uppercase tracking-wider" style={{ color: c.accent }}>{c.comp}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-extrabold ${c.result === "champion" ? "text-gold" : "text-white/75"}`}>
                    {RESULT_LABEL[c.result] ?? c.result}
                  </div>
                  <div className="text-[0.58rem] text-white/40">
                    {new Date(c.date).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
