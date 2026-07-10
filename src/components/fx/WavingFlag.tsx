"use client";

/**
 * Original waving-flag art built from a nation's two kit colors — an SVG
 * banner with a rippling wave distortion and a pole. Deliberately abstract
 * (diagonal bicolor) so no official flag design is reproduced.
 */
export function WavingFlag({
  colors,
  width = 56,
  className = "",
}: {
  colors: [string, string];
  width?: number;
  className?: string;
}) {
  const height = width * 0.66;
  const id = `flag-${colors[0].replace("#", "")}-${colors[1].replace("#", "")}`;
  return (
    <span className={`inline-block ${className}`} style={{ width, height }} aria-hidden>
      <svg viewBox="0 0 60 40" width={width} height={height}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="48%" stopColor={colors[0]} />
            <stop offset="52%" stopColor={colors[1]} />
            <stop offset="100%" stopColor={colors[1]} />
          </linearGradient>
          <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.28)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        {/* pole */}
        <rect x="1.5" y="1" width="2" height="38" rx="1" fill="rgba(220,230,255,0.55)" />
        {/* rippling banner */}
        <g className="flag-wave">
          <path
            d="M5 3 Q 20 0.5, 32 3.5 T 58 3 L 58 27 Q 44 30, 32 27.5 T 5 27 Z"
            fill={`url(#${id})`}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="0.75"
          />
          <path d="M5 3 Q 20 0.5, 32 3.5 T 58 3 L 58 27 Q 44 30, 32 27.5 T 5 27 Z" fill={`url(#${id}-sheen)`} opacity="0.5" />
        </g>
      </svg>
    </span>
  );
}
