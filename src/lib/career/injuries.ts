/* ------------------------------------------------------------------ */
/*  Career Mode — INJURIES.                                            */
/*                                                                     */
/*  An injury is not a number subtracted from a rating. It is the      */
/*  moment a career either survives a scare or quietly changes shape,  */
/*  and WHEN it lands decides which of those it is. The same torn ACL: */
/*                                                                     */
/*    at 19 — months out, the knee forgives, development merely stalls;*/
/*    at 30 — a real chance the burst never returns, ~3-6 overall gone,*/
/*             and the elite clubs stop returning the agent's calls;   */
/*    at 35 — the medical staff start using the word "retirement".     */
/*                                                                     */
/*  So severity and age are multiplied, never added, and every figure  */
/*  is drawn through the injected rng so two identical careers do not  */
/*  produce two identical medical histories. A knock is always a knock:*/
/*  the maths is built so the smallest injuries can never cost more    */
/*  than a point, whatever the age.                                    */
/*                                                                     */
/*  Pure module: deterministic given `rng`, no state, no I/O.          */
/* ------------------------------------------------------------------ */

import type { AttrDelta } from "./types";

/* ---------------- vocabulary ---------------- */

export type InjurySeverity = "knock" | "minor" | "moderate" | "major" | "severe";

/** How the player attacks the rehab. Every option costs something real. */
export type RecoveryChoice = "aggressive" | "full" | "specialist";

export interface InjuryType {
  id: string;
  titleEn: string;
  titleEs: string;
  severity: InjurySeverity;
  /** Typical time on the sidelines, in months, as [min, max] before modifiers. */
  monthsOut: [number, number];
  /** Attributes this injury attacks, most-affected first. */
  attrs: string[];
  /** Base chance (0-1) the problem returns in a later season. */
  recurrenceRisk: number;

  // ---- optional tuning (all have safe defaults) ----
  /** Relative likelihood inside its severity band. Default 1. */
  weight?: number;
  /** Extra retirement pressure beyond age + severity — the genuinely grim ones. */
  careerRisk?: number;
  /** A problem that never truly goes away: recurrence resists good rehab. */
  chronic?: boolean;
  /** Youngest age this can be rolled at. Default 16. */
  minAge?: number;
}

export const SEVERITY_LABELS: Record<InjurySeverity, { en: string; es: string }> = {
  knock: { en: "Knock", es: "Golpe" },
  minor: { en: "Minor", es: "Leve" },
  moderate: { en: "Moderate", es: "Moderada" },
  major: { en: "Major", es: "Grave" },
  severe: { en: "Severe", es: "Muy Grave" },
};

/* ---------------- the injury table ---------------- */

/**
 * Ordered light → catastrophic. `attrs` use the same labels the development
 * report already prints, so an injury row reads like any other attribute move.
 */
export const INJURIES: InjuryType[] = [
  {
    id: "knock",
    titleEn: "Minor Knock", titleEs: "Golpe Leve",
    severity: "knock", monthsOut: [0, 1], attrs: ["Stamina"],
    recurrenceRisk: 0.05, weight: 3,
  },
  {
    id: "dead-leg",
    titleEn: "Dead Leg", titleEs: "Contusión en el Muslo",
    severity: "knock", monthsOut: [0, 1], attrs: ["Pace", "Stamina"],
    recurrenceRisk: 0.08, weight: 2,
  },
  {
    id: "bruised-ribs",
    titleEn: "Bruised Ribs", titleEs: "Contusión Costal",
    severity: "knock", monthsOut: [0, 1], attrs: ["Strength"],
    recurrenceRisk: 0.06, weight: 1.5,
  },
  {
    id: "muscle-strain",
    titleEn: "Muscle Strain", titleEs: "Sobrecarga Muscular",
    severity: "minor", monthsOut: [1, 2], attrs: ["Stamina", "Pace"],
    recurrenceRisk: 0.18, weight: 3,
  },
  {
    id: "hamstring",
    titleEn: "Hamstring Tear", titleEs: "Rotura de Isquiotibiales",
    severity: "minor", monthsOut: [1, 3], attrs: ["Pace", "Stamina"],
    recurrenceRisk: 0.3, weight: 3,
  },
  {
    id: "groin",
    titleEn: "Groin Strain", titleEs: "Lesión en el Aductor",
    severity: "minor", monthsOut: [1, 3], attrs: ["Agility", "Passing"],
    recurrenceRisk: 0.26, weight: 2,
  },
  {
    id: "ankle-sprain",
    titleEn: "Sprained Ankle", titleEs: "Esguince de Tobillo",
    severity: "minor", monthsOut: [1, 2], attrs: ["Agility", "Dribbling"],
    recurrenceRisk: 0.2, weight: 2.5,
  },
  {
    id: "shoulder",
    titleEn: "Dislocated Shoulder", titleEs: "Luxación de Hombro",
    severity: "moderate", monthsOut: [2, 4], attrs: ["Strength", "Heading"],
    recurrenceRisk: 0.32, weight: 2,
  },
  {
    id: "ankle-ligaments",
    titleEn: "Ankle Ligament Damage", titleEs: "Rotura de Ligamentos del Tobillo",
    severity: "moderate", monthsOut: [3, 6], attrs: ["Agility", "Pace", "Dribbling"],
    recurrenceRisk: 0.34, weight: 3,
  },
  {
    id: "knee-cartilage",
    titleEn: "Knee Cartilage Damage", titleEs: "Lesión de Menisco",
    severity: "moderate", monthsOut: [3, 6], attrs: ["Pace", "Agility", "Stamina"],
    recurrenceRisk: 0.36, weight: 2.5, careerRisk: 0.02,
  },
  {
    id: "broken-foot",
    titleEn: "Broken Metatarsal", titleEs: "Fractura de Metatarso",
    severity: "major", monthsOut: [3, 5], attrs: ["Pace", "Finishing", "Agility"],
    recurrenceRisk: 0.2, weight: 2.5,
  },
  {
    id: "back-injury",
    titleEn: "Chronic Back Injury", titleEs: "Lesión Crónica de Espalda",
    severity: "major", monthsOut: [3, 6], attrs: ["Stamina", "Strength", "Pace"],
    recurrenceRisk: 0.48, weight: 2, chronic: true, careerRisk: 0.05, minAge: 24,
  },
  {
    id: "recurring",
    titleEn: "Recurring Injury", titleEs: "Lesión Recurrente",
    severity: "major", monthsOut: [2, 5], attrs: ["Pace", "Stamina", "Agility"],
    recurrenceRisk: 0.55, weight: 2, chronic: true, careerRisk: 0.04, minAge: 20,
  },
  {
    id: "broken-leg",
    titleEn: "Broken Leg", titleEs: "Fractura de Tibia",
    severity: "major", monthsOut: [6, 9], attrs: ["Pace", "Agility", "Strength"],
    recurrenceRisk: 0.24, weight: 1.5, careerRisk: 0.06,
  },
  {
    id: "acl",
    titleEn: "Torn ACL", titleEs: "Rotura de Ligamento Cruzado",
    severity: "severe", monthsOut: [8, 12], attrs: ["Pace", "Agility", "Stamina", "Dribbling"],
    recurrenceRisk: 0.35, weight: 3, careerRisk: 0.04,
  },
  {
    id: "achilles",
    titleEn: "Ruptured Achilles", titleEs: "Rotura del Tendón de Aquiles",
    severity: "severe", monthsOut: [8, 12], attrs: ["Pace", "Agility", "Stamina"],
    recurrenceRisk: 0.3, weight: 2, careerRisk: 0.06, minAge: 22,
  },
  {
    id: "career-threatening",
    titleEn: "Career-Threatening Injury", titleEs: "Lesión que Amenaza tu Carrera",
    severity: "severe", monthsOut: [10, 16],
    attrs: ["Pace", "Stamina", "Agility", "Strength"],
    recurrenceRisk: 0.5, weight: 0.7, chronic: true, careerRisk: 0.2, minAge: 19,
  },
];

const BY_ID = new Map(INJURIES.map((i) => [i.id, i]));

export function injuryById(id: string): InjuryType | undefined {
  return BY_ID.get(id);
}

export function injuriesBySeverity(severity: InjurySeverity): InjuryType[] {
  return INJURIES.filter((i) => i.severity === severity);
}

/** The id the engine should reuse when an old problem flares up again. */
export const RECURRING_INJURY_ID = "recurring";

/* ---------------- recovery choices ---------------- */

export const RECOVERY_CHOICES: {
  id: RecoveryChoice; labelEn: string; labelEs: string; descEn: string; descEs: string;
}[] = [
  {
    id: "aggressive",
    labelEn: "Rush It Back", labelEs: "Forzar la Vuelta",
    descEn: "Back on the pitch far sooner and barely a step slower — but the injury is far likelier to return, and the damage likelier to stick.",
    descEs: "Vuelves al campo mucho antes y casi sin perder un paso — pero es mucho más probable que la lesión vuelva y que el daño se quede.",
  },
  {
    id: "full",
    labelEn: "Full Rehabilitation", labelEs: "Rehabilitación Completa",
    descEn: "The honest road back. Longer out than rushing it, a clean recovery, and no lingering surprises.",
    descEs: "El camino honesto. Más tiempo fuera que forzando, una recuperación limpia y sin sorpresas persistentes.",
  },
  {
    id: "specialist",
    labelEn: "See a Specialist", labelEs: "Acudir a un Especialista",
    descEn: "The longest absence and a temporary dent in your value, but the best chance the body comes back whole.",
    descEs: "La ausencia más larga y un golpe temporal a tu valor, pero la mejor opción de que el cuerpo vuelva entero.",
  },
];

interface ChoiceProfile {
  months: number;      // time-out multiplier
  ovr: number;         // immediate rating-loss multiplier
  permanent: number;   // permanent-damage chance multiplier
  recurrence: number;  // recurrence multiplier
  retirement: number;  // retirement-risk multiplier
  marketPct: number;   // additive market swing (specialist takes a temporary hit)
  formHit: number;     // additive steps on the form ladder
}

const CHOICE: Record<RecoveryChoice, ChoiceProfile> = {
  aggressive: { months: 0.62, ovr: 0.8, permanent: 1.4, recurrence: 1.95, retirement: 1.25, marketPct: 2, formHit: 1 },
  full: { months: 1, ovr: 1, permanent: 1, recurrence: 1, retirement: 1, marketPct: 0, formHit: 0 },
  specialist: { months: 1.32, ovr: 1.12, permanent: 0.45, recurrence: 0.5, retirement: 0.7, marketPct: -8, formHit: 0 },
};

/* ---------------- age curves ---------------- */

/** Severity weight — the raw destructive potential of an injury class. */
const SEVERITY_WEIGHT: Record<InjurySeverity, number> = {
  knock: 0.3, minor: 0.85, moderate: 2.1, major: 3.2, severe: 3.8,
};

/**
 * How badly a body of this age takes the hit. This single curve is why a torn
 * ACL is an inconvenience at 19 and a career question at 35.
 */
function ageHarm(age: number): number {
  if (age <= 18) return 0.32;
  if (age <= 20) return 0.38;
  if (age <= 23) return 0.52;
  if (age <= 26) return 0.72;
  if (age <= 29) return 0.96;
  if (age <= 31) return 1.22;
  if (age <= 33) return 1.55;
  if (age <= 35) return 1.9;
  return 2.3;
}

/** Older bodies simply take longer to heal the same damage. */
function ageHeal(age: number): number {
  if (age <= 21) return 0.9;
  if (age <= 29) return 1;
  if (age <= 33) return 1.15;
  return 1.32;
}

/** How much the transfer market punishes an injury at this age. */
function ageMarket(age: number): number {
  if (age <= 21) return 0.7;
  if (age <= 26) return 1;
  if (age <= 30) return 1.55;
  if (age <= 33) return 2.05;
  return 2.6;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** Uniform draw inside [lo, hi]. */
const between = (rng: () => number, lo: number, hi: number) => lo + rng() * (hi - lo);

/* ---------------- rolling an injury ---------------- */

/** Chance per roll that a player of this age picks anything up at all. */
function baseInjuryChance(age: number): number {
  if (age <= 18) return 0.1;
  if (age <= 21) return 0.12;
  if (age <= 25) return 0.14;
  if (age <= 28) return 0.17;
  if (age <= 31) return 0.22;
  if (age <= 34) return 0.29;
  return 0.37;
}

/** Severity mix — the older the player, the heavier the tail. */
function severityWeights(age: number): Record<InjurySeverity, number> {
  const wear = Math.max(0, age - 27);
  return {
    knock: 34,
    minor: 30,
    moderate: 20 + wear * 0.5,
    major: 11 + wear * 1.0,
    severe: 5 + wear * 1.2,
  };
}

function pickWeighted<T>(items: T[], weightOf: (item: T) => number, rng: () => number): T | null {
  const total = items.reduce((sum, item) => sum + Math.max(0, weightOf(item)), 0);
  if (total <= 0) return null;
  let roll = rng() * total;
  for (const item of items) {
    roll -= Math.max(0, weightOf(item));
    if (roll <= 0) return item;
  }
  return items[items.length - 1] ?? null;
}

/**
 * Does the player get injured, and with what?
 *
 * @param age            current age — drives both the odds and the severity mix.
 * @param riskMultiplier caller's dial: 1 = normal, >1 for a heavy fixture list,
 *                       a rushed comeback or a chronic history; 0 disables.
 * @param rng            injected randomness, so a chapter replays identically.
 * @returns the injury sustained, or null for a clean season.
 */
export function rollInjury(
  age: number, riskMultiplier: number, rng: () => number,
): InjuryType | null {
  const mult = Math.max(0, riskMultiplier);
  if (mult === 0) return null;

  const chance = clamp(baseInjuryChance(age) * mult, 0, 0.9);
  if (rng() >= chance) return null;

  const weights = severityWeights(age);
  const bands: InjurySeverity[] = ["knock", "minor", "moderate", "major", "severe"];
  const severity = pickWeighted(bands, (b) => weights[b], rng) ?? "minor";

  const pool = INJURIES.filter((i) => i.severity === severity && age >= (i.minAge ?? 16));
  const fallback = INJURIES.filter((i) => age >= (i.minAge ?? 16));
  return pickWeighted(pool.length ? pool : fallback, (i) => i.weight ?? 1, rng);
}

/* ---------------- resolving an injury ---------------- */

export interface InjuryOutcome {
  type: InjuryType;
  /** Months on the sidelines after age and rehab modifiers. */
  monthsOut: number;
  /**
   * Overall rating points LOST, as a positive magnitude — subtract it. A true
   * knock resolves to 0 at every age. When `permanentLoss` is false the player
   * can win these points back through normal development; when it is true they
   * are gone, and the ceiling should be lowered with them.
   */
  ovrLoss: number;
  /** Attribute damage, already negative. Empty when nothing was lost. */
  attrDeltas: AttrDelta[];
  /** Share of a season's appearances missed, 0-95. */
  appsLostPct: number;
  /** Steps DOWN the form ladder on return, 0-3. */
  formHit: number;
  /** Market-value change as a percentage (negative). */
  marketPct: number;
  /** True when `ovrLoss` never comes back — the body is permanently changed. */
  permanentLoss: boolean;
  /** Chance (0-1) this flares up again in a later season. */
  recurrenceRisk: number;
  /** Chance (0-1) this ends the career here. */
  retirementRisk: number;
  summaryEn: string;
  summaryEs: string;
}

type AgeBand = "young" | "prime" | "late" | "veteran";

function ageBand(age: number): AgeBand {
  if (age <= 21) return "young";
  if (age <= 28) return "prime";
  if (age <= 32) return "late";
  return "veteran";
}

/** Split the lost points across the attributes the injury actually attacks. */
function spreadLoss(attrs: string[], points: number, rng: () => number): AttrDelta[] {
  if (points <= 0 || attrs.length === 0) return [];
  const list = attrs.slice(0, 4);
  const out: AttrDelta[] = [];
  let left = points;
  list.forEach((label, i) => {
    if (left <= 0) return;
    const isLast = i === list.length - 1;
    let take: number;
    if (isLast) take = left;
    else if (i === 0) take = Math.max(1, Math.ceil(left * between(rng, 0.4, 0.65)));
    else take = Math.max(0, Math.round(left * between(rng, 0.3, 0.6)));
    take = Math.min(take, left);
    left -= take;
    if (take > 0) out.push({ label, delta: -take });
  });
  return out;
}

function monthsPhrase(months: number, es: boolean): string {
  if (months <= 0) return es ? "unas semanas fuera" : "a few weeks out";
  if (months === 1) return es ? "un mes fuera" : "a month out";
  return es ? `${months} meses fuera` : `${months} months out`;
}

const LIGHT_BODY: Record<AgeBand, [string, string]> = {
  young: [
    "Nothing lasting — you were back in training before anyone had finished worrying.",
    "Nada duradero — volviste a entrenar antes de que nadie terminara de preocuparse.",
  ],
  prime: [
    "A routine setback in a body that still bounces straight back.",
    "Un contratiempo rutinario en un cuerpo que aún responde de inmediato.",
  ],
  late: [
    "It takes a fortnight longer to shake off than it used to.",
    "Cuesta quince días más de lo que solía quitártelo de encima.",
  ],
  veteran: [
    "At your age even the small things sit on you for a while.",
    "A tu edad hasta lo pequeño se te queda encima un tiempo.",
  ],
};

const HEAVY_RECOVERED: Record<AgeBand, [string, string]> = {
  young: [
    "Young joints forgive. The rating comes back and the burst with it — only your development stalls.",
    "Las articulaciones jóvenes perdonan. La valoración vuelve y la explosividad también — solo se frena tu desarrollo.",
  ],
  prime: [
    "You return more or less whole, though the first months back are a search for your old self.",
    "Vuelves prácticamente entero, aunque los primeros meses son una búsqueda de tu antiguo yo.",
  ],
  late: [
    "You get back on the pitch, but every recruitment department made a note of the date.",
    "Vuelves al campo, pero todas las secretarías técnicas apuntaron la fecha.",
  ],
  veteran: [
    "You come back — and from now on everyone watches how you move.",
    "Vuelves — y a partir de ahora todos miran cómo te mueves.",
  ],
};

const HEAVY_PERMANENT: Record<AgeBand, [string, string]> = {
  young: [
    "A sliver of the burst never fully returns, but at your age there is time to build a game around it.",
    "Una parte de la explosividad no vuelve del todo, pero a tu edad hay tiempo para construir otro juego.",
  ],
  prime: [
    "The explosiveness is permanently blunted; from here you play with your head instead of your legs.",
    "La explosividad queda mermada para siempre; desde aquí juegas con la cabeza y no con las piernas.",
  ],
  late: [
    "The pace is gone for good, and the biggest clubs quietly stop calling.",
    "La velocidad se va para siempre, y los grandes clubes dejan de llamar en silencio.",
  ],
  veteran: [
    "You never get back to the level you left behind on that pitch.",
    "Nunca recuperas el nivel que dejaste en aquel campo.",
  ],
};

function buildSummary(
  type: InjuryType, age: number, months: number, heavy: boolean,
  permanent: boolean, retirementRisk: number, recurrenceRisk: number,
  choice: RecoveryChoice, es: boolean,
): string {
  const band = ageBand(age);
  const body = heavy
    ? (permanent ? HEAVY_PERMANENT : HEAVY_RECOVERED)[band]
    : LIGHT_BODY[band];

  const parts = [
    `${es ? type.titleEs : type.titleEn}. ${capitalise(monthsPhrase(months, es))}.`,
    body[es ? 1 : 0],
  ];

  if (retirementRisk >= 0.5) {
    parts.push(es ? "El cuerpo médico habla abiertamente de parar." : "The medical staff talk openly about stopping.");
  } else if (retirementRisk >= 0.25) {
    parts.push(es ? "La retirada ya es una conversación real." : "Retirement is now a live conversation.");
  }

  if (recurrenceRisk >= 0.45) {
    parts.push(es ? "Esto va a volver a resentirse." : "This one is going to flare up again.");
  }

  if (choice === "aggressive" && heavy) {
    parts.push(es ? "Y forzaste la vuelta." : "And you rushed the way back.");
  } else if (choice === "specialist") {
    parts.push(es ? "El especialista te costó meses y algo de valor de mercado." : "The specialist cost you months and a slice of your market value.");
  } else if (choice === "full" && heavy) {
    parts.push(es ? "Hiciste la rehabilitación como toca." : "You did the rehab properly.");
  }

  return parts.join(" ");
}

function capitalise(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

/**
 * Turn an injury into consequences.
 *
 * Everything below is severity × age × rehab choice, drawn through `rng` — the
 * same ACL never resolves the same way twice, and never resolves the same way
 * at 19 as it does at 34.
 */
export function resolveInjury(
  type: InjuryType, age: number, choice: RecoveryChoice, rng: () => number,
): InjuryOutcome {
  const profile = CHOICE[choice];
  const sev = SEVERITY_WEIGHT[type.severity];
  const harm = ageHarm(age);
  const heavy = type.severity === "moderate" || type.severity === "major" || type.severity === "severe";

  // ---- time out ----
  const [lo, hi] = type.monthsOut;
  const rawMonths = between(rng, lo, hi) * profile.months * ageHeal(age);
  const monthsOut = Math.max(0, Math.round(rawMonths));

  // ---- permanent damage ----
  // A knock is a knock at any age: nothing about it is ever permanent.
  const permChance = type.severity === "knock"
    ? 0
    : clamp((sev / 10) * harm * profile.permanent, 0, 0.92);
  const permanentLoss = rng() < permChance;

  // ---- rating loss ----
  // sev × harm is the whole model. At the light end the product is a fraction
  // of a point, which is exactly why a minor knock can never cost five overall.
  const swing = between(rng, 0.6, 1.3);
  let loss = sev * harm * swing * profile.ovr;
  if (permanentLoss) loss *= 1.18;
  if (type.chronic) loss *= 1.1;
  const ovrLoss = clamp(Math.round(loss), 0, 14);

  // ---- attributes ----
  // Attributes move further than the overall does, except at the very light end
  // where amplifying a single point would make a bruise look like a breakdown.
  const attrPoints = ovrLoss <= 1 ? ovrLoss : Math.round(ovrLoss * 1.7);
  const attrDeltas = spreadLoss(type.attrs, attrPoints, rng);

  // ---- appearances & form ----
  const appsLostPct = clamp(Math.round((monthsOut / 10) * 100), 0, 95);
  const formSteps = { knock: 0, minor: 1, moderate: 1, major: 2, severe: 2 }[type.severity]
    + (type.severity === "severe" && age >= 30 ? 1 : 0)
    + (type.severity === "knock" ? 0 : profile.formHit);
  const formHit = clamp(Math.round(formSteps), 0, 3);

  // ---- market ----
  const marketBase = -(sev * 2.6 * ageMarket(age)) * between(rng, 0.85, 1.15);
  const marketPct = clamp(Math.round(marketBase + profile.marketPct), -60, 0);

  // ---- recurrence ----
  const recurrenceAge = age <= 23 ? 0.82 : age <= 29 ? 1 : age <= 33 ? 1.2 : 1.4;
  // A chronic problem laughs at good rehab — the specialist buys much less here.
  const rehab = type.chronic ? 1 + (profile.recurrence - 1) * 0.55 : profile.recurrence;
  const recurrenceRisk = Math.round(
    clamp(type.recurrenceRisk * recurrenceAge * rehab * between(rng, 0.85, 1.15), 0.02, 0.88) * 100,
  ) / 100;

  // ---- retirement ----
  const wear = Math.max(0, age - 29);
  const retireRaw = ((sev / 5) * wear * 0.075 + (type.careerRisk ?? 0) * harm) * profile.retirement;
  const retirementRisk = Math.round(clamp(retireRaw * between(rng, 0.85, 1.15), 0, 0.9) * 100) / 100;

  return {
    type,
    monthsOut,
    ovrLoss,
    attrDeltas,
    appsLostPct,
    formHit,
    marketPct,
    permanentLoss: permanentLoss && ovrLoss > 0,
    recurrenceRisk,
    retirementRisk,
    summaryEn: buildSummary(type, age, monthsOut, heavy, permanentLoss && ovrLoss > 0, retirementRisk, recurrenceRisk, choice, false),
    summaryEs: buildSummary(type, age, monthsOut, heavy, permanentLoss && ovrLoss > 0, retirementRisk, recurrenceRisk, choice, true),
  };
}

/* ---------------- follow-ups ---------------- */

/** Did an old problem come back? Feed a previous outcome's recurrenceRisk. */
export function rollRecurrence(previous: InjuryOutcome, rng: () => number): boolean {
  return rng() < previous.recurrenceRisk;
}

/** Did the injury end the career? Feed a resolved outcome. */
export function rollRetirement(outcome: InjuryOutcome, rng: () => number): boolean {
  return rng() < outcome.retirementRisk;
}

/**
 * The injury the engine should use for a flare-up: the recurring-problem entry,
 * falling back to the original if the table were ever edited out from under it.
 */
export function recurrenceOf(previous: InjuryType): InjuryType {
  return injuryById(RECURRING_INJURY_ID) ?? previous;
}
