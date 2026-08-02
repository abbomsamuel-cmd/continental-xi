"use client";

import { motion } from "framer-motion";
import { useC } from "@/lib/career/copy";
import { useLang } from "@/lib/i18n";
import { LEGACY_TIERS, LEGACY_TITLES, type LegacyTier } from "@/lib/career/legacy";
import { TrophyArt, type TrophyId } from "@/components/career/TrophyArt";

/**
 * The career ladder — every tier from academy graduate to greatest of all
 * time, with where this player actually stands.
 *
 * The tiers are the real ones the legacy engine scores against
 * (lib/career/legacy.ts), not invented milestones, so the marker moves as a
 * career genuinely progresses and the tier ahead is the one really being
 * chased. Reached tiers light up; the rest sit dim.
 */

const TIER_ACCENT: Record<LegacyTier, string> = {
  graduate: "#9aa3b2",
  professional: "#8fb8ff",
  clubHero: "#5ec8d8",
  nationalHero: "#7ee081",
  elite: "#c9a7ff",
  worldClass: "#ffd88a",
  legend: "#f2c14e",
  goatCandidate: "#ffae57",
  goat: "#ffd54a",
};

/** A piece of silverware standing in for each rung, heaviest at the top. */
const TIER_ART: Record<LegacyTier, TrophyId> = {
  graduate: "young-player",
  professional: "league-trophy",
  clubHero: "domestic-cup",
  nationalHero: "euro",
  elite: "champions-league",
  worldClass: "the-best",
  legend: "ballon-dor",
  goatCandidate: "world-cup",
  goat: "world-cup",
};

export function CareerProgression({
  tier, score, className = "",
}: {
  tier: LegacyTier;
  /** 0–100 legacy score, for the rail fill. */
  score: number;
  className?: string;
}) {
  const c = useC();
  const { lang } = useLang();
  const es = lang === "es";
  const current = LEGACY_TIERS.indexOf(tier);
  const next = current < LEGACY_TIERS.length - 1 ? LEGACY_TIERS[current + 1] : null;
  const accent = TIER_ACCENT[tier];
  const pct = ((current + 1) / LEGACY_TIERS.length) * 100;

  return (
    <section className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 ${className}`}
      style={{ background: "rgba(9,17,33,0.82)", borderColor: `${accent}3a`, boxShadow: `0 0 26px ${accent}1f` }}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[0.52rem] font-bold uppercase tracking-[0.3em]" style={{ color: accent }}>
          {c("Career Path", "Trayectoria")}
        </div>
        <div className="font-display text-[0.72rem] font-extrabold" style={{ color: accent }}>
          {c("Legacy", "Legado")} {Math.round(score)}
        </div>
      </div>

      <h3 className="mt-1 font-display text-xl font-black leading-none text-white">
        {es ? LEGACY_TITLES[tier].es : LEGACY_TITLES[tier].en}
      </h3>
      {next && (
        <p className="mt-1 text-[0.7rem] text-white/55">
          {c("Next", "Siguiente")}: <span className="font-semibold" style={{ color: TIER_ACCENT[next] }}>
            {es ? LEGACY_TITLES[next].es : LEGACY_TITLES[next].en}
          </span>
        </p>
      )}

      {/* the rail, filled to the tier reached */}
      <div className="relative mt-4 h-1 rounded-full bg-white/8">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ background: `linear-gradient(90deg, #5ec8d8, ${accent})`, boxShadow: `0 0 10px ${accent}90` }}
        />
      </div>

      {/* the rungs */}
      <ol className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LEGACY_TIERS.map((t, i) => {
          const reached = i <= current;
          const isNow = i === current;
          const a = TIER_ACCENT[t];
          return (
            <li key={t} className="flex w-[74px] shrink-0 flex-col items-center gap-1.5 text-center">
              <motion.div
                animate={{ scale: isNow ? 1.12 : 1 }}
                transition={{ type: "spring", stiffness: 250, damping: 20 }}
                className="grid h-11 w-11 place-items-center rounded-full"
                style={{
                  background: reached ? `${a}1f` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isNow ? a : reached ? `${a}55` : "rgba(255,255,255,0.1)"}`,
                  boxShadow: isNow ? `0 0 14px ${a}80` : undefined,
                  opacity: reached ? 1 : 0.4,
                }}
              >
                <TrophyArt id={TIER_ART[t]} size={22} title={es ? LEGACY_TITLES[t].es : LEGACY_TITLES[t].en} />
              </motion.div>
              <span className="text-[0.46rem] font-bold uppercase leading-tight tracking-wider"
                style={{ color: isNow ? a : reached ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)" }}>
                {(es ? LEGACY_TITLES[t].es : LEGACY_TITLES[t].en).split(" ")[0]}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
