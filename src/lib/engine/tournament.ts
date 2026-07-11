import type {
  Fixture, KORoundName, KOTie, MatchResult, Player, SimTeam, TableRow, TeamAnalysis, TournamentState,
} from "../types";
import type { Rng } from "../rng";
import { shuffle } from "../rng";
import { CLUB_REGISTRY } from "../data/clubs";
import { SQUADS } from "../players";
import { simulateMatch, shootout, type EngineTeamContext } from "./match";

export const USER_TEAM_ID = "user";

// Real seasons we hold for each club (so an AI "Real Madrid" can be a specific
// vintage like 2017). Falls back to a plausible modern year otherwise.
const CLUB_SEASONS: Record<string, number[]> = (() => {
  const m: Record<string, number[]> = {};
  for (const s of SQUADS) (m[s.club] ??= []).push(s.season);
  return m;
})();

function seasonForClub(rng: Rng, club: string): number {
  const known = CLUB_SEASONS[club];
  if (known && known.length) return known[Math.floor(rng() * known.length)];
  return 2005 + Math.floor(rng() * 21); // 2005–2025
}

/** Display label for an opponent, e.g. "Real Madrid 2017". */
export function teamLabel(team: SimTeam): string {
  return team.season ? `${team.name} ${team.season}` : team.name;
}

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
  /** small attack/defense nudge from the chosen tactical style (±2.5 max) */
  tacticAdj: { attack: number; defense: number } = { attack: 0, defense: 0 },
): TournamentState {
  const clubs = shuffle(rng, CLUB_REGISTRY).slice(0, 35);
  const teams: Record<string, SimTeam> = {};

  // The analysis overall already embeds player quality, position suitability,
  // tactic fit and experience — the tactic adds only a small stylistic nudge.
  teams[USER_TEAM_ID] = {
    id: USER_TEAM_ID,
    name: userTeamName,
    short: "YOU",
    country: "Europe",
    colors: userColors,
    strength: Math.min(99, analysis.overall + (tacticAdj.attack + tacticAdj.defense) / 2),
    attack: Math.min(99, analysis.attack + tacticAdj.attack),
    defense: Math.min(99, (analysis.defense + analysis.goalkeeper) / 2 + tacticAdj.defense),
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
      season: seasonForClub(rng, c.name),
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
  // Guaranteed fallback (circle method) — never fails, so the user can always
  // enter the league phase even if the pot-balanced attempt above didn't gel.
  return circleSchedule(rng, ids);
}

/**
 * Round-robin "circle method": always yields 8 matchdays where every team faces
 * 8 distinct opponents, with home/away alternated for balance.
 */
function circleSchedule(rng: Rng, ids: string[]): Fixture[] {
  const arr = shuffle(rng, ids);
  const n = arr.length; // 36
  const fixtures: Fixture[] = [];
  const homeCount: Record<string, number> = Object.fromEntries(arr.map((id) => [id, 0]));
  const rotation = arr.slice();
  for (let md = 1; md <= 8; md++) {
    for (let i = 0; i < n / 2; i++) {
      const a = rotation[i];
      const b = rotation[n - 1 - i];
      const home = homeCount[a] <= homeCount[b] ? a : b;
      const away = home === a ? b : a;
      homeCount[home]++;
      fixtures.push({ home, away, matchday: md });
    }
    // rotate all but the first element
    rotation.splice(1, 0, rotation.pop()!);
  }
  return fixtures;
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
  "Third Place": null, // international-only round; the club bracket never draws it
  "Final": null,
};

function ordinalWord(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Simulate the next league matchday in place. Returns the fixtures just played. */
export function playMatchday(rng: Rng, state: TournamentState, userPlayers: Player[]): Fixture[] {
  // Guard: only the league phase may play matchdays — a duplicate call after
  // the phase resolved would re-draw the play-offs and corrupt the bracket.
  if (state.phase !== "league") return [];
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
  if (state.matchday > 8 && state.ties.length === 0) resolveLeaguePhase(rng, state, userPlayers);
  return todays;
}

/**
 * Once the 8 matchdays are done, the user's fate is decided by their final
 * position — and the sim ends here if they didn't qualify. If they're through,
 * the ENTIRE knockout field is drawn (all 8 play-off ties from ranks 9-24), so
 * the bracket fills like a real broadcast graphic. The user's run still ends
 * the moment they lose a tie.
 */
function resolveLeaguePhase(rng: Rng, state: TournamentState, userPlayers: Player[]) {
  const table = computeTable(state);
  const ids = table.map((r) => r.teamId);
  const pos = ids.indexOf(USER_TEAM_ID) + 1;
  state.userSeed = pos;

  if (pos >= 25) {
    // Eliminated in the league phase — the run stops right here.
    state.userAlive = false;
    state.phase = "done";
    state.exit = { stage: "League Phase", text: `Finished ${ordinalWord(pos)} — eliminated in the league phase` };
    return;
  }
  // Swiss play-off pairings across the whole 9-24 band: 9v24, 10v23 … 16v17.
  for (let i = 0; i < 8; i++) {
    state.ties.push({ round: "Play-off", teamA: ids[8 + i], teamB: ids[23 - i] });
  }
  state.phase = "playoffs";
  void rng; void userPlayers;
}

const FINAL_VENUES = [
  "Wembley Stadium, London", "Stade de France, Paris", "Allianz Arena, Munich",
  "San Siro, Milan", "Metropolitano, Madrid", "Olympiastadion, Berlin",
  "Puskás Aréna, Budapest", "Estádio da Luz, Lisbon", "Atatürk Olympic Stadium, Istanbul",
];

export function finalVenue(rng: Rng): string {
  return FINAL_VENUES[Math.floor(rng() * FINAL_VENUES.length)];
}

const PHASE_ROUND: Record<string, KORoundName> = {
  playoffs: "Play-off", r16: "Round of 16", qf: "Quarter-final", sf: "Semi-final", final: "Final",
};

function isUserTie(t: KOTie): boolean {
  return t.teamA === USER_TEAM_ID || t.teamB === USER_TEAM_ID;
}

/** Resolve one tie in place (two legs, or a single neutral final). */
function playTie(rng: Rng, state: TournamentState, tie: KOTie, userPlayers: Player[]) {
  const user = isUserTie(tie);
  const players = user ? userPlayers : null;
  if (tie.round === "Final") {
    const result = simulateMatch(
      rng, ctx(state, tie.teamA, players, true), ctx(state, tie.teamB, players, true),
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
    if (user) trackUserStats(state, result, tie.teamA === USER_TEAM_ID ? 0 : 1, userPlayers);
    return;
  }
  const leg1 = simulateMatch(rng, ctx(state, tie.teamB, players, true), ctx(state, tie.teamA, players, true), { knockout: true });
  const leg2 = simulateMatch(rng, ctx(state, tie.teamA, players, true), ctx(state, tie.teamB, players, true), { knockout: true });
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
  if (user) {
    trackUserStats(state, leg1, tie.teamA === USER_TEAM_ID ? 1 : 0, userPlayers);
    trackUserStats(state, leg2, tie.teamA === USER_TEAM_ID ? 0 : 1, userPlayers);
  }
}

/** After a completed round, draw the next round's ties from the winners. */
function buildNextRound(state: TournamentState, played: KORoundName) {
  const winners = state.ties.filter((t) => t.round === played).map((t) => t.winner!) ;
  if (played === "Play-off") {
    // R16: league seeds 1-8 host the play-off winners — best seed vs the winner
    // that came from the lowest-ranked pairing, bracket fixed from here on.
    const table = computeTable(state);
    const seeds = table.map((r) => r.teamId).slice(0, 8);
    const reversed = [...winners].reverse();
    for (let i = 0; i < 8; i++) {
      state.ties.push({ round: "Round of 16", teamA: seeds[i], teamB: reversed[i] });
    }
    state.phase = "r16";
    return;
  }
  const nextRound = KO_NEXT[played]!.round;
  for (let i = 0; i < winners.length; i += 2) {
    state.ties.push({ round: nextRound, teamA: winners[i], teamB: winners[i + 1] });
  }
  state.phase = KO_NEXT[played]!.phase;
}

/**
 * Play EVERY tie of the current knockout round — the whole field, so the
 * bracket fills like a broadcast graphic. The user's run still ends the moment
 * their tie is lost (later rounds are never simulated), and winning the final
 * crowns them champions.
 */
export function playKnockoutStage(rng: Rng, state: TournamentState, userPlayers: Player[]): KOTie[] {
  const round = PHASE_ROUND[state.phase];
  if (!round) return [];
  const current = state.ties.filter((t) => t.round === round && !t.winner);
  if (!current.length) return [];

  for (const tie of current) playTie(rng, state, tie, userPlayers);

  const userTie = current.find(isUserTie);
  if (round === "Final") {
    const final = current[0];
    state.champion = final.winner;
    state.phase = "done";
    if (final.winner === USER_TEAM_ID) {
      state.exit = { stage: "Champions", text: "Champions of Europe" };
      computeAwards(state, userPlayers);
    } else {
      state.userAlive = false;
      state.exit = { stage: "Final", text: "Knocked out in the Final" };
    }
    return current;
  }
  if (userTie && userTie.winner !== USER_TEAM_ID) {
    // Knocked out — the run ends here; the rest of the bracket stays undrawn.
    state.userAlive = false;
    state.phase = "done";
    state.exit = { stage: round, text: `Knocked out in the ${round}` };
    return current;
  }
  buildNextRound(state, round);
  return current;
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
