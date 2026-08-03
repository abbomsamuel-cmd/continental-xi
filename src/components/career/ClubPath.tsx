"use client";

import { motion } from "framer-motion";
import { useC } from "@/lib/career/copy";
import { useLang } from "@/lib/i18n";
import { seasonTrophies, resolveHonour } from "@/lib/career/competitions";
import { TrophyArt, TROPHY_META, type TrophyId } from "@/components/career/TrophyArt";
import type { CareerSeason } from "@/lib/career/types";

/**
 * CLUB PATH — the career's silverware as a staircase, smallest cup on the
 * bottom step and the biggest thing ever won at the top.
 *
 * The climb is the point: it's built from what the player has actually won,
 * ordered by weight of competition, so an empty case is a flat floor and a
 * great career is a visible ascent. Duplicates stack onto one step with a
 * multiplier rather than repeating a trophy six times.
 */

/** Weight of a piece of silverware — decides which step it stands on. */
const KIND_RANK: Record<string, number> = {
  award: 0, cup: 1, league: 2, continental: 3, international: 4,
};
/** A few pieces outrank their class: the Ballon d'Or isn't a squad award. */
const OVERRIDE: Partial<Record<TrophyId, number>> = {
  "ballon-dor": 3.5, "the-best": 3.2, "world-cup": 5, "champions-league": 3.8,
};

interface Step { id: TrophyId; en: string; es: string; count: number; rank: number }

function buildPath(seasons: CareerSeason[], intlHonours: string[]): Step[] {
  const byId = new Map<string, Step>();
  const add = (id: TrophyId, en: string, es: string) => {
    const prev = byId.get(id);
    if (prev) { prev.count++; return; }
    byId.set(id, {
      id, en, es, count: 1,
      rank: OVERRIDE[id] ?? KIND_RANK[TROPHY_META[id]?.kind ?? "cup"] ?? 1,
    });
  };
  for (const s of seasons) for (const t of seasonTrophies(s)) add(t.id, t.en, t.es);
  for (const h of intlHonours) {
    const t = resolveHonour(h.split(" ·")[0].trim());
    add(t.id, t.en, t.es);
  }
  // heaviest last — it takes the top step
  return [...byId.values()].sort((a, b) => a.rank - b.rank || a.count - b.count);
}

const RISE = 30;   // px each step climbs
const SHIFT = 11;  // % each step moves right
const MAX_STEPS = 7;

export function ClubPath({
  seasons, intlHonours = [], className = "",
}: {
  seasons: CareerSeason[];
  intlHonours?: string[];
  className?: string;
}) {
  const c = useC();
  const es = useLang().lang === "es";
  const all = buildPath(seasons, intlHonours);
  // too many to draw: keep the heaviest, count the rest onto the bottom step
  const shown = all.slice(-MAX_STEPS);
  const hidden = all.length - shown.length;
  const titles = all.reduce((n, s) => n + s.count, 0);
  const height = 78 + Math.max(shown.length, 3) * RISE;

  return (
    <section className={`relative overflow-hidden rounded-2xl border border-white/8 bg-[#0c0c10] p-3 ${className}`}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-[0.5rem] font-bold uppercase tracking-[0.28em] text-white/35">
          {c("Club Path", "Camino")}
        </h2>
        {titles > 0 && (
          <span className="font-display text-[0.62rem] font-black text-gold">
            {titles} {c("titles", "títulos")}
          </span>
        )}
      </div>

      {/* the light falling on the climb */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-2/3" style={{
        background: "radial-gradient(60% 90% at 68% 0%, rgba(242,201,76,0.16), transparent 70%)",
      }} />

      <div className="relative mt-2" style={{ height }}>
        {shown.length === 0 ? (
          <div className="absolute inset-x-0 bottom-0">
            <div className="h-9 rounded-t-[3px]" style={{ background: "linear-gradient(180deg,#333b47,#20262f)" }} />
            <div className="absolute inset-x-0 bottom-12 text-center">
              <TrophyArt id="league-trophy" size={30} />
              <p className="mt-1 text-[0.55rem] font-semibold uppercase tracking-widest text-white/25">
                {c("No silverware yet", "Sin títulos aún")}
              </p>
            </div>
          </div>
        ) : (
          shown.map((s, i) => {
            const treadTop = 22 + (i + 1) * RISE;
            return (
              <div key={s.id}>
                {/* the step — a block rising from the floor, each set back right */}
                <motion.div
                  className="absolute rounded-t-[3px]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                  style={{
                    left: `${5 + i * SHIFT}%`,
                    width: "48%",
                    bottom: 0,
                    height: treadTop,
                    background: "linear-gradient(180deg,#5d6674 0%,#39414d 22%,#232932 100%)",
                    boxShadow: "inset 0 2px 0 rgba(255,255,255,0.22), inset -6px 0 12px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.5)",
                    zIndex: 10 - i,
                  }}
                />
                {/* the trophy standing on that step's tread */}
                <motion.div
                  className="absolute flex flex-col items-center"
                  // the -50% centring rides in the motion props: Framer owns
                  // `transform` here and would drop an inline translate
                  initial={{ opacity: 0, scale: 0.6, x: "-50%" }}
                  animate={{ opacity: 1, scale: 1, x: "-50%" }}
                  transition={{ delay: 0.12 + i * 0.06, type: "spring", stiffness: 260, damping: 18 }}
                  style={{ left: `${29 + i * SHIFT}%`, bottom: treadTop, zIndex: 20 - i }}
                >
                  <span className="relative">
                    <TrophyArt id={s.id} size={i >= shown.length - 2 ? 40 : 30} title={es ? s.es : s.en} />
                    {s.count > 1 && (
                      <span className="absolute -right-2 -top-1 rounded-full bg-gold px-1 text-[0.5rem] font-black text-[#2a1e00]">
                        ×{s.count}
                      </span>
                    )}
                  </span>
                </motion.div>
              </div>
            );
          })
        )}

        {hidden > 0 && (
          <span className="absolute bottom-1 left-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[0.5rem] font-bold text-white/55">
            +{hidden} {c("more", "más")}
          </span>
        )}
      </div>

      {/* what's standing on the top step, named */}
      {shown.length > 0 && (
        <p className="mt-1 truncate text-center text-[0.58rem] font-bold uppercase tracking-wider text-gold/80">
          {es ? shown[shown.length - 1].es : shown[shown.length - 1].en}
        </p>
      )}
    </section>
  );
}
