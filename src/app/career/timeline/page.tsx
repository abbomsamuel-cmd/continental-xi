"use client";

import Link from "next/link";
import { useHydrated } from "@/lib/useHydrated";
import { useC } from "@/lib/career/copy";
import { useCurrentPlayer } from "@/lib/career/store";
import { careerTotals } from "@/lib/career/util";
import { CareerTimeline } from "@/components/career/CareerTimeline";
import { CountryFlag } from "@/components/career/CountryFlag";

export default function TimelinePage() {
  const hydrated = useHydrated();
  const player = useCurrentPlayer();
  const c = useC();

  if (!hydrated) return <div className="min-h-screen" />;
  if (!player) return <NoCareer c={c} />;

  const t = careerTotals(player);
  const totals: [string, string | number][] = [
    [c("Seasons", "Temporadas"), t.seasons],
    [c("Clubs", "Clubes"), t.clubs],
    [c("Apps", "Partidos"), t.apps],
    [c("Goals", "Goles"), t.goals],
    [c("Assists", "Asistencias"), t.assists],
    [c("Peak OVR", "OVR Máx."), t.peakOverall],
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 sm:px-6 sm:pt-28">
      <div className="flex items-center gap-3">
        <CountryFlag country={player.nationality} size={22} />
        <div>
          <h1 className="font-display text-2xl font-black text-white sm:text-3xl">{player.name}</h1>
          <div className="text-[0.7rem] uppercase tracking-widest text-white/40">{c("Career Timeline", "Trayectoria")}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {totals.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-white/8 bg-[#0b1122] px-2.5 py-2 text-center">
            <div className="font-display text-lg font-extrabold text-white">{v}</div>
            <div className="text-[0.5rem] font-bold uppercase tracking-widest text-white/35">{k}</div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <CareerTimeline seasons={player.seasons} />
      </div>
    </div>
  );
}

function NoCareer({ c }: { c: (en: string, es: string) => string }) {
  return (
    <div className="mx-auto max-w-md px-4 pt-32 text-center">
      <p className="text-white/55">{c("No active career.", "No hay carrera activa.")}</p>
      <Link href="/career/new" className="btn btn-gold mt-4">⚽ {c("Create Your Player", "Crea Tu Jugador")}</Link>
    </div>
  );
}
