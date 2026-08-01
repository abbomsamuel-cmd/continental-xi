/**
 * Original club crest art — an enameled shield with a beveled edge,
 * gradient-shaded halves (the club's own two colors) and a star charge.
 * Deliberately original geometry: no real club's badge shape or marks are
 * reproduced. Shared by every place a club badge appears (league tables,
 * brackets, match cards, the pitch) so the art is consistent app-wide.
 */
const SHIELD = "M7 0.6 12.7 2.4 V7.5 C12.7 11 10 13.4 7 14.4 4 13.4 1.3 11 1.3 7.5 V2.4 Z";

interface Props {
  colors: [string, string];
  /** CSS width (px number or any CSS length string) — height follows the shield's own aspect ratio */
  width?: number | string;
  className?: string;
}

export function ClubCrest({ colors, width = 44, className = "" }: Props) {
  const gid = `crest-${colors[0].replace("#", "")}-${colors[1].replace("#", "")}`;
  return (
    <svg viewBox="0 0 14 15" style={{ width, height: "auto" }} className={`shrink-0 ${className}`} aria-hidden>
      <defs>
        <linearGradient id={`${gid}-a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colors[0]} stopOpacity="1" />
          <stop offset="100%" stopColor={colors[0]} stopOpacity="0.72" />
        </linearGradient>
        <linearGradient id={`${gid}-b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colors[1]} stopOpacity="0.95" />
          <stop offset="100%" stopColor={colors[1]} stopOpacity="0.65" />
        </linearGradient>
        <clipPath id={`${gid}-clip`}><path d={SHIELD} /></clipPath>
      </defs>
      {/* dark bevel sitting behind the enamel for depth */}
      <path d={SHIELD} fill="rgba(0,0,0,0.4)" transform="translate(0,0.35)" />
      <g clipPath={`url(#${gid}-clip)`}>
        <path d={SHIELD} fill={`url(#${gid}-a)`} />
        <path d="M7 0.6 12.7 2.4 V7.5 C12.7 9 11.6 10.4 10.3 11.3 L7 6 Z" fill={`url(#${gid}-b)`} />
        {/* top gloss highlight */}
        <ellipse cx="7" cy="2.6" rx="5.4" ry="1.8" fill="rgba(255,255,255,0.28)" />
      </g>
      <path d={SHIELD} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="0.55" />
      {/* star charge — a generic mark of quality, not any real club's badge */}
      <path
        d="M7 5.1 L7.42 6.28 L8.6 6.34 L7.68 7.08 L8 8.24 L7 7.56 L6 8.24 L6.32 7.08 L5.4 6.34 L6.58 6.28 Z"
        fill="rgba(255,255,255,0.92)"
      />
    </svg>
  );
}
