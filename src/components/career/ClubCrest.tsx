"use client";

/**
 * One club crest for every club in the world. With no licensed badges, this
 * generates an ORIGINAL shield from the club's own identity — its two kit
 * colours, a kit pattern (stripes / halves / sash / hoops), a crest shape and
 * its short code — so all 769 clubs read as real badges at a glance instead of
 * flat coloured squares. Deterministic per club, sharp at any size, and it can
 * never show a broken image. Pass `src` to prefer a real crest later without
 * touching a single call site.
 */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0");
  return { r: parseInt(v.slice(0, 2), 16), g: parseInt(v.slice(2, 4), 16), b: parseInt(v.slice(4, 6), 16) };
}
function lum(hex: string): number { const { r, g, b } = parseHex(hex); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }
function shade(hex: string, amt: number): string {
  const { r, g, b } = parseHex(hex);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + amt * 255)));
  return `#${[f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** A shield that reads as a crest even at 14px. */
const SHIELD = "M6 5 L58 5 L58 34 C58 51 45 61 32 66 C19 61 6 51 6 34 Z";

export function ClubCrest({
  name, short, colors, size = 40, src,
}: {
  name?: string;
  short: string;
  colors: [string, string];
  size?: number;
  src?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? short} width={size} height={size}
      className="shrink-0 rounded-[8px] object-contain" style={{ width: size, height: size }} />;
  }

  const [c1raw, c2raw] = colors;
  // If both colours are nearly identical, split them so the pattern still reads.
  const c1 = c1raw;
  const c2 = Math.abs(lum(c1raw) - lum(c2raw)) < 0.06 ? shade(c2raw, lum(c2raw) > 0.5 ? -0.28 : 0.28) : c2raw;

  const seed = hash(`${short}|${c1}|${c2}`);
  const pattern = seed % 5;          // 0 solid · 1 vertical stripes · 2 halves · 3 sash · 4 hoops
  const round = (seed >> 3) % 4 === 0; // occasionally a roundel instead of a shield
  const uid = `cc${seed.toString(36)}`;

  // Legible code on any fill: contrast against the colour behind the centre.
  const centreColor = pattern === 2 ? c1 : c1; // centre is c1 for all but halves' left/right split — c1 side dominates label
  const ink = lum(centreColor) > 0.55 ? "#0d1220" : "#ffffff";
  const inkEdge = ink === "#ffffff" ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.5)";

  const clip = round ? `${uid}-r` : `${uid}-s`;

  return (
    <svg viewBox="0 0 64 72" width={size} height={size} className="shrink-0" role="img" aria-label={name ?? short}>
      <title>{name ?? short}</title>
      <defs>
        <clipPath id={`${uid}-s`}><path d={SHIELD} /></clipPath>
        <clipPath id={`${uid}-r`}><circle cx="32" cy="34" r="29" /></clipPath>
        <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.22" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${clip})`}>
        <rect x="0" y="0" width="64" height="72" fill={c1} />

        {pattern === 1 && (
          <g fill={c2}>
            <rect x="14" y="0" width="8" height="72" />
            <rect x="30" y="0" width="8" height="72" />
            <rect x="46" y="0" width="8" height="72" />
          </g>
        )}
        {pattern === 2 && <rect x="32" y="0" width="32" height="72" fill={c2} />}
        {pattern === 3 && <path d="M-6 46 L46 -6 L64 8 L12 60 Z" fill={c2} />}
        {pattern === 4 && (
          <g fill={c2}>
            <rect x="0" y="14" width="64" height="9" />
            <rect x="0" y="34" width="64" height="9" />
          </g>
        )}

        {/* metallic sheen over the whole crest */}
        <rect x="0" y="0" width="64" height="72" fill={`url(#${uid}-sheen)`} />
      </g>

      {/* rim */}
      {round
        ? <circle cx="32" cy="34" r="29" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
        : <path d={SHIELD} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />}

      {/* the club code, always legible */}
      <text x="32" y={round ? 40 : 39} textAnchor="middle"
        fontFamily="var(--font-display), system-ui, sans-serif" fontWeight="800"
        fontSize={short.length >= 4 ? 17 : 21} fill={ink}
        stroke={inkEdge} strokeWidth="0.6" paintOrder="stroke" style={{ letterSpacing: "-0.5px" }}>
        {short}
      </text>
    </svg>
  );
}
