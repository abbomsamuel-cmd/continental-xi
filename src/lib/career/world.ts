import { ENG_ESP_LEAGUES } from "./clubs-eng-esp";
import { GER_ITA_FRA_LEAGUES } from "./clubs-ger-ita-fra";
import { EUROPE_LEAGUES } from "./clubs-europe";
import { AMERICAS_ROW_LEAGUES } from "./clubs-americas-row";
import { nationByName } from "./nations";
import type { WorldClub, WorldLeague } from "./world-types";

/**
 * The world, assembled. Every league the career can touch lives here, and this
 * is the only module the transfer engine queries — the region files are pure
 * data and never reach outside themselves.
 */
export const WORLD_LEAGUES: WorldLeague[] = [
  ...ENG_ESP_LEAGUES,
  ...GER_ITA_FRA_LEAGUES,
  ...EUROPE_LEAGUES,
  ...AMERICAS_ROW_LEAGUES,
];

export const ALL_WORLD_CLUBS: WorldClub[] = WORLD_LEAGUES.flatMap((l) => l.clubs);

const CLUB_BY_ID = new Map<string, WorldClub>(ALL_WORLD_CLUBS.map((c) => [c.id, c]));
const LEAGUE_BY_ID = new Map<string, WorldLeague>(WORLD_LEAGUES.map((l) => [l.id, l]));

export const worldClubById = (id: string): WorldClub | undefined => CLUB_BY_ID.get(id);
export const worldLeagueById = (id: string): WorldLeague | undefined => LEAGUE_BY_ID.get(id);

/** Reputation of a club id, with a sane default for legacy/unknown ids. */
export function reputationOf(clubId: string): number {
  return worldClubById(clubId)?.reputation ?? 62;
}

/** Every club playing in a given country. */
export function clubsInCountry(country: string): WorldClub[] {
  return ALL_WORLD_CLUBS.filter((c) => c.country === country);
}

/**
 * Where a teenager from `nationality` plausibly starts: a genuinely small club,
 * at home when that nation has a league here, otherwise a small club abroad —
 * which is exactly how young talents from smaller nations actually break in.
 * `rand` is injected so callers can keep it deterministic.
 */
export function startingClubsFor(nationality: string, maxReputation = 58): WorldClub[] {
  // A teenager breaks through at a small club AT HOME whenever his nation has a
  // league here — the smallest sides in it, even if the league itself is strong
  // (so a Brazilian starts in Brazil, not abroad).
  const home = clubsInCountry(nationality);
  if (home.length) {
    const minRep = Math.min(...home.map((c) => c.reputation));
    const small = home.filter((c) => c.reputation <= Math.max(maxReputation, minRep + 8));
    return small.length ? small : home;
  }

  // No home league — the nation's football affinities, then a small club abroad,
  // exactly as a young talent from a smaller nation actually moves.
  const affinity = nationByName(nationality)?.affinity ?? [];
  const affine = affinity
    .flatMap((id) => worldLeagueById(id)?.clubs ?? [])
    .filter((c) => c.reputation <= maxReputation);
  if (affine.length) return affine;

  return ALL_WORLD_CLUBS.filter((c) => c.reputation <= maxReputation);
}

/**
 * The believability gate for transfer interest. A club only looks at a player
 * whose level sits inside the band it actually shops in — this is what stops a
 * 70-rated 30-year-old from hearing about Barcelona.
 *
 * `pull` widens the band upward for a player who has forced the issue (a
 * standout season, a transfer request, an expiring contract).
 */
export function clubsInReputationBand(playerLevel: number, pull = 0): WorldClub[] {
  const ceiling = playerLevel + 8 + pull * 6;
  const floor = playerLevel - 22;
  return ALL_WORLD_CLUBS.filter((c) => c.reputation <= ceiling && c.reputation >= floor);
}

/**
 * Translate a player into the 0–100 reputation scale clubs are measured on, so
 * the two sides of a transfer can be compared directly. Overall dominates;
 * youth with a high ceiling and genuine form add real pull.
 */
export function playerLevel(opts: {
  overall: number;
  age: number;
  ceiling: number;
  avgRating: number;
  reputationIndex: number; // 0–8 along the career reputation ladder
}): number {
  const { overall, age, ceiling, avgRating, reputationIndex } = opts;
  const potentialBonus = age <= 23 ? Math.max(0, ceiling - overall) * 0.35 : 0;
  const formBonus = (avgRating - 6.8) * 6;
  const fameBonus = reputationIndex * 1.6;
  const ageDrag = age >= 31 ? (age - 30) * 2.4 : 0;
  return Math.max(30, Math.min(100, overall + potentialBonus + formBonus + fameBonus - ageDrag));
}

/** Total clubs/leagues — used by the dev balance harness and stats surfaces. */
export const WORLD_SIZE = { leagues: WORLD_LEAGUES.length, clubs: ALL_WORLD_CLUBS.length };
