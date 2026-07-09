"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import {
  COMP_SQUADS, groupTable, squadKey, type IntlComp, type IntlState,
} from "@/lib/engine/international";
import type { KOTie, MatchResult, RawSquad, TableRow } from "@/lib/types";
import { MatchModal } from "@/components/MatchModal";
import { TeamBadge } from "@/components/TeamBadge";
import { CrestLogo } from "@/components/CrestLogo";
import { play } from "@/lib/sound";

// ---- per-competition identity ----
const THEMES: Record<IntlComp, {
  title: string; sub: string; emoji: string; accent: string; soft: string;
  panel: string; blurb: string; champs: string;
}> = {
  euro: {
    title: "UEFA EURO", sub: "European Championship", emoji: "🏆",
    accent: "#8fd0ff", soft: "rgba(143,208,255,0.16)",
    panel: "radial-gradient(120% 90% at 50% -20%, rgba(80,140,255,0.30), transparent 60%), linear-gradient(180deg,#0a1f6e 0%,#071343 60%,#050d2e 100%)",
    blurb: "Sixteen historic national sides. Four groups. One summer of silver.",
    champs: "Spain · France · Germany · Italy · Portugal · Netherlands · Denmark · Greece",
  },
  copa: {
    title: "Copa América", sub: "CONMEBOL", emoji: "🏆",
    accent: "#ffd76b", soft: "rgba(255,215,107,0.16)",
    panel: "radial-gradient(120% 90% at 50% -20%, rgba(46,180,120,0.30), transparent 60%), linear-gradient(180deg,#0b3a24 0%,#072716 60%,#04140b 100%)",
    blurb: "Twelve legendary selecciones. Three groups. The oldest prize in football.",
    champs: "Argentina · Brazil · Uruguay · Chile · Colombia · Bolivia",
  },
};

function squadRating(sq: RawSquad): number {
  const sorted = [...sq.players].sort((a, b) => b[3] - a[3]);
  const xi = sorted.slice(0, 11);
  return Math.round(xi.reduce((s, p) => s + p[3], 0) / Math.max(1, xi.length));
}

function shortCode(name: string): string {
  const words = name.split(/\s+/);
  if (words.length === 1) return name.slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}

const label = (intl: IntlState, key: string) => {
  const t = intl.teams[key];
  return t ? `${t.name} ${t.season ?? ""}`.trim() : key;
};

export default function InternationalPage() {
  const router = useRouter();
  const intl = useGame((s) => s.intl);
  const startIntl = useGame((s) => s.startIntl);
  const advanceGroups = useGame((s) => s.advanceIntlGroups);
  const advanceKO = useGame((s) => s.advanceIntlKO);
  const endIntl = useGame((s) => s.endIntl);
  const setPendingPool = useGame((s) => s.setPendingPool);
  const resetDraft = useGame((s) => s.resetDraft);

  const [selecting, setSelecting] = useState<IntlComp | null>(null);
  const [modal, setModal] = useState<{ result: MatchResult; title?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [dismissedEnd, setDismissedEnd] = useState(false);
  // synchronous double-click guard — React state alone races (two fast clicks
  // both see busy=false and would advance two rounds at once)
  const busyRef = useRef(false);

  // ---------- LOBBY ----------
  if (!intl && !selecting) {
    return (
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:pt-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-display text-3xl font-extrabold sm:text-5xl">
            International <span className="text-gradient-gold">Tournaments</span>
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
            return (
              <motion.div
                key={comp}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                whileHover={{ y: -6 }}
                className="cl-streaks relative overflow-hidden rounded-3xl p-7 text-left"
                style={{ background: t.panel, border: `1px solid ${t.soft}` }}
              >
                {/* trophy with glow rings */}
                <div className="relative w-fit">
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
                <div className="mt-3 cl-heading text-[0.6rem] tracking-[0.35em]" style={{ color: t.accent }}>{t.sub}</div>
                <h2 className="mt-1 font-display text-3xl font-extrabold text-white">{t.title}</h2>
                <p className="mt-2 text-sm text-white/70">{t.blurb}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-[0.62rem]">
                  <span className="chip" style={{ background: t.soft, color: t.accent }}>{COMP_SQUADS[comp].length} historic squads</span>
                  <span className="chip bg-white/8 text-white/70">{editions} editions</span>
                </div>
                <p className="mt-3 text-[0.6rem] uppercase tracking-widest text-white/40">Past champions · {t.champs}</p>
                <div className="mt-5 flex flex-wrap gap-2">
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
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 0.4 }}
          className="glass mx-auto mt-5 flex max-w-md items-center justify-center gap-3 rounded-2xl p-4 text-sm text-muted"
        >
          🔒 FIFA World Cup — future competition
        </motion.div>
      </div>
    );
  }

  // ---------- NATION SELECT ----------
  if (!intl && selecting) {
    const t = THEMES[selecting];
    const squads = [...COMP_SQUADS[selecting]].sort((a, b) => squadRating(b) - squadRating(a));
    return (
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-24 sm:pt-28">
        <div className="flex items-center justify-between">
          <div>
            <div className="cl-heading text-[0.6rem] tracking-[0.35em]" style={{ color: t.accent }}>{t.title}</div>
            <h1 className="font-display text-3xl font-extrabold">Choose Your Nation</h1>
            <p className="mt-1 text-sm text-muted">Pick the squad you will lead — other nations draw a random vintage.</p>
          </div>
          <button className="btn btn-ghost text-xs" onClick={() => { setSelecting(null); play("click"); }}>← Back</button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {squads.map((sq, i) => (
            <motion.button
              key={squadKey(sq)}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.04 }}
              whileHover={{ y: -4 }}
              onClick={() => { startIntl(selecting, squadKey(sq)); setSelecting(null); setDismissedEnd(false); }}
              className="rounded-2xl p-4 text-left"
              style={{ background: t.panel, border: `1px solid ${t.soft}` }}
            >
              <div className="flex items-center justify-between">
                <TeamBadge colors={sq.colors} code={shortCode(sq.club)} size={38} />
                <span className="font-display text-xl font-extrabold" style={{ color: t.accent }}>{squadRating(sq)}</span>
              </div>
              <div className="mt-2 font-display text-sm font-extrabold text-white">{sq.club} {sq.season}</div>
              <div className="mt-0.5 line-clamp-1 text-[0.62rem] text-white/60">{sq.honor}</div>
              <div className="mt-1 text-[0.6rem] text-white/40">{sq.coach}</div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  if (!intl) return null;
  const t = THEMES[intl.comp];
  const isDone = intl.phase === "done";
  const userLabel = label(intl, intl.userKey);

  const clickPlay = (fn: () => void) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    play("whistle");
    setTimeout(() => { fn(); busyRef.current = false; setBusy(false); }, 420);
  };

  const userFixtures = intl.fixtures.filter((f) => f.home === intl.userKey || f.away === intl.userKey);
  const userTies = intl.ties.filter((k) => k.teamA === intl.userKey || k.teamB === intl.userKey);
  const lastUserMatch = (() => {
    const tie = userTies[userTies.length - 1];
    if (tie?.leg1) return tie.leg1;
    const played = userFixtures.filter((f) => f.result);
    return played[played.length - 1]?.result;
  })();

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-24 sm:pt-28">
      {/* themed header */}
      <div className="cl-streaks relative overflow-hidden rounded-3xl p-5" style={{ background: t.panel, border: `1px solid ${t.soft}` }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CrestLogo size={40} />
            <div>
              <div className="cl-heading text-[0.6rem] tracking-[0.35em]" style={{ color: t.accent }}>{t.title}</div>
              <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{userLabel}</h1>
              <div className="text-xs text-white/60">
                {intl.phase === "groups" ? `Group stage · Matchday ${Math.min(intl.matchday, 3)} of 3`
                  : isDone ? intl.exit?.text
                  : intl.phase === "qf" ? "Quarter-finals" : intl.phase === "sf" ? "Semi-finals" : "The Final"}
              </div>
            </div>
          </div>
          <div>
            {intl.phase === "groups" && (
              <button className="btn btn-gold" disabled={busy} onClick={() => clickPlay(advanceGroups)}>
                {busy ? "Playing…" : `Play Matchday ${Math.min(intl.matchday, 3)}`}
              </button>
            )}
            {["qf", "sf", "final"].includes(intl.phase) && (
              <button className="btn btn-gold" disabled={busy} onClick={() => clickPlay(advanceKO)}>
                {busy ? "Playing…" : intl.phase === "qf" ? "Play Quarter-finals" : intl.phase === "sf" ? "Play Semi-finals" : "Play the Final"}
              </button>
            )}
            {isDone && dismissedEnd && (
              <button className="btn btn-gold" onClick={() => { endIntl(); play("click"); }}>Finish & Save</button>
            )}
          </div>
        </div>
      </div>

      {/* GROUP STAGE */}
      {(intl.phase === "groups" || isDone) && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {intl.groups.map((_, gi) => (
            <GroupCard key={gi} intl={intl} gi={gi} accent={t.accent} soft={t.soft} panel={t.panel} />
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
                <button key={i} disabled={!r}
                  onClick={() => r && setModal({ result: r, title: `Group stage · MD ${f.matchday}` })}
                  className="flex items-center justify-between rounded-lg bg-white/4 px-2.5 py-2 text-left disabled:opacity-60">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <TeamBadge colors={opp.colors} code={opp.short} size={18} />
                    <span className="truncate text-xs font-semibold">{opp.name} {opp.season}</span>
                  </span>
                  <span className={`font-display text-sm font-bold ${color}`}>{r ? `${uf}-${oa}` : `MD${f.matchday}`}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* KNOCKOUT BRACKET */}
      {intl.ties.length > 0 && (
        <IntlBracket intl={intl} accent={t.accent} soft={t.soft} panel={t.panel}
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

      {/* END OVERLAY */}
      <AnimatePresence>
        {isDone && !dismissedEnd && !modal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto p-4"
            style={{ background: `radial-gradient(130% 90% at 50% 25%, ${intl.champion === intl.userKey ? "#3d2f05" : "#0a1330"}, #030b22 72%)` }}
          >
            <div className="relative z-10 w-full max-w-md text-center">
              <motion.div
                initial={{ scale: 0, rotate: -25 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 110, damping: 11, delay: 0.15 }}
                className="text-[7.5rem] leading-none"
                style={{ filter: `drop-shadow(0 0 45px ${intl.champion === intl.userKey ? "rgba(212,175,55,0.6)" : t.soft})` }}
              >
                {intl.champion === intl.userKey ? "🏆" : intl.exit?.stage === "Final" ? "🥈" : "🌍"}
              </motion.div>
              <div className="cl-heading mt-2 text-[0.65rem] tracking-[0.4em]" style={{ color: t.accent }}>{t.title}</div>
              <h1 className="mt-1 font-display text-4xl font-extrabold">
                {intl.champion === intl.userKey
                  ? <span className="text-gradient-gold">{intl.exit?.text}</span>
                  : <span className="text-white/90">{intl.exit?.text}</span>}
              </h1>
              <p className="mt-2 text-sm text-muted">{userLabel}</p>
              {lastUserMatch && (
                <button
                  className="mt-5 rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider"
                  style={{ borderColor: t.soft, color: t.accent }}
                  onClick={() => { setDismissedEnd(true); setModal({ result: lastUserMatch, title: "Your final match" }); }}
                >
                  View final match stats
                </button>
              )}
              <div className="mt-6 flex justify-center gap-3">
                <button className="btn btn-ghost text-xs" onClick={() => setDismissedEnd(true)}>View bracket</button>
                <button className="btn btn-gold" onClick={() => { endIntl(); play("click"); }}>
                  {intl.champion === intl.userKey ? "Lift the Trophy" : "Save & Return"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- group table card ----
function GroupCard({ intl, gi, accent, soft, panel }: { intl: IntlState; gi: number; accent: string; soft: string; panel: string }) {
  const rows: TableRow[] = groupTable(intl, gi);
  const qualifyCut = 2;
  return (
    <div className="overflow-hidden rounded-2xl" style={{ background: panel, border: `1px solid ${soft}` }}>
      <div className="cl-heading px-3 pt-2.5 text-[0.6rem] tracking-[0.3em]" style={{ color: accent }}>
        Group {String.fromCharCode(65 + gi)}
      </div>
      <div className="grid grid-cols-[24px_1fr_repeat(3,30px)_34px] items-center gap-1 px-3 py-1 text-[0.55rem] font-bold uppercase tracking-wider text-white/40">
        <span>#</span><span>Team</span><span className="text-center">P</span><span className="text-center">GD</span><span className="text-center">GF</span><span className="text-center text-gold">Pts</span>
      </div>
      {rows.map((r, i) => {
        const team = intl.teams[r.teamId];
        const isUser = r.teamId === intl.userKey;
        return (
          <div key={r.teamId}
            className={`grid grid-cols-[24px_1fr_repeat(3,30px)_34px] items-center gap-1 border-t border-white/5 px-3 py-1.5 text-xs ${isUser ? "bg-gold/15" : ""}`}>
            <span className={`font-bold ${i < qualifyCut ? "text-green" : "text-white/50"}`}>{i + 1}</span>
            <span className="flex min-w-0 items-center gap-1.5">
              <TeamBadge colors={team.colors} code={team.short} size={18} />
              <span className={`truncate font-semibold ${isUser ? "text-gold" : "text-white/90"}`}>{team.name} {team.season}</span>
            </span>
            <span className="text-center text-white/70">{r.played}</span>
            <span className="text-center text-white/70">{r.gf - r.ga > 0 ? "+" : ""}{r.gf - r.ga}</span>
            <span className="text-center text-white/70">{r.gf}</span>
            <span className="text-center font-display font-extrabold text-gold">{r.points}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---- compact two-sided 8-team bracket (single-leg ties) ----
function IntlBracket({ intl, accent, soft, panel, onTieClick }: {
  intl: IntlState; accent: string; soft: string; panel: string; onTieClick: (tie: KOTie) => void;
}) {
  const by = (r: KOTie["round"]) => intl.ties.filter((k) => k.round === r);
  const qf = by("Quarter-final"); const sf = by("Semi-final"); const fin = by("Final")[0] ?? null;
  const pad = (arr: KOTie[], n: number) => { const o: (KOTie | null)[] = [...arr]; while (o.length < n) o.push(null); return o; };
  const QF = pad(qf, 4); const SF = pad(sf, 2);

  const cell = (tie: KOTie | null, key: string) => tie ? (
    <button key={key} disabled={!tie.leg1} onClick={() => onTieClick(tie)}
      className={`w-full overflow-hidden rounded-lg text-left ${tie.teamA === intl.userKey || tie.teamB === intl.userKey ? "ring-1 ring-gold" : ""} ${tie.leg1 ? "hover:brightness-125" : ""}`}
      style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${soft}` }}>
      {[tie.teamA, tie.teamB].map((id) => {
        const team = intl.teams[id];
        const goals = tie.leg1 ? (id === tie.teamA ? tie.leg1.homeGoals : tie.leg1.awayGoals) : null;
        const won = tie.winner === id;
        return (
          <div key={id} className={`flex items-center justify-between gap-1 px-1.5 py-1 ${won ? "text-gold" : tie.winner ? "text-white/45" : "text-white/90"}`}>
            <span className="flex min-w-0 items-center gap-1">
              <TeamBadge colors={team.colors} code={team.short} size={15} />
              <span className="truncate text-[0.58rem] font-bold">{team.name} {team.season}</span>
            </span>
            <span className="font-display text-[0.68rem] font-extrabold">{goals ?? ""}</span>
          </div>
        );
      })}
      {tie.leg1?.penalties && (
        <div className="bg-black/40 px-1.5 py-[1px] text-center text-[0.48rem] font-bold text-gold">
          pens {tie.leg1.penalties[0]}-{tie.leg1.penalties[1]}
        </div>
      )}
    </button>
  ) : (
    <div key={key} className="grid h-[42px] w-full place-items-center rounded-lg border border-dashed border-white/20 text-white/25"
      style={{ background: "rgba(0,0,0,0.2)" }}>🛡️</div>
  );

  const championName = intl.champion ? `${intl.teams[intl.champion].name} ${intl.teams[intl.champion].season}` : null;

  return (
    <div className="cl-streaks mt-6 overflow-hidden rounded-3xl p-4" style={{ background: panel, border: `1px solid ${soft}` }}>
      <div className="mb-3 text-center cl-heading text-xs tracking-[0.35em]" style={{ color: accent }}>Knockout Stage</div>
      <div className="overflow-x-auto pb-1">
        <div className="mx-auto grid min-w-[720px] max-w-[980px] grid-cols-5 gap-2" style={{ minHeight: 240 }}>
          <div className="flex flex-col justify-around gap-2">{[QF[0], QF[1]].map((k, i) => cell(k, `ql${i}`))}</div>
          <div className="flex flex-col justify-around gap-2">{[SF[0]].map((k, i) => cell(k, `sl${i}`))}</div>
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="text-4xl" style={{ filter: `drop-shadow(0 0 18px ${soft})` }}>🏆</div>
            <span className="cl-heading text-[0.55rem] tracking-[0.3em] text-gold">Final</span>
            {cell(fin, "final")}
            {championName && (
              <div className="text-center">
                <div className="text-[0.5rem] uppercase tracking-[0.25em] text-white/40">Champions</div>
                <div className="text-[0.7rem] font-extrabold text-gradient-gold">{championName}</div>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-around gap-2">{[SF[1]].map((k, i) => cell(k, `sr${i}`))}</div>
          <div className="flex flex-col justify-around gap-2">{[QF[2], QF[3]].map((k, i) => cell(k, `qr${i}`))}</div>
        </div>
      </div>
    </div>
  );
}
