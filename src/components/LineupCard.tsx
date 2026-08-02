"use client";

/**
 * ContinentalXI Player Card V8 — a shield-silhouette broadcast badge.
 *
 * A layered lineup tile built to read at a glance on the pitch and still look
 * like a graphic-design piece up close:
 *   · a shield card shape (chamfered top, tapered base) — a generic trading
 *     card format, not a trace of any specific real card design
 *   · one clean rounded rating badge (rating + position stacked)
 *   · real nation flag + original club crest, top right
 *   · the surname as the hero element
 *   · a season pill sitting just above a CLUB-COLOUR ribbon along the base —
 *     every player carries his own colours, so an XI reads as eleven
 *     different clubs at a glance
 *   · a soft holographic sheen and a thin competition glow around the whole tile
 *
 *   cl    obsidian/slate · cyan edge · cyan rating
 *   euro  white · royal-blue ink · silver edge
 *   copa  emerald/slate · gold edge · warm light
 *
 * Sizing: card width is set in `cqw` of the PITCH; every inner measure is in
 * `cqw` of the CARD, so the same design scales from the builder to the share
 * graphic. Phones get a dedicated compact badge, not a shrunk desktop card.
 */

import { useEffect, useState } from "react";
import type { PitchVariant } from "@/components/Pitch";
import { Flag } from "@/components/Flag";
import { flagCodeFor } from "@/lib/flags";
import { ClubCrest } from "@/components/ClubCrest";
import { SHIELD_CLIP, CARD_MOSAIC } from "@/lib/cardShape";
import { fxLevel } from "@/lib/fx";

export type BadgeKind = "crest" | "flag";

function surname(name: string): string {
  return name.trim().split(/\s+/).pop() ?? name;
}

/** Tiny original club crest (split shield + star) or nation flag (diagonal bicolor). */
function MiniBadge({ colors, kind, w, club }: { colors: [string, string]; kind: BadgeKind; w: string; club?: string }) {
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
  return <ClubCrest colors={colors} seed={club} width={w} />;
}

const SELECTED_EDGE = "rgba(0,240,255,0.95)";

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
  posChipBg: string;
  pos: string;
  name: string;
  nameShadow: string;
  season: string;
  accent: string;      // competition line above the club ribbon
  sheen: string;       // diagonal holographic highlight
}

const SKIN: Record<PitchVariant, Skin> = {
  cl: {
    badge: "crest", light: false, radius: "4cqw", radiusM: "5px",
    card: "linear-gradient(168deg, #182233 0%, #121824 55%, #0a0e17 100%)",
    border: "rgba(0,240,255,0.45)",
    shadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 0 10px rgba(0,240,255,0.22), 0 6px 14px rgba(0,0,0,0.5)",
    ratingBg: "linear-gradient(150deg, #baffdd 0%, #7dfaff 42%, #00b8c4 100%)", ratingInk: "#04140c",
    ratingM: "#7dfaff",
    posChipBg: "rgba(0,240,255,0.18)", pos: "#93c5fd",
    name: "#f8fafc", nameShadow: "0 1px 3px rgba(0,0,0,0.55)", season: "#94a3b8",
    accent: "linear-gradient(90deg, #00f0ff, #00f0ff)",
    sheen: "linear-gradient(115deg, transparent 30%, rgba(0,240,255,0.1) 46%, rgba(255,255,255,0.05) 52%, transparent 66%)",
  },
  euro: {
    badge: "flag", light: true, radius: "12cqw", radiusM: "9px",
    card: "linear-gradient(168deg, #ffffff 0%, #f2f6fd 68%, #e4ecfb 100%)",
    border: "rgba(150,168,205,0.85)",
    shadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 0 8px rgba(60,110,240,0.16), 0 6px 14px rgba(10,25,80,0.32)",
    ratingBg: "linear-gradient(150deg, #4d7bf5 0%, #2547d6 62%, #16308f 100%)", ratingInk: "#ffffff",
    ratingM: "#1b3fd0",
    posChipBg: "rgba(27,63,208,0.12)", pos: "#1b3fd0",
    name: "#0c1f60", nameShadow: "0 1px 1px rgba(255,255,255,0.6)", season: "#41569e",
    accent: "linear-gradient(90deg, #1b3fd0, #ff3b57)",
    sheen: "linear-gradient(115deg, transparent 32%, rgba(120,150,240,0.10) 48%, transparent 64%)",
  },
  copa: {
    badge: "flag", light: false, radius: "7cqw", radiusM: "7px",
    card: "linear-gradient(168deg, #0c4127 0%, #06280f 55%, #02120a 100%)",
    border: "rgba(255,215,0,0.85)",
    shadow: "inset 0 1px 0 rgba(200,255,225,0.22), 0 0 12px rgba(0,230,118,0.32), 0 7px 16px rgba(0,0,0,0.62)",
    ratingBg: "linear-gradient(150deg, #fff2c0 0%, #ffd700 42%, #cf9a2c 100%)", ratingInk: "#2a1d03",
    ratingM: "#ffd98f",
    posChipBg: "rgba(0,230,118,0.16)", pos: "#7dffc4",
    name: "#fff8e8", nameShadow: "0 1px 3px rgba(0,0,0,0.5)", season: "#f0cf8f",
    accent: "linear-gradient(90deg, #ffd700, #00e676)",
    sheen: "linear-gradient(115deg, transparent 30%, rgba(0,230,118,0.12) 47%, transparent 64%)",
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
    // sits just above the shield's tapered point (which starts ~28% up from
    // the base) so the ribbon stays full-width instead of getting clipped
    // down to a sliver near the tip
    <span aria-hidden className="absolute inset-x-0 overflow-hidden" style={{ height: "8.5cqw", bottom: "27%" }}>
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
  badge, showRating = true, secondaryColor, captain, selected, slotGlow = "rgba(0,240,255,0.9)",
  widthClass = "w-[12.5cqw]",
}: Props) {
  const s = SKIN[variant] ?? SKIN.cl;
  const badgeKind = badge ?? s.badge;
  const sur = surname(name);
  const hasFlag = !!flagCodeFor(nationality);
  // long surnames scale down instead of truncating into ugliness
  const nameSize = sur.length > 13 ? "12cqw" : sur.length > 10 ? "14cqw" : sur.length > 7 ? "16.5cqw" : "19cqw";
  const edge = captain || selected ? SELECTED_EDGE : secondaryColor ?? s.border;
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
            border: `1px solid ${captain || selected ? SELECTED_EDGE : secondaryColor ?? s.border}`,
            boxShadow: selected ? `0 0 10px ${slotGlow}` : "0 3px 8px rgba(0,0,0,0.45)",
          }}>
          {showRating && (
            <span className="font-display font-extrabold leading-none" style={{ fontSize: "42cqw", color: s.ratingM }}>
              {overall}
            </span>
          )}
          <Flag nationality={nationality} className="absolute" style={{ right: "4cqw", top: "4cqw", fontSize: "24cqw" }} />
          <ClubRibbon colors={colors} accent={s.accent} />
        </div>
        <span className="mt-0.5 max-w-[56px] truncate text-[0.47rem] font-extrabold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">{sur}</span>
      </div>

      {/* DESKTOP / TABLET — the broadcast tile (shield silhouette) */}
      <div className={`hidden ${widthClass} lineup-card-v5 sm:block`} style={{ containerType: "inline-size" }} title={label}>
        <div
          className={`relative p-[3.5%] ${selected ? "cardv5-selected" : ""}`}
          style={{
            aspectRatio: "1 / 1.3", clipPath: SHIELD_CLIP, background: edge, boxShadow: s.shadow,
            ["--sel" as string]: slotGlow,
          }}
        >
        <div className="relative flex h-full flex-col overflow-hidden" style={{ background: s.card, clipPath: SHIELD_CLIP }}>
          {/* per-competition background texture */}
          <span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: CARD_MOSAIC[variant] }} />
          {/* soft studio light from above */}
          <span aria-hidden className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(120% 44% at 50% -12%, rgba(255,255,255,0.16), transparent 60%)" }} />
          {/* diagonal holographic sheen */}
          <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: s.sheen }} />

          {/* header: one clean rating badge (rating + position) · flag + crest */}
          <div className="relative flex items-start justify-between" style={{ padding: "5cqw 5cqw 0" }}>
            <div className="flex flex-col items-center justify-center rounded-[3cqw] font-display font-extrabold leading-none"
              style={{ minWidth: "27cqw", padding: "2.4cqw 3.2cqw", fontSize: showRating ? "17cqw" : "11cqw", background: s.ratingBg, color: s.ratingInk, boxShadow: "0 3px 10px rgba(0,0,0,0.4)" }}>
              {showRating && <RatingNumber value={overall} />}
              {slotPos && (
                <span className="mt-[0.6cqw] uppercase tracking-wider opacity-85" style={{ fontSize: "7cqw", color: posInk !== s.pos ? posInk : undefined }}>
                  {slotPos}
                </span>
              )}
            </div>
            <div className="flex flex-col items-end" style={{ gap: "2.5cqw" }}>
              <Flag nationality={nationality} style={{ fontSize: "12cqw" }} className="rounded-[1.5px] shadow" />
              {badgeKind === "crest"
                ? <MiniBadge colors={colors} kind="crest" w="13cqw" club={clubLabel} />
                : !hasFlag && <MiniBadge colors={colors} kind="flag" w="14cqw" />}
            </div>
          </div>

          {/* name — the identity of the card, always the largest element */}
          <div className="relative flex flex-1 items-center justify-center" style={{ paddingInline: "4cqw" }}>
            <div className="max-w-full truncate text-center font-display font-extrabold uppercase leading-none"
              style={{ color: s.name, fontSize: nameSize, letterSpacing: "0.01em", textShadow: s.nameShadow }}>
              {sur}
            </div>
          </div>

          {/* season, sitting just above the club-colour ribbon */}
          <div className="relative flex justify-center" style={{ paddingBottom: "34cqw" }}>
            {seasonLabel && (
              <span className="rounded-full font-bold leading-none" style={{ fontSize: "6.8cqw", letterSpacing: "0.1em", color: s.season, padding: "1.2cqw 3.4cqw", background: "rgba(255,255,255,0.07)" }}>
                {seasonLabel}
              </span>
            )}
          </div>
          <ClubRibbon colors={colors} accent={s.accent} />
        </div>
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
          background: blocked ? "rgba(44,10,14,0.72)" : "rgba(10,14,23,0.62)",
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
