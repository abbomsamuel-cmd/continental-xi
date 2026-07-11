"use client";

/**
 * The broadcast lineup card — one shared design used on the interactive pitch
 * AND in Presentation Mode, so the two always match. A portrait panel (club
 * colours + silhouette fallback), gold rating, an original crest/flag badge,
 * and a clean white name ribbon. No real player art needed.
 */

export type BadgeKind = "crest" | "flag";

function initials(name: string): string {
  const parts = name.split(" ");
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}
function surname(name: string): string {
  return name.split(" ").pop() ?? name;
}

/** Player silhouette — the polished fallback when no portrait exists. */
export function Silhouette() {
  return (
    <svg viewBox="0 0 24 24" className="absolute bottom-0 left-1/2 h-[115%] w-auto -translate-x-1/2" aria-hidden>
      <path d="M12 12.4c2.3 0 4.1-1.9 4.1-4.2S14.3 4 12 4 7.9 5.9 7.9 8.2 9.7 12.4 12 12.4zM12 14c-3.4 0-8 1.7-8 5.1V24h16v-4.9c0-3.4-4.6-5.1-8-5.1z"
        fill="rgba(255,255,255,0.16)" />
    </svg>
  );
}

/** Tiny original club crest (split shield + star) or nation flag (diagonal bicolor). */
export function MiniBadge({ colors, kind }: { colors: [string, string]; kind: BadgeKind }) {
  if (kind === "flag") {
    const id = `fclip-${colors[0].replace("#", "")}-${colors[1].replace("#", "")}`;
    return (
      <svg viewBox="0 0 16 11" className="h-[11px] w-[16px]" aria-hidden>
        <clipPath id={id}><rect x="0" y="0" width="16" height="11" rx="1.5" /></clipPath>
        <g clipPath={`url(#${id})`}>
          <path d="M0 0 H16 V11 Z" fill={colors[1]} />
          <path d="M0 0 H16 V0 L0 11 Z" fill={colors[0]} />
        </g>
        <rect x="0.4" y="0.4" width="15.2" height="10.2" rx="1.3" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="0.8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 14 15" className="h-[14px] w-[13px]" aria-hidden>
      <path d="M7 0.6 12.7 2.4 V7.5 C12.7 11 10 13.4 7 14.4 4 13.4 1.3 11 1.3 7.5 V2.4 Z" fill={colors[0]} stroke="rgba(255,255,255,0.8)" strokeWidth="0.7" />
      <path d="M7 0.6 12.7 2.4 V7.5 C12.7 9 11.6 10.4 10.3 11.3 L7 6 Z" fill={colors[1]} opacity="0.85" />
      <circle cx="7" cy="6.4" r="1.5" fill="#f2d472" />
    </svg>
  );
}

interface Props {
  name: string;
  overall: number;
  colors: [string, string];
  seasonLabel?: string;
  slotPos: string;
  badge: BadgeKind;
  nameAccent: string;
  showRating?: boolean;
  /** suitability accent when the player is out of his natural role (else undefined) */
  secondaryColor?: string;
  captain?: boolean;
  selected?: boolean;
  slotGlow?: string;
  /** width utility class + portrait-height class, so pitch vs presentation can size it */
  widthClass?: string;
  portraitClass?: string;
}

export function LineupCard({
  name, overall, colors, seasonLabel, slotPos, badge, nameAccent,
  showRating = true, secondaryColor, captain, selected, slotGlow = "rgba(212,175,55,0.65)",
  widthClass = "w-[clamp(40px,11vw,54px)]", portraitClass = "h-[clamp(26px,7vw,38px)]",
}: Props) {
  return (
    <div
      className={`relative ${widthClass} overflow-hidden rounded-lg`}
      style={{
        border: `1.5px solid ${captain ? "#f2d472" : selected ? "#f2d472" : secondaryColor ?? "rgba(255,255,255,0.42)"}`,
        boxShadow: selected ? `0 0 18px ${slotGlow}` : "0 6px 14px rgba(0,0,0,0.5)",
      }}
    >
      {/* portrait */}
      <div className={`relative flex ${portraitClass} items-end justify-center overflow-hidden`}
        style={{ background: `linear-gradient(165deg, ${colors[0]}, ${colors[1]})` }}>
        <div className="absolute inset-0 bg-black/30" />
        <Silhouette />
        <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(115deg, rgba(255,255,255,0.22) 0%, transparent 42%)" }} />
        {showRating && (
          <span className="absolute left-0.5 top-0.5 rounded px-1 font-display text-[0.58rem] font-extrabold leading-tight text-[#08131f]"
            style={{ background: "linear-gradient(150deg, #f2d472, #d4af37)" }}>{overall}</span>
        )}
        <span className="absolute right-0.5 top-0.5"><MiniBadge colors={colors} kind={badge} /></span>
        <span className="relative z-[1] pb-0.5 font-display text-[0.86rem] font-extrabold leading-none text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
          {initials(name)}
        </span>
        {secondaryColor && (
          <span className="absolute bottom-0.5 left-0.5 grid h-3 w-3 place-items-center rounded-full text-[0.44rem] font-black"
            style={{ background: secondaryColor, color: "#08131f" }} title="Secondary position">2</span>
        )}
      </div>
      {/* white name ribbon */}
      <div className="bg-[#f4f7ff] px-0.5 pb-[2px] pt-[1px] text-center">
        <div className="truncate text-[0.5rem] font-extrabold leading-tight text-[#0a1428]">{surname(name)}</div>
        <div className="text-[0.42rem] font-bold uppercase leading-tight tracking-[0.08em]" style={{ color: nameAccent }}>
          {slotPos}{seasonLabel ? ` · ${seasonLabel}` : ""}
        </div>
      </div>
    </div>
  );
}
