"use client";

/**
 * ContinentalXI Player Card 4.0 — a signature card language of its own.
 *
 * No portraits, no silhouettes, no FUT shield: a custom angled-badge
 * geometry carried entirely by typography, color and competition identity.
 * The eye reads, in order: RATING → POSITION → NAME → CLUB → SEASON.
 *
 *   cl    deep navy, electric-blue neon frame, metallic-gold rating
 *   euro  pearl white, royal-blue ink, silver frame
 *   copa  emerald night, gold frame, warm accents
 *
 * Sizing: the card width is given in `cqw` relative to the PITCH (which
 * declares container-type); inner type is `cqw` relative to the CARD, so one
 * design scales from the builder to the share graphic. On phones the tile
 * collapses to a compact disc + surname.
 */

import type { PitchVariant } from "@/components/Pitch";

export type BadgeKind = "crest" | "flag";

function surname(name: string): string {
  return name.trim().split(/\s+/).pop() ?? name;
}

/** Kept for consumers that still want the classic outline figure. */
export function Silhouette({ color = "rgba(255,255,255,0.16)" }: { color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className="absolute bottom-0 left-1/2 h-[112%] w-auto -translate-x-1/2" aria-hidden>
      <path d="M12 12.4c2.3 0 4.1-1.9 4.1-4.2S14.3 4 12 4 7.9 5.9 7.9 8.2 9.7 12.4 12 12.4zM12 14c-3.4 0-8 1.7-8 5.1V24h16v-4.9c0-3.4-4.6-5.1-8-5.1z" fill={color} />
    </svg>
  );
}

/** Tiny original club crest (split shield + star) or nation flag (diagonal bicolor). */
export function MiniBadge({ colors, kind, w }: { colors: [string, string]; kind: BadgeKind; w?: string }) {
  if (kind === "flag") {
    const id = `fclip-${colors[0].replace("#", "")}-${colors[1].replace("#", "")}`;
    return (
      <svg viewBox="0 0 16 11" style={{ width: w ?? "20cqw", height: "auto" }} aria-hidden>
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
    <svg viewBox="0 0 14 15" style={{ width: w ?? "17cqw", height: "auto" }} aria-hidden>
      <path d="M7 0.6 12.7 2.4 V7.5 C12.7 11 10 13.4 7 14.4 4 13.4 1.3 11 1.3 7.5 V2.4 Z" fill={colors[0]} stroke="rgba(255,255,255,0.85)" strokeWidth="0.7" />
      <path d="M7 0.6 12.7 2.4 V7.5 C12.7 9 11.6 10.4 10.3 11.3 L7 6 Z" fill={colors[1]} opacity="0.85" />
      <circle cx="7" cy="6.4" r="1.5" fill="#f2d472" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  The signature silhouette: cut shoulders, angled base               */
/* ------------------------------------------------------------------ */

const SHAPE = "polygon(8% 0, 92% 0, 100% 5.5%, 100% 84%, 87% 100%, 13% 100%, 0 84%, 0 5.5%)";

/** Position group colors — GK green · DEF blue · MID yellow · ATT red. */
function posColor(pos: string, light: boolean): string {
  const p = pos.toUpperCase();
  if (p === "GK") return light ? "#0a9a60" : "#2ee6a6";
  if (["RB", "CB", "LB", "RWB", "LWB"].includes(p)) return light ? "#1b3fd0" : "#54a0ff";
  if (["CDM", "CM", "CAM", "RM", "LM"].includes(p)) return light ? "#a87b0b" : "#ffcf5c";
  return light ? "#d21f3c" : "#ff5a6a";
}

interface Ident {
  badge: BadgeKind;
  light: boolean;
  frame: string;
  glow: string;
  card: string;
  texture: string;
  rating: string;   // background-clip gradient for the big number
  name: string;
  club: string;
  season: string;
  seasonBg: string;
  emblem: string;
  emblemColor: string;
}

export const TILE: Record<PitchVariant, Ident> = {
  cl: {
    badge: "crest", light: false,
    frame: "linear-gradient(165deg, #6ea8ff 0%, #2456d8 40%, #d4af37 100%)",
    glow: "rgba(84,160,255,0.45)",
    card: "linear-gradient(178deg, #10265f 0%, #0a1a48 55%, #061131 100%)",
    texture: "repeating-linear-gradient(118deg, rgba(140,180,255,0.05) 0 2px, transparent 2px 9px)",
    rating: "linear-gradient(178deg, #ffe9a8, #d4af37 70%)",
    name: "#f2f6ff", club: "#a8c2ff", season: "#7fb0ff", seasonBg: "rgba(84,160,255,0.14)",
    emblem: "★", emblemColor: "rgba(212,175,55,0.8)",
  },
  euro: {
    badge: "flag", light: true,
    frame: "linear-gradient(165deg, #ffffff 0%, #aebfdd 45%, #2f6bff 100%)",
    glow: "rgba(150,180,240,0.5)",
    card: "linear-gradient(178deg, #ffffff 0%, #f2f5fd 55%, #e3eafa 100%)",
    texture: "repeating-linear-gradient(118deg, rgba(27,63,208,0.045) 0 2px, transparent 2px 9px)",
    rating: "linear-gradient(178deg, #2f6bff, #12308f 75%)",
    name: "#0a1f5e", club: "#41569e", season: "#2f6bff", seasonBg: "rgba(47,107,255,0.1)",
    emblem: "✦", emblemColor: "rgba(47,107,255,0.55)",
  },
  copa: {
    badge: "flag", light: false,
    frame: "linear-gradient(165deg, #ffe08a 0%, #d4af37 45%, #17c97a 100%)",
    glow: "rgba(255,201,60,0.4)",
    card: "linear-gradient(178deg, #0f5c36 0%, #0a4426 55%, #062c18 100%)",
    texture: "repeating-linear-gradient(118deg, rgba(255,225,140,0.05) 0 2px, transparent 2px 9px)",
    rating: "linear-gradient(178deg, #ffe9a8, #ffc93c 70%)",
    name: "#fff6e0", club: "#ffd98f", season: "#ffdf8a", seasonBg: "rgba(255,201,60,0.13)",
    emblem: "◆", emblemColor: "rgba(255,201,60,0.75)",
  },
};

interface Props {
  name: string;
  overall: number;
  colors: [string, string];
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
  portraitClass?: string;
}

/** FILLED tile — typography-first competition card. */
export function LineupCard({
  name, overall, colors, seasonLabel, slotPos, clubLabel, variant = "cl",
  badge, showRating = true, secondaryColor, captain, selected, slotGlow = "rgba(242,212,114,0.9)",
  widthClass = "w-[12cqw]",
}: Props) {
  const s = TILE[variant] ?? TILE.cl;
  const badgeKind = badge ?? s.badge;
  const sur = surname(name);
  // long surnames scale down instead of truncating into ugliness
  const nameSize = sur.length > 11 ? "11.5cqw" : sur.length > 8 ? "13.5cqw" : "16cqw";
  const frame = captain || selected ? "linear-gradient(165deg, #ffe9a8, #d4af37 55%, #b8912a)" : secondaryColor ? `linear-gradient(165deg, ${secondaryColor}, ${secondaryColor})` : s.frame;
  const glow = selected ? slotGlow : s.glow;

  return (
    <>
      {/* MOBILE — compact disc + surname (readability first) */}
      <div className="flex flex-col items-center sm:hidden">
        <div className="relative grid h-[clamp(28px,10.5vw,38px)] w-[clamp(28px,10.5vw,38px)] place-items-center overflow-hidden rounded-full"
          style={{ border: `1.5px solid ${captain || selected ? "#f2d472" : secondaryColor ?? s.emblemColor}`, boxShadow: selected ? `0 0 14px ${slotGlow}` : "0 3px 8px rgba(0,0,0,0.5)", containerType: "inline-size", background: s.card }}>
          {showRating && (
            <span className="font-display font-extrabold leading-none"
              style={{ fontSize: "34cqw", background: s.rating, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              {overall}
            </span>
          )}
          <span className="absolute right-0 top-0 z-[2]"><MiniBadge colors={colors} kind={badgeKind} w="30cqw" /></span>
        </div>
        <span className="mt-0.5 max-w-[54px] truncate text-[0.46rem] font-extrabold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">{sur}</span>
      </div>

      {/* DESKTOP / TABLET — the signature angled badge */}
      <div className={`hidden ${widthClass} lineup-card-40 sm:block`} style={{ containerType: "inline-size" }}>
        <div style={{ clipPath: SHAPE, background: frame, padding: "1.7cqw", filter: `drop-shadow(0 3px 5px rgba(0,0,0,0.4)) drop-shadow(0 0 ${selected ? "9px" : "4px"} ${glow})` }}>
          <div className="relative flex flex-col" style={{ clipPath: SHAPE, background: s.card, aspectRatio: "1 / 1.38" }}>
            {/* texture + top sheen */}
            <div aria-hidden className="absolute inset-0" style={{ background: s.texture }} />
            <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(120% 55% at 50% -12%, rgba(255,255,255,0.16), transparent 55%)" }} />
            {/* club-colour base bar — the only club-colour pop */}
            <span aria-hidden className="absolute inset-x-0 bottom-0" style={{ height: "2.6cqw", background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})` }} />

            {/* header: rating + position (left) · emblem / captain ribbon (right) */}
            <div className="relative flex items-start justify-between" style={{ padding: "5cqw 7cqw 0" }}>
              <div className="leading-none">
                {showRating && (
                  <div className="font-display font-extrabold leading-none"
                    style={{ fontSize: "24cqw", background: s.rating, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.35))" }}>
                    {overall}
                  </div>
                )}
                {slotPos && (
                  <div className="font-display font-extrabold uppercase leading-none"
                    style={{ fontSize: "10.5cqw", marginTop: "2cqw", color: posColor(slotPos, s.light), letterSpacing: "0.06em" }}>
                    {slotPos}
                  </div>
                )}
              </div>
              {captain ? (
                <span className="grid place-items-center font-display font-extrabold"
                  style={{ width: "15cqw", height: "15cqw", fontSize: "9.5cqw", color: "#3a2600", background: "linear-gradient(160deg,#ffe9a8,#d4af37)", clipPath: "polygon(0 0, 100% 0, 100% 68%, 50% 100%, 0 68%)", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
                  C
                </span>
              ) : (
                <span aria-hidden style={{ fontSize: "10cqw", color: s.emblemColor, lineHeight: 1 }}>{s.emblem}</span>
              )}
            </div>

            {/* name — the identity of the card */}
            <div className="relative mt-auto text-center" style={{ paddingInline: "5cqw" }}>
              <div className="truncate font-display font-extrabold uppercase leading-none"
                style={{ color: s.name, fontSize: nameSize, letterSpacing: "0.01em" }}>
                {sur}
              </div>
            </div>

            {/* club row: crest/flag + club name */}
            <div className="relative flex items-center justify-center" style={{ gap: "3cqw", marginTop: "3.5cqw", paddingInline: "5cqw" }}>
              <MiniBadge colors={colors} kind={badgeKind} w={badgeKind === "flag" ? "16cqw" : "13cqw"} />
              {clubLabel && (
                <span className="truncate font-bold uppercase leading-none" style={{ color: s.club, fontSize: "7.5cqw", letterSpacing: "0.04em", maxWidth: "62cqw" }}>
                  {clubLabel}
                </span>
              )}
            </div>

            {/* season tag */}
            <div className="relative flex justify-center" style={{ marginTop: "3.5cqw", paddingBottom: "7.5cqw" }}>
              {seasonLabel ? (
                <span className="rounded-full font-bold uppercase leading-none"
                  style={{ color: s.season, background: s.seasonBg, fontSize: "7cqw", padding: "1.8cqw 4.5cqw", letterSpacing: "0.06em" }}>
                  {seasonLabel}
                </span>
              ) : (
                <span style={{ height: "10.5cqw" }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export type SlotState = "idle" | "draftable" | "target" | "blocked" | "selected";

/** EMPTY slot — the same signature silhouette, hollow, showing the position. */
export function EmptyTile({
  variant, pos, state, color, sub, widthClass = "w-[12cqw]",
}: {
  variant: PitchVariant; pos: string; state: SlotState; color?: string; sub?: string; widthClass?: string;
}) {
  const s = TILE[variant] ?? TILE.cl;
  const c = color ?? s.emblemColor;
  const active = state === "draftable" || state === "target" || state === "selected";
  const blocked = state === "blocked";
  const edge = blocked ? "#ff5a6a" : active ? c : `${s.emblemColor}`;
  const glow = state === "selected" ? c : state === "target" || state === "draftable" ? `${c}88` : undefined;
  const ink = active ? c : posColor(pos, false);

  return (
    <div className={`${widthClass} ${state === "draftable" ? "animate-pulse" : ""}`} style={{ containerType: "inline-size", animationDuration: "1.8s" }}>
      <div style={{ clipPath: SHAPE, background: `linear-gradient(165deg, ${edge}, ${edge}66)`, padding: "1.7cqw", filter: glow ? `drop-shadow(0 0 8px ${glow})` : "drop-shadow(0 3px 5px rgba(0,0,0,0.38))" }}>
        <div className="relative flex flex-col items-center justify-center" style={{ clipPath: SHAPE, aspectRatio: "1 / 1.38", background: blocked ? "rgba(40,8,12,0.72)" : "rgba(8,20,52,0.72)" }}>
          {blocked ? (
            <span style={{ fontSize: "32cqw", color: "#ff8b96" }}>⊘</span>
          ) : (
            <>
              <span className="font-display font-extrabold leading-none" style={{ fontSize: "26cqw", color: ink }}>{pos}</span>
              {sub ? (
                <span className="font-bold uppercase leading-none" style={{ fontSize: "12cqw", marginTop: "4cqw", color: c }}>{sub}</span>
              ) : (
                <span className="grid place-items-center rounded-full leading-none" style={{ marginTop: "6cqw", width: "20cqw", height: "20cqw", border: `1.5px solid ${ink}`, color: ink, fontSize: "14cqw" }}>＋</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
