// Career Mode — domain types. Part 1 is the visual/UX foundation: these types
// describe a saved player's identity and résumé. The season engine (Part 2)
// will mutate these over time; here they are seeded once at creation.

export type Foot = "Left" | "Right";

export type CareerPositionId =
  | "GK" | "RB" | "CB" | "LB" | "CDM" | "CM" | "CAM" | "RW" | "LW" | "ST";

/** Hidden potential, surfaced only as a vague label (never a number). */
export type PotentialTier = "raw" | "promising" | "elite" | "wonderkid" | "unknown";

/** How the wider game sees the player. */
export type ReputationTier =
  | "unknown" | "prospect" | "wonderkid" | "promising"
  | "established" | "star" | "superstar" | "worldClass" | "legend";

/** Standing within the current squad. */
export type RoleTier =
  | "notSelected" | "reserve" | "rotation" | "starter"
  | "important" | "star" | "captain";

export interface ClubRef {
  id: string;
  name: string;
  short: string;
  country: string;
  colors: [string, string];
  leagueId: string;
  /** 1 (small) … 5 (elite) — reputation & quality of the club. */
  tier: number;
}

/** One row of the career résumé — a single season at a single club. */
export interface CareerSeason {
  /** Start year of the campaign, e.g. 2028 renders as "2028–29". */
  year: number;
  age: number;
  clubId: string;
  clubName: string;
  clubShort: string;
  clubColors: [string, string];
  clubCountry: string;
  overall: number;
  apps: number;
  goals: number;
  assists: number;
  /** Honour labels won that season (e.g. "League", "Champions League"). */
  honours: string[];
}

export interface CareerPlayer {
  id: string;

  // ---- identity (chosen at creation, fixed) ----
  name: string;
  nationality: string; // country name
  birthYear: number;
  foot: Foot;
  shirtNumber: number;
  position: CareerPositionId;
  archetypeId: string;
  boyhoodClubId: string | null;

  // ---- current standing (seeded at creation; the engine evolves it later) ----
  age: number;
  overall: number;
  potentialTier: PotentialTier;
  currentClubId: string;
  currentClubName: string;
  currentClubShort: string;
  currentClubColors: [string, string];
  currentClubCountry: string;
  marketValue: number; // euros
  wage: number; // euros / week
  contractUntil: number; // year
  role: RoleTier;
  reputation: ReputationTier;
  traits: string[];

  // ---- the résumé ----
  seasons: CareerSeason[];
  /** The season year the career began — timeline anchor. */
  startYear: number;
}

export interface CareerSave {
  id: string;
  player: CareerPlayer;
  createdAt: number;
  updatedAt: number;
}

/** Everything the creation wizard collects before a career is seeded. */
export interface CareerCreationInput {
  name: string;
  nationality: string;
  birthYear: number;
  foot: Foot;
  shirtNumber: number;
  position: CareerPositionId;
  archetypeId: string;
  clubId: string;
}
