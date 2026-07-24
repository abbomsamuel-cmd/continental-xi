import { simulateChapter, type ChapterResult } from "./chapters";
import { rollInjury, resolveInjury, type InjuryType, type InjuryOutcome, type RecoveryChoice } from "./injuries";
import {
  pickEvents, resolveEffects, choiceOf, ONCE_ONLY_EVENTS,
  type CareerEventDef, type EventContext, type EventEffects,
} from "./events";
import { simulateIntlChapter, emptyIntlState, type IntlState, type IntlChapterResult } from "./international";
import { nationByName } from "./nations";
import { reputationOf } from "./world";
import { shiftReputation, roleFromTrust } from "./engine";
import type { CareerPlayer, CareerSeason, FormTier, IntlStateLike } from "./types";

/**
 * The chapter orchestration — the layer that turns two simulated years into the
 * things the player must actually deal with on the one career screen: an injury,
 * a couple of turning-point events, national-team progress, and finally the move
 * that closes the chapter. The football sim (chapters.ts) stays pure; injuries
 * (injuries.ts), events (events.ts) and the international résumé (international.ts)
 * are layered on top here so the UI has a single thing to render and commit.
 */

function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const FORM_LADDER: FormTier[] = ["terrible", "poor", "average", "good", "excellent", "worldClass"];
function shiftForm(form: FormTier, steps: number): FormTier {
  const i = Math.max(0, Math.min(FORM_LADDER.length - 1, FORM_LADDER.indexOf(form) + steps));
  return FORM_LADDER[i];
}

/** The persisted international state, or a fresh one for this nation. */
export function intlOf(player: CareerPlayer): IntlState {
  const s = player.intl;
  if (s) return { ...s } as IntlState;
  return emptyIntlState(player.nationality);
}

/** A chapter, rolled and ready for the player to resolve. */
export interface ChapterRun {
  result: ChapterResult;
  /** An injury picked up during the chapter — needs a recovery decision. */
  injuryType: InjuryType | null;
  /** Turning-point events fired this chapter (decision events need a choice). */
  events: CareerEventDef[];
  /** National-team progress across the chapter (applied automatically). */
  intl: IntlChapterResult;
  /** Deterministic seed so resolving the run replays identically. */
  seed: number;
}

/** How likely an injury is for this player this chapter (1 = normal). */
function injuryRisk(player: CareerPlayer): number {
  let m = 1;
  if (player.traits.includes("GlassAnkles")) m += 0.6;
  if (player.traits.includes("IronWill")) m -= 0.25;
  if ((player.injuryHistory?.length ?? 0) >= 2) m += 0.2;
  return Math.max(0, m);
}

/**
 * Roll a whole chapter: the football, an injury chance, up to two events, and
 * the international leg — all deterministic from the player's id and age.
 */
export function rollChapter(player: CareerPlayer): ChapterRun {
  const result = simulateChapter(player);
  const seed = hash(`${player.id}:${player.age}:run`);
  const midAge = player.age + 1;

  const injuryType = rollInjury(midAge, injuryRisk(player), mulberry32(seed ^ 0x1111));

  const nation = nationByName(player.nationality);
  const intl = simulateIntlChapter({
    state: intlOf(player),
    overall: result.overallTo,
    age: result.toAge,
    nationStrength: nation?.strength ?? 50,
    avgRating: result.avgRating,
    clubReputation: reputationOf(result.playerAfter.currentClubId),
    rng: mulberry32(seed ^ 0x2222),
    year: result.fromYear,
    position: player.position,
  });

  const ctx: EventContext = {
    age: result.toAge,
    overall: result.overallTo,
    ovrDelta: result.overallTo - result.overallFrom,
    trust: result.playerAfter.trust,
    apps: result.apps,
    goals: result.goals,
    honours: result.honours,
    clubReputation: reputationOf(result.playerAfter.currentClubId),
    seasonsAtClub: result.playerAfter.seasonsAtClub,
    contractYearsLeft: result.playerAfter.contractUntil - result.playerAfter.currentYear,
    hasCaptaincy: result.playerAfter.national.captain || player.traits.includes("Captain"),
    calledUp: intl.state.calledUp,
    retiredIntl: intl.state.retired,
    position: result.playerAfter.position,
  };
  // Don't re-fire once-only turning points, or events whose trait is already held.
  const exclude = [
    ...(player.firedEvents ?? []),
    ...ONCE_ONLY_EVENTS.filter((id) => (player.firedEvents ?? []).includes(id)),
  ];
  const events = pickEvents(ctx, mulberry32(seed ^ 0x3333), injuryType ? 1 : 2, exclude)
    .filter((e) => !(e.effects?.trait && player.traits.includes(e.effects.trait)));

  return { result, injuryType, events, intl, seed };
}

/** The decisions the player made while resolving a run. */
export interface RunChoices {
  recovery?: RecoveryChoice;
  /** Event id → chosen choice id (absent = the safe default). */
  eventChoices?: Record<string, string>;
}

export interface FinalizedChapter {
  player: CareerPlayer;
  injury: InjuryOutcome | null;
  /** True if an event or the injury forces the boots to be hung up now. */
  forcedRetire: boolean;
}

/** Reduce a season row to reflect games missed to injury, and stamp the new OVR. */
function dentSeason(s: CareerSeason, appsKeep: number, overall: number): CareerSeason {
  return {
    ...s,
    apps: Math.max(1, Math.round(s.apps * appsKeep)),
    goals: Math.round(s.goals * appsKeep),
    assists: Math.round(s.assists * appsKeep),
    overall,
    injured: true,
  };
}

/**
 * Fold the player's decisions into the chapter and produce the final player to
 * persist. Injuries bite the same chapter's appearances and rating; event and
 * international effects stack on top; the international résumé is carried through.
 */
export function finalizeChapter(player: CareerPlayer, run: ChapterRun, choices: RunChoices): FinalizedChapter {
  const np: CareerPlayer = { ...run.result.playerAfter };
  let forcedRetire = false;

  // ---- international résumé ----
  const st = run.intl.state;
  np.intl = { ...st } as IntlStateLike;
  np.national = { calledUp: st.calledUp, caps: st.caps, goals: st.goals, captain: st.captain };

  // ---- injury ----
  let injury: InjuryOutcome | null = null;
  if (run.injuryType) {
    injury = resolveInjury(run.injuryType, player.age + 1, choices.recovery ?? "full", mulberry32(run.seed ^ 0x4444));
    np.overall = Math.max(40, np.overall - injury.ovrLoss);
    if (injury.permanentLoss) np.peakOverall = Math.max(np.peakOverall, np.overall);
    np.form = shiftForm(np.form, -injury.formHit);
    np.marketValue = Math.round((np.marketValue * (1 + injury.marketPct / 100)) / 100_000) * 100_000;
    np.injuryHistory = [...(player.injuryHistory ?? []), run.injuryType.id];
    if (injury.retirementRisk > 0 && mulberry32(run.seed ^ 0x5555)() < injury.retirementRisk) forcedRetire = true;
    // bite the closing season so the timeline shows the dip and its cause
    const keep = Math.max(0.25, 1 - (injury.appsLostPct / 100) * 0.6);
    if (np.seasons.length) {
      const last = np.seasons.length - 1;
      np.seasons = np.seasons.map((s, i) => (i === last ? dentSeason(s, keep, np.overall) : s));
    }
  }

  // ---- events ----
  const merged: EventEffects[] = run.events.map((e) => resolveEffects(e, choices.eventChoices?.[e.id]));
  const fired = new Set(player.firedEvents ?? []);
  for (const e of run.events) if (ONCE_ONLY_EVENTS.includes(e.id)) fired.add(e.id);
  np.firedEvents = [...fired];

  for (const eff of merged) {
    if (eff.ovr) np.overall = Math.max(40, Math.min(99, np.overall + eff.ovr));
    if (eff.trust) np.trust = Math.max(5, Math.min(100, np.trust + eff.trust));
    if (eff.formShift) np.form = shiftForm(np.form, eff.formShift);
    if (eff.marketPct) np.marketValue = Math.round((np.marketValue * (1 + eff.marketPct / 100)) / 100_000) * 100_000;
    if (eff.reputationShift) np.reputation = shiftReputation(np.reputation, eff.reputationShift);
    if (eff.trait && !np.traits.includes(eff.trait)) np.traits = [...np.traits, eff.trait];
    if (eff.positionChange) np.position = eff.positionChange;
    if (eff.captain !== undefined) np.national = { ...np.national, captain: eff.captain };
    if (eff.nationalCallUp) np.national = { ...np.national, calledUp: true };
    if (eff.shirtNumber !== undefined) np.shirtNumber = eff.shirtNumber;
    if (eff.wagePct) np.wage = Math.round((np.wage * (1 + eff.wagePct / 100)) / 250) * 250;
    if (eff.intlRetire && np.intl) np.intl = { ...np.intl, retired: true };
    if (eff.retire) forcedRetire = true;
  }

  np.peakOverall = Math.max(np.peakOverall, np.overall);
  np.role = roleFromTrust(np.trust);
  return { player: np, injury, forcedRetire };
}

/** Choice a player would face for a decision event — for the left-panel card. */
export function decisionEvents(run: ChapterRun): CareerEventDef[] {
  return run.events.filter((e) => e.category === "decision" && e.choices && e.choices.length > 0);
}

export { choiceOf };
