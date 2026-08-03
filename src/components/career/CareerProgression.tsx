"use client";

import { motion } from "framer-motion";
import { useC } from "@/lib/career/copy";
import { useLang } from "@/lib/i18n";
import { useFxLevel } from "@/lib/fx";
import { LEGACY_TIERS, LEGACY_TITLES, type LegacyTier } from "@/lib/career/legacy";
import { TrophyArt, type TrophyId } from "@/components/career/TrophyArt";

/**
 * The career ladder as a road, not a progress bar.
 *
 * The tiers are the real ones the legacy engine scores against
 * (lib/career/legacy.ts), not invented milestones, so the marker moves as a
 * career genuinely progresses and the tier ahead is the one really being
 * chased. Milestones stand on a lit surface that recedes with the tiers still
 * to come; the ones already reached carry their own colour and cast a
 * reflection, the rest sit dark.
 *
 * The surface is one `rotateX` on a static element and the reflections are
 * `scaleY(-1)` copies — both compositor-cheap, both painted once. Under
 * reduced fx the perspective and the reflections drop out and the row
 * flattens, which is what phones get.
 */

const TIER_ACCENT: Record<LegacyTier, string> = {
  graduate: "#9aa3b2",
  professional: "#8fb8ff",
  clubHero: "#a78bfa",
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
  /** 0–100 legacy score, for the road's lit stretch. */
  score: number;
  className?: string;
}) {
  const c = useC();
  const { lang } = useLang();
  const es = lang === "es";
  const flat = useFxLevel() !== "full";
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

      {/* the road the milestones stand on */}
      <div className="relative mt-4" style={flat ? undefined : { perspective: 620, perspectiveOrigin: "50% 0%" }}>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[86px] overflow-hidden rounded-xl">
          <div className="absolute inset-0" style={{
            transform: flat ? undefined : "rotateX(58deg)",
            transformOrigin: "50% 0%",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 38%, transparent 78%)," +
              "linear-gradient(90deg, transparent, rgba(4,10,22,0.9) 92%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
          }} />
          {/* the stretch already travelled, lit in the current tier's colour */}
          <motion.div
            className="absolute bottom-0 left-0 h-full"
            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: "easeOut" }}
            style={{
              transform: flat ? undefined : "rotateX(58deg)",
              transformOrigin: "50% 0%",
              background: `linear-gradient(90deg, #5ec8d8 0%, ${accent} 100%)`,
              opacity: 0.22,
              filter: `drop-shadow(0 0 14px ${accent})`,
            }}
          />
        </div>

        {/* the milestones themselves, standing upright on the surface */}
        <ol className="relative flex gap-2 overflow-x-auto pb-[26px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LEGACY_TIERS.map((t, i) => {
            const reached = i <= current;
            const isNow = i === current;
            const a = TIER_ACCENT[t];
            return (
              <li key={t} className="flex w-[74px] shrink-0 flex-col items-center gap-1 text-center">
                <motion.div
                  animate={{ scale: isNow ? 1.14 : 1, y: isNow ? -3 : 0 }}
                  transition={{ type: "spring", stiffness: 250, damping: 20 }}
                  className="relative grid h-11 w-11 place-items-center rounded-xl"
                  style={{
                    background: reached
                      ? `linear-gradient(160deg, ${a}30, rgba(6,12,24,0.9))`
                      : "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(4,8,16,0.9))",
                    boxShadow: [
                      `inset 0 1px 0 rgba(255,255,255,${reached ? 0.35 : 0.12})`,
                      `0 0 0 1px ${isNow ? a : reached ? `${a}55` : "rgba(255,255,255,0.08)"}`,
                      isNow ? `0 0 22px 2px ${a}` : reached ? `0 6px 14px rgba(0,0,0,0.5)` : "",
                    ].filter(Boolean).join(", "),
                    opacity: reached ? 1 : 0.42,
                  }}
                >
                  <TrophyArt id={TIER_ART[t]} size={22} title={es ? LEGACY_TITLES[t].es : LEGACY_TITLES[t].en} />
                </motion.div>

                {/* what it leaves on the surface */}
                {!flat && (
                  <span aria-hidden className="pointer-events-none -mt-1 block h-6 w-11 overflow-hidden"
                    style={{
                      transform: "scaleY(-1)",
                      opacity: reached ? 0.3 : 0.12,
                      maskImage: "linear-gradient(180deg, transparent 15%, #000)",
                      WebkitMaskImage: "linear-gradient(180deg, transparent 15%, #000)",
                    }}>
                    <span className="grid h-11 w-11 place-items-center rounded-xl"
                      style={{ background: reached ? `linear-gradient(160deg, ${a}30, transparent)` : "transparent" }}>
                      <TrophyArt id={TIER_ART[t]} size={22} />
                    </span>
                  </span>
                )}

                <span className="text-[0.46rem] font-bold uppercase leading-tight tracking-wider"
                  style={{ color: isNow ? a : reached ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)" }}>
                  {(es ? LEGACY_TITLES[t].es : LEGACY_TITLES[t].en).split(" ")[0]}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
