import type {
  Fixture, KORoundName, KOTie, MatchResult, Player, SimTeam, TableRow, TeamAnalysis, TournamentState,
} from "../types";
import type { Rng } from "../rng";
import { shuffle, weightedPick } from "../rng";
import { CLUB_REGISTRY } from "../data/clubs";
import { simulateMatch, shootout, type EngineTeamContext } from "./match";

export const USER_TEAM_ID = "user";

function shortCode(name: string): string {
  const words = name.split(/\s+/).filter((w) => !["FC", "CF", "de", "La"].includes(w));
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}

/** Build the 36-team field: the user squad + 35 registry clubs, seeded into 4 pots of 9. */
export function createTournament(
  rng: Rng,
  userTeamName: string,
  analysis: TeamAnalysis,
  userColors: [string, string],
): TournamentState {
  const clubs = shuffle(rng, CLUB_REGISTRY).slice(0, 35);
  const teams: Record<string, SimTeam> = {};

  // user strength: overall carries most weight, chemistry is a real multiplier
  const chemBonus = (analysis.chemistry - 50) * 0.1;
  const userStrength = Math.min(99, analysis.overall + chemBonus);
  teams[USER_TEAM_ID] = {
    id: USER_TEAM_ID,
    name: userTeamName,
    short: "YOU",
    country: "Europe",
    colors: userColors,
    strength: userStrength,
    attack: Math.min(99, analysis.attack + chemBonus),
    defense: Math.min(99, (analysis.defense + analysis.goalkeeper) / 2 + chemBonus),
    isUser: true,
    pot: 1,
  };

  for (const c of clubs) {
    const noise = (rng() - 0.5) * 6; // this season's form
    const strength = Math.max(45, Math.min(97, c.coeff + noise));
    teams[c.name] = {
      id: c.name,
      name: c.name,
      short: shortCode(c.name),
      country: c.country,
      colors: c.colors,
      strength,
      attack: Math.max(40, strength + (rng() - 0.5) * 8),
      defense: Math.max(40, strength + (rng() - 0.5) * 8),
      isUser: false,
      pot: 0,
    };
  }

  // seed pots by strength
  const sorted = Object.values(teams).sort((a, b) => b.strength - a.strength);
  sorted.forEach((t, i) => { t.pot = Math.floor(i / 9) + 1; });

  const fixtures = buildSwissSchedule(rng, Object.keys(teams), teams);

  return {
    phase: "league",
    teams,
    fixtures,
    matchday: 1,
    ties: [],
    userAlive: true,
    userGoals: {},
    userAssists: {},
    userCleanSheets: 0,
  };
}

/**
 * Swiss-model league phase schedule: 36 teams, 8 matchdays, 18 matches each,
 * no repeated pairings, home/away balanced (target 4/4), pot-aware pairing so
 * every team faces a realistic spread of seeds.
 */
export function buildSwissSchedule(rng: Rng, ids: string[], teams: Record<string, SimTeam>): Fixture[] {
  for (let attempt = 0; attempt < 60; attempt++) {
    const played = new Set<string>(); // "a|b" sorted
    const homeCount: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
    const potFaced: Record<string, Record<number, number>> = Object.fromEntries(
      ids.map((id) => [id, { 1: 0, 2: 0, 3: 0, 4: 0 }]),
    );
    const fixtures: Fixture[] = [];
    let failed = false;

    for (let md = 1; md <= 8 && !failed; md++) {
      let roundOk = false;
      for (let tryRound = 0; tryRound < 40 && !roundOk; tryRound++) {
        const pool = shuffle(rng, ids);
        const roundPairs: [string, string][] = [];
        const used = new Set<string>();
        for (const a of pool) {
          if (used.has(a)) continue;
          // candidates: unplayed pairs, prefer pots this team still needs
          const cands = pool.filter((b) => {
            if (b === a || used.has(b)) return false;
            const key = [a, b].sort().join("|");
            if (played.has(key)) return false;
            return true;
          });
          if (!cands.length) { roundPairs.length = 0; break; }
          cands.sort((x, y) => {
            const nx = potFaced[a][teams[x].pot] + potFaced[x][teams[a].pot];
            const ny = potFaced[a][teams[y].pot] + potFaced[y][teams[a].pot];
            return nx - ny || rng() - 0.5;
          });
          const b = cands[0];
          used.add(a); used.add(b);
          roundPairs.push([a, b]);
        }
        if (roundPairs.length === ids.length / 2) {
          for (const [a, b] of roundPairs) {
            played.add([a, b].sort().join("|"));
            potFaced[a][teams[b].pot]++;
            potFaced[b][teams[a].pot]++;
            // home/away balance
            const home = homeCount[a] <= homeCount[b] ? a : b;
            const away = home === a ? b : a;
            homeCount[home]++;
            fixtures.push({ home, away, matchday: md });
          }
          roundOk = true;
        }
      }
      if (!roundOk) failed = true;
    }
    if (!failed) return fixtures;
  }
  throw new Error("Could not build a valid league-phase schedule");
}

// ---- table ----

export function computeTable(state: TournamentState): TableRow[] {
  const rows: Record<string, TableRow> = {};
  for (const id of Object.keys(state.teams)) {
    rows[id] = { teamId: id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0, form: [] };
  }
  const playedFixtures = state.fixtures
    .filter((f) => f.result)
    .sort((a, b) => a.matchday - b.matchday);
  for (const f of playedFixtures) {
    const r = f.result!;
    const h = rows[f.home];
    const a = rows[f.away];
    h.played++; a.played++;
    h.gf += r.homeGoals; h.ga += r.awayGoals;
    a.gf += r.awayGoals; a.ga += r.homeGoals;
    if (r.homeGoals > r.awayGoals) { h.won++; a.lost++; h.points += 3; h.form.push("W"); a.form.push("L"); }
    else if (r.homeGoals < r.awayGoals) { a.won++; h.lost++; a.points += 3; a.form.push("W"); h.form.push("L"); }
    else { h.drawn++; a.drawn++; h.points++; a.points++; h.form.push("D"); a.form.push("D"); }
  }
  for (const id of Object.keys(rows)) rows[id].form = rows[id].form.slice(-5);
  return Object.values(rows).sort(
    (x, y) =>
      y.points - x.points ||
      (y.gf - y.ga) - (x.gf - x.ga) ||
      y.gf - x.gf ||
      x.teamId.localeCompare(y.teamId),
  );
}

function formOf(state: TournamentState, teamId: string): number {
  const results = state.fixtures
    .filter((f) => f.result && (f.home === teamId || f.away === teamId))
    .slice(-3);
  let form = 0;
  for (const f of results) {
    const r = f.result!;
    const isHome = f.home === teamId;
    const gf = isHome ? r.homeGoals : r.awayGoals;
    const ga = isHome ? r.awayGoals : r.homeGoals;
    form += gf > ga ? 0.33 : gf === ga ? 0 : -0.33;
  }
  return form;
}

function trackUserStats(state: TournamentState, result: MatchResult, userSide: 0 | 1, userPlayers: Player[]) {
  const conceded = userSide === 0 ? result.awayGoals : result.homeGoals;
  if (conceded === 0) state.userCleanSheets++;
  for (const e of result.events) {
    if (e.type !== "goal" || e.team !== userSide) continue;
    state.userGoals[e.player] = (state.userGoals[e.player] ?? 0) + 1;
    if (e.assist) state.userAssists[e.assist] = (state.userAssists[e.assist] ?? 0) + 1;
  }
  void userPlayers;
}

function ctx(state: TournamentState, teamId: string, userPlayers: Player[] | null, bigMatch = false): EngineTeamContext {
  return {
    team: state.teams[teamId],
    form: formOf(state, teamId),
    players: teamId === USER_TEAM_ID ? userPlayers : null,
    bigMatch,
  };
}

// The user's road: which round follows which, and the matching phase key.
const KO_NEXT: Record<KORoundName, { round: KORoundName; phase: TournamentState["phase"] } | null> = {
  "Play-off": { round: "Round of 16", phase: "r16" },
  "Round of 16": { round: "Quarter-final", phase: "qf" },
  "Quarter-final": { round: "Semi-final", phase: "sf" },
  "Semi-final": { round: "Final", phase: "final" },
  "Final": null,
};

function ordinalWord(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Simulate the next league matchday in place. Returns the fixtures just played. */
export function playMatchday(rng: Rng, state: TournamentState, userPlayers: Player[]): Fixture[] {
  const table = computeTable(state);
  state.prevPositions = Object.fromEntries(table.map((r, i) => [r.teamId, i + 1]));

  const todays = state.fixtures.filter((f) => f.matchday === state.matchday && !f.result);
  for (const f of todays) {
    const result = simulateMatch(rng, ctx(state, f.home, userPlayers), ctx(state, f.away, userPlayers));
    f.result = result;
    if (f.home === USER_TEAM_ID) trackUserStats(state, result, 0, userPlayers);
    if (f.away === USER_TEAM_ID) trackUserStats(state, result, 1, userPlayers);
  }
  state.matchday++;
  if (state.matchday > 8) resolveLeaguePhase(rng, state, userPlayers);
  return todays;
}

/**
 * Once the 8 matchdays are done, the user's fate is decided by their final
 * position — and the sim ends here if they didn't qualify. Only the user's
 * onward path is ever simulated (38-0 / 48-0 style).
 */
function resolveLeaguePhase(rng: Rng, state: TournamentState, userPlayers: Player[]) {
  const table = computeTable(state);
  const ids = table.map((r) => r.teamId);
  const pos = ids.indexOf(USER_TEAM_ID) + 1;
  state.userSeed = pos;
  state.faced = [];

  if (pos >= 25) {
    // Eliminated in the league phase — the run stops right here.
    state.userAlive = false;
    state.phase = "done";
    state.exit = { stage: "League Phase", text: `Finished ${ordinalWord(pos)} — eliminated in the league phase` };
    return;
  }
  if (pos <= 8) {
    state.phase = "r16";
    openUserTie(rng, state, "Round of 16");
  } else {
    state.phase = "playoffs";
    openUserTie(rng, state, "Play-off");
  }
  void userPlayers;
}

/** Pick a realistic opponent for the user's next tie. */
function pickOpponent(rng: Rng, state: TournamentState, round: KORoundName): string {
  const table = computeTable(state);
  const ids = table.map((r) => r.teamId);
  const userPos = ids.indexOf(USER_TEAM_ID) + 1;
  const faced = new Set(state.faced ?? []);
  const avail = (band: string[]) => band.filter((id) => id !== USER_TEAM_ID && !faced.has(id));

  if (round === "Play-off") {
    // Swiss play-off pairing: 9v24, 10v23, 11v22 ... => opponent seed = 33 - pos
    const oppPos = 33 - userPos;
    const cand = ids[oppPos - 1];
    if (cand && cand !== USER_TEAM_ID && !faced.has(cand)) return cand;
  }
  if (round === "Round of 16") {
    // Top-8 seeds face a side from the 9-24 band; play-off qualifiers face a top-8 seed.
    const band = userPos <= 8 ? ids.slice(8, 24) : ids.slice(0, 8);
    const pool = avail(band);
    if (pool.length) return weightedPick(rng, pool, pool.map((id) => state.teams[id].strength));
  }
  // QF onwards: the deeper you go, the stronger the field you face.
  const depth = round === "Quarter-final" ? 12 : round === "Semi-final" ? 8 : 4;
  let pool = avail(ids.slice(0, depth));
  if (!pool.length) pool = avail(ids.slice(0, 24));
  if (!pool.length) pool = avail(ids);
  return weightedPick(rng, pool, pool.map((id) => state.teams[id].strength * state.teams[id].strength));
}

function openUserTie(rng: Rng, state: TournamentState, round: KORoundName) {
  const opp = pickOpponent(rng, state, round);
  state.faced = [...(state.faced ?? []), opp];
  state.ties.push({ round, teamA: USER_TEAM_ID, teamB: opp });
}

const FINAL_VENUES = [
  "Wembley Stadium, London", "Stade de France, Paris", "Allianz Arena, Munich",
  "San Siro, Milan", "Metropolitano, Madrid", "Olympiastadion, Berlin",
  "Puskás Aréna, Budapest", "Estádio da Luz, Lisbon", "Atatürk Olympic Stadium, Istanbul",
];

export function finalVenue(rng: Rng): string {
  return FINAL_VENUES[Math.floor(rng() * FINAL_VENUES.length)];
}

/**
 * Play the user's next knockout tie (two legs, or a single neutral final).
 * Win → advance to the next round. Lose → the run is over immediately.
 */
export function playKnockoutStage(rng: Rng, state: TournamentState, userPlayers: Player[]): KOTie[] {
  const tie = state.ties.find((t) => !t.winner);
  if (!tie) return [];
  const isFinal = tie.round === "Final";

  if (isFinal) {
    const result = simulateMatch(
      rng, ctx(state, tie.teamA, userPlayers, true), ctx(state, tie.teamB, userPlayers, true),
      { neutral: true, knockout: true },
    );
    if (result.homeGoals === result.awayGoals) {
      const [hp, ap] = shootout(rng, state.teams[tie.teamA].strength, state.teams[tie.teamB].strength);
      result.penalties = [hp, ap];
      tie.winner = hp > ap ? tie.teamA : tie.teamB;
    } else {
      tie.winner = result.homeGoals > result.awayGoals ? tie.teamA : tie.teamB;
    }
    tie.leg1 = result;
    trackUserStats(state, result, tie.teamA === USER_TEAM_ID ? 0 : 1, userPlayers);
  } else {
    const leg1 = simulateMatch(rng, ctx(state, tie.teamB, userPlayers, true), ctx(state, tie.teamA, userPlayers, true), { knockout: true });
    const leg2 = simulateMatch(rng, ctx(state, tie.teamA, userPlayers, true), ctx(state, tie.teamB, userPlayers, true), { knockout: true });
    tie.leg1 = leg1;
    tie.leg2 = leg2;
    const aGoals = leg1.awayGoals + leg2.homeGoals;
    const bGoals = leg1.homeGoals + leg2.awayGoals;
    if (aGoals === bGoals) {
      const [hp, ap] = shootout(rng, state.teams[tie.teamA].strength, state.teams[tie.teamB].strength);
      leg2.penalties = [hp, ap];
      tie.winner = hp > ap ? tie.teamA : tie.teamB;
    } else {
      tie.winner = aGoals > bGoals ? tie.teamA : tie.teamB;
    }
    trackUserStats(state, leg1, tie.teamA === USER_TEAM_ID ? 1 : 0, userPlayers);
    trackUserStats(state, leg2, tie.teamA === USER_TEAM_ID ? 0 : 1, userPlayers);
  }

  if (tie.winner !== USER_TEAM_ID) {
    // Knocked out — the run ends here, no further simulation.
    state.userAlive = false;
    state.phase = "done";
    state.exit = { stage: tie.round, text: `Knocked out in the ${tie.round}` };
    return [tie];
  }

  const next = KO_NEXT[tie.round];
  if (!next) {
    // Won the final — champions of Europe.
    state.champion = USER_TEAM_ID;
    state.phase = "done";
    state.exit = { stage: "Champions", text: "Champions of Europe" };
    computeAwards(state, userPlayers);
    return [tie];
  }
  state.phase = next.phase;
  openUserTie(rng, state, next.round);
  return [tie];
}

function computeAwards(state: TournamentState, userPlayers: Player[]) {
  const topUserScorer = Object.entries(state.userGoals).sort((a, b) => b[1] - a[1])[0];
  const topUserAssist = Object.entries(state.userAssists).sort((a, b) => b[1] - a[1])[0];
  const gk = userPlayers.find((p) => p.position === "GK");
  state.awards = {
    goldenBall: topUserScorer?.[0] ?? topUserAssist?.[0] ?? userPlayers[0]?.name ?? "—",
    goldenBoot: topUserScorer?.[0] ?? "—",
    goldenGlove: gk?.name ?? "—",
    topScorerGoals: topUserScorer?.[1] ?? 0,
  };
}

export function qualificationBand(pos: number): "direct" | "playoff" | "out" {
  if (pos <= 8) return "direct";
  if (pos <= 24) return "playoff";
  return "out";
}
