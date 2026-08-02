/**
 * Original club crest art.
 *
 * Every crest is generated from the club's own two colours plus a stable
 * seed, so each club gets its own silhouette, heraldic charge and device
 * instead of one shared template. All geometry here is our own: no real
 * club's badge shape, mark or wordmark is reproduced anywhere in this
 * file, and none should ever be added — real club crests are registered
 * trademarks and this app is publicly deployed.
 *
 * The vocabulary is generic heraldry that predates every club using it:
 * shield shapes, stripes, hoops, sashes, chevrons, quarters, and simple
 * charges (star, ball, laurel, keep). Shared by every place a club badge
 * appears — league tables, brackets, match cards, the pitch.
 */

/* ------------------------------------------------------------ shapes -- */

const SHAPES = [
  // classic heater
  "M7 0.6 12.7 2.4 V7.5 C12.7 11 10 13.4 7 14.4 4 13.4 1.3 11 1.3 7.5 V2.4 Z",
  // flat-top, deep round point
  "M1.3 1.5 H12.7 V7.2 C12.7 10.8 10.2 13.3 7 14.4 3.8 13.3 1.3 10.8 1.3 7.2 Z",
  // roundel
  "M7 1.3 A5.9 5.9 0 1 1 6.99 1.3 Z",
  // rounded banner
  "M2.2 1.6 Q2.2 1 2.8 1 H11.2 Q11.8 1 11.8 1.6 V8.6 Q11.8 11.9 7 14.4 2.2 11.9 2.2 8.6 Z",
  // curved shoulders
  "M7 0.7 C9.3 1.7 11 2.1 12.6 2.2 12.6 8.2 11.3 11.7 7 14.4 2.7 11.7 1.4 8.2 1.4 2.2 3 2.1 4.7 1.7 7 0.7 Z",
] as const;

type ChargeKind = "solid" | "halved" | "stripes" | "hoops" | "sash" | "chevron" | "quartered";
const CHARGES: ChargeKind[] = ["halved", "stripes", "hoops", "sash", "chevron", "quartered", "solid"];

type DeviceKind = "star" | "ball" | "laurel" | "keep" | "none";
const DEVICES: DeviceKind[] = ["star", "ball", "laurel", "keep", "star", "none"];

/** FNV-1a — stable across server render and hydration. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* ----------------------------------------------------------- charges -- */

/** The secondary colour laid over the base fill as a heraldic device. */
function Charge({ kind, c1 }: { kind: ChargeKind; c1: string }) {
  switch (kind) {
    case "halved":
      return <rect x="7" y="0" width="7" height="15" fill={c1} />;
    case "stripes":
      return (
        <>
          <rect x="2.3" y="0" width="1.9" height="15" fill={c1} />
          <rect x="6.05" y="0" width="1.9" height="15" fill={c1} />
          <rect x="9.8" y="0" width="1.9" height="15" fill={c1} />
        </>
      );
    case "hoops":
      return (
        <>
          <rect x="0" y="2.4" width="14" height="2" fill={c1} />
          <rect x="0" y="6.5" width="14" height="2" fill={c1} />
          <rect x="0" y="10.6" width="14" height="2" fill={c1} />
        </>
      );
    case "sash":
      return <path d="M-1 11.4 L11.4 -1 L14.6 -1 L2.2 11.4 Z" fill={c1} />;
    case "chevron":
      return <path d="M7 4.9 L13.4 10.5 V13.2 L7 7.6 L0.6 13.2 V10.5 Z" fill={c1} />;
    case "quartered":
      return (
        <>
          <rect x="7" y="0" width="7" height="7.3" fill={c1} />
          <rect x="0" y="7.3" width="7" height="7.7" fill={c1} />
        </>
      );
    default:
      return null;
  }
}

/* ----------------------------------------------------------- devices -- */

const STAR = "M7 5.4 L7.5 6.71 L8.9 6.78 L7.81 7.66 L8.18 9.02 L7 8.25 L5.82 9.02 L6.19 7.66 L5.1 6.78 L6.5 6.71 Z";

function Device({ kind }: { kind: DeviceKind }) {
  const ink = "rgba(255,255,255,0.94)";
  switch (kind) {
    case "star":
      return <path d={STAR} fill={ink} />;
    case "ball":
      return (
        <>
          <circle cx="7" cy="7.4" r="1.95" fill={ink} />
          <path d="M7 6.15 L8.19 7.01 L7.73 8.4 L6.27 8.4 L5.81 7.01 Z" fill="rgba(10,16,30,0.85)" />
        </>
      );
    case "laurel":
      return (
        <>
          <path d="M5.15 9.5 C4.05 8.3 4.25 6.5 5.6 5.55" fill="none" stroke={ink} strokeWidth="0.62" strokeLinecap="round" />
          <path d="M8.85 9.5 C9.95 8.3 9.75 6.5 8.4 5.55" fill="none" stroke={ink} strokeWidth="0.62" strokeLinecap="round" />
          <circle cx="7" cy="7.2" r="1.05" fill={ink} />
        </>
      );
    case "keep":
      return (
        <path d="M5.05 6.35 h0.75 v-0.7 h0.75 v0.7 h0.9 v-0.7 h0.75 v0.7 h0.75 V9.7 H5.05 Z" fill={ink} />
      );
    default:
      return null;
  }
}

/* --------------------------------------------------------- component -- */

interface Props {
  colors: [string, string];
  /** Stable per-club key (a short code or name) so a club always gets the
   *  same crest. Falls back to the colour pair when not supplied. */
  seed?: string;
  /** CSS width (px number or any CSS length) — height follows the aspect ratio */
  width?: number | string;
  /** Set false when the caller overlays its own text (a club code) on the
   *  crest, so the central device doesn't sit underneath it. */
  showDevice?: boolean;
  className?: string;
}

export function ClubCrest({ colors, seed, width = 44, showDevice = true, className = "" }: Props) {
  const key = seed ?? colors.join("");
  const h = hash(key + colors.join(""));

  const shield = SHAPES[h % SHAPES.length];
  const charge = CHARGES[(h >>> 4) % CHARGES.length];
  const device = DEVICES[(h >>> 9) % DEVICES.length];
  const goldRim = (h >>> 14) % 4 === 0;

  const uid = `cc${h.toString(36)}`;
  const [c0, c1] = colors;

  return (
    <svg viewBox="0 0 14 15" style={{ width, height: "auto" }} className={`shrink-0 ${className}`} aria-hidden>
      <defs>
        <linearGradient id={`${uid}-f`} x1="0" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor={c0} stopOpacity="1" />
          <stop offset="100%" stopColor={c0} stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={`${uid}-r`} x1="0" y1="0" x2="0.6" y2="1">
          {goldRim ? (
            <>
              <stop offset="0%" stopColor="#fff3c4" />
              <stop offset="45%" stopColor="#e8b84b" />
              <stop offset="100%" stopColor="#8a5e12" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#cfdaea" />
              <stop offset="100%" stopColor="#7d8ba0" />
            </>
          )}
        </linearGradient>
        <clipPath id={`${uid}-c`}><path d={shield} /></clipPath>
      </defs>

      {/* bevel sitting behind the enamel for depth */}
      <path d={shield} fill="rgba(0,0,0,0.42)" transform="translate(0,0.38)" />

      <g clipPath={`url(#${uid}-c)`}>
        <path d={shield} fill={`url(#${uid}-f)`} />
        <Charge kind={charge} c1={c1} />
        {/* gloss across the top, and shadow pooling at the point */}
        <ellipse cx="7" cy="2.3" rx="5.6" ry="1.9" fill="rgba(255,255,255,0.24)" />
        <ellipse cx="7" cy="15.2" rx="6" ry="3.1" fill="rgba(0,0,0,0.3)" />
        {showDevice && <Device kind={device} />}
      </g>

      <path d={shield} fill="none" stroke={`url(#${uid}-r)`} strokeWidth="0.62" strokeLinejoin="round" />
    </svg>
  );
}
