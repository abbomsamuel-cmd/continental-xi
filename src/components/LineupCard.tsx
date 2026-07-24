"use client";

/**
 * ContinentalXI Player Card V6 — a premium broadcast badge.
 *
 * A layered lineup tile built to read at a glance on the pitch and still look
 * like a graphic-design piece up close:
 *   · a metallic, chamfered rating pill with a competition-accent underline
 *   · a position chip
 *   · nation flag + original club crest, top right
 *   · the surname as the hero element
 *   · a CLUB-COLOUR team ribbon along the base — every player carries his own
 *     colours, so an XI reads as eleven different clubs at a glance
 *   · a soft holographic sheen and a thin competition glow around the whole tile
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

/** The docked rating tab's chamfer — the shape that makes the badge ours. */
const TAB_CLIP = "polygon(0 0, 100% 0, 100% 58%, 74% 100%, 0 100%)";

const GOLD_EDGE = "rgba(233,197,102,0.95)";

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
  ratingUnderline: string; // thin accent under the rating number
  ratingM: string;     // phone rating ink
  posChipBg: string;
  pos: string;
  name: string;
  nameShadow: string;
  season: string;
  hairline: string;    // chrome/silver/gold divider
  accent: string;      // competition line above the club ribbon
  sheen: string;       // diagonal holographic highlight
}

const SKIN: Record<PitchVariant, Skin> = {
  cl: {
    badge: "crest", light: false, radius: "4cqw", radiusM: "5px",
    card: "linear-gradient(168deg, #16295f 0%, #0d1a44 55%, #070f2c 100%)",
    border: "rgba(120,168,255,0.6)",
    shadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 0 10px rgba(70,130,255,0.3), 0 6px 14px rgba(0,0,0,0.5)",
    ratingBg: "linear-gradient(150deg, #fff2c0 0%, #f2cf6a 42%, #c99327 100%)", ratingInk: "#241a04",
    ratingUnderline: "linear-gradient(90deg, #2f6bff, #37e0ff)", ratingM: "#f2d472",
    posChipBg: "rgba(120,168,255,0.18)", pos: "#a8c9ff",
    name: "#f4f8ff", nameShadow: "0 1px 3px rgba(0,0,0,0.55)", season: "#9db9f5",
    hairline: "linear-gradient(90deg, transparent, rgba(215,228,255,0.7), transparent)",
    accent: "linear-gradient(90deg, #2f6bff, #37e0ff)",
    sheen: "linear-gradient(115deg, transparent 30%, rgba(150,200,255,0.12) 46%, rgba(255,255,255,0.05) 52%, transparent 66%)",
  },
  euro: {
    badge: "flag", light: true, radius: "12cqw", radiusM: "9px",
    card: "linear-gradient(168deg, #ffffff 0%, #f2f6fd 68%, #e4ecfb 100%)",
    border: "rgba(150,168,205,0.85)",
    shadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 0 8px rgba(60,110,240,0.16), 0 6px 14px rgba(10,25,80,0.32)",
    ratingBg: "linear-gradient(150deg, #4d7bf5 0%, #2547d6 62%, #16308f 100%)", ratingInk: "#ffffff",
    ratingUnderline: "linear-gradient(90deg, #16308f, #7fa4ff)", ratingM: "#1b3fd0",
    posChipBg: "rgba(27,63,208,0.12)", pos: "#1b3fd0",
    name: "#0c1f60", nameShadow: "0 1px 1px rgba(255,255,255,0.6)", season: "#41569e",
    hairline: "linear-gradient(90deg, transparent, rgba(120,140,180,0.6), transparent)",
    accent: "linear-gradient(90deg, #16308f, #4f7dff)",
    sheen: "linear-gradient(115deg, transparent 32%, rgba(120,150,240,0.10) 48%, transparent 64%)",
  },
  copa: {
    badge: "flag", light: false, radius: "7cqw", radiusM: "7px",
    card: "linear-gradient(168deg, #0c4127 0%, #06280f 55%, #02120a 100%)",
    border: "rgba(244,206,104,0.85)",
    shadow: "inset 0 1px 0 rgba(255,238,200,0.22), 0 0 12px rgba(255,190,70,0.32), 0 7px 16px rgba(0,0,0,0.62)",
    ratingBg: "linear-gradient(150deg, #fff2c0 0%, #f2c862 42%, #cf9a2c 100%)", ratingInk: "#2a1d03",
    ratingUnderline: "linear-gradient(90deg, #d4af37, #17c97a)", ratingM: "#ffd98f",
    posChipBg: "rgba(255,214,120,0.16)", pos: "#ffdf9a",
    name: "#fff8e8", nameShadow: "0 1px 3px rgba(0,0,0,0.5)", season: "#f0cf8f",
    hairline: "linear-gradient(90deg, transparent, rgba(240,207,143,0.6), transparent)",
    accent: "linear-gradient(90deg, #d4af37, #17c97a)",
    sheen: "linear-gradient(115deg, transparent 30%, rgba(255,224,150,0.12) 47%, transparent 64%)",
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

/** The club-colour ribbon along the base — the player's own identity colours. */
function ClubRibbon({ colors, accent }: { colors: [string, string]; accent: string }) {
  return (
    <span aria-hidden className="absolute inset-x-0 bottom-0 overflow-hidden" style={{ height: "8.5cqw" }}>
      {/* competition accent hairline riding on top of the club ribbon */}
      <span className="absolute inset-x-0 top-0" style={{ height: "1.6cqw", background: accent }} />
      {/* two-tone club colours, split on a diagonal */}
      <span className="absolute inset-0" style={{ background: colors[0] }} />
      <span className="absolute inset-y-0 right-0" style={{ width: "58%", background: colors[1], clipPath: "polygon(28% 0, 100% 0, 100% 100%, 0 100%)" }} />
      {/* gloss */}
      <span className="absolute inset-x-0 top-0" style={{ height: "50%", background: "linear-gradient(180deg, rgba(255,255,255,0.28), transparent)" }} />
    </span>
  );
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
            width: "clamp(30px,11vw,40px)", aspectRatio: "1 / 1.05", containerType: "inline-size",
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
          <ClubRibbon colors={colors} accent={s.accent} />
        </div>
        <span className="mt-0.5 max-w-[56px] truncate text-[0.47rem] font-extrabold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">{sur}</span>
      </div>

      {/* DESKTOP / TABLET — the broadcast tile */}
      <div className={`hidden ${widthClass} lineup-card-v5 sm:block`} style={{ containerType: "inline-size" }} title={label}>
        <div
          className={`relative flex flex-col overflow-hidden ${selected ? "cardv5-selected" : ""}`}
          style={{
            aspectRatio: "1 / 1.3", borderRadius: s.radius, background: s.card,
            border: `1px solid ${edge}`, boxShadow: s.shadow,
            ["--sel" as string]: slotGlow,
          }}
        >
          {/* soft studio light from above */}
          <span aria-hidden className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(120% 44% at 50% -12%, rgba(255,255,255,0.16), transparent 60%)" }} />
          {/* diagonal holographic sheen */}
          <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: s.sheen }} />

          {/* header: rating tab · position chip · flag + crest */}
          <div className="relative" style={{ height: "31cqw" }}>
            {showRating && (
              <div className="absolute left-0 top-0 flex flex-col items-center justify-center font-display font-extrabold leading-none"
                style={{ minWidth: "31cqw", height: "25cqw", paddingInline: "4cqw", fontSize: "17cqw", background: s.ratingBg, color: s.ratingInk, clipPath: TAB_CLIP }}>
                <RatingNumber value={overall} />
                <span aria-hidden className="absolute" style={{ left: "10%", right: "26%", bottom: "16%", height: "1.6cqw", borderRadius: "1px", background: s.ratingUnderline }} />
              </div>
            )}
            {slotPos && (
              <div className="absolute left-1/2 -translate-x-1/2 rounded-[2cqw] font-display font-extrabold uppercase leading-none"
                style={{ top: "4.5cqw", padding: "1.6cqw 3.4cqw", fontSize: "10.5cqw", color: posInk, letterSpacing: "0.04em", background: s.posChipBg }}>
                {slotPos}
              </div>
            )}
            <div className="absolute flex flex-col items-center" style={{ right: "4cqw", top: "4cqw", gap: "2.5cqw" }}>
              {flag && <span aria-hidden className="leading-none" style={{ fontSize: "11cqw" }}>{flag}</span>}
              {badgeKind === "crest"
                ? <MiniBadge colors={colors} kind="crest" w="12cqw" />
                : !flag && <MiniBadge colors={colors} kind="flag" w="13cqw" />}
            </div>
          </div>

          {/* name — the identity of the card, always the largest element */}
          <div className="relative flex flex-1 items-center justify-center" style={{ paddingInline: "4cqw" }}>
            <div className="max-w-full truncate text-center font-display font-extrabold uppercase leading-none"
              style={{ color: s.name, fontSize: nameSize, letterSpacing: "0.01em", textShadow: s.nameShadow }}>
              {sur}
            </div>
          </div>

          {/* divider · season · club-colour ribbon */}
          <div className="relative flex flex-col items-center" style={{ gap: "3cqw", paddingBottom: "12cqw" }}>
            <span aria-hidden style={{ width: "56cqw", height: "1px", background: s.hairline }} />
            {seasonLabel ? (
              <span className="font-bold leading-none" style={{ fontSize: "7.5cqw", letterSpacing: "0.14em", color: s.season }}>
                {seasonLabel}
              </span>
            ) : (
              <span style={{ height: "7.5cqw" }} />
            )}
          </div>
          <ClubRibbon colors={colors} accent={s.accent} />
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
          aspectRatio: "1 / 1.3", borderRadius: s.radius,
          border: `1.2px ${state === "idle" ? "dashed" : "solid"} ${edge}`,
          background: blocked ? "rgba(44,10,14,0.72)" : "rgba(7,16,40,0.62)",
          boxShadow: glow ? `0 0 12px ${glow}` : "0 4px 10px rgba(0,0,0,0.35)",
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
        <span aria-hidden className="absolute inset-x-0 bottom-0 opacity-45" style={{ height: "2.4cqw", background: s.accent }} />
      </div>
    </div>
  );
}
