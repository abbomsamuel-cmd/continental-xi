/**
 * Where club badges and nation flags come from.
 *
 * This is the one place to hook the app up to real badge artwork. Every
 * path below points at `public/badges/`, and **none of those files exist
 * yet** — the map is a set of empty slots with a stable naming convention.
 * Until a file is actually present, every surface falls back to the
 * generated crest, which needs no network and works offline.
 *
 * Sourcing the artwork is the app owner's call, not something the code
 * decides. Two things worth knowing before picking a source:
 *
 *  - Most Wikipedia/Wikimedia club crests are uploaded under a NON-FREE
 *    fair-use rationale scoped to the encyclopedia article itself. They are
 *    not freely licensed files; Commons being open doesn't make those
 *    particular ones reusable. Check the file page.
 *  - Don't hotlink raw.githubusercontent.com: it's rate limited and
 *    season-based repos rename their folders every year, so the URLs rot.
 *    Local files under public/ avoid both problems, which is why the paths
 *    below are local.
 *
 * To switch a club on: drop the PNG at the path shown and rebuild. Partial
 * coverage is fine — clubs without a file keep their generated crest, so
 * you can do these one at a time.
 */

import { shortCode } from "./club-key";
import { flagCodeFor } from "./flags";

/* ------------------------------------------------------------ crests -- */

/**
 * The master switch. While this is false nothing below is ever requested and
 * every surface draws the generated crest.
 *
 * It exists because the map is fully populated but `public/badges/` is
 * empty: without the guard, every page would fire a request per club, take
 * 51 404s, log 51 console errors and flash blank tiles before the fallback
 * caught them. Put your files in, flip this to true, rebuild.
 */
export const BADGES_ENABLED = false;

/** Club name (the `club` field on Player) → badge path under public/. */
export const CLUB_BADGES: Record<string, string> = {
  "Ajax"                : "/badges/ajax.png",
  "Arsenal"             : "/badges/arsenal.png",
  "Aston Villa"         : "/badges/aston-villa.png",
  "Atalanta"            : "/badges/atalanta.png",
  "Atlético Madrid"     : "/badges/atletico-madrid.png",
  "Barcelona"           : "/badges/barcelona.png",
  "Basel"               : "/badges/basel.png",
  "Bayer Leverkusen"    : "/badges/bayer-leverkusen.png",
  "Bayern Munich"       : "/badges/bayern-munich.png",
  "Benfica"             : "/badges/benfica.png",
  "Borussia Dortmund"   : "/badges/borussia-dortmund.png",
  "Celtic"              : "/badges/celtic.png",
  "Chelsea"             : "/badges/chelsea.png",
  "Deportivo La Coruña" : "/badges/deportivo-la-coruna.png",
  "Dynamo Kyiv"         : "/badges/dynamo-kyiv.png",
  "Eintracht Frankfurt" : "/badges/eintracht-frankfurt.png",
  "Fenerbahçe"          : "/badges/fenerbahce.png",
  "Feyenoord"           : "/badges/feyenoord.png",
  "Galatasaray"         : "/badges/galatasaray.png",
  "Hamburg"             : "/badges/hamburg.png",
  "Inter Milan"         : "/badges/inter-milan.png",
  "Juventus"            : "/badges/juventus.png",
  "Lazio"               : "/badges/lazio.png",
  "Leicester City"      : "/badges/leicester-city.png",
  "Liverpool"           : "/badges/liverpool.png",
  "Lyon"                : "/badges/lyon.png",
  "Manchester City"     : "/badges/manchester-city.png",
  "Manchester United"   : "/badges/manchester-united.png",
  "Marseille"           : "/badges/marseille.png",
  "Milan"               : "/badges/milan.png",
  "Monaco"              : "/badges/monaco.png",
  "Napoli"              : "/badges/napoli.png",
  "Newcastle United"    : "/badges/newcastle-united.png",
  "Nottingham Forest"   : "/badges/nottingham-forest.png",
  "Olympiacos"          : "/badges/olympiacos.png",
  "Paris Saint-Germain" : "/badges/paris-saint-germain.png",
  "Porto"               : "/badges/porto.png",
  "PSV Eindhoven"       : "/badges/psv-eindhoven.png",
  "RB Leipzig"          : "/badges/rb-leipzig.png",
  "Real Madrid"         : "/badges/real-madrid.png",
  "Red Bull Salzburg"   : "/badges/red-bull-salzburg.png",
  "Red Star Belgrade"   : "/badges/red-star-belgrade.png",
  "Roma"                : "/badges/roma.png",
  "Schalke 04"          : "/badges/schalke-04.png",
  "Sevilla"             : "/badges/sevilla.png",
  "Shakhtar Donetsk"    : "/badges/shakhtar-donetsk.png",
  "Sporting CP"         : "/badges/sporting-cp.png",
  "Steaua București"    : "/badges/steaua-bucuresti.png",
  "Tottenham Hotspur"   : "/badges/tottenham-hotspur.png",
  "Valencia"            : "/badges/valencia.png",
  "Villarreal"          : "/badges/villarreal.png",
};

/** Short code → the same path, so callers holding only a three-letter code
 *  (league tables, brackets, match cards) resolve without extra plumbing.
 *  Codes are unique across the registry — scripts/badge-audit.ts asserts it. */
const BY_CODE: Record<string, string> = {};
for (const [club, path] of Object.entries(CLUB_BADGES)) BY_CODE[shortCode(club)] = path;

/** Resolve a badge by club name or short code. Undefined means "no file
 *  configured", which callers treat as "use the generated crest". */
export function clubBadgeUrlFor(key: string | undefined): string | undefined {
  if (!BADGES_ENABLED || !key) return undefined;
  return CLUB_BADGES[key] ?? BY_CODE[shortCode(key)];
}

/* ------------------------------------------------------------- flags -- */

/**
 * Off by default, and that's deliberate — flags are already bundled via the
 * flag-icons package and served from your own origin, so they cost no
 * request, survive a CDN outage and work offline. A CDN is a downgrade here
 * unless you specifically want one. flagcdn in particular has no
 * sub-national flags, so England, Scotland, Wales and Northern Ireland
 * would silently fall back — and this registry is full of those players.
 *
 * To turn one on:
 *
 *   const code = flagCodeFor(nationality);
 *   return code ? `https://flagcdn.com/w80/${code}.png` : undefined;
 */
export function flagUrlFor(nationality: string | undefined): string | undefined {
  void nationality;
  void flagCodeFor;
  return undefined;
}
