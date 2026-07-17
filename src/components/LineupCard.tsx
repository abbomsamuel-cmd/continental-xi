"use client";

/**
 * ContinentalXI Player Card V5 — a broadcast badge, not a collectible card.
 *
 * Built like a premium lineup graphic: a clean vertical tile with a docked
 * rating tab (its chamfered corner is the ContinentalXI mark), position top
 * centre, nation flag + club crest top right, the surname as the largest
 * element, the season underneath and a thin competition accent baseline.
 *
 *   cl    midnight navy · electric-blue edge · gold rating · sharp corners
 *   euro  white · royal-blue ink · silver edge · rounded corners
 *   copa  emerald · gold edge · warm light · soft corners
 *
 * Sizing: card width is set in `cqw` of the PITCH; every inner measure is in
 * `cqw` of the CARD, so the same design scales from the builder to the share
 * graphic. Phones get a dedicated compact badge, not a shrunk desktop card.
 */

import { useEffect, useState } from "react";
import type { PitchVariant } from "@/components/Pitch";
import { flagFor } from "@/lib/flags";
import { fxLevel } from "@/lib/fx";

export type BadgeKind = "crest" | "flag";

function surname(name: string): string {
  return name.trim().split(/\s+/).pop() ?? name;
}

/** Tiny original club crest (split shield + star) or nation flag (diagonal bicolor). */
function MiniBadge({ colors, kind, w }: { colors: [string, string]; kind: BadgeKind; w: string }) {
  if (kind === "flag") {
    const id = `fclip-${colors[0].replace("#", "")}-${colors[1].replace("#", "")}`;
    return (
      <svg viewBox="0 0 16 11" style={{ width: w, height: "auto" }} aria-hidden>
        <clipPath id={id}><rect x="0" y="0" width="16" height="11" rx="1.5" /></clipPath>
        <g clipPath={`url(#${id})`}>
          <path d="M0 0 H16 V11 Z" fill={colors[1]} />
          <path d="M0 0 H16 V0 L0 11 Z" fill={colors[0]} />
        </g>
        <rect x="0.4" y="0.4" width="15.2" height="10.2" rx="1.3" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 14 15" style={{ width: w, height: "auto" }} aria-hidden>
      <path d="M7 0.6 12.7 2.4 V7.5 C12.7 11 10 13.4 7 14.4 4 13.4 1.3 11 1.3 7.5 V2.4 Z" fill={colors[0]} stroke="rgba(255,255,255,0.85)" strokeWidth="0.7" />
      <path d="M7 0.6 12.7 2.4 V7.5 C12.7 9 11.6 10.4 10.3 11.3 L7 6 Z" fill={colors[1]} opacity="0.85" />
      <circle cx="7" cy="6.4" r="1.5" fill="#f2d472" />
    </svg>
  );
}

/** The docked rating tab's chamfer — the shape that makes a V5 card a V5 card. */
const TAB_CLIP = "polygon(0 0, 100% 0, 100% 60%, 78% 100%, 0 100%)";

const GOLD_EDGE = "rgba(228,190,90,0.9)";

interface Skin {
  badge: BadgeKind;
  light: boolean;
  radius: string;      // desktop corner language (cqw of the card)
  radiusM: string;     // phone tile corners (px)
  card: string;
  border: string;
  shadow: string;      // soft realistic depth + thin comp glow
  ratingBg: string;
  ratingInk: string;
  ratingM: string;     // phone rating ink
  pos: string;
  name: string;
  season: string;
  hairline: string;    // chrome/silver/gold divider
  accent: string;      // bottom competition line
}

const SKIN: Record<PitchVariant, Skin> = {
  cl: {
    badge: "crest", light: false, radius: "4.5cqw", radiusM: "5px",
    card: "linear-gradient(180deg, #101f4e 0%, #0a163b 62%, #070f2c 100%)",
    border: "rgba(96,150,255,0.55)",
    shadow: "inset 0 0 12px rgba(80,140,255,0.12), 0 0 8px rgba(80,140,255,0.26), 0 5px 12px rgba(0,0,0,0.45)",
    ratingBg: "linear-gradient(160deg, #f7e39a, #d4af37 78%)", ratingInk: "#231a04", ratingM: "#f2d472",
    pos: "#8fc1ff", name: "#f4f7ff", season: "#9db9f5",
    hairline: "linear-gradient(90deg, transparent, rgba(215,228,255,0.65), transparent)",
    accent: "linear-gradient(90deg, #2f6bff, #37e0ff)",
  },
  euro: {
    badge: "flag", light: true, radius: "13cqw", radiusM: "9px",
    card: "linear-gradient(180deg, #ffffff 0%, #f4f7fd 70%, #e9eefb 100%)",
    border: "rgba(148,162,192,0.8)",
    shadow: "inset 0 0 10px rgba(120,140,190,0.10), 0 5px 12px rgba(8,20,70,0.30)",
    ratingBg: "linear-gradient(160deg, #3a6cf0, #1b3fd0 80%)", ratingInk: "#ffffff", ratingM: "#1b3fd0",
    pos: "#1b3fd0", name: "#0c1f60", season: "#41569e",
    hairline: "linear-gradient(90deg, transparent, rgba(140,155,185,0.6), transparent)",
    accent: "linear-gradient(90deg, #1b3fd0, #4f7dff)",
  },
  copa: {
    badge: "flag", light: false, radius: "8cqw", radiusM: "7px",
    card: "linear-gradient(180deg, #0f5a33 0%, #0a4225 62%, #062d18 100%)",
    border: "rgba(224,186,88,0.6)",
    shadow: "inset 0 0 12px rgba(255,205,110,0.10), 0 0 8px rgba(255,190,70,0.2), 0 5px 12px rgba(0,0,0,0.45)",
    ratingBg: "linear-gradient(160deg, #f7e39a, #d9a92f 78%)", ratingInk: "#2a1d03", ratingM: "#ffd98f",
    pos: "#ffd98f", name: "#fff8e8", season: "#f0cf8f",
    hairline: "linear-gradient(90deg, transparent, rgba(240,207,143,0.55), transparent)",
    accent: "linear-gradient(90deg, #d4af37, #17c97a)",
  },
};

/** Counts up to the rating on mount (full FX only) — the card "powers on". */
function RatingNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (fxLevel() !== "full") return;
    let i = Math.max(0, value - 12);
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= value) clearInterval(id);
    }, 26);
    return () => clearInterval(id);
  }, [value]);
  return <>{shown}</>;
}

interface Props {
  name: string;
  overall: number;
  colors: [string, string];
  nationality?: string;
  seasonLabel?: string;
  slotPos?: string;
  clubLabel?: string;
  variant?: PitchVariant;
  badge?: BadgeKind;
  showRating?: boolean;
  secondaryColor?: string;
  captain?: boolean;
  selected?: boolean;
  slotGlow?: string;
  widthClass?: string;
}

/** FILLED tile — the ContinentalXI broadcast badge. */
export function LineupCard({
  name, overall, colors, nationality, seasonLabel, slotPos, clubLabel, variant = "cl",
  badge, showRating = true, secondaryColor, captain, selected, slotGlow = "rgba(242,212,114,0.9)",
  widthClass = "w-[12.5cqw]",
}: Props) {
  const s = SKIN[variant] ?? SKIN.cl;
  const badgeKind = badge ?? s.badge;
  const sur = surname(name);
  const flag = flagFor(nationality);
  // long surnames scale down instead of truncating into ugliness
  const nameSize = sur.length > 13 ? "12cqw" : sur.length > 10 ? "14cqw" : sur.length > 7 ? "16.5cqw" : "19cqw";
  const edge = captain || selected ? GOLD_EDGE : secondaryColor ?? s.border;
  const posInk = secondaryColor ?? s.pos;
  const label = [name, clubLabel, seasonLabel].filter(Boolean).join(" · ");

  return (
    <>
      {/* PHONE — dedicated compact badge: rating + flag + accent + surname */}
      <div className="flex flex-col items-center sm:hidden" title={label}>
        <div className="relative grid place-items-center overflow-hidden"
          style={{
            width: "clamp(30px,11vw,40px)", aspectRatio: "1 / 1.04", containerType: "inline-size",
            borderRadius: s.radiusM, background: s.card,
            border: `1px solid ${captain || selected ? GOLD_EDGE : secondaryColor ?? s.border}`,
            boxShadow: selected ? `0 0 10px ${slotGlow}` : "0 3px 8px rgba(0,0,0,0.45)",
          }}>
          {showRating && (
            <span className="font-display font-extrabold leading-none" style={{ fontSize: "42cqw", color: s.ratingM }}>
              {overall}
            </span>
          )}
          {flag && <span aria-hidden className="absolute leading-none" style={{ right: "4cqw", top: "4cqw", fontSize: "24cqw" }}>{flag}</span>}
          <span aria-hidden className="absolute inset-x-0 bottom-0" style={{ height: "6cqw", background: s.accent }} />
        </div>
        <span className="mt-0.5 max-w-[56px] truncate text-[0.47rem] font-extrabold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">{sur}</span>
      </div>

      {/* DESKTOP / TABLET — the broadcast tile */}
      <div className={`hidden ${widthClass} lineup-card-v5 sm:block`} style={{ containerType: "inline-size" }} title={label}>
        <div
          className={`relative flex flex-col overflow-hidden ${selected ? "cardv5-selected" : ""}`}
          style={{
            aspectRatio: "1 / 1.28", borderRadius: s.radius, background: s.card,
            border: `1px solid ${edge}`, boxShadow: s.shadow,
            ["--sel" as string]: slotGlow,
          }}
        >
          {/* soft studio light from above — the only decoration */}
          <span aria-hidden className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(120% 46% at 50% -10%, rgba(255,255,255,0.14), transparent 60%)" }} />

          {/* header: rating tab · position · flag + crest */}
          <div className="relative" style={{ height: "30cqw" }}>
            {showRating && (
              <div className="absolute left-0 top-0 flex items-center justify-center font-display font-extrabold leading-none"
                style={{ minWidth: "30cqw", height: "23cqw", paddingInline: "4cqw", fontSize: "16.5cqw", background: s.ratingBg, color: s.ratingInk, clipPath: TAB_CLIP }}>
                <RatingNumber value={overall} />
              </div>
            )}
            {slotPos && (
              <div className="absolute left-1/2 -translate-x-1/2 font-display font-extrabold uppercase leading-none"
                style={{ top: "4cqw", fontSize: "11.5cqw", color: posInk, letterSpacing: "0.05em" }}>
                {slotPos}
              </div>
            )}
            <div className="absolute flex flex-col items-center" style={{ right: "4cqw", top: "3.5cqw", gap: "2.5cqw" }}>
              {flag && <span aria-hidden className="leading-none" style={{ fontSize: "10.5cqw" }}>{flag}</span>}
              {badgeKind === "crest"
                ? <MiniBadge colors={colors} kind="crest" w="12cqw" />
                : !flag && <MiniBadge colors={colors} kind="flag" w="13cqw" />}
            </div>
          </div>

          {/* name — the identity of the card, always the largest element */}
          <div className="relative flex flex-1 items-center justify-center" style={{ paddingInline: "4cqw" }}>
            <div className="max-w-full truncate text-center font-display font-extrabold uppercase leading-none"
              style={{ color: s.name, fontSize: nameSize, letterSpacing: "0.01em" }}>
              {sur}
            </div>
          </div>

          {/* divider · season · competition baseline */}
          <div className="relative flex flex-col items-center" style={{ gap: "3cqw", paddingBottom: "6.5cqw" }}>
            <span aria-hidden style={{ width: "56cqw", height: "1px", background: s.hairline }} />
            {seasonLabel ? (
              <span className="font-bold leading-none" style={{ fontSize: "7.5cqw", letterSpacing: "0.14em", color: s.season }}>
                {seasonLabel}
              </span>
            ) : (
              <span style={{ height: "7.5cqw" }} />
            )}
          </div>
          <span aria-hidden className="absolute inset-x-0 bottom-0" style={{ height: "2.4cqw", background: s.accent }} />
        </div>
      </div>
    </>
  );
}

export type SlotState = "idle" | "draftable" | "target" | "blocked" | "selected";

/** EMPTY slot — the same broadcast tile, hollow, showing the position. */
export function EmptyTile({
  variant, pos, state, color, sub, widthClass = "w-[12.5cqw]",
}: {
  variant: PitchVariant; pos: string; state: SlotState; color?: string; sub?: string; widthClass?: string;
}) {
  const s = SKIN[variant] ?? SKIN.cl;
  const active = state === "draftable" || state === "target" || state === "selected";
  const blocked = state === "blocked";
  const c = color ?? (s.light ? "rgba(230,238,255,0.9)" : s.border);
  const edge = blocked ? "#ff5a6a" : active ? c : s.border;
  const glow = state === "selected" ? c : state === "target" || state === "draftable" ? `${c}88` : undefined;
  const ink = blocked ? "#ff8b96" : active ? c : "rgba(255,255,255,0.75)";

  return (
    <div className={`${widthClass} ${state === "draftable" ? "animate-pulse" : ""}`} style={{ containerType: "inline-size", animationDuration: "1.8s" }}>
      <div className="relative flex flex-col items-center justify-center overflow-hidden"
        style={{
          aspectRatio: "1 / 1.28", borderRadius: s.radius,
          border: `1.2px ${state === "idle" ? "dashed" : "solid"} ${edge}`,
          background: blocked ? "rgba(44,10,14,0.78)" : "rgba(7,16,40,0.72)",
          boxShadow: glow ? `0 0 10px ${glow}` : "0 4px 10px rgba(0,0,0,0.35)",
        }}>
        {blocked ? (
          <span style={{ fontSize: "30cqw", color: "#ff8b96" }}>⊘</span>
        ) : (
          <>
            <span className="font-display font-extrabold leading-none" style={{ fontSize: "24cqw", color: ink }}>{pos}</span>
            {sub ? (
              <span className="font-bold uppercase leading-none" style={{ fontSize: "11cqw", marginTop: "4cqw", color: c }}>{sub}</span>
            ) : (
              <span className="grid place-items-center rounded-full leading-none" style={{ marginTop: "6cqw", width: "18cqw", height: "18cqw", border: `1.2px solid ${ink}`, color: ink, fontSize: "12cqw" }}>＋</span>
            )}
          </>
        )}
        <span aria-hidden className="absolute inset-x-0 bottom-0 opacity-50" style={{ height: "2.4cqw", background: s.accent }} />
      </div>
    </div>
  );
}
