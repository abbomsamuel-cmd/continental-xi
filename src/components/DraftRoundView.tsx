"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGame, type AiStrategy } from "@/lib/store";
import { PlayerCard } from "@/components/PlayerCard";
import { Pitch, type PitchVariant } from "@/components/Pitch";
import { FormationPicker } from "@/components/FormationPicker";
import { SquadSpinner } from "@/components/SquadSpinner";
import { EuroSpinner, CopaSpinner } from "@/components/NationSpinner";
import { EuroScene, CopaScene } from "@/components/fx/Scenes";
import { getPool } from "@/lib/players";
import { formationCanHold, POSITION_GROUP } from "@/lib/formations";
import { suitability } from "@/lib/suitability";
import type { Player, PositionGroup } from "@/lib/types";
import { play } from "@/lib/sound";

/** Full position names — friendlier for newer fans, shown as tooltips. */
const POS_NAME: Record<string, string> = {
  GK: "Goalkeeper", RB: "Right Back", CB: "Centre Back", LB: "Left Back",
  RWB: "Right Wing-Back", LWB: "Left Wing-Back", CDM: "Defensive Midfielder",
  CM: "Central Midfielder", CAM: "Attacking Midfielder", RM: "Right Midfielder",
  LM: "Left Midfielder", RW: "Right Winger", LW: "Left Winger", CF: "Centre Forward", ST: "Striker",
};
const GROUP_ORDER: PositionGroup[] = ["GK", "DEF", "MID", "ATT"];
const GROUP_LABEL: Record<PositionGroup, string> = { GK: "Goalkeeper", DEF: "Defense", MID: "Midfield", ATT: "Attack" };
/** Colour per position line so the tracker isn't one monotone accent. */
const GROUP_COLOR: Record<PositionGroup, string> = { GK: "#f6c445", DEF: "#38bdf8", MID: "#34d399", ATT: "#fb7185" };

const AI_STRATEGIES: { id: AiStrategy; label: string; hint: string; advanced?: boolean }[] = [
  { id: "relaxed", label: "Relaxed & Balanced", hint: "Fair, mostly 75–87 rated" },
  { id: "youthful", label: "Youthful", hint: "Newer vintages, moderate" },
  { id: "experienced", label: "Experienced", hint: "Classic veterans" },
  { id: "random", label: "Random Fun", hint: "Varied & unpredictable" },
];
const AI_STEPS = ["Analyzing formation…", "Balancing the defense…", "Finding the best midfielders…", "Sharpening the attack…", "Completing your XI…"];

const POOL_BADGE: Record<string, string | null> = {
  clubs: null, euro: "🇪🇺 UEFA EURO DRAFT", copa: "🌎 COPA AMÉRICA DRAFT",
};

const POOL_THEME: Record<string, { accent: string; heading: string; soft: string }> = {
  clubs: { accent: "#00f0ff", heading: "text-gradient-cyan", soft: "rgba(0,240,255,0.35)" },
  euro: { accent: "#ff3b57", heading: "text-gradient-euro", soft: "rgba(255,59,87,0.4)" },
  copa: { accent: "#00e676", heading: "text-gradient-copa", soft: "rgba(0,230,118,0.4)" },
};

export function DraftRoundView() {
  const router = useRouter();
  const setup = useGame((s) => s.setup)!;
  const formation = useGame((s) => s.formation)!;
  const targetSlot = useGame((s) => s.targetSlot);
  const spinSquadIndex = useGame((s) => s.spinSquadIndex);
  const spinNonce = useGame((s) => s.spinNonce);
  const rerolls = useGame((s) => s.rerolls);
  const placedSlots = useGame((s) => s.placedSlots);
  const beginRound = useGame((s) => s.beginRound);
  const respinSquad = useGame((s) => s.respinSquad);
  const reroll = useGame((s) => s.reroll);
  const choosePlayer = useGame((s) => s.choosePlayer);
  const changeFormation = useGame((s) => s.changeFormation);
  const resetDraft = useGame((s) => s.resetDraft);
  const getOffered = useGame((s) => s.getOfferedPlayers);
  const getXI = useGame((s) => s.getXI);
  const completeWithAI = useGame((s) => s.completeWithAI);

  const [revealedKey, setRevealedKey] = useState("");
  const [placing, setPlacing] = useState<Player | null>(null);
  const [showFormation, setShowFormation] = useState(false);
  // AI Complete Squad flow: confirm → running analysis → fills & continues
  const [aiStage, setAiStage] = useState<"hidden" | "confirm" | "running">("hidden");
  const [aiStrategy, setAiStrategy] = useState<AiStrategy>("relaxed");
  const [aiStep, setAiStep] = useState(0);
  const pitchRef = useRef<HTMLDivElement>(null);

  const pool = setup.pool ?? "clubs";
  const squads = getPool(pool);
  const isIntl = pool !== "clubs";
  const theme = POOL_THEME[pool];
  const variant: PitchVariant = pool === "clubs" ? "cl" : (pool as PitchVariant);
  const xi = getXI();
  const totalSlots = formation.slots.length;
  const pickNo = placedSlots.length + 1;

  const spinning = targetSlot !== null && revealedKey !== `${targetSlot}:${spinNonce}`;
  const squad = spinSquadIndex >= 0 ? squads[spinSquadIndex] : null;
  const seasonText = squad ? (isIntl ? `${squad.season}` : `${squad.season - 1}-${String(squad.season).slice(2)}`) : "";
  const reel = isIntl ? squads.map((s) => ({ name: `${s.club} ${s.season}`, colors: s.colors })) : undefined;
  const targetPos = targetSlot !== null ? formation.slots[targetSlot].pos : null;

  const offered = targetSlot !== null && !spinning ? getOffered() : [];

  // open slots the placing player can legally fill, natural first
  const placeOptions = useMemo(() => {
    if (!placing) return [];
    return formation.slots
      .map((s, i) => ({ i, pos: s.pos, filled: !!xi[i], suit: suitability(placing.position, placing.altPositions, s.pos) }))
      .filter((o) => !o.filled && o.suit.level !== "blocked")
      .sort((a, b) => (a.suit.level === "natural" ? -1 : 1) - (b.suit.level === "natural" ? -1 : 1));
  }, [placing, formation, xi]);

  const scrollToPitch = () => pitchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  const phase: "spin" | "choose" | "offer" | "place" =
    spinning ? "spin" : targetSlot === null ? "choose" : placing ? "place" : "offer";

  const doPlace = (slotIndex: number) => {
    if (!placing) return;
    choosePlayer(placing.id, slotIndex);
    setPlacing(null);
  };

  // AI analysis sequence — cycles short status lines, then fills the squad and
  // continues to the review. Guarded by the confirm step so no accidental click
  // completes the draft. Timers only (never a direct effect setState).
  useEffect(() => {
    if (aiStage !== "running") return;
    play("advance");
    const timers = AI_STEPS.map((_, i) => setTimeout(() => setAiStep(i), i * 460));
    timers.push(setTimeout(() => {
      completeWithAI(aiStrategy);
      play("win");
      router.push("/squad"); // draftComplete also redirects; this is the belt-and-braces
    }, AI_STEPS.length * 460 + 320));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiStage]);

  const filledCount = xi.filter(Boolean).length;
  const remaining = totalSlots - filledCount;
  // slots grouped by area, in pitch order, for the Squad Progress panel
  const groupedSlots = GROUP_ORDER.map((g) => ({
    group: g,
    slots: formation.slots
      .map((s, i) => ({ i, pos: s.pos, filled: !!xi[i], name: xi[i]?.name }))
      .filter((s) => POSITION_GROUP[s.pos] === g),
  })).filter((g) => g.slots.length > 0);

  return (
    <>
      {pool === "euro" && <EuroScene />}
      {pool === "copa" && <CopaScene />}
      <div className="relative z-10 mx-auto max-w-6xl px-3 pb-40 pt-20 sm:px-4 sm:pt-28 lg:pb-24">
        {/* header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[0.68rem] font-bold uppercase tracking-widest sm:text-xs" style={{ color: theme.accent }}>
              {POOL_BADGE[pool] ? `${POOL_BADGE[pool]} · ` : ""}Pick {Math.min(pickNo, totalSlots)} of {totalSlots}
            </div>
            <h1 className="mt-0.5 font-display text-xl font-extrabold sm:text-3xl">
              {phase === "spin" ? (
                <span className="text-muted">
                  {pool === "copa" ? "Rolling the drum…" : pool === "euro" ? "Crossing Europe…" : "Spinning…"}
                </span>
              ) : phase === "choose" ? (
                <>Choose a <span className={theme.heading}>position</span> to draft</>
              ) : phase === "place" ? (
                <>Where does <span className={theme.heading}>{placing!.name.split(" ").pop()}</span> play?</>
              ) : (
                <>Pick a <span className={theme.heading}>{targetPos}</span> from {squad?.club}</>
              )}
            </h1>
            <div className="text-xs text-muted sm:text-sm">
              {phase === "spin" ? "Drawing the squad you’ll draft from"
                : phase === "choose" ? "Tap an empty slot on the pitch — only players who fit it will be offered"
                : phase === "place" ? "Green = natural · Yellow = secondary · locked positions can’t be used"
                : squad ? `${seasonText} · ${squad.coach} · ${squad.honor ?? squad.league}` : ""}
            </div>
          </div>
          <button className="btn btn-ghost shrink-0 text-xs" onClick={() => { resetDraft(); play("click"); router.push("/draft"); }}>
            ✕ Abandon
          </button>
        </div>

        {/* progress tracker */}
        <div className="mt-3 flex items-center gap-1.5">
          {formation.slots.map((_, i) => {
            const done = i < placedSlots.length;
            const current = i === placedSlots.length && phase !== "choose";
            return (
              <motion.span key={i} className="relative h-2 flex-1 rounded-full" title={`Pick ${i + 1}`}
                animate={current ? { opacity: [1, 0.55, 1] } : undefined}
                transition={current ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}
                style={{
                  background: done ? `linear-gradient(90deg, ${theme.accent}, ${theme.accent}88)` : current ? theme.accent : "rgba(255,255,255,0.10)",
                  boxShadow: current ? `0 0 12px ${theme.soft}` : done ? `0 0 6px ${theme.soft}` : "none",
                }} />
            );
          })}
        </div>

        {/* spinning — the reel takes over */}
        {phase === "spin" && squad && (
          <div className="mt-8 py-4">
            {pool === "copa" ? (
              <CopaSpinner key={`spin-${targetSlot}-${spinNonce}`} club={`${squad.club} ${squad.season}`} seasonLabel={seasonText}
                colors={squad.colors} reel={reel!} onDone={() => setRevealedKey(`${targetSlot}:${spinNonce}`)} />
            ) : pool === "euro" ? (
              <EuroSpinner key={`spin-${targetSlot}-${spinNonce}`} club={`${squad.club} ${squad.season}`} seasonLabel={seasonText}
                colors={squad.colors} reel={reel!} onDone={() => setRevealedKey(`${targetSlot}:${spinNonce}`)} />
            ) : (
              <SquadSpinner key={`spin-${targetSlot}-${spinNonce}`} club={squad.club} seasonLabel={seasonText}
                colors={squad.colors} onDone={() => setRevealedKey(`${targetSlot}:${spinNonce}`)} />
            )}
            <div className="mt-4 text-center text-xs text-muted">Drafting for <span className="font-bold" style={{ color: theme.accent }}>{targetPos}</span></div>
          </div>
        )}

        {phase !== "spin" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* PITCH */}
            <div ref={pitchRef} className="order-1">
              <div className={`glass rounded-2xl p-3 sm:p-4 ${phase === "place" ? "ring-2" : ""}`}
                style={phase === "place" ? { boxShadow: `0 0 30px ${theme.soft}` } : undefined}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[0.7rem] font-bold uppercase tracking-widest text-muted">Your XI</span>
                  <span className="chip bg-white/8" style={{ color: theme.accent }}>{setup.formationName}</span>
                </div>
                <Pitch
                  formation={formation}
                  players={xi}
                  variant={variant}
                  showRatings={setup.mode !== "expert"}
                  interaction={
                    phase === "choose"
                      ? { kind: "choose", onSlot: (i) => { beginRound(i); play("select"); } }
                      : phase === "place"
                        ? { kind: "place", player: { position: placing!.position, altPositions: placing!.altPositions, name: placing!.name }, onSlot: doPlace }
                        : null
                  }
                />
                <p className="mt-2 text-center text-[0.68rem] text-muted">
                  {phase === "choose" ? "Tap a glowing slot to draft that position"
                    : phase === "place" ? "Tap a green or yellow slot — or use the buttons below"
                    : `Drafting for ${targetPos} · ${offered.length} eligible`}
                </p>
              </div>
            </div>

            {/* ACTION COLUMN */}
            <div className="order-2 lg:order-2">
              {phase === "choose" && (
                <div className="glass rounded-2xl p-4">
                  {/* SQUAD PROGRESS */}
                  <div className="flex items-baseline justify-between">
                    <span className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: theme.accent }}>Squad Progress</span>
                    <span className="font-display text-sm font-extrabold text-white">{filledCount}<span className="text-white/40"> / {totalSlots}</span></span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div className="h-full rounded-full" animate={{ width: `${(filledCount / totalSlots) * 100}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 20 }}
                      style={{ background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}99)`, boxShadow: `0 0 10px ${theme.soft}` }} />
                  </div>
                  <div className="mt-1.5 text-[0.66rem] font-semibold text-white/60">
                    {remaining === 0 ? "Squad complete" : `${remaining} position${remaining > 1 ? "s" : ""} remaining`}
                  </div>

                  {/* POSITION CHIPS grouped by area */}
                  <div className="mt-3 space-y-2.5">
                    {groupedSlots.map(({ group, slots }) => {
                      const gc = GROUP_COLOR[group];
                      return (
                      <div key={group}>
                        <div className="mb-1 text-[0.52rem] font-bold uppercase tracking-[0.2em]" style={{ color: `${gc}cc` }}>{GROUP_LABEL[group]}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {slots.map((s) => s.filled ? (
                            <span key={s.i} title={`${POS_NAME[s.pos]} — ${s.name}`}
                              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border px-2.5 py-1 text-[0.72rem] font-bold text-white/60"
                              style={{ borderColor: `${gc}44`, background: `${gc}14` }}>
                              <span aria-hidden style={{ color: gc }}>✓</span>{s.pos}
                            </span>
                          ) : (
                            <button key={s.i} onClick={() => { beginRound(s.i); play("select"); scrollToPitch(); }}
                              title={`${POS_NAME[s.pos]} — choose a player`}
                              aria-label={`Draft a ${POS_NAME[s.pos]}`}
                              className="group inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border px-2.5 py-1 font-display text-sm font-extrabold text-white transition-all hover:-translate-y-0.5 active:scale-95"
                              style={{ borderColor: gc, background: `${gc}22`, boxShadow: `0 0 12px ${gc}22` }}>
                              {s.pos}
                              <span className="text-[0.5rem] font-bold uppercase tracking-wider opacity-80" style={{ color: gc }}>Choose</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      );
                    })}
                  </div>

                  {/* FORMATION — compact control with a tactical-board glyph */}
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <div className="min-w-0">
                      <div className="text-[0.5rem] font-bold uppercase tracking-[0.2em] text-white/40">Formation</div>
                      <div className="font-display text-sm font-extrabold text-white">{setup.formationName}</div>
                    </div>
                    <button className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-wider text-white/80 transition-colors hover:border-white/40 hover:text-white"
                      onClick={() => { setShowFormation(true); play("click"); }}>
                      <span aria-hidden className="mr-1">⊞</span>Change
                    </button>
                  </div>

                  {/* ACTIONS — AI complete assistant (secondary to manual drafting) */}
                  {remaining > 0 && (
                    <button
                      onClick={() => { setAiStage("confirm"); play("click"); }}
                      className="ai-shine group mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border py-2.5 font-display text-sm font-extrabold text-white transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                      style={{ borderColor: `${theme.accent}88`, background: `linear-gradient(120deg, ${theme.soft}, transparent)` }}>
                      <span aria-hidden className="text-base">✨</span>
                      <span className="hidden sm:inline">Complete Squad with AI</span>
                      <span className="sm:hidden">AI Complete</span>
                    </button>
                  )}

                  {/* picks-final info row — readable, not dramatic */}
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/[0.04] px-2.5 py-2 text-[0.66rem] font-semibold text-white/70">
                    <span aria-hidden className="mt-px" style={{ color: theme.accent }}>ⓘ</span>
                    <span>Player selections are final after confirmation.{setup.difficulty === "hard" ? " Hard mode — no re-rolls." : ""}</span>
                  </div>
                </div>
              )}

              {phase === "offer" && (
                <div>
                  {offered.length === 0 ? (
                    <div className="glass rounded-2xl p-5 text-center">
                      <div className="text-3xl">🚫</div>
                      <div className="mt-2 font-display text-base font-bold">No eligible {targetPos} in {squad?.club} {isIntl ? squad?.season : seasonText}</div>
                      <p className="mt-1 text-xs text-muted">This squad has no player who fits the {targetPos} role. Re-spin for a different one — this doesn’t cost the pick.</p>
                      <div className="mt-4 flex flex-col gap-2">
                        <button className="btn btn-gold" onClick={() => { respinSquad(); setRevealedKey(""); }}>🔄 Re-spin for a squad with a {targetPos}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="glass rounded-2xl p-3 sm:p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[0.7rem] font-bold uppercase tracking-widest text-muted">Eligible at {targetPos}</span>
                        <span className="chip bg-white/8" style={{ color: theme.accent }}>{offered.length}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                        {offered.map((p, i) => (
                          <PlayerCard key={p.id} player={p} mode={setup.mode} index={i}
                            variant={pool === "clubs" ? "cl" : pool}
                            onSelect={() => { setPlacing(p); play("click"); scrollToPitch(); }} />
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {rerolls > 0 ? (
                          <button className="btn btn-ghost text-[0.68rem]" onClick={() => { reroll(); setRevealedKey(""); }}
                            title="Draw a different team for this position — uses one of your re-rolls">🔄 Different team ({rerolls} left)</button>
                        ) : (
                          <span className="text-[0.64rem] text-muted">No re-rolls left — pick your {targetPos}.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {phase === "place" && placing && (
                <div className="glass rounded-2xl p-4">
                  <div className="mb-1 text-[0.7rem] font-bold uppercase tracking-widest text-muted">Place {placing.name.split(" ").pop()}</div>
                  <div className="mb-3 text-[0.7rem] text-muted">Choose the position — the reel offered him because he fits {targetPos}.</div>
                  <div className="flex flex-col gap-2">
                    {placeOptions.map((o) => (
                      <button key={o.i} onClick={() => doPlace(o.i)}
                        className="flex min-h-[48px] items-center justify-between rounded-xl border-2 px-3 py-2 text-left transition-all active:scale-95"
                        style={{ borderColor: o.suit.color, background: `${o.suit.color}14` }}>
                        <span className="font-display text-base font-extrabold text-white">{o.pos}</span>
                        <span className="text-[0.66rem] font-bold uppercase tracking-wider" style={{ color: o.suit.color }}>{o.suit.icon} {o.suit.short}</span>
                      </button>
                    ))}
                  </div>
                  <button className="btn btn-ghost mt-3 w-full text-xs" onClick={() => setPlacing(null)}>← Choose a different player</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MOBILE bottom sheet — big tap targets for choose / place, safe-area aware */}
      {(phase === "place") && placing && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#050b1e]/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[0.7rem] font-bold uppercase tracking-widest text-white/70">Place {placing.name.split(" ").pop()}</span>
            <button className="text-[0.66rem] font-bold uppercase tracking-wider text-white/50" onClick={() => setPlacing(null)}>Cancel</button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {placeOptions.map((o) => (
              <button key={o.i} onClick={() => doPlace(o.i)}
                className="flex min-h-[48px] shrink-0 flex-col items-center justify-center rounded-xl border-2 px-4 py-1.5"
                style={{ borderColor: o.suit.color, background: `${o.suit.color}18` }}>
                <span className="font-display text-base font-extrabold text-white">{o.pos}</span>
                <span className="text-[0.56rem] font-bold uppercase tracking-wider" style={{ color: o.suit.color }}>{o.suit.short}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* mid-draft formation change — remaps placed players, empties continue */}
      {showFormation && (
        <FormationPicker
          current={setup.formationName}
          accent={theme.accent}
          isAllowed={(f) => f.name === setup.formationName || formationCanHold(xi.filter(Boolean) as Player[], f)}
          onPick={(name) => { changeFormation(name); setPlacing(null); setRevealedKey(""); setShowFormation(false); play("select"); }}
          onClose={() => setShowFormation(false)}
          title="Change Formation"
        />
      )}

      {/* AI COMPLETE — confirmation, then the analysis sequence */}
      <AnimatePresence>
        {aiStage === "confirm" && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] flex items-end justify-center p-4 sm:items-center"
            style={{ background: "rgba(2,7,20,0.82)" }}
            onClick={() => setAiStage("hidden")}
            role="dialog" aria-modal="true" aria-label="Complete squad with AI"
          >
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className="glass w-full max-w-md rounded-2xl p-5" onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <span aria-hidden className="text-xl">✨</span>
                <h3 className="font-display text-lg font-extrabold text-white">Complete the remaining squad with AI?</h3>
              </div>
              <p className="mt-1.5 text-[0.78rem] leading-relaxed text-white/65">
                The assistant fills all {remaining} open position{remaining > 1 ? "s" : ""} in valid roles using mostly 75–87 rated players — a fair, balanced XI, not an auto super-team.
              </p>

              <div className="mt-4 text-[0.56rem] font-bold uppercase tracking-[0.2em] text-white/45">Strategy</div>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {AI_STRATEGIES.map((s) => {
                  const active = aiStrategy === s.id;
                  return (
                    <button key={s.id}
                      onClick={() => { setAiStrategy(s.id); play("click"); }}
                      aria-pressed={active}
                      className="min-h-[44px] rounded-xl border px-2 py-1.5 text-left transition-all active:scale-95"
                      style={active
                        ? { borderColor: theme.accent, background: theme.soft }
                        : { borderColor: s.advanced ? "rgba(255,180,80,0.35)" : "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)" }}>
                      <div className="text-[0.72rem] font-extrabold text-white">{s.label}</div>
                      <div className="text-[0.54rem] text-white/50">{s.hint}</div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 rounded-xl bg-black/25 px-3 py-2 text-[0.68rem] text-white/70">
                Expected completed squad: <span className="font-bold" style={{ color: theme.accent }}>~81–84 OVR</span> · balanced positions, varied players.
              </div>

              <div className="mt-5 flex gap-2.5">
                <button className="btn btn-ghost flex-1" onClick={() => { setAiStage("hidden"); play("click"); }}>Cancel</button>
                <button className="btn btn-gold flex-1" onClick={() => { setAiStep(0); setAiStage("running"); }}>✨ Complete Squad</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {aiStage === "running" && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[135] flex flex-col items-center justify-center p-6 text-center"
            style={{ background: "radial-gradient(120% 90% at 50% 40%, rgba(8,20,52,0.92), rgba(2,7,20,0.96))" }}
          >
            <motion.div aria-hidden className="text-5xl"
              animate={{ scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              style={{ filter: `drop-shadow(0 0 26px ${theme.soft})` }}>✨</motion.div>
            <div className="mt-4 cl-heading text-[0.62rem] tracking-[0.4em]" style={{ color: theme.accent }}>AI Squad Assistant</div>
            <AnimatePresence mode="wait">
              <motion.div key={aiStep}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mt-2 font-display text-xl font-extrabold text-white">
                {AI_STEPS[aiStep]}
              </motion.div>
            </AnimatePresence>
            <div className="mt-5 h-1 w-56 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full rounded-full" style={{ background: theme.accent }}
                initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2.6, ease: "easeInOut" }} />
            </div>
            <div className="mt-2 text-[0.58rem] uppercase tracking-[0.3em] text-white/40">Using predefined tactical logic — not a live model</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
