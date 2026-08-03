"use client";

import { motion } from "framer-motion";
import { useC } from "@/lib/career/copy";
import { useLang } from "@/lib/i18n";
import { seasonTrophies } from "@/lib/career/competitions";
import { TrophyArt } from "@/components/career/TrophyArt";
import { ClubCrest } from "@/components/career/ClubCrest";
import { CountryFlag } from "@/components/career/CountryFlag";
import type { TimelineChapter } from "@/lib/career/chapters";
import type { CareerPlayer } from "@/lib/career/types";

/**
 * CLUB TIMELINE — the trajectory, as a rail the career climbs down.
 *
 * Every club the player actually turned out for appears, in order: a chapter
 * covers two seasons, so a mid-chapter transfer shows BOTH badges with the
 * move between them rather than collapsing to wherever the player finished.
 * That's the difference between a résumé and a trajectory — you can see the
 * step up (or down) that each move was, alongside what it did to the rating
 * and what the player produced while there.
 */

const ROW_H = 88;
const RAIL_W = 54;

/** Distinct clubs across a chapter, in the order they were played for. */
function clubsOf(ch: TimelineChapter) {
  const out: { id: string; name: string; short: string; colors: [string, string] }[] = [];
  for (const s of ch.seasons) {
    if (out.length && out[out.length - 1].id === s.clubId) continue;
    out.push({ id: s.clubId, name: s.clubName, short: s.clubShort, colors: s.clubColors });
  }
  if (!out.length) out.push({ id: ch.clubId, name: ch.clubName, short: ch.clubShort, colors: ch.clubColors });
  return out;
}

function ovrTone(v: number): string {
  if (v >= 85) return "#f2c94c";
  if (v >= 80) return "#8fb8ff";
  if (v >= 74) return "#b3bccb";
  if (v >= 67) return "#9aa3b2";
  return "#e6a25b";
}

/** The rail's x at row i — a slow arc, so the column reads as a curve. */
const railX = (i: number, n: number) => RAIL_W / 2 + Math.sin(((i + 0.5) / Math.max(n, 1)) * Math.PI) * 15;

/** A smooth path through the row anchors (midpoint-smoothed, no libraries). */
function railPath(n: number): string {
  if (n === 0) return "";
  const pt = (i: number): [number, number] => [railX(i, n), i * ROW_H + ROW_H / 2];
  const [x0, y0] = pt(0);
  let d = `M ${x0} ${y0}`;
  for (let i = 1; i < n; i++) {
    const [px, py] = pt(i - 1);
    const [cx, cy] = pt(i);
    d += ` C ${px} ${py + ROW_H / 2}, ${cx} ${cy - ROW_H / 2}, ${cx} ${cy}`;
  }
  return d;
}

export function ClubTimeline({
  chapters, player, intl, nextAge, playing, className = "",
}: {
  chapters: TimelineChapter[];
  player: CareerPlayer;
  /** the international résumé, already resolved by the caller */
  intl: { caps: number; goals: number; assists: number };
  /** the age about to be played — drawn as the open node at the foot */
  nextAge: number | null;
  /** the open node is mid-simulation */
  playing?: boolean;
  className?: string;
}) {
  const c = useC();
  const es = useLang().lang === "es";
  const caps = intl.caps;

  const rows = chapters.length + (nextAge !== null ? 1 : 0) + (caps > 0 ? 1 : 0);

  return (
    <section className={`relative overflow-hidden rounded-2xl border border-white/8 bg-[#0c0c10] p-3 ${className}`}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-[0.5rem] font-bold uppercase tracking-[0.28em] text-white/35">
          {c("Club Timeline", "Trayectoria")}
        </h2>
        <span className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-white/25">
          {c("Apps · Goals · Assists", "PJ · Gol · Asis")}
        </span>
      </div>

      <div className="relative mt-2" style={{ minHeight: rows * ROW_H }}>
        {/* the rail itself, running behind every node */}
        <svg
          aria-hidden
          className="pointer-events-none absolute left-0 top-0"
          width={RAIL_W}
          height={rows * ROW_H}
          style={{ overflow: "visible" }}
        >
          <defs>
            <linearGradient id="cxi-rail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c9a7ff" />
              <stop offset="55%" stopColor="#e6b81f" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <path d={railPath(rows)} fill="none" stroke="url(#cxi-rail)" strokeWidth={2.5}
            strokeLinecap="round" opacity={0.55} />
          <path d={railPath(rows)} fill="none" stroke="url(#cxi-rail)" strokeWidth={7}
            strokeLinecap="round" opacity={0.12} />
        </svg>

        {chapters.map((ch, i) => (
          <Row key={ch.fromAge} i={i} n={rows} ch={ch} es={es} c={c} />
        ))}

        {nextAge !== null && (
          <OpenRow i={chapters.length} n={rows} age={nextAge} playing={!!playing} c={c} />
        )}

        {caps > 0 && (
          <NationRow
            i={rows - 1} n={rows}
            nation={player.nationality}
            caps={caps}
            goals={intl.goals}
            assists={intl.assists}
            c={c}
          />
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Node({ i, n, children, ring, glow }: {
  i: number; n: number; children: React.ReactNode; ring: string; glow?: boolean;
}) {
  return (
    <span
      className="absolute z-10 grid place-items-center rounded-full font-display text-[0.78rem] font-black text-white"
      style={{
        left: railX(i, n) - 17,
        top: i * ROW_H + ROW_H / 2 - 17,
        width: 34,
        height: 34,
        background: "radial-gradient(60% 60% at 50% 30%, #1a2135, #0a0f1b)",
        boxShadow: `0 0 0 2px ${ring}${glow ? `, 0 0 16px ${ring}` : ""}`,
      }}
    >
      {children}
    </span>
  );
}

function Row({ i, n, ch, es, c }: {
  i: number; n: number; ch: TimelineChapter; es: boolean; c: (en: string, s: string) => string;
}) {
  const clubs = clubsOf(ch);
  const trophies = ch.seasons.flatMap((s) => seasonTrophies(s));
  const tone = ovrTone(ch.overallTo);
  const rise = ch.overallTo - ch.overallFrom;

  return (
    <>
      <Node i={i} n={n} ring={clubs[clubs.length - 1].colors[0]}>{ch.fromAge}</Node>
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.05, duration: 0.3 }}
        className="absolute rounded-xl px-2.5 py-1.5"
        style={{
          left: RAIL_W + 20,
          right: 0,
          top: i * ROW_H + 8,
          height: ROW_H - 16,
          background: `linear-gradient(90deg, ${clubs[clubs.length - 1].colors[0]}2e, rgba(255,255,255,0.03) 70%)`,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)",
        }}
      >
        {/* who he played for — every club in the chapter, in order */}
        <div className="flex items-center gap-1.5">
          {clubs.map((cl, k) => (
            <span key={cl.id + k} className="flex min-w-0 items-center gap-1">
              {k > 0 && <span className="text-[0.62rem] text-cyan-300">→</span>}
              <ClubCrest short={cl.short} colors={cl.colors} size={20} />
            </span>
          ))}
          <span className="min-w-0 flex-1 truncate font-display text-[0.82rem] font-extrabold text-white">
            {clubs[clubs.length - 1].name}
          </span>
          <span className="flex shrink-0 items-center gap-0.5">
            {trophies.slice(0, 3).map((t, k) => <TrophyArt key={k} id={t.id} size={15} title={es ? t.es : t.en} />)}
          </span>
          {ch.injured && <span className="shrink-0 text-[0.66rem]" title={c("Injured", "Lesionado")}>🩹</span>}
        </div>

        {/* what it did to him, and what he produced */}
        <div className="mt-1.5 flex items-center gap-2">
          <span className="flex items-baseline gap-1 rounded-md bg-black/35 px-1.5 py-0.5">
            <span className="text-[0.44rem] font-bold uppercase tracking-[0.18em] text-white/35">OVR</span>
            <span className="font-display text-[0.62rem] font-bold text-white/45">{ch.overallFrom}</span>
            <span className="text-[0.56rem] text-white/30">→</span>
            <span className="font-display text-[0.86rem] font-black leading-none" style={{ color: tone }}>{ch.overallTo}</span>
            {rise !== 0 && (
              <span className="text-[0.5rem] font-bold" style={{ color: rise > 0 ? "#7ee081" : "#ff8a8a" }}>
                {rise > 0 ? "+" : ""}{rise}
              </span>
            )}
          </span>
          <StatTriple apps={ch.apps} goals={ch.goals} assists={ch.assists} />
          {ch.avgRating > 0 && (
            <span className="ml-auto shrink-0 font-display text-[0.7rem] font-black tabular-nums" style={{ color: tone }}>
              {ch.avgRating.toFixed(1)}
            </span>
          )}
        </div>
      </motion.div>
    </>
  );
}

function StatTriple({ apps, goals, assists }: { apps: number; goals: number; assists: number }) {
  return (
    <span className="flex items-center gap-1 font-display text-[0.8rem] font-black tabular-nums text-white">
      <span title="Apps">{apps}</span>
      <span className="text-white/20">|</span>
      <span title="Goals">{goals}</span>
      <span className="text-white/20">|</span>
      <span className="text-white/70" title="Assists">{assists}</span>
    </span>
  );
}

/** The chapter that hasn't been played yet. */
function OpenRow({ i, n, age, playing, c }: {
  i: number; n: number; age: number; playing: boolean; c: (en: string, s: string) => string;
}) {
  return (
    <>
      <Node i={i} n={n} ring="#8b5cf6" glow>{age}</Node>
      <div
        className="absolute flex items-center rounded-xl px-2.5"
        style={{
          left: RAIL_W + 20, right: 0, top: i * ROW_H + 8, height: ROW_H - 16,
          background: "rgba(139,92,246,0.10)",
          boxShadow: "inset 0 0 0 1px rgba(139,92,246,0.35)",
        }}
      >
        <motion.span
          animate={playing ? { opacity: [0.45, 1, 0.45] } : {}}
          transition={{ duration: 1.1, repeat: Infinity }}
          className="text-[0.8rem] font-bold text-[#c4b5fd]"
        >
          {playing ? c("Playing…", "Jugando…") : c("Unwritten", "Por escribir")}
        </motion.span>
      </div>
    </>
  );
}

/** The international career, at the foot of the rail. */
function NationRow({ i, n, nation, caps, goals, assists, c }: {
  i: number; n: number; nation: string; caps: number; goals: number; assists: number;
  c: (en: string, s: string) => string;
}) {
  return (
    <>
      <Node i={i} n={n} ring="#e6b81f"><CountryFlag country={nation} size={18} /></Node>
      <div
        className="absolute flex items-center gap-2 rounded-xl px-2.5"
        style={{
          left: RAIL_W + 20, right: 0, top: i * ROW_H + 8, height: ROW_H - 16,
          background: "linear-gradient(90deg, rgba(242,201,76,0.22), rgba(255,255,255,0.03) 70%)",
          boxShadow: "inset 0 0 0 1px rgba(242,201,76,0.32)",
        }}
      >
        <CountryFlag country={nation} size={20} />
        <span className="min-w-0 flex-1 truncate font-display text-[0.82rem] font-extrabold text-white">{nation}</span>
        <span className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-gold/70">{c("Int", "Sel")}</span>
        <StatTriple apps={caps} goals={goals} assists={assists} />
      </div>
    </>
  );
}
