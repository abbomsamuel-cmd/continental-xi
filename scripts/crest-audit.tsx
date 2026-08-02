import { renderToStaticMarkup } from "react-dom/server";
import { ClubCrest } from "@/components/ClubCrest";
import { SQUADS } from "@/lib/players";

function shortCode(name: string): string {
  const words = name.split(/\s+/).filter((w) => !["FC", "CF", "de", "La"].includes(w));
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}
function detect(svg: string): string {
  if (svg.includes('width="5.5" height="45"')) return "stripes";
  if (svg.includes('width="42" height="5.5"')) return "hoops";
  if (svg.includes('x="21" y="0" width="21"')) return "halved";
  if (svg.includes('x="15" y="0" width="12"')) return "band";
  if (svg.includes("M42 0 V45 H0 Z")) return "diagonal";
  if (svg.includes('width="42" height="11"')) return "chief";
  return "plain";
}
const draw = (colors: [string, string], seed: string) =>
  renderToStaticMarkup(<ClubCrest colors={colors} seed={seed} />);

const clubs = new Map<string, [string, string]>();
for (const s of SQUADS as { club: string; colors: [string, string] }[]) {
  if (!clubs.has(s.club)) clubs.set(s.club, s.colors);
}

const tally: Record<string, number> = {};
const mismatch: string[] = [];
const designs = new Map<string, string[]>();

for (const [club, colors] of clubs) {
  const svgName = draw(colors, club);
  const byName = detect(svgName);
  const byCode = detect(draw(colors, shortCode(club)));
  if (byName !== byCode) mismatch.push(`${club}: name=${byName} code=${byCode}`);
  tally[byName] = (tally[byName] ?? 0) + 1;
  const shape = svgName.match(/clipPath><path d="([^"]+)"/)?.[1] ?? "?";
  const design = `${shape.slice(0, 6)}|${byName}|${colors.join("")}`;
  if (!designs.has(design)) designs.set(design, []);
  designs.get(design)!.push(club);
}

console.log("clubs:", clubs.size);
console.log("patterns:", JSON.stringify(tally));
console.log("name-vs-code mismatches:", mismatch.length, mismatch.length ? "<-- BUG" : "OK");
for (const m of mismatch) console.log("  !", m);
const dup = [...designs.values()].filter((v) => v.length > 1);
console.log("visually identical crests:", dup.length, dup.map((v) => v.join("/")).join(", ") || "none");
console.log("--- spot checks ---");
for (const c of ["Real Madrid", "Barcelona", "Celtic", "Monaco", "Ajax", "Liverpool", "Juventus", "Newcastle United"]) {
  console.log(`  ${c.padEnd(18)} ${detect(draw(clubs.get(c)!, c))}`);
}
