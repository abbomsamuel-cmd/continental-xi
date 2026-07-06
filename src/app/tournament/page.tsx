"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { LeagueTable } from "@/components/LeagueTable";
import { MatchModal } from "@/components/MatchModal";
import { KnockoutBracket } from "@/components/KnockoutBracket";
import { TrophyCelebration } from "@/components/TrophyCelebration";
import { AchievementToast } from "@/components/AchievementToast";
import { USER_TEAM_ID } from "@/lib/engine/tournament";
import type { Fixture, KOTie, MatchResult } from "@/lib/types";
import { play } from "@/lib/sound";

const PHASE_LABEL: Record<string, string> = {
  league: "League Phase", playoffs: "Knockout Play-offs", r16: "Round of 16",
  qf: "Quarter-finals", sf: "Semi-finals", final: "Final", done: "Complete",
};

export default function TournamentPage() {
  const router = useRouter();
  const tournament = useGame((s) => s.tournament);
  const advanceLeague = useGame((s) => s.advanceLeague);
  const advanceKnockout = useGame((s) => s.advanceKnockout);
  const getTable = useGame((s) => s.getTable);
  const recordResult = useGame((s) => s.recordResult);
  const resetDraft = useGame((s) => s.resetDraft);
  const lastUnlocked = useGame((s) => s.lastUnlocked);

  const [modal, setModal] = useState<{ result: MatchResult; title?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!tournament) router.replace("/draft");
  }, [tournament, router]);

  if (!tournament) return null;

  const table = getTable();
  const userRow = table.findIndex((r) => r.teamId === USER_TEAM_ID) + 1;
  const isLeague = tournament.phase === "league";
  const isDone = tournament.phase === "done";
  const userFixtures = tournament.fixtures.filter(
    (f) => (f.home === USER_TEAM_ID || f.away === USER_TEAM_ID),
  );

  const playLeague = () => {
    setBusy(true);
    play("whistle");
    setTimeout(() => {
      advanceLeague();
      setBusy(false);
    }, 450);
  };

  const playKO = () => {
    setBusy(true);
    play("whistle");
    setTimeout(() => {
      advanceKnockout();
      setBusy(false);
    }, 450);
  };

  const finishAndSave = () => {
    recordResult();
    setSaved(true);
    setCelebrated(true);
  };

  const nextTie = tournament.ties.find((t) => !t.winner);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-24 sm:pt-28">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-cyan">{PHASE_LABEL[tournament.phase]}</div>
          <h1 className="font-display text-2xl font-extrabold sm:text-4xl">
            {tournament.teams[USER_TEAM_ID].name}
          </h1>
          <div className="text-sm text-muted">
            {isLeague
              ? `Matchday ${Math.min(tournament.matchday, 8)} of 8 · Currently ${ordinal(userRow)}`
              : tournament.userAlive
                ? "Still alive in the knockouts"
                : "Eliminated — following the run to the final"}
          </div>
        </div>
        <div className="flex gap-2">
          {isLeague && (
            <button className="btn btn-gold" disabled={busy || tournament.matchday > 8} onClick={playLeague}>
              {busy ? "Playing…" : tournament.matchday > 8 ? "Phase Done" : `Play Matchday ${tournament.matchday}`}
            </button>
          )}
          {!isLeague && !isDone && (
            <button className="btn btn-gold" disabled={busy} onClick={playKO}>
              {busy ? "Playing…" : `Play ${PHASE_LABEL[tournament.phase]}`}
            </button>
          )}
          {isDone && !saved && (
            <button className="btn btn-gold" onClick={finishAndSave}>Finish & Save</button>
          )}
        </div>
      </div>

      {/* phase progress pips */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {["league", "playoffs", "r16", "qf", "sf", "final"].map((p) => {
          const order = ["league", "playoffs", "r16", "qf", "sf", "final", "done"];
          const active = order.indexOf(tournament.phase) >= order.indexOf(p);
          return (
            <span key={p} className={`h-1.5 flex-1 rounded-full ${active ? "bg-gold" : "bg-white/10"}`} />
          );
        })}
      </div>

      {isLeague ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div>
            <LeagueTable rows={table} tournament={tournament} />
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="glass rounded-2xl p-4">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted">Your Fixtures</h3>
              <div className="space-y-2">
                {userFixtures.map((f, i) => (
                  <FixtureRow key={i} fixture={f} onView={(r, t) => setModal({ result: r, title: t })} />
                ))}
                {userFixtures.length === 0 && <p className="text-sm text-muted">Schedule loading…</p>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="glass rounded-2xl p-4">
            <KnockoutBracket
              tournament={tournament}
              onTieClick={(tie: KOTie) => {
                const r = tie.leg2 ?? tie.leg1;
                if (r) setModal({ result: r, title: `${tie.round} · ${tie.leg2 ? "2nd Leg" : ""}` });
              }}
            />
          </div>
          {nextTie && (tournament.phase !== "done") && (
            <p className="text-center text-sm text-muted">
              Next: <span className="text-gold">{PHASE_LABEL[tournament.phase]}</span> — press play to simulate the round.
            </p>
          )}
          {/* keep table visible in knockouts too */}
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
          New Draft
        </button>
        {saved && <button className="btn btn-ghost text-xs" onClick={() => router.push("/stats")}>View Profile</button>}
      </div>

      <AnimatePresence>
        {modal && (
          <MatchModal result={modal.result} tournament={tournament} title={modal.title} onClose={() => setModal(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDone && !celebrated && (
          <TrophyCelebration
            tournament={tournament}
            teamName={tournament.teams[USER_TEAM_ID].name}
            onContinue={finishAndSave}
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
      className="flex w-full items-center justify-between rounded-lg bg-white/4 px-2.5 py-1.5 text-left disabled:opacity-60"
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="text-[0.6rem] text-muted">{isHome ? "H" : "A"}</span>
        <span className="h-3.5 w-3.5 shrink-0 rounded" style={{ background: `linear-gradient(150deg, ${opp.colors[0]}, ${opp.colors[1]})` }} />
        <span className="truncate text-xs font-semibold">{opp.name}</span>
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
