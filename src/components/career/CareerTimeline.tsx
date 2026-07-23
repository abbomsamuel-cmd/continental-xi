"use client";

import { useState } from "react";
import { groupSeasons, seasonLabel, type ClubChapter } from "@/lib/career/util";
import { useC } from "@/lib/career/copy";
import type { CareerSeason } from "@/lib/career/types";
import { CountryFlag } from "./CountryFlag";
import { ClubCrest } from "./ClubCrest";

/**
 * The career résumé — the most important surface in Career Mode. Consecutive
 * seasons at one club fold into a single chapter you can expand. For a fresh
 * career it's one line; over twenty years it becomes the player's story.
 */
export function CareerTimeline({ seasons, defaultOpen = false }: { seasons: CareerSeason[]; defaultOpen?: boolean }) {
  const c = useC();
  const chapters = groupSeasons(seasons);

  if (chapters.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/12 p-8 text-center text-sm text-white/45">
        {c("Your story starts here. Play your first season to write the opening chapter.",
          "Tu historia empieza aquí. Juega tu primera temporada para escribir el primer capítulo.")}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {chapters.map((ch, i) => (
        <Chapter key={ch.key} chapter={ch} index={i} last={i === chapters.length - 1} defaultOpen={defaultOpen} />
      ))}
    </div>
  );
}

function Chapter({ chapter: ch, index, last, defaultOpen }: { chapter: ClubChapter; index: number; last: boolean; defaultOpen: boolean }) {
  const c = useC();
  const [open, setOpen] = useState(defaultOpen);
  const multi = ch.seasons.length > 1;
  const span = multi ? `${ch.fromYear}–${ch.toYear + 1}` : seasonLabel(ch.fromYear);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1122]">
      <button
        onClick={() => multi && setOpen((o) => !o)}
        className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${multi ? "hover:bg-white/[0.03]" : "cursor-default"}`}
      >
        {/* rail */}
        <span aria-hidden className="relative hidden w-4 self-stretch sm:block">
          <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10" style={{ top: index === 0 ? "50%" : 0, height: last ? "50%" : "100%" }} />
          <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: ch.clubColors[0], boxShadow: `0 0 0 2px #0b1122` }} />
        </span>

        <ClubCrest short={ch.clubShort} colors={ch.clubColors} size={40} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-display text-base font-extrabold text-white">{ch.clubName}</span>
            <CountryFlag country={ch.clubCountry} size={13} />
          </div>
          <div className="text-[0.68rem] text-white/45">
            {span}{multi ? ` · ${ch.seasons.length} ${c("seasons", "temporadas")}` : ""}
          </div>
        </div>

        {/* aggregate stats */}
        <div className="hidden items-center gap-5 sm:flex">
          <Stat label={c("Apps", "PJ")} value={ch.apps} />
          <Stat label={c("Goals", "Goles")} value={ch.goals} />
          <Stat label={c("Assists", "Asist.")} value={ch.assists} />
          <Stat label="OVR" value={multi ? `${ch.ovrFrom}→${ch.ovrTo}` : ch.ovrTo} />
        </div>
        <div className="flex items-center gap-2">
          {ch.honours > 0 && <span className="text-sm">{"🏆".repeat(Math.min(3, ch.honours))}</span>}
          {multi && <span aria-hidden className={`text-xs text-white/40 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>}
        </div>
      </button>

      {/* mobile aggregate row */}
      <div className="flex items-center gap-4 border-t border-white/6 px-4 py-2 sm:hidden">
        <Stat label={c("Apps", "PJ")} value={ch.apps} />
        <Stat label={c("Goals", "Goles")} value={ch.goals} />
        <Stat label={c("Assists", "Asist.")} value={ch.assists} />
        <Stat label="OVR" value={multi ? `${ch.ovrFrom}→${ch.ovrTo}` : ch.ovrTo} />
      </div>

      {open && multi && (
        <div className="border-t border-white/8 px-4 py-2">
          {ch.seasons.map((s) => <SeasonRow key={s.year} season={s} />)}
        </div>
      )}
    </div>
  );
}

function SeasonRow({ season: s }: { season: CareerSeason }) {
  return (
    <div className="flex items-center gap-3 py-1.5 text-sm">
      <span className="w-16 shrink-0 text-[0.7rem] font-semibold text-white/45">{seasonLabel(s.year)}</span>
      <span className="w-8 shrink-0 text-[0.7rem] text-white/40">{s.age}y</span>
      <span className="w-9 shrink-0 font-display text-sm font-bold text-gold">{s.overall}</span>
      <span className="flex-1 text-[0.72rem] text-white/60">
        {s.apps} <span className="text-white/30">{"apps"}</span> · {s.goals}<span className="text-white/30">g</span> · {s.assists}<span className="text-white/30">a</span>
      </span>
      {s.honours.length > 0 && <span className="text-[0.66rem] text-gold/80">{s.honours.join(" · ")}</span>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <div className="font-display text-sm font-extrabold text-white">{value}</div>
      <div className="text-[0.5rem] font-bold uppercase tracking-widest text-white/35">{label}</div>
    </div>
  );
}
