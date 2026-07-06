"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { Pitch } from "@/components/Pitch";
import { RadarChart } from "@/components/RadarChart";
import { computeChemistry } from "@/lib/chemistry";
import { play } from "@/lib/sound";

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className="glass rounded-xl px-3 py-2.5 text-center">
      <div className={`font-display text-xl font-extrabold ${accent ? "text-gradient-gold" : "text-white"}`}>
        {value}
      </div>
      <div className="text-[0.6rem] font-semibold uppercase tracking-widest text-muted">{label}</div>
    </div>
  );
}

export default function SquadPage() {
  const router = useRouter();
  const formation = useGame((s) => s.formation);
  const setup = useGame((s) => s.setup);
  const draftComplete = useGame((s) => s.draftComplete);
  const getXI = useGame((s) => s.getXI);
  const getAnalysis = useGame((s) => s.getAnalysis);
  const finish = useGame((s) => s.finishDraftIntoTournament);
  const swapSlots = useGame((s) => s.swapSlots);
  const profileName = useGame((s) => s.profile.name);
  const [teamName, setTeamName] = useState("");
  const [swapSel, setSwapSel] = useState<number | null>(null);
  const [swapMsg, setSwapMsg] = useState("");

  const invalid = !formation || !setup || !draftComplete;
  useEffect(() => {
    if (invalid) router.replace("/draft");
  }, [invalid, router]);

  if (invalid) return null;

  const xi = getXI();
  const analysis = getAnalysis()!;
  const chem = computeChemistry(formation, xi);

  const startTournament = () => {
    finish(teamName || `${profileName}'s XI`);
    play("select");
    router.push("/tournament");
  };

  const onSlotTap = (i: number) => {
    if (swapSel === null) {
      setSwapSel(i);
      setSwapMsg("");
      return;
    }
    if (swapSel === i) {
      setSwapSel(null);
      return;
    }
    const ok = swapSlots(swapSel, i);
    setSwapMsg(ok ? "Swapped! Chemistry updated." : "Those players can't cover each other's positions.");
    setSwapSel(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-24 sm:pt-28">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <span className="chip mx-auto mb-3 w-fit bg-gold/15 text-gold">Draft Complete</span>
        <h1 className="font-display text-3xl font-extrabold sm:text-5xl">
          Squad <span className="text-gradient-gold">Analysis</span>
        </h1>
      </motion.div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[360px_1fr]">
        {/* pitch + radar */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-4">
            <Pitch formation={formation} players={xi} showChem activeSlot={swapSel ?? undefined} onSlotClick={onSlotTap} />
            <p className="mt-2 text-center text-[0.68rem] text-muted">
              {swapSel !== null
                ? "Now tap another player to swap positions"
                : swapMsg || "Tap two players to swap them and boost chemistry (positions must match)"}
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <h3 className="mb-2 text-center text-sm font-bold uppercase tracking-widest text-muted">Team Radar</h3>
            <RadarChart data={analysis.radar} />
          </div>
        </div>

        {/* metrics */}
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            <Stat label="Overall" value={analysis.overall} accent />
            <Stat label="Chemistry" value={analysis.chemistry} accent />
            <Stat label="Attack" value={analysis.attack} />
            <Stat label="Midfield" value={analysis.midfield} />
            <Stat label="Defense" value={analysis.defense} />
            <Stat label="Goalkeeper" value={analysis.goalkeeper} />
            <Stat label="Balance" value={analysis.balance} />
            <Stat label="Experience" value={analysis.experience} />
            <Stat label="Leadership" value={analysis.leadership} />
            <Stat label="Possession" value={analysis.possession} />
            <Stat label="Counter" value={analysis.counter} />
            <Stat label="Set Pieces" value={analysis.setPieces} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="glass rounded-2xl p-4">
              <h3 className="mb-2 text-sm font-bold text-green">✓ Strengths</h3>
              <ul className="space-y-1.5 text-sm text-white/90">
                {analysis.strengths.map((s, i) => <li key={i}>• {s}</li>)}
              </ul>
            </div>
            <div className="glass rounded-2xl p-4">
              <h3 className="mb-2 text-sm font-bold text-danger">△ Weaknesses</h3>
              <ul className="space-y-1.5 text-sm text-white/90">
                {analysis.weaknesses.map((s, i) => <li key={i}>• {s}</li>)}
              </ul>
            </div>
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <div className="text-[0.6rem] font-semibold uppercase tracking-widest text-muted">Captain</div>
                <div className="font-display font-bold text-gold">© {analysis.captain}</div>
              </div>
              {chem.partnerships.length > 0 && (
                <div className="flex-1">
                  <div className="text-[0.6rem] font-semibold uppercase tracking-widest text-muted">Historic Links</div>
                  <div className="flex flex-wrap gap-1.5">
                    {chem.partnerships.map((p) => (
                      <span key={p} className="chip bg-cyan/15 text-cyan">🤝 {p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* enter tournament */}
          <div className="glass-strong rounded-2xl p-5">
            <label className="text-[0.6rem] font-semibold uppercase tracking-widest text-muted">Team Name</label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder={`${profileName}'s XI`}
                maxLength={28}
                className="flex-1 rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold"
              />
              <button className="btn btn-gold" onClick={startTournament}>
                Enter League Phase →
              </button>
            </div>
            <button
              className="mt-3 text-xs text-muted underline-offset-2 hover:underline"
              onClick={() => { play("click"); router.push("/draft"); useGame.getState().resetDraft(); }}
            >
              Start a new draft instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
