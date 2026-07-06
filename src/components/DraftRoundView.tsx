"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { PlayerCard } from "@/components/PlayerCard";
import { Pitch } from "@/components/Pitch";
import { SQUADS } from "@/lib/players";
import { play } from "@/lib/sound";

export function DraftRoundView() {
  const router = useRouter();
  const setup = useGame((s) => s.setup)!;
  const formation = useGame((s) => s.formation)!;
  const rounds = useGame((s) => s.rounds);
  const currentRound = useGame((s) => s.currentRound);
  const choosePlayer = useGame((s) => s.choosePlayer);
  const resetDraft = useGame((s) => s.resetDraft);
  const getOffered = useGame((s) => s.getOfferedPlayers);
  const getXI = useGame((s) => s.getXI);

  const round = rounds[currentRound];
  const squad = SQUADS[round.squadIndex];
  const offered = getOffered();
  const xi = getXI();
  const slot = formation.slots[round.slotIndex];
  const progress = ((currentRound) / rounds.length) * 100;

  if (!squad) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-24 sm:pt-28">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-cyan">
            Round {currentRound + 1} / {rounds.length} · Filling {slot.pos}
          </div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
            Pick from <span className="text-gradient-gold">{squad.club}</span>
          </h1>
          <div className="text-sm text-muted">
            {squad.season - 1}-{String(squad.season).slice(2)} · {squad.coach} · {squad.honor ?? squad.league}
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
        {/* cards */}
        <div>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={currentRound}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
            >
              {offered.map((p, i) => (
                <PlayerCard
                  key={p.id}
                  player={p}
                  mode={setup.mode}
                  index={i}
                  onSelect={() => choosePlayer(p.id)}
                />
              ))}
            </motion.div>
          </AnimatePresence>
          <p className="mt-4 text-center text-xs text-muted">
            Tap a card to lock that player into your <span className="text-gold">{slot.pos}</span> slot.
            No duplicate players or seasons.
          </p>
        </div>

        {/* live pitch */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="glass rounded-2xl p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-muted">Your XI</span>
              <span className="chip bg-white/8 text-cyan">{setup.formationName}</span>
            </div>
            <Pitch formation={formation} players={xi} activeSlot={round.slotIndex} showChem />
          </div>
        </div>
      </div>
    </div>
  );
}
