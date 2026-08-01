"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { play } from "@/lib/sound";
import { momentById } from "@/lib/career/moments";
import type { CareerPlayer } from "@/lib/career/types";
import { CountryFlag } from "./CountryFlag";
import { ClubCrest } from "./ClubCrest";

/**
 * A Career Moment — the season pauses for a decision. Blurred backdrop, a
 * premium centred panel on desktop and a full-height sheet on mobile, the
 * relevant crest or flag, 2–4 choices, then the immediate consequence before
 * the season resumes.
 */
export function CareerMomentModal({ momentId, player, onResolve }: {
  momentId: string;
  player: CareerPlayer;
  onResolve: (choiceId: string) => void;
}) {
  const { lang } = useLang();
  const es = lang === "es";
  const m = momentById(momentId);
  const [chosen, setChosen] = useState<string | null>(null);

  if (!m) { onResolve("__missing"); return null; }
  const choice = chosen ? m.choices.find((c) => c.id === chosen) : null;

  const emblem =
    m.category === "national" ? <CountryFlag country={player.nationality} size={40} />
      : (m.category === "club" || m.category === "transfer") ? <ClubCrest short={player.currentClubShort} colors={player.currentClubColors} size={52} />
        : <span className="grid h-13 w-13 place-items-center rounded-2xl border border-white/12 bg-white/5 text-3xl" style={{ width: 52, height: 52 }}>{m.icon}</span>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center"
      style={{ backdropFilter: "blur(6px)" }}>
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 18 }}
        className="w-full max-w-lg rounded-t-3xl border border-white/12 bg-gradient-to-br from-[#0d1428] to-[#070b18] p-6 sm:rounded-3xl sm:p-8">
        <div className="flex items-center gap-3">
          {emblem}
          <div>
            <div className="text-[0.55rem] font-bold uppercase tracking-[0.3em] text-gold/70">
              {es ? { club: "Club", national: "Selección", media: "Prensa", training: "Entrenamiento", medical: "Médico", transfer: "Fichajes" }[m.category]
                : { club: "Club", national: "National Team", media: "Media", training: "Training", medical: "Medical", transfer: "Transfer" }[m.category]}
            </div>
            <h2 className="font-display text-xl font-black leading-tight text-white sm:text-2xl">{es ? m.titleEs : m.titleEn}</h2>
          </div>
        </div>

        {!choice ? (
          <>
            <p className="mt-4 text-sm leading-relaxed text-white/70">{es ? m.descEs : m.descEn}</p>
            <div className="mt-5 space-y-2">
              {m.choices.map((c) => (
                <button key={c.id} onClick={() => { play("select"); setChosen(c.id); }}
                  className="flex w-full items-center justify-between rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-left font-semibold text-white transition-colors hover:border-gold/40 hover:bg-gold/[0.06]">
                  {es ? c.es : c.en}
                  <span className="text-white/30">→</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mt-5 rounded-xl border border-gold/25 bg-gold/[0.07] p-4">
              <div className="font-display text-base font-extrabold text-gold">{es ? choice.es : choice.en}</div>
              {(choice.outEn || choice.outEs) && (
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">{es ? (choice.outEs ?? choice.outEn) : (choice.outEn ?? choice.outEs)}</p>
              )}
            </div>
            <button onClick={() => { play("click"); onResolve(choice.id); }} className="btn btn-career mt-5 w-full">{es ? "Continuar" : "Continue"} →</button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
