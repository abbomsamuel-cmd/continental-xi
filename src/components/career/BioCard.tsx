"use client";

import { useRef, useState } from "react";
import { useC, formAccent, formLabel } from "@/lib/career/copy";
import { useLang } from "@/lib/i18n";
import { useFxLevel } from "@/lib/fx";
import { fmtMoney, seasonLabel } from "@/lib/career/util";
import { CountryFlag } from "@/components/career/CountryFlag";
import { ClubCrest } from "@/components/career/ClubCrest";
import type { CareerPlayer } from "@/lib/career/types";

/**
 * The player's card — a premium card, never a portrait.
 *
 * That's a deliberate line this codebase already holds (see PlayerHeader):
 * there are no real player photographs anywhere in the app, so where a cutout
 * would go there's a kit plate instead — the club's own colours, the shirt
 * number, the player's initials. It reads as a card without borrowing anyone's
 * likeness.
 *
 * The card tilts toward the pointer with a glare that tracks it. That's a
 * transform and a moving gradient on one element, driven straight from the
 * pointer event with no state churn per frame — and it's dropped entirely
 * below full fx, where a touch device has no hover to track anyway.
 */

function ovrSkin(ovr: number): { rim: string; aura: string; ink: string; face: string } {
  if (ovr >= 85) return { rim: "#f2c94c", aura: "rgba(242,201,76,0.55)", ink: "#2a1e00", face: "linear-gradient(150deg,#f8e5a4,#d9b13f)" };
  if (ovr >= 80) return { rim: "#bcd4ff", aura: "rgba(143,184,255,0.45)", ink: "#0a1836", face: "linear-gradient(150deg,#dbe7ff,#8fb8ff)" };
  if (ovr >= 74) return { rim: "#c3ccd9", aura: "rgba(179,188,203,0.4)", ink: "#0e1626", face: "linear-gradient(150deg,#dee4ee,#8794a8)" };
  if (ovr >= 67) return { rim: "#a3acbb", aura: "rgba(154,163,178,0.35)", ink: "#0c111c", face: "linear-gradient(150deg,#c2c9d6,#6f7a8c)" };
  return { rim: "#e6a25b", aura: "rgba(230,162,91,0.4)", ink: "#2a1600", face: "linear-gradient(150deg,#f2c391,#cf7d33)" };
}

const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export function BioCard({
  player, totals, statusLabel, statusTone, caps, intlGoals, className = "",
}: {
  player: CareerPlayer;
  totals: { apps: number; goals: number; assists: number };
  statusLabel: string;
  statusTone: string;
  caps: number;
  intlGoals: number;
  className?: string;
}) {
  const c = useC();
  const { lang } = useLang();
  const flat = useFxLevel() !== "full";
  const skin = ovrSkin(player.overall);
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ rx: number; ry: number; gx: number; gy: number } | null>(null);

  const onMove = (e: React.PointerEvent) => {
    if (flat || e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({ rx: (0.5 - py) * 10, ry: (px - 0.5) * 12, gx: px * 100, gy: py * 100 });
  };

  return (
    <div className={className} style={flat ? undefined : { perspective: 900 }}>
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={() => setTilt(null)}
        className="relative overflow-hidden rounded-2xl p-4 sm:p-5"
        style={{
          background: "linear-gradient(158deg, #131a2c 0%, #0a0f1c 42%, #06090f 100%)",
          boxShadow: `inset 0 0 0 1px ${skin.rim}55, 0 0 34px ${skin.aura}, 0 18px 40px rgba(0,0,0,0.55)`,
          transform: tilt ? `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` : undefined,
          transition: "transform 220ms ease-out",
          transformStyle: flat ? undefined : "preserve-3d",
        }}
      >
        {/* the aura behind the rating, and the glare that follows the pointer */}
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{
          background: `radial-gradient(38% 44% at 18% 12%, ${skin.aura}, transparent 70%)`,
        }} />
        {tilt && (
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{
            background: `radial-gradient(28% 34% at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.14), transparent 70%)`,
          }} />
        )}

        <div className="relative flex items-start gap-3">
          {/* rating, position, era, value — the card's left rail */}
          <div className="flex shrink-0 flex-col items-center">
            <span className="grid place-items-center rounded-xl px-2 py-1 leading-none"
              style={{ background: skin.face, color: skin.ink, boxShadow: `0 0 20px ${skin.aura}` }}>
              <span className="text-[0.44rem] font-black uppercase tracking-[0.2em] opacity-70">OVR</span>
              <span className="font-display text-2xl font-black">{player.overall}</span>
            </span>
            <span className="mt-1 rounded-md bg-white/10 px-1.5 py-px font-display text-[0.62rem] font-black text-white">
              {player.position}
            </span>
            <CountryFlag country={player.nationality} size={20} />
          </div>

          {/* the kit plate — where a cutout would be, without a likeness */}
          <div className="relative grid h-[86px] flex-1 place-items-center overflow-hidden rounded-xl"
            style={{
              background: `linear-gradient(150deg, ${player.currentClubColors[0]}55, ${player.currentClubColors[1]}22 60%, rgba(4,8,16,0.9))`,
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
            }}>
            <span aria-hidden className="absolute font-display font-black leading-none text-white/8"
              style={{ fontSize: 76 }}>
              {player.shirtNumber}
            </span>
            <span className="relative font-display text-2xl font-black tracking-widest text-white/85"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.7)" }}>
              {initialsOf(player.name)}
            </span>
            <span className="absolute bottom-1 right-1.5">
              <ClubCrest name={player.currentClubName} short={player.currentClubShort}
                colors={player.currentClubColors} size={22} />
            </span>
          </div>
        </div>

        {/* name */}
        <h1 className="relative mt-2 truncate font-display text-2xl font-black uppercase leading-none tracking-wide text-white">
          {player.name}
        </h1>
        <div className="relative mt-1 flex items-center gap-1.5">
          <ClubCrest name={player.currentClubName} short={player.currentClubShort}
            colors={player.currentClubColors} size={15} />
          <span className="truncate text-[0.78rem] font-semibold text-white/70">{player.currentClubName}</span>
        </div>

        {/* era · age · value */}
        <div className="relative mt-3 grid grid-cols-3 gap-1.5">
          <Fact k={c("Era", "Era")} v={seasonLabel(player.currentYear)} />
          <Fact k={c("Age", "Edad")} v={String(player.age)} />
          <Fact k={c("Value", "Valor")} v={fmtMoney(player.marketValue)} tone={skin.rim} />
        </div>

        {/* standing */}
        <div className="relative mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full px-2.5 py-0.5 text-[0.64rem] font-bold"
            style={{ background: `${statusTone}1f`, color: statusTone }}>{statusLabel}</span>
          <span className="rounded-full px-2.5 py-0.5 text-[0.64rem] font-semibold"
            style={{ background: `${formAccent[player.form]}18`, color: formAccent[player.form] }}>
            {formLabel(player.form, lang)}
          </span>
          {caps > 0 && (
            <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-[0.64rem] font-semibold text-white/70">
              {caps} {c("caps", "PJ")} · {intlGoals} {c("gls", "gol")}
            </span>
          )}
        </div>

        {/* career output */}
        <div className="relative mt-3 grid grid-cols-3 gap-1.5">
          <GlassStat n={totals.apps} k={c("Apps", "PJ")} tone="#8fb8ff" />
          <GlassStat n={totals.goals} k={c("Goals", "Goles")} tone="#7ee081" />
          <GlassStat n={totals.assists} k={c("Assists", "Asist")} tone="#c9a7ff" />
        </div>
      </div>
    </div>
  );
}

function Fact({ k, v, tone }: { k: string; v: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-white/5 px-2 py-1" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}>
      <div className="text-[0.42rem] font-bold uppercase tracking-[0.2em] text-white/35">{k}</div>
      <div className="truncate font-display text-[0.78rem] font-black" style={{ color: tone ?? "#ffffff" }}>{v}</div>
    </div>
  );
}

/** Frosted tile with a lit number. The blur is a global fx concern — the root
 *  strips backdrop-filters below full fx, so phones get the flat tile free. */
function GlassStat({ n, k, tone }: { n: number; k: string; tone: string }) {
  return (
    <div className="rounded-xl px-2 py-2 text-center backdrop-blur-md"
      style={{ background: "rgba(255,255,255,0.06)", boxShadow: `inset 0 0 0 1px ${tone}33, 0 4px 14px rgba(0,0,0,0.4)` }}>
      <div className="font-display text-xl font-black leading-none tabular-nums"
        style={{ color: tone, textShadow: `0 0 14px ${tone}88` }}>{n}</div>
      <div className="mt-1 text-[0.44rem] font-bold uppercase tracking-[0.22em] text-white/45">{k}</div>
    </div>
  );
}
