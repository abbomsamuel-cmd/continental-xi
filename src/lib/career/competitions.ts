import { worldClubById, worldLeagueById } from "./world";
import { TROPHY_META, type TrophyId } from "@/components/career/TrophyArt";

/**
 * The engine records honours generically ("League", "Domestic Cup", "Champions
 * League") because a save is stored by club id, not competition. Here we resolve
 * that generic honour into the SPECIFIC competition — Serie A, Coppa Italia, the
 * Copa Libertadores — using the club it was won at, plus the right trophy art.
 * Awards are already stored as trophy-ids, so they pass straight through.
 */

export interface ResolvedHonour {
  id: TrophyId;
  en: string;
  es: string;
}

const SOUTH_AMERICA = new Set([
  "Argentina", "Brazil", "Uruguay", "Colombia", "Chile", "Peru", "Ecuador", "Paraguay", "Bolivia", "Venezuela",
]);
const CONCACAF = new Set(["Mexico", "United States", "Canada", "Costa Rica", "Honduras", "Panama", "Jamaica"]);

/** Country → its domestic cup name. */
const DOMESTIC_CUP: Record<string, [string, string]> = {
  England: ["FA Cup", "FA Cup"],
  Spain: ["Copa del Rey", "Copa del Rey"],
  Italy: ["Coppa Italia", "Coppa Italia"],
  Germany: ["DFB-Pokal", "DFB-Pokal"],
  France: ["Coupe de France", "Coupe de France"],
  Portugal: ["Taça de Portugal", "Taça de Portugal"],
  Netherlands: ["KNVB Cup", "Copa KNVB"],
  Belgium: ["Belgian Cup", "Copa de Bélgica"],
  Turkey: ["Turkish Cup", "Copa de Turquía"],
  Scotland: ["Scottish Cup", "Copa de Escocia"],
  Brazil: ["Copa do Brasil", "Copa do Brasil"],
  Argentina: ["Copa Argentina", "Copa Argentina"],
  Mexico: ["Copa MX", "Copa MX"],
  "United States": ["US Open Cup", "US Open Cup"],
};

function region(country: string): "sa" | "concacaf" | "uefa" {
  if (SOUTH_AMERICA.has(country)) return "sa";
  if (CONCACAF.has(country)) return "concacaf";
  return "uefa";
}

/**
 * Resolve a stored honour (or an award trophy-id) to its named, illustrated form.
 * `clubId` locates the competition; without it we fall back to generic art.
 */
export function resolveHonour(honour: string, clubId?: string): ResolvedHonour {
  // Awards are already trophy-ids.
  if (honour in TROPHY_META) {
    const m = TROPHY_META[honour as TrophyId];
    return { id: honour as TrophyId, en: m.en, es: m.es };
  }

  const club = clubId ? worldClubById(clubId) : undefined;
  const country = club?.country ?? "";
  const reg = region(country);

  switch (honour) {
    case "League": {
      const name = club ? worldLeagueById(club.leagueId)?.name : undefined;
      return { id: "league-shield", en: name ?? "League Title", es: name ?? "Título de Liga" };
    }
    case "Domestic Cup": {
      const cup = DOMESTIC_CUP[country];
      return { id: "domestic-cup", en: cup?.[0] ?? "Domestic Cup", es: cup?.[1] ?? "Copa Nacional" };
    }
    case "Champions League":
      if (reg === "sa") return { id: "champions-league", en: "Copa Libertadores", es: "Copa Libertadores" };
      if (reg === "concacaf") return { id: "concacaf-champions", en: "CONCACAF Champions Cup", es: "Copa de Campeones CONCACAF" };
      return { id: "champions-league", en: "Champions League", es: "Champions League" };
    case "Europa":
      if (reg === "sa") return { id: "europa-league", en: "Copa Sudamericana", es: "Copa Sudamericana" };
      return { id: "europa-league", en: "Europa League", es: "Europa League" };
    default: {
      // Unknown label — show it verbatim on a generic cup.
      return { id: "league-trophy", en: honour, es: honour };
    }
  }
}

/** All honours + awards a season produced, resolved and named. */
export function seasonTrophies(season: { honours: string[]; awards?: string[]; clubId: string }): ResolvedHonour[] {
  const out: ResolvedHonour[] = [];
  for (const h of season.honours) out.push(resolveHonour(h, season.clubId));
  for (const a of season.awards ?? []) out.push(resolveHonour(a, season.clubId));
  return out;
}
