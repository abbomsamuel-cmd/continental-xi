/* ------------------------------------------------------------------ */
/*  Legacy — how a career ends, and what it was worth.                  */
/*                                                                     */
/*  Two jobs live here and nowhere else:                                */
/*                                                                     */
/*    1. RETIREMENT. When does a player stop, and what is actually on   */
/*       the table when he does? A 38-year-old rated 74 is not fielding */
/*       a five-year offer from an elite club — he is choosing between  */
/*       a step down, a one-year renewal, a move home, MLS or Saudi.    */
/*       That shortlist is produced by construction, not by filtering:  */
/*       this module can only ever emit those six kinds of ending.      */
/*                                                                     */
/*    2. THE LEGACY CARD. Everything the end-of-career card renders —   */
/*       the records, the score, the title, and the per-factor working  */
/*       behind the score, so the card can show WHY it landed where it  */
/*       did instead of asserting a number.                             */
/*                                                                     */
/*  Pure module: deterministic, no state, no I/O. Randomness is always  */
/*  injected as `rng`, so a retirement screen can be replayed exactly.  */
/* ------------------------------------------------------------------ */

import { potentialCeiling } from "./develop";
import { computeMarketValue } from "./engine";
import type { CareerPlayer, CareerSeason, ReputationTier } from "./types";
import { careerTotals, groupSeasons } from "./util";
import { ALL_WORLD_CLUBS, clubsInCountry, reputationOf, worldClubById } from "./world";

/* ================================================================== */
/*  small shared helpers                                               */
/* ================================================================== */

const clamp = (v: number, lo: number, hi: number): number =>
  Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo;

/** One decimal — breakdown rows must add up to the score the card shows. */
const round1 = (v: number): number => Math.round(v * 10) / 10;

function pick<T>(arr: readonly T[], rng: () => number): T | null {
  if (!arr.length) return null;
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

const REP_ORDER: readonly ReputationTier[] = [
  "unknown", "prospect", "wonderkid", "promising",
  "established", "star", "superstar", "worldClass", "legend",
];
const repIndex = (r: ReputationTier): number => Math.max(0, REP_ORDER.indexOf(r));

/**
 * A season row does not store the reputation the player carried at the time, so
 * the retrospective value curve reads it back off the overall he finished on.
 * Approximate on purpose — it only feeds "peak market value", never live money.
 */
function repFromOverall(overall: number): ReputationTier {
  if (overall >= 88) return "legend";
  if (overall >= 85) return "worldClass";
  if (overall >= 82) return "superstar";
  if (overall >= 78) return "star";
  if (overall >= 72) return "established";
  if (overall >= 66) return "promising";
  if (overall >= 60) return "prospect";
  return "unknown";
}

/**
 * Wages are not persisted per season either, so career earnings are rebuilt
 * from what the club could pay and how far above its XI the player sat — the
 * same shape the transfer engine uses to price an offer. An estimate, and
 * labelled as one wherever it is shown.
 */
function estimatedWeeklyWage(s: CareerSeason): number {
  const club = worldClubById(s.clubId);
  const capacity = club?.wageCapacity ?? 6_000;
  const squadQuality = club?.squadQuality ?? 68;
  const gap = s.overall - squadQuality;
  const share = clamp(0.12 + (gap + 8) * 0.035, 0.05, 0.7);
  return Math.max(500, capacity * share);
}

/* ================================================================== */
/*  CAREER RECORDS                                                     */
/* ================================================================== */

/** One honour, with how many times it was won. EN/ES for the card. */
export interface TrophyCount {
  name: string;
  count: number;
  nameEn: string;
  nameEs: string;
}

export interface CareerRecords {
  peakOverall: number;
  peakOverallAge: number;
  peakMarketValue: number;
  bestSeason: { year: number; goals: number; assists: number; apps: number; clubName: string } | null;
  mostGoalsSeason: number;
  mostAssistsSeason: number;
  longestStay: { clubName: string; seasons: number } | null;
  totalApps: number;
  totalGoals: number;
  totalAssists: number;
  seasonsPlayed: number;
  clubsRepresented: number;
  careerEarnings: number;
  trophies: TrophyCount[];
  totalTrophies: number;
}

/** The honours the season engine emits, translated once, here. */
const TROPHY_LABELS: Record<string, [en: string, es: string]> = {
  "League": ["League Title", "Título de Liga"],
  "Champions League": ["Champions League", "Liga de Campeones"],
  "Europa": ["Europa League", "Europa League"],
  "Domestic Cup": ["Domestic Cup", "Copa Nacional"],
};

/** How much a trophy is worth when weighing a legacy. */
const TROPHY_WEIGHT: Record<string, number> = {
  "Champions League": 4,
  "League": 3,
  "Europa": 1.5,
  "Domestic Cup": 1,
};
const trophyWeight = (name: string): number => TROPHY_WEIGHT[name] ?? 1;

/**
 * Everything quantifiable about a finished (or in-progress) career, read back
 * off the résumé. Deterministic: the same player always yields the same card.
 */
export function careerRecords(player: CareerPlayer): CareerRecords {
  const seasons = player.seasons;
  const totals = careerTotals(player);
  const ceiling = potentialCeiling(player);

  // ---- peak ability, and when it was first reached ----
  const peakOverall = Math.max(player.peakOverall, player.overall, totals.peakOverall);
  let peakOverallAge = player.age;
  for (const s of seasons) {
    if (s.overall === peakOverall) {
      peakOverallAge = s.age;
      break;
    }
  }

  // ---- peak value, revalued season by season with the live value model ----
  let peakMarketValue = player.marketValue;
  for (const s of seasons) {
    const v = computeMarketValue(s.overall, ceiling, s.age, repFromOverall(s.overall), 7.0);
    if (v > peakMarketValue) peakMarketValue = v;
  }

  // ---- the standout campaign ----
  let bestSeason: CareerRecords["bestSeason"] = null;
  let bestScore = -Infinity;
  let mostGoalsSeason = 0;
  let mostAssistsSeason = 0;
  for (const s of seasons) {
    if (s.goals > mostGoalsSeason) mostGoalsSeason = s.goals;
    if (s.assists > mostAssistsSeason) mostAssistsSeason = s.assists;
    const score =
      s.goals + s.assists * 0.7 + s.apps * 0.06 + s.honours.reduce((n, h) => n + trophyWeight(h) * 2, 0);
    if (score > bestScore) {
      bestScore = score;
      bestSeason = { year: s.year, goals: s.goals, assists: s.assists, apps: s.apps, clubName: s.clubName };
    }
  }

  // ---- the longest unbroken spell at one club ----
  let longestStay: CareerRecords["longestStay"] = null;
  for (const spell of groupSeasons(seasons)) {
    if (!longestStay || spell.seasons.length > longestStay.seasons) {
      longestStay = { clubName: spell.clubName, seasons: spell.seasons.length };
    }
  }

  // ---- honours, counted ----
  const counts = new Map<string, number>();
  for (const s of seasons) for (const h of s.honours) counts.set(h, (counts.get(h) ?? 0) + 1);
  const trophies: TrophyCount[] = [...counts]
    .map(([name, count]) => {
      const label = TROPHY_LABELS[name];
      return { name, count, nameEn: label?.[0] ?? name, nameEs: label?.[1] ?? name };
    })
    .sort((a, b) => b.count - a.count || trophyWeight(b.name) - trophyWeight(a.name) || a.name.localeCompare(b.name));
  const totalTrophies = trophies.reduce((n, t) => n + t.count, 0);

  // ---- money ----
  const earnings = seasons.reduce((n, s) => n + estimatedWeeklyWage(s) * 52, 0);
  const careerEarnings = Math.round(earnings / 100_000) * 100_000;

  return {
    peakOverall,
    peakOverallAge,
    peakMarketValue,
    bestSeason,
    mostGoalsSeason,
    mostAssistsSeason,
    longestStay,
    totalApps: totals.apps,
    totalGoals: totals.goals,
    totalAssists: totals.assists,
    seasonsPlayed: totals.seasons,
    // A career with no seasons played still has one shirt hanging in a locker.
    clubsRepresented: seasons.length ? totals.clubs : 1,
    careerEarnings,
    trophies,
    totalTrophies,
  };
}

/* ================================================================== */
/*  LEGACY SCORE                                                       */
/* ================================================================== */

export type LegacyTier =
  | "graduate" | "professional" | "clubHero" | "nationalHero" | "elite"
  | "worldClass" | "legend" | "goatCandidate" | "goat";

/** Bottom → top. Exported so the card can render the ladder with a marker. */
export const LEGACY_TIERS: readonly LegacyTier[] = [
  "graduate", "professional", "clubHero", "nationalHero", "elite",
  "worldClass", "legend", "goatCandidate", "goat",
];

export const LEGACY_TITLES: Record<LegacyTier, { en: string; es: string }> = {
  graduate: { en: "Academy Graduate", es: "Canterano" },
  professional: { en: "Reliable Professional", es: "Profesional Fiable" },
  clubHero: { en: "Club Hero", es: "Héroe del Club" },
  nationalHero: { en: "National Hero", es: "Héroe Nacional" },
  elite: { en: "Elite Footballer", es: "Futbolista de Élite" },
  worldClass: { en: "World Class", es: "Clase Mundial" },
  legend: { en: "Football Legend", es: "Leyenda del Fútbol" },
  goatCandidate: { en: "GOAT Candidate", es: "Candidato al Mejor de la Historia" },
  goat: { en: "Greatest of All Time", es: "El Mejor de la Historia" },
};

/** Score → tier. Every threshold has to be earned by more than one factor. */
const TIER_FLOOR: readonly { tier: LegacyTier; min: number }[] = [
  { tier: "goat", min: 95 },
  { tier: "goatCandidate", min: 88 },
  { tier: "legend", min: 78 },
  { tier: "worldClass", min: 67 },
  { tier: "elite", min: 56 },
  { tier: "nationalHero", min: 45 },
  { tier: "clubHero", min: 33 },
  { tier: "professional", min: 20 },
  { tier: "graduate", min: 0 },
];

export function legacyTierFromScore(score: number): LegacyTier {
  const s = clamp(score, 0, 100);
  for (const row of TIER_FLOOR) if (s >= row.min) return row.tier;
  return "graduate";
}

export interface LegacyFactor {
  labelEn: string;
  labelEs: string;
  points: number;
  max: number;
}

export interface LegacyResult {
  /** 0–100. */
  score: number;
  titleEn: string;
  titleEs: string;
  tier: LegacyTier;
  breakdown: LegacyFactor[];
}

/**
 * The ten things a career is judged on. The maxima sum to exactly 100 so the
 * breakdown the card prints is the score, not a parallel invention.
 *
 *   Trophies 20 · Peak Ability 14 · International 13 · Goals 11 · Club Success 10
 *   Individual Awards 8 · Longevity 7 · Reputation 7 · Assists 5 · Consistency 5
 */
const MAX = {
  trophies: 20,
  peak: 14,
  international: 13,
  goals: 11,
  club: 10,
  awards: 8,
  longevity: 7,
  reputation: 7,
  assists: 5,
  consistency: 5,
} as const;

export function legacyScore(
  player: CareerPlayer,
  records: CareerRecords,
  intlCaps: number,
  intlGoals: number,
): LegacyResult {
  const seasons = player.seasons;
  const caps = Math.max(0, Math.round(intlCaps));
  const intlG = Math.max(0, Math.round(intlGoals));

  // ---- trophies: a European Cup is not a domestic cup ----
  const weighted = seasons.reduce(
    (n, s) => n + s.honours.reduce((m, h) => m + trophyWeight(h), 0),
    0,
  );
  const pTrophies = clamp(weighted * 0.8, 0, MAX.trophies);

  // ---- peak ability: 62 is a professional floor, 94 is the ceiling of the game
  const pPeak = clamp(((records.peakOverall - 62) / 32) * MAX.peak, 0, MAX.peak);

  // ---- international career ----
  const pIntl = clamp(caps * 0.07, 0, 8) + clamp(intlG * 0.12, 0, 5);

  // ---- output ----
  const pGoals = clamp(records.totalGoals * 0.03, 0, MAX.goals);
  const pAssists = clamp(records.totalAssists * 0.028, 0, MAX.assists);

  // ---- club success: the stature of the shirts actually worn ----
  const bestRep = seasons.reduce(
    (n, s) => Math.max(n, reputationOf(s.clubId)),
    reputationOf(player.currentClubId),
  );
  const eliteSeasons = seasons.filter((s) => reputationOf(s.clubId) >= 82).length;
  const pClub = clamp((bestRep - 60) / 4, 0, 6) + clamp(eliteSeasons * 0.4, 0, 4);

  // ---- individual awards: inferred, since the sim does not name a Ballon d'Or.
  // A standout year is a huge attacking return OR a genuinely elite level held.
  const standout = seasons.filter(
    (s) => s.goals + s.assists * 0.75 >= 20 || s.overall >= 86,
  ).length;
  const peakBonus = records.peakOverall >= 90 ? 2 : records.peakOverall >= 87 ? 1 : 0;
  const pAwards = clamp(standout * 1.2 + peakBonus, 0, MAX.awards);

  // ---- longevity ----
  const pLongevity = clamp(records.seasonsPlayed * 0.42, 0, MAX.longevity);

  // ---- reputation ----
  const pReputation = clamp((repIndex(player.reputation) / 8) * MAX.reputation, 0, MAX.reputation);

  // ---- consistency: did he actually play, year after year? ----
  const avgApps = records.seasonsPlayed ? records.totalApps / records.seasonsPlayed : 0;
  const reliable = seasons.filter((s) => s.apps >= 28).length;
  const reliableRatio = records.seasonsPlayed ? reliable / records.seasonsPlayed : 0;
  const pConsistency = clamp(avgApps / 38, 0, 1) * 3 + reliableRatio * 2;

  const breakdown: LegacyFactor[] = [
    { labelEn: "Trophies", labelEs: "Títulos", points: round1(pTrophies), max: MAX.trophies },
    { labelEn: "Peak Ability", labelEs: "Máximo Nivel", points: round1(pPeak), max: MAX.peak },
    { labelEn: "International Career", labelEs: "Carrera Internacional", points: round1(pIntl), max: MAX.international },
    { labelEn: "Goals", labelEs: "Goles", points: round1(pGoals), max: MAX.goals },
    { labelEn: "Club Success", labelEs: "Éxito en el Club", points: round1(pClub), max: MAX.club },
    { labelEn: "Individual Awards", labelEs: "Premios Individuales", points: round1(pAwards), max: MAX.awards },
    { labelEn: "Longevity", labelEs: "Longevidad", points: round1(pLongevity), max: MAX.longevity },
    { labelEn: "Reputation", labelEs: "Reputación", points: round1(pReputation), max: MAX.reputation },
    { labelEn: "Assists", labelEs: "Asistencias", points: round1(pAssists), max: MAX.assists },
    { labelEn: "Consistency", labelEs: "Regularidad", points: round1(pConsistency), max: MAX.consistency },
  ];

  const score = clamp(Math.round(breakdown.reduce((n, f) => n + f.points, 0)), 0, 100);
  const tier = legacyTierFromScore(score);

  return {
    score,
    titleEn: LEGACY_TITLES[tier].en,
    titleEs: LEGACY_TITLES[tier].es,
    tier,
    breakdown,
  };
}

/* ================================================================== */
/*  RETIREMENT                                                         */
/* ================================================================== */

export type RetirementKind =
  | "smallClub" | "renewal" | "homecoming" | "mls" | "saudi" | "retire";

export interface RetirementOffer {
  kind: RetirementKind;
  labelEn: string;
  labelEs: string;
  descEn: string;
  descEs: string;
  /** Length of the deal in years. Always short — this is the last chapter. */
  years?: number;
  clubId?: string;
  clubName?: string;
}

/** The base odds a career ends this year, before ability and injuries speak. */
const AGE_BASE: readonly [age: number, p: number][] = [
  [30, 0.005], [31, 0.01], [32, 0.03], [33, 0.06], [34, 0.12],
  [35, 0.22], [36, 0.36], [37, 0.52], [38, 0.7], [39, 0.85], [40, 0.93],
];
function baseRetirementOdds(age: number): number {
  if (age <= 29) return 0.002;
  for (const [a, p] of AGE_BASE) if (age === a) return p;
  return 0.96;
}

/**
 * The probability a player hangs up his boots at the end of this chapter.
 *
 * Age dominates and climbs steeply from 34; a body that keeps breaking down
 * pulls the date forward; genuine quality pushes it back — elite players play
 * on because someone always wants them.
 *
 * @param age            age at the end of the chapter just played.
 * @param overall        current overall rating.
 * @param ovrDelta       overall change vs the previous chapter (negative = decline).
 * @param injuryBurden   0 = never injured … 1 = chronically broken down.
 */
export function retirementProbability(
  age: number,
  overall: number,
  ovrDelta: number,
  injuryBurden: number,
): number {
  const a = clamp(Math.round(age), 14, 46);
  const ovr = clamp(Math.round(overall), 1, 99);
  const delta = Number.isFinite(ovrDelta) ? ovrDelta : 0;
  const burden = clamp(injuryBurden, 0, 1);

  if (a >= 41) return 1;

  let p = baseRetirementOdds(a);

  // A career that is falling away ends sooner, and the fall matters far more
  // once the player is past the veteran line — a 28-year-old who has a bad two
  // years gets dropped, not retired.
  p += Math.max(0, -delta) * (a >= 32 ? 0.06 : 0.01);

  // Nobody keeps a shirt warm for a 63-rated 36-year-old.
  if (ovr < 70) p += (70 - ovr) * (a >= 32 ? 0.018 : 0.004);

  // Quality buys time.
  if (ovr >= 84) p -= 0.1;
  else if (ovr >= 78) p -= 0.05;

  // Injuries are the single most common reason a good player stops early.
  p += burden * (a >= 31 ? 0.3 : 0.08);

  return clamp(p, 0, 0.98);
}

/** Convenience: roll the retirement decision with an injected rng. */
export function shouldRetire(
  age: number,
  overall: number,
  ovrDelta: number,
  injuryBurden: number,
  rng: () => number,
): boolean {
  return rng() < retirementProbability(age, overall, ovrDelta, injuryBurden);
}

const MLS_LEAGUE_ID = "usa-mls";
const SAUDI_LEAGUE_ID = "sau-pl";

/** A believable step down: smaller than where he is, but still a football club. */
function smallClubFor(player: CareerPlayer, rng: () => number) {
  const target = clamp(player.overall - 14, 38, 70);
  const inBand = ALL_WORLD_CLUBS.filter(
    (c) => c.id !== player.currentClubId && c.reputation <= target && c.reputation >= target - 14,
  );
  const near = inBand.filter(
    (c) => c.country === player.currentClubCountry || c.country === player.nationality,
  );
  return pick(near.length ? near : inBand, rng);
}

function homeClubFor(player: CareerPlayer, rng: () => number) {
  const boyhood = player.boyhoodClubId ? worldClubById(player.boyhoodClubId) : undefined;
  if (boyhood && boyhood.id !== player.currentClubId) return boyhood;
  const home = clubsInCountry(player.nationality).filter((c) => c.id !== player.currentClubId);
  return pick(home, rng);
}

function leagueClubFor(leagueId: string, player: CareerPlayer, rng: () => number) {
  const clubs = ALL_WORLD_CLUBS.filter((c) => c.leagueId === leagueId && c.id !== player.currentClubId);
  return pick(clubs, rng);
}

/**
 * What is actually on the table at the end of a career.
 *
 * By construction this can only ever return a step down, a one-year renewal, a
 * move home, MLS, Saudi Arabia, or retirement — the elite five-year contract
 * does not exist in this function, so no tuning accident can produce one.
 * `retire` is always present and always last.
 */
export function retirementOptions(player: CareerPlayer, rng: () => number): RetirementOffer[] {
  const age = player.age;
  const ovr = player.overall;
  const rep = repIndex(player.reputation);
  const out: RetirementOffer[] = [];

  // ---- one more year where he already is ----
  if (ovr >= 58) {
    out.push({
      kind: "renewal",
      labelEn: "One More Year",
      labelEs: "Un Año Más",
      descEn: `${player.currentClubName} offer a one-year extension — a farewell season in familiar colours.`,
      descEs: `${player.currentClubName} ofrece una prórroga de un año — una temporada de despedida con los colores de siempre.`,
      years: 1,
      clubId: player.currentClubId,
      clubName: player.currentClubName,
    });
  }

  // ---- a step down, where he still starts every week ----
  const small = smallClubFor(player, rng);
  if (small && ovr >= 50) {
    out.push({
      kind: "smallClub",
      labelEn: "Drop a Level",
      labelEs: "Bajar de Nivel",
      descEn: `${small.name} want a senior head in the dressing room and a guaranteed starting place.`,
      descEs: `${small.name} quiere un veterano en el vestuario y te garantiza la titularidad.`,
      years: age >= 36 ? 1 : 2,
      clubId: small.id,
      clubName: small.name,
    });
  }

  // ---- home ----
  const home = homeClubFor(player, rng);
  if (home && age >= 29) {
    const boyhood = home.id === player.boyhoodClubId;
    out.push({
      kind: "homecoming",
      labelEn: boyhood ? "Go Back Home" : "Return to Your Country",
      labelEs: boyhood ? "Volver a Casa" : "Volver a Tu País",
      descEn: boyhood
        ? `${home.name} want to close the circle where it began.`
        : `${home.name} offer a move back to ${home.country} for the final chapter.`,
      descEs: boyhood
        ? `${home.name} quiere cerrar el círculo donde todo empezó.`
        : `${home.name} te ofrece volver a ${home.country} para el último capítulo.`,
      years: 1,
      clubId: home.id,
      clubName: home.name,
    });
  }

  // ---- MLS ----
  const mls = leagueClubFor(MLS_LEAGUE_ID, player, rng);
  if (mls && age >= 28 && (ovr >= 68 || rep >= 4)) {
    out.push({
      kind: "mls",
      labelEn: "Move to MLS",
      labelEs: "Fichar por la MLS",
      descEn: `${mls.name} offer a designated-player deal — a new league, a softer schedule, a life change.`,
      descEs: `${mls.name} ofrece un contrato de jugador franquicia — otra liga, menos desgaste, un cambio de vida.`,
      years: 2,
      clubId: mls.id,
      clubName: mls.name,
    });
  }

  // ---- Saudi ----
  const saudi = leagueClubFor(SAUDI_LEAGUE_ID, player, rng);
  if (saudi && age >= 28 && (ovr >= 72 || rep >= 5)) {
    out.push({
      kind: "saudi",
      labelEn: "Take the Saudi Offer",
      labelEs: "Aceptar la Oferta Saudí",
      descEn: `${saudi.name} put an enormous salary on the table for the last years of your career.`,
      descEs: `${saudi.name} pone un salario enorme sobre la mesa para los últimos años de tu carrera.`,
      years: age >= 36 ? 1 : 2,
      clubId: saudi.id,
      clubName: saudi.name,
    });
  }

  // "One more year where you already are" is the emotional anchor of this
  // screen, so it is pinned first when it exists; the rest are jittered so two
  // careers ending at 36 don't read as the same list. Five routes is the cap.
  const renewal = out.filter((o) => o.kind === "renewal");
  const rest = out
    .filter((o) => o.kind !== "renewal")
    .map((o, i) => ({ o, k: i + rng() * 2.2 }))
    .sort((a, b) => a.k - b.k)
    .map(({ o }) => o);
  const ordered = [...renewal, ...rest].slice(0, 5);

  ordered.push({
    kind: "retire",
    labelEn: "Retire",
    labelEs: "Retirarse",
    descEn: "Hang up your boots and let the record stand.",
    descEs: "Colgar las botas y dejar que hable el palmarés.",
  });

  return ordered;
}
