"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { TiltCard } from "@/components/fx/TiltCard";
import { Sparks, CameraFlashes } from "@/components/fx/Atmosphere";
import { TeamBadge } from "@/components/TeamBadge";
import { LineupCard, type BadgeKind } from "@/components/LineupCard";
import { ReportBug } from "@/components/ReportBug";
import { useGame } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { useT } from "@/lib/i18n";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { play } from "@/lib/sound";
import { getAllPlayers, SQUADS } from "@/lib/players";
import { USER_TEAM_ID, teamLabel } from "@/lib/engine/tournament";

/* ------------------------------------------------------------------ */
/*  Stadium scene behind the hub — tiered stands, floodlight pylons    */
/*  with swinging beams, pitch glow. The hub should never feel static. */
/* ------------------------------------------------------------------ */
function StadiumScene() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh] overflow-hidden" aria-hidden>
      <div
        className="aurora absolute -left-1/4 top-0 h-2/3 w-2/3 rounded-full opacity-40"
        style={{ background: "radial-gradient(circle, rgba(27,79,255,0.5), transparent 65%)" }}
      />
      <div
        className="aurora absolute -right-1/4 top-1/4 h-2/3 w-2/3 rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, rgba(212,175,55,0.4), transparent 65%)", animationDelay: "-8s" }}
      />
      <svg viewBox="0 0 1200 420" preserveAspectRatio="xMidYMax slice" className="slow-pan absolute inset-x-0 bottom-0 h-2/3 w-full opacity-70">
        <defs>
          <linearGradient id="standsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a2258" />
            <stop offset="100%" stopColor="#040d24" />
          </linearGradient>
          <linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(235,245,255,0.5)" />
            <stop offset="100%" stopColor="rgba(235,245,255,0)" />
          </linearGradient>
        </defs>
        {[{ x: 150, sway: "beamSwayA" }, { x: 1050, sway: "beamSwayB" }].map((p) => (
          <g key={p.x}>
            <rect x={p.x - 4} y={130} width={8} height={140} fill="#071233" />
            <rect x={p.x - 30} y={118} width={60} height={18} rx={4} fill="#0a1c4a" />
            {[-20, -8, 4, 16].map((dx) => (
              <circle key={dx} cx={p.x + dx + 2} cy={127} r={3.1} fill="#dfeeff" style={{ animation: "floodFlicker 7s linear infinite" }} />
            ))}
            <polygon
              points={`${p.x - 26},136 ${p.x + 26},136 ${p.x + 150},420 ${p.x - 200},420`}
              fill="url(#beamGrad)" opacity={0.16}
              style={{ transformOrigin: `${p.x}px 136px`, animation: `${p.sway} 9s ease-in-out infinite` }}
            />
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

/* ------------------------------------------------------------------ */
/*  Daily challenge — same deterministic config as /daily              */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */

const COMP_META = {
  cl: { label: "Champions League", accent: "#22e0ff", href: "/tournament" },
  euro: { label: "UEFA EURO", accent: "#37e0ff", href: "/international" },
  copa: { label: "Copa América", accent: "#ffc93c", href: "/international" },
} as const;

/** Mini broadcast-XI samples shown on each competition card, so a visitor
 *  immediately sees how the three lineup skins differ. */
type PreviewCard = { name: string; overall: number; colors: [string, string]; pos: string; season: string };
const MODES = [
  {
    key: "cl", emoji: "🏆", kickerKey: "mode.cl.kicker", titleKey: "mode.cl.title", bodyKey: "mode.cl.body",
    chipKeys: ["mode.cl.chip1", "mode.cl.chip2", "mode.cl.chip3"],
    href: "/draft", accent: "#22e0ff", panel: "cl-panel cl-streaks", glow: "rgba(34,224,255,0.35)",
    badge: "crest" as BadgeKind, nameAccent: "#1546c8", strip: "linear-gradient(160deg, #071a52, #0b2464)",
    preview: [
      { name: "A. Rossi", overall: 91, colors: ["#0b1b52", "#c9a24a"], pos: "ST", season: "94" },
      { name: "M. König", overall: 89, colors: ["#7a0d16", "#f2d472"], pos: "CM", season: "07" },
      { name: "L. Ferrand", overall: 88, colors: ["#0e2a6b", "#3aa0ff"], pos: "GK", season: "99" },
    ] as PreviewCard[],
  },
  {
    key: "euro", emoji: "🇪🇺", kickerKey: "mode.euro.kicker", titleKey: "mode.euro.title", bodyKey: "mode.euro.body",
    chipKeys: ["mode.euro.chip1", "mode.euro.chip2"],
    href: "/international?comp=euro", accent: "#37e0ff", panel: "euro-panel euro-grid", glow: "rgba(55,224,255,0.4)",
    badge: "flag" as BadgeKind, nameAccent: "#1b3fd0", strip: "linear-gradient(160deg, #0e7a3f, #128a48)",
    preview: [
      { name: "J. Novak", overall: 90, colors: ["#c8102e", "#ffffff"], pos: "CAM", season: "04" },
      { name: "P. Andersen", overall: 88, colors: ["#0033a0", "#ffffff"], pos: "CB", season: "92" },
      { name: "R. De Vries", overall: 89, colors: ["#ff6b1a", "#0b2a6b"], pos: "RW", season: "88" },
    ] as PreviewCard[],
  },
  {
    key: "copa", emoji: "🌎", kickerKey: "mode.copa.kicker", titleKey: "mode.copa.title", bodyKey: "mode.copa.body",
    chipKeys: ["mode.copa.chip1", "mode.copa.chip2"],
    href: "/international?comp=copa", accent: "#ffc93c", panel: "copa-panel copa-heat copa-gold-border", glow: "rgba(255,201,60,0.4)",
    badge: "flag" as BadgeKind, nameAccent: "#9a6b00", strip: "linear-gradient(160deg, #0a5a34, #0c6a3d)",
    preview: [
      { name: "D. Rey", overall: 92, colors: ["#75aadb", "#ffffff"], pos: "ST", season: "86" },
      { name: "C. Nunes", overall: 90, colors: ["#f7c948", "#0a7d3b"], pos: "CM", season: "70" },
      { name: "S. Ortega", overall: 87, colors: ["#c8102e", "#0b3aa0"], pos: "LB", season: "95" },
    ] as PreviewCard[],
  },
] as const;

/** icon + accent + translation keys; dates are static labels. */
const NEWS = [
  { date: "Jul 2026", icon: "🌐", titleKey: "news.bilingual.title", bodyKey: "news.bilingual.body" },
  { date: "Jul 2026", icon: "🎴", titleKey: "news.lineups.title", bodyKey: "news.lineups.body" },
  { date: "Jul 2026", icon: "🥅", titleKey: "news.shootout.title", bodyKey: "news.shootout.body" },
  { date: "Jul 2026", icon: "📱", titleKey: "news.mobile.title", bodyKey: "news.mobile.body" },
];

/** FAQ list as translation keys. q3 renders a special 3-line competitions block. */
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

function ModeCard({ mode, index }: { mode: (typeof MODES)[number]; index: number }) {
  const router = useRouter();
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.09, duration: 0.55, ease: "easeOut" }}
    >
      <TiltCard
        className={`shine group h-full cursor-pointer overflow-hidden rounded-3xl ${mode.panel}`}
        onClick={() => { play("select"); router.push(mode.href); }}
      >
        <div className="relative flex h-full min-h-[230px] flex-col p-6" style={{ transformStyle: "preserve-3d" }}>
          <Sparks count={7} color={mode.accent} />
          <div className="tilt-layer relative w-fit" style={{ ["--z" as string]: "46px" }}>
            <motion.span
              aria-hidden
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ width: 78, height: 78, border: `1px solid ${mode.accent}44` }}
              animate={{ scale: [1, 1.4], opacity: [0.7, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut", delay: index * 0.4 }}
            />
            <motion.span
              className="relative block text-5xl"
              animate={{ y: [0, -6, 0], rotate: [0, 3, 0, -3, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
              style={{ filter: `drop-shadow(0 6px 26px ${mode.glow})` }}
            >
              {mode.emoji}
            </motion.span>
          </div>
          <div className="tilt-layer mt-3" style={{ ["--z" as string]: "28px" }}>
            <div className="cl-heading text-[0.58rem] tracking-[0.35em]" style={{ color: mode.accent }}>{t(mode.kickerKey)}</div>
            <h3 className="mt-1 font-display text-xl font-extrabold text-white sm:text-2xl">{t(mode.titleKey)}</h3>
            <p className="mt-2 text-[0.82rem] leading-relaxed text-white/70">{t(mode.bodyKey)}</p>
          </div>

          {/* mini broadcast-XI preview — shows the competition's lineup skin */}
          <div className="tilt-layer mt-4" style={{ ["--z" as string]: "16px" }}>
            <div className="mb-1 text-[0.5rem] font-bold uppercase tracking-[0.25em] text-white/35">{t("home.comps.previewXI")}</div>
            <div className="flex gap-1.5 rounded-xl p-2" style={{ background: mode.strip }}>
              {mode.preview.map((p, i) => (
                <LineupCard
                  key={i}
                  name={p.name}
                  overall={p.overall}
                  colors={p.colors as [string, string]}
                  seasonLabel={p.season}
                  variant={mode.key}
                  widthClass="w-[clamp(38px,20%,52px)]"
                />
              ))}
            </div>
          </div>

          <div className="tilt-layer mt-auto pt-4" style={{ ["--z" as string]: "20px" }}>
            <div className="flex flex-wrap gap-1.5">
              {mode.chipKeys.map((c) => (
                <span key={c} className="chip" style={{ background: `${mode.accent}1e`, color: mode.accent }}>{t(c)}</span>
              ))}
            </div>
            <div
              className="mt-3 inline-flex items-center gap-2 text-[0.68rem] font-extrabold uppercase tracking-[0.2em] transition-transform duration-300 group-hover:translate-x-1.5"
              style={{ color: mode.accent }}
            >
              {t("home.comps.enter")} <span aria-hidden>→</span>
            </div>
          </div>
        </div>
      </TiltCard>
    </motion.div>
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

  /* ---- daily challenge ---- */
  const dkey = todayKey();
  const dcfg = dailyConfig(dkey);
  const dailyPlayed = mounted && profile.drafts.some((d) => d.daily === dkey);

  /* ---- recent activity from the real log ---- */
  const recent = mounted ? matchLog.slice(0, 4) : [];

  /* ---- hall of champions ---- */
  const champions = mounted
    ? [
        ...profile.drafts.filter((d) => d.result === "champion").map((d) => ({
          key: `cl-${d.id}`, comp: "Champions Draft", accent: "#22e0ff",
          name: `${d.formation} · ${d.overall} OVR`, date: d.date, sub: `${d.players[0]?.name ?? ""} & co.`,
        })),
        ...(profile.intlResults ?? []).filter((r) => r.result === "champion").map((r, i) => ({
          key: `intl-${i}-${r.date}`, comp: r.comp === "euro" ? "UEFA EURO" : "Copa América",
          accent: r.comp === "euro" ? "#37e0ff" : "#ffc93c",
          name: `${r.nation} ${r.year}`, date: r.date, sub: "International champions",
        })),
      ].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 4)
    : [];

  const totalGoals = mounted ? profile.drafts.reduce((s, d) => s + (d.goals ?? 0), 0) : 0;
  const compsCompleted = mounted ? profile.drafts.length + (profile.intlResults?.length ?? 0) : 0;

  return (
    <div className="relative pb-24">
      <StadiumScene />
      <div className="mx-auto max-w-6xl px-4 pt-24 sm:pt-28">
        {/* ===================== HUB MASTHEAD ===================== */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <div className="cl-heading text-[0.6rem] tracking-[0.45em] text-cyan">{t("home.kicker")}</div>
            <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">
              {t("home.welcome")} <span className="text-gradient-gold">{mounted ? profile.name : "Manager"}</span>
            </h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass flex items-center gap-4 rounded-2xl px-4 py-2.5"
          >
            <span className="text-[0.7rem] text-muted">🏆 <span className="font-display font-extrabold text-gold">{mounted ? profile.trophies : 0}</span> {t("home.trophiesLabel")}</span>
            <span className="text-[0.7rem] text-muted">🎖️ <span className="font-display font-extrabold text-cyan">{mounted ? profile.achievements.length : 0}</span>/{ACHIEVEMENTS.length}</span>
          </motion.div>
        </div>

        {/* ===================== CONTINUE PLAYING ===================== */}
        <motion.section
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="mt-6"
        >
          {resume && resumeMeta ? (
            <div className={`shine relative overflow-hidden rounded-3xl p-6 sm:p-7 ${
              resume.comp === "euro" ? "euro-panel euro-grid" : resume.comp === "copa" ? "copa-panel copa-heat copa-gold-border" : "cl-panel cl-streaks"
            }`}>
              <CameraFlashes count={8} />
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="min-w-0">
                  <div className="cl-heading text-[0.58rem] tracking-[0.4em]" style={{ color: resumeMeta.accent }}>
                    {t("home.continueKicker")} · {resumeMeta.label}
                  </div>
                  <h2 className="mt-1.5 truncate font-display text-2xl font-extrabold text-white sm:text-3xl">{resume.name}</h2>
                  <div className="mt-1 text-sm text-white/65">{resume.stage}</div>
                  {resume.opp && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-black/25 px-3 py-2 w-fit">
                      <span className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/45">{t("home.next")}</span>
                      <TeamBadge colors={resume.opp.colors} code={resume.opp.short} size={22} />
                      <span className="font-display text-sm font-extrabold text-white">{resume.opp.name}</span>
                    </div>
                  )}
                </div>
                <Link
                  href={resume.href}
                  className={`btn btn-pulse ${resume.comp === "euro" ? "btn-euro" : resume.comp === "copa" ? "btn-copa" : "btn-gold"}`}
                  onClick={() => play("select")}
                >
                  ▶ {resume.cta}
                </Link>
              </div>
            </div>
          ) : (
            <div className="cl-panel cl-streaks shine relative overflow-hidden rounded-3xl p-6 sm:p-7">
              <Sparks count={10} color="#d4af37" />
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="max-w-lg">
                  <div className="cl-heading text-[0.58rem] tracking-[0.4em] text-gold">{t("home.startKicker")}</div>
                  <h2 className="mt-1.5 font-display text-2xl font-extrabold text-white sm:text-3xl">
                    {t("home.noCampaign")}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{t("home.noCampaignBody")}</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <Link href="/draft" className="btn btn-gold btn-pulse" onClick={() => play("select")}>{t("home.startDraft")}</Link>
                  <Link href="/international" className="btn btn-ghost" onClick={() => play("click")}>{t("home.leadNation")}</Link>
                </div>
              </div>
            </div>
          )}
        </motion.section>

        {/* ===================== QUICK ACTIONS ===================== */}
        <motion.section
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-5"
        >
          {[
            { href: "/draft", icon: "🎴", label: t("home.qa.newDraft") },
            { href: "/daily", icon: "📅", label: t("home.qa.daily") },
            { href: "/history", icon: "📜", label: t("home.qa.history") },
            { href: "/international", icon: "🌍", label: t("home.qa.leadNation") },
            { href: "/stats", icon: "👔", label: t("home.qa.profile") },
          ].map((a, i) => (
            <Link
              key={a.href}
              href={a.href}
              onClick={() => play("click")}
              className={`glass shine flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-[0.72rem] font-extrabold uppercase tracking-wider text-white/75 transition-all hover:-translate-y-0.5 hover:text-white ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}
            >
              <span className="text-base">{a.icon}</span> {a.label}
            </Link>
          ))}
        </motion.section>

        {/* ============ DAILY CHALLENGE + RECENT ACTIVITY ============ */}
        <section className="mt-12 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          {/* daily challenge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="glass-strong shine relative flex flex-col overflow-hidden rounded-3xl p-6"
          >
            <div className="cl-heading text-[0.58rem] tracking-[0.4em] text-cyan">{t("home.daily.kicker")} · {dkey}</div>
            <h3 className="mt-1.5 font-display text-xl font-extrabold text-white">
              {t("home.daily.today")} <span className="text-gradient-cyan">{dcfg.formation}</span>
              {" · "}
              <span className="text-gradient-gold">{t(dcfg.mode === "expert" ? "draft.mode.expert.title" : "draft.mode.classic.title")}</span>
            </h3>
            <p className="mt-2 text-[0.8rem] leading-relaxed text-muted">{t("home.daily.body")}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link href="/daily" className="btn btn-cyan text-[0.72rem]" onClick={() => play("select")}>
                {dailyPlayed ? t("home.daily.viewResult") : t("home.daily.playToday")}
              </Link>
              {dailyPlayed && <span className="chip bg-green/15 text-green">{t("home.daily.playedToday")}</span>}
            </div>
          </motion.div>

          {/* recent activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="glass rounded-3xl p-6"
          >
            <div className="flex items-center justify-between">
              <div className="cl-heading text-[0.58rem] tracking-[0.4em] text-gold">{t("home.recent.kicker")}</div>
              <Link href="/history" className="text-[0.62rem] font-bold uppercase tracking-wider text-cyan hover:underline" onClick={() => play("click")}>
                {t("home.recent.full")}
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="mt-4 text-sm text-muted">{t("home.recent.empty")}</p>
            ) : (
              <div className="mt-3 space-y-2">
                {recent.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/4 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-5 w-1 shrink-0 rounded-full" style={{ background: COMP_META[m.comp].accent }} />
                      <TeamBadge colors={m.home.colors} code={m.home.short} size={18} />
                      <span className="truncate text-[0.72rem] font-semibold text-white/85">
                        {m.home.name} <span className="font-display font-extrabold text-white">{m.result.homeGoals}–{m.result.awayGoals}</span> {m.away.name}
                      </span>
                      <TeamBadge colors={m.away.colors} code={m.away.short} size={18} />
                    </div>
                    <span className="shrink-0 text-[0.58rem] uppercase tracking-wider text-white/40">{m.round}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </section>

        {/* ===================== FEATURED COMPETITIONS ===================== */}
        <section id="modes" className="mt-16 scroll-mt-24">
          <SectionHeading
            kicker={t("home.comps.kicker")}
            title={<>{t("home.comps.title.a")}<span className="text-gradient-gold">{t("home.comps.title.b")}</span></>}
          />
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {MODES.map((m, i) => <ModeCard key={m.key} mode={m} index={i} />)}
          </div>
        </section>

        {/* ===================== HALL OF CHAMPIONS ===================== */}
        <section className="mt-16">
          <SectionHeading
            kicker={t("home.champs.kicker")}
            title={t("home.champs.title")}
            right={mounted && profile.trophies > 0 ? (
              <span className="chip bg-gold/15 text-gold">🏆 {t("home.champs.titlesWon", { n: profile.trophies, s: profile.trophies === 1 ? "" : "s" })}</span>
            ) : undefined}
          />
          {champions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="glass mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border-dashed p-6"
            >
              <p className="max-w-md text-sm text-muted">{t("home.champs.empty")}</p>
              <Link href="/draft" className="btn btn-ghost text-xs" onClick={() => play("click")}>{t("home.champs.claim")}</Link>
            </motion.div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {champions.map((c, i) => (
                <motion.div
                  key={c.key}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="shine relative overflow-hidden rounded-2xl p-4"
                  style={{ background: "linear-gradient(165deg, rgba(212,175,55,0.14), rgba(10,20,50,0.6))", border: "1px solid rgba(212,175,55,0.4)" }}
                >
                  <div className="text-2xl" aria-hidden>🏆</div>
                  <div className="mt-2 text-[0.58rem] font-bold uppercase tracking-[0.25em]" style={{ color: c.accent }}>{c.comp}</div>
                  <div className="mt-0.5 truncate font-display text-sm font-extrabold text-white">{c.name}</div>
                  <div className="mt-0.5 truncate text-[0.62rem] text-muted">{c.sub}</div>
                  <div className="mt-1 text-[0.58rem] text-white/40">
                    {new Date(c.date).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ===================== STATISTICS ===================== */}
        <section className="mt-16">
          <SectionHeading kicker={t("home.stats.kicker")} title={t("home.stats.title")} />
          <div className="glass-strong vignette mt-5 rounded-3xl p-6 sm:p-8">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { to: mounted ? profile.drafts.length : 0, suffix: "", label: t("home.stats.drafts"), icon: "🎴" },
                { to: mounted ? profile.trophies : 0, suffix: "", label: t("home.stats.trophies"), icon: "🏆" },
                { to: totalGoals, suffix: "", label: t("home.stats.goals"), icon: "⚽" },
                { to: mounted ? matchLog.length : 0, suffix: "", label: t("home.stats.matches"), icon: "📊" },
                { to: compsCompleted, suffix: "", label: t("home.stats.campaigns"), icon: "🗺️" },
                { to: mounted ? profile.achievements.length : 0, suffix: `/${ACHIEVEMENTS.length}`, label: t("home.stats.achievements"), icon: "🎖️" },
              ].map((c) => (
                <div key={c.label} className="text-center">
                  <div className="text-lg" aria-hidden>{c.icon}</div>
                  <AnimatedCounter to={c.to} suffix={c.suffix} label={c.label} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== GAME NEWS ===================== */}
        <section id="news" className="mt-16 scroll-mt-24">
          <SectionHeading kicker={t("home.news.kicker")} title={t("home.news.title")} />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {NEWS.map((n, i) => (
              <motion.article
                key={n.titleKey}
                initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -4 }}
                className="glass shine rounded-2xl p-4"
              >
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

        {/* ============== WHAT IS CONTINENTAL XI + FAQ ================ */}
        <section className="mt-16">
          <SectionHeading kicker={t("home.about.kicker")} title={t("home.about.title")} />
          <details className="faq-item glass mt-5 overflow-hidden rounded-2xl">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-sm font-extrabold text-white">
              {t("home.about.readSummary")}
              <span className="faq-plus grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/8 text-base font-bold text-cyan" aria-hidden>+</span>
            </summary>
            <div className="space-y-3 px-5 pb-5 text-[0.82rem] leading-relaxed text-white/70">
              <p>{t("about.p1")}</p>
              <p>{t("about.p2")}</p>
              <p>{t("about.p3")}</p>
              <p>{t("about.p4")}</p>
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
