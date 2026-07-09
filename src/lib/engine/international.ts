import type { Fixture, KOTie, Player, RawSquad, SimTeam, TableRow, TeamAnalysis } from "../types";
import { EURO_SQUADS, COPA_SQUADS } from "../data/nations";
import { expandSquad } from "../players";
import { simulateMatch, shootout, type EngineTeamContext } from "./match";
import { shuffle, type Rng } from "../rng";

export type IntlComp = "euro" | "copa";

/** User key when the entrant is a drafted XI rather than a historic nation. */
export const INTL_USER = "user";

export interface IntlState {
  comp: IntlComp;
  userKey: string;
  teams: Record<string, SimTeam>;
  groups: string[][]; // group index -> team keys
  fixtures: Fixture[]; // group stage, matchday 1..3
  matchday: number; // next group matchday (4 = groups done)
  ties: KOTie[]; // QF → SF → Final, single-leg
  phase: "groups" | "qf" | "sf" | "final" | "done";
  userAlive: boolean;
  champion?: string;
  exit?: { stage: string; text: string };
}

export const COMP_SQUADS: Record<IntlComp, RawSquad[]> = {
  euro: EURO_SQUADS,
  copa: COPA_SQUADS,
};

export function squadKey(sq: RawSquad): string {
  return `${sq.club}|${sq.season}`;
}

// expanded rosters cached per squad key (used for scorers & team strength)
const rosterCache = new Map<string, Player[]>();
export function nationPlayers(comp: IntlComp, key: string): Player[] {
  const cached = rosterCache.get(key);
  if (cached) return cached;
  const sq = COMP_SQUADS[comp].find((s) => squadKey(s) === key);
  const players = sq ? expandSquad(sq) : [];
  rosterCache.set(key, players);
  return players;
}

function avg(ns: number[]): number {
  return ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 60;
}

function shortCode(name: string): string {
  const words = name.split(/\s+/);
  if (words.length === 1) return name.slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}

function teamFromSquad(comp: IntlComp, sq: RawSquad, isUser: boolean): SimTeam {
  const key = squadKey(sq);
  const ps = nationPlayers(comp, key);
  const sorted = [...ps].sort((a, b) => b.overall - a.overall);
  const strength = avg(sorted.slice(0, 11).map((p) => p.overall));
  const atts = ps.filter((p) => ["ST", "CF", "LW", "RW", "CAM"].includes(p.position)).sort((a, b) => b.overall - a.overall);
  const defs = ps.filter((p) => ["GK", "CB", "RB", "LB", "RWB", "LWB", "CDM"].includes(p.position)).sort((a, b) => b.overall - a.overall);
  return {
    id: key,
    name: sq.club,
    short: shortCode(sq.club),
    country: sq.country,
    colors: sq.colors,
    strength,
    attack: avg(atts.slice(0, 4).map((p) => p.overall)),
    defense: avg(defs.slice(0, 5).map((p) => p.overall)),
    isUser,
    pot: 0,
    season: sq.season,
  };
}

/** One random vintage per nation, excluding `skipNation` if given. */
function nationField(rng: Rng, comp: IntlComp, skipNation?: string): RawSquad[] {
  const byNation = new Map<string, RawSquad[]>();
  for (const s of COMP_SQUADS[comp]) {
    const list = byNation.get(s.club) ?? [];
    list.push(s);
    byNation.set(s.club, list);
  }
  const field: RawSquad[] = [];
  for (const [nation, list] of byNation) {
    if (nation === skipNation) continue;
    field.push(list[Math.floor(rng() * list.length)]);
  }
  return field;
}

/** Draw groups + fixtures for an assembled team map. */
function drawTournament(rng: Rng, comp: IntlComp, userKey: string, teams: Record<string, SimTeam>): IntlState {
  const numGroups = comp === "euro" ? 4 : 3;
  const seeded = Object.keys(teams).sort((a, b) => teams[b].strength - teams[a].strength);
  seeded.forEach((k, i) => { teams[k].pot = Math.floor(i / numGroups) + 1; });
  const groups: string[][] = Array.from({ length: numGroups }, () => []);
  for (let pot = 0; pot < seeded.length / numGroups; pot++) {
    const potTeams = shuffle(rng, seeded.slice(pot * numGroups, (pot + 1) * numGroups));
    potTeams.forEach((k, gi) => groups[gi].push(k));
  }

  // group fixtures: 3 matchdays, standard round-robin for 4 teams
  const rounds = [
    [[0, 1], [2, 3]],
    [[0, 2], [1, 3]],
    [[0, 3], [1, 2]],
  ];
  const fixtures: Fixture[] = [];
  for (const g of groups) {
    rounds.forEach((pairs, md) => {
      for (const [x, y] of pairs) fixtures.push({ home: g[x], away: g[y], matchday: md + 1 });
    });
  }

  return {
    comp, userKey, teams, groups, fixtures,
    matchday: 1, ties: [], phase: "groups", userAlive: true,
  };
}

/**
 * Lead-a-nation mode: one squad per nation (the user's chosen vintage locked,
 * other nations pick a random vintage), seeded pots, authentic group draw.
 */
export function createIntl(rng: Rng, comp: IntlComp, userKey: string): IntlState {
  const squads = COMP_SQUADS[comp];
  const userSquad = squads.find((s) => squadKey(s) === userKey)!;
  const field: RawSquad[] = [userSquad, ...nationField(rng, comp, userSquad.club)];

  const teams: Record<string, SimTeam> = {};
  for (const sq of field) {
    teams[squadKey(sq)] = teamFromSquad(comp, sq, squadKey(sq) === userKey);
  }
  return drawTournament(rng, comp, userKey, teams);
}

/**
 * Draft mode: the user's hand-built XI of international legends enters as its
 * own team, replacing one random nation so the field size stays authentic.
 */
export function createIntlDraft(
  rng: Rng, comp: IntlComp, teamName: string, colors: [string, string], analysis: TeamAnalysis,
): IntlState {
  const size = comp === "euro" ? 16 : 12;
  const nations = shuffle(rng, nationField(rng, comp)).slice(0, size - 1);

  const teams: Record<string, SimTeam> = {};
  const chemBonus = (analysis.chemistry - 48) * 0.2;
  teams[INTL_USER] = {
    id: INTL_USER,
    name: teamName,
    short: "YOU",
    country: "World",
    colors,
    strength: Math.min(99, analysis.overall + chemBonus),
    attack: Math.min(99, analysis.attack + chemBonus),
    defense: Math.min(99, (analysis.defense + analysis.goalkeeper) / 2 + chemBonus),
    isUser: true,
    pot: 0,
  };
  for (const sq of nations) {
    teams[squadKey(sq)] = teamFromSquad(comp, sq, false);
  }
  return drawTournament(rng, comp, INTL_USER, teams);
}

/** Mini standings for one group. */
export function groupTable(state: IntlState, groupIdx: number): TableRow[] {
  const keys = state.groups[groupIdx];
  const rows: Record<string, TableRow> = {};
  for (const k of keys) rows[k] = { teamId: k, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0, form: [] };
  for (const f of state.fixtures) {
    if (!f.result || !rows[f.home]) continue;
    if (!keys.includes(f.home)) continue;
    const r = f.result;
    const h = rows[f.home]; const a = rows[f.away];
    h.played++; a.played++;
    h.gf += r.homeGoals; h.ga += r.awayGoals;
    a.gf += r.awayGoals; a.ga += r.homeGoals;
    if (r.homeGoals > r.awayGoals) { h.won++; a.lost++; h.points += 3; h.form.push("W"); a.form.push("L"); }
    else if (r.homeGoals < r.awayGoals) { a.won++; h.lost++; a.points += 3; a.form.push("W"); h.form.push("L"); }
    else { h.drawn++; a.drawn++; h.points++; a.points++; h.form.push("D"); a.form.push("D"); }
  }
  return Object.values(rows).sort(
    (x, y) => y.points - x.points || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || x.teamId.localeCompare(y.teamId),
  );
}

function ctx(state: IntlState, key: string, userPlayers?: Player[]): EngineTeamContext {
  // drafted-XI entrant scores through the user's actual picks; nations use
  // their real historic rosters
  const players = key === INTL_USER ? userPlayers ?? null : nationPlayers(state.comp, key);
  return {
    team: state.teams[key],
    form: 0,
    players,
    bigMatch: state.phase !== "groups",
  };
}

/** Simulate all group matches of the current matchday; resolve groups after MD3. */
export function playIntlMatchday(rng: Rng, state: IntlState, userPlayers?: Player[]) {
  if (state.phase !== "groups") return;
  const todays = state.fixtures.filter((f) => f.matchday === state.matchday && !f.result);
  for (const f of todays) {
    f.result = simulateMatch(rng, ctx(state, f.home, userPlayers), ctx(state, f.away, userPlayers), { neutral: true });
  }
  state.matchday++;
  if (state.matchday > 3 && state.ties.length === 0) resolveGroups(state);
}

function resolveGroups(state: IntlState) {
  const tables = state.groups.map((_, i) => groupTable(state, i));
  let qualified: string[];
  let pairs: [string, string][];

  if (state.comp === "euro") {
    // EURO: top 2 per group → QF, winners cross with runners-up (A1-B2 …)
    const w = tables.map((t) => t[0].teamId);
    const r = tables.map((t) => t[1].teamId);
    qualified = [...w, ...r];
    pairs = [
      [w[0], r[1]], [w[2], r[3]],
      [w[1], r[0]], [w[3], r[2]],
    ];
  } else {
    // Copa: top 2 of 3 groups + the 2 best third-placed sides, seeded 1v8 …
    const firsts = tables.map((t) => t[0]);
    const seconds = tables.map((t) => t[1]);
    const thirds = tables.map((t) => t[2])
      .sort((x, y) => y.points - x.points || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf)
      .slice(0, 2);
    const ranked = [...firsts, ...seconds, ...thirds]
      .sort((x, y) => y.points - x.points || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf)
      .map((row) => row.teamId);
    qualified = ranked;
    pairs = [
      [ranked[0], ranked[7]], [ranked[3], ranked[4]],
      [ranked[1], ranked[6]], [ranked[2], ranked[5]],
    ];
  }

  if (!qualified.includes(state.userKey)) {
    state.userAlive = false;
    state.phase = "done";
    state.exit = { stage: "Group Stage", text: "Eliminated in the group stage" };
    return;
  }
  for (const [a, b] of pairs) state.ties.push({ round: "Quarter-final", teamA: a, teamB: b });
  state.phase = "qf";
}

const INTL_NEXT: Record<string, { round: KOTie["round"]; phase: IntlState["phase"] } | null> = {
  "Quarter-final": { round: "Semi-final", phase: "sf" },
  "Semi-final": { round: "Final", phase: "final" },
  "Final": null,
};

/** Play every tie of the current knockout round (single-leg, pens on a draw). */
export function playIntlRound(rng: Rng, state: IntlState, userPlayers?: Player[]) {
  if (!["qf", "sf", "final"].includes(state.phase)) return;
  const roundName = state.phase === "qf" ? "Quarter-final" : state.phase === "sf" ? "Semi-final" : "Final";
  const current = state.ties.filter((t) => t.round === roundName && !t.winner);
  for (const tie of current) {
    const result = simulateMatch(rng, ctx(state, tie.teamA, userPlayers), ctx(state, tie.teamB, userPlayers), { neutral: true, knockout: true });
    if (result.homeGoals === result.awayGoals) {
      const [hp, ap] = shootout(rng, state.teams[tie.teamA].strength, state.teams[tie.teamB].strength);
      result.penalties = [hp, ap];
      tie.winner = hp > ap ? tie.teamA : tie.teamB;
    } else {
      tie.winner = result.homeGoals > result.awayGoals ? tie.teamA : tie.teamB;
    }
    tie.leg1 = result;
  }

  const userTie = current.find((t) => t.teamA === state.userKey || t.teamB === state.userKey);
  if (roundName === "Final") {
    const final = current[0];
    state.champion = final.winner;
    state.phase = "done";
    if (final.winner === state.userKey) {
      state.exit = { stage: "Champions", text: state.comp === "euro" ? "Champions of Europe" : "Champions of South America" };
    } else {
      state.userAlive = false;
      state.exit = { stage: "Final", text: "Beaten in the Final" };
    }
    return;
  }
  if (userTie && userTie.winner !== state.userKey) {
    state.userAlive = false;
    state.phase = "done";
    state.exit = { stage: roundName, text: `Knocked out in the ${roundName}` };
    return;
  }
  const winners = current.map((t) => t.winner!);
  const next = INTL_NEXT[roundName]!;
  for (let i = 0; i < winners.length; i += 2) {
    state.ties.push({ round: next.round, teamA: winners[i], teamB: winners[i + 1] });
  }
  state.phase = next.phase;
}
