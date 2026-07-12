"use client";

/**
 * Broadcast player tiles — FUT-style shield/hex cards with three cohesive
 * competition identities (the whole XI reads as one graphic, not a rainbow of
 * club colours). Shared by the interactive pitch AND Presentation Mode.
 *
 *   cl    deep-navy shield, electric-blue rim, gold rating   (European night)
 *   euro  clean white hex, royal-blue ink, dark silhouette   (international)
 *   copa  emerald hex, gold border + gold rating             (South America)
 *
 * The club/nation colour appears ONLY in the crest/flag badge + a thin accent
 * bar — everything else is the competition colour, so the lineup stays cohesive.
 *
 * Sizing: the card width is given in `cqw` relative to the PITCH (which declares
 * container-type), so tiles scale with the pitch and never overlap. Inner text
 * is `cqw` relative to the CARD. One design, every scale.
 *
 * A filled card never prints the position (the player stands in it). On phones
 * it collapses to a circular portrait + short surname.
 */

import type { PitchVariant } from "@/components/Pitch";

export type BadgeKind = "crest" | "flag";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
function surname(name: string): string {
  return name.trim().split(/\s+/).pop() ?? name;
}

export function Silhouette({ color = "rgba(255,255,255,0.16)" }: { color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className="absolute bottom-0 left-1/2 h-[104%] w-auto -translate-x-1/2" aria-hidden>
      <path d="M12 12.4c2.3 0 4.1-1.9 4.1-4.2S14.3 4 12 4 7.9 5.9 7.9 8.2 9.7 12.4 12 12.4zM12 14c-3.4 0-8 1.7-8 5.1V24h16v-4.9c0-3.4-4.6-5.1-8-5.1z" fill={color} />
    </svg>
  );
}

/** Tiny original club crest (split shield + star) or nation flag (diagonal bicolor). */
export function MiniBadge({ colors, kind }: { colors: [string, string]; kind: BadgeKind }) {
  if (kind === "flag") {
    const id = `fclip-${colors[0].replace("#", "")}-${colors[1].replace("#", "")}`;
    return (
      <svg viewBox="0 0 16 11" style={{ width: "24cqw", height: "auto" }} aria-hidden>
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
    <svg viewBox="0 0 14 15" style={{ width: "21cqw", height: "auto" }} aria-hidden>
      <path d="M7 0.6 12.7 2.4 V7.5 C12.7 11 10 13.4 7 14.4 4 13.4 1.3 11 1.3 7.5 V2.4 Z" fill={colors[0]} stroke="rgba(255,255,255,0.85)" strokeWidth="0.7" />
      <path d="M7 0.6 12.7 2.4 V7.5 C12.7 9 11.6 10.4 10.3 11.3 L7 6 Z" fill={colors[1]} opacity="0.85" />
      <circle cx="7" cy="6.4" r="1.5" fill="#f2d472" />
    </svg>
  );
}

const SHAPE: Record<PitchVariant, string> = {
  cl: "polygon(6% 0, 94% 0, 100% 9%, 100% 84%, 50% 100%, 0 84%, 0 9%)",
  euro: "polygon(16% 0, 84% 0, 100% 17%, 100% 80%, 50% 100%, 0 80%, 0 17%)",
  copa: "polygon(16% 0, 84% 0, 100% 17%, 100% 80%, 50% 100%, 0 80%, 0 17%)",
};

interface Ident {
  badge: BadgeKind;
  frame: string; card: string; portrait: string; sil: string;
  ratingBg: string; ratingColor: string; name: string; season: string; posColor: string; accent: string;
}
export const TILE: Record<PitchVariant, Ident> = {
  cl: {
    badge: "crest",
    frame: "linear-gradient(150deg, #6ea8ff, #8a63ff 55%, #d4af37)",
    card: "linear-gradient(180deg, #0d245f, #071640 60%, #050f30)",
    portrait: "linear-gradient(180deg, #18316f, #0b1c4c)",
    sil: "rgba(180,205,255,0.18)",
    ratingBg: "linear-gradient(150deg,#f7dd84,#d4af37)", ratingColor: "#08131f",
    name: "#eef4ff", season: "#7fb0ff", posColor: "#bcd2ff", accent: "#54a0ff",
  },
  euro: {
    badge: "flag",
    frame: "linear-gradient(160deg, #2f7bff, #9fc0ff)",
    card: "linear-gradient(180deg, #ffffff, #eaf1ff)",
    portrait: "linear-gradient(180deg, #dce7ff, #c4d6ff)",
    sil: "rgba(20,45,120,0.34)",
    ratingBg: "linear-gradient(150deg,#2f6bff,#1b3fd0)", ratingColor: "#ffffff",
    name: "#0a1f5e", season: "#2f6bff", posColor: "#1b3fd0", accent: "#2f7bff",
  },
  copa: {
    badge: "flag",
    frame: "linear-gradient(160deg, #ffe08a, #d4af37)",
    card: "linear-gradient(180deg, #0f5a34, #0a3f24)",
    portrait: "linear-gradient(180deg, #14663d, #0b3f24)",
    sil: "rgba(255,235,180,0.2)",
    ratingBg: "linear-gradient(150deg,#ffe6a0,#ffc93c)", ratingColor: "#3a2600",
    name: "#fff3d8", season: "#ffdf8a", posColor: "#ffdf8a", accent: "#ffc93c",
  },
};

function Shell({ variant, ring, glow, children }: { variant: PitchVariant; ring?: string; glow?: string; children: React.ReactNode }) {
  const s = TILE[variant];
  return (
    <div style={{ clipPath: SHAPE[variant], background: ring ?? s.frame, padding: "3cqw", filter: glow ? `drop-shadow(0 0 6px ${glow})` : "drop-shadow(0 4px 5px rgba(0,0,0,0.45))" }}>
      <div className="relative" style={{ clipPath: SHAPE[variant], background: s.card }}>{children}</div>
    </div>
  );
}

interface Props {
  name: string;
  overall: number;
  colors: [string, string];
  seasonLabel?: string;
  slotPos?: string;
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

/** FILLED tile — cohesive competition card with a subtle player silhouette. */
export function LineupCard({
  name, overall, colors, seasonLabel, variant = "cl",
  badge, showRating = true, secondaryColor, captain, selected, slotGlow = "rgba(242,212,114,0.9)",
  widthClass = "w-[12cqw]",
}: Props) {
  const s = TILE[variant] ?? TILE.cl;
  const badgeKind = badge ?? s.badge;
  const ring = captain || selected ? "linear-gradient(150deg,#f7dd84,#d4af37)" : secondaryColor ? `linear-gradient(150deg, ${secondaryColor}, ${secondaryColor})` : undefined;

  return (
    <>
      {/* MOBILE — circular portrait + short surname */}
      <div className="flex flex-col items-center sm:hidden">
        <div className="relative h-[clamp(28px,10.5vw,38px)] w-[clamp(28px,10.5vw,38px)] overflow-hidden rounded-full"
          style={{ border: `1.5px solid ${captain || selected ? "#f2d472" : secondaryColor ?? s.accent}`, boxShadow: selected ? `0 0 14px ${slotGlow}` : "0 3px 8px rgba(0,0,0,0.5)", containerType: "inline-size", background: s.portrait }}>
          <Silhouette color={s.sil} />
          <span className="absolute right-0 top-0 z-[2]"><MiniBadge colors={colors} kind={badgeKind} /></span>
          {showRating && (
            <span className="absolute bottom-0 left-1/2 z-[2] -translate-x-1/2 rounded-full px-1 font-display font-extrabold leading-tight" style={{ background: s.ratingBg, color: s.ratingColor, fontSize: "22cqw" }}>{overall}</span>
          )}
        </div>
        <span className="mt-0.5 max-w-[54px] truncate text-[0.46rem] font-extrabold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">{surname(name)}</span>
      </div>

      {/* DESKTOP / TABLET — broadcast shield */}
      <div className={`hidden ${widthClass} sm:block`} style={{ containerType: "inline-size" }}>
        <Shell variant={variant} ring={ring} glow={selected ? slotGlow : undefined}>
          {/* portrait */}
          <div className="relative flex items-end justify-center overflow-hidden" style={{ aspectRatio: "1 / 1", background: s.portrait }}>
            <div className="absolute inset-0" style={{ background: "radial-gradient(120% 70% at 50% -8%, rgba(255,255,255,0.16), transparent 55%)" }} />
            <Silhouette color={s.sil} />
            {/* club-colour accent bar — the only club-colour pop */}
            <span aria-hidden className="absolute inset-x-0 bottom-0" style={{ height: "3cqw", background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})` }} />
            {showRating && (
              <span className="absolute z-[2] rounded font-display font-extrabold leading-none" style={{ left: "7cqw", top: "7cqw", padding: "2cqw 3.5cqw", background: s.ratingBg, color: s.ratingColor, fontSize: "23cqw", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>{overall}</span>
            )}
            <span className="absolute z-[2]" style={{ right: "6cqw", top: "6cqw" }}><MiniBadge colors={colors} kind={badgeKind} /></span>
            {secondaryColor && <span aria-hidden className="absolute left-0 top-0 h-full" style={{ width: "4cqw", background: secondaryColor }} />}
            <span className="relative z-[1] font-display font-extrabold leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]" style={{ paddingBottom: "10cqw", fontSize: "30cqw", color: variant === "euro" ? "rgba(20,45,120,0.55)" : "rgba(255,255,255,0.72)" }}>{initials(name)}</span>
          </div>
          {/* name plate */}
          <div className="text-center" style={{ paddingBottom: "7cqw", paddingTop: "3.5cqw" }}>
            <div className="truncate font-display font-extrabold uppercase leading-none" style={{ color: s.name, fontSize: "15cqw", letterSpacing: "0.02em", paddingInline: "5cqw" }}>{surname(name)}</div>
            {seasonLabel && <div className="font-bold uppercase leading-none" style={{ color: s.season, fontSize: "10.5cqw", marginTop: "2.5cqw", opacity: 0.92 }}>{seasonLabel}</div>}
          </div>
        </Shell>
      </div>
    </>
  );
}

export type SlotState = "idle" | "draftable" | "target" | "blocked" | "selected";

/** EMPTY slot — same broadcast silhouette, hollow, showing the position + a plus. */
export function EmptyTile({
  variant, pos, state, color, sub, widthClass = "w-[12cqw]",
}: {
  variant: PitchVariant; pos: string; state: SlotState; color?: string; sub?: string; widthClass?: string;
}) {
  const s = TILE[variant] ?? TILE.cl;
  const c = color ?? s.accent;
  const active = state === "draftable" || state === "target" || state === "selected";
  const blocked = state === "blocked";
  const edge = blocked ? "#ff5a6a" : active ? c : `${s.accent}99`;
  const glow = state === "selected" ? c : state === "target" || state === "draftable" ? `${c}88` : undefined;
  const ink = active ? c : s.posColor;

  return (
    <div className={`${widthClass} ${state === "draftable" ? "animate-pulse" : ""}`} style={{ containerType: "inline-size", animationDuration: "1.8s" }}>
      <div style={{ clipPath: SHAPE[variant], background: `linear-gradient(150deg, ${edge}, ${edge}77)`, padding: "3cqw", filter: glow ? `drop-shadow(0 0 8px ${glow})` : "drop-shadow(0 4px 6px rgba(0,0,0,0.4))" }}>
        <div className="relative flex flex-col items-center justify-center" style={{ clipPath: SHAPE[variant], aspectRatio: "1 / 1.28", background: blocked ? "rgba(40,8,12,0.72)" : "rgba(8,20,52,0.72)" }}>
          {blocked ? (
            <span style={{ fontSize: "32cqw", color: "#ff8b96" }}>⊘</span>
          ) : (
            <>
              <span className="font-display font-extrabold leading-none" style={{ fontSize: "28cqw", color: ink }}>{pos}</span>
              {sub ? (
                <span className="font-bold uppercase leading-none" style={{ fontSize: "12cqw", marginTop: "4cqw", color: c }}>{sub}</span>
              ) : (
                <span className="grid place-items-center rounded-full leading-none" style={{ marginTop: "6cqw", width: "22cqw", height: "22cqw", border: `1.5px solid ${ink}`, color: ink, fontSize: "16cqw" }}>＋</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
