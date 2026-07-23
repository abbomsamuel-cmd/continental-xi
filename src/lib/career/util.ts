import type { CareerPlayer, CareerSeason } from "./types";

/** €92M, €310k, €0 — compact money for headers and offers. */
export function fmtMoney(euros: number): string {
  if (euros >= 1_000_000) {
    const m = euros / 1_000_000;
    return `€${m >= 100 ? Math.round(m) : m.toFixed(m >= 10 ? 0 : 1)}M`;
  }
  if (euros >= 1_000) return `€${Math.round(euros / 1_000)}k`;
  return `€${Math.round(euros)}`;
}

/** €310k/week style. */
export function fmtWage(euros: number): string {
  return `${fmtMoney(euros)}/wk`;
}

/** A start-year renders as a football campaign: 2028 → "2028–29". */
export function seasonLabel(year: number): string {
  return `${year}–${String((year + 1) % 100).padStart(2, "0")}`;
}

export interface ClubChapter {
  key: string;
  clubId: string;
  clubName: string;
  clubShort: string;
  clubColors: [string, string];
  clubCountry: string;
  seasons: CareerSeason[];
  fromYear: number;
  toYear: number;
  apps: number;
  goals: number;
  assists: number;
  honours: number;
  ovrFrom: number;
  ovrTo: number;
}

/** Group consecutive seasons at the same club into one chapter — the timeline
 *  reads as a story ("Manchester United 2032–2036 · 5 seasons"), not 20 rows. */
export function groupSeasons(seasons: CareerSeason[]): ClubChapter[] {
  const out: ClubChapter[] = [];
  for (const s of seasons) {
    const last = out[out.length - 1];
    if (last && last.clubId === s.clubId) {
      last.seasons.push(s);
      last.toYear = s.year;
      last.apps += s.apps;
      last.goals += s.goals;
      last.assists += s.assists;
      last.honours += s.honours.length;
      last.ovrTo = s.overall;
    } else {
      out.push({
        key: `${s.clubId}-${s.year}`,
        clubId: s.clubId, clubName: s.clubName, clubShort: s.clubShort,
        clubColors: s.clubColors, clubCountry: s.clubCountry,
        seasons: [s], fromYear: s.year, toYear: s.year,
        apps: s.apps, goals: s.goals, assists: s.assists,
        honours: s.honours.length, ovrFrom: s.overall, ovrTo: s.overall,
      });
    }
  }
  return out;
}

export interface CareerTotals {
  apps: number; goals: number; assists: number;
  honours: number; seasons: number; clubs: number; peakOverall: number;
}

export function careerTotals(p: CareerPlayer): CareerTotals {
  const t: CareerTotals = { apps: 0, goals: 0, assists: 0, honours: 0, seasons: p.seasons.length, clubs: 0, peakOverall: p.overall };
  const clubs = new Set<string>();
  for (const s of p.seasons) {
    t.apps += s.apps; t.goals += s.goals; t.assists += s.assists;
    t.honours += s.honours.length; clubs.add(s.clubId);
    if (s.overall > t.peakOverall) t.peakOverall = s.overall;
  }
  t.clubs = clubs.size;
  return t;
}

/** Reputation drives how many stars a club shows an offer with (1–5). */
export function starRating(tier: number): number {
  return Math.max(1, Math.min(5, tier));
}
