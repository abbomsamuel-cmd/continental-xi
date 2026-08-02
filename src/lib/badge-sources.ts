/**
 * Where club badges and nation flags come from.
 *
 * This file is the single place to hook the app up to an external image
 * source. It ships EMPTY on purpose: nothing here resolves to a URL until
 * you put one in, and until then every card falls back to the generated
 * crest and the bundled flag set, which work offline and need no network.
 *
 * Whatever you point these at is your call — sourcing and clearing the
 * images is the app owner's decision, not something the code makes for you.
 */

/** ISO-3166 alpha-2 codes for the nations in the registry, for flag CDNs
 *  that key on country code. Resolved via lib/flags.ts, which already owns
 *  the nation→code mapping (including gb-eng, gb-sct, gb-wls, gb-nir, xk). */
import { flagCodeFor } from "./flags";

/* ------------------------------------------------------------- flags -- */

/**
 * Turn on a flag CDN by returning a URL here. Example, using flagcdn.com:
 *
 *   const code = flagCodeFor(nationality);
 *   return code ? `https://flagcdn.com/w80/${code}.png` : undefined;
 *
 * Left off by default deliberately: flags are already bundled via the
 * flag-icons package and served from your own origin, so they cost no
 * request, survive the CDN being down, and work with the app offline.
 * A CDN is a downgrade here unless you specifically want one — note also
 * that flagcdn has no sub-national flags, so England, Scotland, Wales and
 * Northern Ireland would silently fall back.
 */
export function flagUrlFor(nationality: string | undefined): string | undefined {
  void nationality;
  void flagCodeFor;
  return undefined;
}

/* ------------------------------------------------------------ crests -- */

/**
 * Club name → badge URL. Keys are the `club` field on Player, exactly as it
 * appears in lib/data (e.g. "Barcelona", "Inter Milan", "Steaua București").
 *
 *   export const CLUB_BADGES: Record<string, string> = {
 *     Barcelona: "https://your-source.example/barcelona.png",
 *   };
 *
 * Two practical notes if you're picking a source:
 *
 *  - Wikipedia/Wikimedia club crests are almost all uploaded under a
 *    NON-FREE fair-use rationale that covers use in the encyclopedia
 *    article itself. They are not freely licensed files and reusing them
 *    elsewhere isn't covered by that rationale — worth checking the file
 *    page before assuming Commons means free.
 *  - Don't hotlink raw.githubusercontent.com in production: it's rate
 *    limited, and folder names in season-based repos change every year.
 *    Copy what you're using to your own origin or a CDN you control.
 */
export const CLUB_BADGES: Record<string, string> = {};

export function clubBadgeUrlFor(club: string | undefined): string | undefined {
  return club ? CLUB_BADGES[club] : undefined;
}
