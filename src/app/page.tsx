"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { CameraFlashes } from "@/components/fx/Atmosphere";
import { TeamBadge } from "@/components/TeamBadge";
import { ReportBug } from "@/components/ReportBug";
import { useGame } from "@/lib/store";
import { useCurrentPlayer } from "@/lib/career/store";
import { useHydrated } from "@/lib/useHydrated";
import { fxCount } from "@/lib/fx";
import { useT } from "@/lib/i18n";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { play } from "@/lib/sound";
import { getAllPlayers, SQUADS } from "@/lib/players";
import { USER_TEAM_ID, teamLabel } from "@/lib/engine/tournament";

/* ------------------------------------------------------------------ */
/*  The pitch hero — you're standing on the grass, kickoff spot, with   */
/*  the stands as a thin band overhead and the game modes as glowing    */
/*  markers scattered around you, like a game's own hub menu.           */
/* ------------------------------------------------------------------ */
// the stand roofline for the thin top band only — same tall-edges,
// dipping-corners shape as before, just cropped to a shorter strip
const STAND_ROOFLINE = "M-40 260 L-40 30 Q 130 55 260 95 Q 430 55 600 50 Q 770 55 940 95 Q 1070 55 1200 30 L1200 260 Z";
const STAND_ROOFLINE_STROKE = "M-40 30 Q 130 55 260 95 Q 430 55 600 50 Q 770 55 940 95 Q 1070 55 1200 30";

function StandBand() {
  const crowd = useMemo(() => {
    const rng = (seed: number) => { const x = Math.sin(seed * 999) * 43758.5453; return x - Math.floor(x); };
    return Array.from({ length: fxCount(130) }, (_, i) => {
      const x = rng(i + 50) * 1280 - 40;
      const y = 40 + rng(i) * 120;
      return { x, y, r: 1 + rng(i + 90) * 1, d: 2 + rng(i + 130) * 4, delay: rng(i + 170) * 5 };
    });
  }, []);
  const roofLights = useMemo(() => {
    const rng = (seed: number) => { const x = Math.sin(seed * 741) * 24298.331; return x - Math.floor(x); };
    return Array.from({ length: 14 }, (_, i) => {
      const x = -20 + (i / 13) * 1240;
      const k = Math.abs((x - 600) / 640);
      const y = 8 + Math.sin(k * Math.PI * 1.4) * 22 + k * 10;
      return { x, y, delay: rng(i) * 6 };
    });
  }, []);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[24%] min-h-[130px] overflow-hidden" aria-hidden>
      <svg viewBox="0 0 1200 260" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-full w-full">
        <defs>
          <linearGradient id="standsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0e2740" /><stop offset="100%" stopColor="#050d17" />
          </linearGradient>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(235,245,255,0.38)" /><stop offset="100%" stopColor="rgba(235,245,255,0)" />
          </linearGradient>
          <linearGradient id="ledGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(0,240,255,0.15)" /><stop offset="50%" stopColor="rgba(0,240,255,0.85)" /><stop offset="100%" stopColor="rgba(0,240,255,0.15)" />
          </linearGradient>
          <clipPath id="standClip"><path d={STAND_ROOFLINE} /></clipPath>
          <clipPath id="roofClip"><path d="M-40 0 L1240 0 L1200 30 Q 1070 55 940 95 Q 770 55 600 50 Q 430 55 260 95 Q 130 55 -40 30 Z" /></clipPath>
        </defs>

        <path d="M-40 0 L1240 0 L1200 30 Q 1070 55 940 95 Q 770 55 600 50 Q 430 55 260 95 Q 130 55 -40 30 Z" fill="url(#skyGrad)" opacity="0.5" />
        <g clipPath="url(#roofClip)" stroke="#dfeeff" strokeWidth="1" opacity="0.12">
          {Array.from({ length: 13 }).map((_, i) => {
            const x = -80 + i * 110;
            return <line key={i} x1={x} y1={-10} x2={x + 150} y2={120} />;
          })}
        </g>

        <path d={STAND_ROOFLINE} fill="url(#standsGrad)" />
        <path d={STAND_ROOFLINE_STROKE} stroke="url(#ledGrad)" strokeWidth="5" fill="none" opacity="0.8" className="led-sweep" />

        {roofLights.map((l, i) => (
          <circle key={i} cx={l.x} cy={l.y} r={2} fill="#dfeeff" style={{ animation: "floodFlicker 7s linear infinite", animationDelay: `${l.delay}s` }} />
        ))}

        <g clipPath="url(#standClip)">
          {crowd.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="rgba(220,230,245,0.55)"
              style={{ animation: `crowdFlicker ${d.d}s ease-in-out infinite`, animationDelay: `${d.delay}s` }} />
          ))}
        </g>

        <style>{`
          @keyframes crowdFlicker { 0%,100% { opacity: 0.25; } 50% { opacity: 0.85; } }
          @keyframes ledSweep { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -240; } }
          .led-sweep { stroke-dasharray: 40 200; animation: ledSweep 6s linear infinite; }
          @media (prefers-reduced-motion: reduce) { .led-sweep { animation: none; stroke-dasharray: none; } }
        `}</style>
      </svg>
    </div>
  );
}

/** The grass filling the rest of the hero — mown stripes, a floodlight
 *  wash near the stands, and the pitch markings around the kickoff spot
 *  where the player stands. Pure CSS + one small line-art SVG overlay. */
function GrassField() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 top-[24%] min-h-0 overflow-hidden"
      aria-hidden
      style={{
        background: [
          "repeating-linear-gradient(100deg, rgba(255,255,255,0.05) 0 46px, rgba(0,0,0,0.05) 46px 92px)",
          "radial-gradient(140% 60% at 50% 0%, rgba(0,240,255,0.14), transparent 55%)",
          "linear-gradient(180deg, #0f6b3a 0%, #0c4d2b 45%, #082a19 100%)",
        ].join(", "),
      }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-70">
        <line x1="3" y1="42" x2="97" y2="42" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />
        <circle cx="50" cy="42" r="9" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" fill="none" />
        <circle cx="50" cy="42" r="0.6" fill="rgba(255,255,255,0.5)" />
      </svg>
      {/* the touchline glow, where the floodlights hit the grass */}
      <div className="absolute inset-x-0 top-0 h-1/2" style={{ background: "radial-gradient(60% 80% at 50% 0%, rgba(0,230,118,0.16), transparent 70%)" }} />
    </div>
  );
}

/** The player — you — standing on the kickoff spot facing out at the
 *  options around you. Deliberately abstract/iconic, not a literal
 *  figure, so it reads clean at any size. */
function PlayerMark() {
  return (
    <div className="absolute left-1/2 z-10 -translate-x-1/2" style={{ top: "58%" }} aria-hidden>
      <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>
        <svg width="52" height="76" viewBox="0 0 52 76" className="drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
          <ellipse cx="26" cy="72" rx="16" ry="4" fill="rgba(0,0,0,0.35)" />
          <circle cx="26" cy="12" r="9" fill="#0f172a" stroke="#00f0ff" strokeWidth="1.4" opacity="0.92" />
          <path d="M12 26c0-6 6-10 14-10s14 4 14 10l-3 24h-9l-1-14-1 14h-9z" fill="#0f172a" stroke="#00f0ff" strokeWidth="1.2" opacity="0.92" />
          <path d="M15 50l-4 20M37 50l4 20" stroke="#00f0ff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        </svg>
      </motion.div>
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
/*  Mode pins — game modes scattered around the player on the pitch,     */
/*  like options on a game's own hub menu, not cards in a web grid.      */
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
  pos: { x: number; y: number }; // percent position within the hero
  size?: "lg" | "md";
}

function ModePin({ tile, onEnter }: { tile: Tile; onEnter: (tile: Tile) => void }) {
  const lg = tile.size === "lg";
  return (
    <button
      type="button"
      onClick={() => { play("select"); onEnter(tile); }}
      className="group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
      style={{ left: `${tile.pos.x}%`, top: `${tile.pos.y}%` }}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 animate-ping rounded-full"
        style={{ background: tile.ring, opacity: 0.3 }} />
      <span
        className={`relative flex shrink-0 items-center justify-center rounded-full text-2xl transition-transform duration-300 group-hover:scale-110 group-active:scale-95 sm:text-3xl ${lg ? "h-20 w-20 sm:h-24 sm:w-24" : "h-14 w-14 sm:h-16 sm:w-16"}`}
        style={{ background: tile.gradient, boxShadow: `${tile.glow}, 0 0 0 2px ${tile.ring} inset` }}
      >
        {tile.icon}
        {tile.badge && (
          <span className="absolute -right-1 -top-1 rounded-full bg-white px-1.5 py-0.5 text-[0.5rem] font-black text-black">{tile.badge}</span>
        )}
      </span>
      <span className="whitespace-nowrap rounded-full bg-black/55 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
        {tile.title}
      </span>
    </button>
  );
}

/** Full-screen "walking out to the pitch" beat between picking a mode and
 *  actually arriving — a brief cinematic instead of an instant page jump. */
function ModeTransition({ tile, onDone }: { tile: Tile; onDone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[200] flex cursor-pointer items-center justify-center overflow-hidden"
      style={{ background: tile.gradient }}
      onClick={onDone}
      onAnimationComplete={() => { const t = setTimeout(onDone, 750); return () => clearTimeout(t); }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 90% at 50% 50%, transparent 30%, rgba(0,0,0,0.6) 100%)" }} />
      {/* floodlight sweep, like walking out of the tunnel */}
      <motion.div aria-hidden className="pointer-events-none absolute -inset-x-1/4 -top-1/2 h-[200%] w-1/2 bg-white/15 blur-2xl"
        initial={{ x: "-120%", rotate: 12 }} animate={{ x: "220%", rotate: 12 }} transition={{ duration: 0.9, ease: "easeInOut" }} />
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 16, delay: 0.1 }}
        className="relative text-center"
      >
        <div className="text-6xl drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">{tile.icon}</div>
        <div className="mt-4 font-display text-2xl font-black uppercase tracking-wide text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)] sm:text-4xl">
          {tile.title}
        </div>
        <div className="mt-2 text-[0.7rem] font-bold uppercase tracking-[0.35em] text-white/80">{tile.kicker}</div>
      </motion.div>
    </motion.div>
  );
}

/* ================================================================== */

export default function Home() {
  const mounted = useHydrated();
  const router = useRouter();
  const [entering, setEntering] = useState<Tile | null>(null);
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
      pos: { x: 18, y: 55 },
    },
    {
      href: "/draft", icon: "🏆", kicker: t("home.tile.cl.kicker"), title: "Champions League",
      tag: t("home.tile.cl.tag"), cta: t("home.tile.play"),
      gradient: "linear-gradient(150deg, #05070d 0%, #0f172a 45%, #0e5f6b 85%, #00f0ff 145%)",
      glow: "0 14px 46px rgba(0,240,255,0.32)", ring: "rgba(0,240,255,0.5)",
      pos: { x: 50, y: 32 }, size: "lg",
    },
    {
      href: "/international?comp=euro", icon: "🇪🇺", kicker: t("home.tile.euro.kicker"), title: "UEFA EURO",
      tag: t("home.tile.euro.tag"), cta: t("home.tile.play"),
      gradient: "linear-gradient(150deg, #050d2e 0%, #10236e 45%, #1b3fd0 78%, #ff3b57 145%)",
      glow: "0 14px 40px rgba(255,59,87,0.32)", ring: "rgba(255,59,87,0.5)",
      pos: { x: 82, y: 55 },
    },
    {
      href: "/international?comp=copa", icon: "🌎", kicker: t("home.tile.copa.kicker"), title: "Copa América",
      tag: t("home.tile.copa.tag"), cta: t("home.tile.play"),
      gradient: "linear-gradient(150deg, #06251a 0%, #0a3520 45%, #0f6d43 78%, #ffd700 145%)",
      glow: "0 14px 40px rgba(255,215,0,0.3)", ring: "rgba(255,215,0,0.5)",
      pos: { x: 30, y: 80 },
    },
    {
      href: "/daily", icon: "📅", kicker: t("home.tile.daily.kicker"), title: t("home.daily.kicker"),
      tag: `${dcfg.formation} · ${t(dcfg.mode === "expert" ? "draft.mode.expert.title" : "draft.mode.classic.title")}`,
      cta: dailyPlayed ? t("home.daily.viewResult") : t("home.tile.play"),
      gradient: "linear-gradient(150deg, #451a03 0%, #78350f 45%, #b45309 80%, #ffd700 145%)",
      glow: "0 14px 40px rgba(255,215,0,0.3)", ring: "rgba(255,215,0,0.5)",
      pos: { x: 70, y: 80 },
    },
  ];

  return (
    <>
    <AnimatePresence>
      {entering && (
        <ModeTransition
          key={entering.title}
          tile={entering}
          onDone={() => router.push(entering.href)}
        />
      )}
    </AnimatePresence>
    <div className="relative pb-24">
      {/* ===================== PITCH HERO — you're the player, modes are options around you ===================== */}
      <section className="relative h-[100dvh] min-h-[640px] overflow-hidden">
        <StandBand />
        <GrassField />
        <PlayerMark />

        <div className="absolute left-4 top-20 z-20 sm:left-6 sm:top-24">
          <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div className="cl-heading text-[0.6rem] tracking-[0.45em] text-cyan">{t("home.kicker")}</div>
            <h1 className="mt-1 font-display text-2xl font-black drop-shadow-[0_4px_18px_rgba(0,0,0,0.6)] sm:text-4xl">
              {t("home.welcome")} <span className="text-gradient-gold">{mounted ? profile.name : "Manager"}</span>
            </h1>
          </motion.div>
          <motion.div
            initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="mt-3 flex items-center gap-2.5"
          >
            <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3.5 py-2 text-[0.72rem] font-bold backdrop-blur-sm" style={{ border: "1px solid rgba(242,212,114,0.4)" }}>
              🏆 <span className="font-display text-base font-black text-gold">{mounted ? profile.trophies : 0}</span> <span className="text-gold/80">{t("home.trophiesLabel")}</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3.5 py-2 text-[0.72rem] font-bold backdrop-blur-sm" style={{ border: "1px solid rgba(34,224,255,0.35)" }}>
              🎖️ <span className="font-display text-base font-black text-cyan">{mounted ? profile.achievements.length : 0}</span><span className="text-cyan/70">/{ACHIEVEMENTS.length}</span>
            </span>
          </motion.div>
        </div>

        {/* the modes — glowing markers scattered around the player, tap one to walk on */}
        {tiles.map((tile) => (
          <ModePin key={tile.title} tile={tile} onEnter={setEntering} />
        ))}

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="absolute inset-x-0 bottom-6 z-20 flex justify-center"
        >
          <span className="rounded-full bg-black/40 px-3.5 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.3em] text-white/60 backdrop-blur-sm">
            {t("home.play.kicker")}
          </span>
        </motion.div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:pt-10 lg:px-6">
        {/* quick links */}
        <div className="flex justify-end gap-2">
          <Link href="/history" onClick={() => play("click")} className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.66rem] font-extrabold uppercase tracking-wider text-white/75 transition-colors hover:text-white">📜 {t("home.more.history")}</Link>
          <Link href="/stats" onClick={() => play("click")} className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.66rem] font-extrabold uppercase tracking-wider text-white/75 transition-colors hover:text-white">👔 {t("home.more.profile")}</Link>
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
    </>
  );
}
