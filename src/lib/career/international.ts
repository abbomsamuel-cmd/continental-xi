/* ------------------------------------------------------------------ */
/*  The international career.                                          */
/*                                                                     */
/*  The whole point of this module is that a call-up is RELATIVE. A 72 */
/*  overall is a national mainstay in Panama and an anonymous domestic */
/*  player in Brazil, France or England — same player, same season,    */
/*  two completely different international lives. Everything here      */
/*  therefore hangs off `selectionBar(nation.strength)` rather than    */
/*  any absolute rating.                                               */
/*                                                                     */
/*  A chapter is two years of the international calendar: roughly ten  */
/*  to twelve fixtures a year (qualifiers, friendlies, one major       */
/*  tournament), which is why caps arrive in batches of 8–20 for a     */
/*  regular starter instead of one at a time.                          */
/*                                                                     */
/*  Pure module: deterministic, no I/O, no Math.random(). Randomness   */
/*  is always injected as `rng` so a chapter can be replayed exactly.  */
/* ------------------------------------------------------------------ */

import { nationByName, type Nation, type NationRegion } from "./nations";
import type { CareerPositionId } from "./types";

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */

export interface IntlState {
  /** Country currently represented (may change once, via the dual choice). */
  nation: string;
  calledUp: boolean;
  debutYear: number | null;
  caps: number;
  goals: number;
  assists: number;
  captain: boolean;
  /** International retirement — the club career can continue for years after. */
  retired: boolean;
  /** Tournaments attended, as `"World Cup 2030"`. Label via `tournamentLabel`. */
  tournaments: string[];
  /** Honours won, as `"World Cup · Winner 2030"`. Label via `honourLabel`. */
  majorHonours: string[];
}

export function emptyIntlState(nation: string): IntlState {
  return {
    nation,
    calledUp: false,
    debutYear: null,
    caps: 0,
    goals: 0,
    assists: 0,
    captain: false,
    retired: false,
    tournaments: [],
    majorHonours: [],
  };
}

/* ------------------------------------------------------------------ */
/*  Selection                                                          */
/* ------------------------------------------------------------------ */

function clamp(value: number, lo: number, hi: number): number {
  if (!Number.isFinite(value)) return lo;
  return Math.min(hi, Math.max(lo, value));
}

/**
 * The overall a player must reach to be in contention for a nation's squad.
 *
 * Brazil/France (92) → ~81, Panama (48) → ~64, Fiji (20) → ~53. This single
 * line is what makes the same rating mean two different careers.
 */
export function selectionBar(nationStrength: number): number {
  return Math.round(clamp(45.5 + clamp(nationStrength, 0, 100) * 0.385, 48, 84));
}

/** Age is not linear: teenagers must be exceptional, mid-30s legs get cut. */
function ageAdjust(age: number): number {
  if (age < 17) return -6;
  if (age === 17) return -4;
  if (age === 18) return -2.5;
  if (age <= 20) return -1;
  if (age <= 30) return 0;
  if (age <= 32) return -1;
  if (age === 33) return -2.5;
  if (age === 34) return -4;
  return -6.5;
}

/** `form` is a season average match rating (roughly 5.6–8.6). */
function formAdjust(form: number): number {
  return clamp((form - 6.8) * 3.2, -5, 5.5);
}

/** Playing at a big club is itself a selection argument. */
function clubAdjust(clubReputation: number): number {
  return clamp((clubReputation - 62) * 0.075, -2.5, 2.5);
}

/**
 * The player's level as a national selector reads it: overall, plus what he is
 * doing right now, minus what his age costs him, plus the pull of his club.
 */
export function effectiveIntlLevel(
  overall: number,
  age: number,
  form: number,
  clubReputation = 62,
): number {
  return overall + ageAdjust(age) + formAdjust(form) + clubAdjust(clubReputation);
}

/**
 * Is this player in contention for his nation's squad?
 *
 * @param form season average match rating (roughly 5.6–8.6), not a 0–100 value.
 */
export function isSelectable(
  overall: number,
  age: number,
  nationStrength: number,
  form: number,
): boolean {
  if (age < 16) return false;
  return effectiveIntlLevel(overall, age, form) >= selectionBar(nationStrength);
}

/* ------------------------------------------------------------------ */
/*  Tournaments                                                        */
/* ------------------------------------------------------------------ */

const TOURNAMENTS: Record<string, { en: string; es: string }> = {
  "World Cup": { en: "World Cup", es: "Copa del Mundo" },
  "European Championship": { en: "European Championship", es: "Eurocopa" },
  "Copa América": { en: "Copa América", es: "Copa América" },
  "Gold Cup": { en: "Gold Cup", es: "Copa Oro" },
  "Africa Cup of Nations": { en: "Africa Cup of Nations", es: "Copa Africana de Naciones" },
  "Asian Cup": { en: "Asian Cup", es: "Copa Asiática" },
  "OFC Nations Cup": { en: "OFC Nations Cup", es: "Copa de Naciones de la OFC" },
};

const CONTINENTAL: Record<NationRegion, string> = {
  Europe: "European Championship",
  "South America": "Copa América",
  "North America": "Gold Cup",
  "Central America": "Gold Cup",
  Caribbean: "Gold Cup",
  Africa: "Africa Cup of Nations",
  Asia: "Asian Cup",
  "Middle East": "Asian Cup",
  Oceania: "OFC Nations Cup",
};

const HONOUR_KINDS: Record<string, { en: string; es: string }> = {
  Winner: { en: "Winner", es: "Campeón" },
  "Runner-Up": { en: "Runner-Up", es: "Subcampeón" },
  "Golden Boot": { en: "Golden Boot", es: "Bota de Oro" },
  "Player of the Tournament": { en: "Player of the Tournament", es: "Mejor Jugador del Torneo" },
};

const HONOUR_SEP = " · ";

function splitYear(entry: string): { body: string; year: string } {
  const m = /\s(\d{4})$/.exec(entry);
  if (!m) return { body: entry, year: "" };
  return { body: entry.slice(0, entry.length - 5), year: ` ${m[1]}` };
}

/** `"World Cup 2030"` → EN/ES display strings. */
export function tournamentLabel(entry: string): { en: string; es: string } {
  const { body, year } = splitYear(entry);
  const t = TOURNAMENTS[body];
  if (!t) return { en: entry, es: entry };
  return { en: `${t.en}${year}`, es: `${t.es}${year}` };
}

/** `"World Cup · Winner 2030"` → EN/ES display strings. */
export function honourLabel(entry: string): { en: string; es: string } {
  const { body, year } = splitYear(entry);
  const idx = body.indexOf(HONOUR_SEP);
  if (idx < 0) return { en: entry, es: entry };
  const t = TOURNAMENTS[body.slice(0, idx)];
  const k = HONOUR_KINDS[body.slice(idx + HONOUR_SEP.length)];
  if (!t || !k) return { en: entry, es: entry };
  return {
    en: `${t.en}${HONOUR_SEP}${k.en}${year}`,
    es: `${t.es}${HONOUR_SEP}${k.es}${year}`,
  };
}

/**
 * Confederation shape. `wc*`/`cont*` define the qualification curve
 * `(strength - floor) / span`; `benchmark` is the strength a nation needs to be
 * a genuine contender in its own continental tournament.
 *
 * A `contSpan` of 1 with a `contFloor` of 0 means "everyone plays" — CONMEBOL's
 * ten nations all contest the Copa América, and the OFC Nations Cup is open.
 */
interface Confederation {
  wcFloor: number;
  wcSpan: number;
  contFloor: number;
  contSpan: number;
  benchmark: number;
}

const CONF: Record<NationRegion, Confederation> = {
  Europe: { wcFloor: 58, wcSpan: 26, contFloor: 50, contSpan: 22, benchmark: 86 },
  "South America": { wcFloor: 52, wcSpan: 22, contFloor: 0, contSpan: 1, benchmark: 86 },
  "North America": { wcFloor: 40, wcSpan: 24, contFloor: 0, contSpan: 1, benchmark: 74 },
  "Central America": { wcFloor: 42, wcSpan: 22, contFloor: 28, contSpan: 20, benchmark: 74 },
  Caribbean: { wcFloor: 44, wcSpan: 22, contFloor: 24, contSpan: 22, benchmark: 74 },
  Africa: { wcFloor: 52, wcSpan: 26, contFloor: 34, contSpan: 22, benchmark: 80 },
  Asia: { wcFloor: 42, wcSpan: 26, contFloor: 28, contSpan: 20, benchmark: 78 },
  "Middle East": { wcFloor: 46, wcSpan: 24, contFloor: 28, contSpan: 20, benchmark: 78 },
  Oceania: { wcFloor: 48, wcSpan: 22, contFloor: 0, contSpan: 1, benchmark: 62 },
};

/** World Cups land on years ≡ 2 (mod 4); continentals on years ≡ 0 (mod 4). */
export function tournamentInWindow(
  nation: string,
  firstYear: number,
): { key: string; year: number; isWorldCup: boolean } {
  const evenYear = firstYear % 2 === 0 ? firstYear : firstYear + 1;
  const isWorldCup = ((evenYear % 4) + 4) % 4 === 2;
  const region = nationByName(nation)?.region ?? "Europe";
  return { key: isWorldCup ? "World Cup" : CONTINENTAL[region], year: evenYear, isWorldCup };
}

/* ------------------------------------------------------------------ */
/*  Output rates                                                       */
/* ------------------------------------------------------------------ */

/** Goals per cap. International football is tighter than league football. */
const INTL_GOAL_RATE: Record<CareerPositionId, number> = {
  ST: 0.42, RW: 0.25, LW: 0.25, CAM: 0.22, CM: 0.1,
  CDM: 0.04, RB: 0.03, LB: 0.03, CB: 0.05, GK: 0,
};
const INTL_ASSIST_RATE: Record<CareerPositionId, number> = {
  ST: 0.12, RW: 0.22, LW: 0.22, CAM: 0.26, CM: 0.14,
  CDM: 0.06, RB: 0.1, LB: 0.1, CB: 0.02, GK: 0.01,
};

/** Caps available per year at each standing in the squad. */
function capsPerYear(margin: number): number {
  if (margin >= 9) return 9.5; // talisman — plays everything he is fit for
  if (margin >= 4) return 8.5; // nailed-on starter
  if (margin >= 0) return 6.0; // squad regular
  return 3.0; // fringe, in and out
}

/**
 * When the international career ends. Strong nations keep a player longer
 * because the shirt is worth the travel; weaker federations move on sooner as
 * a generation turns over. Typically 33–36.
 */
export function intlRetirementAge(nationStrength: number, rng: () => number): number {
  let age = 33;
  if (nationStrength >= 60) age += 1;
  if (nationStrength >= 78) age += 1;
  if (nationStrength >= 88) age += 1;
  const jitter = rng();
  if (jitter < 0.22) age -= 1;
  else if (jitter > 0.86) age += 1;
  return clamp(age, 31, 38);
}

/* ------------------------------------------------------------------ */
/*  Chapter simulation                                                 */
/* ------------------------------------------------------------------ */

/** How far the nation went, when the player was actually there. */
export interface IntlRun {
  /** Matching entry in `tournaments`, e.g. `"World Cup 2030"`. */
  tournament: string;
  stageEn: string;
  stageEs: string;
}

export interface IntlChapterResult {
  capsGained: number;
  goalsGained: number;
  assistsGained: number;
  debut: boolean;
  /** Tournaments attended during THIS chapter. */
  tournaments: string[];
  /** Honours won during THIS chapter. */
  honours: string[];
  becameCaptain: boolean;
  retiredIntl: boolean;
  headlineEn: string;
  headlineEs: string;
  state: IntlState;
  /** Extra colour for the summary card — tournament runs, deepest first. */
  runs: IntlRun[];
  /** True when the player was in the squad at all during the chapter. */
  selected: boolean;
}

const STAGES: { min: number; key: string; en: string; es: string }[] = [
  { min: 78, key: "Winner", en: "won it", es: "lo ganó" },
  { min: 68, key: "Runner-Up", en: "lost the final", es: "perdió la final" },
  { min: 58, key: "Semi", en: "reached the semi-finals", es: "llegó a semifinales" },
  { min: 46, key: "Quarter", en: "reached the quarter-finals", es: "llegó a cuartos de final" },
  { min: 0, key: "Group", en: "went out early", es: "cayó pronto" },
];

function stageFor(run: number): { key: string; en: string; es: string } {
  for (const s of STAGES) if (run >= s.min) return s;
  return STAGES[STAGES.length - 1];
}

export function simulateIntlChapter(opts: {
  state: IntlState;
  overall: number;
  age: number;
  nationStrength: number;
  avgRating: number;
  clubReputation: number;
  rng: () => number;
  /** First calendar year of the chapter. Falls back to an age-derived year. */
  year?: number;
  /** Sharpens the goal/assist model; a neutral midfield rate is used without it. */
  position?: CareerPositionId;
  /** Years in the chapter (defaults to the two-year age chapter). */
  years?: number;
}): IntlChapterResult {
  const { state, overall, age, nationStrength, avgRating, clubReputation, rng } = opts;
  const years = Math.max(1, opts.years ?? 2);
  const anchorYear = opts.year ?? 2026 + Math.max(0, age - 16);

  const next: IntlState = {
    ...state,
    tournaments: [...state.tournaments],
    majorHonours: [...state.majorHonours],
  };

  const blank = (en: string, es: string): IntlChapterResult => ({
    capsGained: 0, goalsGained: 0, assistsGained: 0, debut: false,
    tournaments: [], honours: [], becameCaptain: false, retiredIntl: false,
    headlineEn: en, headlineEs: es, state: next, runs: [], selected: false,
  });

  // An international career only ends once.
  if (state.retired) {
    return blank(
      "Your international career is already behind you.",
      "Tu carrera internacional ya quedó atrás.",
    );
  }

  /* ---- standing in the squad ---- */
  // The middle of the chapter is the fair point to judge from: a two-year jump
  // should not be scored entirely on the player he was on day one.
  const midAge = age + Math.floor(years / 2);
  const bar = selectionBar(nationStrength);
  const margin = effectiveIntlLevel(overall, midAge, avgRating, clubReputation) - bar;

  let selected = midAge >= 16 && margin >= 0;
  let fringe = false;
  if (!selected && midAge >= 16 && margin >= -4) {
    // Near misses still get the odd friendly — the door is ajar, not shut.
    fringe = rng() < 0.3 + margin * 0.05;
    selected = fringe;
  } else {
    // Keep the rng stream aligned whichever branch is taken, so a replay of the
    // same chapter always produces the same football.
    rng();
  }

  /* ---- how much of the chapter he is still available for ---- */
  const retireAge = intlRetirementAge(nationStrength, rng);
  const activeYears = clamp(retireAge - age, 0, years);

  if ((state.calledUp || selected) && activeYears <= 0) {
    next.retired = true;
    const caps = next.caps;
    return {
      ...blank(
        `You stepped away from ${state.nation} with ${caps} caps.`,
        `Te retiraste de ${state.nation} con ${caps} internacionalidades.`,
      ),
      retiredIntl: true,
      state: next,
    };
  }

  if (!selected) {
    const en = state.calledUp
      ? `No call came from ${state.nation} — the squad moved on without you.`
      : age <= 21
        ? `Still waiting on ${state.nation}. The level is close, not there.`
        : `${state.nation} looked elsewhere. The call never came.`;
    const es = state.calledUp
      ? `No hubo llamada de ${state.nation} — la selección siguió sin ti.`
      : age <= 21
        ? `Aún esperando a ${state.nation}. El nivel está cerca, pero no llega.`
        : `${state.nation} miró hacia otro lado. La llamada nunca llegó.`;
    // A player dropped for good in his thirties is effectively finished.
    if (state.calledUp && age + years >= 32) {
      next.retired = true;
      return {
        ...blank(
          `Your ${state.nation} career quietly ended on ${next.caps} caps.`,
          `Tu etapa con ${state.nation} terminó en silencio con ${next.caps} internacionalidades.`,
        ),
        retiredIntl: true,
        state: next,
      };
    }
    return blank(en, es);
  }

  /* ---- caps, goals, assists ---- */
  const debut = !state.calledUp;
  if (debut) {
    next.calledUp = true;
    next.debutYear = anchorYear;
  }

  const availability = activeYears / years;
  // A debutant breaks in partway through the window rather than from day one.
  const rampUp = debut ? 0.62 : 1;
  const rawCaps = capsPerYear(margin) * years * availability * rampUp * (0.8 + rng() * 0.45);
  const capsGained = Math.max(debut || fringe ? 1 : 2, Math.round(rawCaps));

  const goalRate = opts.position ? INTL_GOAL_RATE[opts.position] : 0.13;
  const assistRate = opts.position ? INTL_ASSIST_RATE[opts.position] : 0.13;
  const quality = clamp(0.6 + (overall - 66) * 0.03, 0.45, 1.6);
  const sharpness = clamp(0.8 + (avgRating - 6.8) * 0.25, 0.7, 1.35);
  const goalsGained = Math.max(0, Math.round(capsGained * goalRate * quality * sharpness * (0.75 + rng() * 0.5)));
  const assistsGained = Math.max(0, Math.round(capsGained * assistRate * quality * sharpness * (0.75 + rng() * 0.5)));

  next.caps += capsGained;
  next.goals += goalsGained;
  next.assists += assistsGained;

  /* ---- the major tournament inside this window ---- */
  const region = nationByName(state.nation)?.region ?? "Europe";
  const conf = CONF[region];
  const { key: tKey, year: tYear, isWorldCup } = tournamentInWindow(state.nation, anchorYear);

  const qualFloor = isWorldCup ? conf.wcFloor : conf.contFloor;
  const qualSpan = isWorldCup ? conf.wcSpan : conf.contSpan;
  // A genuine star drags a nation through qualifying — but only so far.
  const starPull = clamp(Math.max(0, margin) * 0.012, 0, 0.18);
  const qualified = rng() < clamp((nationStrength - qualFloor) / qualSpan, 0, 1) + starPull;

  // If he retires inside the chapter, a tournament in the closing year is gone.
  const stillThere = tYear <= anchorYear + Math.ceil(activeYears) - 1;
  const attended = qualified && stillThere && !fringe;

  const tournaments: string[] = [];
  const honours: string[] = [];
  const runs: IntlRun[] = [];

  if (attended) {
    const entry = `${tKey} ${tYear}`;
    tournaments.push(entry);
    next.tournaments.push(entry);

    const benchmark = isWorldCup ? 88 : conf.benchmark;
    // Bounded so a minnow is never mathematically eliminated and a giant is
    // never guaranteed — the tournament still has to be played.
    const strengthTerm = clamp((nationStrength - benchmark) * 1.8, -40, 24);
    const upset = rng() < 0.07 ? 22 : 0;
    const run = 50 + strengthTerm + clamp(margin, -6, 26) * 0.8 + (rng() - 0.5) * 54 + upset;
    const stage = stageFor(run);
    runs.push({ tournament: entry, stageEn: stage.en, stageEs: stage.es });

    if (stage.key === "Winner" || stage.key === "Runner-Up") {
      const h = `${tKey}${HONOUR_SEP}${stage.key} ${tYear}`;
      honours.push(h);
      next.majorHonours.push(h);
    }
    // Individual awards ride on the run, the level and the position.
    if (run >= 58 && goalRate >= 0.2 && overall >= 80 && rng() < 0.16 + clamp(margin, 0, 20) * 0.008) {
      const h = `${tKey}${HONOUR_SEP}Golden Boot ${tYear}`;
      honours.push(h);
      next.majorHonours.push(h);
    }
    if (run >= 68 && margin >= 8 && rng() < 0.25) {
      const h = `${tKey}${HONOUR_SEP}Player of the Tournament ${tYear}`;
      honours.push(h);
      next.majorHonours.push(h);
    }
  }

  /* ---- armband ---- */
  const capsForArmband = nationStrength >= 78 ? 40 : nationStrength >= 58 ? 30 : 22;
  const becameCaptain =
    !state.captain && next.caps >= capsForArmband && age + years >= 27 && margin >= 3 && rng() < 0.55;
  if (becameCaptain) next.captain = true;

  /* ---- international retirement ---- */
  const retiredIntl = activeYears < years || age + years >= retireAge;
  if (retiredIntl) next.retired = true;

  /* ---- headline ---- */
  const head = headline({
    nation: state.nation, retiredIntl, honours, runs, debut, becameCaptain,
    attended, capsGained, goalsGained, caps: next.caps, fringe, tKey,
  });

  return {
    capsGained,
    goalsGained,
    assistsGained,
    debut,
    tournaments,
    honours,
    becameCaptain,
    retiredIntl,
    headlineEn: head.en,
    headlineEs: head.es,
    state: next,
    runs,
    selected: true,
  };
}

function headline(o: {
  nation: string;
  retiredIntl: boolean;
  honours: string[];
  runs: IntlRun[];
  debut: boolean;
  becameCaptain: boolean;
  attended: boolean;
  capsGained: number;
  goalsGained: number;
  caps: number;
  fringe: boolean;
  tKey: string;
}): { en: string; es: string } {
  const t = TOURNAMENTS[o.tKey] ?? { en: o.tKey, es: o.tKey };
  const won = o.honours.find((h) => h.includes(`${HONOUR_SEP}Winner `));
  const lostFinal = o.honours.find((h) => h.includes(`${HONOUR_SEP}Runner-Up `));

  if (won) {
    return {
      en: `Champions. You lifted the ${t.en} with ${o.nation}.`,
      es: `Campeones. Levantaste la ${t.es} con ${o.nation}.`,
    };
  }
  if (lostFinal) {
    return {
      en: `One game short — beaten in the ${t.en} final.`,
      es: `A un partido — derrota en la final de la ${t.es}.`,
    };
  }
  if (o.retiredIntl) {
    return {
      en: `You said goodbye to ${o.nation} on ${o.caps} caps.`,
      es: `Te despediste de ${o.nation} con ${o.caps} internacionalidades.`,
    };
  }
  if (o.debut) {
    const scored = o.goalsGained > 0 ? ` ${o.goalsGained} goals already.` : "";
    const scoredEs = o.goalsGained > 0 ? ` Ya llevas ${o.goalsGained} goles.` : "";
    return {
      en: `You made your ${o.nation} debut — ${o.capsGained} caps in two years.${scored}`,
      es: `Debutaste con ${o.nation} — ${o.capsGained} internacionalidades en dos años.${scoredEs}`,
    };
  }
  if (o.becameCaptain) {
    return {
      en: `You were handed the ${o.nation} armband.`,
      es: `Te dieron el brazalete de ${o.nation}.`,
    };
  }
  const deep = o.runs[0];
  if (deep) {
    return {
      en: `${o.nation} ${deep.stageEn} at the ${t.en}.`,
      es: `${o.nation} ${deep.stageEs} en la ${t.es}.`,
    };
  }
  if (o.attended) {
    return {
      en: `You played at the ${t.en} with ${o.nation}.`,
      es: `Jugaste la ${t.es} con ${o.nation}.`,
    };
  }
  if (o.fringe) {
    return {
      en: `In and out of the ${o.nation} squad — ${o.capsGained} caps.`,
      es: `Entrando y saliendo de ${o.nation} — ${o.capsGained} internacionalidades.`,
    };
  }
  return {
    en: `A regular for ${o.nation} — ${o.capsGained} more caps, ${o.caps} in total.`,
    es: `Fijo con ${o.nation} — ${o.capsGained} internacionalidades más, ${o.caps} en total.`,
  };
}

/* ------------------------------------------------------------------ */
/*  Dual nationality                                                   */
/*                                                                     */
/*  Real football is full of this decision: the Panamanian-Colombian,  */
/*  the French-Algerian, the English-Jamaican. Declared one way only;  */
/*  the links are mirrored at module load so either side finds the     */
/*  other. Nations with no plausible partner simply return [] and the  */
/*  choice never fires for them.                                       */
/* ------------------------------------------------------------------ */

const RAW_DUAL: Record<string, string[]> = {
  // ---- Western Europe and its diasporas ----
  France: ["Algeria", "Morocco", "Senegal", "Mali", "Cameroon", "Ivory Coast", "Tunisia", "DR Congo", "Guinea", "Portugal", "Haiti", "Congo", "Gabon", "Armenia"],
  England: ["Jamaica", "Ireland", "Nigeria", "Ghana", "Trinidad and Tobago", "Barbados", "Grenada", "Scotland", "Wales", "Cyprus", "South Africa", "Zimbabwe", "Kenya", "India", "Malaysia", "Australia"],
  Spain: ["Morocco", "Argentina", "Venezuela", "Colombia", "Dominican Republic", "Cuba", "Peru", "Uruguay", "Ecuador", "Paraguay", "Bolivia", "Guatemala", "Puerto Rico", "Philippines"],
  Germany: ["Turkey", "Poland", "Ghana", "Tunisia", "Croatia", "Kosovo", "Bosnia and Herzegovina", "Serbia", "Georgia", "Iran", "Nigeria", "Egypt", "Cameroon", "Kazakhstan", "Ukraine"],
  Netherlands: ["Curacao", "Aruba", "Morocco", "Turkey", "Indonesia", "Cape Verde", "Ghana", "Nigeria", "Iraq"],
  Belgium: ["DR Congo", "Morocco", "Albania", "Kosovo", "Turkey", "Guinea", "Ivory Coast"],
  Portugal: ["Cape Verde", "Angola", "Mozambique", "Brazil", "Canada"],
  Italy: ["Albania", "Argentina", "Brazil", "Morocco", "Ghana", "Uruguay", "Romania", "Egypt", "Venezuela", "Australia"],
  Switzerland: ["Kosovo", "Albania", "North Macedonia", "Bosnia and Herzegovina", "Turkey", "Cape Verde", "Montenegro", "Serbia", "Croatia"],
  Austria: ["Turkey", "Bosnia and Herzegovina", "Serbia", "Nigeria", "Kosovo", "Hungary", "Slovenia", "Slovakia"],
  Sweden: ["Bosnia and Herzegovina", "Iraq", "Syria", "Gambia", "Finland", "Kosovo", "Lebanon", "Thailand"],
  Norway: ["Gambia", "Kosovo", "Iceland"],
  Denmark: ["Turkey", "Morocco", "Ghana", "Kosovo", "Iceland", "Kenya"],
  Ireland: ["England", "Scotland", "Northern Ireland", "Nigeria", "United States"],
  Scotland: ["Northern Ireland", "Poland", "Jamaica"],
  Wales: ["England", "Jamaica"],
  "Northern Ireland": ["Ireland", "England"],
  Greece: ["Australia", "Albania", "Cyprus", "Georgia"],
  Finland: ["Kosovo", "Iceland"],

  // ---- Central & Eastern Europe ----
  Croatia: ["Bosnia and Herzegovina", "Australia", "Canada", "Serbia"],
  Serbia: ["Montenegro", "Bosnia and Herzegovina", "Hungary", "Australia"],
  "Bosnia and Herzegovina": ["Croatia", "Montenegro", "Slovenia"],
  Kosovo: ["Albania", "North Macedonia"],
  Albania: ["North Macedonia", "Montenegro"],
  "North Macedonia": ["Australia", "Turkey"],
  Slovenia: ["Croatia"],
  Slovakia: ["Czech Republic", "Hungary"],
  "Czech Republic": ["Vietnam"],
  Hungary: ["Romania", "Slovakia"],
  Romania: ["Moldova", "Hungary"],
  Poland: ["United States", "Ukraine"],
  Ukraine: ["Poland"],
  Bulgaria: ["Turkey", "North Macedonia"],
  Georgia: ["Armenia"],
  Armenia: ["Lebanon", "United States"],
  Azerbaijan: ["Turkey"],
  Cyprus: ["Greece"],

  // ---- Americas ----
  "United States": ["Mexico", "Haiti", "Jamaica", "Nigeria", "Ghana", "Puerto Rico", "Colombia", "El Salvador", "Guatemala", "Honduras", "Cuba", "Dominican Republic", "Liberia", "Israel", "Philippines", "Canada"],
  Canada: ["Jamaica", "Haiti", "Ghana", "Nigeria", "Croatia", "United States"],
  Mexico: ["United States", "Spain"],
  Panama: ["Colombia", "United States", "Costa Rica"],
  "Costa Rica": ["United States", "Nicaragua"],
  Honduras: ["United States", "Mexico"],
  Guatemala: ["Mexico"],
  "El Salvador": ["Mexico"],
  Nicaragua: ["United States"],
  Belize: ["United States", "England"],
  Jamaica: ["United States", "Canada"],
  "Trinidad and Tobago": ["United States"],
  Haiti: ["United States", "Canada"],
  Curacao: ["Aruba"],
  "Dominican Republic": ["Haiti", "United States"],
  Cuba: ["Spain"],
  "Puerto Rico": ["United States"],
  Grenada: ["United States"],
  Barbados: ["United States"],
  Argentina: ["Paraguay", "Uruguay", "Chile", "Bolivia"],
  Brazil: ["Japan", "Qatar", "United Arab Emirates", "Angola"],
  Uruguay: ["Argentina", "Qatar"],
  Colombia: ["Venezuela", "Ecuador"],
  Venezuela: ["Colombia", "Portugal"],
  Peru: ["Japan", "Chile"],
  Chile: ["Bolivia"],
  Paraguay: ["Brazil"],
  Bolivia: ["Brazil"],
  Ecuador: ["United States"],

  // ---- Africa ----
  Morocco: ["Israel"],
  Nigeria: ["Ghana"],
  Ghana: ["Togo"],
  "Cape Verde": ["Angola"],
  Senegal: ["Gambia", "Mali"],
  "Ivory Coast": ["Burkina Faso"],
  Cameroon: ["Gabon"],
  "DR Congo": ["Congo", "Angola"],
  "South Africa": ["Zimbabwe", "Mozambique", "Zambia"],
  Zambia: ["Zimbabwe"],
  Kenya: ["Uganda", "Tanzania"],
  Tanzania: ["Uganda"],
  Ethiopia: ["Israel"],
  Algeria: ["Tunisia"],
  Tunisia: ["Libya"],
  Egypt: ["Saudi Arabia"],
  Guinea: ["Mali"],
  Mali: ["Burkina Faso"],

  // ---- Asia, Middle East, Oceania ----
  Turkey: ["Bulgaria"],
  Iran: ["Iraq"],
  Iraq: ["Syria", "Jordan"],
  Syria: ["Lebanon", "Jordan"],
  Lebanon: ["Australia", "Brazil"],
  Jordan: ["Palestine"],
  Israel: ["Ethiopia"],
  Qatar: ["Ghana", "Iraq", "Sudan"],
  "United Arab Emirates": ["Brazil", "Argentina"],
  "Saudi Arabia": ["Syria"],
  Bahrain: ["Iraq"],
  Oman: ["Zanzibar"],
  Kuwait: ["Iraq"],
  Japan: ["Brazil", "Peru"],
  "South Korea": ["United States", "Japan"],
  China: ["United States", "Brazil"],
  Uzbekistan: ["Kazakhstan", "Turkey"],
  Kazakhstan: ["Turkey"],
  Thailand: ["Sweden", "Norway"],
  Vietnam: ["Czech Republic", "France"],
  Indonesia: ["Netherlands"],
  Malaysia: ["Singapore", "England"],
  Singapore: ["Malaysia", "England"],
  Philippines: ["Spain", "United States"],
  India: ["England"],
  Australia: ["New Zealand", "Croatia", "Greece"],
  "New Zealand": ["Fiji", "Australia"],
  Fiji: ["New Zealand"],
  "Solomon Islands": ["Papua New Guinea", "Australia"],
  "Papua New Guinea": ["Australia"],
};

/** Mirrored, and filtered to nations the database actually carries. */
const DUAL_LINKS: Map<string, string[]> = (() => {
  const sets = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    if (a === b) return;
    const set = sets.get(a) ?? new Set<string>();
    set.add(b);
    sets.set(a, set);
  };
  for (const [a, list] of Object.entries(RAW_DUAL)) {
    for (const b of list) {
      link(a, b);
      link(b, a);
    }
  }
  const out = new Map<string, string[]>();
  for (const [name, set] of sets) {
    if (!nationByName(name)) continue; // a link declared to a nation we do not model
    const valid = [...set].filter((n) => nationByName(n) !== undefined).sort();
    if (valid.length) out.set(name, valid);
  }
  return out;
})();

function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

/**
 * Nations this player could plausibly switch to. One or two options, shuffled
 * with the injected rng so the same career always offers the same fork.
 * Empty when nothing believable exists — better no choice than a fake one.
 */
export function dualOptions(nationality: string, rng: () => number): string[] {
  const resolved = nationByName(nationality);
  const key = resolved?.name ?? nationality;
  const pool = DUAL_LINKS.get(key) ?? [];
  if (!pool.length) return [];
  const n = rng() < 0.72 ? 1 : 2;
  return shuffle(pool, rng).slice(0, Math.min(n, pool.length));
}

export interface DualChoice {
  nation: string;
  flag: string;
  strength: number;
  pitchEn: string;
  pitchEs: string;
}

/** What the shirt would actually mean — playing time, honestly stated. */
function rolePitch(strength: number): { en: string; es: string } {
  if (strength >= 82) {
    return {
      en: "You would fight world-class rivals for every single minute.",
      es: "Pelearías cada minuto contra rivales de clase mundial.",
    };
  }
  if (strength >= 66) {
    return {
      en: "You would have to earn the shirt, but a starting place is within reach.",
      es: "Tendrías que ganarte la camiseta, pero la titularidad está a tu alcance.",
    };
  }
  if (strength >= 52) {
    return {
      en: "You would walk into this side and keep the shirt for years.",
      es: "Entrarías directo en este equipo y te quedarías la camiseta durante años.",
    };
  }
  return {
    en: "You would be the best player this country has, from your first cap.",
    es: "Serías el mejor jugador de este país desde tu primera convocatoria.",
  };
}

/** What the shirt would actually get you — the stage, honestly stated. */
function stagePitch(strength: number): { en: string; es: string } {
  if (strength >= 85) {
    return {
      en: "Win your place and it means World Cups, finals and a name the whole game knows.",
      es: "Ganarte el puesto significa Mundiales, finales y un nombre que conoce todo el fútbol.",
    };
  }
  if (strength >= 70) {
    return {
      en: "Qualifying is expected here, and a good generation can go a long way.",
      es: "Aquí clasificarse es lo esperado, y una buena generación puede llegar lejos.",
    };
  }
  if (strength >= 55) {
    return {
      en: "A major tournament is realistic; winning one would be history.",
      es: "Un gran torneo es realista; ganarlo sería histórico.",
    };
  }
  return {
    en: "The great tournaments may never come — but you would be a national hero for a generation.",
    es: "Los grandes torneos quizá nunca lleguen — pero serías un héroe nacional durante una generación.",
  };
}

/**
 * Turn a set of eligible nations into the dual-nationality choice screen.
 * Pass the home nation FIRST and the options after it; each pitch is written
 * against the strongest nation in the set so the trade-off reads honestly —
 * immediate minutes and icon status on one side, harder competition and a
 * bigger stage on the other.
 */
export function dualChoices(nations: string[]): DualChoice[] {
  const seen = new Set<string>();
  const resolved: Nation[] = [];
  for (const name of nations) {
    const n = nationByName(name);
    if (!n || seen.has(n.name)) continue;
    seen.add(n.name);
    resolved.push(n);
  }

  if (!resolved.length) return [];
  const top = Math.max(...resolved.map((n) => n.strength));
  const bottom = Math.min(...resolved.map((n) => n.strength));

  return resolved.map((n) => {
    const role = rolePitch(n.strength);
    const stage = stagePitch(n.strength);
    let edgeEn = "";
    let edgeEs = "";
    if (resolved.length > 1 && n.strength === top && top > bottom) {
      edgeEn = " The harder road, the bigger stage.";
      edgeEs = " El camino difícil, el escenario grande.";
    } else if (top - n.strength >= 8) {
      edgeEn = " Far fewer players ahead of you here.";
      edgeEs = " Aquí tienes mucha menos gente por delante.";
    }
    return {
      nation: n.name,
      flag: n.flag,
      strength: n.strength,
      pitchEn: `${role.en} ${stage.en}${edgeEn}`,
      pitchEs: `${role.es} ${stage.es}${edgeEs}`,
    };
  });
}
