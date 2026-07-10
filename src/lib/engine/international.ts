import type { Fixture, KOTie, Player, RawSquad, SimTeam, TableRow, TeamAnalysis } from "../types";
import { EURO_SQUADS, COPA_SQUADS } from "../data/nations";
import { EURO_SQUADS_EXTRA } from "../data/nations-extra";
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
  ties: KOTie[]; // EURO: R16 → QF → SF → F · Copa: QF → SF → Third Place + F
  phase: "groups" | "r16" | "qf" | "sf" | "final" | "done";
  userAlive: boolean;
  champion?: string;
  exit?: { stage: string; text: string };
}

export const COMP_SQUADS: Record<IntlComp, RawSquad[]> = {
  euro: [...EURO_SQUADS, ...EURO_SQUADS_EXTRA],
  copa: COPA_SQUADS,
};

/** Official field sizes: EURO is the modern 24-team format, Copa runs 12. */
export const COMP_SIZE: Record<IntlComp, number> = { euro: 24, copa: 12 };
const COMP_GROUPS: Record<IntlComp, number> = { euro: 6, copa: 3 };

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
  const numGroups = COMP_GROUPS[comp];
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
 * Lead-a-nation mode: the user's chosen vintage locked, the rest of the field
 * drawn as one random vintage per nation up to the official field size, seeded
 * pots, authentic group draw.
 */
export function createIntl(rng: Rng, comp: IntlComp, userKey: string): IntlState {
  const squads = COMP_SQUADS[comp];
  const userSquad = squads.find((s) => squadKey(s) === userKey)!;
  const others = shuffle(rng, nationField(rng, comp, userSquad.club));
  const field: RawSquad[] = [userSquad, ...others].slice(0, COMP_SIZE[comp]);

  const teams: Record<string, SimTeam> = {};
  for (const sq of field) {
    teams[squadKey(sq)] = teamFromSquad(comp, sq, squadKey(sq) === userKey);
  }
  return drawTournament(rng, comp, userKey, teams);
}

/**
 * Draft mode: the user's hand-built XI of international legends enters as its
 * own team, replacing one random nation so the field size stays authentic.
 *
 * International sides have no transfer-market chemistry — entry strength is a
 * pure football evaluation: attack, midfield, defense, goalkeeper, experience
 * and squad balance.
 */
export function createIntlDraft(
  rng: Rng, comp: IntlComp, teamName: string, colors: [string, string], analysis: TeamAnalysis,
): IntlState {
  const size = COMP_SIZE[comp];
  const nations = shuffle(rng, nationField(rng, comp)).slice(0, size - 1);

  const teams: Record<string, SimTeam> = {};
  const core =
    analysis.attack * 0.3 + analysis.midfield * 0.25 +
    analysis.defense * 0.3 + analysis.goalkeeper * 0.15;
  const polish = (analysis.experience - 50) * 0.06 + (analysis.balance - 50) * 0.06;
  teams[INTL_USER] = {
    id: INTL_USER,
    name: teamName,
    short: "YOU",
    country: "World",
    colors,
    strength: Math.min(99, core + polish),
    attack: Math.min(99, analysis.attack + polish),
    defense: Math.min(99, (analysis.defense + analysis.goalkeeper) / 2 + polish),
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

/** Rank third-placed rows across groups the official way. */
function rankRows(rows: TableRow[]): TableRow[] {
  return [...rows].sort((x, y) => y.points - x.points || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf);
}

/**
 * EURO 24-team Round of 16 (official shape): the four group winners hosting
 * third-placed sides may not face the third from their own group. Official
 * allowed-groups per host, best-effort backtracking assignment.
 */
function euroR16(tables: TableRow[][], qualified3: { teamId: string; group: number }[]): [string, string][] {
  const W = tables.map((t) => t[0].teamId); // winners A..F
  const U = tables.map((t) => t[1].teamId); // runners-up A..F
  const G = (letter: string) => letter.charCodeAt(0) - 65;

  // hosts of third-placed teams, with the groups each may officially draw
  const hosts: { winner: string; allowed: number[] }[] = [
    { winner: W[G("B")], allowed: ["A", "D", "E", "F"].map(G) },
    { winner: W[G("C")], allowed: ["D", "E", "F"].map(G) },
    { winner: W[G("E")], allowed: ["A", "B", "C", "D"].map(G) },
    { winner: W[G("F")], allowed: ["A", "B", "C"].map(G) },
  ];

  // backtracking assignment of the four qualified thirds to the four hosts
  const assign = (i: number, used: Set<number>, out: string[]): boolean => {
    if (i === hosts.length) return true;
    for (const t of qualified3) {
      if (used.has(t.group)) continue;
      if (!hosts[i].allowed.includes(t.group)) continue;
      used.add(t.group);
      out[i] = t.teamId;
      if (assign(i + 1, used, out)) return true;
      used.delete(t.group);
    }
    return false;
  };
  const thirds: string[] = [];
  if (!assign(0, new Set(), thirds)) {
    // combination not coverable by the strict table — any same-group-avoiding order
    qualified3.forEach((t, i) => { thirds[i] = t.teamId; });
  }

  // bracket order: consecutive pairs feed the same quarter-final (EURO 2024 shape)
  return [
    [W[G("A")], U[G("C")]], [U[G("A")], U[G("B")]],   // QF 1
    [hosts[0].winner, thirds[0]], [hosts[1].winner, thirds[1]], // QF 2 (1B/3, 1C/3)
    [hosts[2].winner, thirds[2]], [W[G("D")], U[G("F")]],       // QF 3 (1E/3, 1D/2F)
    [hosts[3].winner, thirds[3]], [U[G("D")], U[G("E")]],       // QF 4 (1F/3, 2D/2E)
  ];
}

function resolveGroups(state: IntlState) {
  const tables = state.groups.map((_, i) => groupTable(state, i));

  if (state.comp === "euro") {
    // EURO: top 2 of six groups + the four best third-placed sides → R16
    const thirds = tables.map((t, gi) => ({ row: t[2], group: gi }));
    const rankedThirds = rankRows(thirds.map((t) => t.row))
      .slice(0, 4)
      .map((row) => ({ teamId: row.teamId, group: thirds.find((t) => t.row.teamId === row.teamId)!.group }));
    const qualified = [
      ...tables.map((t) => t[0].teamId),
      ...tables.map((t) => t[1].teamId),
      ...rankedThirds.map((t) => t.teamId),
    ];
    if (!qualified.includes(state.userKey)) {
      state.userAlive = false;
      state.phase = "done";
      state.exit = { stage: "Group Stage", text: "Eliminated in the group stage" };
      return;
    }
    for (const [a, b] of euroR16(tables, rankedThirds)) {
      state.ties.push({ round: "Round of 16", teamA: a, teamB: b });
    }
    state.phase = "r16";
    return;
  }

  // Copa: top 2 of 3 groups + the 2 best third-placed sides, seeded 1v8 …
  const firsts = tables.map((t) => t[0]);
  const seconds = tables.map((t) => t[1]);
  const thirds = rankRows(tables.map((t) => t[2])).slice(0, 2);
  const ranked = rankRows([...firsts, ...seconds, ...thirds]).map((row) => row.teamId);
  if (!ranked.includes(state.userKey)) {
    state.userAlive = false;
    state.phase = "done";
    state.exit = { stage: "Group Stage", text: "Eliminated in the group stage" };
    return;
  }
  const pairs: [string, string][] = [
    [ranked[0], ranked[7]], [ranked[3], ranked[4]],
    [ranked[1], ranked[6]], [ranked[2], ranked[5]],
  ];
  for (const [a, b] of pairs) state.ties.push({ round: "Quarter-final", teamA: a, teamB: b });
  state.phase = "qf";
}

const ROUND_OF: Record<IntlState["phase"], KOTie["round"] | null> = {
  groups: null, r16: "Round of 16", qf: "Quarter-final", sf: "Semi-final", final: "Final", done: null,
};

/**
 * Play every tie of the current knockout round (single-leg, pens on a draw).
 * Copa's medal round plays BOTH the final and the third-place match; a Copa
 * semi-final defeat therefore doesn't end the run — the bronze final remains.
 */
export function playIntlRound(rng: Rng, state: IntlState, userPlayers?: Player[]) {
  const roundName = ROUND_OF[state.phase];
  if (!roundName) return;
  const current = state.ties.filter(
    (t) => !t.winner && (t.round === roundName || (roundName === "Final" && t.round === "Third Place")),
  );
  if (!current.length) return;

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

  const isUser = (t: KOTie) => t.teamA === state.userKey || t.teamB === state.userKey;

  if (roundName === "Final") {
    const final = current.find((t) => t.round === "Final")!;
    const third = current.find((t) => t.round === "Third Place");
    state.champion = final.winner;
    state.phase = "done";
    if (final.winner === state.userKey) {
      state.exit = { stage: "Champions", text: state.comp === "euro" ? "Champions of Europe" : "Champions of South America" };
    } else if (isUser(final)) {
      state.userAlive = false;
      state.exit = { stage: "Final", text: "Beaten in the Final" };
    } else if (third && isUser(third)) {
      state.userAlive = false;
      state.exit = third.winner === state.userKey
        ? { stage: "Third Place", text: "Bronze — third place secured" }
        : { stage: "Third Place", text: "Fourth place — beaten in the bronze final" };
    }
    return;
  }

  const userTie = current.find(isUser);
  const winners = current.map((t) => t.winner!);

  if (roundName === "Semi-final") {
    // Copa keeps its semi-final losers alive for the third-place match
    if (state.comp === "copa") {
      const losers = current.map((t) => (t.winner === t.teamA ? t.teamB : t.teamA));
      state.ties.push({ round: "Third Place", teamA: losers[0], teamB: losers[1] });
      state.ties.push({ round: "Final", teamA: winners[0], teamB: winners[1] });
      state.phase = "final";
      return;
    }
    if (userTie && userTie.winner !== state.userKey) {
      state.userAlive = false;
      state.phase = "done";
      state.exit = { stage: "Semi-final", text: "Knocked out in the Semi-final" };
      return;
    }
    state.ties.push({ round: "Final", teamA: winners[0], teamB: winners[1] });
    state.phase = "final";
    return;
  }

  // R16 (EURO) or QF: user out = run over, otherwise pair winners in order
  if (userTie && userTie.winner !== state.userKey) {
    state.userAlive = false;
    state.phase = "done";
    state.exit = { stage: roundName, text: `Knocked out in the ${roundName}` };
    return;
  }
  const nextRound: KOTie["round"] = roundName === "Round of 16" ? "Quarter-final" : "Semi-final";
  for (let i = 0; i < winners.length; i += 2) {
    state.ties.push({ round: nextRound, teamA: winners[i], teamB: winners[i + 1] });
  }
  state.phase = nextRound === "Quarter-final" ? "qf" : "sf";
}
