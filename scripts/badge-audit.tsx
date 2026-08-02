/**
 * Badge audit — two jobs.
 *
 * 1. Integrity: the club→path map must line up with the real dataset, and
 *    while badges are switched off nothing may resolve or request an image.
 *    These are assertions; the script exits non-zero if any fail.
 * 2. Coverage: what's actually in public/badges right now — matched, missing,
 *    wrongly-cased, or unused. Informational; never fails the run.
 *
 * Run with: npm run badgeaudit
 */
import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup as render } from "react-dom/server";
import { TeamBadge } from "@/components/TeamBadge";
import { RemoteBadge } from "@/components/ui/RemoteBadge";
import { CLUB_BADGES, BADGES_ENABLED, clubBadgeUrlFor } from "@/lib/badge-sources";
import { shortCode } from "@/lib/club-key";
import { SQUADS } from "@/lib/players";

const BADGES_DIR = path.join(process.cwd(), "public", "badges");
const clubs = [...new Set((SQUADS as { club: string }[]).map((s) => s.club))];
const colors: [string, string] = ["#A50044", "#004D98"];

let failures = 0;
const assert = (ok: boolean, msg: string) => {
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${msg}`);
  if (!ok) failures += 1;
};

/** Levenshtein, for guessing which club a stray filename was meant to be. */
function distance(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]/g, "");
const strip = (s: string) => s.replace(/^(fc|afc|cf|sc|ac|as|ss|ssc|rc)/, "").replace(/(fc|afc|cf|sc)$/, "");

/**
 * Common alternate names, normalised. Fuzzy matching can't get these — a
 * club known by a different name entirely ("Crvena Zvezda", "Spurs") isn't
 * a typo of the registry name, it's a synonym. Only used for suggestions.
 */
const ALIASES: Record<string, string> = {
  crvenazvezda: "Red Star Belgrade", redstar: "Red Star Belgrade",
  manutd: "Manchester United", manchesterutd: "Manchester United", manu: "Manchester United",
  mancity: "Manchester City", mcfc: "Manchester City",
  spurs: "Tottenham Hotspur", thfc: "Tottenham Hotspur",
  acmilan: "Milan", associazionecalciomilan: "Milan",
  internazionale: "Inter Milan", inter: "Inter Milan",
  fcbayern: "Bayern Munich", bayernmunchen: "Bayern Munich", bayernmuenchen: "Bayern Munich",
  psg: "Paris Saint-Germain", parissg: "Paris Saint-Germain",
  sportinglisbon: "Sporting CP", sportingclubedeportugal: "Sporting CP",
  dynamokiev: "Dynamo Kyiv", dinamokyiv: "Dynamo Kyiv",
  steauabucharest: "Steaua București", fcsb: "Steaua București",
  rbsalzburg: "Red Bull Salzburg", olympiakos: "Olympiacos",
  depor: "Deportivo La Coruña", deportivo: "Deportivo La Coruña",
  psv: "PSV Eindhoven", ajaxamsterdam: "Ajax", hsv: "Hamburg", hamburgersv: "Hamburg",
  atleti: "Atlético Madrid", atleticodemadrid: "Atlético Madrid",
  olympiquelyonnais: "Lyon", olympiquedemarseille: "Marseille",
  bvb: "Borussia Dortmund", leverkusen: "Bayer Leverkusen", frankfurt: "Eintracht Frankfurt",
};

/** Words in a filename or club name, lowercased and de-accented. */
const words = (s: string) =>
  s.replace(/\.[a-z0-9]+$/i, "").split(/[\s._\-]+/).map(norm).filter((w) => w.length >= 4);

/**
 * Best-guess club for a filename that matched nothing, in three passes:
 * whole-string containment, then a shared distinctive word, then edit
 * distance. The middle pass is what catches abbreviations — "nottm-forest"
 * is too far from "nottingham forest" for a sane distance threshold, but
 * they plainly share "forest".
 */
function closestClub(file: string): string | undefined {
  const target = strip(norm(file.replace(/\.[a-z0-9]+$/i, "")));
  if (!target) return undefined;
  const raw = norm(file.replace(/\.[a-z0-9]+$/i, ""));
  if (ALIASES[raw]) return ALIASES[raw];
  if (ALIASES[target]) return ALIASES[target];
  const fileWords = words(file);

  let best: string | undefined;
  let bestScore = Infinity;
  let shared: string | undefined;
  let sharedScore = Infinity;

  for (const club of Object.keys(CLUB_BADGES)) {
    const key = strip(norm(club));
    if (!key) continue;
    if (key === target || key.includes(target) || target.includes(key)) return club;

    const d = distance(target, key);
    if (fileWords.some((w) => words(club).includes(w)) && d < sharedScore) {
      sharedScore = d;
      shared = club;
    }
    if (d < bestScore) { bestScore = d; best = club; }
  }

  if (shared) return shared;
  return bestScore <= Math.max(2, Math.floor(target.length * 0.34)) ? best : undefined;
}

/* -------------------------------------------------- 1. map integrity -- */

console.log("\nMAP INTEGRITY");

const missingKeys = clubs.filter((c) => !(c in CLUB_BADGES));
const staleKeys = Object.keys(CLUB_BADGES).filter((c) => !clubs.includes(c));
assert(missingKeys.length === 0, `every club has a key${missingKeys.length ? ` — missing: ${missingKeys.join(", ")}` : ""}`);
assert(staleKeys.length === 0, `no stale keys${staleKeys.length ? ` — stale: ${staleKeys.join(", ")}` : ""}`);

const codes = new Map<string, string>();
const codeClashes: string[] = [];
for (const c of clubs) {
  const k = shortCode(c);
  if (codes.has(k)) codeClashes.push(`${k}: ${codes.get(k)} vs ${c}`);
  codes.set(k, c);
}
assert(codeClashes.length === 0, `short codes unique${codeClashes.length ? ` — ${codeClashes.join("; ")}` : ""}`);
assert(new Set(Object.values(CLUB_BADGES)).size === clubs.length, "badge paths unique");

if (!BADGES_ENABLED) {
  assert(clubs.every((c) => clubBadgeUrlFor(c) === undefined), "nothing resolves while disabled");
  assert(!render(<TeamBadge colors={colors} code="BAR" />).includes("<img"), "TeamBadge requests no image while disabled");
  assert(!render(<RemoteBadge clubName="Barcelona" colors={colors} />).includes("<img"), "RemoteBadge falls back while disabled");
}
const forced = render(<TeamBadge colors={colors} code="BAR" badgeUrl="/x.png" />);
assert(forced.includes('src="/x.png"'), "an explicit badgeUrl still renders");
assert(forced.includes("object-contain") && forced.includes("drop-shadow-md"), "img keeps object-contain + drop-shadow-md");

/* ------------------------------------------------------- 2. coverage -- */

console.log("\nCOVERAGE");

if (!fs.existsSync(BADGES_DIR)) {
  console.log("  public/badges/ does not exist — every club is on its generated crest.");
  console.log("  To start:  mkdir public/badges");
} else {
  // Compare real directory entries EXACTLY. fs.existsSync lies on macOS,
  // which is case-insensitive: "Barcelona.png" looks present locally and then
  // 404s on Vercel, which is case-sensitive. This catches that before deploy.
  const entries = fs.readdirSync(BADGES_DIR).filter((f) => !f.startsWith("."));
  const present = new Set(entries);
  const byLower = new Map(entries.map((f) => [f.toLowerCase(), f]));

  const matched: string[] = [];
  const miscased: [string, string, string][] = [];
  const missing: [string, string][] = [];

  for (const [club, p] of Object.entries(CLUB_BADGES)) {
    const want = path.basename(p);
    if (present.has(want)) matched.push(club);
    else if (byLower.has(want.toLowerCase())) miscased.push([club, byLower.get(want.toLowerCase())!, want]);
    else missing.push([club, want]);
  }

  const claimed = new Set([
    ...matched.map((c) => path.basename(CLUB_BADGES[c])),
    ...miscased.map(([, actual]) => actual),
  ]);
  const unused = entries.filter((f) => !claimed.has(f));

  console.log(`  matched: ${matched.length}/${clubs.length}`);

  if (miscased.length) {
    console.log(`\n  WRONG CASE (${miscased.length}) — these work on macOS and 404 on Vercel:`);
    for (const [club, actual, want] of miscased) console.log(`    ${actual}  ->  rename to ${want}   (${club})`);
  }
  if (unused.length) {
    console.log(`\n  UNUSED (${unused.length}) — in the folder but matching no club:`);
    for (const f of unused) {
      const guess = closestClub(f);
      console.log(`    ${f}${guess ? `  ->  rename to ${path.basename(CLUB_BADGES[guess])}?  (${guess})` : ""}`);
    }
  }
  if (missing.length) {
    console.log(`\n  no file yet (${missing.length}) — these keep their generated crest:`);
    for (const [club, want] of missing) console.log(`    ${club.padEnd(22)} expects ${want}`);
  }
  if (!miscased.length && !unused.length && !missing.length) {
    console.log("  every club has a correctly-named file.");
  }

  // the failure that reads as "the code is broken" but is one boolean
  const usable = matched.length + miscased.length;
  if (usable > 0 && !BADGES_ENABLED) {
    console.log(`\n  NOTE: ${usable} badge file(s) present, but BADGES_ENABLED is false — none are in use.`);
    console.log("        Flip it in src/lib/badge-sources.ts.");
  } else if (BADGES_ENABLED && matched.length === 0) {
    console.log("\n  NOTE: BADGES_ENABLED is true but nothing matches, so every badge 404s");
    console.log("        and falls back. Fix the filenames above, or switch it back off.");
  }
}

console.log(failures === 0 ? "\nintegrity: PASS\n" : `\nintegrity: ${failures} FAILED\n`);
process.exit(failures === 0 ? 0 : 1);
