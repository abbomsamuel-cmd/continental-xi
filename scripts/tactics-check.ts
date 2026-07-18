import {
  TACTICS, matchupEdge, matchupAttackMult, tacticFit, tacticFitBand,
  tacticFitReasons, tacticMatchupSummary, pickAiTactic, hash01, type TacticId,
} from "../src/lib/tactics";
import { analyzeTeam } from "../src/lib/analysis";
import { simulateMatch, type EngineTeamContext } from "../src/lib/engine/match";
import { FORMATIONS, canPlaySlot } from "../src/lib/formations";
import { getPoolPlayers } from "../src/lib/players";
import { seededRng } from "../src/lib/rng";
import type { Player, SimTeam } from "../src/lib/types";

/**
 * Part 4 — tactics engine. Asserts the style-vs-style matchup is a consistent,
 * bounded ±5% (antisymmetric, right rivalries), the Base Squad OVR stays
 * genuinely tactic-INDEPENDENT, Tactical Fit + explanations behave, AI styles
 * are valid & deterministic, and the two-phase match engine stays believable
 * and deterministic while the matchup pushes results the correct way.
 */

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) pass++; else { fail++; console.log("  ✗ " + m); } };

const IDS = TACTICS.map((t) => t.id);

/* ---- 1. matchup is antisymmetric, bounded, and has the right rivalries ---- */
for (const a of IDS) for (const b of IDS) {
  const e = matchupEdge(a, b);
  ok(e >= -1 && e <= 1, `edge in range for ${a} vs ${b} (${e})`);
  ok(Math.abs(e + matchupEdge(b, a)) < 1e-9, `edge antisymmetric ${a}/${b}`);
  const mult = matchupAttackMult(a, b);
  ok(mult >= 0.95 - 1e-9 && mult <= 1.05 + 1e-9, `attack mult within ±5% ${a}/${b} (${mult})`);
}
for (const a of IDS) {
  ok(matchupEdge(a, a) === 0, `no edge vs mirror (${a})`);
  ok(matchupEdge(a, "balanced") === 0 && matchupEdge("balanced", a) === 0, `balanced is neutral vs ${a}`);
}
// the football rock/paper/scissors the design promises
ok(matchupEdge("counter", "possession") > 0, "counter beats possession");
ok(matchupEdge("gegenpress", "possession") > 0, "gegenpress beats slow build-up");
ok(matchupEdge("defensive", "counter") > 0, "a low block smothers the counter");
ok(matchupEdge("direct", "gegenpress") > 0, "direct bypasses the press");
ok(matchupEdge("possession", "counter") < 0, "possession is exposed to the counter");

/* ---- 2. fit bands + explanation helpers ---- */
ok(tacticFitBand(95).band === "Excellent", "band 95 = Excellent");
ok(tacticFitBand(85).band === "Strong", "band 85 = Strong");
ok(tacticFitBand(75).band === "Functional", "band 75 = Functional");
ok(tacticFitBand(65).band === "Weak", "band 65 = Weak");
ok(tacticFitBand(50).band === "Poor", "band 50 = Poor");
for (const t of IDS) {
  const s = tacticMatchupSummary(t);
  ok(!s.beats.includes(TACTICS.find((x) => x.id === t)!.name), `summary never lists self as beaten (${t})`);
}

/* ---- 3. deterministic AI style assignment ---- */
for (let i = 0; i < 500; i++) {
  const r = i / 500;
  const t = pickAiTactic(60 + (i % 40), 60 + ((i * 7) % 40), r);
  ok(IDS.includes(t), `pickAiTactic returns a valid style (r=${r.toFixed(3)})`);
}
ok(hash01("Brazil|2002") === hash01("Brazil|2002"), "hash01 is deterministic");
ok(hash01("a") >= 0 && hash01("a") < 1, "hash01 in [0,1)");
ok(pickAiTactic(90, 60, 0.1) === "gegenpress", "attacking side leans aggressive");
ok(pickAiTactic(60, 90, 0.1) === "defensive", "defensive side leans defensive");

/* ---- 4. build a real XI and check Base OVR is tactic-INDEPENDENT ---- */
function buildXI(pool: Player[], f: (typeof FORMATIONS)[number]): (Player | null)[] {
  const used = new Set<string>();
  return f.slots.map((slot) => {
    const p = pool.find((q) => !used.has(q.id) && canPlaySlot(q.position, q.altPositions, slot.pos));
    if (p) used.add(p.id);
    return p ?? null;
  });
}
{
  const pool = [...getPoolPlayers("clubs")].sort((a, b) => b.overall - a.overall);
  const f = FORMATIONS[0];
  const xi = buildXI(pool, f);
  const base = analyzeTeam(f, xi, null).overall;
  for (const t of IDS) {
    ok(analyzeTeam(f, xi, t).overall === base, `Base OVR unchanged by tactic ${t} (${base})`);
    const fit = tacticFit(t, f, xi);
    ok(fit >= 40 && fit <= 99, `tacticFit in range for ${t} (${fit})`);
    ok(analyzeTeam(f, xi, t).breakdown.tacticFit === fit, `breakdown.tacticFit matches tacticFit (${t})`);
    const reasons = tacticFitReasons(t, f, xi);
    ok(reasons.length <= 3 && reasons.every((r) => r.startsWith("＋") || r.startsWith("－")), `reasons well-formed (${t})`);
  }
}

/* ---- 5. two-phase engine: valid, deterministic, and matchup-directional ---- */
function team(id: string, strength: number, tactic?: TacticId): SimTeam {
  return { id, name: id, short: id.slice(0, 3).toUpperCase(), country: "Test", colors: ["#fff", "#000"], strength, attack: strength, defense: strength, isUser: false, pot: 0, tactic };
}
function ctx(t: SimTeam): EngineTeamContext { return { team: t, form: 0, players: null }; }

// determinism: same seed + same teams ⇒ identical scoreline
{
  const A = team("A", 80, "counter"), B = team("B", 80, "possession");
  const r1 = simulateMatch(seededRng("x"), ctx(A), ctx(B));
  const r2 = simulateMatch(seededRng("x"), ctx(A), ctx(B));
  ok(r1.homeGoals === r2.homeGoals && r1.awayGoals === r2.awayGoals, "engine deterministic per seed");
}

// scorelines stay believable across a large batch, and goal minutes respect the half
{
  let bad = 0, badHalf = 0; const n = 4000;
  for (let i = 0; i < n; i++) {
    const A = team("A", 74 + (i % 20), pickAiTactic(80, 70, (i % 100) / 100));
    const B = team("B", 74 + ((i * 3) % 20), pickAiTactic(70, 80, ((i * 7) % 100) / 100));
    const r = simulateMatch(seededRng(`m${i}`), ctx(A), ctx(B), { knockout: i % 2 === 0 });
    if (r.homeGoals < 0 || r.homeGoals > 5 || r.awayGoals < 0 || r.awayGoals > 5 || Number.isNaN(r.homeGoals)) bad++;
    for (const e of r.events) if (e.type === "goal" && (e.minute < 1 || e.minute > 93)) badHalf++;
  }
  ok(bad === 0, `all ${n} scorelines within 0–5 (bad=${bad})`);
  ok(badHalf === 0, `all goal minutes in 1–93 (bad=${badHalf})`);
}

// directional: over many games, counter outscores possession more often than the reverse
{
  const sample = (aT: TacticId, bT: TacticId) => {
    let aGoals = 0;
    for (let i = 0; i < 3000; i++) {
      const A = team("A", 80, aT), B = team("B", 80, bT);
      const r = simulateMatch(seededRng(`s${aT}${bT}${i}`), ctx(A), ctx(B), { neutral: true });
      aGoals += r.homeGoals;
    }
    return aGoals;
  };
  const counterFor = sample("counter", "possession");
  const possFor = sample("possession", "counter");
  ok(counterFor > possFor, `counter (${counterFor}) outscores possession (${possFor}) with the matchup edge`);
}

console.log(fail === 0 ? `\n✅ tactics engine: ${pass} assertions hold` : `\n❌ ${fail} failed, ${pass} passed`);
process.exit(fail === 0 ? 0 : 1);
