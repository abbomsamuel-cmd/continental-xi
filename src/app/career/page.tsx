"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n";
import { useHydrated } from "@/lib/useHydrated";
import { play } from "@/lib/sound";
import { useC, formAccent, formLabel, roleLabel } from "@/lib/career/copy";
import { useCareer, useCurrentPlayer } from "@/lib/career/store";
import { fmtMoney, seasonLabel } from "@/lib/career/util";
import type { CareerPlayer } from "@/lib/career/types";
import { PlayerHeader } from "@/components/career/PlayerHeader";
import { CareerTimeline } from "@/components/career/CareerTimeline";

export default function CareerOverview() {
  const hydrated = useHydrated();
  const player = useCurrentPlayer();
  const hasSaves = useCareer((s) => s.saves.length > 0);

  if (!hydrated) return <div className="min-h-screen" />;
  if (!player) return <EmptyState hasSaves={hasSaves} />;
  return <Dashboard player={player} />;
}

/* ---------------- No career yet ---------------- */
function EmptyState({ hasSaves }: { hasSaves: boolean }) {
  const c = useC();
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 text-center sm:pt-32">
      <div className="text-[0.6rem] font-bold uppercase tracking-[0.4em] text-gold/80">{c("Career Mode", "Modo Carrera")}</div>
      <h1 className="mt-3 font-display text-4xl font-black leading-tight text-white sm:text-6xl">
        {c("Live a football", "Vive una carrera")}<br />
        <span className="text-gradient-gold">{c("career.", "futbolística.")}</span>
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-white/55">
        {c("Create a player, choose where to begin, and write a story season by season — transfers, trophies, a national-team call, a legacy.",
          "Crea un jugador, elige dónde empezar y escribe una historia temporada a temporada — fichajes, títulos, la selección, un legado.")}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/career/new" onClick={() => play("select")} className="btn btn-gold text-base">⚽ {c("Create Your Player", "Crea Tu Jugador")}</Link>
        {hasSaves && <Link href="/career/saves" onClick={() => play("click")} className="btn btn-ghost">{c("Load a Career", "Cargar Carrera")}</Link>}
      </div>
      <p className="mt-6 text-[0.7rem] text-white/30">{c("A separate save from your Tournament squads — the two never overwrite each other.", "Una partida aparte de tus plantillas de Torneo — nunca se sobrescriben.")}</p>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
function Dashboard({ player }: { player: CareerPlayer }) {
  const c = useC();
  const { lang } = useLang();
  const router = useRouter();

  const objectives = seededObjectives(player, c);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-24 sm:px-6 sm:pt-28">
      <PlayerHeader player={player} />

      {/* middle — the timeline dominates */}
      <section className="mt-6">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-white/50">{c("Career Timeline", "Trayectoria")}</h2>
          <Link href="/career/timeline" onClick={() => play("hover")} className="text-[0.68rem] font-semibold text-gold/80 hover:text-gold">{c("View full", "Ver todo")} →</Link>
        </div>
        <CareerTimeline seasons={player.seasons} defaultOpen />
      </section>

      {/* bottom — current season · transfer · objectives */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title={c("Current Season", "Temporada Actual")}>
          <div className="font-display text-2xl font-black text-white">{seasonLabel(player.currentYear)}</div>
          <div className="mt-0.5 text-sm text-white/55">{player.currentClubName}</div>
          <div className="mt-3 flex flex-wrap gap-1.5 text-[0.62rem] font-bold uppercase tracking-wider">
            <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-white/60">{c("Pre-season", "Pretemporada")}</span>
            <span className="rounded-full px-2.5 py-0.5" style={{ background: `${formAccent[player.form]}1a`, color: formAccent[player.form] }}>{c("Form", "Forma")}: {formLabel(player.form, lang)}</span>
          </div>
          <button onClick={() => { play("select"); router.push("/career/season"); }} className="btn btn-gold mt-4 w-full text-sm">▶ {c("Play Season", "Jugar Temporada")}</button>
        </Panel>

        <Panel title={c("Transfer Status", "Estado de Fichajes")}>
          <div className="text-sm text-white/70">{c("The window is closed.", "El mercado está cerrado.")}</div>
          <div className="mt-1 text-[0.78rem] text-white/45">{c("Offers arrive when the season ends.", "Las ofertas llegan al final de la temporada.")}</div>
          <div className="mt-3 rounded-xl bg-black/25 px-3 py-2">
            <div className="text-[0.52rem] font-bold uppercase tracking-widest text-white/35">{c("Market Value", "Valor de Mercado")}</div>
            <div className="font-display text-lg font-extrabold text-white">{fmtMoney(player.marketValue)}</div>
          </div>
        </Panel>

        <Panel title={c("Objectives", "Objetivos")}>
          <ul className="space-y-2">
            {objectives.map((o, i) => (
              <li key={i} className="flex items-start gap-2 text-[0.82rem] text-white/75">
                <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border border-gold/40 text-[0.5rem] text-gold">{i + 1}</span>
                {o}
              </li>
            ))}
          </ul>
          <div className="mt-3 text-[0.62rem] italic text-white/30">{c("Role", "Rol")}: {roleLabel(player.role, lang)}</div>
        </Panel>
      </div>

    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1122] p-4">
      <div className="mb-2.5 text-[0.55rem] font-bold uppercase tracking-[0.25em] text-gold/70">{title}</div>
      {children}
    </div>
  );
}

function seededObjectives(p: CareerPlayer, c: (en: string, es: string) => string): string[] {
  const list = [c("Make your competitive debut", "Debuta en competición")];
  if (p.role === "reserve" || p.role === "rotation") list.push(c("Break into the starting XI", "Gánate un puesto en el once"));
  else list.push(c("Hold down a starting role", "Consolídate como titular"));
  list.push(c("Impress enough to earn a longer contract", "Convence para ganar un contrato más largo"));
  return list;
}
