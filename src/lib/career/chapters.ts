import { buildPlan, finalizeSeason, roleFromTrust, type SeasonBeat } from "./engine";
import { clubById } from "./data";
import { careerStatus, type CareerStatus } from "./status";
import { worldClubById, worldLeagueById } from "./world";
import type { AttrDelta, CareerPlayer, CareerSeason, SeasonResult, TransferOffer } from "./types";

/**
 * Careers advance in AGE CHAPTERS, not seasons. Two years pass per jump, both
 * seasons are simulated properly, and the player sees one summary — which is
 * what keeps a whole career inside the 5-10 minute budget instead of grinding
 * through twenty near-identical season screens.
 */
export const YEARS_PER_CHAPTER = 2;

/** A chapter's worth of football, aggregated for the summary card. */
export interface ChapterResult {
  fromAge: number;
  toAge: number;
  fromYear: number;
  toYear: number;

  /** The seasons actually played inside the jump (usually two). */
  seasons: CareerSeason[];
  /** Narrative beats from both seasons, in order, for the streaming feed. */
  beats: SeasonBeat[];

  apps: number;
  goals: number;
  assists: number;
  avgRating: number;

  overallFrom: number;
  overallTo: number;
  marketValueFrom: number;
  marketValueTo: number;
  attrDeltas: AttrDelta[];

  honours: string[];
  media: string[];
  traitUnlocks: string[];
  objectives: { text: string; met: boolean }[];

  /** The single most significant thing that happened — the chapter's headline. */
  keyEventEn: string;
  keyEventEs: string;

  status: CareerStatus;
  offers: TransferOffer[];
  contractExpiring: boolean;
  national: CareerPlayer["national"];

  /** Player state after the chapter, ready to persist. */
  playerAfter: CareerPlayer;
}

/**
 * Advance a player by one played season. This is the pure half of the store's
 * commitSeason — extracted so a chapter can chain seasons without touching
 * persisted state, and so both paths can never drift apart.
 */
export function applySeason(p: CareerPlayer, r: SeasonResult): CareerPlayer {
  return {
    ...p,
    overall: r.overallTo,
    peakOverall: Math.max(p.peakOverall, r.overallTo),
    form: r.form,
    trust: r.trust,
    role: roleFromTrust(r.trust),
    reputation: r.reputation,
    marketValue: r.marketValueTo,
    age: p.age + 1,
    currentYear: p.currentYear + 1,
    seasonsAtClub: r.seasonsAtClub,
    national: r.national,
    traits: [...p.traits, ...r.traitUnlocks.filter((t) => !p.traits.includes(t))],
    position: r.positionChange ?? p.position,
    seasons: [...p.seasons, r.season],
  };
}

/** Pick the line that best describes a two-year stretch. */
function headline(
  seasons: CareerSeason[], overallFrom: number, overallTo: number, goals: number, honours: string[],
): { en: string; es: string } {
  const grew = overallTo - overallFrom;
  const clubs = new Set(seasons.map((s) => s.clubId));
  if (honours.includes("Champions League")) return { en: "Champions of Europe.", es: "Campeón de Europa." };
  if (honours.includes("League")) return { en: "Won the league title.", es: "Ganó el título de liga." };
  if (grew >= 8) return { en: "A breakout two years — you took off.", es: "Dos años de explosión — despegaste." };
  if (clubs.size > 1) return { en: "A move that reshaped your career.", es: "Un traspaso que cambió tu carrera." };
  if (goals >= 40) return { en: "Ruthless in front of goal.", es: "Implacable de cara al gol." };
  if (grew <= -4) return { en: "The decline began to show.", es: "El declive empezó a notarse." };
  if (grew >= 3) return { en: "Steady, visible progress.", es: "Progreso constante y visible." };
  return { en: "Two years of honest work.", es: "Dos años de trabajo honrado." };
}

/**
 * Simulate one age chapter. `decisions` maps a career-moment id to the chosen
 * choice id and applies to every season inside the jump; anything not chosen is
 * auto-resolved with the moment's first option so the chapter never stalls.
 */
export function simulateChapter(
  player: CareerPlayer,
  decisions: Record<string, string> = {},
  years = YEARS_PER_CHAPTER,
): ChapterResult {
  const fromAge = player.age;
  const fromYear = player.currentYear;
  const marketValueFrom = player.marketValue;
  const overallFrom = player.overall;

  let cur = player;
  const played: CareerSeason[] = [];
  const beats: SeasonBeat[] = [];
  const honours: string[] = [];
  const media: string[] = [];
  const traitUnlocks: string[] = [];
  const attrTotals = new Map<string, number>();
  let ratingSum = 0;
  let last: SeasonResult | null = null;

  for (let i = 0; i < years; i++) {
    const plan = buildPlan(cur);
    const result = finalizeSeason(cur, plan, decisions);
    beats.push(...plan.beats.filter((b) => b.kind !== "final"));
    played.push(result.season);
    honours.push(...result.season.honours);
    media.push(...result.media);
    traitUnlocks.push(...result.traitUnlocks.filter((t) => !traitUnlocks.includes(t)));
    for (const d of result.attrDeltas) attrTotals.set(d.label, (attrTotals.get(d.label) ?? 0) + d.delta);
    ratingSum += result.avgRating;
    last = result;
    cur = applySeason(cur, result);
  }

  const r = last!;
  const apps = played.reduce((n, s) => n + s.apps, 0);
  const goals = played.reduce((n, s) => n + s.goals, 0);
  const assists = played.reduce((n, s) => n + s.assists, 0);
  const avgRating = Math.round((ratingSum / Math.max(1, played.length)) * 10) / 10;
  const key = headline(played, overallFrom, cur.overall, goals, honours);

  return {
    fromAge,
    toAge: cur.age,
    fromYear,
    toYear: cur.currentYear,
    seasons: played,
    beats,
    apps,
    goals,
    assists,
    avgRating,
    overallFrom,
    overallTo: cur.overall,
    marketValueFrom,
    marketValueTo: cur.marketValue,
    attrDeltas: [...attrTotals].map(([label, delta]) => ({ label, delta })),
    honours,
    media,
    traitUnlocks,
    objectives: r.objectives,
    keyEventEn: key.en,
    keyEventEs: key.es,
    status: careerStatus(cur.age, cur.overall, cur.overall - overallFrom, {
      retired: cur.retired,
      peakOverall: cur.peakOverall,
    }),
    offers: r.offers,
    contractExpiring: r.contractExpiring,
    national: cur.national,
    playerAfter: cur,
  };
}

/* ---------------- timeline grouping ---------------- */

/** One row of the career timeline — a two-year chapter, not a season. */
export interface TimelineChapter {
  fromAge: number;
  toAge: number;
  label: string; // "24 → 26"
  yearLabel: string; // "2034–36"
  seasons: CareerSeason[];
  clubId: string;
  clubName: string;
  clubShort: string;
  clubColors: [string, string];
  clubCountry: string;
  leagueName: string;
  overallFrom: number;
  overallTo: number;
  apps: number;
  goals: number;
  assists: number;
  honours: string[];
  /** True when the player changed club during or entering this chapter. */
  transferred: boolean;
}

/**
 * Group persisted seasons into age chapters for the timeline. Deriving this
 * rather than persisting it means existing saves render correctly with no
 * migration, and a career of any length collapses to ~11 readable rows.
 */
export function groupIntoChapters(seasons: CareerSeason[], startAge: number): TimelineChapter[] {
  if (!seasons.length) return [];
  const out: TimelineChapter[] = [];
  const base = startAge - (startAge % YEARS_PER_CHAPTER === 0 ? 0 : startAge % YEARS_PER_CHAPTER);

  const buckets = new Map<number, CareerSeason[]>();
  for (const s of seasons) {
    const slot = base + Math.floor((s.age - base) / YEARS_PER_CHAPTER) * YEARS_PER_CHAPTER;
    const list = buckets.get(slot) ?? [];
    list.push(s);
    buckets.set(slot, list);
  }

  let prevClub: string | null = null;
  for (const slot of [...buckets.keys()].sort((a, b) => a - b)) {
    const group = buckets.get(slot)!;
    const lastSeason = group[group.length - 1];
    const club = worldClubById(lastSeason.clubId) ?? clubById(lastSeason.clubId);
    const leagueName = club ? (worldLeagueById(club.leagueId)?.name ?? "") : "";
    const transferred = prevClub !== null && group.some((s) => s.clubId !== prevClub);
    prevClub = lastSeason.clubId;

    out.push({
      fromAge: slot,
      toAge: slot + YEARS_PER_CHAPTER,
      label: `${slot} → ${slot + YEARS_PER_CHAPTER}`,
      yearLabel: `${group[0].year}–${String((lastSeason.year + 1) % 100).padStart(2, "0")}`,
      seasons: group,
      clubId: lastSeason.clubId,
      clubName: lastSeason.clubName,
      clubShort: lastSeason.clubShort,
      clubColors: lastSeason.clubColors,
      clubCountry: lastSeason.clubCountry,
      leagueName,
      overallFrom: group[0].overall,
      overallTo: lastSeason.overall,
      apps: group.reduce((n, s) => n + s.apps, 0),
      goals: group.reduce((n, s) => n + s.goals, 0),
      assists: group.reduce((n, s) => n + s.assists, 0),
      honours: group.flatMap((s) => s.honours),
      transferred,
    });
  }
  return out;
}
