"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { PlayerCard } from "@/components/PlayerCard";
import { Pitch, type PitchVariant } from "@/components/Pitch";
import { FormationPicker } from "@/components/FormationPicker";
import { SquadSpinner } from "@/components/SquadSpinner";
import { EuroSpinner, CopaSpinner } from "@/components/NationSpinner";
import { EuroScene, CopaScene } from "@/components/fx/Scenes";
import { getPool } from "@/lib/players";
import { formationCanHold } from "@/lib/formations";
import { suitability } from "@/lib/suitability";
import type { Player } from "@/lib/types";
import { play } from "@/lib/sound";

const POOL_BADGE: Record<string, string | null> = {
  clubs: null, euro: "🇪🇺 UEFA EURO DRAFT", copa: "🌎 COPA AMÉRICA DRAFT",
};

const POOL_THEME: Record<string, { accent: string; heading: string; soft: string }> = {
  clubs: { accent: "#22e0ff", heading: "text-gradient-gold", soft: "rgba(34,224,255,0.35)" },
  euro: { accent: "#37e0ff", heading: "text-gradient-euro", soft: "rgba(55,224,255,0.4)" },
  copa: { accent: "#ffc93c", heading: "text-gradient-copa", soft: "rgba(255,201,60,0.4)" },
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

  const [revealedKey, setRevealedKey] = useState("");
  const [placing, setPlacing] = useState<Player | null>(null);
  const [showFormation, setShowFormation] = useState(false);
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

  const emptySlots = formation.slots
    .map((s, i) => ({ i, pos: s.pos, filled: !!xi[i] }))
    .filter((s) => !s.filled);

  const doPlace = (slotIndex: number) => {
    if (!placing) return;
    choosePlayer(placing.id, slotIndex);
    setPlacing(null);
  };

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
                  <div className="mb-2 text-[0.7rem] font-bold uppercase tracking-widest text-muted">Positions to fill</div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3">
                    {emptySlots.map((s) => (
                      <button key={s.i} onClick={() => { beginRound(s.i); play("select"); scrollToPitch(); }}
                        className="min-h-[48px] rounded-xl border border-white/15 bg-white/5 py-2 font-display text-sm font-extrabold text-white/90 transition-all hover:border-white/40 hover:bg-white/10 active:scale-95">
                        {s.pos}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    <button className="btn btn-ghost w-full text-xs" onClick={() => { setShowFormation(true); play("click"); }}>
                      🔁 Formation · {setup.formationName}
                    </button>
                  </div>
                  <p className="mt-2 text-center text-[0.62rem] text-muted">Picks are final — choose carefully.</p>
                  {setup.difficulty === "hard" && (
                    <div className="mt-1 text-center text-[0.66rem] text-danger">🔥 Hard · no re-rolls</div>
                  )}
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
    </>
  );
}
