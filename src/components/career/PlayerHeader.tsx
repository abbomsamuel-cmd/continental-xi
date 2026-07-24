"use client";

import { useLang } from "@/lib/i18n";
import { archetypeById, positionById } from "@/lib/career/data";
import { fmtMoney, fmtWage, seasonLabel } from "@/lib/career/util";
import { potentialAccent, potentialLabel, reputationLabel, roleLabel, useC } from "@/lib/career/copy";
import { careerStatus, statusToneColor } from "@/lib/career/status";
import type { CareerPlayer } from "@/lib/career/types";
import { CountryFlag } from "./CountryFlag";
import { ClubCrest } from "./ClubCrest";

/**
 * The player's identity — a premium card, never a portrait. Always visible at
 * the top of Career Mode. Dark navy surface, gold accents, one clear hierarchy:
 * the OVR and the name dominate; everything else is a quiet fact row.
 */
export function PlayerHeader({ player, compact = false }: { player: CareerPlayer; compact?: boolean }) {
  const { lang } = useLang();
  const c = useC();
  const pos = positionById(player.position);
  const arch = archetypeById(player.position, player.archetypeId);
  // Which way the arrow points: the overall movement of the last season played.
  const hist = player.seasons;
  const ovrDelta = hist.length >= 2 ? hist[hist.length - 1].overall - hist[hist.length - 2].overall : 0;
  const status = careerStatus(player.age, player.overall, ovrDelta, {
    retired: player.retired,
    peakOverall: player.peakOverall,
  });

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0b1122] px-3 py-2">
        <OvrBadge value={player.overall} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-display text-sm font-extrabold text-white">{player.name}</span>
            <CountryFlag country={player.nationality} size={13} />
          </div>
          <div className="flex items-center gap-1.5 text-[0.6rem] text-white/50">
            <ClubCrest short={player.currentClubShort} colors={player.currentClubColors} size={13} />
            <span className="truncate">{player.currentClubName}</span>
          </div>
        </div>
        <span className="rounded-md bg-gold/15 px-1.5 py-0.5 text-[0.62rem] font-bold text-gold">{player.position}</span>
      </div>
    );
  }

  const facts: [string, string][] = [
    [c("Age", "Edad"), `${player.age}`],
    [c("Market Value", "Valor"), fmtMoney(player.marketValue)],
    [c("Wage", "Salario"), fmtWage(player.wage)],
    [c("Contract", "Contrato"), seasonLabel(player.contractUntil)],
    [c("Preferred Foot", "Pie"), player.foot === "Left" ? c("Left", "Izquierdo") : c("Right", "Derecho")],
    [c("Shirt", "Dorsal"), `#${player.shirtNumber}`],
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1326] to-[#070b18]">
      {/* club colour hairline */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${player.currentClubColors[0]}, ${player.currentClubColors[1]})` }} />

      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        {/* OVR + position */}
        <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-2">
          <OvrBadge value={player.overall} size={72} />
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-white/8 px-2 py-1 font-display text-sm font-extrabold tracking-wide text-white">{player.position}</span>
            <span className="rounded-md px-2 py-1 text-[0.6rem] font-bold uppercase tracking-wider"
              style={{ background: `${potentialAccent[player.potentialTier]}1f`, color: potentialAccent[player.potentialTier] }}>
              {potentialLabel(player.potentialTier, lang)}
            </span>
          </div>
        </div>

        {/* identity */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <CountryFlag country={player.nationality} size={20} />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/45">{player.nationality}</span>
          </div>
          <h1 className="mt-1 truncate font-display text-3xl font-black leading-none text-white sm:text-4xl">{player.name}</h1>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
            <span className="flex items-center gap-1.5">
              <ClubCrest short={player.currentClubShort} colors={player.currentClubColors} size={22} />
              <span className="font-semibold text-white/85">{player.currentClubName}</span>
            </span>
            <span className="text-white/25">·</span>
            <span className="text-white/60">{pos.name}</span>
            <span className="text-white/25">·</span>
            <span className="text-white/60">{arch.label}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full px-2.5 py-0.5 text-[0.66rem] font-bold"
              style={{ background: `${statusToneColor(status.tone)}1f`, color: statusToneColor(status.tone) }}>
              {lang === "es" ? status.labelEs : status.label}
            </span>
            <span className="rounded-full bg-gold/12 px-2.5 py-0.5 text-[0.66rem] font-bold text-gold">{roleLabel(player.role, lang)}</span>
            <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-[0.66rem] font-semibold text-white/70">{reputationLabel(player.reputation, lang)}</span>
          </div>
        </div>

        {/* fact grid */}
        <div className="grid shrink-0 grid-cols-3 gap-x-5 gap-y-3 sm:grid-cols-2">
          {facts.map(([k, v]) => (
            <div key={k}>
              <div className="text-[0.52rem] font-bold uppercase tracking-widest text-white/35">{k}</div>
              <div className="mt-0.5 font-display text-sm font-extrabold text-white">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OvrBadge({ value, size }: { value: number; size: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-xl font-display font-black text-[#0a0f1e]"
      style={{
        width: size, height: size, fontSize: size * 0.42,
        background: "linear-gradient(150deg, #f2d472, #d4af37)",
        boxShadow: "0 6px 20px rgba(212,175,55,0.28)",
      }}
    >
      {value}
    </span>
  );
}
