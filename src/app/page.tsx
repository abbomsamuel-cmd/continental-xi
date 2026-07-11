"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { TiltCard } from "@/components/fx/TiltCard";
import { Sparks, CameraFlashes } from "@/components/fx/Atmosphere";
import { TeamBadge } from "@/components/TeamBadge";
import { useGame } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
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

const MODES = [
  {
    key: "cl", emoji: "🏆", kicker: "Club · Europe", title: "Champions League",
    body: "Draft legends from every European Cup era, then survive the 36-team league phase and the road to the final.",
    chips: ["36-team Swiss phase", "Two-leg knockouts", "Tactics & suitability"],
    href: "/draft", accent: "#22e0ff", panel: "cl-panel cl-streaks", glow: "rgba(34,224,255,0.35)",
  },
  {
    key: "euro", emoji: "🇪🇺", kicker: "International · UEFA", title: "UEFA EURO",
    body: "Twenty-four historic national sides, six groups, a full Round of 16. Lead a nation or enter your drafted XI.",
    chips: ["24 nations", "Official R16 format"],
    href: "/international?comp=euro", accent: "#37e0ff", panel: "euro-panel euro-grid", glow: "rgba(55,224,255,0.4)",
  },
  {
    key: "copa", emoji: "🌎", kicker: "International · CONMEBOL", title: "Copa América",
    body: "Twelve legendary selecciones fighting for the oldest prize in international football — bronze final included.",
    chips: ["12 selecciones", "Third-place match"],
    href: "/international?comp=copa", accent: "#ffc93c", panel: "copa-panel copa-heat copa-gold-border", glow: "rgba(255,201,60,0.4)",
  },
] as const;

const NEWS = [
  { date: "Jul 2026", icon: "📡", title: "Live Match Mode is here", body: "Semi-finals, bronze finals and finals can now be watched minute by minute — commentary, live stats, pause and ×4 speed." },
  { date: "Jul 2026", icon: "🏟️", title: "Career Hub", body: "The tournament screen now tracks your record, last result and next opponent, with your manager desk one tap away." },
  { date: "Jun 2026", icon: "🕰️", title: "20 iconic squads added", body: "Di Stéfano's Madrid, Cruyff's Ajax, Eusébio's Benfica, the Miracle of Belgrade — the pre-90s legends join the reel." },
  { date: "Jun 2026", icon: "🇪🇺", title: "EURO expanded to 26 nations", body: "The official 24-team format with six groups, best thirds and a true Round of 16 bracket." },
];

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "What is Continental XI?",
    a: "Continental XI is a free football draft game and tournament simulator where you build your ultimate team using legendary clubs and national teams from football's greatest competitions. Draft iconic players from every era, create your dream XI, and see if it has what it takes to become champions.",
  },
  {
    q: "How do you play?",
    a: "Every draft begins with a spin of the wheel, landing on a real club or national team from an iconic season. Select one player from that squad, build your lineup position by position, and create a team unlike any other. Once your squad is complete, take it into a realistic tournament simulation — league tables, knockout rounds, live match commentary and dramatic trophy celebrations.",
  },
  {
    q: "Which competitions can I play?",
    a: (
      <span className="grid gap-2">
        <span>🏆 <b>UEFA Champions League</b> — build an all-time club XI from legendary teams and fight through the official format, from the 36-team league phase to the final, in pursuit of Europe&apos;s biggest prize.</span>
        <span>🇪🇺 <b>UEFA EURO</b> — assemble a dream national team using historic European squads and guide your country through the official EURO tournament to lift the trophy.</span>
        <span>🌎 <b>Copa América</b> — draft football legends from South America&apos;s greatest nations, then battle through the Copa — third-place match included — to become continental champions.</span>
      </span>
    ),
  },
  {
    q: "Which players and clubs are included?",
    a: "Over 1,700 rated players across 105 legendary club squads (1960–2025), 30 historic EURO nations and 18 Copa América selecciones — from Di Stéfano's Real Madrid and Cruyff's Ajax to modern treble winners. Every player represents one specific season, and you can mix generations freely: what if these players played together?",
  },
  {
    q: "Is Continental XI free to play?",
    a: "Yes — completely free, no accounts, no sign-up, no ads. Your saves live in your own browser and never leave your device.",
  },
  {
    q: "Is it a fantasy football game?",
    a: "No. Unlike fantasy football, Continental XI isn't tied to current seasons or live performances. Every player represents a real club or national team from a specific campaign, with carefully balanced ratings based on how they performed that season.",
  },
  {
    q: "Is it affiliated with any league or federation?",
    a: "No — Continental XI is an original, unofficial fan project created by football fans. It is not affiliated with UEFA, CONMEBOL, FIFA, or any club, and uses no official logos, branding or protected assets.",
  },
  {
    q: "Where do the player ratings come from?",
    a: "Every rating is hand-balanced to reflect one exact campaign — Messi '11, Ronaldo '17, Eusébio '62 — never a career average. Full attribute profiles are derived deterministically from those season ratings, so the same player always plays the same way.",
  },
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
            <div className="cl-heading text-[0.58rem] tracking-[0.35em]" style={{ color: mode.accent }}>{mode.kicker}</div>
            <h3 className="mt-1 font-display text-xl font-extrabold text-white sm:text-2xl">{mode.title}</h3>
            <p className="mt-2 text-[0.82rem] leading-relaxed text-white/70">{mode.body}</p>
          </div>
          <div className="tilt-layer mt-auto pt-4" style={{ ["--z" as string]: "20px" }}>
            <div className="flex flex-wrap gap-1.5">
              {mode.chips.map((c) => (
                <span key={c} className="chip" style={{ background: `${mode.accent}1e`, color: mode.accent }}>{c}</span>
              ))}
            </div>
            <div
              className="mt-3 inline-flex items-center gap-2 text-[0.68rem] font-extrabold uppercase tracking-[0.2em] transition-transform duration-300 group-hover:translate-x-1.5"
              style={{ color: mode.accent }}
            >
              Enter Tournament <span aria-hidden>→</span>
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
  const profile = useGame((s) => s.profile);
  const tournament = useGame((s) => s.tournament);
  const intl = useGame((s) => s.intl);
  const setup = useGame((s) => s.setup);
  const draftComplete = useGame((s) => s.draftComplete);
  const currentRound = useGame((s) => s.currentRound);
  const rounds = useGame((s) => s.rounds);
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
        tournament.phase === "league" ? `League Phase · Matchday ${Math.min(tournament.matchday, 8)} of 8`
          : tournament.phase === "playoffs" ? "Knockout Play-offs"
          : tournament.phase === "r16" ? "Round of 16"
          : tournament.phase === "qf" ? "Quarter-finals"
          : tournament.phase === "sf" ? "Semi-finals"
          : tournament.phase === "final" ? "The Final"
          : "Season complete — collect your result";
      return {
        comp: "cl" as const, name: tournament.teams[USER_TEAM_ID].name, stage,
        opp: opp ? { name: teamLabel(opp), colors: opp.colors, short: opp.short } : null,
        href: "/tournament", cta: alive ? "Continue Tournament" : "Collect Your Result",
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
        intl.phase === "groups" ? `Group Stage · Matchday ${Math.min(intl.matchday, 3)} of 3`
          : intl.phase === "r16" ? "Round of 16"
          : intl.phase === "qf" ? "Quarter-finals"
          : intl.phase === "sf" ? "Semi-finals"
          : intl.phase === "final" ? (nextTie?.round === "Third Place" ? "The Bronze Final" : "The Final")
          : "Tournament complete — collect your result";
      return {
        comp: intl.comp, name: `${userTeam.name} ${userTeam.season ?? ""}`.trim(), stage,
        opp: opp ? { name: `${opp.name} ${opp.season ?? ""}`.trim(), colors: opp.colors, short: opp.short } : null,
        href: `${meta.href}?comp=${intl.comp}`, cta: intl.phase !== "done" ? "Continue Tournament" : "Collect Your Result",
      };
    }
    if (setup && !draftComplete) {
      return {
        comp: (setup.pool === "clubs" ? "cl" : setup.pool) as "cl" | "euro" | "copa",
        name: "Draft in progress", stage: `Round ${currentRound + 1} of ${rounds.length}`,
        opp: null, href: "/draft", cta: "Continue Draft",
      };
    }
    if (draftComplete) {
      return { comp: "cl" as const, name: "Your XI is ready", stage: "Squad review", opp: null, href: "/squad", cta: "Enter the Tournament" };
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
            <div className="cl-heading text-[0.6rem] tracking-[0.45em] text-cyan">Football Hub</div>
            <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">
              Welcome back, <span className="text-gradient-gold">{mounted ? profile.name : "Manager"}</span>
            </h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass flex items-center gap-4 rounded-2xl px-4 py-2.5"
          >
            <span className="text-[0.7rem] text-muted">🏆 <span className="font-display font-extrabold text-gold">{mounted ? profile.trophies : 0}</span> trophies</span>
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
                    Continue Playing · {resumeMeta.label}
                  </div>
                  <h2 className="mt-1.5 truncate font-display text-2xl font-extrabold text-white sm:text-3xl">{resume.name}</h2>
                  <div className="mt-1 text-sm text-white/65">{resume.stage}</div>
                  {resume.opp && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-black/25 px-3 py-2 w-fit">
                      <span className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/45">Next</span>
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
                  <div className="cl-heading text-[0.58rem] tracking-[0.4em] text-gold">Start Your Story</div>
                  <h2 className="mt-1.5 font-display text-2xl font-extrabold text-white sm:text-3xl">
                    No active campaign — the touchline is waiting
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">
                    Draft an XI from seven decades of legends and take it through a full season,
                    or lead a historic nation into a summer tournament.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <Link href="/draft" className="btn btn-gold btn-pulse" onClick={() => play("select")}>⚡ Start New Draft</Link>
                  <Link href="/international" className="btn btn-ghost" onClick={() => play("click")}>Lead a Nation</Link>
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
            { href: "/draft", icon: "🎴", label: "New Draft" },
            { href: "/daily", icon: "📅", label: "Daily Challenge" },
            { href: "/history", icon: "📜", label: "Match History" },
            { href: "/international", icon: "🌍", label: "Lead a Nation" },
            { href: "/stats", icon: "👔", label: "Your Profile" },
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
            <div className="cl-heading text-[0.58rem] tracking-[0.4em] text-cyan">Daily Challenge · {dkey}</div>
            <h3 className="mt-1.5 font-display text-xl font-extrabold text-white">
              Today: a <span className="text-gradient-cyan">{dcfg.formation}</span> in <span className="capitalize text-gradient-gold">{dcfg.mode}</span> mode
            </h3>
            <p className="mt-2 text-[0.8rem] leading-relaxed text-muted">
              One universal draft, identical for every manager in the world today — same squads,
              same order, pure skill.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link href="/daily" className="btn btn-cyan text-[0.72rem]" onClick={() => play("select")}>
                {dailyPlayed ? "View Today's Result" : "Play Today's Challenge →"}
              </Link>
              {dailyPlayed && <span className="chip bg-green/15 text-green">✓ Played today</span>}
            </div>
          </motion.div>

          {/* recent activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="glass rounded-3xl p-6"
          >
            <div className="flex items-center justify-between">
              <div className="cl-heading text-[0.58rem] tracking-[0.4em] text-gold">Recent Activity</div>
              <Link href="/history" className="text-[0.62rem] font-bold uppercase tracking-wider text-cyan hover:underline" onClick={() => play("click")}>
                Full history →
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                Nothing on the reel yet — your matches, trophies and drafts will appear here as you play.
              </p>
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
            kicker="Featured Competitions"
            title={<>Choose your <span className="text-gradient-gold">road to glory</span></>}
          />
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {MODES.map((m, i) => <ModeCard key={m.key} mode={m} index={i} />)}
          </div>
        </section>

        {/* ===================== HALL OF CHAMPIONS ===================== */}
        <section className="mt-16">
          <SectionHeading
            kicker="Hall of Champions"
            title="Latest champions"
            right={mounted && profile.trophies > 0 ? (
              <span className="chip bg-gold/15 text-gold">🏆 {profile.trophies} title{profile.trophies === 1 ? "" : "s"} won</span>
            ) : undefined}
          />
          {champions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="glass mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border-dashed p-6"
            >
              <p className="max-w-md text-sm text-muted">
                The board is waiting for its first name. Win any competition and your
                champion XI is engraved here forever.
              </p>
              <Link href="/draft" className="btn btn-ghost text-xs" onClick={() => play("click")}>Claim it →</Link>
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
          <SectionHeading kicker="Your Numbers" title="Career statistics" />
          <div className="glass-strong vignette mt-5 rounded-3xl p-6 sm:p-8">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { to: mounted ? profile.drafts.length : 0, suffix: "", label: "Drafts Played", icon: "🎴" },
                { to: mounted ? profile.trophies : 0, suffix: "", label: "Trophies Lifted", icon: "🏆" },
                { to: totalGoals, suffix: "", label: "Goals Scored", icon: "⚽" },
                { to: mounted ? matchLog.length : 0, suffix: "", label: "Matches Played", icon: "📊" },
                { to: compsCompleted, suffix: "", label: "Campaigns", icon: "🗺️" },
                { to: mounted ? profile.achievements.length : 0, suffix: `/${ACHIEVEMENTS.length}`, label: "Achievements", icon: "🎖️" },
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
        <section className="mt-16">
          <SectionHeading kicker="Game News" title="Latest from the touchline" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {NEWS.map((n, i) => (
              <motion.article
                key={n.title}
                initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -4 }}
                className="glass shine rounded-2xl p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl" aria-hidden>{n.icon}</span>
                  <span className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-white/35">{n.date}</span>
                </div>
                <h3 className="mt-2 font-display text-[0.85rem] font-extrabold text-white">{n.title}</h3>
                <p className="mt-1 text-[0.68rem] leading-relaxed text-muted">{n.body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* ============== WHAT IS CONTINENTAL XI + FAQ ================ */}
        <section className="mt-16">
          <SectionHeading kicker="About the Game" title="What is Continental XI?" />
          <details className="faq-item glass mt-5 overflow-hidden rounded-2xl">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-sm font-extrabold text-white">
              The full story — competitions, drafting, and why it exists
              <span className="faq-plus grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/8 text-base font-bold text-cyan" aria-hidden>+</span>
            </summary>
            <div className="space-y-3 px-5 pb-5 text-[0.82rem] leading-relaxed text-white/70">
              <p>
                Continental XI is a free football draft game and tournament simulator where you build your
                ultimate team using legendary clubs and national teams from football&apos;s greatest competitions.
                Draft iconic players from every era, create your dream XI, and see if it has what it takes to
                become champions.
              </p>
              <p>
                Every draft begins with a spin of the wheel, landing on real clubs or national teams from iconic
                seasons. Select one player from that squad, build your lineup position by position, and create a
                team unlike any other. Mix generations, combine football legends with modern superstars, and
                answer the ultimate football question: <i className="text-white/85">what if these players played together?</i>
              </p>
              <p>
                Once your squad is complete, your journey is just beginning. Compete in realistic tournament
                simulations featuring authentic competition formats, league tables, knockout rounds, live match
                commentary, and dramatic trophy celebrations. Every tournament is different, every decision
                matters, and every match creates a new football story.
              </p>
              <p>
                Created by football fans, Continental XI is built for anyone who loves football history, legendary
                players, and debating the greatest teams of all time. Unlike fantasy football, it isn&apos;t tied to
                current seasons or live performances — every player represents a real club or national team from
                a specific season, with carefully balanced ratings based on their performances during that campaign.
              </p>
              <p>
                Whether you&apos;re leading Real Madrid through the Champions League, taking Spain to EURO glory, or
                guiding Argentina to Copa América success, Continental XI lets you relive football&apos;s greatest eras
                and create your own legendary journey. Can your dream XI conquer Europe — or South America — and
                write its own place in football history? ⚽
              </p>
            </div>
          </details>
        </section>

        <section className="mt-12">
          <SectionHeading kicker="Help" title="Frequently asked questions" />
          <div className="mt-5 space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="faq-item glass overflow-hidden rounded-2xl">
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-sm font-extrabold text-white">
                  {f.q}
                  <span className="faq-plus grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/8 text-base font-bold text-cyan" aria-hidden>+</span>
                </summary>
                <div className="px-5 pb-5 text-[0.82rem] leading-relaxed text-white/70">{f.a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* ========================== FOOTER =========================== */}
        <footer className="mt-20 border-t border-white/8 pt-10">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <div className="font-display text-sm font-extrabold">CONTINENTAL <span className="text-gradient-gold">XI</span></div>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted/80">
                An original, unofficial fan project. Not affiliated with UEFA, CONMEBOL or any club.
                No official logos, branding or protected assets are used.
              </p>
            </div>
            <div>
              <div className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-muted">Play</div>
              <div className="mt-2 grid gap-1.5 text-xs">
                <Link className="text-white/70 hover:text-gold" href="/draft">Champions Draft</Link>
                <Link className="text-white/70 hover:text-gold" href="/international?comp=euro">UEFA EURO</Link>
                <Link className="text-white/70 hover:text-gold" href="/international?comp=copa">Copa América</Link>
                <Link className="text-white/70 hover:text-gold" href="/daily">Daily Challenge</Link>
              </div>
            </div>
            <div>
              <div className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-muted">Explore</div>
              <div className="mt-2 grid gap-1.5 text-xs">
                <Link className="text-white/70 hover:text-gold" href="/history">Match History</Link>
                <Link className="text-white/70 hover:text-gold" href="/tournament">Career Hub</Link>
                <Link className="text-white/70 hover:text-gold" href="/stats">Your Profile</Link>
              </div>
            </div>
          </div>
          <p className="mt-10 pb-2 text-center text-[0.62rem] text-muted/60">
            {SQUADS.length} legendary squads · {playerCount.toLocaleString()} rated players · your saves live on this device — no accounts, ever.
          </p>
        </footer>
      </div>
    </div>
  );
}
