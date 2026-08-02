/**
 * The canonical short code for a club — "Manchester United" → "MU",
 * "Barcelona" → "BAR". One definition, imported by the tournament engine
 * (which stamps it onto every team), the crest art (which seeds a club's
 * silhouette from it) and the badge source map (which accepts it as an
 * alias), so those three can never drift apart and silently stop matching.
 *
 * Note the international engine has its own, deliberately different rule for
 * national sides — it doesn't strip "FC"/"CF" — so it isn't shared here.
 */
export function shortCode(name: string): string {
  const words = name.split(/\s+/).filter((w) => !["FC", "CF", "de", "La"].includes(w));
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}
