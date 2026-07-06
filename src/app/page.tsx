"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { play } from "@/lib/sound";
import { getAllPlayers, SQUADS } from "@/lib/players";
import { CLUB_REGISTRY } from "@/lib/data/clubs";

const FEATURES = [
  { icon: "🎴", title: "Season-Specific Draft", body: "Every card is a real player rated for that exact European campaign — Messi '11 is a 96, not a career average." },
  { icon: "🧪", title: "Deep Chemistry", body: "Same club, nation, league, manager and era all link up. Reunite MSN, the BBC or Xavi–Iniesta–Busquets for elite bonuses." },
  { icon: "🏟️", title: "Modern League Phase", body: "36 clubs, one Swiss table, 8 matchdays. Finish top 8 to go straight through — 9th to 24th fight play-offs." },
  { icon: "🧠", title: "Intelligent Engine", body: "Form, chemistry, home advantage, bench and pure football variance decide matches. Upsets happen." },
  { icon: "👑", title: "Road to Glory", body: "Play-offs, Round of 16, quarters, semis and a neutral-venue final. Lift the trophy, earn awards and badges." },
  { icon: "📊", title: "Full Analytics", body: "Radar breakdowns, strengths, weaknesses, captain picks, xG, momentum graphs and a lifetime stats dashboard." },
];

export default function Home() {
  const playerCount = getAllPlayers().length;
  const detailedSquads = SQUADS.length;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:pt-36">
      {/* HERO */}
      <section className="relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <span className="chip mx-auto mb-5 w-fit bg-[rgba(34,224,255,0.12)] text-cyan gold-border">
            ★ Unofficial fan-made simulator
          </span>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl md:text-7xl">
            Build The Greatest
            <br />
            <span className="text-gradient-gold">Champions XI</span> Ever
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted sm:text-lg">
            Draft legendary footballers from every European Cup era and lead your squad through the
            modern league phase to continental glory.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/draft" className="btn btn-gold w-full sm:w-auto" onClick={() => play("select")}>
              ⚡ Start Draft
            </Link>
            <a href="#how" className="btn btn-ghost w-full sm:w-auto" onClick={() => play("click")}>
              How It Works
            </a>
          </div>
        </motion.div>

        {/* floating trophy silhouette */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 -z-10 -translate-x-1/2 text-[16rem] opacity-[0.06] sm:text-[22rem]"
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          🏆
        </motion.div>
      </section>

      {/* COUNTERS */}
      <section className="mt-20 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { to: CLUB_REGISTRY.length, suffix: "+", label: "Historic Clubs" },
          { to: playerCount, suffix: "+", label: "Rated Players" },
          { to: detailedSquads, suffix: "", label: "Legendary Squads" },
          { to: 34, suffix: "", label: "Years of History" },
        ].map((c) => (
          <div key={c.label} className="glass rounded-2xl px-3 py-6">
            <AnimatedCounter to={c.to} suffix={c.suffix} label={c.label} />
          </div>
        ))}
      </section>

      {/* FEATURES */}
      <section id="how" className="mt-24 scroll-mt-24">
        <div className="text-center">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
            How It <span className="text-gradient-cyan">Works</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Each round offers one real squad from one exact season. Pick a single player, lock them
            forever, and keep going until your XI is complete.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -6 }}
              className="glass stadium-glow rounded-2xl p-5"
            >
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* STEPS */}
      <section className="mt-24">
        <div className="glass-strong rounded-3xl p-6 sm:p-10">
          <div className="grid gap-8 md:grid-cols-4">
            {[
              ["1", "Pick a mode", "Classic shows every rating. Expert hides them — only name, club, position and season."],
              ["2", "Draft your XI", "Choose one player per round from a random legendary squad. No repeats."],
              ["3", "Enter the phase", "Your XI joins 35 clubs in the 36-team Swiss league table."],
              ["4", "Win it all", "Survive the knockouts and lift the trophy. Save it to your profile."],
            ].map(([n, t, b]) => (
              <div key={n} className="relative">
                <div className="font-display text-5xl font-extrabold text-gold/25">{n}</div>
                <h4 className="mt-1 font-display font-bold">{t}</h4>
                <p className="mt-1 text-sm text-muted">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLAY INSTANTLY — no accounts */}
      <section className="mt-24 text-center">
        <div className="glass mx-auto max-w-2xl rounded-3xl p-8">
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Play Instantly</h2>
          <p className="mx-auto mt-3 max-w-md text-muted">
            No sign-up, no login, no accounts. Your drafts, trophies, achievements and stats are saved
            right here on your device — pick up exactly where you left off, every time.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/draft" className="btn btn-cyan" onClick={() => play("select")}>
              ⚡ Start Playing
            </Link>
          </div>
        </div>
      </section>

      <footer className="mt-24 border-t border-white/8 pt-8 text-center text-xs text-muted/70">
        <p>Continental XI · An original, unofficial fan project. Not affiliated with UEFA or any club.</p>
        <p className="mt-1">No official logos, branding or protected assets are used.</p>
      </footer>
    </div>
  );
}
