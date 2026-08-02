// Core domain types for the Champions Draft simulator.
import type { TacticId } from "./tactics";

export type Position =
  | "GK" | "RB" | "CB" | "LB" | "RWB" | "LWB"
  | "CDM" | "CM" | "CAM" | "RM" | "LM"
  | "RW" | "LW" | "CF" | "ST";

export type PositionGroup = "GK" | "DEF" | "MID" | "ATT";

export interface Attributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export interface Player {
  id: string;
  name: string;
  nationality: string;
  position: Position;
  altPositions: Position[];
  overall: number;
  attributes: Attributes;
  club: string;
  clubCountry: string;
  /** Externally-hosted club badge. Nothing ships with the app — supply a URL
   *  from whatever image source you've cleared, and the card renders it in
   *  place of the generated crest. Left unset, the generated crest is used. */
  clubBadgeUrl?: string;
  /** Externally-hosted nation flag, same contract as clubBadgeUrl. Unset
   *  falls back to the bundled flag-icons set. */
  nationFlagUrl?: string;
  league: string;
  season: number; // season is identified by the year the final was played (e.g. 2011 = 2010-11)
  seasonLabel: string;
  coach: string;
  stadium: string;
  goals: number;
  assists: number;
  apps: number;
  cleanSheets?: number;
  traits: string[];
  workRates: string; // e.g. "High/Med"
  skillMoves: number; // 1-5
  weakFoot: number; // 1-5
  foot: "Right" | "Left";
  bodyType: string;
  colors: [string, string];
}

export interface RawSquad {
  club: string;
  country: string;
  league: string;
  season: number;
  coach: string;
  stadium: string;
  colors: [string, string];
  honor?: string;
  /** [name, nationality, position, overall, altPositions?, {g,a}?] */
  players: RawPlayer[];
}

export type RawPlayer = [
  string, string, Position, number,
  Position[]?,
  { g?: number; a?: number; cs?: number }?,
];

export interface ClubEntry {
  name: string;
  country: string;
  league: string;
  coeff: number; // 1-100 strength coefficient for AI simulation & seeding
  colors: [string, string];
}

export interface FormationSlot {
  pos: Position;
  x: number; // 0-100 left->right
  y: number; // 0-100 own goal (bottom) -> opponent goal (top)
}

export interface Formation {
  name: string;
  slots: FormationSlot[];
  /** tactic ids this shape suits best — powers the formation preview */
  bestFor?: string[];
}

export type GameMode = "classic" | "expert";

export interface DraftPickRound {
  squadIndex: number; // index into SQUADS
  slotIndex: number; // which formation slot we're filling
}

export interface SquadSelection {
  slotIndex: number;
  playerId: string;
}

export interface ChemLink {
  a: number; // slot index
  b: number;
  strength: 0 | 1 | 2 | 3;
  reasons: string[];
}

export interface TeamAnalysis {
  overall: number;
  attack: number;
  midfield: number;
  defense: number;
  goalkeeper: number;
  /** % of full effectiveness the XI keeps from position suitability (100 = all natural) */
  positionFit: number;
  /** the four explainable components behind the overall */
  breakdown: {
    playerQuality: number;
    positionSuitability: number;
    tacticFit: number;
    experience: number;
  };
  leadership: number;
  experience: number;
  possession: number;
  counter: number;
  pressResistance: number;
  setPieces: number;
  balance: number;
  strengths: string[];
  weaknesses: string[];
  captain: string;
  radar: { label: string; value: number }[];
}

// ---- Tournament ----

export interface SimTeam {
  id: string;
  name: string;
  short: string;
  country: string;
  colors: [string, string];
  strength: number; // 0-100
  attack: number;
  defense: number;
  isUser: boolean;
  pot: number;
  season?: number; // the specific vintage this opponent represents, e.g. 2017
  tactic?: TacticId; // tactical style — drives the style-vs-style matchup in the engine
}

export interface MatchEvent {
  minute: number;
  type: "goal" | "yellow" | "red" | "sub" | "var" | "chance";
  team: 0 | 1;
  player: string;
  assist?: string;
  note?: string;
}

export interface MatchStats {
  possession: [number, number];
  xg: [number, number];
  shots: [number, number];
  onTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
  yellows: [number, number];
  reds: [number, number];
  offsides: [number, number];
  passAcc: [number, number];
}

export interface ShootoutKick {
  team: 0 | 1; // 0 = home, 1 = away
  taker: string;
  outcome: "goal" | "saved" | "missed" | "post";
  homeScore: number; // running tally after this kick
  awayScore: number;
  suddenDeath: boolean;
}

export interface ShootoutData {
  kicks: ShootoutKick[];
  home: number; // final shootout score
  away: number;
  winner: 0 | 1;
}

export interface MatchResult {
  home: string; // team id
  away: string;
  homeGoals: number;
  awayGoals: number;
  events: MatchEvent[];
  stats: MatchStats;
  motm: string;
  momentum: number[]; // per-5-min swing, -1..1 (positive = home)
  penalties?: [number, number];
  /** full kick-by-kick shootout, present when the tie went to penalties */
  shootout?: ShootoutData;
}

export interface Fixture {
  home: string;
  away: string;
  matchday: number;
  result?: MatchResult;
}

export interface TableRow {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
  form: ("W" | "D" | "L")[];
}

export type KORoundName = "Play-off" | "Round of 16" | "Quarter-final" | "Semi-final" | "Third Place" | "Final";

export interface KOTie {
  round: KORoundName;
  teamA: string;
  teamB: string;
  leg1?: MatchResult;
  leg2?: MatchResult;
  winner?: string;
}

export interface TournamentState {
  phase: "league" | "playoffs" | "r16" | "qf" | "sf" | "final" | "done";
  teams: Record<string, SimTeam>;
  fixtures: Fixture[];
  matchday: number; // next matchday to play (1-8), 9 = league done
  ties: KOTie[]; // only the USER's knockout ties (their road to the final)
  userAlive: boolean;
  champion?: string;
  awards?: { goldenBall: string; goldenBoot: string; goldenGlove: string; topScorerGoals: number };
  userGoals: Record<string, number>; // player name -> goals across tournament
  userAssists: Record<string, number>;
  userCleanSheets: number;
  prevPositions?: Record<string, number>;
  userSeed?: number; // final league-phase position
  faced?: string[]; // team ids already faced in the knockouts
  exit?: { stage: string; text: string }; // where the user's run ended
}

export interface DraftRecord {
  id: string;
  date: string;
  mode: GameMode;
  formation: string;
  overall: number;
  /** legacy field from the chemistry era — old saves may still carry it */
  chemistry?: number;
  tactic?: string;
  players: { name: string; club: string; season: number; position: Position; overall: number }[];
  result?: "champion" | "final" | "semi" | "quarter" | "r16" | "playoff" | "league";
  goals?: number;
  daily?: string; // date key if it was a daily challenge
}

export interface IntlRecord {
  comp: "euro" | "copa";
  nation: string;
  year: number;
  result: "champion" | "final" | "third" | "semi" | "quarter" | "r16" | "groups";
  date: string;
}

/** One reviewable entry in the lifetime match-history log. */
export interface LoggedMatch {
  id: string;
  date: string; // ISO
  comp: "cl" | "euro" | "copa";
  round: string; // "Matchday 3", "Quarter-final · 1st Leg", "The Final" …
  home: { name: string; short: string; colors: [string, string]; season?: number };
  away: { name: string; short: string; colors: [string, string]; season?: number };
  result: MatchResult;
}

export interface Profile {
  name: string;
  createdAt: string;
  trophies: number;
  achievements: string[];
  drafts: DraftRecord[];
  soundOn: boolean;
  intlResults?: IntlRecord[];
  /** cosmetic hidden emblems the manager has discovered (easter eggs) */
  eggs?: string[];
}
