"use client";

/**
 * Original "starball" crest — a deep-blue orb with globe meridians, crowned by
 * an arc of gold stars. An original composition evoking European football
 * prestige; deliberately NOT a copy of any official competition mark.
 */
export function CrestLogo({ size = 40, animated = true }: { size?: number; animated?: boolean }) {
  // seven stars in a crown arc across the top
  const crown = Array.from({ length: 7 }, (_, i) => {
    const a = Math.PI * (0.82 - (i / 6) * 0.64); // spread across the upper arc
    const r = 26;
    return { x: 32 + Math.cos(a) * r, y: 32 - Math.sin(a) * r, s: i === 3 ? 3.4 : 2.4 };
  });

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Continental XI crest">
      <defs>
        <radialGradient id="orb" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#0b3a86" />
          <stop offset="60%" stopColor="#052657" />
          <stop offset="100%" stopColor="#03122e" />
        </radialGradient>
        <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f2d472" />
          <stop offset="100%" stopColor="#b8912a" />
        </linearGradient>
        <linearGradient id="star" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7dd8c" />
          <stop offset="100%" stopColor="#d4af37" />
        </linearGradient>
      </defs>

      <circle cx="32" cy="32" r="30" fill="url(#rim)" />
      <circle cx="32" cy="32" r="27.5" fill="url(#orb)" />

      {/* globe meridians */}
      <g stroke="rgba(120,190,255,0.28)" strokeWidth="0.8" fill="none">
        <circle cx="32" cy="32" r="27.5" />
        <ellipse cx="32" cy="32" rx="10" ry="27.5" />
        <ellipse cx="32" cy="32" rx="20" ry="27.5" />
        <line x1="4.5" y1="32" x2="59.5" y2="32" />
        <path d="M8 20 H56" />
        <path d="M8 44 H56" />
      </g>

      {/* central big star */}
      <g className={animated ? "crest-spin" : undefined} style={{ transformOrigin: "32px 34px" }}>
        <Star cx={32} cy={34} r={9} />
      </g>

      {/* crown of stars */}
      {crown.map((c, i) => (
        <Star key={i} cx={c.x} cy={c.y} r={c.s} />
      ))}

      <style>{`
        .crest-spin { animation: crestPulse 4.5s ease-in-out infinite; }
        @keyframes crestPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.78; }
        }
        @media (prefers-reduced-motion: reduce) { .crest-spin { animation: none; } }
      `}</style>
    </svg>
  );
}

function Star({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.42;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${cx + Math.cos(a) * rad},${cy + Math.sin(a) * rad}`);
  }
  return <polygon points={pts.join(" ")} fill="url(#star)" stroke="#8a6a1e" strokeWidth={r > 5 ? 0.6 : 0.3} />;
}
