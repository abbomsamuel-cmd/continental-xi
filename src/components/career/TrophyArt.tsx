"use client";

import type { ReactElement } from "react";

/**
 * TrophyArt — the ContinentalXI silverware collection.
 *
 * Every trophy and award in Career Mode is drawn here as original inline SVG.
 * No emoji, no licensed marks, no reproductions: each piece captures only the
 * general FORM of its real-world inspiration (a globe held aloft, a big-eared
 * cup, a sphere on a plinth, a boot, a glove, a shield, a medal on a ribbon)
 * so the cabinet reads instantly while staying entirely our own artwork.
 *
 * House style
 *  - one 64x64 drawing box for the whole set, so sizes stay optically even;
 *  - metallic three-stop gradients lit from the upper left;
 *  - a shared dark plinth palette that grounds every piece on a dark UI;
 *  - gradient ids are namespaced per trophy ("tr-ucl-g", "tr-bdo-g", …) so a
 *    page full of trophies can never cross-wire its fills;
 *  - bold silhouettes only — everything must survive being drawn at 16px.
 */

/* ------------------------------------------------------------------ ids -- */

export type TrophyId =
  // international
  | "world-cup"
  | "euro"
  | "copa-america"
  | "nations-league"
  | "gold-cup"
  | "asian-cup"
  | "afcon"
  | "olympic-gold"
  // continental club
  | "champions-league"
  | "europa-league"
  | "conference-league"
  | "super-cup-uefa"
  | "club-world-cup"
  | "libertadores"
  | "sudamericana"
  | "concacaf-champions"
  | "afc-champions"
  // domestic leagues — the marquee flights carry their own iconic silverware
  | "premier-league"
  | "la-liga"
  | "bundesliga"
  | "serie-a"
  | "ligue-1"
  | "league-shield"
  | "league-trophy"
  // domestic cups
  | "domestic-cup"
  | "domestic-super-cup"
  // awards
  | "ballon-dor"
  | "the-best"
  | "golden-boot"
  | "golden-ball"
  | "golden-glove"
  | "cl-top-scorer"
  | "player-of-season"
  | "league-mvp"
  | "young-player"
  | "goalkeeper-of-year"
  | "puskas"
  | "team-of-year"
  | "player-of-tournament"
  | "top-assist";

export interface TrophyMeta {
  id: TrophyId;
  en: string;
  es: string;
  kind: "international" | "continental" | "league" | "cup" | "award";
}

const meta = (
  id: TrophyId,
  en: string,
  es: string,
  kind: TrophyMeta["kind"],
): TrophyMeta => ({ id, en, es, kind });

export const TROPHY_META: Record<TrophyId, TrophyMeta> = {
  "world-cup": meta("world-cup", "World Cup", "Copa del Mundo", "international"),
  euro: meta("euro", "European Championship", "Campeonato de Europa", "international"),
  "copa-america": meta("copa-america", "Copa América", "Copa América", "international"),
  "nations-league": meta("nations-league", "Nations League", "Liga de Naciones", "international"),
  "gold-cup": meta("gold-cup", "Gold Cup", "Copa Oro", "international"),
  "asian-cup": meta("asian-cup", "Asian Cup", "Copa Asiática", "international"),
  afcon: meta("afcon", "Africa Cup of Nations", "Copa Africana de Naciones", "international"),
  "olympic-gold": meta("olympic-gold", "Olympic Gold", "Oro Olímpico", "international"),

  "champions-league": meta("champions-league", "Champions League", "Liga de Campeones", "continental"),
  "europa-league": meta("europa-league", "Europa League", "Liga Europa", "continental"),
  "conference-league": meta("conference-league", "Conference League", "Liga Conferencia", "continental"),
  "super-cup-uefa": meta("super-cup-uefa", "European Super Cup", "Supercopa de Europa", "continental"),
  "club-world-cup": meta("club-world-cup", "Club World Cup", "Mundial de Clubes", "continental"),
  libertadores: meta("libertadores", "Copa Libertadores", "Copa Libertadores", "continental"),
  sudamericana: meta("sudamericana", "Copa Sudamericana", "Copa Sudamericana", "continental"),
  "concacaf-champions": meta("concacaf-champions", "CONCACAF Champions Cup", "Copa de Campeones de CONCACAF", "continental"),
  "afc-champions": meta("afc-champions", "AFC Champions League", "Liga de Campeones de la AFC", "continental"),

  "premier-league": meta("premier-league", "Premier League", "Premier League", "league"),
  "la-liga": meta("la-liga", "LaLiga", "LaLiga", "league"),
  bundesliga: meta("bundesliga", "Bundesliga", "Bundesliga", "league"),
  "serie-a": meta("serie-a", "Serie A", "Serie A", "league"),
  "ligue-1": meta("ligue-1", "Ligue 1", "Ligue 1", "league"),
  "league-shield": meta("league-shield", "League Shield", "Escudo de Liga", "league"),
  "league-trophy": meta("league-trophy", "League Title", "Título de Liga", "league"),

  "domestic-cup": meta("domestic-cup", "Domestic Cup", "Copa Nacional", "cup"),
  "domestic-super-cup": meta("domestic-super-cup", "Super Cup", "Supercopa", "cup"),

  "ballon-dor": meta("ballon-dor", "Ballon d'Or", "Balón de Oro", "award"),
  "the-best": meta("the-best", "The Best", "The Best", "award"),
  "golden-boot": meta("golden-boot", "Golden Boot", "Bota de Oro", "award"),
  "golden-ball": meta("golden-ball", "Golden Ball", "Balón de Oro del Torneo", "award"),
  "golden-glove": meta("golden-glove", "Golden Glove", "Guante de Oro", "award"),
  "cl-top-scorer": meta("cl-top-scorer", "Champions League Top Scorer", "Máximo Goleador de la Champions", "award"),
  "player-of-season": meta("player-of-season", "Player of the Season", "Jugador de la Temporada", "award"),
  "league-mvp": meta("league-mvp", "League MVP", "MVP de la Liga", "award"),
  "young-player": meta("young-player", "Young Player of the Year", "Jugador Joven del Año", "award"),
  "goalkeeper-of-year": meta("goalkeeper-of-year", "Goalkeeper of the Year", "Portero del Año", "award"),
  puskas: meta("puskas", "Goal of the Season", "Gol de la Temporada", "award"),
  "team-of-year": meta("team-of-year", "Team of the Year", "Equipo del Año", "award"),
  "player-of-tournament": meta("player-of-tournament", "Player of the Tournament", "Jugador del Torneo", "award"),
  "top-assist": meta("top-assist", "Top Assist Provider", "Máximo Asistente", "award"),
};

/** Every trophy id, in cabinet order (international → continental → awards). */
export const TROPHY_IDS: readonly TrophyId[] = Object.keys(TROPHY_META) as TrophyId[];

/* ------------------------------------------------------------- palettes -- */

type Ramp = readonly [string, string, string];

const GOLD: Ramp = ["#fff5d2", "#f0c14e", "#8d5d12"];
const GOLD_DEEP: Ramp = ["#ffe293", "#d99b23", "#6a4008"];
const SILVER: Ramp = ["#f8fbff", "#c4d0e2", "#6c7a90"];
const BRONZE: Ramp = ["#ffd8ae", "#c67e3d", "#6b3c15"];
const AZURE: Ramp = ["#a9dcff", "#3f8ada", "#153f78"];
const PURPLE: Ramp = ["#d7bbff", "#7a4fd0", "#3a2170"];

/** Plinth tones — dark enough to sit on a dark UI, light enough to read. */
const PL_TOP = "#6a748c";
const PL_BODY = "#2f3648";
const PL_DARK = "#191e29";

/* ------------------------------------------------------- shared drawing -- */

function Metal({ id, c }: { id: string; c: Ramp }): ReactElement {
  return (
    <linearGradient id={id} x1="0.08" y1="0" x2="0.92" y2="1">
      <stop offset="0" stopColor={c[0]} />
      <stop offset="0.42" stopColor={c[1]} />
      <stop offset="1" stopColor={c[2]} />
    </linearGradient>
  );
}

function Shadow({ cy = 58.4, rx = 15 }: { cy?: number; rx?: number }): ReactElement {
  return <ellipse cx="32" cy={cy} rx={rx} ry="2.2" fill="#000" opacity="0.34" />;
}

/** The common tapered plinth every free-standing trophy sits on. */
function Stand({
  y = 50, w = 22, h = 6, taper = 3,
}: { y?: number; w?: number; h?: number; taper?: number }): ReactElement {
  const x = 32 - w / 2;
  return (
    <>
      <path d={`M${x} ${y}h${w}l${taper} ${h}h${-(w + taper * 2)}z`} fill={PL_BODY} />
      <rect x={x - 1} y={y - 1.9} width={w + 2} height="2.3" rx="1.15" fill={PL_TOP} />
      <rect x={x - taper} y={y + h - 1.4} width={w + taper * 2} height="1.4" fill={PL_DARK} />
    </>
  );
}

/** Deterministic star outline — used by several awards at different scales. */
function starPath(cx: number, cy: number, outer: number, inner: number, points = 5): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = ((-90 + (i * 180) / points) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

/* --------------------------------------------------- international ------ */

/** A globe carried up on a twisted, waisted stem. */
const artWorldCup = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-wc-g" c={GOLD} />
      <Metal id="tr-wc-d" c={GOLD_DEEP} />
    </defs>
    <Shadow rx={13} />
    <Stand y={50} w={20} h={6} taper={3} />
    <path d="M25 50c-6-9-5-20 3-26l4-3 4 3c8 6 9 17 3 26z" fill="url(#tr-wc-d)" />
    <path d="M31 24c-4 7-4 17-2 26h6c-2-9-2-19 2-26z" fill="#000" opacity="0.18" />
    <circle cx="32" cy="18" r="9.6" fill="url(#tr-wc-g)" />
    <ellipse cx="32" cy="18" rx="4.1" ry="9.6" fill="none" stroke="#7a5210" strokeWidth="0.9" opacity="0.5" />
    <path d="M22.6 18h18.8" stroke="#7a5210" strokeWidth="0.9" opacity="0.5" />
    <path d="M26.6 12.4a9.6 9.6 0 0 1 5.6-3" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" opacity="0.55" />
  </>
);

/** A slim silver chalice ringed with stars. */
const artEuro = (): ReactElement => (
  <>
    <defs><Metal id="tr-eu-s" c={SILVER} /></defs>
    <Shadow rx={11} />
    <Stand y={50} w={17} h={6} taper={2.5} />
    <rect x="29.6" y="33" width="4.8" height="17" fill="url(#tr-eu-s)" />
    <ellipse cx="32" cy="37.5" rx="4.4" ry="2.2" fill="url(#tr-eu-s)" />
    <path d="M20 16c-3.6.8-4.8 5.6-2.2 9.2" fill="none" stroke="url(#tr-eu-s)" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M44 16c3.6.8 4.8 5.6 2.2 9.2" fill="none" stroke="url(#tr-eu-s)" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M21.5 13h21v5.4c0 9-4.4 14.6-10.5 16.6-6.1-2-10.5-7.6-10.5-16.6z" fill="url(#tr-eu-s)" />
    <rect x="19.4" y="10.2" width="25.2" height="3.6" rx="1.8" fill="url(#tr-eu-s)" />
    <g fill="#e6b93f">
      <circle cx="25.4" cy="21.4" r="1.15" />
      <circle cx="28.7" cy="19.9" r="1.15" />
      <circle cx="32" cy="19.4" r="1.15" />
      <circle cx="35.3" cy="19.9" r="1.15" />
      <circle cx="38.6" cy="21.4" r="1.15" />
    </g>
    <path d="M24 15.5c0 6 .6 10.4 2.4 13.6" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
  </>
);

/** A broad two-handled cup raised on a tall stepped column. */
const artCopaAmerica = (): ReactElement => (
  <>
    <defs><Metal id="tr-ca-g" c={GOLD} /></defs>
    <Shadow rx={15} />
    <path d="M18 53h28v5.2H18z" fill={PL_BODY} />
    <rect x="18" y="53" width="28" height="1.6" fill={PL_TOP} />
    <path d="M22 47.5h20v5.5H22z" fill={PL_BODY} />
    <rect x="22" y="47.5" width="20" height="1.5" fill={PL_TOP} />
    <rect x="27.6" y="33" width="8.8" height="15" fill="url(#tr-ca-g)" />
    <path d="M13.4 16.5c-4.4 1.4-5.4 8.2-1.6 12.6" fill="none" stroke="url(#tr-ca-g)" strokeWidth="3.2" strokeLinecap="round" />
    <path d="M50.6 16.5c4.4 1.4 5.4 8.2 1.6 12.6" fill="none" stroke="url(#tr-ca-g)" strokeWidth="3.2" strokeLinecap="round" />
    <path d="M18 13.6h28v4.8c0 9.4-5.6 15.6-14 17.6-8.4-2-14-8.2-14-17.6z" fill="url(#tr-ca-g)" />
    <rect x="15.6" y="10.4" width="32.8" height="3.8" rx="1.9" fill="url(#tr-ca-g)" />
    <path d="M22 16.5c0 7 1 12 3.4 15.4" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.38" />
  </>
);

/** A wide fluted bowl banded with a national ribbon. */
const artNationsLeague = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-nl-s" c={SILVER} />
      <Metal id="tr-nl-r" c={AZURE} />
    </defs>
    <Shadow rx={13} />
    <Stand y={50} w={19} h={6} taper={3} />
    <rect x="29.4" y="36" width="5.2" height="14" fill="url(#tr-nl-s)" />
    <path d="M17 15.5h30v3.6c0 10.6-6.8 17.8-15 20-8.2-2.2-15-9.4-15-20z" fill="url(#tr-nl-s)" />
    <rect x="15" y="12.2" width="34" height="3.6" rx="1.8" fill="url(#tr-nl-s)" />
    <g stroke="#5d6b81" strokeWidth="1" opacity="0.5">
      <path d="M22.5 17c.4 8 1.6 13.6 3.6 17.4" fill="none" />
      <path d="M27.2 17c0 8.6.6 14.6 1.8 18.6" fill="none" />
      <path d="M36.8 17c0 8.6-.6 14.6-1.8 18.6" fill="none" />
      <path d="M41.5 17c-.4 8-1.6 13.6-3.6 17.4" fill="none" />
    </g>
    <path d="M19 39c5.4 3.4 19.6 3.4 26 0l1.6 4.6c-7 3.8-22.2 3.8-29.2 0z" fill="url(#tr-nl-r)" />
    <path d="M19 39c5.4 3.4 19.6 3.4 26 0l.6 1.7c-6.6 3.4-20.6 3.4-27.2 0z" fill="#fff" opacity="0.25" />
  </>
);

/** A shallow gold bowl with angular wedge handles on a hex plinth. */
const artGoldCup = (): ReactElement => (
  <>
    <defs><Metal id="tr-gc-g" c={GOLD} /></defs>
    <Shadow rx={13} />
    <path d="M23 47h18l4.5 5.5-4.5 5.5H23l-4.5-5.5z" fill={PL_BODY} />
    <path d="M23 47h18l1.2 1.5H21.8z" fill={PL_TOP} />
    <rect x="29.4" y="36" width="5.2" height="11.4" fill="url(#tr-gc-g)" />
    <path d="M20 19.5 9.5 14v6.4l9.6 5.4z" fill="url(#tr-gc-g)" />
    <path d="M44 19.5 54.5 14v6.4l-9.6 5.4z" fill="url(#tr-gc-g)" />
    <path d="M20.5 17.5h23l-2.6 13.6c-.8 4.2-4.6 6.8-8.9 6.8s-8.1-2.6-8.9-6.8z" fill="url(#tr-gc-g)" />
    <rect x="18.4" y="14.2" width="27.2" height="3.6" rx="1.8" fill="url(#tr-gc-g)" />
    <path d="M24.4 19.6c.2 7 .9 11.8 2.2 14.6" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.38" />
  </>
);

/** Petals opening into a wide bowl on a slender stem. */
const artAsianCup = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-as-g" c={GOLD} />
      <Metal id="tr-as-d" c={GOLD_DEEP} />
    </defs>
    <Shadow rx={11} />
    <Stand y={50} w={17} h={6} taper={2.5} />
    <rect x="30" y="34" width="4" height="16" fill="url(#tr-as-d)" />
    <path d="M17.5 14.6c6.6 2.4 10.6 8.6 11.4 15.8H18.6c-3.6-4.8-4-11-1.1-15.8z" fill="url(#tr-as-d)" />
    <path d="M46.5 14.6c-6.6 2.4-10.6 8.6-11.4 15.8h10.3c3.6-4.8 4-11 1.1-15.8z" fill="url(#tr-as-d)" />
    <path d="M32 7.5c5.6 6.4 8 15 6.8 22.9H25.2C24 22.5 26.4 13.9 32 7.5z" fill="url(#tr-as-g)" />
    <rect x="20.6" y="29.6" width="22.8" height="4.6" rx="2.3" fill="url(#tr-as-g)" />
    <path d="M30 12.6c-2.2 4.6-3 10.4-2.6 15.4" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.42" />
  </>
);

/** An angular tapering chalice flanked by leaf handles. */
const artAfcon = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-afn-g" c={GOLD} />
      <Metal id="tr-afn-d" c={GOLD_DEEP} />
    </defs>
    <Shadow rx={12} />
    <Stand y={50} w={18} h={6} taper={3} />
    <ellipse cx="32" cy="38.6" rx="6" ry="2.6" fill="url(#tr-afn-d)" />
    <rect x="29.6" y="37" width="4.8" height="13" fill="url(#tr-afn-d)" />
    <path d="M19.6 16.6c-6.4 1.6-8.6 8.6-4.8 14 4.6-1.6 6.6-7.8 4.8-14z" fill="url(#tr-afn-d)" />
    <path d="M44.4 16.6c6.4 1.6 8.6 8.6 4.8 14-4.6-1.6-6.6-7.8-4.8-14z" fill="url(#tr-afn-d)" />
    <path d="M19.6 14.4h24.8l-5.2 20.4a3 3 0 0 1-2.9 2.2h-8.6a3 3 0 0 1-2.9-2.2z" fill="url(#tr-afn-g)" />
    <rect x="17.4" y="11" width="29.2" height="3.8" rx="1.9" fill="url(#tr-afn-g)" />
    <path d="M32 18.4l4.6 5.4L32 29.2l-4.6-5.4z" fill="#7f5411" opacity="0.42" />
    <path d="M23.4 16.4l3 17" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
  </>
);

/** A laurel medal hanging from a folded ribbon. */
const artOlympicGold = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-oly-g" c={GOLD} />
      <Metal id="tr-oly-r" c={AZURE} />
    </defs>
    <path d="M21 4h8.4l8.2 18.2-7 3.4z" fill="url(#tr-oly-r)" />
    <path d="M43 4h-8.4l-8.2 18.2 7 3.4z" fill="url(#tr-oly-r)" />
    <path d="M43 4h-8.4l-1.4 3.2h8.4z" fill="#fff" opacity="0.28" />
    <Shadow cy={57.6} rx={11} />
    <circle cx="32" cy="41" r="13.4" fill="url(#tr-oly-g)" />
    <circle cx="32" cy="41" r="10.2" fill="none" stroke="#8b5d13" strokeWidth="1.1" opacity="0.45" />
    <path d="M25.4 47.6a9.4 9.4 0 0 1 0-13.2" fill="none" stroke="#8b5d13" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
    <path d="M38.6 47.6a9.4 9.4 0 0 0 0-13.2" fill="none" stroke="#8b5d13" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
    <path d={starPath(32, 41, 6.4, 2.7)} fill="#8b5d13" opacity="0.55" />
    <path d="M25 33.4a13.4 13.4 0 0 1 6.4-4.6" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />
  </>
);

/* ------------------------------------------------------ continental ----- */

/** The big-eared bowl — oversized sweeping handles, deep basin. */
const artChampionsLeague = (): ReactElement => (
  <>
    <defs><Metal id="tr-ucl-s" c={SILVER} /></defs>
    <Shadow rx={14} />
    <Stand y={50} w={21} h={6} taper={3} />
    <rect x="28.4" y="41" width="7.2" height="9" fill="url(#tr-ucl-s)" />
    <path d="M19.4 21C9 24.6 8.2 39.4 15.6 45.6" fill="none" stroke="url(#tr-ucl-s)" strokeWidth="4.4" strokeLinecap="round" />
    <path d="M44.6 21C55 24.6 55.8 39.4 48.4 45.6" fill="none" stroke="url(#tr-ucl-s)" strokeWidth="4.4" strokeLinecap="round" />
    <path d="M17.4 18.4h29.2v4.4c0 11.4-6.8 18.6-14.6 20.8-7.8-2.2-14.6-9.4-14.6-20.8z" fill="url(#tr-ucl-s)" />
    <rect x="15.2" y="15" width="33.6" height="3.8" rx="1.9" fill="url(#tr-ucl-s)" />
    <path d="M22 21.4c0 8.4 1.2 14 3.6 17.6" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" opacity="0.42" />
  </>
);

/** A bulbous handleless amphora on a square plinth. */
const artEuropaLeague = (): ReactElement => (
  <>
    <defs><Metal id="tr-uel-s" c={SILVER} /></defs>
    <Shadow rx={12} />
    <path d="M20 48h24v4.6H20z" fill={PL_BODY} />
    <path d="M17.6 52.6h28.8v4.6H17.6z" fill={PL_DARK} />
    <rect x="20" y="48" width="24" height="1.5" fill={PL_TOP} />
    <path d="M32 10.6c11.6 0 17.6 9.8 17.6 19.4 0 9.8-7.8 16.4-17.6 16.4S14.4 39.8 14.4 30c0-9.6 6-19.4 17.6-19.4z" fill="url(#tr-uel-s)" />
    <rect x="24.6" y="7.4" width="14.8" height="4.2" rx="2.1" fill="url(#tr-uel-s)" />
    <g stroke="#5d6b81" strokeWidth="0.95" opacity="0.45" fill="none">
      <path d="M22 24.6c3-3.4 7.4-3.4 10.4 0" />
      <path d="M32 24.6c3-3.4 7.4-3.4 10.4 0" />
      <path d="M19.6 33.6c3-3.4 7.4-3.4 10.4 0" />
      <path d="M34 33.6c3-3.4 7.4-3.4 10.4 0" />
    </g>
    <path d="M22.6 20.4c-2.4 4.4-3.2 9.6-2.4 14.2" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.4" />
  </>
);

/** A slim twisted blade — the tall, narrow member of the family. */
const artConferenceLeague = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-uecl-s" c={SILVER} />
      <Metal id="tr-uecl-d" c={AZURE} />
    </defs>
    <Shadow rx={9} />
    <Stand y={50} w={14} h={6} taper={2.4} />
    <path d="M32 5.4c6.4 8.6 9.6 17.2 8.6 25.6-1 8.6-4.2 13.4-4.2 19h-8.8c0-5.6-3.2-10.4-4.2-19-1-8.4 2.2-17 8.6-25.6z" fill="url(#tr-uecl-s)" />
    <path d="M32 10.2c-3.8 7.6-5 15-3.4 21.2 1.2 4.6 2 9.4 2 13.4h2.8c0-4 .8-8.8 2-13.4 1.6-6.2.4-13.6-3.4-21.2z" fill="url(#tr-uecl-d)" opacity="0.35" />
    <path d="M28.8 12.8c-3 6.4-4.2 12.6-3.4 18.4" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.45" />
    <rect x="27.6" y="44.6" width="8.8" height="5.4" fill="url(#tr-uecl-s)" />
  </>
);

/** A small bowl between two tall, spindly loop handles. */
const artUefaSuperCup = (): ReactElement => (
  <>
    <defs><Metal id="tr-usc-s" c={SILVER} /></defs>
    <Shadow rx={10} />
    <Stand y={50} w={16} h={6} taper={2.6} />
    <rect x="30" y="40" width="4" height="10" fill="url(#tr-usc-s)" />
    <ellipse cx="32" cy="43" rx="4.6" ry="2.2" fill="url(#tr-usc-s)" />
    <path d="M22.4 32.6c-7-4.6-7-16.4.6-20.4" fill="none" stroke="url(#tr-usc-s)" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M41.6 32.6c7-4.6 7-16.4-.6-20.4" fill="none" stroke="url(#tr-usc-s)" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M22 25.6h20v3.4c0 7.6-4.6 12.2-10 13.6-5.4-1.4-10-6-10-13.6z" fill="url(#tr-usc-s)" />
    <rect x="20" y="22.4" width="24" height="3.4" rx="1.7" fill="url(#tr-usc-s)" />
    <path d="M25.6 28.4c0 5.6.8 9.4 2.4 11.8" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
  </>
);

/** A world sphere caught inside a tilted orbital ring. */
const artClubWorldCup = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-cwc-g" c={GOLD} />
      <Metal id="tr-cwc-r" c={GOLD_DEEP} />
    </defs>
    <Shadow rx={13} />
    <ellipse cx="32" cy="50.4" rx="13" ry="4.2" fill={PL_BODY} />
    <path d="M19 50.4v3.4c0 2.3 5.8 4.2 13 4.2s13-1.9 13-4.2v-3.4z" fill={PL_DARK} />
    <ellipse cx="32" cy="50.4" rx="13" ry="4.2" fill="none" stroke={PL_TOP} strokeWidth="1.2" />
    <rect x="27.4" y="37" width="9.2" height="11" fill="url(#tr-cwc-r)" />
    <circle cx="32" cy="24" r="14" fill="url(#tr-cwc-g)" />
    <ellipse cx="32" cy="24" rx="5.8" ry="14" fill="none" stroke="#89590f" strokeWidth="1" opacity="0.45" />
    <path d="M18.4 24h27.2" stroke="#89590f" strokeWidth="1" opacity="0.45" />
    <path d="M20.6 16.4a14 14 0 0 1 7.2-5.4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <ellipse cx="32" cy="26" rx="19.6" ry="6.4" fill="none" stroke="url(#tr-cwc-r)" strokeWidth="2.8" transform="rotate(-19 32 26)" />
  </>
);

/** A tall slim cup crowned with a small striker figure. */
const artLibertadores = (): ReactElement => (
  <>
    <defs><Metal id="tr-lib-s" c={SILVER} /></defs>
    <Shadow rx={11} />
    <Stand y={50} w={18} h={6} taper={2.8} />
    <rect x="29.6" y="41" width="4.8" height="9" fill="url(#tr-lib-s)" />
    <ellipse cx="32" cy="43.4" rx="5.4" ry="2.2" fill="url(#tr-lib-s)" />
    <circle cx="32" cy="7.6" r="2.6" fill="url(#tr-lib-s)" />
    <path d="M32 11c2 0 3.4 1.4 3.4 3.2l3.4-3 1.8 1.9-4.4 4.4v4.1h-8.4v-4.1l-4.4-4.4 1.8-1.9 3.4 3c0-1.8 1.4-3.2 3.4-3.2z" fill="url(#tr-lib-s)" />
    <ellipse cx="32" cy="22.6" rx="9.6" ry="2.8" fill="url(#tr-lib-s)" />
    <path d="M22.6 22.6h18.8l-2.2 15.2c-.4 2.8-3.3 4.6-7.2 4.6s-6.8-1.8-7.2-4.6z" fill="url(#tr-lib-s)" />
    <path d="M22.8 26c-3.4 1.4-4 6.4-1.2 9.4" fill="none" stroke="url(#tr-lib-s)" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M41.2 26c3.4 1.4 4 6.4 1.2 9.4" fill="none" stroke="url(#tr-lib-s)" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M26.6 25.4c-.2 6.4.4 11 1.8 13.8" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
  </>
);

/** A squat bronze cup with a domed lid and knob. */
const artSudamericana = (): ReactElement => (
  <>
    <defs><Metal id="tr-sud-b" c={BRONZE} /></defs>
    <Shadow rx={11} />
    <Stand y={50} w={18} h={6} taper={2.8} />
    <rect x="29.6" y="41.6" width="4.8" height="8.4" fill="url(#tr-sud-b)" />
    <circle cx="32" cy="10.6" r="2.8" fill="url(#tr-sud-b)" />
    <rect x="30.8" y="13" width="2.4" height="3.4" fill="url(#tr-sud-b)" />
    <path d="M20.6 22.6c0-5.4 5.1-8.6 11.4-8.6s11.4 3.2 11.4 8.6z" fill="url(#tr-sud-b)" />
    <rect x="18.6" y="22.4" width="26.8" height="3.4" rx="1.7" fill="url(#tr-sud-b)" />
    <path d="M20.8 25.8h22.4v3.6c0 8-4.9 13.2-11.2 14.8-6.3-1.6-11.2-6.8-11.2-14.8z" fill="url(#tr-sud-b)" />
    <path d="M20.6 29c-4.2 1.2-5.2 6.6-2 10" fill="none" stroke="url(#tr-sud-b)" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M43.4 29c4.2 1.2 5.2 6.6 2 10" fill="none" stroke="url(#tr-sud-b)" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M25 28.6c0 6.2.8 10.4 2.4 13" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
  </>
);

/** A faceted crystal-cut diamond bowl on a short stem. */
const artConcacafChampions = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-ccc-g" c={GOLD} />
      <Metal id="tr-ccc-d" c={GOLD_DEEP} />
    </defs>
    <Shadow rx={11} />
    <Stand y={50} w={18} h={6} taper={2.8} />
    <rect x="29.4" y="40" width="5.2" height="10" fill="url(#tr-ccc-d)" />
    <path d="M32 6.6 46.6 24 32 42.4 17.4 24z" fill="url(#tr-ccc-g)" />
    <path d="M32 6.6 17.4 24l14.6-4.6z" fill="#fff" opacity="0.2" />
    <g stroke="#7f5411" strokeWidth="0.9" opacity="0.35" fill="none">
      <path d="M32 6.6v35.8" />
      <path d="M17.4 24h29.2" />
      <path d="M23 19.4h18" />
    </g>
    <path d="M24.6 15.4 32 9.8" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />
  </>
);

/** A bowl cradled between two crescent wings rising past the rim. */
const artAfcChampions = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-afc-g" c={GOLD} />
      <Metal id="tr-afc-d" c={GOLD_DEEP} />
    </defs>
    <Shadow rx={13} />
    <Stand y={50} w={19} h={6} taper={3} />
    <rect x="29.6" y="41" width="4.8" height="9" fill="url(#tr-afc-d)" />
    <path d="M18.6 43.4c-6.8-9.2-6-22.4 1.6-30.4 1 10.6 2.4 21 5.2 27.6z" fill="url(#tr-afc-d)" />
    <path d="M45.4 43.4c6.8-9.2 6-22.4-1.6-30.4-1 10.6-2.4 21-5.2 27.6z" fill="url(#tr-afc-d)" />
    <path d="M23 24.6h18v3.2c0 8.4-4.2 13.6-9 15.2-4.8-1.6-9-6.8-9-15.2z" fill="url(#tr-afc-g)" />
    <rect x="21" y="21.4" width="22" height="3.4" rx="1.7" fill="url(#tr-afc-g)" />
    <path d="M26.4 27.4c0 6.2.8 10.4 2.2 12.8" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
  </>
);

/* ------------------------------------------------------------ league ---- */

/** A league shield: a pointed plate with a title bar and a star. */
const artLeagueShield = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-shd-s" c={SILVER} />
      <Metal id="tr-shd-g" c={GOLD} />
    </defs>
    <Shadow cy={57.6} rx={10} />
    <path d="M12 8.6h40v22.6c0 12.6-10.4 19.4-20 23.6-9.6-4.2-20-11-20-23.6z" fill="url(#tr-shd-g)" />
    <path d="M15.4 12h33.2v19.2c0 10.6-8.8 16.6-16.6 20.2-7.8-3.6-16.6-9.6-16.6-20.2z" fill="url(#tr-shd-s)" />
    <path d={starPath(32, 22.6, 7.2, 3)} fill="url(#tr-shd-g)" />
    <rect x="18.6" y="32.4" width="26.8" height="5" rx="1.6" fill="url(#tr-shd-g)" />
    <rect x="21.6" y="41" width="20.8" height="2.6" rx="1.3" fill="#5d6b81" opacity="0.55" />
    <path d="M18.4 14.6v16" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" opacity="0.45" />
  </>
);

/** The classic lidded league cup with a ball finial. */
const artLeagueTrophy = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-lgt-g" c={GOLD} />
      <Metal id="tr-lgt-d" c={GOLD_DEEP} />
    </defs>
    <Shadow rx={12} />
    <Stand y={50} w={20} h={6} taper={3} />
    <rect x="29.4" y="40" width="5.2" height="10" fill="url(#tr-lgt-d)" />
    <ellipse cx="32" cy="42.6" rx="5.8" ry="2.3" fill="url(#tr-lgt-d)" />
    <circle cx="32" cy="6.6" r="3.2" fill="url(#tr-lgt-g)" />
    <rect x="30.8" y="9.4" width="2.4" height="3" fill="url(#tr-lgt-g)" />
    <path d="M21.6 16.4c0-5 4.7-8.2 10.4-8.2s10.4 3.2 10.4 8.2z" fill="url(#tr-lgt-g)" />
    <rect x="19.6" y="16.2" width="24.8" height="3.4" rx="1.7" fill="url(#tr-lgt-g)" />
    <path d="M21.8 19.6h20.4v3.8c0 8.8-5 14.4-10.2 16.2-5.2-1.8-10.2-7.4-10.2-16.2z" fill="url(#tr-lgt-g)" />
    <path d="M21.6 22.6c-4.6 1.2-6 7-3 11.2" fill="none" stroke="url(#tr-lgt-g)" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M42.4 22.6c4.6 1.2 6 7 3 11.2" fill="none" stroke="url(#tr-lgt-g)" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M25.6 22.4c0 7 .8 11.6 2.4 14.2" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.38" />
  </>
);

/** Premier League: a crown-topped cup on a plinth, banded in royal purple. */
const artPremierLeague = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-epl-g" c={GOLD} />
      <Metal id="tr-epl-d" c={GOLD_DEEP} />
      <Metal id="tr-epl-p" c={PURPLE} />
    </defs>
    <Shadow rx={13} />
    <Stand y={50} w={21} h={6} taper={3} />
    <rect x="21.6" y="47.4" width="20.8" height="2.4" rx="1.2" fill="url(#tr-epl-p)" />
    <rect x="29.4" y="40" width="5.2" height="10" fill="url(#tr-epl-d)" />
    {/* crown finial */}
    <path d="M24 13 L26.5 6 L29 11 L32 4 L35 11 L37.5 6 L40 13 Z" fill="url(#tr-epl-g)" />
    <g fill="url(#tr-epl-d)">
      <circle cx="26.5" cy="6" r="1.4" />
      <circle cx="32" cy="4" r="1.6" />
      <circle cx="37.5" cy="6" r="1.4" />
    </g>
    <rect x="24" y="12.6" width="16" height="2.6" rx="1" fill="url(#tr-epl-g)" />
    {/* handles */}
    <path d="M21.6 21c-5 1-6.6 6.6-3.4 11" fill="none" stroke="url(#tr-epl-g)" strokeWidth="3" strokeLinecap="round" />
    <path d="M42.4 21c5 1 6.6 6.6 3.4 11" fill="none" stroke="url(#tr-epl-g)" strokeWidth="3" strokeLinecap="round" />
    {/* bowl */}
    <rect x="19.6" y="15.4" width="24.8" height="3.2" rx="1.6" fill="url(#tr-epl-g)" />
    <path d="M21.6 18.6h20.8v4.4c0 8.8-5 14.4-10.4 16.4-5.4-2-10.4-7.6-10.4-16.4z" fill="url(#tr-epl-g)" />
    <path d="M23 26.2c4.5 2 13.5 2 18 0l-.7 3.4c-5.4 2.2-11.2 2.2-16.6 0z" fill="url(#tr-epl-p)" />
    <path d="M25.6 19c0 8 .8 13 2.4 15.6" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
  </>
);

/** LaLiga: a tall, slim modern chalice with a pointed finial. */
const artLaLiga = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-lal-g" c={GOLD} />
      <Metal id="tr-lal-d" c={GOLD_DEEP} />
    </defs>
    <Shadow rx={10} />
    <Stand y={51} w={15} h={5} taper={2.4} />
    <rect x="30" y="40" width="4" height="11" fill="url(#tr-lal-d)" />
    <ellipse cx="32" cy="41.4" rx="4.6" ry="1.8" fill="url(#tr-lal-d)" />
    <path d="M32 3.6 34.4 9 32 11.4 29.6 9z" fill="url(#tr-lal-g)" />
    <path d="M26.2 12h11.6l-1.5 22.4c-.3 4-2.2 6.2-4.3 6.2s-4-2.2-4.3-6.2z" fill="url(#tr-lal-g)" />
    <rect x="24.6" y="9.8" width="14.8" height="3" rx="1.5" fill="url(#tr-lal-g)" />
    <path d="M28.6 13c-.3 10 .2 17.4 1.5 21.6" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.42" />
  </>
);

/** Bundesliga: the Meisterschale — a broad ringed salver standing on end. */
const artBundesliga = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-bun-g" c={GOLD} />
      <Metal id="tr-bun-d" c={GOLD_DEEP} />
    </defs>
    <Shadow cy={58} rx={12} />
    <path d="M26 49.6h12l2.2 6.4H23.8z" fill={PL_BODY} />
    <rect x="25" y="48.4" width="14" height="2.2" rx="1.1" fill={PL_TOP} />
    <circle cx="32" cy="27" r="22" fill="url(#tr-bun-g)" />
    <circle cx="32" cy="27" r="22" fill="none" stroke="url(#tr-bun-d)" strokeWidth="2" />
    <circle cx="32" cy="27" r="16.4" fill="#1d2432" opacity="0.26" />
    <circle cx="32" cy="27" r="16.4" fill="none" stroke="url(#tr-bun-d)" strokeWidth="1.2" opacity="0.6" />
    <circle cx="32" cy="27" r="9" fill="none" stroke="url(#tr-bun-d)" strokeWidth="1.2" opacity="0.5" />
    <path d={starPath(32, 27, 6, 2.6)} fill="url(#tr-bun-g)" />
    <g fill="url(#tr-bun-d)">
      <circle cx="51.5" cy="27" r="1.5" />
      <circle cx="45.8" cy="40.8" r="1.5" />
      <circle cx="32" cy="46.5" r="1.5" />
      <circle cx="18.2" cy="40.8" r="1.5" />
      <circle cx="12.5" cy="27" r="1.5" />
      <circle cx="18.2" cy="13.2" r="1.5" />
      <circle cx="32" cy="7.5" r="1.5" />
      <circle cx="45.8" cy="13.2" r="1.5" />
    </g>
    <path d="M18 15.6a22 22 0 0 1 9-6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.42" />
  </>
);

/** Serie A: a tall domed-lid coppa, fluted body, slender handles. */
const artSerieA = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-sea-g" c={GOLD} />
      <Metal id="tr-sea-d" c={GOLD_DEEP} />
    </defs>
    <Shadow rx={12} />
    <Stand y={51} w={18} h={5} taper={2.8} />
    <rect x="29.6" y="41" width="4.8" height="10" fill="url(#tr-sea-d)" />
    <ellipse cx="32" cy="42.6" rx="5.4" ry="2" fill="url(#tr-sea-d)" />
    <circle cx="32" cy="5" r="2.4" fill="url(#tr-sea-g)" />
    <path d="M22 14c0-6 4.6-9.4 10-9.4S42 8 42 14z" fill="url(#tr-sea-g)" />
    <rect x="21" y="13.4" width="22" height="2.8" rx="1.4" fill="url(#tr-sea-d)" />
    <path d="M21 20c-4.6 1-6 6-3 10" fill="none" stroke="url(#tr-sea-g)" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M43 20c4.6 1 6 6 3 10" fill="none" stroke="url(#tr-sea-g)" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M22.4 16.6h19.2l-1.8 20.4c-.3 3.4-3.3 5.4-7.8 5.4s-7.5-2-7.8-5.4z" fill="url(#tr-sea-g)" />
    <g stroke="#7f5411" strokeWidth="0.9" opacity="0.4" fill="none">
      <path d="M28 18l-1 21.6" />
      <path d="M32 18v21.6" />
      <path d="M36 18l1 21.6" />
    </g>
    <path d="M25.6 17.6c0 8 .6 13.2 2 16.4" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.38" />
  </>
);

/** Ligue 1: the Hexagoal — a hexagon body around a gilt sphere. */
const artLigue1 = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-fl1-g" c={GOLD} />
      <Metal id="tr-fl1-d" c={GOLD_DEEP} />
    </defs>
    <Shadow rx={12} />
    <Stand y={52} w={18} h={5} taper={2.8} />
    <rect x="29.6" y="42" width="4.8" height="10" fill="url(#tr-fl1-d)" />
    <path d="M32 6 52 17.5V40L32 51 12 40V17.5z" fill="url(#tr-fl1-g)" />
    <path d="M32 12 47 20.2V37L32 45 17 37V20.2z" fill="#1d2432" opacity="0.24" />
    <path d="M32 12 47 20.2V37L32 45 17 37V20.2z" fill="none" stroke="url(#tr-fl1-d)" strokeWidth="1.2" opacity="0.6" />
    <circle cx="32" cy="28.5" r="6.6" fill="url(#tr-fl1-g)" />
    <path d={starPath(32, 28.5, 5.4, 2.2)} fill="url(#tr-fl1-d)" opacity="0.6" />
    <path d="M14 19.5 32 9.4 50 19.5" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.35" />
  </>
);

/* --------------------------------------------------------------- cup ---- */

/** The everyday knockout cup: open bowl, round handles, tall stem. */
const artDomesticCup = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-dcp-s" c={SILVER} />
      <Metal id="tr-dcp-r" c={AZURE} />
    </defs>
    <Shadow rx={12} />
    <path d="M20.6 48.4h22.8v4.4H20.6z" fill={PL_BODY} />
    <rect x="20.6" y="48.4" width="22.8" height="1.5" fill={PL_TOP} />
    <path d="M17.6 52.8h28.8v4.4H17.6z" fill={PL_DARK} />
    <rect x="29.6" y="37.6" width="4.8" height="11" fill="url(#tr-dcp-s)" />
    <ellipse cx="32" cy="40.4" rx="5.6" ry="2.3" fill="url(#tr-dcp-s)" />
    <path d="M21.4 17.6c-5.6.8-7.4 6.8-4.4 11.6" fill="none" stroke="url(#tr-dcp-s)" strokeWidth="2.7" strokeLinecap="round" />
    <path d="M42.6 17.6c5.6.8 7.4 6.8 4.4 11.6" fill="none" stroke="url(#tr-dcp-s)" strokeWidth="2.7" strokeLinecap="round" />
    <path d="M21.6 15.4h20.8v5.8c0 8.8-5 14.4-10.4 16.4-5.4-2-10.4-7.6-10.4-16.4z" fill="url(#tr-dcp-s)" />
    <path d={starPath(32, 22, 3.4, 1.4)} fill="url(#tr-dcp-r)" opacity="0.6" />
    <path d="M22.2 26.4c3.4 2.4 12.2 2.4 19.6 0l1 3.3c-4.6 2.5-15 2.5-21.6 0z" fill="url(#tr-dcp-r)" />
    <path d="M22.2 26.4c3.4 2.4 12.2 2.4 19.6 0l.4 1.3c-4.4 2.3-14.4 2.3-18.8 0z" fill="#fff" opacity="0.25" />
    <rect x="19.4" y="12.2" width="25.2" height="3.5" rx="1.75" fill="url(#tr-dcp-s)" />
    <path d="M25.4 18.4c0 7.4.8 12.2 2.4 14.8" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.42" />
  </>
);

/** The super cup: a wide salver with ring handles under a star. */
const artDomesticSuperCup = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-dsc-g" c={GOLD} />
      <Metal id="tr-dsc-d" c={GOLD_DEEP} />
    </defs>
    <Shadow rx={12} />
    <Stand y={46} w={19} h={6} taper={3} />
    <rect x="29" y="33.6" width="6" height="12.4" fill="url(#tr-dsc-d)" />
    <path d={starPath(32, 8.6, 6.6, 2.8)} fill="url(#tr-dsc-g)" />
    <circle cx="11.4" cy="23" r="4.6" fill="none" stroke="url(#tr-dsc-d)" strokeWidth="2.5" />
    <circle cx="52.6" cy="23" r="4.6" fill="none" stroke="url(#tr-dsc-d)" strokeWidth="2.5" />
    <path d="M16 21.4h32c0 8.6-7.2 13.8-16 13.8s-16-5.2-16-13.8z" fill="url(#tr-dsc-g)" />
    <rect x="13.6" y="18" width="36.8" height="3.6" rx="1.8" fill="url(#tr-dsc-g)" />
    <path d="M20.4 23.6c1.4 4 4.4 6.8 8.2 8" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.4" />
  </>
);

/* ------------------------------------------------------------ awards ---- */

/** A smooth golden sphere on a slim obelisk — the individual crown. */
const artBallonDor = (): ReactElement => (
  <>
    <defs><Metal id="tr-bdo-g" c={GOLD} /></defs>
    <Shadow rx={11} />
    <path d="M27.6 34h8.8l3.6 18H24z" fill={PL_BODY} />
    <path d="M27.6 34h8.8l.3 1.6h-9.4z" fill={PL_TOP} />
    <path d="M23.4 52h17.2v5.4H23.4z" fill={PL_DARK} />
    <circle cx="32" cy="21" r="13.4" fill="url(#tr-bdo-g)" />
    <ellipse cx="32" cy="21" rx="5.2" ry="13.4" fill="none" stroke="#8b5d13" strokeWidth="0.9" opacity="0.32" />
    <path d="M18.8 21h26.4" stroke="#8b5d13" strokeWidth="0.9" opacity="0.32" />
    <ellipse cx="25.6" cy="14.2" rx="4.6" ry="3" fill="#fff" opacity="0.45" transform="rotate(-34 25.6 14.2)" />
  </>
);

/** A statuette: a figure with an arm raised, ball in hand. */
const artTheBest = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-tbs-g" c={GOLD} />
      <Metal id="tr-tbs-d" c={GOLD_DEEP} />
    </defs>
    <Shadow rx={12} />
    <circle cx="28.6" cy="11" r="3.6" fill="url(#tr-tbs-g)" />
    <path d="M24.6 17.6c0-2.1 1.7-3.4 4-3.4s4 1.3 4 3.4l1.4 9.6-1.1 6.6.9 8.6h-3.4l-1.7-8.4-1.7 8.4h-3.4l.9-8.6-1.1-6.6z" fill="url(#tr-tbs-g)" />
    <path d="M32.8 16.4 40.6 9.8l2.5 2.9-7.8 6.8z" fill="url(#tr-tbs-d)" />
    <circle cx="44.6" cy="8" r="3.6" fill="url(#tr-tbs-d)" />
    <ellipse cx="32" cy="42" rx="12" ry="3.4" fill={PL_TOP} />
    <path d="M20 42h24v9H20z" fill={PL_BODY} />
    <ellipse cx="32" cy="51" rx="12" ry="3.4" fill={PL_DARK} />
    <path d="M26.4 18.4c-.6 3-.8 6-.6 8.8" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
  </>
);

/** A gilded boot in profile on a mounting bar. */
const artGoldenBoot = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-gbt-g" c={GOLD} />
      <Metal id="tr-gbt-d" c={GOLD_DEEP} />
    </defs>
    <Shadow cy={57.4} rx={15} />
    <path d="M13.6 42.2c0-3.4 1-6.6 2.8-9.6l3.6-12c.7-2.3 2.7-3.8 5.2-3.8h2.6c2.2 0 3.8 1.8 3.8 4 0 3.8.9 6.7 3.8 9l11.6 8.8c2.6 2 4 4.6 4 7.6v1.2H13.6z" fill="url(#tr-gbt-g)" />
    <path d="M12.4 47.4h39.2v3.8c0 1.7-1.3 2.8-3.2 2.8H15.6c-1.9 0-3.2-1.1-3.2-2.8z" fill="url(#tr-gbt-d)" />
    <g stroke="#7f5411" strokeWidth="1.4" strokeLinecap="round" opacity="0.5">
      <path d="M22.6 25.4 27 27.6" />
      <path d="M21.4 30.2 26 32.4" />
      <path d="M20.2 35 25 37.2" />
    </g>
    <path d="M19.4 22.4c-1.4 3.4-2.6 7.6-3.6 12.6" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.42" />
  </>
);

/** A panelled match ball lifted on a crescent arm. */
const artGoldenBall = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-gbl-g" c={GOLD} />
      <Metal id="tr-gbl-d" c={GOLD_DEEP} />
    </defs>
    <Shadow rx={13} />
    <path d="M19.4 48.6C13.8 35 19 20.4 31.6 14.4l2.2 4.6C23.6 24 19.4 36 23.8 48.6z" fill="url(#tr-gbl-d)" />
    <circle cx="35.2" cy="22.6" r="12.4" fill="url(#tr-gbl-g)" />
    <g fill="#7f5411" opacity="0.5">
      <path d="M35.2 15.4 40.6 19.2 38.5 25.4h-6.6L29.8 19.2z" />
      <path d="M35.2 33.8c-2 0-3.8-.4-5.4-1.1l1.8-3.4h7.2l1.8 3.4c-1.6.7-3.4 1.1-5.4 1.1z" />
      <path d="M23.4 26.6a12 12 0 0 1 .6-6l3.6 2.6-1.1 4z" />
      <path d="M47 26.6a12 12 0 0 0-.6-6l-3.6 2.6 1.1 4z" />
    </g>
    <path d="M27.6 15.6a12.4 12.4 0 0 1 6.2-3.2" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />
    <path d="M19.4 48.6h25.2v4.4H19.4z" fill={PL_BODY} />
    <rect x="19.4" y="48.6" width="25.2" height="1.5" fill={PL_TOP} />
    <path d="M16.6 53h31v4.4h-31z" fill={PL_DARK} />
  </>
);

/** A keeper's glove, palm forward, fingers spread. */
const artGoldenGlove = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-glv-g" c={GOLD} />
      <Metal id="tr-glv-d" c={GOLD_DEEP} />
    </defs>
    <Shadow cy={57.4} rx={12} />
    <rect x="21.6" y="20.6" width="5.2" height="13" rx="2.6" fill="url(#tr-glv-g)" />
    <rect x="27.2" y="14.6" width="5.2" height="19" rx="2.6" fill="url(#tr-glv-g)" />
    <rect x="32.8" y="13.4" width="5.2" height="20.2" rx="2.6" fill="url(#tr-glv-g)" />
    <rect x="38.4" y="16.8" width="5.2" height="16.8" rx="2.6" fill="url(#tr-glv-g)" />
    <path d="M20.6 31.4c-4.4 0-7 3.2-7 6.9 0 3.3 2.2 6 5.4 6.8l3.4-4.4z" fill="url(#tr-glv-d)" />
    <path d="M20.6 27.6h23v8.6c0 6.9-5.2 11.9-11.5 11.9s-11.5-5-11.5-11.9z" fill="url(#tr-glv-g)" />
    <rect x="22" y="46.6" width="20" height="5.8" rx="2.2" fill="url(#tr-glv-d)" />
    <g stroke="#7f5411" strokeWidth="1.1" opacity="0.42">
      <path d="M25.4 33.6v10" />
      <path d="M32 33.6v10.6" />
      <path d="M38.6 33.6v10" />
    </g>
    <path d="M23.6 30.4c-.6 4-.4 7.6.6 10.4" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
  </>
);

/** The scorer's award: a ball buried in the top corner of the goal. */
const artClTopScorer = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-tsc-g" c={GOLD} />
      <Metal id="tr-tsc-b" c={GOLD_DEEP} />
    </defs>
    <Shadow cy={57.6} rx={13} />
    <g stroke="#8ea0bb" strokeWidth="0.8" opacity="0.35">
      <path d="M14 20v28M22 20v28M30 20v28M38 20v28M46 20v28" />
      <path d="M12 26h40M12 33h40M12 40h40M12 47h40" />
    </g>
    <path d="M10.6 16.6h42.8v3.4H10.6z" fill="url(#tr-tsc-g)" />
    <path d="M10.6 16.6h3.4v34.8h-3.4z" fill="url(#tr-tsc-g)" />
    <path d="M50 16.6h3.4v34.8H50z" fill="url(#tr-tsc-g)" />
    <path d="M10.6 48h42.8v3.4H10.6z" fill="url(#tr-tsc-b)" />
    <circle cx="42.6" cy="27.6" r="7.4" fill="url(#tr-tsc-g)" />
    <g fill="#7f5411" opacity="0.5">
      <path d="M42.6 23.2 45.8 25.5 44.6 29.2h-4l-1.2-3.7z" />
      <path d="M42.6 34.4c-1.2 0-2.3-.3-3.3-.7l1.1-2h4.4l1.1 2c-1 .4-2.1.7-3.3.7z" />
    </g>
  </>
);

/** Player of the Season: a bold star raised on a stem. */
const artPlayerOfSeason = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-pos-g" c={GOLD} />
      <Metal id="tr-pos-d" c={GOLD_DEEP} />
    </defs>
    <Shadow rx={12} />
    <Stand y={50} w={20} h={6} taper={3} />
    <rect x="29.4" y="32" width="5.2" height="18" fill="url(#tr-pos-d)" />
    <path d={starPath(32, 22, 15.4, 6.6)} fill="url(#tr-pos-g)" />
    <path d="M32 6.6 28.2 16.8 17.4 17.4z" fill="#fff" opacity="0.22" />
  </>
);

/** League MVP: a crown — the most valuable head in the division. */
const artLeagueMvp = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-mvp-g" c={GOLD} />
      <Metal id="tr-mvp-d" c={GOLD_DEEP} />
    </defs>
    <Shadow cy={57.4} rx={14} />
    <path d="M13.4 43.6 9.8 15.4l11.6 8.4L32 6.6l10.6 17.2 11.6-8.4-3.6 28.2z" fill="url(#tr-mvp-g)" />
    <path d="M11.6 43.6h40.8v7.6a2 2 0 0 1-2 2H13.6a2 2 0 0 1-2-2z" fill="url(#tr-mvp-d)" />
    <g fill="#7f5411" opacity="0.45">
      <circle cx="21" cy="47.4" r="2.1" />
      <circle cx="32" cy="47.4" r="2.4" />
      <circle cx="43" cy="47.4" r="2.1" />
    </g>
    <g fill="url(#tr-mvp-d)">
      <circle cx="9.8" cy="13.6" r="2.6" />
      <circle cx="54.2" cy="13.6" r="2.6" />
      <circle cx="32" cy="4.6" r="2.8" />
    </g>
    <path d="M13.6 19.6 15.6 34" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" opacity="0.4" />
  </>
);

/** Young Player: a comet — a star still climbing. */
const artYoungPlayer = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-yng-g" c={GOLD} />
      <Metal id="tr-yng-t" c={GOLD_DEEP} />
    </defs>
    <path d="M6.6 54.4c9.4-3 18.4-10.2 25.6-20.4l6.6 5.6c-8 9.6-19 15.4-32.2 16.6z" fill="url(#tr-yng-t)" opacity="0.85" />
    <path d="M14.4 48.6c6.4-3.2 12.4-8.2 17.6-14.8l2.6 2.2c-5.4 6.8-12.4 11.4-20.2 13.6z" fill="#fff" opacity="0.2" />
    <path d={starPath(38, 20, 15, 6.4)} fill="url(#tr-yng-g)" />
    <path d="M38 5 34.2 15.2 23.4 15.8z" fill="#fff" opacity="0.22" />
  </>
);

/** Goalkeeper of the Year: a glove sealed inside a shield. */
const artGoalkeeperOfYear = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-gky-s" c={SILVER} />
      <Metal id="tr-gky-g" c={GOLD} />
    </defs>
    <Shadow cy={57.6} rx={10} />
    <path d="M32 5.4 52.4 10.6v20.2c0 12.4-9.2 20.6-20.4 25.4C20.8 51.4 11.6 43.2 11.6 30.8V10.6z" fill="url(#tr-gky-s)" />
    <path d="M32 9 48.8 13.2v17.6c0 10.4-7.6 17.4-16.8 21.6-9.2-4.2-16.8-11.2-16.8-21.6V13.2z" fill="#1d2432" opacity="0.5" />
    <g fill="url(#tr-gky-g)">
      <rect x="24.6" y="21" width="4.2" height="10" rx="2.1" />
      <rect x="29.4" y="17.4" width="4.2" height="13.6" rx="2.1" />
      <rect x="34.2" y="19.6" width="4.2" height="11.4" rx="2.1" />
      <path d="M23.8 26.6c-3.2 0-5.2 2.2-5.2 5s1.8 4.6 4.4 5.2l2.6-3.4z" />
      <path d="M23.8 26.4h16.4v6.8c0 5.6-3.8 9.6-8.2 9.6s-8.2-4-8.2-9.6z" />
      <rect x="25" y="41.6" width="14" height="4.4" rx="1.8" />
    </g>
    <path d="M17 14.6v15" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" opacity="0.4" />
  </>
);

/** Goal of the Season: an acrobatic overhead kick inside a ring. */
const artPuskas = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-gol-g" c={GOLD} />
      <Metal id="tr-gol-d" c={GOLD_DEEP} />
    </defs>
    <circle cx="32" cy="32" r="26" fill="none" stroke="url(#tr-gol-g)" strokeWidth="4.2" />
    <circle cx="32" cy="32" r="21" fill="#1d2432" opacity="0.45" />
    <g fill="url(#tr-gol-d)">
      <circle cx="24.4" cy="42.4" r="3.4" />
      <path d="M26.6 38.2 33.4 28.4l4.4 3-6.8 9.8z" />
      <path d="M33.6 27.6 41.8 21l2.8 3.4-8.2 6.6z" />
      <path d="M35.4 33.6 45 36.4l-1 4.2-9.6-2.8z" />
      <circle cx="44.4" cy="17.6" r="4" />
    </g>
    <path d="M15.6 21a26 26 0 0 1 10.6-9" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
  </>
);

/** Team of the Year: eleven names on one plate. */
const artTeamOfYear = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-toy-g" c={GOLD} />
      <Metal id="tr-toy-d" c={GOLD_DEEP} />
    </defs>
    <Shadow cy={57.6} rx={13} />
    <rect x="7.4" y="9.4" width="49.2" height="45.2" rx="4.4" fill="url(#tr-toy-g)" />
    <rect x="11" y="13" width="42" height="38" rx="2.6" fill="#18202e" />
    <rect x="13.4" y="15.4" width="37.2" height="33.2" rx="1.8" fill="none" stroke="url(#tr-toy-d)" strokeWidth="1" opacity="0.55" />
    <path d="M13.4 27.4h37.2" stroke="url(#tr-toy-d)" strokeWidth="0.9" opacity="0.35" />
    <g fill="url(#tr-toy-g)">
      <circle cx="32" cy="45.4" r="2.3" />
      <circle cx="16.8" cy="39.4" r="2.3" />
      <circle cx="26.9" cy="39.4" r="2.3" />
      <circle cx="37.1" cy="39.4" r="2.3" />
      <circle cx="47.2" cy="39.4" r="2.3" />
      <circle cx="19.6" cy="31" r="2.3" />
      <circle cx="32" cy="31" r="2.3" />
      <circle cx="44.4" cy="31" r="2.3" />
      <circle cx="18.6" cy="21.4" r="2.3" />
      <circle cx="32" cy="20.2" r="2.3" />
      <circle cx="45.4" cy="21.4" r="2.3" />
    </g>
    <path d="M10.4 13.6v20" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.3" />
  </>
);

/** Player of the Tournament: a hanging pennant with a star. */
const artPlayerOfTournament = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-pot-g" c={GOLD} />
      <Metal id="tr-pot-s" c={SILVER} />
    </defs>
    <rect x="11" y="7.4" width="42" height="4" rx="2" fill="url(#tr-pot-s)" />
    <g stroke="#8ea0bb" strokeWidth="1.2" opacity="0.7">
      <path d="M19 11.4v3.4" />
      <path d="M45 11.4v3.4" />
    </g>
    <path d="M15.6 14.4h32.8v25.4L32 50.6 15.6 39.8z" fill="url(#tr-pot-g)" />
    <path d="M15.6 14.4h32.8v3.2H15.6z" fill="#fff" opacity="0.22" />
    <path d={starPath(32, 28.6, 9.4, 4)} fill="#7f5411" opacity="0.5" />
    <path d="M18.6 18.6v20" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.35" />
  </>
);

/** Top assists: the ball and the pass that made it. */
const artTopAssist = (): ReactElement => (
  <>
    <defs>
      <Metal id="tr-ast-g" c={GOLD} />
      <Metal id="tr-ast-b" c={GOLD_DEEP} />
    </defs>
    <Shadow cy={57.6} rx={12} />
    <path d="M14.4 44C13.4 27 23 12.6 38.6 8.6" fill="none" stroke="url(#tr-ast-g)" strokeWidth="3.6" strokeLinecap="round" />
    <path d="M36.6 3.6 49 9.4 38.4 17z" fill="url(#tr-ast-g)" />
    <circle cx="20.6" cy="43.4" r="11.4" fill="url(#tr-ast-b)" />
    <g fill="#5c3708" opacity="0.5">
      <path d="M20.6 36.8 25.6 40.4 23.7 46.2h-6.2L15.6 40.4z" />
      <path d="M20.6 53.6c-1.9 0-3.6-.4-5.1-1.1l1.7-3.2h6.8l1.7 3.2c-1.5.7-3.2 1.1-5.1 1.1z" />
      <path d="M9.6 47a11 11 0 0 1 .5-5.6l3.4 2.4-1 3.8z" />
      <path d="M31.6 47a11 11 0 0 0-.5-5.6l-3.4 2.4 1 3.8z" />
    </g>
    <path d="M13.6 37.4a11.4 11.4 0 0 1 5.6-3" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" opacity="0.45" />
  </>
);

/* ---------------------------------------------------------- registry ---- */

const ART: Record<TrophyId, () => ReactElement> = {
  "world-cup": artWorldCup,
  euro: artEuro,
  "copa-america": artCopaAmerica,
  "nations-league": artNationsLeague,
  "gold-cup": artGoldCup,
  "asian-cup": artAsianCup,
  afcon: artAfcon,
  "olympic-gold": artOlympicGold,

  "champions-league": artChampionsLeague,
  "europa-league": artEuropaLeague,
  "conference-league": artConferenceLeague,
  "super-cup-uefa": artUefaSuperCup,
  "club-world-cup": artClubWorldCup,
  libertadores: artLibertadores,
  sudamericana: artSudamericana,
  "concacaf-champions": artConcacafChampions,
  "afc-champions": artAfcChampions,

  "premier-league": artPremierLeague,
  "la-liga": artLaLiga,
  bundesliga: artBundesliga,
  "serie-a": artSerieA,
  "ligue-1": artLigue1,
  "league-shield": artLeagueShield,
  "league-trophy": artLeagueTrophy,

  "domestic-cup": artDomesticCup,
  "domestic-super-cup": artDomesticSuperCup,

  "ballon-dor": artBallonDor,
  "the-best": artTheBest,
  "golden-boot": artGoldenBoot,
  "golden-ball": artGoldenBall,
  "golden-glove": artGoldenGlove,
  "cl-top-scorer": artClTopScorer,
  "player-of-season": artPlayerOfSeason,
  "league-mvp": artLeagueMvp,
  "young-player": artYoungPlayer,
  "goalkeeper-of-year": artGoalkeeperOfYear,
  puskas: artPuskas,
  "team-of-year": artTeamOfYear,
  "player-of-tournament": artPlayerOfTournament,
  "top-assist": artTopAssist,
};

/* ------------------------------------------------------------ component - */

/**
 * Draw one trophy. `size` is the rendered square in px (defaults to 24, the
 * inline/cabinet size); `title` overrides the accessible name — pass the
 * Spanish label when the UI is in Spanish.
 */
export function TrophyArt({
  id, size = 24, title,
}: {
  id: TrophyId;
  size?: number;
  title?: string;
}): ReactElement {
  const info = TROPHY_META[id] ?? TROPHY_META["domestic-cup"];
  const draw = ART[id] ?? ART["domestic-cup"];
  const label = title ?? info.en;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      focusable="false"
      className="shrink-0"
      style={{ display: "block", overflow: "visible" }}
    >
      <title>{label}</title>
      {draw()}
    </svg>
  );
}

/* -------------------------------------------------------- honour lookup - */

/** Fold accents, punctuation and case away so lookups are forgiving. */
function normalise(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Ordered longest-intent-first, so "club world cup" never falls into
 * "world cup" and "champions league" never falls into "league".
 */
const HONOUR_RULES: ReadonlyArray<readonly [string, TrophyId]> = [
  ["club world cup", "club-world-cup"],
  ["mundial de clubes", "club-world-cup"],
  ["intercontinental", "club-world-cup"],
  ["world cup", "world-cup"],
  ["copa del mundo", "world-cup"],
  ["copa mundial", "world-cup"],
  ["mundial", "world-cup"],

  ["libertadores", "libertadores"],
  ["sudamericana", "sudamericana"],
  ["concacaf champions", "concacaf-champions"],
  ["gold cup", "gold-cup"],
  ["copa oro", "gold-cup"],
  ["concacaf", "gold-cup"],
  ["afc champions", "afc-champions"],
  ["asian cup", "asian-cup"],
  ["copa asiatica", "asian-cup"],
  ["africa cup of nations", "afcon"],
  ["african cup", "afcon"],
  ["copa africana", "afcon"],
  ["afcon", "afcon"],
  ["caf champions", "afcon"],
  ["nations league", "nations-league"],
  ["liga de naciones", "nations-league"],
  ["olympic", "olympic-gold"],
  ["olimpic", "olympic-gold"],

  ["uefa super cup", "super-cup-uefa"],
  ["european super cup", "super-cup-uefa"],
  ["supercopa de europa", "super-cup-uefa"],
  ["conference", "conference-league"],
  ["europa", "europa-league"],
  ["uel", "europa-league"],
  ["champions league", "champions-league"],
  ["liga de campeones", "champions-league"],
  ["european cup", "champions-league"],
  ["ucl", "champions-league"],
  ["european championship", "euro"],
  ["eurocopa", "euro"],
  ["euro", "euro"],
  ["copa america", "copa-america"],

  ["ballon", "ballon-dor"],
  ["balon de oro", "ballon-dor"],
  ["the best", "the-best"],
  ["golden ball", "golden-ball"],
  ["balon de oro del torneo", "golden-ball"],
  ["golden boot", "golden-boot"],
  ["bota de oro", "golden-boot"],
  ["pichichi", "golden-boot"],
  ["golden glove", "golden-glove"],
  ["guante de oro", "golden-glove"],
  ["goalkeeper of the", "goalkeeper-of-year"],
  ["portero del", "goalkeeper-of-year"],
  ["top scorer", "cl-top-scorer"],
  ["maximo goleador", "cl-top-scorer"],
  ["puskas", "puskas"],
  ["goal of the", "puskas"],
  ["gol de la", "puskas"],
  ["team of the", "team-of-year"],
  ["equipo del", "team-of-year"],
  ["young player", "young-player"],
  ["golden boy", "young-player"],
  ["jugador joven", "young-player"],
  ["mvp", "league-mvp"],
  ["most valuable", "league-mvp"],
  ["player of the tournament", "player-of-tournament"],
  ["jugador del torneo", "player-of-tournament"],
  ["player of the season", "player-of-season"],
  ["player of the year", "player-of-season"],
  ["jugador de la temporada", "player-of-season"],
  ["assist", "top-assist"],
  ["asistenc", "top-assist"],

  ["super cup", "domestic-super-cup"],
  ["supercup", "domestic-super-cup"],
  ["supercopa", "domestic-super-cup"],
  ["shield", "league-shield"],
  ["escudo", "league-shield"],
  ["league", "league-trophy"],
  ["liga", "league-trophy"],
  ["title", "league-trophy"],
  ["titulo", "league-trophy"],
  ["cup", "domestic-cup"],
  ["copa", "domestic-cup"],
];

/**
 * Map an engine honour string ("League", "Champions League", "Domestic Cup",
 * "Europa", …) onto a trophy. Unknown honours fall back to the domestic cup,
 * which is the safest generic piece of silverware to show.
 */
export function trophyIdFromHonour(honour: string): TrophyId {
  const key = normalise(honour);
  if (key.length === 0) return "domestic-cup";
  if (key in TROPHY_META) return key as TrophyId;
  const direct = key.replace(/ /g, "-");
  if (direct in TROPHY_META) return direct as TrophyId;
  for (const [needle, id] of HONOUR_RULES) {
    if (key.includes(needle)) return id;
  }
  return "domestic-cup";
}
