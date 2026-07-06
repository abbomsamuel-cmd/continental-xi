import type { MatchEvent, MatchResult, MatchStats, Player, SimTeam } from "../types";
import type { Rng } from "../rng";
import { generateAiName } from "./names";

/**
 * Advanced probabilistic match engine.
 *
 * Not a pure ratings comparison: form, chemistry (baked into user strength),
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

  // Expected goals from attack vs defense mismatch. Tuned to real football:
  // ~1.3 goals/side on average, mismatches nudge it a little, and blowouts are
  // rare — a dominant side wins ~3-0/4-1, not 7-0.
  const hLambda = Math.max(0.18, 1.28 + (home.team.attack - away.team.defense) * 0.026 + (hEff - aEff) * 0.012);
  const aLambda = Math.max(0.15, 1.05 + (away.team.attack - home.team.defense) * 0.026 + (aEff - hEff) * 0.012);

  // football variance: occasionally a slightly more open match
  const chaos = rng() < 0.08 ? 1.35 : 1;
  // cap each side at 5, and only rarely allow a 5th (keeps scorelines believable)
  const clampGoals = (g: number) => (g >= 5 ? (rng() < 0.35 ? 5 : 4) : g);
  const hGoals = clampGoals(poisson(rng, hLambda * chaos));
  const aGoals = clampGoals(poisson(rng, aLambda * chaos));

  // events
  const events: MatchEvent[] = [];
  const usedMinutes = new Set<number>();
  const minute = () => {
    let m = 1 + Math.floor(rng() * 93);
    while (usedMinutes.has(m)) m = 1 + Math.floor(rng() * 93);
    usedMinutes.add(m);
    return m;
  };

  for (let g = 0; g < hGoals; g++) {
    const { scorer, assist } = attackers(home, rng);
    events.push({ minute: minute(), type: "goal", team: 0, player: scorer, assist });
  }
  for (let g = 0; g < aGoals; g++) {
    const { scorer, assist } = attackers(away, rng);
    events.push({ minute: minute(), type: "goal", team: 1, player: scorer, assist });
  }

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

/** Penalty shootout, returns [homePens, awayPens]. */
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
