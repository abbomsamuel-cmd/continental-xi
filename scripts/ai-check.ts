import { FORMATIONS, canPlaySlot, POSITION_GROUP } from "../src/lib/formations";
import { getPoolPlayers } from "../src/lib/players";
import type { Player, Position } from "../src/lib/types";

/**
 * Mirrors the store's fair completeWithAI logic (src/lib/store.ts). Asserts the
 * assistant NEVER places an invalid position or a duplicate, AND — for the fair
 * modes — keeps the XI believable: mostly 75–87, no auto 88+, ≤2 elite (86–87),
 * ≤3 from a club, a squad average in the ~79–85 band.
 */
type AiStrategy = "relaxed" | "youthful" | "experienced" | "random" | "best";
interface AiCtx { stars: number; club: Record<string, number>; nation: Record<string, number> }

const scarcity = (pos: Position) => (pos === "GK" ? 0 : POSITION_GROUP[pos] === "DEF" ? 1 : 2);
function bandScore(o: number) {
  if (o >= 78 && o <= 84) return 10;
  if (o >= 75 && o <= 77) return 7;
  if (o >= 85 && o <= 87) return 5;
  if (o >= 88) return -24;
  return 3;
}
function aiPick(cands: Player[], slotPos: Position, strategy: AiStrategy, rand: () => number, ctx: AiCtx): Player | undefined {
  if (!cands.length) return undefined;
  const clubOk = (p: Player) => (ctx.club[p.club] ?? 0) < 3;
  let pool: Player[];
  if (strategy === "best") { pool = cands.filter(clubOk); if (!pool.length) pool = cands; }
  else {
    pool = cands.filter((p) => p.overall <= 87 && !(ctx.stars >= 2 && p.overall >= 86) && clubOk(p));
    if (!pool.length) pool = cands.filter((p) => p.overall <= 87 && clubOk(p));
    if (!pool.length) pool = cands;
  }
  const natural = (p: Player) => (p.position === slotPos ? 12 : 0);
  const variety = (p: Player) => (ctx.club[p.club] ?? 0) * 3 + (ctx.nation[p.nationality] ?? 0) * 1.5;
  const score = (p: Player) => {
    if (strategy === "best") return p.overall + natural(p);
    let s = bandScore(p.overall) + natural(p) - variety(p) + rand() * 4;
    if (strategy === "youthful") s += Math.max(0, p.season - 1995) * 0.12;
    else if (strategy === "experienced") s += Math.max(0, 2005 - p.season) * 0.12;
    else if (strategy === "random") s += rand() * 9;
    return s;
  };
  return [...pool].sort((a, b) => score(b) - score(a))[0];
}
function fill(pool: Player[], formation: (typeof FORMATIONS)[number], strategy: AiStrategy, bump: number) {
  const picks: Record<number, Player> = {};
  const usedIds = new Set<string>(), usedNames = new Set<string>();
  const empty = formation.slots.map((s, i) => ({ i, pos: s.pos })).sort((a, b) => scarcity(a.pos) - scarcity(b.pos));
  let seed = (empty.length * 17 + 7 + bump) & 0x7fffffff;
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const ctx: AiCtx = { stars: 0, club: {}, nation: {} };
  for (const slot of empty) {
    const cands = pool.filter((p) => !usedIds.has(p.id) && !usedNames.has(p.name) && canPlaySlot(p.position, p.altPositions, slot.pos));
    const chosen = aiPick(cands, slot.pos, strategy, rand, ctx);
    if (!chosen) continue;
    picks[slot.i] = chosen; usedIds.add(chosen.id); usedNames.add(chosen.name);
    if (chosen.overall >= 86 && chosen.overall <= 87) ctx.stars++;
    ctx.club[chosen.club] = (ctx.club[chosen.club] ?? 0) + 1;
    ctx.nation[chosen.nationality] = (ctx.nation[chosen.nationality] ?? 0) + 1;
  }
  return picks;
}

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) pass++; else { fail++; console.log("  ✗ " + m); } };

for (const poolName of ["clubs", "euro", "copa"] as const) {
  const pool = getPoolPlayers(poolName);
  for (const strat of ["relaxed", "youthful", "experienced", "random", "best"] as AiStrategy[]) {
    for (const f of FORMATIONS) {
      const picks = fill(pool, f, strat, 0);
      const placed = Object.entries(picks);
      ok(placed.length === f.slots.length, `${poolName}/${strat}/${f.name}: fills all ${f.slots.length}`);
      ok(placed.every(([i, p]) => canPlaySlot(p.position, p.altPositions, f.slots[+i].pos)), `${poolName}/${strat}/${f.name}: all positions valid`);
      const ps = placed.map(([, p]) => p);
      ok(new Set(ps.map((p) => p.id)).size === ps.length, `${poolName}/${strat}/${f.name}: no duplicate players`);
      ok(new Set(ps.map((p) => p.name)).size === ps.length, `${poolName}/${strat}/${f.name}: no duplicate names`);
      if (strat !== "best") {
        // fair-mode guarantees
        ok(ps.filter((p) => p.overall >= 88).length === 0, `${poolName}/${strat}/${f.name}: no 88+ auto-picks`);
        ok(ps.filter((p) => p.overall >= 86 && p.overall <= 87).length <= 2, `${poolName}/${strat}/${f.name}: ≤2 elite (86–87)`);
        const clubs: Record<string, number> = {};
        ps.forEach((p) => (clubs[p.club] = (clubs[p.club] ?? 0) + 1));
        ok(Math.max(...Object.values(clubs)) <= 3, `${poolName}/${strat}/${f.name}: ≤3 from any club`);
        const avg = ps.reduce((s, p) => s + p.overall, 0) / ps.length;
        ok(avg >= 78 && avg <= 86, `${poolName}/${strat}/${f.name}: fair avg (${avg.toFixed(1)})`);
      }
    }
  }
}

// variety: two different seeds should give a meaningfully different XI (relaxed)
{
  const pool = getPoolPlayers("clubs");
  const a = fill(pool, FORMATIONS[0], "relaxed", 0);
  const b = fill(pool, FORMATIONS[0], "relaxed", 101);
  const same = Object.keys(a).filter((k) => a[+k]?.id === b[+k]?.id).length;
  ok(same < 11, `variety: regenerate changes the XI (${same}/11 identical)`);
}

console.log(fail === 0 ? `\n✅ fair AI squad completion: ${pass} assertions hold` : `\n❌ ${fail} failed, ${pass} passed`);
process.exit(fail === 0 ? 0 : 1);
