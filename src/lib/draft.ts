import type { Position, Rng } from "./draft-deps";
import { SQUADS } from "./players";
import { canPlaySlot, POSITION_GROUP } from "./formations";
import { SQUAD_DEPTH } from "./data/squads-depth";
import { weightedPick } from "./rng";

/**
 * Smart weighted squad randomization for a draft round.
 *
 * - never repeats a season already used in this draft
 * - never shows the same club in consecutive rounds
 * - down-weights clubs/leagues shown recently (variety)
 * - guarantees the offered squad actually has a sensible player for the slot
 */
export function pickDraftSquad(
  rng: Rng,
  slotPos: Position,
  usedSquadIndexes: number[],
  lastClub: string | null,
  recentClubs: string[],
  recentLeagues: string[],
): number {
  const candidates: number[] = [];
  const weights: number[] = [];

  for (let i = 0; i < SQUADS.length; i++) {
    if (usedSquadIndexes.includes(i)) continue;
    const s = SQUADS[i];
    if (lastClub && s.club === lastClub) continue;
    // must offer at least 2 eligible players for the slot (incl. depth players)
    const allPlayers = [...s.players, ...(SQUAD_DEPTH[`${s.club}|${s.season}`] ?? [])];
    const fits = allPlayers.filter(([, , pos, , alts = []]) => canPlaySlot(pos, alts, slotPos));
    if (fits.length < 2 && !(slotPos === "GK" && fits.length >= 1)) continue;

    let w = 10;
    // variety: punish recently seen clubs and leagues
    const clubIdx = recentClubs.indexOf(s.club);
    if (clubIdx >= 0) w *= 0.25 + 0.15 * clubIdx;
    const leagueSeen = recentLeagues.filter((l) => l === s.league).length;
    w *= Math.pow(0.72, leagueSeen);
    // slight boost for squads with a natural fit at the slot
    const naturals = s.players.filter(([, , pos, , alts = []]) => pos === slotPos || alts.includes(slotPos));
    if (naturals.length >= 2) w *= 1.35;
    candidates.push(i);
    weights.push(w);
  }

  if (candidates.length === 0) {
    // fallback: relax the consecutive-club rule
    for (let i = 0; i < SQUADS.length; i++) {
      if (!usedSquadIndexes.includes(i)) candidates.push(i);
    }
    return candidates[Math.floor(rng() * candidates.length)];
  }
  return weightedPick(rng, candidates, weights);
}

/** Order in which formation slots are drafted: GK last-ish feels wrong; go ATT → MID → DEF → GK randomised lightly. */
export function draftOrder(rng: Rng, slotPositions: Position[]): number[] {
  const indexed = slotPositions.map((pos, i) => ({ pos, i }));
  const rank: Record<string, number> = { ATT: 0, MID: 1, DEF: 2, GK: 3 };
  return indexed
    .map((s) => ({ ...s, key: rank[POSITION_GROUP[s.pos]] + rng() * 0.8 }))
    .sort((a, b) => a.key - b.key)
    .map((s) => s.i);
}
