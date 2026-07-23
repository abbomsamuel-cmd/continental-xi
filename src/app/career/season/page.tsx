"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { useHydrated } from "@/lib/useHydrated";
import { play } from "@/lib/sound";
import { useC, formAccent, formLabel, reputationLabel, roleLabel } from "@/lib/career/copy";
import { useCareer, useCurrentPlayer } from "@/lib/career/store";
import { buildPlan, finalizeSeason, monthLabel, type SeasonBeat } from "@/lib/career/engine";
import { momentById } from "@/lib/career/moments";
import { clubById } from "@/lib/career/data";
import { fmtMoney, fmtWage, seasonLabel } from "@/lib/career/util";
import type { CareerPlayer, SeasonResult, TransferOffer } from "@/lib/career/types";
import { CareerMomentModal } from "@/components/career/CareerMomentModal";
import { CountryFlag } from "@/components/career/CountryFlag";
import { ClubCrest } from "@/components/career/ClubCrest";

/** Months (0=Aug) advanced per real second at 1× — a full season in ~20s. */
const MONTHS_PER_SEC = 0.5;
type Speed = 1 | 2 | 3;

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

type Phase = "sim" | "report" | "transfers";
interface FeedItem { key: string; icon: string; text: string; month: number }

function SeasonRunner({ player }: { player: CareerPlayer }) {
  const c = useC();
  const { lang } = useLang();
  const es = lang === "es";
  const router = useRouter();
  const commitSeason = useCareer((s) => s.commitSeason);
  const retireCareer = useCareer((s) => s.retireCareer);

  const plan = useMemo(() => buildPlan(player), [player]);
  const beats = plan.beats;

  const [phase, setPhase] = useState<Phase>("sim");
  const [monthFloat, setMonthFloat] = useState(0);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [pending, setPending] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [result, setResult] = useState<SeasonResult | null>(null);

  const mfRef = useRef(0);
  const ptr = useRef(0);
  const decisions = useRef<Record<string, string>>({});
  const rafRef = useRef(0);
  const doneRef = useRef(false);

  const pushFeed = (b: SeasonBeat) => {
    if (b.kind === "final") return;
    setFeed((f) => [{ key: `${b.month}-${b.kind}-${ptr.current}`, icon: b.icon ?? "◆", text: (es ? b.es : b.en) ?? "", month: b.month }, ...f].slice(0, 7));
  };

  const finalize = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    cancelAnimationFrame(rafRef.current);
    const res = finalizeSeason(player, plan, decisions.current);
    play(res.leaguePosition === 1 ? "trophy" : "advance");
    setResult(res);
    setPhase("report");
  };

  /** Fire every beat up to month `upTo`. Returns true if we paused on a moment. */
  const fireUpTo = (upTo: number, autoResolve: boolean): boolean => {
    while (ptr.current < beats.length && beats[ptr.current].month <= upTo) {
      const b = beats[ptr.current];
      if (b.kind === "moment" && b.momentId) {
        if (autoResolve) {
          const m = momentById(b.momentId);
          const def = m?.choices[0];
          if (m && def) { decisions.current[b.momentId] = def.id; setFeed((f) => [{ key: `m-${ptr.current}`, icon: m.icon, text: (es ? def.es : def.en), month: b.month }, ...f].slice(0, 7)); }
          ptr.current++;
          continue;
        }
        mfRef.current = b.month;
        setMonthFloat(b.month);
        ptr.current++;
        setPending(b.momentId);
        play("select");
        return true;
      }
      ptr.current++;
      if (b.kind === "final") { finalize(); return true; }
      pushFeed(b);
    }
    return false;
  };

  // rAF simulation clock
  useEffect(() => {
    if (phase !== "sim") return;
    let last = performance.now();
    let alive = true;
    const tick = (t: number) => {
      if (!alive) return;
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      if (!paused && !pending) {
        let nmf = mfRef.current + dt * MONTHS_PER_SEC * speed;
        if (nmf >= 9.6 && ptr.current < beats.length) nmf = Math.min(nmf, beats[beats.length - 1].month + 0.01);
        const paused2 = fireUpTo(nmf, false);
        if (!paused2) { mfRef.current = Math.min(9.99, nmf); setMonthFloat(mfRef.current); }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { alive = false; cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused, pending, speed]);

  const resolveMoment = (cid: string) => {
    if (pending) decisions.current[pending] = cid;
    setPending(null);
  };

  const skipToNext = () => {
    play("click");
    // reveal everything up to the next moment (or the end)
    let next = 10;
    for (let i = ptr.current; i < beats.length; i++) { if (beats[i].kind === "moment") { next = beats[i].month; break; } }
    fireUpTo(next, false);
    mfRef.current = Math.min(9.99, Math.max(mfRef.current, next - 0.01));
    setMonthFloat(mfRef.current);
  };

  const quickSim = () => { play("whistle"); fireUpTo(10, true); if (phase === "sim") finalize(); };

  /* ---------------- SIM ---------------- */
  if (phase === "sim") {
    const p = Math.min(1, monthFloat / 10);
    const month = Math.min(9, Math.floor(monthFloat));
    const apps = Math.round(plan.base.apps * p);
    const isGk = player.position === "GK";
    const scored = Math.round((isGk ? apps * 0.34 : plan.base.goals) * (isGk ? 1 : p));
    const assists = Math.round(plan.base.assists * p);
    const leaguePos = Math.max(1, Math.round(10 + (plan.base.leaguePosition - 10) * Math.min(1, p * 1.3)));

    const hud: [string, string | number, string?][] = [
      [c("Age", "Edad"), player.age],
      ["OVR", player.overall, "#f2d472"],
      [c("Form", "Forma"), formLabel(player.form, lang), formAccent[player.form]],
      [c("Apps", "PJ"), apps],
      [isGk ? c("Clean Sheets", "Porterías 0") : c("Goals", "Goles"), scored],
      [c("Assists", "Asist."), assists],
      [c("Trust", "Confianza"), `${player.trust}`],
      [c("Value", "Valor"), fmtMoney(player.marketValue)],
      [c("League", "Liga"), `${leaguePos}${lang === "es" ? "º" : nth(leaguePos)}`],
    ];

    return (
      <div className="mx-auto max-w-2xl px-4 pt-24 sm:pt-28">
        {/* header */}
        <div className="flex items-center gap-2.5">
          <ClubCrest short={player.currentClubShort} colors={player.currentClubColors} size={30} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-base font-extrabold text-white">{player.currentClubName}</div>
            <div className="text-[0.6rem] uppercase tracking-widest text-white/40">{seasonLabel(plan.year)}</div>
          </div>
          <div className="font-display text-lg font-black text-gold">{monthLabel(month, es)}</div>
        </div>

        {/* month progress */}
        <div className="mt-2 flex gap-1">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <span className="block h-full rounded-full bg-gold transition-[width] duration-150" style={{ width: `${Math.max(0, Math.min(1, monthFloat - i)) * 100}%` }} />
            </span>
          ))}
        </div>

        {/* live HUD */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-3">
          {hud.map(([k, v, col]) => (
            <div key={k} className="rounded-xl border border-white/8 bg-[#0b1122] px-2.5 py-2">
              <div className="text-[0.48rem] font-bold uppercase tracking-widest text-white/35">{k}</div>
              <div className="mt-0.5 truncate font-display text-base font-extrabold" style={{ color: col ?? "#fff" }}>
                <motion.span key={String(v)} initial={{ scale: 1.3, opacity: 0.55 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.26 }} className="inline-block">{v}</motion.span>
              </div>
            </div>
          ))}
        </div>

        {/* controls */}
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
        </div>
        <div className="mt-2 flex gap-2">
          <button onClick={skipToNext} className="btn btn-ghost flex-1 text-sm">⏭ {c("Next decision", "Sig. decisión")}</button>
          <button onClick={quickSim} className="btn btn-ghost flex-1 text-sm">⏩ {c("Sim rest", "Sim. resto")}</button>
        </div>

        {/* event feed */}
        <div className="mt-4 space-y-1.5">
          <AnimatePresence initial={false}>
            {feed.map((f) => (
              <motion.div key={f.key} layout initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-[#0b1122] px-3 py-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/6 text-sm">{f.icon}</span>
                <span className="min-w-0 flex-1 text-[0.78rem] text-white/75">{f.text}</span>
                <span className="shrink-0 text-[0.56rem] font-bold uppercase tracking-widest text-white/30">{monthLabel(f.month, es)}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {feed.length === 0 && <div className="rounded-xl border border-dashed border-white/10 py-5 text-center text-[0.72rem] text-white/35">{c("The season is under way…", "La temporada está en marcha…")}</div>}
        </div>

        <div className="mt-5 text-center">
          <Link href="/career" className="text-[0.68rem] font-semibold text-white/35 hover:text-white/70">{c("Save & Exit", "Guardar y Salir")}</Link>
        </div>

        {pending && (
          <CareerMomentModal key={pending} momentId={pending} player={player} onResolve={resolveMoment} />
        )}
      </div>
    );
  }

  /* ---------------- REPORT ---------------- */
  if (phase === "report" && result) return <SeasonReport result={result} onContinue={() => setPhase("transfers")} />;

  /* ---------------- TRANSFERS ---------------- */
  if (phase === "transfers" && result) {
    const commit = (action: Parameters<typeof commitSeason>[1]) => { play("whistle"); commitSeason(result, action); router.push("/career"); };
    return (
      <div className="mx-auto max-w-2xl px-4 pt-24 sm:pt-28">
        <h1 className="font-display text-2xl font-black text-white sm:text-3xl">{c("Transfer Window", "Mercado de Fichajes")}</h1>
        <p className="mt-1 text-sm text-white/50">
          {result.offers.length > 0 ? c("Decide your next move — or stay and build something.", "Decide tu próximo paso — o quédate y construye algo.")
            : c("No offers this summer. Stay and keep proving yourself.", "Sin ofertas este verano. Quédate y sigue demostrando.")}
        </p>
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

/* ---------------- offer row ---------------- */
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

/* ---------------- fast end-of-season report ---------------- */
function SeasonReport({ result: r, onContinue }: { result: SeasonResult; onContinue: () => void }) {
  const c = useC();
  const { lang } = useLang();
  const grew = r.overallTo - r.overallFrom;
  const champ = r.season.honours.includes("League") || r.season.honours.includes("Champions League");
  const mvGrew = r.marketValueTo - r.marketValueFrom;

  const stats: [string, string | number][] = [
    [c("Position", "Posición"), r.leaguePosition === 1 ? c("Champions", "Campeón") : `${r.leaguePosition}${lang === "es" ? "º" : nth(r.leaguePosition)}`],
    [c("Apps", "Partidos"), r.season.apps],
    [c("Goals", "Goles"), r.season.goals],
    [c("Assists", "Asistencias"), r.season.assists],
    [c("Avg Rating", "Nota Media"), r.avgRating.toFixed(1)],
    [c("Value", "Valor"), fmtMoney(r.marketValueTo)],
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 pb-10 pt-24 sm:pt-28">
      <div className="text-center">
        <div className="text-[0.6rem] font-bold uppercase tracking-[0.35em] text-gold/70">{c("Season Complete", "Temporada Completa")}</div>
        <h1 className="mt-1 font-display text-3xl font-black text-white sm:text-4xl">{seasonLabel(r.season.year)}</h1>
        <div className="mt-1 flex items-center justify-center gap-1.5 text-sm text-white/55">
          <ClubCrest short={r.season.clubShort} colors={r.season.clubColors} size={16} /> {r.season.clubName}
        </div>
        {champ && <div className="mt-2 text-3xl">{"🏆".repeat(Math.min(3, r.season.honours.length))}</div>}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-white/8 bg-[#0b1122] px-2.5 py-2 text-center">
            <div className="font-display text-lg font-extrabold text-white">{v}</div>
            <div className="text-[0.5rem] font-bold uppercase tracking-widest text-white/35">{k}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#0b1122] p-4">
        <div className="flex items-center justify-between">
          <div className="text-[0.55rem] font-bold uppercase tracking-[0.25em] text-gold/70">{c("Development", "Desarrollo")}</div>
          <div className="flex items-center gap-3">
            <span className="text-[0.7rem] text-white/45">{mvGrew >= 0 ? "▲" : "▼"} {fmtMoney(Math.abs(mvGrew))}</span>
            <div className="font-display text-base font-extrabold">
              <span className="text-white/60">{r.overallFrom}</span><span className="mx-1.5 text-white/30">→</span>
              <span style={{ color: grew > 0 ? "#7ee081" : grew < 0 ? "#ff6b6b" : "#fff" }}>{r.overallTo}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
          {r.attrDeltas.map((a) => (
            <div key={a.label} className="flex items-center justify-between text-[0.78rem]">
              <span className="text-white/60">{a.label}</span>
              <span className="font-bold" style={{ color: a.delta > 0 ? "#7ee081" : a.delta < 0 ? "#ff6b6b" : "rgba(255,255,255,0.35)" }}>{a.delta > 0 ? `+${a.delta}` : a.delta}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-white/8 pt-3 text-[0.66rem]">
          <Chip label={c("Form", "Forma")} value={formLabel(r.form, lang)} color={formAccent[r.form]} />
          <Chip label={c("Role", "Rol")} value={roleLabel(r.role, lang)} color="#d4af37" />
          <Chip label={c("Reputation", "Reputación")} value={reputationLabel(r.reputation, lang)} color="#8fb8ff" />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#0b1122] p-4">
        <div className="mb-2 text-[0.55rem] font-bold uppercase tracking-[0.25em] text-gold/70">{c("Objectives", "Objetivos")}</div>
        {r.objectives.map((o, i) => (
          <div key={i} className="flex items-center gap-2 py-1 text-sm">
            <span className={o.met ? "text-green" : "text-white/25"}>{o.met ? "✓" : "○"}</span>
            <span className={o.met ? "text-white/85" : "text-white/45"}>{o.text}</span>
          </div>
        ))}
      </div>

      {(r.media.length > 0 || r.traitUnlocks.length > 0 || r.offers.length > 0) && (
        <div className="mt-4 space-y-1.5">
          {r.traitUnlocks.map((t) => (
            <div key={t} className="rounded-xl border border-gold/25 bg-gold/[0.07] px-3 py-2 text-[0.78rem] font-semibold text-gold">★ {c("New trait", "Nuevo rasgo")}: {t}</div>
          ))}
          {r.offers.length > 0 && (
            <div className="rounded-xl bg-white/[0.04] px-3 py-2 text-[0.78rem] text-white/70">
              ⇄ {c("Transfer interest from", "Interés de")} {r.offers.slice(0, 3).map((o) => clubById(o.clubId)?.name).filter(Boolean).join(", ")}
            </div>
          )}
          {r.media.map((m, i) => (
            <div key={i} className="rounded-xl bg-white/[0.04] px-3 py-2 text-[0.78rem] text-white/70">📰 {m}</div>
          ))}
        </div>
      )}

      <button onClick={onContinue} className="btn btn-gold mt-6 w-full">{c("Continue to Next Season", "Continuar a la Próxima Temporada")} →</button>
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
