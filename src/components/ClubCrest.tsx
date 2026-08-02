/**
 * Original club crest art.
 *
 * A crest is built from three things: the club's own colours, the pattern
 * its shirts are actually known for (stripes, hoops, halves, a sash, a
 * central band), and a shield silhouette picked deterministically from the
 * club's key. Kit patterns and colours are plain facts about a club — they
 * are not its badge — so the result reads unmistakably like the right club
 * without reproducing anyone's mark.
 *
 * Nothing here copies a real crest, and nothing here should ever be
 * replaced with one: real club badges are registered trademarks and this
 * app is publicly deployed. The vocabulary below is generic heraldry and
 * generic kit design, both of which long predate every club using them.
 */

import { shortCode } from "@/lib/club-key";

/* ---------------------------------------------------------- patterns -- */

type Pattern = "chief" | "stripes" | "hoops" | "halved" | "diagonal" | "band";

/** What each club actually plays in. Every club in the registry is listed,
 *  because a fallback guess puts a red sash on a team that plays in plain
 *  white — accurate is also what looks right. Clubs with one dominant
 *  colour get a "chief" (a band across the top) in their second colour, so
 *  the reds stay distinguishable from each other. */
const CLUB_PATTERN: Record<string, Pattern> = {
  // vertical stripes
  "Milan": "stripes",
  "Barcelona": "stripes",
  "Juventus": "stripes",
  "Newcastle United": "stripes",
  "Porto": "stripes",
  "Deportivo La Coruña": "stripes",
  "Inter Milan": "stripes",
  "Atlético Madrid": "stripes",
  "Shakhtar Donetsk": "stripes",
  "Atalanta": "stripes",
  "Olympiacos": "stripes",
  "Red Star Belgrade": "stripes",
  "Fenerbahçe": "stripes",
  // horizontal hoops
  "Celtic": "hoops",
  "Sporting CP": "hoops",
  // split down the middle
  "Galatasaray": "halved",
  "Basel": "halved",
  "Feyenoord": "halved",
  "Bayer Leverkusen": "halved",
  "Eintracht Frankfurt": "halved",
  // diagonal split
  "Monaco": "diagonal",
  // broad central band
  "Ajax": "band",
  "Paris Saint-Germain": "band",
  // one dominant colour, second colour as the chief
  "Marseille": "chief",
  "Borussia Dortmund": "chief",
  "Real Madrid": "chief",
  "Manchester United": "chief",
  "Dynamo Kyiv": "chief",
  "Bayern Munich": "chief",
  "Valencia": "chief",
  "Liverpool": "chief",
  "Arsenal": "chief",
  "Villarreal": "chief",
  "Chelsea": "chief",
  "Leicester City": "chief",
  "Roma": "chief",
  "Tottenham Hotspur": "chief",
  "RB Leipzig": "chief",
  "Manchester City": "chief",
  "Napoli": "chief",
  "Aston Villa": "chief",
  "Benfica": "chief",
  "PSV Eindhoven": "chief",
  "Sevilla": "chief",
  "Red Bull Salzburg": "chief",
  "Schalke 04": "chief",
  "Lyon": "chief",
  "Nottingham Forest": "chief",
  "Hamburg": "chief",
  "Steaua București": "chief",
  "Lazio": "chief",
};

/* ------------------------------------------------------------ shapes -- */

const SHAPES = [
  // classic heater
  "M21 2 L39 7 V22 C39 32.5 31 40 21 43 11 40 3 32.5 3 22 V7 Z",
  // flat top, deep round point
  "M3 4 H39 V22 C39 32.5 31.5 40.2 21 43 10.5 40.2 3 32.5 3 22 Z",
  // roundel
  "M21 3.5 A19 19 0 1 1 20.98 3.5 Z",
  // rounded banner
  "M6 5 Q6 3.5 7.5 3.5 H34.5 Q36 3.5 36 5 V25 Q36 35 21 43 6 35 6 25 Z",
  // curved shoulders
  "M21 2 C28 5 33 6 39 6.5 39 24.5 35 35 21 43 7 35 3 24.5 3 6.5 9 6 14 5 21 2 Z",
] as const;

const FALLBACK: Pattern[] = ["chief", "stripes", "halved", "hoops", "band", "diagonal"];

/** FNV-1a — stable across server render and hydration. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const BY_CODE: Record<string, Pattern> = {};
for (const [club, pattern] of Object.entries(CLUB_PATTERN)) BY_CODE[shortCode(club)] = pattern;

function patternFor(seed: string | undefined, h: number): Pattern {
  if (seed) {
    const direct = CLUB_PATTERN[seed] ?? BY_CODE[seed.toUpperCase()];
    if (direct) return direct;
  }
  return FALLBACK[h % FALLBACK.length];
}

function Field({ pattern, c1 }: { pattern: Pattern; c1: string }) {
  switch (pattern) {
    case "stripes":
      return (
        <>
          <rect x="7" y="0" width="5.5" height="45" fill={c1} />
          <rect x="18.25" y="0" width="5.5" height="45" fill={c1} />
          <rect x="29.5" y="0" width="5.5" height="45" fill={c1} />
        </>
      );
    case "hoops":
      return (
        <>
          <rect x="0" y="8" width="42" height="5.5" fill={c1} />
          <rect x="0" y="19" width="42" height="5.5" fill={c1} />
          <rect x="0" y="30" width="42" height="5.5" fill={c1} />
        </>
      );
    case "halved":
      return <rect x="21" y="0" width="21" height="45" fill={c1} />;
    case "diagonal":
      return <path d="M42 0 V45 H0 Z" fill={c1} />;
    case "band":
      return <rect x="15" y="0" width="12" height="45" fill={c1} />;
    case "chief":
      return <rect x="0" y="0" width="42" height="11" fill={c1} />;
    default:
      return null;
  }
}

/* --------------------------------------------------------- component -- */

interface Props {
  colors: [string, string];
  /** The club's name, or its short code — either resolves the same crest. */
  seed?: string;
  /** CSS width (px number or any CSS length) — height follows the aspect ratio */
  width?: number | string;
  /** Darkens the centre slightly so a club code drawn on top stays legible
   *  over light stripes. */
  textBacking?: boolean;
  className?: string;
}

export function ClubCrest({ colors, seed, width = 44, textBacking = false, className = "" }: Props) {
  // hash the SHORT CODE, never the raw seed: a club is drawn from its name
  // on some surfaces and its three-letter code on others, and those have to
  // land on the same crest
  const key = seed ? shortCode(seed) : "";
  const h = hash(key + colors.join(""));
  const shield = SHAPES[h % SHAPES.length];
  const pattern = patternFor(seed, h >>> 4);
  const goldRim = (h >>> 11) % 4 === 0;
  const uid = `cc${h.toString(36)}`;
  const [c0, c1] = colors;

  return (
    <svg viewBox="0 0 42 45" style={{ width, height: "auto" }} className={`shrink-0 ${className}`} aria-hidden>
      <defs>
        <linearGradient id={`${uid}-r`} x1="0" y1="0" x2="0.5" y2="1">
          {goldRim ? (
            <>
              <stop offset="0%" stopColor="#fff4cd" />
              <stop offset="50%" stopColor="#e0ae3f" />
              <stop offset="100%" stopColor="#7d520c" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#c8d4e4" />
              <stop offset="100%" stopColor="#71809a" />
            </>
          )}
        </linearGradient>
        <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${uid}-c`}><path d={shield} /></clipPath>
      </defs>

      {/* the enamel: flat colour, kit pattern, one soft light from above */}
      <g clipPath={`url(#${uid}-c)`}>
        <rect x="0" y="0" width="42" height="45" fill={c0} />
        <Field pattern={pattern} c1={c1} />
        {textBacking && <ellipse cx="21" cy="21" rx="13" ry="12" fill="rgba(4,9,18,0.42)" />}
        <rect x="0" y="0" width="42" height="45" fill={`url(#${uid}-g)`} />
      </g>

      {/* metal rim, and a hairline of shadow just inside it for depth */}
      <path d={shield} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="3.4" strokeLinejoin="round" clipPath={`url(#${uid}-c)`} />
      <path d={shield} fill="none" stroke={`url(#${uid}-r)`} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
