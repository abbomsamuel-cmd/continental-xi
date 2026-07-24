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

/** Seasonal form band. */
export type FormTier = "terrible" | "poor" | "average" | "good" | "excellent" | "worldClass";

/** What a player trains hardest at over a season. */
export type TrainingFocus =
  | "finishing" | "passing" | "pace" | "strength" | "dribbling"
  | "defending" | "weakFoot" | "leadership" | "goalkeeping";

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
  /** Individual award trophy-ids won that season (e.g. "golden-boot"). */
  awards?: string[];
  /** Average match rating that season (Part 2.9 — richer timeline rows). */
  avgRating?: number;
  /** Market value at the end of the season, in euros. */
  marketValue?: number;
  /** True if an injury cost the player a chunk of this season. */
  injured?: boolean;
  /** International caps won this season. */
  intlApps?: number;
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

  // ---- Part 2 · living career state ----
  /** Year of the season about to be played (the résumé's next chapter). */
  currentYear: number;
  form: FormTier;
  /** Manager trust 0–100, drives role. */
  trust: number;
  trainingFocus: TrainingFocus | null;
  seasonsAtClub: number;
  peakOverall: number;
  national: { calledUp: boolean; caps: number; goals: number; captain: boolean };
  retired: boolean;

  /** Full international résumé (Part 2). Optional so pre-Part-2 saves still load;
   *  read it as `player.intl ?? emptyIntlState(player.nationality)`. */
  intl?: IntlStateLike;
  /** Ids of once-only events already fired, so turning points never repeat. */
  firedEvents?: string[];
  /** Ids of injuries the player has suffered — feeds recurrence + injury-prone. */
  injuryHistory?: string[];

  // ---- the résumé ----
  seasons: CareerSeason[];
  /** The season year the career began — timeline anchor. */
  startYear: number;
}

/** Shape of the persisted international state (see international.ts IntlState). */
export interface IntlStateLike {
  nation: string;
  calledUp: boolean;
  debutYear: number | null;
  caps: number;
  goals: number;
  assists: number;
  captain: boolean;
  retired: boolean;
  tournaments: string[];
  majorHonours: string[];
}

/** A club's interest at the transfer window — a real, actionable offer. */
export interface TransferOffer {
  clubId: string;
  wage: number;
  years: number;
  role: RoleTier;
  developmentStars: number; // 1–5
  /** Why this club wants you. Never show an offer without one. */
  reasonEn: string;
  reasonEs: string;
  /** Realistic league appearances next season, as [min, max]. */
  expectedApps: [number, number];
}

/** One attribute movement in a development report. */
export interface AttrDelta { label: string; delta: number }

/** The full outcome of a played season. */
export interface SeasonResult {
  season: CareerSeason;
  overallFrom: number;
  overallTo: number;
  attrDeltas: AttrDelta[];
  form: FormTier;
  trust: number;
  role: RoleTier;
  reputation: ReputationTier;
  marketValueFrom: number;
  marketValueTo: number;
  avgRating: number;
  leaguePosition: number;
  objectives: { text: string; met: boolean }[];
  media: string[];
  offers: TransferOffer[];
  contractExpiring: boolean;
  seasonsAtClub: number;
  national: { calledUp: boolean; caps: number; goals: number; captain: boolean };
  age: number;
  traitUnlocks: string[];
  positionChange: CareerPositionId | null;
}

export interface CareerSave {
  id: string;
  player: CareerPlayer;
  createdAt: number;
  updatedAt: number;
}

/** Everything the creation wizard collects before a career is seeded. The
 * starting club is NOT chosen — it is auto-assigned (a small/home club). */
export interface CareerCreationInput {
  name: string;
  nationality: string;
  birthYear: number;
  foot: Foot;
  shirtNumber: number;
  position: CareerPositionId;
  archetypeId: string;
}
