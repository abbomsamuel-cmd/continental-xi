"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { PlayerCard } from "@/components/PlayerCard";
import { Pitch, type PitchVariant } from "@/components/Pitch";
import { SquadSpinner } from "@/components/SquadSpinner";
import { EuroSpinner, CopaSpinner } from "@/components/NationSpinner";
import { EuroScene, CopaScene } from "@/components/fx/Scenes";
import { getPool } from "@/lib/players";
import { play } from "@/lib/sound";

const POOL_BADGE: Record<string, string | null> = {
  clubs: null, euro: "🇪🇺 UEFA EURO DRAFT", copa: "🌎 COPA AMÉRICA DRAFT",
};

/* per-competition draft identity — accent, headline gradient, tracker glow */
const POOL_THEME: Record<string, { accent: string; heading: string; soft: string }> = {
  clubs: { accent: "#22e0ff", heading: "text-gradient-gold", soft: "rgba(34,224,255,0.35)" },
  euro: { accent: "#37e0ff", heading: "text-gradient-euro", soft: "rgba(55,224,255,0.4)" },
  copa: { accent: "#ffc93c", heading: "text-gradient-copa", soft: "rgba(255,201,60,0.4)" },
};

export function DraftRoundView() {
  const router = useRouter();
  const setup = useGame((s) => s.setup)!;
  const formation = useGame((s) => s.formation)!;
  const rounds = useGame((s) => s.rounds);
  const currentRound = useGame((s) => s.currentRound);
  const rerollNonce = useGame((s) => s.rerollNonce);
  const rerolls = useGame((s) => s.rerolls);
  const choosePlayer = useGame((s) => s.choosePlayer);
  const reroll = useGame((s) => s.reroll);
  const resetDraft = useGame((s) => s.resetDraft);
  const getOffered = useGame((s) => s.getOfferedPlayers);
  const getXI = useGame((s) => s.getXI);
  const [revealedKey, setRevealedKey] = useState("");

  const pool = setup.pool ?? "clubs";
  const squads = getPool(pool);
  const isIntl = pool !== "clubs";
  const theme = POOL_THEME[pool];
  const round = rounds[currentRound];
  const squad = squads[round.squadIndex];
  const offered = getOffered();
  const xi = getXI();
  const slot = formation.slots[round.slotIndex];

  if (!squad) return null;
  const key = `${currentRound}:${rerollNonce}`;
  const spinning = revealedKey !== key;
  const seasonText = isIntl ? `${squad.season}` : `${squad.season - 1}-${String(squad.season).slice(2)}`;
  const reel = isIntl ? squads.map((s) => ({ name: `${s.club} ${s.season}`, colors: s.colors })) : undefined;

  return (
    <>
      {pool === "euro" && <EuroScene />}
      {pool === "copa" && <CopaScene />}
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-24 sm:pt-28">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.accent }}>
              {POOL_BADGE[pool] ? `${POOL_BADGE[pool]} · ` : ""}Pick {currentRound + 1} of {rounds.length} · Filling {slot.pos}
            </div>
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
              {spinning ? (
                <span className="text-muted">
                  {pool === "copa" ? "Rolling the drum…" : pool === "euro" ? "Crossing Europe…" : "Spinning…"}
                </span>
              ) : (
                <>Pick from <span className={theme.heading}>{squad.club} {isIntl ? squad.season : ""}</span></>
              )}
            </h1>
            <div className="text-sm text-muted">
              {spinning
                ? (isIntl ? "Drawing which national squad you draft from" : "The reel decides which legendary squad you draft from")
                : `${seasonText} · ${squad.coach} · ${squad.honor ?? squad.league}`}
            </div>
          </div>
          <button className="btn btn-ghost text-xs" onClick={() => { resetDraft(); play("click"); router.push("/draft"); }}>
            ✕ Abandon
          </button>
        </div>

        {/* premium draft tracker — one gem per pick */}
        <div className="mt-4 flex items-center gap-1.5">
          {rounds.map((r, i) => {
            const done = i < currentRound;
            const current = i === currentRound;
            return (
              <motion.span
                key={i}
                className="relative h-2 flex-1 rounded-full"
                title={`Pick ${i + 1}: ${formation.slots[r.slotIndex].pos}`}
                animate={current ? { opacity: [1, 0.55, 1] } : undefined}
                transition={current ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}
                style={{
                  background: done
                    ? `linear-gradient(90deg, ${theme.accent}, ${theme.accent}88)`
                    : current
                      ? theme.accent
                      : "rgba(255,255,255,0.10)",
                  boxShadow: current ? `0 0 12px ${theme.soft}` : done ? `0 0 6px ${theme.soft}` : "none",
                }}
              />
            );
          })}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* wheel / orb / reel — then the cards */}
          <div>
            {spinning ? (
              <div className="py-6">
                {pool === "copa" ? (
                  <CopaSpinner
                    key={`spin-${key}`}
                    club={`${squad.club} ${squad.season}`}
                    seasonLabel={seasonText}
                    colors={squad.colors}
                    reel={reel!}
                    onDone={() => setRevealedKey(key)}
                  />
                ) : pool === "euro" ? (
                  <EuroSpinner
                    key={`spin-${key}`}
                    club={`${squad.club} ${squad.season}`}
                    seasonLabel={seasonText}
                    colors={squad.colors}
                    reel={reel!}
                    onDone={() => setRevealedKey(key)}
                  />
                ) : (
                  <SquadSpinner
                    key={`spin-${key}`}
                    club={squad.club}
                    seasonLabel={seasonText}
                    colors={squad.colors}
                    onDone={() => setRevealedKey(key)}
                  />
                )}
              </div>
            ) : (
              <>
                {/* reroll control */}
                <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    className="btn btn-ghost text-[0.68rem] disabled:opacity-40"
                    disabled={rerolls <= 0}
                    onClick={reroll}
                    title="Draw a different team for this round"
                  >
                    🔄 Re-roll Team {rerolls > 0 ? `(${rerolls} left)` : ""}
                  </button>
                  {setup.difficulty === "hard" && (
                    <span className="chip bg-danger/15 text-danger">🔥 Hard · no re-rolls</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {offered.map((p, i) => (
                    <PlayerCard
                      key={p.id}
                      player={p}
                      mode={setup.mode}
                      index={i}
                      onSelect={() => choosePlayer(p.id)}
                    />
                  ))}
                </div>
                <p className="mt-4 text-center text-xs text-muted">
                  Tap a card to lock that player into your{" "}
                  <span style={{ color: theme.accent }}>{slot.pos}</span> slot ·{" "}
                  {offered.length} available · no duplicate players or seasons.
                </p>
              </>
            )}
          </div>

          {/* live squad board */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="glass rounded-2xl p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-muted">Your XI</span>
                <span className="chip bg-white/8" style={{ color: theme.accent }}>{setup.formationName}</span>
              </div>
              <Pitch
                formation={formation}
                players={xi}
                activeSlot={round.slotIndex}
                showChem={!isIntl}
                showRatings={setup.mode !== "expert"}
                variant={pool === "clubs" ? "cl" : (pool as PitchVariant)}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
