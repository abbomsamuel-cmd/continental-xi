/** Asserts the badge map lines up with the real dataset and that every
 *  surface degrades to the generated crest while badges are switched off. */
import { renderToStaticMarkup as r } from "react-dom/server";
import { TeamBadge } from "@/components/TeamBadge";
import { RemoteBadge } from "@/components/ui/RemoteBadge";
import { CLUB_BADGES, BADGES_ENABLED, clubBadgeUrlFor } from "@/lib/badge-sources";
import { shortCode } from "@/lib/club-key";
import { SQUADS } from "@/lib/players";

const clubs = [...new Set((SQUADS as { club: string }[]).map((s) => s.club))];
const colors: [string, string] = ["#A50044", "#004D98"];
let bad = 0;
const check = (ok: boolean, msg: string) => { console.log(`${ok ? "ok  " : "FAIL"} ${msg}`); if (!ok) bad++; };

// 1. the map matches the dataset exactly, in both directions
const missing = clubs.filter((c) => !(c in CLUB_BADGES));
const extra = Object.keys(CLUB_BADGES).filter((c) => !clubs.includes(c));
check(missing.length === 0, `every club has an entry${missing.length ? ` — missing ${missing.join(", ")}` : ""}`);
check(extra.length === 0, `no stale entries${extra.length ? ` — extra ${extra.join(", ")}` : ""}`);

// 2. short codes are unique, or the BY_CODE alias silently mis-resolves
const codes = new Map<string, string>();
const collisions: string[] = [];
for (const c of clubs) {
  const k = shortCode(c);
  if (codes.has(k)) collisions.push(`${k}: ${codes.get(k)} vs ${c}`);
  codes.set(k, c);
}
check(collisions.length === 0, `short codes unique${collisions.length ? ` — ${collisions.join("; ")}` : ""}`);

// 3. paths are unique, so two clubs can't share one file by accident
const paths = new Set(Object.values(CLUB_BADGES));
check(paths.size === clubs.length, `badge paths unique (${paths.size}/${clubs.length})`);

// 4. while disabled: nothing resolves, and nothing renders an <img>
check(!BADGES_ENABLED, "badges disabled by default (public/badges is empty)");
check(clubs.every((c) => clubBadgeUrlFor(c) === undefined), "no club resolves a path while disabled");
check(!r(<TeamBadge colors={colors} code="BAR" />).includes("<img"), "TeamBadge draws the generated crest, no request");
check(!r(<RemoteBadge clubName="Barcelona" colors={colors} />).includes("<img"), "RemoteBadge falls back with no src");

// 5. an explicit src still wins, so the override path isn't dead
const forced = r(<TeamBadge colors={colors} code="BAR" badgeUrl="/x.png" />);
check(forced.includes('src="/x.png"'), "explicit badgeUrl still renders an <img>");
check(forced.includes("object-contain") && forced.includes("drop-shadow-md"), "img carries object-contain + drop-shadow-md");

console.log(bad === 0 ? "\nALL BADGE CHECKS PASSED" : `\n${bad} CHECK(S) FAILED`);
process.exit(bad === 0 ? 0 : 1);
