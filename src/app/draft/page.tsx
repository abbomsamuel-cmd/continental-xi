"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { FORMATIONS } from "@/lib/formations";
import { Pitch } from "@/components/Pitch";
import { DraftRoundView } from "@/components/DraftRoundView";
import type { GameMode } from "@/lib/types";
import { play } from "@/lib/sound";

export default function DraftPage() {
  const router = useRouter();
  const setup = useGame((s) => s.setup);
  const draftComplete = useGame((s) => s.draftComplete);
  const startDraft = useGame((s) => s.startDraft);

  const [mode, setMode] = useState<GameMode>("classic");
  const [formation, setFormation] = useState("4-3-3");

  // If a completed draft exists, jump to squad review
  useEffect(() => {
    if (draftComplete) router.replace("/squad");
  }, [draftComplete, router]);

  if (draftComplete) return null;
  if (setup) return <DraftRoundView />;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:pt-32">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="font-display text-3xl font-extrabold sm:text-5xl">
          Set Up Your <span className="text-gradient-gold">Draft</span>
        </h1>
        <p className="mt-3 text-muted">Choose your challenge and shape, then build your XI.</p>
      </motion.div>

      {/* MODE */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted">Game Mode</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            { id: "classic", title: "Classic", tag: "Show everything", body: "Ratings, all six attributes, chemistry and full stats are visible on every card." },
            { id: "expert", title: "Expert", tag: "Knowledge test", body: "Overall and attributes hidden. Only name, club, position and season — reward real football knowledge." },
          ] as const).map((m) => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); play("click"); }}
              className={`glass relative overflow-hidden rounded-2xl p-5 text-left transition-all ${
                mode === m.id ? "ring-2 ring-gold" : "hover:ring-1 hover:ring-white/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold">{m.title}</h3>
                <span className={`chip ${mode === m.id ? "bg-gold/20 text-gold" : "bg-white/8 text-muted"}`}>
                  {m.tag}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{m.body}</p>
            </button>
          ))}
        </div>
      </section>

      {/* FORMATION */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted">Formation</h2>
        <div className="grid gap-6 md:grid-cols-[1fr_auto]">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FORMATIONS.map((f) => (
              <button
                key={f.name}
                onClick={() => { setFormation(f.name); play("click"); }}
                className={`glass rounded-xl px-3 py-4 text-center font-display font-bold transition-all ${
                  formation === f.name ? "ring-2 ring-cyan text-cyan" : "text-white/80 hover:text-white"
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={formation}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-[280px] justify-self-center"
            >
              <Pitch
                formation={FORMATIONS.find((f) => f.name === formation)!}
                players={FORMATIONS.find((f) => f.name === formation)!.slots.map(() => null)}
                showChem={false}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <div className="mt-12 flex justify-center">
        <button
          className="btn btn-gold px-10"
          onClick={() => { startDraft(mode, formation); play("select"); }}
        >
          Begin Draft →
        </button>
      </div>
    </div>
  );
}
