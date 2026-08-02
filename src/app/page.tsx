"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { CameraFlashes } from "@/components/fx/Atmosphere";
import { TeamBadge } from "@/components/TeamBadge";
import { ReportBug } from "@/components/ReportBug";
import { useGame } from "@/lib/store";
import { useCurrentPlayer } from "@/lib/career/store";
import { useHydrated } from "@/lib/useHydrated";
import { useT } from "@/lib/i18n";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { play } from "@/lib/sound";
import { getAllPlayers, SQUADS } from "@/lib/players";
import { USER_TEAM_ID, teamLabel } from "@/lib/engine/tournament";

/* ------------------------------------------------------------------ */
/*  Stadium scene behind the hub — tiered stands, floodlight pylons.    */
/* ------------------------------------------------------------------ */
function StadiumScene() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh] overflow-hidden" aria-hidden>
      <div className="aurora absolute -left-1/4 top-0 h-2/3 w-2/3 rounded-full opacity-40"
        style={{ background: "radial-gradient(circle, rgba(27,79,255,0.5), transparent 65%)" }} />
      <div className="aurora absolute -right-1/4 top-1/4 h-2/3 w-2/3 rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, rgba(212,175,55,0.4), transparent 65%)", animationDelay: "-8s" }} />
      <svg viewBox="0 0 1200 420" preserveAspectRatio="xMidYMax slice" className="slow-pan absolute inset-x-0 bottom-0 h-2/3 w-full opacity-70">
        <defs>
          <linearGradient id="standsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a2258" /><stop offset="100%" stopColor="#040d24" />
          </linearGradient>
          <linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(235,245,255,0.5)" /><stop offset="100%" stopColor="rgba(235,245,255,0)" />
          </linearGradient>
        </defs>
        {[{ x: 150, sway: "beamSwayA" }, { x: 1050, sway: "beamSwayB" }].map((p) => (
          <g key={p.x}>
            <rect x={p.x - 4} y={130} width={8} height={140} fill="#071233" />
            <rect x={p.x - 30} y={118} width={60} height={18} rx={4} fill="#0a1c4a" />
            {[-20, -8, 4, 16].map((dx) => (
              <circle key={dx} cx={p.x + dx + 2} cy={127} r={3.1} fill="#dfeeff" style={{ animation: "floodFlicker 7s linear infinite" }} />
            ))}
            <polygon points={`${p.x - 26},136 ${p.x + 26},136 ${p.x + 150},420 ${p.x - 200},420`}
              fill="url(#beamGrad)" opacity={0.16}
              style={{ transformOrigin: `${p.x}px 136px`, animation: `${p.sway} 9s ease-in-out infinite` }} />
          </g>
        ))}
        <path d="M-20 268 Q 600 170 1220 268 L 1220 320 Q 600 232 -20 320 Z" fill="url(#standsGrad)" opacity="0.9" />
        <path d="M-20 292 Q 600 200 1220 292" stroke="rgba(140,180,255,0.30)" strokeWidth="2.5" fill="none" strokeDasharray="3 9" />
        <path d="M-20 340 Q 600 252 1220 340 L 1220 420 L -20 420 Z" fill="#030a1c" />
        <style>{`
          @keyframes beamSwayA { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(7deg); } }
          @keyframes beamSwayB { 0%,100% { transform: rotate(6deg); } 50% { transform: rotate(-7deg); } }
        `}</style>
      </svg>
    </div>
  );
}

/* ---- daily challenge — same deterministic config as /daily ---- */
function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
function dailyConfig(key: string): { formation: string; mode: "classic" | "expert" } {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const forms = ["4-3-3", "4-2-3-1", "4-4-2", "3-5-2", "3-4-3", "4-1-2-1-2"];
  return { formation: forms[h % forms.length], mode: h % 3 === 0 ? "expert" : "classic" };
}

const COMP_META = {
  cl: { label: "Champions League", accent: "#00f0ff", href: "/tournament" },
  euro: { label: "UEFA EURO", accent: "#ff3b57", href: "/international" },
  copa: { label: "Copa América", accent: "#00e676", href: "/international" },
} as const;

/** icon + accent + translation keys; dates are static labels. */
const NEWS = [
  { date: "Jul 2026", icon: "🌐", titleKey: "news.bilingual.title", bodyKey: "news.bilingual.body" },
  { date: "Jul 2026", icon: "🎴", titleKey: "news.lineups.title", bodyKey: "news.lineups.body" },
  { date: "Jul 2026", icon: "🥅", titleKey: "news.shootout.title", bodyKey: "news.shootout.body" },
  { date: "Jul 2026", icon: "📱", titleKey: "news.mobile.title", bodyKey: "news.mobile.body" },
];

const FAQ_KEYS: { q: string; a: string; kind?: "comps" }[] = [
  { q: "faq.q1", a: "faq.a1" },
  { q: "faq.q2", a: "faq.a2" },
  { q: "faq.q3", a: "", kind: "comps" },
  { q: "faq.q4", a: "faq.a4" },
  { q: "faq.q5", a: "faq.a5" },
  { q: "faq.q6", a: "faq.a6" },
  { q: "faq.q7", a: "faq.a7" },
  { q: "faq.q8", a: "faq.a8" },
];

function SectionHeading({ kicker, title, right }: { kicker: string; title: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="cl-heading text-[0.6rem] tracking-[0.4em] text-cyan">{kicker}</div>
        <h2 className="mt-1 font-display text-xl font-extrabold sm:text-2xl">{title}</h2>
      </div>
      {right}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The PLAY tiles — big, saturated, obvious. Icon + title + 3 words.   */
/* ------------------------------------------------------------------ */
interface Tile {
  href: string;
  icon: string;
  kicker: string;
  title: string;
  tag: string;
  cta: string;
  gradient: string;
  glow: string;
  ring: string;
  badge?: string;
  span: string;   // grid span classes
  minH: string;
}

function PlayTile({ tile, index }: { tile: Tile; index: number }) {
  return (
    <div className={`${tile.span} tile-rise`} style={{ animationDelay: `${index * 70}ms` }}>
      <Link
        href={tile.href}
        onClick={() => play("select")}
        className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-1 sm:p-6 ${tile.minH}`}
        style={{ background: tile.gradient, boxShadow: `${tile.glow}, 0 1px 0 rgba(255,255,255,0.14) inset, 0 16px 36px rgba(0,0,0,0.4)`, border: `1px solid ${tile.ring}` }}
      >
        {/* grounding vignette — sells depth without a busy watermark */}
        <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(140% 60% at 50% 118%, rgba(0,0,0,0.45), transparent 60%)" }} />
        <span aria-hidden className="pointer-events-none absolute -inset-x-1/2 -top-1/2 h-[200%] w-[60%] -translate-x-1/3 rotate-12 bg-white/10 opacity-0 blur-xl transition-all duration-700 group-hover:translate-x-[220%] group-hover:opacity-100" />

        <div className="relative flex items-start justify-between gap-2">
          <span className="text-3xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] sm:text-4xl">{tile.icon}</span>
          <span className="rounded-full bg-black/30 px-2.5 py-1 text-[0.52rem] font-bold uppercase tracking-[0.2em] text-white/90">
            {tile.kicker}
          </span>
        </div>

        <div className="relative mt-auto pt-6">
          <h3 className="font-display text-xl font-semibold uppercase leading-none tracking-wide text-white sm:text-2xl">{tile.title}</h3>
          <p className="mt-1.5 text-[0.8rem] font-medium text-white/80">{tile.tag}</p>
          <span className="mt-3.5 inline-flex items-center gap-2 rounded-lg bg-black/30 px-3.5 py-1.5 text-[0.64rem] font-bold uppercase tracking-[0.12em] text-white transition-transform duration-300 group-hover:translate-x-1">
            {tile.badge && <span className="rounded bg-white px-1.5 py-0.5 text-[0.5rem] font-black text-black">{tile.badge}</span>}
            {tile.cta} <span aria-hidden>→</span>
          </span>
        </div>
      </Link>
    </div>
  );
}

/* ================================================================== */

export default function Home() {
  const mounted = useHydrated();
  const t = useT();
  const profile = useGame((s) => s.profile);
  const tournament = useGame((s) => s.tournament);
  const intl = useGame((s) => s.intl);
  const setup = useGame((s) => s.setup);
  const formation = useGame((s) => s.formation);
  const draftComplete = useGame((s) => s.draftComplete);
  const placedSlots = useGame((s) => s.placedSlots);
  const matchLog = useGame((s) => s.matchLog);
  const careerPlayer = useCurrentPlayer();
  const playerCount = getAllPlayers().length;

  /* ---- CONTINUE PLAYING: whatever the manager left on the desk ---- */
  const resume = mounted ? (() => {
    if (tournament) {
      const alive = tournament.phase !== "done";
      const nextFixture = tournament.fixtures.find(
        (f) => f.matchday === tournament.matchday && !f.result && (f.home === USER_TEAM_ID || f.away === USER_TEAM_ID),
      );
      const nextTie = tournament.ties.find((t) => !t.winner && (t.teamA === USER_TEAM_ID || t.teamB === USER_TEAM_ID));
      const opp = tournament.phase === "league" && nextFixture
        ? tournament.teams[nextFixture.home === USER_TEAM_ID ? nextFixture.away : nextFixture.home]
        : nextTie
          ? tournament.teams[nextTie.teamA === USER_TEAM_ID ? nextTie.teamB : nextTie.teamA]
          : null;
      const stage =
        tournament.phase === "league" ? t("stage.leaguePhase", { n: Math.min(tournament.matchday, 8) })
          : tournament.phase === "playoffs" ? t("stage.playoffs")
          : tournament.phase === "r16" ? t("stage.r16")
          : tournament.phase === "qf" ? t("stage.qf")
          : tournament.phase === "sf" ? t("stage.sf")
          : tournament.phase === "final" ? t("stage.final")
          : t("stage.clComplete");
      return {
        comp: "cl" as const, name: tournament.teams[USER_TEAM_ID].name, stage,
        opp: opp ? { name: teamLabel(opp), colors: opp.colors, short: opp.short } : null,
        href: "/tournament", cta: alive ? t("home.resume.continueTournament") : t("home.resume.collectResult"),
      };
    }
    if (intl) {
      const meta = COMP_META[intl.comp];
      const userTeam = intl.teams[intl.userKey];
      const nextFixture = intl.fixtures.find(
        (f) => f.matchday === intl.matchday && !f.result && (f.home === intl.userKey || f.away === intl.userKey),
      );
      const nextTie = intl.ties.find((t) => !t.winner && (t.teamA === intl.userKey || t.teamB === intl.userKey));
      const oppKey = intl.phase === "groups" && nextFixture
        ? (nextFixture.home === intl.userKey ? nextFixture.away : nextFixture.home)
        : nextTie
          ? (nextTie.teamA === intl.userKey ? nextTie.teamB : nextTie.teamA)
          : null;
      const opp = oppKey ? intl.teams[oppKey] : null;
      const stage =
        intl.phase === "groups" ? t("stage.groupStage", { n: Math.min(intl.matchday, 3) })
          : intl.phase === "r16" ? t("stage.r16")
          : intl.phase === "qf" ? t("stage.qf")
          : intl.phase === "sf" ? t("stage.sf")
          : intl.phase === "final" ? (nextTie?.round === "Third Place" ? t("stage.bronze") : t("stage.final"))
          : t("stage.intlComplete");
      return {
        comp: intl.comp, name: `${userTeam.name} ${userTeam.season ?? ""}`.trim(), stage,
        opp: opp ? { name: `${opp.name} ${opp.season ?? ""}`.trim(), colors: opp.colors, short: opp.short } : null,
        href: `${meta.href}?comp=${intl.comp}`, cta: intl.phase !== "done" ? t("home.resume.continueTournament") : t("home.resume.collectResult"),
      };
    }
    if (setup && !draftComplete) {
      const total = formation?.slots.length ?? 11;
      return {
        comp: (setup.pool === "clubs" ? "cl" : setup.pool) as "cl" | "euro" | "copa",
        name: t("home.resume.draftInProgress"), stage: t("home.resume.pickOf", { n: Math.min(placedSlots.length + 1, total), total }),
        opp: null, href: "/draft", cta: t("home.resume.continueDraft"),
      };
    }
    if (draftComplete) {
      return { comp: "cl" as const, name: t("home.resume.xiReady"), stage: t("home.resume.squadReview"), opp: null, href: "/squad", cta: t("home.resume.enterTournament") };
    }
    return null;
  })() : null;

  const resumeMeta = resume ? COMP_META[resume.comp] : null;

  /* ---- daily challenge + career state ---- */
  const dkey = todayKey();
  const dcfg = dailyConfig(dkey);
  const dailyPlayed = mounted && profile.drafts.some((d) => d.daily === dkey);
  const activeCareer = mounted && careerPlayer && !careerPlayer.retired ? careerPlayer : null;
  const anyCareer = mounted ? careerPlayer : null;

  /* ---- hall of champions ---- */
  const champions = mounted
    ? [
        ...profile.drafts.filter((d) => d.result === "champion").map((d) => ({
          key: `cl-${d.id}`, comp: "Champions Draft", accent: "#00f0ff",
          name: `${d.formation} · ${d.overall} OVR`, date: d.date, sub: `${d.players[0]?.name ?? ""} & co.`,
        })),
        ...(profile.intlResults ?? []).filter((r) => r.result === "champion").map((r, i) => ({
          key: `intl-${i}-${r.date}`, comp: r.comp === "euro" ? "UEFA EURO" : "Copa América",
          accent: r.comp === "euro" ? "#ff3b57" : "#00e676",
          name: `${r.nation} ${r.year}`, date: r.date, sub: "International champions",
        })),
      ].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 4)
    : [];

  const totalGoals = mounted ? profile.drafts.reduce((s, d) => s + (d.goals ?? 0), 0) : 0;
  const compsCompleted = mounted ? profile.drafts.length + (profile.intlResults?.length ?? 0) : 0;

  /* ---- the tiles ---- */
  const tiles: Tile[] = [
    {
      href: anyCareer ? "/career" : "/career/new", icon: "🎮",
      kicker: t("home.tile.career.kicker"), title: t("home.qa.career"),
      tag: activeCareer ? `${activeCareer.name} · ${t("home.career.ageClub", { age: activeCareer.age, club: activeCareer.currentClubShort ?? activeCareer.currentClubName })}` : t("home.tile.career.tag"),
      cta: anyCareer ? t("home.tile.continue") : t("home.tile.play"), badge: anyCareer ? undefined : t("home.tile.new"),
      gradient: "linear-gradient(150deg, #2e1065 0%, #4c1d95 48%, #6d28d9 78%, #ffd700 145%)",
      glow: "0 14px 46px rgba(109,40,217,0.4)", ring: "rgba(216,180,254,0.5)",
      span: "sm:col-span-2 lg:col-span-2", minH: "min-h-[210px] sm:min-h-[240px]",
    },
    {
      href: "/draft", icon: "🏆", kicker: t("home.tile.cl.kicker"), title: "Champions League",
      tag: t("home.tile.cl.tag"), cta: t("home.tile.play"),
      gradient: "linear-gradient(150deg, #05070d 0%, #0f172a 45%, #0e5f6b 85%, #00f0ff 145%)",
      glow: "0 14px 46px rgba(0,240,255,0.32)", ring: "rgba(0,240,255,0.5)",
      span: "sm:col-span-2 lg:col-span-2", minH: "min-h-[210px] sm:min-h-[240px]",
    },
    {
      href: "/international?comp=euro", icon: "🇪🇺", kicker: t("home.tile.euro.kicker"), title: "UEFA EURO",
      tag: t("home.tile.euro.tag"), cta: t("home.tile.play"),
      gradient: "linear-gradient(150deg, #050d2e 0%, #10236e 45%, #1b3fd0 78%, #ff3b57 145%)",
      glow: "0 14px 40px rgba(255,59,87,0.32)", ring: "rgba(255,59,87,0.5)",
      span: "lg:col-span-1", minH: "min-h-[190px]",
    },
    {
      href: "/international?comp=copa", icon: "🌎", kicker: t("home.tile.copa.kicker"), title: "Copa América",
      tag: t("home.tile.copa.tag"), cta: t("home.tile.play"),
      gradient: "linear-gradient(150deg, #06251a 0%, #0a3520 45%, #0f6d43 78%, #ffd700 145%)",
      glow: "0 14px 40px rgba(255,215,0,0.3)", ring: "rgba(255,215,0,0.5)",
      span: "lg:col-span-1", minH: "min-h-[190px]",
    },
    {
      href: "/daily", icon: "📅", kicker: t("home.tile.daily.kicker"), title: t("home.daily.kicker"),
      tag: `${dcfg.formation} · ${t(dcfg.mode === "expert" ? "draft.mode.expert.title" : "draft.mode.classic.title")}`,
      cta: dailyPlayed ? t("home.daily.viewResult") : t("home.tile.play"),
      gradient: "linear-gradient(150deg, #451a03 0%, #78350f 45%, #b45309 80%, #ffd700 145%)",
      glow: "0 14px 40px rgba(255,215,0,0.3)", ring: "rgba(255,215,0,0.5)",
      span: "sm:col-span-2 lg:col-span-2", minH: "min-h-[190px]",
    },
  ];

  return (
    <div className="relative pb-24">
      <StadiumScene />
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:pt-28 lg:px-6">
        {/* ===================== HUB MASTHEAD ===================== */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <motion.div initial={{ y: 14 }} animate={{ y: 0 }}>
            <div className="cl-heading text-[0.6rem] tracking-[0.45em] text-cyan">{t("home.kicker")}</div>
            <h1 className="mt-1 font-display text-3xl font-black sm:text-5xl">
              {t("home.welcome")} <span className="text-gradient-gold">{mounted ? profile.name : "Manager"}</span>
            </h1>
          </motion.div>
          <motion.div
            initial={{ y: 14 }} animate={{ y: 0 }} transition={{ delay: 0.1 }}
            className="flex items-center gap-2.5"
          >
            <span className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.72rem] font-bold" style={{ background: "linear-gradient(135deg, rgba(242,212,114,0.22), rgba(212,175,55,0.1))", border: "1px solid rgba(242,212,114,0.4)" }}>
              🏆 <span className="font-display text-base font-black text-gold">{mounted ? profile.trophies : 0}</span> <span className="text-gold/80">{t("home.trophiesLabel")}</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.72rem] font-bold" style={{ background: "rgba(34,224,255,0.12)", border: "1px solid rgba(34,224,255,0.35)" }}>
              🎖️ <span className="font-display text-base font-black text-cyan">{mounted ? profile.achievements.length : 0}</span><span className="text-cyan/70">/{ACHIEVEMENTS.length}</span>
            </span>
          </motion.div>
        </div>

        {/* ===================== AT A GLANCE — status first, dashboard-style ===================== */}
        <section className="mt-6">
          <div className="glass rounded-2xl px-4 py-4 sm:px-6">
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
              {[
                { to: mounted ? profile.drafts.length : 0, suffix: "", label: t("home.stats.drafts"), icon: "🎴" },
                { to: mounted ? profile.trophies : 0, suffix: "", label: t("home.stats.trophies"), icon: "🏆" },
                { to: totalGoals, suffix: "", label: t("home.stats.goals"), icon: "⚽" },
                { to: mounted ? matchLog.length : 0, suffix: "", label: t("home.stats.matches"), icon: "📊" },
                { to: compsCompleted, suffix: "", label: t("home.stats.campaigns"), icon: "🗺️" },
                { to: mounted ? profile.achievements.length : 0, suffix: `/${ACHIEVEMENTS.length}`, label: t("home.stats.achievements"), icon: "🎖️" },
              ].map((c) => (
                <div key={c.label} className="text-center">
                  <div className="text-base" aria-hidden>{c.icon}</div>
                  <AnimatedCounter to={c.to} suffix={c.suffix} label={c.label} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== CONTINUE PLAYING (only if a save) ===================== */}
        {resume && resumeMeta && (
          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6">
            <div className={`shine relative overflow-hidden rounded-3xl p-5 sm:p-6 ${
              resume.comp === "euro" ? "euro-panel euro-grid" : resume.comp === "copa" ? "copa-panel copa-heat copa-gold-border" : "cl-panel cl-streaks"
            }`}>
              <CameraFlashes count={8} />
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="min-w-0">
                  <div className="cl-heading text-[0.58rem] tracking-[0.4em]" style={{ color: resumeMeta.accent }}>
                    ▶ {t("home.continueKicker")} · {resumeMeta.label}
                  </div>
                  <h2 className="mt-1.5 truncate font-display text-2xl font-black text-white sm:text-3xl">{resume.name}</h2>
                  <div className="mt-1 text-sm text-white/70">{resume.stage}</div>
                  {resume.opp && (
                    <div className="mt-3 flex w-fit items-center gap-2 rounded-xl bg-black/25 px-3 py-2">
                      <span className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/45">{t("home.next")}</span>
                      <TeamBadge colors={resume.opp.colors} code={resume.opp.short} size={22} />
                      <span className="font-display text-sm font-extrabold text-white">{resume.opp.name}</span>
                    </div>
                  )}
                </div>
                <Link href={resume.href} className={`btn btn-pulse text-base ${resume.comp === "euro" ? "btn-euro" : resume.comp === "copa" ? "btn-copa" : "btn-gold"}`} onClick={() => play("select")}>
                  ▶ {resume.cta}
                </Link>
              </div>
            </div>
          </motion.section>
        )}

        {/* ===================== CHOOSE YOUR GAME — the bento ===================== */}
        <section className="mt-6">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="cl-heading text-[0.6rem] tracking-[0.4em] text-cyan">{t("home.play.kicker")}</div>
              <h2 className="mt-1 font-display text-xl font-black sm:text-2xl">
                {t("home.play.title.a")}<span className="text-gradient-gold">{t("home.comps.title.b")}</span>
              </h2>
            </div>
            <div className="hidden gap-2 sm:flex">
              <Link href="/history" onClick={() => play("click")} className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.66rem] font-extrabold uppercase tracking-wider text-white/75 transition-colors hover:text-white">📜 {t("home.more.history")}</Link>
              <Link href="/stats" onClick={() => play("click")} className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.66rem] font-extrabold uppercase tracking-wider text-white/75 transition-colors hover:text-white">👔 {t("home.more.profile")}</Link>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map((tile, i) => <PlayTile key={tile.title} tile={tile} index={i} />)}
          </div>
          {/* secondary links on mobile */}
          <div className="mt-3 flex gap-2 sm:hidden">
            <Link href="/history" onClick={() => play("click")} className="glass flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[0.68rem] font-extrabold uppercase tracking-wider text-white/75">📜 {t("home.more.history")}</Link>
            <Link href="/stats" onClick={() => play("click")} className="glass flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[0.68rem] font-extrabold uppercase tracking-wider text-white/75">👔 {t("home.more.profile")}</Link>
          </div>
        </section>

        {/* ===================== CHAMPIONS + NEWS — denser side-by-side ===================== */}
        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:items-start">
          {champions.length > 0 && (
            <section>
              <SectionHeading
                kicker={t("home.champs.kicker")}
                title={t("home.champs.title")}
                right={mounted && profile.trophies > 0 ? (
                  <span className="chip bg-gold/15 text-gold">🏆 {t("home.champs.titlesWon", { n: profile.trophies, s: profile.trophies === 1 ? "" : "s" })}</span>
                ) : undefined}
              />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {champions.map((c, i) => (
                  <motion.div key={c.key}
                    initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                    className="shine relative overflow-hidden rounded-2xl p-4"
                    style={{ background: "linear-gradient(165deg, rgba(212,175,55,0.14), rgba(10,20,50,0.6))", border: "1px solid rgba(212,175,55,0.4)" }}>
                    <div className="text-2xl" aria-hidden>🏆</div>
                    <div className="mt-2 text-[0.58rem] font-bold uppercase tracking-[0.25em]" style={{ color: c.accent }}>{c.comp}</div>
                    <div className="mt-0.5 truncate font-display text-sm font-extrabold text-white">{c.name}</div>
                    <div className="mt-0.5 truncate text-[0.62rem] text-muted">{c.sub}</div>
                    <div className="mt-1 text-[0.58rem] text-white/40">{new Date(c.date).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          <section id="news" className="scroll-mt-24">
            <SectionHeading kicker={t("home.news.kicker")} title={t("home.news.title")} />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {NEWS.map((n, i) => (
                <motion.article key={n.titleKey}
                  initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -4 }} className="glass shine rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xl" aria-hidden>{n.icon}</span>
                    <span className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-white/35">{n.date}</span>
                  </div>
                  <h3 className="mt-2 font-display text-[0.85rem] font-extrabold text-white">{t(n.titleKey)}</h3>
                  <p className="mt-1 text-[0.68rem] leading-relaxed text-muted">{t(n.bodyKey)}</p>
                </motion.article>
              ))}
            </div>
          </section>
        </div>

        {/* ============== WHAT IS CONTINENTAL XI + FAQ ================ */}
        <section className="mt-14">
          <SectionHeading kicker={t("home.about.kicker")} title={t("home.about.title")} />
          <details className="faq-item glass mt-5 overflow-hidden rounded-2xl">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-sm font-extrabold text-white">
              {t("home.about.readSummary")}
              <span className="faq-plus grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/8 text-base font-bold text-cyan" aria-hidden>+</span>
            </summary>
            <div className="space-y-3 px-5 pb-5 text-[0.82rem] leading-relaxed text-white/70">
              <p>{t("about.p1")}</p><p>{t("about.p2")}</p><p>{t("about.p3")}</p><p>{t("about.p4")}</p>
            </div>
          </details>
        </section>

        <section id="faq" className="mt-12 scroll-mt-24">
          <SectionHeading kicker={t("home.faq.kicker")} title={t("home.faq.title")} />
          <div className="mt-5 space-y-3">
            {FAQ_KEYS.map((f) => (
              <details key={f.q} className="faq-item glass overflow-hidden rounded-2xl">
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-sm font-extrabold text-white">
                  {t(f.q)}
                  <span className="faq-plus grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/8 text-base font-bold text-cyan" aria-hidden>+</span>
                </summary>
                <div className="px-5 pb-5 text-[0.82rem] leading-relaxed text-white/70">
                  {f.kind === "comps" ? (
                    <span className="grid gap-2">
                      <span>🏆 <b>UEFA Champions League</b> — {t("faq.a3.cl")}</span>
                      <span>🇪🇺 <b>{t("mode.euro.title")}</b> — {t("faq.a3.euro")}</span>
                      <span>🌎 <b>Copa América</b> — {t("faq.a3.copa")}</span>
                    </span>
                  ) : t(f.a)}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ========================== FOOTER =========================== */}
        <footer className="mt-20 border-t border-white/8 pt-10">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <div className="font-display text-sm font-extrabold">CONTINENTAL <span className="text-gradient-gold">XI</span></div>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted/80">{t("home.footer.tagline")}</p>
              <div className="mt-3 text-xs"><ReportBug /></div>
            </div>
            <div>
              <div className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-muted">{t("home.footer.play")}</div>
              <div className="mt-2 grid gap-1.5 text-xs">
                <Link className="text-white/70 hover:text-gold" href="/career">{t("home.qa.career")}</Link>
                <Link className="text-white/70 hover:text-gold" href="/draft">{t("mode.cl.title")}</Link>
                <Link className="text-white/70 hover:text-gold" href="/international?comp=euro">{t("mode.euro.title")}</Link>
                <Link className="text-white/70 hover:text-gold" href="/international?comp=copa">Copa América</Link>
                <Link className="text-white/70 hover:text-gold" href="/daily">{t("home.qa.daily")}</Link>
              </div>
            </div>
            <div>
              <div className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-muted">{t("home.footer.explore")}</div>
              <div className="mt-2 grid gap-1.5 text-xs">
                <Link className="text-white/70 hover:text-gold" href="/history">{t("home.qa.history")}</Link>
                <Link className="text-white/70 hover:text-gold" href="/tournament">{t("tour.careerHub")}</Link>
                <Link className="text-white/70 hover:text-gold" href="/stats">{t("home.qa.profile")}</Link>
              </div>
            </div>
          </div>
          <p className="mt-10 pb-2 text-center text-[0.62rem] text-muted/60">
            {t("home.footer.stat", { squads: SQUADS.length, players: playerCount.toLocaleString() })}
          </p>
        </footer>
      </div>
    </div>
  );
}
