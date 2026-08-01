import type { ChemLink, Formation, Player } from "@/lib/types";

/**
 * Chemistry links for the squad pitch — a presentation-layer read of the XI,
 * same spirit as broadcast.ts: derived entirely from already-known player
 * facts (club, nationality, season), never touched by or fed back into the
 * engine/store. Two players link when they're positionally close on the
 * pitch (so lines read as "these neighbours click") AND share a real bond:
 * same club, same nationality, or the same footballing era.
 */

const LINK_DISTANCE = 24; // formation coord units (0-100 grid) — "positionally close"
const ERA_WINDOW = 2; // seasons apart still counts as "the same era"

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function computeChemistryLinks(formation: Formation, players: (Player | null)[]): ChemLink[] {
  const links: ChemLink[] = [];
  for (let i = 0; i < formation.slots.length; i++) {
    const pi = players[i];
    if (!pi) continue;
    for (let j = i + 1; j < formation.slots.length; j++) {
      const pj = players[j];
      if (!pj) continue;
      if (dist(formation.slots[i], formation.slots[j]) > LINK_DISTANCE) continue;

      const reasons: string[] = [];
      let strength: ChemLink["strength"] = 0;
      if (pi.club === pj.club) { strength = 3; reasons.push(`${pi.club} teammates`); }
      else if (pi.nationality === pj.nationality) { strength = 2; reasons.push(`Both ${pi.nationality}`); }
      else if (Math.abs(pi.season - pj.season) <= ERA_WINDOW) { strength = 1; reasons.push("Same footballing era"); }

      if (strength > 0) links.push({ a: i, b: j, strength, reasons });
    }
  }
  return links;
}
