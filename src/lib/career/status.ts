/* ------------------------------------------------------------------ */
/*  Career status — the one place a player's headline label is decided. */
/*                                                                     */
/*  A status is a function of THREE inputs, never one:                  */
/*    • age      — which chapter of the career we are in,               */
/*    • overall  — how good the player actually is inside that chapter, */
/*    • ovrDelta — which way the arrow points (movement vs last season).*/
/*                                                                     */
/*  That is what keeps a 30-year-old who is still improving a "Late     */
/*  Bloomer" instead of a "Promising Talent", and a 33-year-old who     */
/*  shed three points a "Declining Starter" instead of a "Key Player".  */
/*  Youth labels are additionally hard-blocked past 28 by guardYouth(), */
/*  so no future edit to the bands can reintroduce that bug.            */
/*                                                                     */
/*  Pure module: no state, no side effects, no I/O.                     */
/* ------------------------------------------------------------------ */

export type StatusTone = "prospect" | "rising" | "prime" | "veteran" | "twilight";

export interface CareerStatus {
  label: string;
  labelEs: string;
  tone: StatusTone;
}

/** Internal ids so the bands read as football, not as string literals. */
type StatusKey =
  // 16–19
  | "academyProspect" | "promisingTalent" | "breakthroughProspect"
  | "breakthroughTalent" | "wonderkid"
  // 20–23
  | "firstTeamProspect" | "highPotential" | "establishedYoung" | "risingStar"
  // 24–28
  | "establishedPlayer" | "primePlayer" | "primePerformer" | "keyPlayer"
  | "elitePerformer" | "worldClassStar"
  // 29–31
  | "establishedPro" | "experiencedStarter" | "peakYears" | "lateBloomer"
  | "decliningPlayer"
  // 32–34
  | "rotationVeteran" | "reliableVeteran" | "experiencedVeteran"
  | "squadLeader" | "decliningStarter"
  // 35+
  | "agingVeteran" | "windingDown" | "endOfCareer" | "finalSeasons"
  | "lastDance" | "clubLegend" | "retirementCandidate" | "retired";

const STATUS: Record<StatusKey, CareerStatus> = {
  // ---- 16–19 · the academy years ----
  academyProspect: { label: "Academy Prospect", labelEs: "Promesa de la Cantera", tone: "prospect" },
  promisingTalent: { label: "Promising Talent", labelEs: "Talento Prometedor", tone: "prospect" },
  breakthroughProspect: { label: "Breakthrough Prospect", labelEs: "Promesa Emergente", tone: "prospect" },
  breakthroughTalent: { label: "Breakthrough Talent", labelEs: "Talento Emergente", tone: "prospect" },
  wonderkid: { label: "Wonderkid", labelEs: "Joven Maravilla", tone: "prospect" },

  // ---- 20–23 · breaking through ----
  firstTeamProspect: { label: "First-Team Prospect", labelEs: "Promesa del Primer Equipo", tone: "rising" },
  highPotential: { label: "High-Potential Player", labelEs: "Jugador de Alto Potencial", tone: "rising" },
  establishedYoung: { label: "Established Young Player", labelEs: "Joven Consolidado", tone: "rising" },
  risingStar: { label: "Rising Star", labelEs: "Estrella Emergente", tone: "rising" },

  // ---- 24–28 · the prime window ----
  establishedPlayer: { label: "Established Player", labelEs: "Jugador Consolidado", tone: "prime" },
  primePlayer: { label: "Prime Player", labelEs: "Jugador en su Mejor Momento", tone: "prime" },
  primePerformer: { label: "Prime Performer", labelEs: "Jugador en Plenitud", tone: "prime" },
  keyPlayer: { label: "Key Player", labelEs: "Jugador Clave", tone: "prime" },
  elitePerformer: { label: "Elite Performer", labelEs: "Jugador de Élite", tone: "prime" },
  worldClassStar: { label: "World-Class Star", labelEs: "Estrella de Clase Mundial", tone: "prime" },

  // ---- 29–31 · peak, plateau or first slip ----
  establishedPro: { label: "Established Professional", labelEs: "Profesional Consolidado", tone: "veteran" },
  experiencedStarter: { label: "Experienced Starter", labelEs: "Titular Experimentado", tone: "prime" },
  peakYears: { label: "Peak Years", labelEs: "Años de Plenitud", tone: "prime" },
  lateBloomer: { label: "Late Bloomer", labelEs: "Talento Tardío", tone: "rising" },
  decliningPlayer: { label: "Declining Player", labelEs: "Jugador en Declive", tone: "veteran" },

  // ---- 32–34 · veteran ----
  rotationVeteran: { label: "Rotation Veteran", labelEs: "Veterano de Rotación", tone: "veteran" },
  reliableVeteran: { label: "Reliable Veteran", labelEs: "Veterano Fiable", tone: "veteran" },
  experiencedVeteran: { label: "Experienced Veteran", labelEs: "Veterano Experimentado", tone: "veteran" },
  squadLeader: { label: "Squad Leader", labelEs: "Líder del Vestuario", tone: "veteran" },
  decliningStarter: { label: "Declining Starter", labelEs: "Titular en Declive", tone: "veteran" },

  // ---- 35+ · twilight ----
  agingVeteran: { label: "Aging Veteran", labelEs: "Veterano Mayor", tone: "twilight" },
  windingDown: { label: "Winding Down", labelEs: "Recta Final", tone: "twilight" },
  endOfCareer: { label: "End of Career", labelEs: "Final de Carrera", tone: "twilight" },
  finalSeasons: { label: "Final Seasons", labelEs: "Últimas Temporadas", tone: "twilight" },
  lastDance: { label: "Last Dance", labelEs: "Último Baile", tone: "twilight" },
  clubLegend: { label: "Club Legend", labelEs: "Leyenda del Club", tone: "twilight" },
  retirementCandidate: { label: "Retirement Candidate", labelEs: "Cerca de la Retirada", tone: "twilight" },
  retired: { label: "Retired", labelEs: "Retirado", tone: "twilight" },
};

/**
 * Labels that describe a young player. None of these may ever be attached to
 * someone over 28 — this is the bug being fixed, so it is enforced twice:
 * once by the age bands, once by guardYouth() as a backstop.
 */
const YOUTH_KEYS: ReadonlySet<StatusKey> = new Set<StatusKey>([
  "academyProspect", "promisingTalent", "breakthroughProspect",
  "breakthroughTalent", "wonderkid", "firstTeamProspect", "highPotential",
  "establishedYoung", "risingStar",
]);

function clampInt(value: number, lo: number, hi: number): number {
  if (!Number.isFinite(value)) return lo;
  return Math.min(hi, Math.max(lo, Math.round(value)));
}

/** Nothing youthful survives past 28, whatever the bands decided. */
function guardYouth(age: number, key: StatusKey): StatusKey {
  if (age <= 28 || !YOUTH_KEYS.has(key)) return key;
  if (age <= 31) return "establishedPro";
  if (age <= 34) return "experiencedVeteran";
  return "agingVeteran";
}

function pickKey(age: number, ovr: number, delta: number, peak: number): StatusKey {
  // Current movement wins; distance from the career peak only breaks ties for
  // a player whose overall was flat this season.
  const climbing = delta >= 1;
  const falling = !climbing && (delta <= -1 || ovr <= peak - 4);

  // ---- 16–19 · the academy years ----
  if (age <= 19) {
    if (ovr >= 70) return "wonderkid";
    if (ovr >= 62) return "breakthroughTalent";
    if (delta >= 3) return "breakthroughProspect";
    if (ovr >= 55) return "promisingTalent";
    return "academyProspect";
  }

  // ---- 20–23 · breaking through ----
  if (age <= 23) {
    if (age === 20 && ovr >= 76) return "wonderkid";
    if (ovr >= 78 || (ovr >= 73 && climbing)) return "risingStar";
    if (ovr >= 72 && !climbing) return "establishedYoung";
    if (ovr >= 66) return "highPotential";
    return "firstTeamProspect";
  }

  // ---- 24–28 · the prime window ----
  if (age <= 28) {
    if (ovr >= 86) return "worldClassStar";
    if (ovr >= 81) return age >= 25 ? "elitePerformer" : "keyPlayer";
    if (ovr >= 76) return "keyPlayer";
    if (ovr >= 70) return climbing ? "primePerformer" : "primePlayer";
    return "establishedPlayer";
  }

  // ---- 29–31 · still climbing, holding, or slipping ----
  if (age <= 31) {
    if (climbing) return "lateBloomer";
    // 29 is too early for the "declining" vocabulary; a slip there reads as a
    // pro settling into his level rather than a career turning down.
    if (falling) return age >= 30 ? "decliningPlayer" : "establishedPro";
    if (ovr >= 84) return "peakYears";
    if (ovr >= 74) return "experiencedStarter";
    return "establishedPro";
  }

  // ---- 32–34 · veteran ----
  if (age <= 34) {
    if (falling) return ovr >= 74 ? "decliningStarter" : "rotationVeteran";
    if (ovr >= 82) return "squadLeader";
    if (ovr >= 74) return "experiencedVeteran";
    if (ovr >= 66) return "reliableVeteran";
    return "rotationVeteran";
  }

  // ---- 35+ · twilight ----
  const legendary = peak >= 86 || ovr >= 84;
  if (age >= 38) {
    if (legendary && !falling) return "clubLegend";
    if (ovr <= 68 || delta <= -2) return "retirementCandidate";
    return "lastDance";
  }
  if (legendary && !falling) return "clubLegend";
  if (ovr <= 62 || delta <= -4) return "retirementCandidate";
  if (delta <= -3) return "endOfCareer";
  if (falling) return ovr >= 72 ? "windingDown" : "finalSeasons";
  return "agingVeteran";
}

/**
 * The player's career status.
 *
 * @param age       current age in years.
 * @param overall   current overall rating.
 * @param ovrDelta  overall change vs the previous season (negative = declining).
 * @param opts.retired      a finished career gets a closing label, not a stage.
 * @param opts.peakOverall  best overall ever reached; sharpens decline detection
 *                          and decides whether a 35+ career closes as a legend.
 */
export function careerStatus(
  age: number,
  overall: number,
  ovrDelta: number,
  opts?: { retired?: boolean; peakOverall?: number },
): CareerStatus {
  const a = clampInt(age, 14, 45);
  const ovr = clampInt(overall, 1, 99);
  const delta = Number.isFinite(ovrDelta) ? Math.round(ovrDelta) : 0;
  const peak = Math.max(ovr, clampInt(opts?.peakOverall ?? ovr, 1, 99));

  if (opts?.retired === true) return STATUS[peak >= 84 ? "clubLegend" : "retired"];

  return STATUS[guardYouth(a, pickKey(a, ovr, delta, peak))];
}

const TONE_COLOR: Record<StatusTone, string> = {
  prospect: "#7ee081",
  rising: "#22e0ff",
  prime: "#f2d472",
  veteran: "#ffa657",
  twilight: "#b9c2d0",
};

/** Accent colour for a status tone — tuned for the dark career UI. */
export function statusToneColor(tone: StatusTone): string {
  return TONE_COLOR[tone];
}
