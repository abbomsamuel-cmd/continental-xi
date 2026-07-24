import type { CareerPositionId, ClubRef } from "./types";

/**
 * The world club database. `ClubRef` stays the rendering contract (crest,
 * colours, short code) so every existing component keeps working; a WorldClub
 * simply carries the extra scouting brain the transfer engine needs.
 */

/** How a club shops. Drives which players it will actually chase. */
export type RecruitmentStyle =
  | "elite" // world-class signings and generational wonderkids only
  | "development" // young players with resale value
  | "midTable" // dependable starters and affordable improvements
  | "promotion" // experienced heads, loans, proven second-tier performers
  | "survival" // immediate impact, affordable veterans
  | "showcase" // MLS / Saudi — recognisable names, big wages
  | "domestic"; // South America — home-grown, returning veterans

export interface WorldClub extends ClubRef {
  /** Hidden 0–100 reputation. 100 = Real Madrid, 50 = lower divisions. */
  reputation: number;
  /** 0–100 strength of the competition this club plays in. */
  leagueStrength: number;
  /** 1 = top flight, 2 = second tier, 3 = third tier. */
  division: number;
  /** Transfer budget in euros. */
  budget: number;
  /** Ceiling on a weekly wage, in euros. */
  wageCapacity: number;
  /** Roughly the average overall of the starting XI. */
  squadQuality: number;
  recruitment: RecruitmentStyle;
  /** Inclusive [min, max] age this club prefers to sign. */
  preferredAge: [number, number];
  positionalNeeds: CareerPositionId[];
  /** Short season objective, shown as the reason a club is interested. */
  objective: string;
}

/** Compact authoring tuple so a whole league is a readable block of lines. */
export type RawWorldClub = [
  name: string,
  short: string,
  reputation: number,
  colour1: string,
  colour2: string,
  recruitment: RecruitmentStyle,
  needs: CareerPositionId[],
  objective: string,
];

export interface WorldLeague {
  id: string;
  name: string;
  country: string;
  division: number;
  /** 0–100 — how strong the competition is overall. */
  strength: number;
  clubs: WorldClub[];
}

/** Reputation → the legacy 1–5 tier the older engine code still reads. */
export function tierFromReputation(reputation: number): number {
  if (reputation >= 92) return 5;
  if (reputation >= 82) return 4;
  if (reputation >= 70) return 3;
  if (reputation >= 58) return 2;
  return 1;
}

/** Money scales off reputation and division so budgets stay self-consistent. */
function budgetFor(reputation: number, division: number): number {
  const base = Math.pow(Math.max(1, reputation - 40), 2.6) * 5_200;
  return Math.round((base / division) / 500_000) * 500_000;
}
function wageFor(reputation: number, division: number): number {
  // Anchored to reality: a rep-100 side can pay ~€160k/wk, a rep-80 side ~€55k,
  // a rep-60 side ~€10k, a rep-45 side a couple of thousand.
  const base = 800 + Math.pow(Math.max(1, reputation - 38), 2.75) * 1.9;
  return Math.round((base / division) / 500) * 500;
}

/**
 * Build a league from compact tuples. Budgets, wages, squad quality and tier
 * are all derived from reputation so a new league is a dozen short lines.
 */
export function worldLeague(
  id: string,
  name: string,
  country: string,
  division: number,
  strength: number,
  raw: RawWorldClub[],
): WorldLeague {
  return {
    id,
    name,
    country,
    division,
    strength,
    clubs: raw.map(([cn, short, reputation, c1, c2, recruitment, needs, objective]) => ({
      id: `${id}-${short.toLowerCase()}`,
      name: cn,
      short,
      country,
      colors: [c1, c2] as [string, string],
      leagueId: id,
      tier: tierFromReputation(reputation),
      reputation,
      leagueStrength: strength,
      division,
      budget: budgetFor(reputation, division),
      wageCapacity: wageFor(reputation, division),
      squadQuality: Math.round(46 + reputation * 0.42),
      recruitment,
      preferredAge: preferredAgeFor(recruitment),
      positionalNeeds: needs,
      objective,
    })),
  };
}

function preferredAgeFor(style: RecruitmentStyle): [number, number] {
  switch (style) {
    case "elite": return [21, 28];
    case "development": return [16, 23];
    case "midTable": return [22, 30];
    case "promotion": return [25, 33];
    case "survival": return [24, 34];
    case "showcase": return [28, 38];
    case "domestic": return [18, 34];
  }
}
