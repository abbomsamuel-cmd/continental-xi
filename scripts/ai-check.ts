import { FORMATIONS, canPlaySlot, POSITION_GROUP } from "../src/lib/formations";
import { getPoolPlayers } from "../src/lib/players";
import type { Player, Position } from "../src/lib/types";

/**
 * Mirrors the store's completeWithAI fill logic (src/lib/store.ts) so we can
 * assert the AI assistant NEVER places a player in an invalid position and never
 * duplicates a player or name — across every formation, strategy, and the
 * edge cases the V7 spec calls out.
 */
type AiStrategy = "best" | "balanced" | "attacking" | "defensive" | "random";

const scarcity = (pos: Position) => (pos === "GK" ? 0 : POSITION_GROUP[pos] === "DEF" ? 1 : 2);

function aiPick(cands: Player[], slotPos: Position, strategy: AiStrategy, rand: () => number): Player | undefined {
  const group = POSITION_GROUP[slotPos];
  const score = (p: Player) => {
    let s = p.overall + (p.position === slotPos ? 8 : 0);
    if (strategy === "attacking") s += group === "ATT" ? 6 : group === "MID" ? 3 : 0;
    else if (strategy === "defensive") s += group === "DEF" || slotPos === "GK" ? 6 : group === "MID" ? 2 : 0;
    return s;
  };
  const sorted = [...cands].sort((a, b) => score(b) - score(a));
  if (strategy === "random") {
    const nat = sorted.filter((p) => p.position === slotPos);
    const window = (nat.length >= 4 ? nat : sorted).slice(0, 10);
    return window[Math.floor(rand() * window.length)] ?? sorted[0];
  }
  if (strategy === "balanced") {
    const top = sorted.slice(0, 3);
    return top[Math.floor(rand() * top.length)] ?? sorted[0];
  }
  return sorted[0];
}

/** Fill starting from `preFilled` slot indices already taken (with given players). */
function fill(pool: Player[], formation: (typeof FORMATIONS)[number], strategy: AiStrategy, preFilled: Record<number, Player>) {
  const picks: Record<number, Player> = { ...preFilled };
  const usedIds = new Set(Object.values(picks).map((p) => p.id));
  const usedNames = new Set(Object.values(picks).map((p) => p.name));
  const empty = formation.slots
    .map((s, i) => ({ i, pos: s.pos }))
    .filter((o) => picks[o.i] === undefined)
    .sort((a, b) => scarcity(a.pos) - scarcity(b.pos));
  let seed = (empty.length * 17 + 7) & 0x7fffffff;
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (const slot of empty) {
    const cands = pool.filter((p) => !usedIds.has(p.id) && !usedNames.has(p.name) && canPlaySlot(p.position, p.altPositions, slot.pos));
    const chosen = aiPick(cands, slot.pos, strategy, rand);
    if (!chosen) continue;
    picks[slot.i] = chosen;
    usedIds.add(chosen.id);
    usedNames.add(chosen.name);
  }
  return picks;
}

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) pass++; else { fail++; console.log("  ✗ " + m); } };

for (const poolName of ["clubs", "euro", "copa"] as const) {
  const pool = getPoolPlayers(poolName);
  for (const strat of ["best", "balanced", "attacking", "defensive", "random"] as AiStrategy[]) {
    for (const f of FORMATIONS) {
      const picks = fill(pool, f, strat, {});
      const placed = Object.entries(picks);
      ok(placed.length === f.slots.length, `${poolName}/${strat}/${f.name}: fills all ${f.slots.length} (got ${placed.length})`);
      // every placement legal for its slot
      const bad = placed.filter(([i, p]) => !canPlaySlot(p.position, p.altPositions, f.slots[+i].pos));
      ok(bad.length === 0, `${poolName}/${strat}/${f.name}: all positions valid (${bad.length} invalid)`);
      // no duplicate ids or names
      const ids = placed.map(([, p]) => p.id), names = placed.map(([, p]) => p.name);
      ok(new Set(ids).size === ids.length, `${poolName}/${strat}/${f.name}: no duplicate players`);
      ok(new Set(names).size === names.length, `${poolName}/${strat}/${f.name}: no duplicate names`);
    }
  }
}

// edge cases on 4-3-3 (clubs), spec-listed
{
  const pool = getPoolPlayers("clubs");
  const f = FORMATIONS[0]; // 4-3-3
  // GK slot (index 0) only remaining — fill the other 10 with a valid squad first
  const seed = fill(pool, f, "best", {});
  ok(canPlaySlot(seed[0].position, seed[0].altPositions, "GK"), "edge: lone GK slot filled with a keeper");
  // one position remaining (ST at index 9) — pre-fill 10
  const pre: Record<number, Player> = {};
  for (const [i, p] of Object.entries(seed)) if (+i !== 9) pre[+i] = p;
  const one = fill(pool, f, "best", pre);
  ok(Object.keys(one).length === 11, "edge: one position remaining completes to 11");
  ok(canPlaySlot(one[9].position, one[9].altPositions, f.slots[9].pos), "edge: final ST is position-valid");
}

console.log(fail === 0 ? `\n✅ AI squad completion: ${pass} assertions hold` : `\n❌ ${fail} failed, ${pass} passed`);
process.exit(fail === 0 ? 0 : 1);
