import type { ChemLink, Formation, Player } from "./types";
import { PARTNERSHIPS } from "./data/partnerships";
import { eraOf } from "./players";

/** Two slots are "adjacent" on the pitch if within this normalized distance. */
const LINK_DIST = 34;

function slotDistance(f: Formation, a: number, b: number): number {
  const sa = f.slots[a];
  const sb = f.slots[b];
  // pitch is taller than wide; weight y a bit less so lines link laterally
  return Math.hypot(sa.x - sb.x, (sa.y - sb.y) * 0.82);
}

export function isPartnership(a: Player, b: Player): string | null {
  for (const p of PARTNERSHIPS) {
    if (p.players.includes(a.name) && p.players.includes(b.name) && a.name !== b.name) return p.label;
  }
  return null;
}

/** Chemistry between two players, 0-3 plus reasons. */
export function pairChemistry(a: Player, b: Player): { strength: 0 | 1 | 2 | 3; reasons: string[] } {
  let pts = 0;
  const reasons: string[] = [];

  if (a.club === b.club && a.season === b.season) {
    pts += 3;
    reasons.push(`Teammates — ${a.club} ${a.seasonLabel}`);
  } else if (a.club === b.club) {
    pts += 2;
    reasons.push(`Same club, different eras (${a.club})`);
  }
  if (a.nationality === b.nationality) {
    pts += 1.5;
    reasons.push(`Same nation (${a.nationality})`);
  }
  // Shared league links — but a whole international tournament isn't a "league",
  // otherwise every pair in an EURO/Copa draft would get the bonus for free.
  if (a.league === b.league && a.league !== "EURO" && a.league !== "Copa América") {
    pts += 1;
    reasons.push(`Same league (${a.league})`);
  }
  if (a.coach === b.coach && a.club !== b.club) {
    pts += 1;
    reasons.push(`Shared manager (${a.coach})`);
  }
  if (eraOf(a.season) === eraOf(b.season) && a.club !== b.club) {
    pts += 0.75;
    reasons.push(`Same era (${eraOf(a.season)})`);
  }
  const partner = isPartnership(a, b);
  if (partner) {
    pts += 3;
    reasons.unshift(`Historic partnership — ${partner}`);
  }

  const strength = pts >= 4.5 ? 3 : pts >= 2.5 ? 2 : pts >= 1 ? 1 : 0;
  return { strength: strength as 0 | 1 | 2 | 3, reasons };
}

export interface ChemistryResult {
  links: ChemLink[];
  perSlot: number[]; // 0-10 per slot
  total: number; // 0-100 team chemistry
  partnerships: string[];
}

export function computeChemistry(formation: Formation, players: (Player | null)[]): ChemistryResult {
  const links: ChemLink[] = [];
  const perSlot = new Array(formation.slots.length).fill(0);
  const partnerships = new Set<string>();

  for (let i = 0; i < formation.slots.length; i++) {
    for (let j = i + 1; j < formation.slots.length; j++) {
      const a = players[i];
      const b = players[j];
      if (!a || !b) continue;
      if (slotDistance(formation, i, j) > LINK_DIST) continue;
      const { strength, reasons } = pairChemistry(a, b);
      const partner = isPartnership(a, b);
      if (partner) partnerships.add(partner);
      links.push({ a: i, b: j, strength, reasons });
      perSlot[i] += strength;
      perSlot[j] += strength;
    }
  }

  // normalize per-slot to 0-10
  const normSlot = perSlot.map((v) => Math.min(10, Math.round((v / 7.5) * 10)));
  const filled = players.filter(Boolean).length;
  const raw = normSlot.reduce((s, v) => s + v, 0) / Math.max(1, filled);
  const total = Math.min(100, Math.round(raw * 10 + partnerships.size * 3));

  return { links, perSlot: normSlot, total, partnerships: [...partnerships] };
}
