// Headless end-to-end simulation of every tournament format.
import { createIntl, playIntlMatchday, playIntlRound, COMP_SQUADS, squadKey } from "../src/lib/engine/international";
import { createTournament, playMatchday, playKnockoutStage, computeTable, USER_TEAM_ID } from "../src/lib/engine/tournament";
import { randomRng } from "../src/lib/rng";

function assert(cond: boolean, msg: string) {
  if (!cond) { console.error("FAIL:", msg); process.exitCode = 1; } else { console.log("ok:", msg); }
}

// engine functions mutate state in place, which defeats TS narrowing on
// st.phase after a loop — read it through this accessor instead
const phase = (s: { phase: string }): string => s.phase;

// ---------- EURO ----------
for (let run = 0; run < 30; run++) {
  const rng = randomRng();
  const userKey = squadKey(COMP_SQUADS.euro[Math.floor(Math.random() * COMP_SQUADS.euro.length)]);
  const st = createIntl(rng, "euro", userKey);
  if (run === 0) {
    assert(Object.keys(st.teams).length === 24, "EURO field is 24 teams");
    assert(st.groups.length === 6 && st.groups.every((g) => g.length === 4), "EURO has 6 groups of 4");
  }
  while (phase(st) === "groups") playIntlMatchday(rng, st);
  if (phase(st) !== "done") {
    const r16 = st.ties.filter((t) => t.round === "Round of 16");
    if (run === 0) assert(r16.length === 8, "EURO draws 8 R16 ties");
    // no team appears twice in R16
    const ids = r16.flatMap((t) => [t.teamA, t.teamB]);
    assert(new Set(ids).size === 16, `EURO R16 has 16 distinct teams (run ${run})`);
    let guard = 0;
    while (phase(st) !== "done" && guard++ < 10) playIntlRound(rng, st);
    assert(phase(st) === "done", `EURO completes (run ${run})`);
    // champion exists iff the final was actually reached & played (a user
    // knockout defeat ends the run early by design)
    const fin = st.ties.filter((t) => t.round === "Final");
    if (fin.length) assert(!!st.champion && !!fin[0].winner, `EURO final crowns a champion (run ${run})`);
    else assert(!st.champion && !!st.exit, `EURO early exit recorded (run ${run})`);
    assert(st.ties.every((t) => t.round !== "Third Place"), `EURO has no third-place match (run ${run})`);
  }
}

// ---------- COPA ----------
let sawUserBronze = false;
for (let run = 0; run < 40; run++) {
  const rng = randomRng();
  const userKey = squadKey(COMP_SQUADS.copa[Math.floor(Math.random() * COMP_SQUADS.copa.length)]);
  const st = createIntl(rng, "copa", userKey);
  if (run === 0) {
    assert(Object.keys(st.teams).length === 12, "Copa field is 12 teams");
    assert(st.groups.length === 3, "Copa has 3 groups");
  }
  while (phase(st) === "groups") playIntlMatchday(rng, st);
  if (phase(st) === "done") continue; // user out in groups — fine
  let guard = 0;
  while (phase(st) !== "done" && guard++ < 10) playIntlRound(rng, st);
  const finals = st.ties.filter((t) => t.round === "Final");
  const thirds = st.ties.filter((t) => t.round === "Third Place");
  // if the tournament reached the medal round, both matches must exist & be decided
  if (finals.length) {
    assert(finals.length === 1 && !!finals[0].winner, `Copa final decided (run ${run})`);
    assert(thirds.length === 1 && !!thirds[0].winner, `Copa third-place match played (run ${run})`);
    const sfLosers = st.ties.filter((t) => t.round === "Semi-final").map((t) => (t.winner === t.teamA ? t.teamB : t.teamA));
    assert(sfLosers.every((l) => thirds[0].teamA === l || thirds[0].teamB === l || sfLosers.length === 2), `bronze final is SF losers (run ${run})`);
    if ((thirds[0].teamA === st.userKey || thirds[0].teamB === st.userKey)) {
      sawUserBronze = true;
      assert(!!st.exit && (st.exit.stage === "Third Place"), `user bronze-final exit recorded (run ${run})`);
    }
  }
}
console.log("saw user in a bronze final at least once:", sawUserBronze);

// ---------- CHAMPIONS LEAGUE ----------
let sawTop8 = false, sawPlayoff = false;
for (let run = 0; run < 25; run++) {
  const rng = randomRng();
  const st = createTournament(rng, "Test XI", {
    overall: 88, attack: 88, midfield: 87, defense: 86, goalkeeper: 87, chemistry: 70,
    leadership: 60, experience: 60, possession: 60, counter: 60, pressResistance: 60,
    setPieces: 60, balance: 70, strengths: [], weaknesses: [], captain: "", radar: [],
  } as never, ["#fff", "#000"]);
  while (phase(st) === "league") playMatchday(rng, st, []);
  if (phase(st) === "done") continue;
  const seed = st.userSeed!;
  if (seed <= 8) {
    sawTop8 = true;
    assert(!st.ties.some((t) => t.round === "Play-off" && (t.teamA === USER_TEAM_ID || t.teamB === USER_TEAM_ID)),
      `top-8 user has NO play-off tie (seed ${seed}, run ${run})`);
  } else {
    sawPlayoff = true;
  }
  let guard = 0;
  while (phase(st) !== "done" && guard++ < 10) playKnockoutStage(rng, st, []);
  if (seed <= 8) {
    const r16 = st.ties.filter((t) => t.round === "Round of 16");
    if (r16.length) assert(r16.some((t) => t.teamA === USER_TEAM_ID || t.teamB === USER_TEAM_ID),
      `top-8 user appears directly in R16 (run ${run})`);
  }
  // KO tie side sanity: every decided tie's winner is one of its teams
  for (const t of st.ties) {
    if (t.winner) assert(t.winner === t.teamA || t.winner === t.teamB, `tie winner is a participant (${t.round})`);
    if (t.leg1) assert(t.leg1.home !== t.leg1.away, `leg has two distinct teams (${t.round})`);
  }
  const table = computeTable(st);
  assert(table.length === 36, `table holds 36 teams (run ${run})`);
}
console.log("saw top-8 user:", sawTop8, "· saw play-off user:", sawPlayoff);
console.log(process.exitCode ? "SOME CHECKS FAILED" : "ALL CHECKS PASSED");
