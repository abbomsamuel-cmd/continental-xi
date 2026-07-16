import type { Player } from "./types";

// Hidden cosmetic emblems — "easter eggs" a manager discovers by fielding a
// particular XI, never announced up front. They're purely decorative: they
// unlock a badge in the profile and a small celebration, and never touch the
// simulation. Most are found by assembling a famous club core or trio; a few
// reward a legendary captain or a flawless champion side.

export type EggTier = "core" | "trio" | "honour";

export interface EasterEgg {
  id: string;
  name: string;
  icon: string;
  /** revealed only once discovered */
  description: string;
  /** cryptic nudge shown while the emblem is still locked */
  hint: string;
  tier: EggTier;
}

export const EASTER_EGGS: EasterEgg[] = [
  { id: "blaugrana", name: "Blaugrana Legacy", icon: "🔵🔴", tier: "core",
    description: "Field four or more Barcelona legends in one XI.",
    hint: "Some cities bleed one club. Fill your XI from the Camp Nou." },
  { id: "blancos", name: "Los Blancos", icon: "⚪", tier: "core",
    description: "Field four or more Real Madrid legends in one XI.",
    hint: "All white, all conquering — build a side from the Bernabéu." },
  { id: "invincibles", name: "The Invincibles", icon: "🛡️", tier: "core",
    description: "Field four or more Arsenal legends in one XI.",
    hint: "A season unbeaten. Draft the red-and-white of North London." },
  { id: "mia-san-mia", name: "Mia San Mia", icon: "🔴", tier: "core",
    description: "Field four or more Bayern Munich legends in one XI.",
    hint: "We are who we are — assemble the Bavarian machine." },
  { id: "rossoneri", name: "Rossoneri Royalty", icon: "❤️", tier: "core",
    description: "Field four or more Milan legends in one XI.",
    hint: "Red and black stripes ruled Europe. Draft the San Siro." },
  { id: "samba", name: "Samba Kings", icon: "🇧🇷", tier: "core",
    description: "Field four or more Brazilian legends in one XI.",
    hint: "O jogo bonito. Fill your XI with yellow shirts." },
  { id: "albiceleste", name: "La Albiceleste", icon: "🇦🇷", tier: "core",
    description: "Field four or more Argentine legends in one XI.",
    hint: "Sky-blue and white. Build a side from the Pampas." },
  { id: "msn", name: "MSN", icon: "🔥", tier: "trio",
    description: "Field Messi, Suárez and Neymar together.",
    hint: "Three names, one deadly front line of the 2010s." },
  { id: "bbc", name: "BBC", icon: "⚡", tier: "trio",
    description: "Field Bale, Benzema and Cristiano Ronaldo together.",
    hint: "An initialled attacking trident from the Spanish capital." },
  { id: "maestros", name: "Midfield Maestros", icon: "🎩", tier: "trio",
    description: "Field Xavi, Iniesta and Busquets together.",
    hint: "Tiki-taka's beating heart — three of a kind in midfield." },
  { id: "born-leader", name: "Born Leader", icon: "🎖️", tier: "honour",
    description: "Hand the armband to a historic captain.",
    hint: "Some men were born to wear the armband. Choose one." },
  { id: "immortals", name: "Immortals", icon: "🏅", tier: "honour",
    description: "Win the title with every starter rated 90 or higher.",
    hint: "Perfection has a price. Conquer with an XI of only greats." },
];

/** Star names each trio egg looks for — matched exactly against player.name. */
const TRIOS: Record<string, string[]> = {
  msn: ["Lionel Messi", "Luis Suárez", "Neymar"],
  bbc: ["Gareth Bale", "Karim Benzema", "Cristiano Ronaldo"],
  maestros: ["Xavi", "Andrés Iniesta", "Sergio Busquets"],
};

/** Clubs / nations that unlock a "core" egg at four or more starters. */
const CORES: Record<string, string> = {
  blaugrana: "Barcelona",
  blancos: "Real Madrid",
  invincibles: "Arsenal",
  "mia-san-mia": "Bayern Munich",
  rossoneri: "Milan",
  samba: "Brazil",
  albiceleste: "Argentina",
};

/** Captains storied enough to unlock the leadership emblem. */
const HISTORIC_CAPTAINS = new Set([
  "Carles Puyol", "Paolo Maldini", "Steven Gerrard", "Javier Zanetti",
  "Philipp Lahm", "Sergio Ramos", "Franco Baresi", "Iker Casillas",
  "Paolo Cannavaro", "Fabio Cannavaro", "John Terry", "Sergio Busquets",
]);

export interface EggContext {
  /** the finished XI (nulls already stripped) */
  xi: Player[];
  /** the player wearing the armband, if chosen */
  captainName?: string | null;
  /** did this XI win the tournament it was built for? */
  champion: boolean;
}

/** Newly-discovered egg ids given the XI and what the manager already has. */
export function detectEggs(ctx: EggContext, have: Iterable<string>): string[] {
  const owned = new Set(have);
  const found: string[] = [];
  const names = new Set(ctx.xi.map((p) => p.name));
  const clubCount = (club: string) => ctx.xi.filter((p) => p.club === club).length;

  for (const [id, club] of Object.entries(CORES)) {
    if (!owned.has(id) && clubCount(club) >= 4) found.push(id);
  }
  for (const [id, trio] of Object.entries(TRIOS)) {
    if (!owned.has(id) && trio.every((n) => names.has(n))) found.push(id);
  }
  if (!owned.has("born-leader") && ctx.captainName && HISTORIC_CAPTAINS.has(ctx.captainName)) {
    found.push("born-leader");
  }
  if (!owned.has("immortals") && ctx.champion && ctx.xi.length >= 11 && ctx.xi.every((p) => p.overall >= 90)) {
    found.push("immortals");
  }
  return found;
}

export function eggById(id: string): EasterEgg | undefined {
  return EASTER_EGGS.find((e) => e.id === id);
}
