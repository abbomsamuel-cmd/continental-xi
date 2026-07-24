"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { useHydrated } from "@/lib/useHydrated";
import { play } from "@/lib/sound";
import { useC, formAccent, formLabel, roleLabel } from "@/lib/career/copy";
import { useCareer, useCurrentPlayer } from "@/lib/career/store";
import { simulateChapter, type ChapterResult } from "@/lib/career/chapters";
import { statusToneColor } from "@/lib/career/status";
import { worldClubById, worldLeagueById } from "@/lib/career/world";
import { fmtMoney, fmtWage } from "@/lib/career/util";
import type { CareerPlayer, TransferOffer } from "@/lib/career/types";
import { CountryFlag } from "@/components/career/CountryFlag";
import { ClubCrest } from "@/components/career/ClubCrest";

/** A chapter's sim animation runs ~10s at 1x — the whole career fits in 5-10 min. */
const SIM_SECONDS = 10;
type Speed = 1 | 2 | 3;
type Phase = "intro" | "sim" | "summary" | "decision";

export default function ChapterPage() {
  const hydrated = useHydrated();
  const player = useCurrentPlayer();
  const c = useC();

  if (!hydrated) return <div className="min-h-screen" />;
  if (!player) {
    return (
      <div className="mx-auto max-w-md px-4 pt-32 text-center">
        <p className="text-white/55">{c("No active career.", "No hay carrera activa.")}</p>
        <Link href="/career/new" className="btn btn-gold mt-4">⚽ {c("Create Your Player", "Crea Tu Jugador")}</Link>
      </div>
    );
  }
  if (player.retired || player.age >= 38) {
    return (
      <div className="mx-auto max-w-md px-4 pt-32 text-center">
        <div className="text-5xl">🎖️</div>
        <h1 className="mt-3 font-display text-2xl font-black text-white">{c("The final whistle", "El pitido final")}</h1>
        <p className="mt-2 text-sm text-white/55">
          {c("Your playing days are done. Look back on what you built.", "Tus días como jugador han terminado. Mira atrás y observa lo que construiste.")}
        </p>
        <Link href="/career/timeline" className="btn btn-gold mt-5">{c("View Career", "Ver Carrera")}</Link>
      </div>
    );
  }
  return <ChapterRunner key={`${player.id}:${player.age}`} player={player} />;
}

function ChapterRunner({ player }: { player: CareerPlayer }) {
  const c = useC();
  const { lang } = useLang();
  const es = lang === "es";
  const router = useRouter();
  const commitChapter = useCareer((s) => s.commitChapter);
  const retireCareer = useCareer((s) => s.retireCareer);

  // The whole chapter is resolved up-front; the animation only reveals it.
  const chapter: ChapterResult = useMemo(() => simulateChapter(player), [player]);

  const [phase, setPhase] = useState<Phase>("intro");
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const pRef = useRef(0);
  const rafRef = useRef(0);

  const club = worldClubById(player.currentClubId);
  const league = club ? worldLeagueById(club.leagueId) : undefined;

  useEffect(() => {
    if (phase !== "sim") return;
    let last = performance.now();
    let alive = true;
    const tick = (t: number) => {
      if (!alive) return;
      // Clamped so returning from a hidden tab never fast-forwards the chapter.
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      if (!paused) {
        pRef.current = Math.min(1, pRef.current + (dt / SIM_SECONDS) * speed);
        setProgress(pRef.current);
        if (pRef.current >= 1) { play("advance"); setPhase("summary"); return; }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { alive = false; cancelAnimationFrame(rafRef.current); };
  }, [phase, paused, speed]);

  const skip = () => { pRef.current = 1; setProgress(1); play("click"); setPhase("summary"); };

  /* ---------------- intro ---------------- */
  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-24 sm:pt-28">
        <div className="rounded-2xl border border-white/10 bg-[#0b1122] p-6 text-center">
          <div className="text-[0.6rem] font-bold uppercase tracking-[0.35em] text-gold/70">{c("Next Chapter", "Próximo Capítulo")}</div>
          <div className="mt-2 font-display text-4xl font-black text-white sm:text-5xl">
            {player.age} <span className="text-white/30">→</span> {player.age + 2}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <ClubCrest short={player.currentClubShort} colors={player.currentClubColors} size={26} />
            <span className="font-semibold text-white/85">{player.currentClubName}</span>
            {league && <span className="text-[0.7rem] text-white/40">· {league.name}</span>}
          </div>
          <p className="mx-auto mt-4 max-w-sm text-[0.8rem] leading-relaxed text-white/50">
            {c("Two seasons will be played. You'll see how they went, then decide what comes next.",
               "Se jugarán dos temporadas. Verás cómo fueron y luego decidirás qué sigue.")}
          </p>
          <button onClick={() => { play("whistle"); setPhase("sim"); }} className="btn btn-gold mt-6 w-full sm:w-auto sm:px-10">
            ▶ {c("Play Chapter", "Jugar Capítulo")}
          </button>
        </div>
        <div className="mt-4 text-center">
          <Link href="/career" className="text-[0.68rem] font-semibold text-white/35 hover:text-white/70">{c("Back", "Atrás")}</Link>
        </div>
      </div>
    );
  }

  /* ---------------- sim ---------------- */
  if (phase === "sim") {
    const p = progress;
    const shown = Math.floor(p * chapter.beats.length);
    const feed = chapter.beats.slice(0, shown).reverse().slice(0, 6);
    const year = chapter.fromYear + Math.min(1, Math.floor(p * 2));
    const stats: [string, number][] = [
      [c("Apps", "PJ"), Math.round(chapter.apps * p)],
      [player.position === "GK" ? c("Saves", "Paradas") : c("Goals", "Goles"), Math.round(chapter.goals * p)],
      [c("Assists", "Asist."), Math.round(chapter.assists * p)],
    ];

    return (
      <div className="mx-auto max-w-2xl px-4 pt-24 sm:pt-28">
        <div className="flex items-center gap-2.5">
          <ClubCrest short={player.currentClubShort} colors={player.currentClubColors} size={30} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-base font-extrabold text-white">{player.currentClubName}</div>
            <div className="text-[0.6rem] uppercase tracking-widest text-white/40">{year}–{String((year + 1) % 100).padStart(2, "0")}</div>
          </div>
          <div className="font-display text-lg font-black text-gold">{c("Age", "Edad")} {player.age + Math.min(2, Math.floor(p * 2 + 0.001))}</div>
        </div>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <span className="block h-full rounded-full bg-gold transition-[width] duration-100" style={{ width: `${p * 100}%` }} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {stats.map(([k, v]) => (
            <div key={k} className="rounded-xl border border-white/8 bg-[#0b1122] px-3 py-2.5 text-center">
              <div className="font-display text-2xl font-extrabold text-white">{v}</div>
              <div className="text-[0.5rem] font-bold uppercase tracking-widest text-white/35">{k}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button onClick={() => { setPaused((x) => !x); play("click"); }} className="btn btn-secondary flex-1 text-sm">
            {paused ? `▶ ${c("Resume", "Reanudar")}` : `❚❚ ${c("Pause", "Pausa")}`}
          </button>
          <div className="flex overflow-hidden rounded-lg border border-white/12">
            {([1, 2, 3] as Speed[]).map((s) => (
              <button key={s} onClick={() => { setSpeed(s); play("hover"); }}
                className={`px-2.5 py-2 text-xs font-bold ${speed === s ? "bg-gold/20 text-gold" : "text-white/50"}`}>{s}×</button>
            ))}
          </div>
          <button onClick={skip} className="btn btn-ghost text-sm">⏭ {c("Skip", "Saltar")}</button>
        </div>

        <div className="mt-4 space-y-1.5">
          <AnimatePresence initial={false}>
            {feed.map((b, i) => (
              <motion.div key={`${b.month}-${b.kind}-${shown - i}`} layout
                initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-[#0b1122] px-3 py-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/6 text-sm">{b.icon ?? "◆"}</span>
                <span className="min-w-0 flex-1 text-[0.78rem] text-white/75">{(es ? b.es : b.en) ?? ""}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {feed.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 py-5 text-center text-[0.72rem] text-white/35">
              {c("The chapter is under way…", "El capítulo está en marcha…")}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- summary ---------------- */
  if (phase === "summary") {
    return <ChapterSummary chapter={chapter} player={player} onContinue={() => setPhase("decision")} />;
  }

  /* ---------------- decision ---------------- */
  const commit = (action: Parameters<typeof commitChapter>[1]) => {
    play("whistle");
    commitChapter(chapter.playerAfter, action);
    router.push("/career");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-10 pt-24 sm:pt-28">
      <h1 className="font-display text-2xl font-black text-white sm:text-3xl">{c("What happens next?", "¿Qué sigue ahora?")}</h1>
      <p className="mt-1 text-sm text-white/50">
        {chapter.offers.length > 0
          ? c("Clubs have made their move. Your current club is always an option.", "Los clubes han movido ficha. Tu club actual siempre es una opción.")
          : c("No offers this window. Stay and keep proving yourself.", "Sin ofertas esta ventana. Quédate y sigue demostrando.")}
      </p>

      <div className="mt-4 space-y-3">
        {chapter.offers.map((o) => <OfferCard key={o.clubId} offer={o} onAccept={() => commit({ type: "transfer", offer: o })} c={c} es={es} />)}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => commit({ type: "stay" })} className="btn btn-secondary text-sm">
          {c("Stay at", "Quedarme en")} {chapter.playerAfter.currentClubShort}
        </button>
        {chapter.contractExpiring && (
          <button onClick={() => commit({ type: "renew" })} className="btn btn-gold text-sm">{c("Renew Contract", "Renovar Contrato")}</button>
        )}
        {chapter.playerAfter.age >= 34 && (
          <button onClick={() => { retireCareer(useCareer.getState().currentId ?? ""); router.push("/career"); }}
            className="btn btn-ghost text-sm text-white/50">{c("Retire", "Retirarme")}</button>
        )}
      </div>
    </div>
  );
}

/* ---------------- the payoff card ---------------- */
function ChapterSummary({ chapter, player, onContinue }: { chapter: ChapterResult; player: CareerPlayer; onContinue: () => void }) {
  const c = useC();
  const { lang } = useLang();
  const es = lang === "es";
  const grew = chapter.overallTo - chapter.overallFrom;
  const mv = chapter.marketValueTo - chapter.marketValueFrom;
  const isGk = player.position === "GK";
  const club = worldClubById(chapter.playerAfter.currentClubId);

  const stats: [string, string | number][] = [
    [c("Apps", "Partidos"), chapter.apps],
    [isGk ? c("Clean Sheets", "Porterías 0") : c("Goals", "Goles"), chapter.goals],
    [c("Assists", "Asistencias"), chapter.assists],
    [c("Avg Rating", "Nota Media"), chapter.avgRating.toFixed(1)],
  ];
  const trophies = [...new Set(chapter.honours)].map((h) => ({ h, n: chapter.honours.filter((x) => x === h).length }));

  return (
    <div className="mx-auto max-w-2xl px-4 pb-10 pt-24 sm:pt-28">
      <div className="text-center">
        <div className="text-[0.6rem] font-bold uppercase tracking-[0.35em] text-gold/70">{c("Chapter Complete", "Capítulo Completo")}</div>
        <h1 className="mt-1 font-display text-3xl font-black text-white sm:text-4xl">
          {c("Age", "Edad")} {chapter.fromAge} <span className="text-white/30">→</span> {chapter.toAge}
        </h1>
        <div className="mt-1.5 flex items-center justify-center gap-2 text-sm text-white/60">
          <ClubCrest short={chapter.playerAfter.currentClubShort} colors={chapter.playerAfter.currentClubColors} size={18} />
          {chapter.playerAfter.currentClubName}
        </div>
        <p className="mt-3 font-display text-base font-bold text-gold">{es ? chapter.keyEventEs : chapter.keyEventEn}</p>
      </div>

      {/* overall movement — the headline number */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-[#0b1122] p-5 text-center">
        <div className="text-[0.55rem] font-bold uppercase tracking-[0.25em] text-white/35">{c("Overall", "Media")}</div>
        <div className="mt-1 font-display text-4xl font-black">
          <span className="text-white/50">{chapter.overallFrom}</span>
          <span className="mx-2 text-white/25">→</span>
          <span style={{ color: grew > 0 ? "#7ee081" : grew < 0 ? "#ff6b6b" : "#fff" }}>{chapter.overallTo}</span>
          <span className="ml-2 text-lg" style={{ color: grew > 0 ? "#7ee081" : grew < 0 ? "#ff6b6b" : "rgba(255,255,255,0.4)" }}>
            {grew > 0 ? `+${grew}` : grew}
          </span>
        </div>
        <div className="mt-2 inline-flex rounded-full px-3 py-0.5 text-[0.66rem] font-bold"
          style={{ background: `${statusToneColor(chapter.status.tone)}1f`, color: statusToneColor(chapter.status.tone) }}>
          {es ? chapter.status.labelEs : chapter.status.label}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-white/8 bg-[#0b1122] px-2 py-2.5 text-center">
            <div className="font-display text-xl font-extrabold text-white">{v}</div>
            <div className="text-[0.48rem] font-bold uppercase tracking-widest text-white/35">{k}</div>
          </div>
        ))}
      </div>

      {trophies.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 rounded-2xl border border-gold/25 bg-gold/[0.06] p-3">
          {trophies.map(({ h, n }) => (
            <span key={h} className="rounded-full bg-gold/15 px-3 py-1 text-[0.72rem] font-bold text-gold">
              ★ {h}{n > 1 ? ` ×${n}` : ""}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#0b1122] p-4">
          <div className="text-[0.55rem] font-bold uppercase tracking-[0.25em] text-gold/70">{c("Market Value", "Valor de Mercado")}</div>
          <div className="mt-1 font-display text-xl font-extrabold text-white">{fmtMoney(chapter.marketValueTo)}</div>
          <div className="text-[0.72rem]" style={{ color: mv >= 0 ? "#7ee081" : "#ff6b6b" }}>
            {mv >= 0 ? "▲" : "▼"} {fmtMoney(Math.abs(mv))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0b1122] p-4">
          <div className="text-[0.55rem] font-bold uppercase tracking-[0.25em] text-gold/70">{c("National Team", "Selección")}</div>
          <div className="mt-1 flex items-center gap-2">
            <CountryFlag country={player.nationality} size={16} />
            <span className="font-display text-lg font-extrabold text-white">
              {chapter.national.caps} <span className="text-[0.6rem] font-bold text-white/40">{c("CAPS", "PJ")}</span>
              <span className="ml-2">{chapter.national.goals}</span> <span className="text-[0.6rem] font-bold text-white/40">{c("GLS", "GOL")}</span>
            </span>
          </div>
        </div>
      </div>

      {chapter.attrDeltas.some((a) => a.delta !== 0) && (
        <div className="mt-3 rounded-2xl border border-white/10 bg-[#0b1122] p-4">
          <div className="mb-2 text-[0.55rem] font-bold uppercase tracking-[0.25em] text-gold/70">{c("Development", "Desarrollo")}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
            {chapter.attrDeltas.filter((a) => a.delta !== 0).map((a) => (
              <div key={a.label} className="flex items-center justify-between text-[0.78rem]">
                <span className="text-white/60">{a.label}</span>
                <span className="font-bold" style={{ color: a.delta > 0 ? "#7ee081" : "#ff6b6b" }}>{a.delta > 0 ? `+${a.delta}` : a.delta}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-white/8 pt-3 text-[0.66rem]">
            <span className="rounded-full px-2.5 py-0.5" style={{ background: `${formAccent[chapter.playerAfter.form]}1a`, color: formAccent[chapter.playerAfter.form] }}>
              <span className="opacity-60">{c("Form", "Forma")}:</span> <span className="font-bold">{formLabel(chapter.playerAfter.form, lang)}</span>
            </span>
            <span className="rounded-full bg-gold/12 px-2.5 py-0.5 text-gold">
              <span className="opacity-70">{c("Role", "Rol")}:</span> <span className="font-bold">{roleLabel(chapter.playerAfter.role, lang)}</span>
            </span>
          </div>
        </div>
      )}

      {chapter.media.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {chapter.media.slice(0, 3).map((m, i) => (
            <div key={i} className="rounded-xl bg-white/[0.04] px-3 py-2 text-[0.78rem] text-white/70">📰 {m}</div>
          ))}
        </div>
      )}

      <button onClick={() => { play("click"); onContinue(); }} className="btn btn-gold mt-6 w-full">
        {c("Continue", "Continuar")} →
      </button>
      {club && <div className="mt-2 text-center text-[0.62rem] text-white/25">{club.objective}</div>}
    </div>
  );
}

/* ---------------- offer card ---------------- */
function OfferCard({ offer: o, onAccept, c, es }: {
  offer: TransferOffer; onAccept: () => void; c: (en: string, es: string) => string; es: boolean;
}) {
  const cl = worldClubById(o.clubId);
  const league = cl ? worldLeagueById(cl.leagueId) : undefined;
  if (!cl) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1122]">
      <span aria-hidden className="block h-0.5" style={{ background: `linear-gradient(90deg, ${cl.colors[0]}, ${cl.colors[1]})` }} />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <ClubCrest short={cl.short} colors={cl.colors} size={40} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-display text-base font-extrabold text-white">{cl.name}</span>
              <CountryFlag country={cl.country} size={12} />
            </div>
            <div className="text-[0.68rem] text-white/45">{league?.name ?? cl.country}</div>
          </div>
          <span className="shrink-0 text-[0.6rem] font-bold text-gold">{"★".repeat(o.developmentStars)}</span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[0.72rem] sm:grid-cols-4">
          <Fact k={c("Role", "Rol")} v={roleLabel(o.role, es ? "es" : "en")} />
          <Fact k={c("Wage", "Salario")} v={fmtWage(o.wage)} />
          <Fact k={c("Contract", "Contrato")} v={`${o.years} ${c("yrs", "años")}`} />
          <Fact k={c("Apps", "Partidos")} v={`${o.expectedApps[0]}–${o.expectedApps[1]}`} />
        </div>

        <p className="mt-3 border-t border-white/8 pt-2.5 text-[0.75rem] italic leading-relaxed text-white/55">
          {es ? o.reasonEs : o.reasonEn}
        </p>

        <button onClick={onAccept} className="btn btn-gold mt-3 w-full text-sm">{c("Sign", "Fichar")}</button>
      </div>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[0.5rem] font-bold uppercase tracking-widest text-white/30">{k}</div>
      <div className="font-semibold text-white/85">{v}</div>
    </div>
  );
}
