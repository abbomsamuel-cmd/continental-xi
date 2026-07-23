"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { useHydrated } from "@/lib/useHydrated";
import { play } from "@/lib/sound";
import { useC, formAccent, formLabel, reputationLabel, roleLabel } from "@/lib/career/copy";
import { useCareer, useCurrentPlayer } from "@/lib/career/store";
import { buildPlan, finalizeSeason, monthLabel } from "@/lib/career/engine";
import { clubById } from "@/lib/career/data";
import { fmtMoney, fmtWage, seasonLabel } from "@/lib/career/util";
import type { CareerPlayer, SeasonResult, TransferOffer } from "@/lib/career/types";
import { CareerMomentModal } from "@/components/career/CareerMomentModal";
import { CountryFlag } from "@/components/career/CountryFlag";
import { ClubCrest } from "@/components/career/ClubCrest";

export default function SeasonPage() {
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
  if (player.retired) {
    return (
      <div className="mx-auto max-w-md px-4 pt-32 text-center">
        <div className="text-5xl">🎖️</div>
        <h1 className="mt-3 font-display text-2xl font-black text-white">{c("A career remembered", "Una carrera para el recuerdo")}</h1>
        <p className="mt-2 text-sm text-white/55">{c("You've hung up your boots. The legacy screen arrives with Part 3.", "Has colgado las botas. La pantalla de legado llega en la Parte 3.")}</p>
        <Link href="/career/timeline" className="btn btn-gold mt-5">{c("View Timeline", "Ver Trayectoria")}</Link>
      </div>
    );
  }
  return <SeasonRunner key={`${player.id}:${player.currentYear}`} player={player} />;
}

type Phase = "play" | "report" | "transfers";

function SeasonRunner({ player }: { player: CareerPlayer }) {
  const c = useC();
  const { lang } = useLang();
  const es = lang === "es";
  const router = useRouter();
  const commitSeason = useCareer((s) => s.commitSeason);
  const retireCareer = useCareer((s) => s.retireCareer);

  const plan = useMemo(() => buildPlan(player), [player]);
  const [phase, setPhase] = useState<Phase>("play");
  const [beatIndex, setBeatIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SeasonResult | null>(null);

  const beat = plan.beats[beatIndex];

  const advance = () => {
    const next = beatIndex + 1;
    if (next >= plan.beats.length) {
      const res = finalizeSeason(player, plan, decisions);
      play(res.leaguePosition === 1 ? "trophy" : "select");
      setResult(res);
      setPhase("report");
    } else {
      play("click");
      setBeatIndex(next);
    }
  };

  /* ---------- PLAY ---------- */
  if (phase === "play") {
    const isMoment = beat.kind === "moment" && !!beat.momentId;
    return (
      <div className="mx-auto max-w-2xl px-4 pt-24 sm:pt-28">
        <MonthBar month={beat.month} es={es} />
        {/* key-remount per beat — entrance animation only. No exit choreography:
            a dropped frame must never leave a stale card (or its button) behind. */}
        <motion.div key={beatIndex} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c1326] to-[#070b18] p-8 text-center">
          <div className="text-4xl">{beat.icon ?? "◆"}</div>
          <div className="mt-3 text-[0.6rem] font-bold uppercase tracking-[0.3em] text-gold/70">
            {monthLabel(beat.month, es)} · {seasonLabel(plan.year)}
          </div>
          <p className="mx-auto mt-2 max-w-md font-display text-lg font-bold leading-snug text-white">
            {isMoment ? c("A decision to make…", "Una decisión que tomar…") : es ? beat.es : beat.en}
          </p>
          {!isMoment && (
            <button onClick={advance} className="btn btn-gold mt-6">
              {beat.kind === "final" ? c("See the Season", "Ver la Temporada") : c("Continue", "Continuar")} →
            </button>
          )}
        </motion.div>
        <div className="mt-6 text-center">
          <Link href="/career" className="text-[0.68rem] font-semibold text-white/35 hover:text-white/70">{c("Save & Exit", "Guardar y Salir")}</Link>
        </div>

        {isMoment && (
          <CareerMomentModal key={beat.momentId} momentId={beat.momentId!} player={player}
            onResolve={(cid) => { setDecisions((d) => ({ ...d, [beat.momentId!]: cid })); advance(); }} />
        )}
      </div>
    );
  }

  /* ---------- REPORT ---------- */
  if (phase === "report" && result) return <SeasonReport result={result} onContinue={() => setPhase("transfers")} />;

  /* ---------- TRANSFERS ---------- */
  if (phase === "transfers" && result) {
    const commit = (action: Parameters<typeof commitSeason>[1]) => { play("whistle"); commitSeason(result, action); router.push("/career"); };
    return (
      <div className="mx-auto max-w-2xl px-4 pt-24 sm:pt-28">
        <h1 className="font-display text-2xl font-black text-white sm:text-3xl">{c("Transfer Window", "Mercado de Fichajes")}</h1>
        <p className="mt-1 text-sm text-white/50">
          {result.offers.length > 0 ? c("Decide your next move — or stay and build something.", "Decide tu próximo paso — o quédate y construye algo.")
            : c("No offers this summer. Stay and keep proving yourself.", "Sin ofertas este verano. Quédate y sigue demostrando.")}
        </p>

        {/* stay / renew */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => commit({ type: "stay" })} className="btn btn-secondary text-sm">{c("Stay at", "Quedarme en")} {player.currentClubShort}</button>
          {result.contractExpiring && <button onClick={() => commit({ type: "renew" })} className="btn btn-gold text-sm">{c("Renew Contract (+4 yrs)", "Renovar (+4 años)")}</button>}
          {player.age >= 32 && <button onClick={() => { retireCareer(useCareer.getState().currentId!); router.push("/career"); }} className="btn btn-ghost text-sm text-white/50">{c("Retire", "Retirarme")}</button>}
        </div>

        <div className="mt-5 space-y-3">
          {result.offers.map((o) => <OfferRow key={o.clubId} offer={o} onAccept={() => commit({ type: "transfer", offer: o })} c={c} lang={lang} />)}
        </div>
      </div>
    );
  }

  return <div className="min-h-screen" />;
}

/* ---------- month progress ---------- */
function MonthBar({ month, es }: { month: number; es: boolean }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[0.55rem] font-bold uppercase tracking-widest text-white/35">
        <span>{es ? "Temporada" : "Season"}</span><span>{monthLabel(month, es)}</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="h-1.5 flex-1 rounded-full transition-colors" style={{ background: i <= month ? "#d4af37" : "rgba(255,255,255,0.1)" }} />
        ))}
      </div>
    </div>
  );
}

/* ---------- offer row ---------- */
function OfferRow({ offer: o, onAccept, c, lang }: { offer: TransferOffer; onAccept: () => void; c: (en: string, es: string) => string; lang: string }) {
  const cl = clubById(o.clubId);
  if (!cl) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1122]">
      <span aria-hidden className="block h-0.5" style={{ background: `linear-gradient(90deg, ${cl.colors[0]}, ${cl.colors[1]})` }} />
      <div className="flex items-center gap-3 p-4">
        <ClubCrest short={cl.short} colors={cl.colors} size={42} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-display text-base font-extrabold text-white">{cl.name}</span>
            <CountryFlag country={cl.country} size={12} />
          </div>
          <div className="text-[0.7rem] text-white/50">
            {roleLabel(o.role, lang as "en" | "es")} · {fmtWage(o.wage)} · {o.years} {c("yrs", "años")} · {"★".repeat(o.developmentStars)}
          </div>
        </div>
        <button onClick={onAccept} className="btn btn-gold text-sm">{c("Sign", "Fichar")}</button>
      </div>
    </div>
  );
}

/* ---------- end-of-season report ---------- */
function SeasonReport({ result: r, onContinue }: { result: SeasonResult; onContinue: () => void }) {
  const c = useC();
  const { lang } = useLang();
  const grew = r.overallTo - r.overallFrom;
  const champ = r.season.honours.includes("League") || r.season.honours.includes("Champions League");

  const stats: [string, string | number][] = [
    [c("Position", "Posición"), r.leaguePosition === 1 ? c("Champions", "Campeón") : `${r.leaguePosition}${lang === "es" ? "º" : nth(r.leaguePosition)}`],
    [c("Apps", "Partidos"), r.season.apps],
    [c("Goals", "Goles"), r.season.goals],
    [c("Assists", "Asistencias"), r.season.assists],
    [c("Avg Rating", "Nota Media"), r.avgRating.toFixed(1)],
    [c("Market Value", "Valor"), fmtMoney(r.marketValueTo)],
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 pt-24 pb-10 sm:pt-28">
      <div className="text-center">
        <div className="text-[0.6rem] font-bold uppercase tracking-[0.35em] text-gold/70">{c("Season Complete", "Temporada Completa")}</div>
        <h1 className="mt-1 font-display text-3xl font-black text-white sm:text-4xl">{seasonLabel(r.season.year)}</h1>
        <div className="mt-1 flex items-center justify-center gap-1.5 text-sm text-white/55">
          <ClubCrest short={r.season.clubShort} colors={r.season.clubColors} size={16} /> {r.season.clubName}
        </div>
        {champ && <div className="mt-2 text-3xl">{"🏆".repeat(Math.min(3, r.season.honours.length))}</div>}
      </div>

      {/* stat grid */}
      <div className="mt-6 grid grid-cols-3 gap-2">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-white/8 bg-[#0b1122] px-2.5 py-2 text-center">
            <div className="font-display text-lg font-extrabold text-white">{v}</div>
            <div className="text-[0.5rem] font-bold uppercase tracking-widest text-white/35">{k}</div>
          </div>
        ))}
      </div>

      {/* development report */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-[#0b1122] p-4">
        <div className="flex items-center justify-between">
          <div className="text-[0.55rem] font-bold uppercase tracking-[0.25em] text-gold/70">{c("Development", "Desarrollo")}</div>
          <div className="font-display text-base font-extrabold">
            <span className="text-white/60">{r.overallFrom}</span>
            <span className="mx-1.5 text-white/30">→</span>
            <span style={{ color: grew > 0 ? "#7ee081" : grew < 0 ? "#ff6b6b" : "#fff" }}>{r.overallTo}</span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
          {r.attrDeltas.map((a) => (
            <div key={a.label} className="flex items-center justify-between text-[0.78rem]">
              <span className="text-white/60">{a.label}</span>
              <span className="font-bold" style={{ color: a.delta > 0 ? "#7ee081" : a.delta < 0 ? "#ff6b6b" : "rgba(255,255,255,0.35)" }}>
                {a.delta > 0 ? `+${a.delta}` : a.delta}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-white/8 pt-3 text-[0.66rem]">
          <Chip label={c("Form", "Forma")} value={formLabel(r.form, lang)} color={formAccent[r.form]} />
          <Chip label={c("Role", "Rol")} value={roleLabel(r.role, lang)} color="#d4af37" />
          <Chip label={c("Reputation", "Reputación")} value={reputationLabel(r.reputation, lang)} color="#8fb8ff" />
        </div>
      </div>

      {/* objectives */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-[#0b1122] p-4">
        <div className="mb-2 text-[0.55rem] font-bold uppercase tracking-[0.25em] text-gold/70">{c("Objectives", "Objetivos")}</div>
        {r.objectives.map((o, i) => (
          <div key={i} className="flex items-center gap-2 py-1 text-sm">
            <span className={o.met ? "text-green" : "text-white/25"}>{o.met ? "✓" : "○"}</span>
            <span className={o.met ? "text-white/85" : "text-white/45"}>{o.text}</span>
          </div>
        ))}
      </div>

      {(r.media.length > 0 || r.traitUnlocks.length > 0) && (
        <div className="mt-4 space-y-1.5">
          {r.traitUnlocks.map((t) => (
            <div key={t} className="rounded-xl border border-gold/25 bg-gold/[0.07] px-3 py-2 text-[0.78rem] font-semibold text-gold">★ {c("New trait", "Nuevo rasgo")}: {t}</div>
          ))}
          {r.media.map((m, i) => (
            <div key={i} className="rounded-xl bg-white/[0.04] px-3 py-2 text-[0.78rem] text-white/70">📰 {m}</div>
          ))}
        </div>
      )}

      <button onClick={onContinue} className="btn btn-gold mt-6 w-full">{c("Continue to Transfer Window", "Ir al Mercado")} →</button>
    </div>
  );
}

function Chip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span className="rounded-full px-2.5 py-0.5" style={{ background: `${color}1a`, color }}>
      <span className="opacity-60">{label}:</span> <span className="font-bold">{value}</span>
    </span>
  );
}

function nth(n: number): string {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}
