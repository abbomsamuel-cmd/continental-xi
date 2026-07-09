"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { PlayerCard } from "@/components/PlayerCard";
import { Pitch } from "@/components/Pitch";
import { SquadSpinner } from "@/components/SquadSpinner";
import { getPool } from "@/lib/players";
import { play } from "@/lib/sound";

const POOL_BADGE: Record<string, string | null> = {
  clubs: null, euro: "🏆 UEFA EURO DRAFT", copa: "🏆 COPA AMÉRICA DRAFT",
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
  const round = rounds[currentRound];
  const squad = squads[round.squadIndex];
  const offered = getOffered();
  const xi = getXI();
  const slot = formation.slots[round.slotIndex];
  const progress = (currentRound / rounds.length) * 100;

  if (!squad) return null;
  const key = `${currentRound}:${rerollNonce}`;
  const spinning = revealedKey !== key;
  const seasonText = isIntl ? `${squad.season}` : `${squad.season - 1}-${String(squad.season).slice(2)}`;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-24 sm:pt-28">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-cyan">
            {POOL_BADGE[pool] ? `${POOL_BADGE[pool]} · ` : ""}Round {currentRound + 1} / {rounds.length} · Filling {slot.pos}
          </div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
            {spinning ? (
              <span className="text-muted">Spinning…</span>
            ) : (
              <>Pick from <span className="text-gradient-gold">{squad.club} {isIntl ? squad.season : ""}</span></>
            )}
          </h1>
          <div className="text-sm text-muted">
            {spinning
              ? (isIntl ? "The reel decides which national squad you draft from" : "The reel decides which legendary squad you draft from")
              : `${seasonText} · ${squad.coach} · ${squad.honor ?? squad.league}`}
          </div>
        </div>
        <button className="btn btn-ghost text-xs" onClick={() => { resetDraft(); play("click"); router.push("/draft"); }}>
          ✕ Abandon
        </button>
      </div>

      {/* progress bar */}
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#003b8e] via-cyan to-gold"
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 100 }}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* cards or spinner */}
        <div>
          {spinning ? (
            <div className="py-6">
              <SquadSpinner
                key={`spin-${key}`}
                club={isIntl ? `${squad.club} ${squad.season}` : squad.club}
                seasonLabel={seasonText}
                colors={squad.colors}
                reel={isIntl ? squads.map((s) => ({ name: `${s.club} ${s.season}`, colors: s.colors })) : undefined}
                onDone={() => setRevealedKey(key)}
              />
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
                Tap a card to lock that player into your <span className="text-gold">{slot.pos}</span> slot ·{" "}
                {offered.length} available · no duplicate players or seasons.
              </p>
            </>
          )}
        </div>

        {/* live pitch */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="glass rounded-2xl p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-muted">Your XI</span>
              <span className="chip bg-white/8 text-cyan">{setup.formationName}</span>
            </div>
            <Pitch formation={formation} players={xi} activeSlot={round.slotIndex} showChem showRatings={setup.mode !== "expert"} />
          </div>
        </div>
      </div>
    </div>
  );
}
