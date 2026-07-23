"use client";

import Link from "next/link";
import { useHydrated } from "@/lib/useHydrated";
import { useC } from "@/lib/career/copy";
import { useCurrentPlayer } from "@/lib/career/store";
import { careerTotals, fmtMoney } from "@/lib/career/util";
import { CountryFlag } from "@/components/career/CountryFlag";

export default function CareerStatsPage() {
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

  const t = careerTotals(player);
  const cells: [string, string | number][] = [
    [c("Appearances", "Partidos"), t.apps],
    [c("Goals", "Goles"), t.goals],
    [c("Assists", "Asistencias"), t.assists],
    [c("Trophies", "Títulos"), t.honours],
    [c("Seasons", "Temporadas"), t.seasons],
    [c("Clubs", "Clubes"), t.clubs],
    [c("Current OVR", "OVR Actual"), player.overall],
    [c("Peak OVR", "OVR Máx."), t.peakOverall],
    [c("Market Value", "Valor"), fmtMoney(player.marketValue)],
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-24 sm:px-6 sm:pt-28">
      <div className="flex items-center gap-2">
        <CountryFlag country={player.nationality} size={20} />
        <h1 className="font-display text-2xl font-black text-white sm:text-3xl">{c("Statistics", "Estadísticas")}</h1>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cells.map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-white/10 bg-[#0b1122] p-4">
            <div className="text-[0.52rem] font-bold uppercase tracking-widest text-white/35">{k}</div>
            <div className="mt-1 font-display text-2xl font-black text-white">{v}</div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-[0.7rem] text-white/30">
        {c("Season-by-season graphs and full award records arrive with the season engine.",
          "Los gráficos por temporada y el historial completo de premios llegan con el motor de temporada.")}
      </p>
    </div>
  );
}
