import { ALL_CLUBS, clubById, leagueById } from "./data";
import { developSeason, potentialCeiling } from "./develop";
import { eligibleMoments, momentById, type MomentEffects } from "./moments";
import type {
  CareerPlayer, CareerPositionId, CareerSeason, FormTier,
  ReputationTier, RoleTier, SeasonResult, TrainingFocus, TransferOffer,
} from "./types";

/* ---------------- deterministic rng ---------------- */
function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const ri = (rng: () => number, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
function shuffle<T>(arr: T[], rng: () => number): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* ---------------- ladders ---------------- */
const REP_LADDER: ReputationTier[] = ["unknown", "prospect", "wonderkid", "promising", "established", "star", "superstar", "worldClass", "legend"];
export function shiftReputation(r: ReputationTier, steps: number): ReputationTier {
  const i = Math.max(0, Math.min(REP_LADDER.length - 1, REP_LADDER.indexOf(r) + steps));
  return REP_LADDER[i];
}
export function roleFromTrust(trust: number): RoleTier {
  if (trust >= 92) return "captain";
  if (trust >= 80) return "star";
  if (trust >= 68) return "important";
  if (trust >= 52) return "starter";
  if (trust >= 34) return "rotation";
  if (trust >= 18) return "reserve";
  return "notSelected";
}
export function formFromRating(r: number): FormTier {
  if (r >= 7.7) return "worldClass";
  if (r >= 7.3) return "excellent";
  if (r >= 6.9) return "good";
  if (r >= 6.4) return "average";
  if (r >= 6.0) return "poor";
  return "terrible";
}
const FORM_MULT: Record<FormTier, number> = { terrible: 0.72, poor: 0.85, average: 1, good: 1.14, excellent: 1.28, worldClass: 1.42 };

/* ---------------- goal / assist profiles ---------------- */
const GOAL_RATE: Record<CareerPositionId, number> = { ST: 0.58, RW: 0.34, LW: 0.34, CAM: 0.3, CM: 0.13, CDM: 0.05, RB: 0.04, LB: 0.04, CB: 0.06, GK: 0 };
const ASSIST_RATE: Record<CareerPositionId, number> = { ST: 0.18, RW: 0.28, LW: 0.28, CAM: 0.4, CM: 0.24, CDM: 0.12, RB: 0.2, LB: 0.2, CB: 0.04, GK: 0.01 };

/* ---------------- season plan ---------------- */
export interface SeasonBeat {
  month: number; // 0=Aug .. 9=May
  kind: "kickoff" | "event" | "moment" | "final";
  icon?: string;
  en?: string; es?: string;
  momentId?: string;
}
interface BaseOutcome { apps: number; goals: number; assists: number; avgRating: number; leaguePosition: number; honours: string[]; formOut: FormTier }
export interface SeasonPlan { seed: number; year: number; base: BaseOutcome; beats: SeasonBeat[]; momentIds: string[] }

const MONTHS: [string, string][] = [["Aug", "Ago"], ["Sep", "Sep"], ["Oct", "Oct"], ["Nov", "Nov"], ["Dec", "Dic"], ["Jan", "Ene"], ["Feb", "Feb"], ["Mar", "Mar"], ["Apr", "Abr"], ["May", "May"]];
export const monthLabel = (i: number, es: boolean) => (MONTHS[i] ? MONTHS[i][es ? 1 : 0] : "");

function baseSeason(p: CareerPlayer, rng: () => number): BaseOutcome {
  const tier = clubById(p.currentClubId)?.tier ?? 2;
  const fm = FORM_MULT[p.form];
  const apps = Math.max(6, Math.min(52, Math.round((p.trust / 100) * 38 + 10 + (rng() - 0.5) * 8)));
  const scored = Math.round(apps * GOAL_RATE[p.position] * (p.overall / 78) * fm * (0.85 + rng() * 0.4));
  const goals = Math.max(0, scored);
  const assists = Math.max(0, Math.round(apps * ASSIST_RATE[p.position] * (p.overall / 80) * fm * (0.85 + rng() * 0.4)));
  // Rating reflects OUTPUT, not just ability — a teenager banging in goals at a
  // small club is not "terrible". Gentle overall term, real lift from returns.
  let avg = 6.55 + (p.overall - 68) * 0.02 + (FORM_MULT[p.form] - 1) * 0.8 + (rng() - 0.5) * 0.28;
  const contribution = (goals + assists * 0.6) / Math.max(8, apps);
  avg += Math.min(0.55, contribution * 1.5);
  const avgRating = Math.max(5.6, Math.min(8.6, Math.round(avg * 10) / 10));
  // league finish from club stature + form
  const centre = [0, 15, 11, 7, 4, 2][tier] ?? 10;
  const pos = Math.round(centre - (fm - 1) * 6 + (rng() - 0.5) * 6);
  const leaguePosition = Math.max(1, Math.min(20, pos));
  const honours: string[] = [];
  if (leaguePosition === 1) honours.push("League");
  if (tier >= 4 && rng() < 0.22) honours.push("Champions League");
  else if (tier >= 3 && rng() < 0.2) honours.push(rng() < 0.5 ? "Domestic Cup" : "Europa");
  else if (rng() < 0.14) honours.push("Domestic Cup");
  return { apps, goals, assists, avgRating, leaguePosition, honours, formOut: formFromRating(avgRating) };
}

export function buildPlan(p: CareerPlayer): SeasonPlan {
  const seed = hash(`${p.id}:${p.currentYear}`);
  const rng = mulberry32(seed);
  const base = baseSeason(p, rng);

  // moments: training first, then just 1–2 eligible others — fewer forced
  // pauses keeps a 20-second season flowing.
  const others = shuffle(eligibleMoments(p), rng).slice(0, ri(rng, 1, 2));
  const momentIds = ["training", ...others.map((m) => m.id)];
  const monthSlots = shuffle([2, 4, 6, 8], rng);
  const beats: SeasonBeat[] = [{ month: 0, kind: "kickoff", icon: "◎", en: `The ${p.currentYear}–${(p.currentYear + 1) % 100} season kicks off at ${p.currentClubName}.`, es: `Arranca la temporada ${p.currentYear}–${(p.currentYear + 1) % 100} en ${p.currentClubName}.` }];
  beats.push({ month: 1, kind: "moment", momentId: "training" });
  others.forEach((m, i) => beats.push({ month: monthSlots[i] ?? 5, kind: "moment", momentId: m.id }));

  // A living season — match-day results stream through the feed so the sim is
  // full of football, not just the occasional headline. Scorelines vs real
  // league rivals; "you scored" surfaces where goals actually fell.
  const rivals = (leagueById(clubById(p.currentClubId)?.leagueId ?? "")?.clubs ?? []).filter((cl) => cl.id !== p.currentClubId);
  const myTier = clubById(p.currentClubId)?.tier ?? 2;
  const fm2 = FORM_MULT[p.form];
  const goalsByMonth: Record<number, number> = {};
  for (let g = 0; g < base.goals; g++) { const m = ri(rng, 0, 9); goalsByMonth[m] = (goalsByMonth[m] ?? 0) + 1; }
  const isGk = p.position === "GK";
  const matchMonths = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], rng).slice(0, 6).sort((a, b) => a - b);
  for (const m of matchMonths) {
    const rival = rivals.length ? rivals[ri(rng, 0, rivals.length - 1)] : null;
    const rn = rival?.name ?? (p.currentClubCountry === "—" ? "rivals" : "the visitors");
    const edge = (myTier - (rival?.tier ?? 3)) * 0.11 + (fm2 - 1) * 0.5 + (rng() - 0.5) * 0.8;
    const gf = Math.max(0, Math.round(1.35 + edge * 1.5 + rng() * 0.6));
    const ga = Math.max(0, Math.round(1.35 - edge * 1.5 + rng() * 0.6));
    const scored = !isGk && (goalsByMonth[m] ?? 0) > 0;
    const cleanSheet = isGk && ga === 0;
    const res = gf > ga ? "win" : gf < ga ? "loss" : "draw";
    const icon = scored ? "⚽" : cleanSheet ? "🧤" : res === "win" ? "✅" : res === "loss" ? "🔻" : "▪";
    const tail = scored ? " · you scored" : cleanSheet ? " · clean sheet" : "";
    const tailEs = scored ? " · marcaste" : cleanSheet ? " · portería a cero" : "";
    const verbEn = res === "win" ? "beat" : res === "loss" ? "lost to" : "drew with";
    const verbEs = res === "win" ? "vencen a" : res === "loss" ? "pierden ante" : "empatan con";
    beats.push({ month: m, kind: "event", icon, en: `${gf}–${ga} · ${verbEn} ${rn}${tail}.`, es: `${gf}–${ga} · ${verbEs} ${rn}${tailEs}.` });
  }

  // one outcome-shaped headline near the run-in for colour
  if (base.honours.includes("League") || base.leaguePosition <= 3) beats.push({ month: 8, kind: "event", icon: "▲", en: "Right in the title race as the run-in nears.", es: "En plena pelea por el título en la recta final." });
  else if (base.avgRating >= 7.2) beats.push({ month: 7, kind: "event", icon: "★", en: "Named in the Team of the Month.", es: "Incluido en el Once del Mes." });

  beats.sort((a, b) => a.month - b.month);
  beats.push({ month: 9, kind: "final", icon: "◍", en: "The season is complete.", es: "La temporada ha terminado." });
  return { seed, year: p.currentYear, base, beats, momentIds };
}

/* ---------------- market value ----------------
 * The market pays for what a player IS *and* what he'll become. For the young,
 * potential dominates — a 16-year-old rated 55 with a 93 ceiling is a valuable
 * asset, not a €0 punt — while for veterans it's all current level, discounted
 * hard by age. The SAME function seeds a new player and revalues him each
 * season, so a good year always moves the number the right way (never a crater
 * after 10 goals). Anchored so eff≈72 → ~€10M and eff≈90 → ~€120M.
 */
function agePotentialWeight(age: number): number {
  if (age <= 18) return 0.35;
  if (age <= 21) return 0.32;
  if (age <= 24) return 0.24;
  if (age <= 27) return 0.14;
  if (age <= 30) return 0.05;
  return 0;
}
function ageValueMult(age: number): number {
  if (age <= 29) return 1;
  if (age === 30) return 0.9;
  if (age === 31) return 0.78;
  if (age === 32) return 0.62;
  if (age === 33) return 0.46;
  if (age === 34) return 0.32;
  if (age === 35) return 0.2;
  return 0.12;
}
export function computeMarketValue(
  overall: number, ceiling: number, age: number, rep: ReputationTier, avgRating: number,
): number {
  const eff = overall + agePotentialWeight(age) * Math.max(0, ceiling - overall);
  const raw = Math.pow(Math.max(1, eff - 44), 5) * 0.581;
  const repMult = 0.92 + REP_LADDER.indexOf(rep) * 0.02;
  const perfMult = 1 + Math.max(-0.12, Math.min(0.18, (avgRating - 6.8) * 0.06));
  const value = Math.max(150_000, raw * ageValueMult(age) * repMult * perfMult);
  const step = value < 5_000_000 ? 100_000 : 250_000;
  return Math.round(value / step) * step;
}

/* ---------------- transfer offers ---------------- */
function makeOffers(p: CareerPlayer, overall: number, rep: ReputationTier, push: number): TransferOffer[] {
  const rng = mulberry32(hash(`${p.id}:offers:${p.currentYear}`));
  const curTier = clubById(p.currentClubId)?.tier ?? 2;
  const desirability = REP_LADDER.indexOf(rep) + (overall - 70) / 4 + push * 2;
  let n = Math.max(0, Math.min(4, Math.round(desirability / 3 + (rng() - 0.3))));
  if (p.contractUntil - p.currentYear <= 0) n = Math.min(4, n + 1);
  const pool = ALL_CLUBS.filter((cl) => cl.id !== p.currentClubId && cl.tier >= Math.max(1, curTier - 1) && cl.tier <= Math.min(5, curTier + 1 + (push > 0 ? 1 : 0)));
  return shuffle(pool, rng).slice(0, n).map((cl) => {
    const up = cl.tier - curTier;
    const role: RoleTier = up > 0 ? "rotation" : up < 0 ? "important" : "starter";
    const wage = Math.round((p.wage * (1.2 + up * 0.4 + rng() * 0.3)) / 500) * 500;
    return { clubId: cl.id, wage, years: 3 + Math.floor(rng() * 3), role, developmentStars: Math.max(2, Math.min(5, 5 - up + (rng() < 0.5 ? 1 : 0))) };
  });
}

/* ---------------- finalize ---------------- */
export function finalizeSeason(p: CareerPlayer, plan: SeasonPlan, decisions: Record<string, string>): SeasonResult {
  const eff: MomentEffects = {};
  let training: TrainingFocus | null = null;
  let injuredMonths = 0;
  let transferPush = 0;
  const traitUnlocks: string[] = [];
  let positionChange: CareerPositionId | null = null;

  for (const [mid, cid] of Object.entries(decisions)) {
    const m = momentById(mid);
    const c = m?.choices.find((x) => x.id === cid);
    if (!c) continue;
    const e = c.effects;
    if (e.training) training = e.training;
    if (e.injuredMonths) injuredMonths += e.injuredMonths;
    if (e.transferPush) transferPush += e.transferPush;
    if (e.trait && !p.traits.includes(e.trait)) traitUnlocks.push(e.trait);
    if (e.positionChange && m?.newPosition) positionChange = m.newPosition;
    eff.trust = (eff.trust ?? 0) + (e.trust ?? 0);
    eff.repShift = (eff.repShift ?? 0) + (e.repShift ?? 0);
    eff.marketPct = (eff.marketPct ?? 0) + (e.marketPct ?? 0);
    if (e.nationalCallup) eff.nationalCallup = true;
  }

  const b = plan.base;
  const tier = clubById(p.currentClubId)?.tier ?? 2;
  // appearances lost to injury; goals/assists scale with games played
  const apps = Math.max(2, b.apps - injuredMonths * 4);
  const ratio = apps / b.apps;
  const goals = Math.round(b.goals * ratio);
  const assists = Math.round(b.assists * ratio);

  // trust: earned by output and ratings first, tempered by the club's league
  // expectation. A youngster who scores wins a place regardless of the table.
  const expectation = [0, 14, 10, 6, 3, 2][tier] ?? 8;
  const isAttacker = ["ST", "RW", "LW", "CAM"].includes(p.position);
  // attackers earn trust with output; everyone else with ratings + reliability
  // (a defender who plays a full season proves himself even without goals).
  const outputTrust = isAttacker
    ? Math.min(15, goals * 1.0 + assists * 0.5)
    : Math.min(11, Math.max(0, (b.avgRating - 6.45) * 9 + apps * 0.14));
  const perfTrust = Math.round((b.avgRating - 6.6) * 10 + outputTrust + (expectation - b.leaguePosition) * 0.5);
  const trust = Math.max(5, Math.min(100, p.trust + perfTrust + (eff.trust ?? 0)));
  const role = roleFromTrust(trust);

  // development
  const dev = developSeason({ ...p, trainingFocus: training }, b.avgRating, trust);

  // reputation
  let repShift = eff.repShift ?? 0;
  if (b.honours.includes("Champions League")) repShift += 1;
  if (goals >= 22 || b.avgRating >= 7.6) repShift += 1;
  if (b.leaguePosition >= 17) repShift -= 1;
  const reputation = shiftReputation(p.reputation, repShift);

  // market value — potential/age aware, using the grown overall & this season's rating
  let mv = computeMarketValue(dev.overallTo, potentialCeiling(p), p.age, reputation, b.avgRating);
  if (eff.marketPct) mv = Math.round((mv * (1 + eff.marketPct / 100)) / 100_000) * 100_000;

  // national team
  const national = { ...p.national };
  if (eff.nationalCallup) national.calledUp = true;
  if (national.calledUp) { national.caps += ri(mulberry32(plan.seed ^ 99), 4, 9); national.goals += Math.round(goals * 0.12); }
  if (traitUnlocks.includes("Captain")) { /* club captain, separate from national */ }

  // objectives
  const objectives = buildObjectives(p, b, goals);

  // media headlines
  const media: string[] = [];
  if (goals >= 15) media.push(`${p.name} hits ${goals} goals this season.`);
  if (b.honours.includes("League")) media.push(`${p.currentClubName} are champions.`);
  if (transferPush > 0) media.push(`Europe's giants circle ${p.name}.`);
  if (dev.overallTo > dev.overallFrom + 2) media.push(`A breakout year for ${p.name}.`);

  const season: CareerSeason = {
    year: p.currentYear, age: p.age, clubId: p.currentClubId, clubName: p.currentClubName,
    clubShort: p.currentClubShort, clubColors: p.currentClubColors, clubCountry: p.currentClubCountry,
    overall: dev.overallTo, apps, goals, assists, honours: b.honours,
  };

  const offers = makeOffers({ ...p, wage: p.wage }, dev.overallTo, reputation, transferPush);

  return {
    season, overallFrom: dev.overallFrom, overallTo: dev.overallTo, attrDeltas: dev.attrDeltas,
    form: b.formOut, trust, role, reputation, marketValueFrom: p.marketValue, marketValueTo: mv,
    avgRating: b.avgRating, leaguePosition: b.leaguePosition, objectives, media, offers,
    contractExpiring: p.contractUntil - p.currentYear <= 1, seasonsAtClub: p.seasonsAtClub + 1,
    national, age: p.age, traitUnlocks, positionChange,
  };
}

function buildObjectives(p: CareerPlayer, b: BaseOutcome, goals: number): { text: string; met: boolean }[] {
  const out: { text: string; met: boolean }[] = [];
  const tier = clubById(p.currentClubId)?.tier ?? 2;
  if (["ST", "RW", "LW", "CAM"].includes(p.position)) {
    const target = Math.max(6, Math.round(p.overall / 6));
    out.push({ text: `Score ${target} goals`, met: goals >= target });
  } else {
    out.push({ text: "Average rating above 7.0", met: b.avgRating >= 7.0 });
  }
  out.push({ text: p.trust >= 52 ? "Hold your place in the XI" : "Break into the starting XI", met: b.avgRating >= 6.6 });
  out.push(tier >= 4 ? { text: "Qualify for the Champions League", met: b.leaguePosition <= 4 } : { text: "Finish in the top half", met: b.leaguePosition <= 10 });
  return out;
}
