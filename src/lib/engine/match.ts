import type { MatchEvent, MatchResult, MatchStats, Player, ShootoutData, ShootoutKick, SimTeam } from "../types";
import type { Rng } from "../rng";
import { generateAiName } from "./names";
import { matchupEdge, type TacticId } from "../tactics";

/**
 * Advanced probabilistic match engine.
 *
 * Not a pure ratings comparison: form, tactical fit (baked into user strength),
 * home advantage, attacking/defensive split and football variance all matter.
 * A weaker side wins sometimes — that's football.
 */

export interface EngineTeamContext {
  team: SimTeam;
  form: number; // -1..1 rolling form
  /** user squad, if this is the user's team — used for scorers & ratings */
  players?: Player[] | null;
  bigMatch?: boolean;
}

function poisson(rng: Rng, lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}

/** Pick a scorer + optional assist from a real or generated roster. */
function attackers(ctx: EngineTeamContext, rng: Rng): { scorer: string; assist?: string } {
  if (ctx.players && ctx.players.length) {
    const weights = ctx.players.map((p) => {
      const w =
        p.position === "ST" || p.position === "CF" ? 10 :
        p.position === "LW" || p.position === "RW" ? 7 :
        p.position === "CAM" ? 5 :
        p.position === "CM" || p.position === "LM" || p.position === "RM" ? 3 :
        p.position === "GK" ? 0.05 : 1;
      return w * (p.overall / 80);
    });
    const total = weights.reduce((s, w) => s + w, 0);
    let r = rng() * total;
    let scorer = ctx.players[0];
    for (let i = 0; i < ctx.players.length; i++) {
      r -= weights[i];
      if (r <= 0) { scorer = ctx.players[i]; break; }
    }
    let assist: string | undefined;
    if (rng() > 0.28) {
      const others = ctx.players.filter((p) => p.id !== scorer.id && p.position !== "GK");
      assist = others[Math.floor(rng() * others.length)]?.name;
    }
    return { scorer: scorer.name, assist };
  }
  const scorer = generateAiName(rng, ctx.team.country);
  const assist = rng() > 0.3 ? generateAiName(rng, ctx.team.country) : undefined;
  return { scorer, assist };
}

export function simulateMatch(
  rng: Rng,
  home: EngineTeamContext,
  away: EngineTeamContext,
  opts: { neutral?: boolean; knockout?: boolean } = {},
): MatchResult {
  const homeAdv = opts.neutral ? 0 : 4.5;
  const hEff = home.team.strength + home.form * 3 + homeAdv + (home.bigMatch ? 1.5 : 0);
  const aEff = away.team.strength + away.form * 3 + (away.bigMatch ? 1.5 : 0);

  // Style-vs-style matchup: reading the tie right is worth a small edge —
  // more expected goals for, fewer against — bounded to ±5%. The opponent's
  // mirror edge is the negation, so it never double-counts.
  const edge = matchupEdge(home.team.tactic, away.team.tactic);
  const hMatch = 1 + edge * 0.05;
  const aMatch = 1 - edge * 0.05;

  // Expected goals from attack vs defense mismatch. Tuned to real football:
  // ~1.3 goals/side on average, mismatches nudge it a little, and blowouts are
  // rare — a dominant side wins ~3-0/4-1, not 7-0.
  const hLambda = Math.max(0.18, (1.28 + (home.team.attack - away.team.defense) * 0.026 + (hEff - aEff) * 0.012) * hMatch);
  const aLambda = Math.max(0.15, (1.05 + (away.team.attack - home.team.defense) * 0.026 + (aEff - hEff) * 0.012) * aMatch);

  // football variance: occasionally a slightly more open match
  const chaos = rng() < 0.08 ? 1.35 : 1;
  // cap each side at 5, and only rarely allow a 5th (keeps scorelines believable)
  const clampGoals = (g: number) => (g >= 5 ? (rng() < 0.35 ? 5 : 4) : g);

  // --- two-phase simulation: play the first half, read the game, then respond.
  // The first half draws ~48% of the expected goals. At the interval each side
  // makes an in-match decision from the scoreline: a trailing team commits
  // forward (more chances created, more exposed at the back — and an aggressive
  // style chases harder), a leading team manages the game. Modest and fit-gated,
  // so comebacks and upsets both stay believable; a level game is unchanged.
  const hG1 = poisson(rng, hLambda * chaos * 0.48);
  const aG1 = poisson(rng, aLambda * chaos * 0.48);
  const lead = hG1 - aG1;
  const respond = (state: "behind" | "ahead" | "level", tactic?: TacticId | null): { atk: number; def: number } => {
    if (state === "level") return { atk: 1, def: 1 };
    if (state === "ahead") return { atk: 0.95, def: 0.97 }; // game management — fewer chances, tighter at the back
    const aggressive = tactic === "gegenpress" || tactic === "direct" || tactic === "counter";
    return { atk: aggressive ? 1.24 : 1.13, def: aggressive ? 1.14 : 1.07 }; // chasing it — the more open, the more exposed
  };
  const hResp = respond(lead > 0 ? "ahead" : lead < 0 ? "behind" : "level", home.team.tactic);
  const aResp = respond(lead < 0 ? "ahead" : lead > 0 ? "behind" : "level", away.team.tactic);
  // second half ~52% of expected goals, each side's creation modulated by its
  // own response and the opponent's defensive posture (a chasing side leaks).
  const hG2 = poisson(rng, hLambda * chaos * 0.52 * hResp.atk * aResp.def);
  const aG2 = poisson(rng, aLambda * chaos * 0.52 * aResp.atk * hResp.def);

  const hGoals = clampGoals(hG1 + hG2);
  const aGoals = clampGoals(aG1 + aG2);
  // keep first-half goals, trim the (clamped) remainder from the second half
  const hFirst = Math.min(hG1, hGoals), hSecond = hGoals - hFirst;
  const aFirst = Math.min(aG1, aGoals), aSecond = aGoals - aFirst;

  // events
  const events: MatchEvent[] = [];
  const usedMinutes = new Set<number>();
  const minuteIn = (lo: number, hi: number) => {
    let m = lo + Math.floor(rng() * (hi - lo));
    while (usedMinutes.has(m)) m = lo + Math.floor(rng() * (hi - lo));
    usedMinutes.add(m);
    return m;
  };
  const minute = () => minuteIn(1, 94);

  const goalEvents = (n: number, side: EngineTeamContext, team: 0 | 1, lo: number, hi: number) => {
    for (let g = 0; g < n; g++) {
      const { scorer, assist } = attackers(side, rng);
      events.push({ minute: minuteIn(lo, hi), type: "goal", team, player: scorer, assist });
    }
  };
  goalEvents(hFirst, home, 0, 1, 45);
  goalEvents(aFirst, away, 1, 1, 45);
  goalEvents(hSecond, home, 0, 46, 94);
  goalEvents(aSecond, away, 1, 46, 94);

  const yellows: [number, number] = [0, 0];
  const reds: [number, number] = [0, 0];
  const nCards = Math.floor(rng() * 5);
  for (let c = 0; c < nCards; c++) {
    const team = (rng() > 0.5 ? 0 : 1) as 0 | 1;
    const ctx = team === 0 ? home : away;
    const name = ctx.players?.length
      ? ctx.players[Math.floor(rng() * ctx.players.length)].name
      : generateAiName(rng, ctx.team.country);
    if (rng() < 0.06 && reds[team] === 0) {
      reds[team]++;
      events.push({ minute: minute(), type: "red", team, player: name });
    } else {
      yellows[team]++;
      events.push({ minute: minute(), type: "yellow", team, player: name });
    }
  }
  if (rng() < 0.18) {
    events.push({
      minute: minute(), type: "var", team: (rng() > 0.5 ? 0 : 1) as 0 | 1,
      player: "VAR Review", note: rng() > 0.5 ? "Goal check — no offside, goal stands" : "Penalty appeal reviewed — no penalty",
    });
  }
  events.sort((a, b) => a.minute - b.minute);

  // momentum: random walk pulled toward the winner
  const bias = (hGoals - aGoals) * 0.09 + (hEff - aEff) * 0.004;
  const momentum: number[] = [];
  let m = 0;
  for (let i = 0; i < 18; i++) {
    m = Math.max(-1, Math.min(1, m + (rng() - 0.5) * 0.5 + bias * 0.35));
    momentum.push(Number(m.toFixed(2)));
  }

  // statistics
  const possBase = 50 + (hEff - aEff) * 0.55;
  const possH = Math.max(28, Math.min(72, Math.round(possBase + (rng() - 0.5) * 8)));
  const shotsH = Math.max(hGoals * 2, Math.round(6 + hLambda * 5 + rng() * 6));
  const shotsA = Math.max(aGoals * 2, Math.round(5 + aLambda * 5 + rng() * 6));
  const stats: MatchStats = {
    possession: [possH, 100 - possH],
    xg: [Number((hLambda * (0.75 + rng() * 0.5)).toFixed(2)), Number((aLambda * (0.75 + rng() * 0.5)).toFixed(2))],
    shots: [shotsH, shotsA],
    onTarget: [Math.max(hGoals, Math.round(shotsH * (0.3 + rng() * 0.2))), Math.max(aGoals, Math.round(shotsA * (0.3 + rng() * 0.2)))],
    corners: [Math.floor(rng() * 9), Math.floor(rng() * 8)],
    fouls: [8 + Math.floor(rng() * 8), 8 + Math.floor(rng() * 8)],
    yellows,
    reds,
    offsides: [Math.floor(rng() * 5), Math.floor(rng() * 5)],
    passAcc: [Math.round(78 + (possH - 50) * 0.35 + rng() * 6), Math.round(78 + (50 - possH) * 0.35 + rng() * 6)],
  };

  // man of the match: prefer a scorer from the winning side
  const winnerTeam = hGoals === aGoals ? (rng() > 0.5 ? 0 : 1) : hGoals > aGoals ? 0 : 1;
  const winnerGoals = events.filter((e) => e.type === "goal" && e.team === winnerTeam);
  const motm = winnerGoals.length
    ? winnerGoals[Math.floor(rng() * winnerGoals.length)].player
    : (winnerTeam === 0 ? home : away).players?.[0]?.name ?? generateAiName(rng, (winnerTeam === 0 ? home : away).team.country);

  return {
    home: home.team.id,
    away: away.team.id,
    homeGoals: hGoals,
    awayGoals: aGoals,
    events,
    stats,
    motm,
    momentum,
  };
}

/** Penalty shootout, returns [homePens, awayPens]. Kept for any legacy caller. */
export function shootout(rng: Rng, homeStrength: number, awayStrength: number): [number, number] {
  let h = 0;
  let a = 0;
  for (let i = 0; i < 5; i++) {
    if (rng() < 0.72 + (homeStrength - awayStrength) * 0.002) h++;
    if (rng() < 0.72 + (awayStrength - homeStrength) * 0.002) a++;
  }
  while (h === a) {
    if (rng() < 0.72) h++;
    if (rng() < 0.72) a++;
  }
  return [h, a];
}

export interface ShootoutSide {
  strength: number;
  /** real XI, if this is the user's team — drives taker order and conversion */
  players?: Player[] | null;
  country: string;
  /** goalkeeper-saving ability (0-99); defaults from strength */
  gk?: number;
}

interface Taker { name: string; skill: number }

/** How good a player is from the spot: finishing + composure, penalised for keepers. */
function penaltySkill(p: Player): number {
  if (p.position === "GK") return 20;
  const attacking = ["ST", "CF", "LW", "RW", "CAM"].includes(p.position);
  return p.attributes.shooting * 0.5 + p.overall * 0.4 + (attacking ? 6 : 0) + (p.attributes.physical - p.overall) * 0.1;
}

/**
 * Build the penalty order: best takers first (strikers, playmakers), keepers
 * and pure defenders only when sudden death forces everyone up. Real players
 * when we have them, else strength-scaled generated takers.
 */
function takerOrder(rng: Rng, side: ShootoutSide): Taker[] {
  if (side.players && side.players.length) {
    return [...side.players]
      .map((p) => ({ name: p.name, skill: penaltySkill(p) }))
      .sort((a, b) => b.skill - a.skill);
  }
  // generated: 11 takers with skill scattered around team strength
  const out: Taker[] = [];
  for (let i = 0; i < 11; i++) {
    out.push({ name: generateAiName(rng, side.country), skill: side.strength - i * 1.6 + (rng() - 0.5) * 8 });
  }
  return out.sort((a, b) => b.skill - a.skill);
}

/**
 * A full, realistic kick-by-kick shootout. Conversion depends on the taker's
 * finishing/composure vs. the opposing keeper, with early termination once a
 * result is mathematically certain, then sudden death. Deterministic per rng.
 */
export function penaltyShootout(rng: Rng, home: ShootoutSide, away: ShootoutSide): ShootoutData {
  const takers: [Taker[], Taker[]] = [takerOrder(rng, home), takerOrder(rng, away)];
  const gkSkill: [number, number] = [
    home.gk ?? home.strength - 6,
    away.gk ?? away.strength - 6,
  ];
  const kicks: ShootoutKick[] = [];
  const score: [number, number] = [0, 0];
  const idx: [number, number] = [0, 0];

  const takeKick = (team: 0 | 1, suddenDeath: boolean) => {
    const list = takers[team];
    const taker = list[idx[team] % list.length];
    idx[team]++;
    const oppGk = gkSkill[team === 0 ? 1 : 0];
    // base 75% conversion, nudged by taker skill vs keeper, plus nerves in
    // sudden death; clamped so even the best miss sometimes.
    let conv = 0.75 + (taker.skill - 78) * 0.006 - (oppGk - 78) * 0.004;
    if (suddenDeath) conv -= 0.04;
    conv = Math.max(0.42, Math.min(0.94, conv));
    const roll = rng();
    let outcome: ShootoutKick["outcome"];
    if (roll < conv) { outcome = "goal"; score[team]++; }
    else {
      const r2 = rng();
      outcome = r2 < 0.6 ? "saved" : r2 < 0.88 ? "missed" : "post";
    }
    kicks.push({ team, taker: taker.name, outcome, homeScore: score[0], awayScore: score[1], suddenDeath });
  };

  // best-of-five, with early stop once undecidable-to-catch
  const remaining = (team: 0 | 1, kicksTaken: number) => 5 - kicksTaken;
  for (let round = 0; round < 5; round++) {
    takeKick(0, false);
    // can away still catch or has home clinched?
    if (score[0] > score[1] + remaining(1, round)) break;
    takeKick(1, false);
    if (score[1] > score[0] + remaining(0, round + 1)) break;
  }

  // sudden death — both take, repeat until one leads after equal kicks
  while (score[0] === score[1]) {
    takeKick(0, true);
    takeKick(1, true);
  }

  return { kicks, home: score[0], away: score[1], winner: score[0] > score[1] ? 0 : 1 };
}
