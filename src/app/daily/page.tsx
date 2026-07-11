"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { play } from "@/lib/sound";

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

// Deterministic per-day formation & mode so everyone plays the identical draft.
function dailyConfig(key: string): { formation: string; mode: "classic" | "expert" } {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const forms = ["4-3-3", "4-2-3-1", "4-4-2", "3-5-2", "3-4-3", "4-1-2-1-2"];
  return { formation: forms[h % forms.length], mode: h % 3 === 0 ? "expert" : "classic" };
}

export default function DailyPage() {
  const router = useRouter();
  const startDraft = useGame((s) => s.startDraft);
  const drafts = useGame((s) => s.profile.drafts);

  const key = todayKey();
  const cfg = dailyConfig(key);
  const alreadyPlayed = drafts.find((d) => d.daily === key);

  const start = () => {
    startDraft(cfg.mode, cfg.formation, "medium", key);
    play("select");
    router.push("/draft");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:pt-36">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <span className="chip mx-auto mb-4 w-fit bg-cyan/15 text-cyan">📅 {key}</span>
        <h1 className="font-display text-4xl font-extrabold sm:text-6xl">
          Daily <span className="text-gradient-gold">Challenge</span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-muted">
          One universal draft, the same for every manager in the world today. Identical squads, identical
          order — pure skill. Compare your run on the global leaderboard.
        </p>
      </motion.div>

      <div className="glass-strong mx-auto mt-10 max-w-md rounded-3xl p-6 text-center">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[0.6rem] font-bold uppercase tracking-widest text-muted">Formation</div>
            <div className="font-display text-2xl font-extrabold text-gold">{cfg.formation}</div>
          </div>
          <div>
            <div className="text-[0.6rem] font-bold uppercase tracking-widest text-muted">Mode</div>
            <div className="font-display text-2xl font-extrabold capitalize text-cyan">{cfg.mode}</div>
          </div>
        </div>

        {alreadyPlayed ? (
          <div className="mt-6">
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-sm text-muted">Today&apos;s result</div>
              <div className="font-display text-lg font-bold">
                {alreadyPlayed.overall} OVR
              </div>
              <div className="mt-1 text-xs capitalize text-gold">
                {alreadyPlayed.result === "champion" ? "🏆 Champion!" : `Reached: ${alreadyPlayed.result}`}
              </div>
            </div>
            <button className="btn btn-ghost mt-4" onClick={start}>Replay Today&apos;s Draft</button>
          </div>
        ) : (
          <button className="btn btn-gold mt-6 w-full" onClick={start}>Play Today&apos;s Challenge →</button>
        )}
      </div>

      <div className="mx-auto mt-10 max-w-md">
        <h2 className="mb-3 text-center text-sm font-bold uppercase tracking-widest text-muted">
          Global Leaderboards
        </h2>
        <div className="glass rounded-2xl p-4">
          <p className="text-center text-sm text-muted">
            Highest Overall · Fastest Champion · Most Goals · Daily & Weekly Champions.
          </p>
          <p className="mt-2 text-center text-xs text-muted/70">
            Leaderboards sync in the hosted build. Your local best today:
            <span className="text-gold"> {bestToday(drafts, key)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function bestToday(drafts: { daily?: string; overall: number }[], key: string): string {
  const mine = drafts.filter((d) => d.daily === key);
  if (!mine.length) return "not played yet";
  return `${Math.max(...mine.map((d) => d.overall))} OVR`;
}
