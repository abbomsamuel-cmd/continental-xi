"use client";

import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { Formation, Player, Position } from "@/lib/types";
import { suitability } from "@/lib/suitability";
import { computeChemistryLinks } from "@/lib/chemistry";
import { LineupCard, EmptyTile, type SlotState } from "@/components/LineupCard";
import { projectSlot, projectPoint, projectPath } from "@/lib/pitch-projection";

/** Pixel distance a pointer must travel before a press becomes a drag —
 *  below this it resolves as a normal tap (the guaranteed-working fallback). */
const DRAG_THRESHOLD = 6;

export type PitchVariant = "cl" | "euro" | "copa";

/** A player being placed or moved — only its positions matter for the pitch. */
export interface PlacingPlayer {
  position: Position;
  altPositions: Position[];
  name?: string;
}

type Interaction =
  | { kind: "choose"; onSlot: (i: number) => void }
  | { kind: "place"; player: PlacingPlayer; onSlot: (i: number) => void }
  | { kind: "edit"; selectedSlots: number[]; moving: PlacingPlayer | null; onSlot: (i: number) => void };

interface Props {
  formation: Formation;
  players: (Player | null)[];
  showRatings?: boolean;
  variant?: PitchVariant;
  captainSlot?: number;
  interaction?: Interaction | null;
  compact?: boolean;
  /** draw connector lines between nearby linked players (same club / nation / era) */
  showChemistry?: boolean;
}

/**
 * Per-competition broadcast identity — original ContinentalXI looks inspired by
 * elite football graphics, never a copy:
 *   cl   deep navy pitch, cyan-blue lighting + gold, European night
 *   euro bright green pitch, royal-blue frame, clean international broadcast
 *   copa cyan pitch, gold + warm accents, festive South America
 */
const BOARD: Record<PitchVariant, {
  bg: string; grass: string; frame: string; line: string; accent: string; slotGlow: string;
}> = {
  cl: {
    bg: "radial-gradient(120% 60% at 50% -10%, rgba(0,240,255,0.22), transparent 60%), radial-gradient(70% 45% at 88% 4%, rgba(0,240,255,0.2), transparent 62%), radial-gradient(70% 45% at 12% 4%, rgba(0,240,255,0.14), transparent 62%), linear-gradient(180deg, #121824 0%, #0d1320 55%, #05070d 100%)",
    grass: "repeating-linear-gradient(0deg, rgba(148,163,184,0.07) 0 46px, rgba(148,163,184,0.02) 46px 92px)",
    frame: "1px solid rgba(0,240,255,0.32)",
    line: "rgba(226,232,240,0.32)",
    accent: "#00f0ff", slotGlow: "rgba(0,240,255,0.75)",
  },
  euro: {
    bg: "radial-gradient(120% 60% at 50% -8%, rgba(27,63,208,0.42), transparent 60%), linear-gradient(180deg, #14a055 0%, #0f8446 55%, #0a6234 100%)",
    grass: "repeating-linear-gradient(0deg, rgba(255,255,255,0.07) 0 46px, rgba(0,0,0,0.09) 46px 92px)",
    frame: "1px solid rgba(255,59,87,0.55)",
    line: "rgba(255,255,255,0.55)",
    accent: "#ff3b57", slotGlow: "rgba(255,59,87,0.7)",
  },
  copa: {
    bg: "radial-gradient(120% 60% at 50% -8%, rgba(255,215,0,0.18), transparent 58%), linear-gradient(180deg, #0f6d43 0%, #0c552f 55%, #06371e 100%)",
    grass: "repeating-linear-gradient(0deg, rgba(255,240,200,0.07) 0 46px, rgba(0,0,0,0.1) 46px 92px)",
    frame: "1px solid rgba(0,230,118,0.55)",
    line: "rgba(255,236,190,0.48)",
    accent: "#00e676", slotGlow: "rgba(0,230,118,0.75)",
  },
};

/* Per-competition premium background mosaic — a very low-opacity geometric
 * pattern that gives each pitch its own identity without hurting readability.
 * CL a soft hexagonal weave, EURO a fine diamond grid, Copa a warm gold argyle. */
function PitchMosaic({ variant }: { variant: PitchVariant }) {
  const id = `mz-${variant}`;
  if (variant === "cl") {
    return (
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id={id} width="60" height="52" patternUnits="userSpaceOnUse">
            <path d="M15 0 L45 0 L60 26 L45 52 L15 52 L0 26 Z" fill="none" stroke="rgba(0,240,255,0.9)" strokeWidth="1" />
            <path d="M45 0 L60 26 M15 0 L0 26 M15 52 L0 26 M45 52 L60 26" stroke="rgba(0,240,255,0.5)" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} opacity="0.08" />
      </svg>
    );
  }
  if (variant === "euro") {
    return (
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id={id} width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="34" height="34" fill="none" stroke="rgba(210,225,255,0.9)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} opacity="0.07" />
      </svg>
    );
  }
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id={id} width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M28 4 L52 28 L28 52 L4 28 Z" fill="none" stroke="rgba(255,214,120,0.9)" strokeWidth="1" />
          <circle cx="28" cy="28" r="1.6" fill="rgba(255,214,120,0.9)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} opacity="0.08" />
    </svg>
  );
}

// Positions come from lib/pitch-projection.ts — the board is drawn in
// perspective, so the same projection has to serve the cards, the painted
// markings, the chemistry lines and scripts/overlap-check.ts.
const project = projectSlot;

interface DragState {
  source: number;
  x: number;
  y: number;
  over: number | null;
}

export function Pitch({
  formation, players, showRatings = true, variant = "cl", captainSlot, interaction = null, compact = false,
  showChemistry = false,
}: Props) {
  const board = BOARD[variant] ?? BOARD.cl;
  const chemLinks = useMemo(
    () => (showChemistry ? computeChemistryLinks(formation, players) : []),
    [showChemistry, formation, players],
  );

  // ---- drag-and-drop: a pointer-based progressive enhancement over the tap
  // flow below. It never bypasses the legality system — a drag just calls the
  // same interaction.onSlot(i) the tap handler calls, at pointerdown (select
  // source) and pointerup (resolve destination or cancel). Tap-to-select /
  // tap-to-place keeps working untouched as the guaranteed fallback.
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragSourceRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  function hitSlot(x: number, y: number): number | null {
    if (typeof document === "undefined") return null;
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-slot-index]");
    const idx = el?.dataset.slotIndex;
    return idx !== undefined ? Number(idx) : null;
  }

  function endDrag(commitIndex: number | null) {
    const source = dragSourceRef.current;
    draggingRef.current = false;
    dragSourceRef.current = null;
    startPosRef.current = null;
    setDrag(null);
    if (source === null || !interaction) return;
    // resolve to the same onSlot(i) contract the tap flow uses — swap onto a
    // legal destination, or re-tap the source to cancel the selection.
    if (commitIndex !== null && commitIndex !== source) interaction.onSlot(commitIndex);
    else interaction.onSlot(source);
  }

  function onCardPointerDown(e: ReactPointerEvent, i: number, draggable: boolean) {
    if (!draggable) return;
    dragSourceRef.current = i;
    draggingRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onCardPointerMove(e: ReactPointerEvent, i: number) {
    if (dragSourceRef.current !== i || !startPosRef.current) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    if (!draggingRef.current) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      draggingRef.current = true;
      interaction?.onSlot(i); // select the source, mirroring the first tap
    }
    setDrag({ source: i, x: e.clientX, y: e.clientY, over: hitSlot(e.clientX, e.clientY) });
  }

  function onCardPointerUp(e: ReactPointerEvent, i: number) {
    if (dragSourceRef.current !== i) return;
    if (draggingRef.current) {
      endDrag(hitSlot(e.clientX, e.clientY));
    } else {
      // never crossed the drag threshold — a plain tap, let onClick handle it
      dragSourceRef.current = null;
      startPosRef.current = null;
    }
  }

  function onCardPointerCancel(i: number) {
    if (dragSourceRef.current !== i) return;
    if (draggingRef.current) endDrag(null);
    else { dragSourceRef.current = null; startPosRef.current = null; }
  }

  const draggedPlayer = drag ? players[drag.source] : null;

  function slotInfo(i: number, slotPos: Position) {
    const filled = players[i];
    if (interaction?.kind === "choose") {
      return { tappable: !filled, draftable: !filled, target: null as null | ReturnType<typeof suitability>, dim: false, selected: false };
    }
    if (interaction?.kind === "place") {
      if (filled) return { tappable: false, draftable: false, target: null, dim: true, selected: false };
      const suit = suitability(interaction.player.position, interaction.player.altPositions, slotPos);
      return { tappable: suit.level !== "blocked", draftable: false, target: suit, dim: false, selected: false };
    }
    if (interaction?.kind === "edit") {
      const selected = interaction.selectedSlots.includes(i);
      if (interaction.moving) {
        const suit = suitability(interaction.moving.position, interaction.moving.altPositions, slotPos);
        const ok = suit.level !== "blocked" && !selected;
        return { tappable: ok || selected, draftable: false, target: selected ? null : suit, dim: !ok && !selected, selected };
      }
      return { tappable: !!filled, draftable: false, target: null, dim: false, selected };
    }
    return { tappable: false, draftable: false, target: null, dim: false, selected: false };
  }

  // width is a % of the PITCH (container-query), so tiles scale with the pitch
  // and never overlap regardless of where the pitch is rendered. 12cqw on the
  // enlarged pitch reads bigger in absolute px while leaving clear air between
  // the hand-tuned formation slots.
  const cardW = "w-[12.5cqw]"; // largest width verified overlap-free across all 19 formations

  return (
    <div
      className="relative mx-auto aspect-[7/10] w-full max-w-[540px] select-none"
      style={{ transform: "perspective(1600px) rotateX(1.5deg)", transformStyle: "preserve-3d", containerType: "inline-size" }}
    >
      <div
        className="absolute inset-0 overflow-hidden rounded-[18px]"
        style={{ background: board.bg, border: board.frame, boxShadow: `inset 0 0 70px rgba(0,0,0,0.35), 0 20px 50px rgba(0,0,0,0.5)` }}
      >
        {/* mowing stripes / grass texture */}
        <div className="pointer-events-none absolute inset-0" aria-hidden style={{ background: board.grass }} />

        {/* premium competition mosaic — low-opacity geometric identity */}
        <PitchMosaic variant={variant} />

        {/* floodlight bloom top corners + near-field warmth + grounding vignette */}
        <div className="pointer-events-none absolute inset-0" aria-hidden
          style={{
            background:
              `radial-gradient(34% 24% at 6% -3%, ${board.accent}3a, transparent 70%),` +
              `radial-gradient(34% 24% at 94% -3%, ${board.accent}3a, transparent 70%),` +
              "radial-gradient(60% 30% at 50% 100%, rgba(255,255,255,0.08), transparent 70%)," +
              "radial-gradient(150% 46% at 50% 116%, rgba(0,0,0,0.55), transparent 60%)," +
              "radial-gradient(150% 30% at 50% -8%, rgba(0,0,0,0.28), transparent 58%)",
          }} />
        {/* twin floodlight beams raking down from the top corners */}
        <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden
          style={{
            background:
              `conic-gradient(from 118deg at 7% -4%, transparent 0deg, ${board.accent}14 8deg, transparent 20deg),` +
              `conic-gradient(from 208deg at 93% -4%, transparent 0deg, ${board.accent}14 8deg, transparent 20deg)`,
            maskImage: "linear-gradient(to bottom, #000, transparent 70%)",
            WebkitMaskImage: "linear-gradient(to bottom, #000, transparent 70%)",
          }} />

        {/* CL: soft light streaks + centre glow for a broadcast night feel */}
        {variant === "cl" && (
          <>
            <div className="pointer-events-none absolute inset-0" aria-hidden
              style={{
                background: "repeating-linear-gradient(118deg, transparent 0 34px, rgba(130,175,255,0.05) 34px 35px)",
                maskImage: "linear-gradient(to bottom, #000, transparent 90%)",
                WebkitMaskImage: "linear-gradient(to bottom, #000, transparent 90%)",
              }} />
            <div className="pointer-events-none absolute left-1/2 top-[46%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full" aria-hidden
              style={{ background: "radial-gradient(circle, rgba(120,170,255,0.13), transparent 70%)" }} />
          </>
        )}

        {/* centre-circle emblem glow — a soft competition-accent halo */}
        <div className="pointer-events-none absolute left-1/2 top-[46.5%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full" aria-hidden
          style={{ background: `radial-gradient(circle, ${board.accent}1c, transparent 68%)` }} />

        {/* pitch markings — projected, so the touchlines converge toward the
            far end and the centre circle reads as an ellipse. Same projection
            the cards use, so a card at a slot lands exactly on its spot. */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none"
          style={{ filter: `drop-shadow(0 0 2.5px ${board.accent}88)` }}>
          {/* mown bands, converging with the perspective */}
          <g opacity="0.5">
            {Array.from({ length: 8 }).map((_, i) => (
              i % 2 === 0 ? (
                <polygon key={i} fill="rgba(255,255,255,0.035)"
                  points={projectPath([[0, i * 12.5], [100, i * 12.5], [100, (i + 1) * 12.5], [0, (i + 1) * 12.5]])} />
              ) : null
            ))}
          </g>
          <g fill="none" stroke={board.line} strokeWidth={0.5} strokeLinejoin="round">
            {/* touchlines + goal lines */}
            <polygon points={projectPath([[2, 1], [98, 1], [98, 99], [2, 99]])} />
            {/* halfway line */}
            <polyline points={projectPath([[2, 50], [98, 50]])} />
            {/* penalty boxes and six-yard boxes, near and far */}
            <polygon points={projectPath([[24, 1], [76, 1], [76, 16], [24, 16]])} />
            <polygon points={projectPath([[24, 99], [76, 99], [76, 84], [24, 84]])} />
            <polygon points={projectPath([[38, 1], [62, 1], [62, 6], [38, 6]])} />
            <polygon points={projectPath([[38, 99], [62, 99], [62, 94], [38, 94]])} />
            {/* centre circle — sampled round, so perspective makes it an ellipse */}
            <polygon points={projectPath(
              Array.from({ length: 40 }, (_, i) => {
                const a = (i / 40) * Math.PI * 2;
                return [50 + Math.cos(a) * 13, 50 + Math.sin(a) * 9] as [number, number];
              })
            )} />
          </g>
          {/* centre spot + penalty spots */}
          <g fill={board.line}>
            {([[50, 50], [50, 11], [50, 89]] as [number, number][]).map(([x, y], i) => {
              const q = projectPoint(x, y);
              return <circle key={i} cx={q.leftPct} cy={q.topPct} r={0.45} />;
            })}
          </g>
        </svg>
      </div>

      {/* chemistry connector lines — same club (bright), same nation or era
          (dimmer amber), drawn between positionally-close linked players */}
      {chemLinks.length > 0 && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 z-[5] h-full w-full" aria-hidden>
          {chemLinks.map((link, i) => {
            const a = projectPoint(formation.slots[link.a].x, formation.slots[link.a].y);
            const b = projectPoint(formation.slots[link.b].x, formation.slots[link.b].y);
            return (
              <line
                key={i}
                x1={a.leftPct} y1={a.topPct} x2={b.leftPct} y2={b.topPct}
                stroke={link.strength === 3 ? "#2ee6a6" : "#ffcf5c"}
                strokeWidth={link.strength === 3 ? 0.6 : 0.4}
                strokeOpacity={link.strength === 3 ? 0.65 : 0.4}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      )}

      {/* slots */}
      {formation.slots.map((slot, i) => {
        const player = players[i];
        const pos = project(slot.x, slot.y);
        const info = slotInfo(i, slot.pos);
        const tappable = info.tappable && !!interaction;
        const ownSuit = player ? suitability(player.position, player.altPositions, slot.pos) : null;
        const secondary = ownSuit && ownSuit.level !== "natural";

        const emptyState: SlotState = info.target
          ? info.target.level === "blocked" ? "blocked" : "target"
          : info.draftable ? "draftable"
          : info.selected ? "selected" : "idle";

        // drag can only be INITIATED from a filled, tappable card with nothing
        // already tap-selected — once a source is picked (by tap or drag), the
        // rest of the swap resolves through the normal onClick/onSlot path.
        const draggable = interaction?.kind === "edit" && !interaction.moving && !!player && tappable;
        const isDragSource = drag?.source === i;
        const isLegalDropHover = drag !== null && drag.over === i && i !== drag.source && !info.dim;

        return (
          <div
            key={i}
            data-slot-index={i}
            className="absolute"
            style={{
              left: pos.left,
              top: pos.top,
              // scale with depth, and layer nearer cards above farther ones so
              // the overlap of a tall card with the grass behind it reads right
              transform: `translate(-50%, -50%) scale(${pos.scale})`,
              zIndex: 10 + Math.round((1 - pos.depth) * 10),
              opacity: info.dim ? 0.3 : isDragSource ? 0.35 : 1,
            }}
          >
            <button
              type="button"
              disabled={!tappable}
              onClick={tappable ? () => interaction!.onSlot(i) : undefined}
              onPointerDown={draggable ? (e) => onCardPointerDown(e, i, draggable) : undefined}
              onPointerMove={draggable || drag?.source === i ? (e) => onCardPointerMove(e, i) : undefined}
              onPointerUp={draggable || drag?.source === i ? (e) => onCardPointerUp(e, i) : undefined}
              onPointerCancel={draggable || drag?.source === i ? () => onCardPointerCancel(i) : undefined}
              aria-label={player ? `${player.name}, ${slot.pos}` : `${slot.pos} slot`}
              className={`relative block min-h-[44px] min-w-[44px] rounded-2xl focus:outline-none ${tappable ? "cursor-pointer" : "cursor-default"} ${draggable ? "touch-none" : ""}`}
              style={isLegalDropHover ? { boxShadow: "0 0 0 3px rgba(0,240,255,0.8)" } : undefined}
            >
              {/* captain armband */}
              {player && captainSlot === i && (
                <span className="absolute -right-1.5 -top-1.5 z-30 grid h-5 w-5 place-items-center rounded-full font-display text-[0.6rem] font-extrabold text-[#04140c]"
                  style={{ background: "linear-gradient(150deg, #7dfaff, #00f0ff)", boxShadow: "0 2px 8px rgba(0,0,0,0.55)" }} title="Captain">C</span>
              )}

              <AnimatePresence mode="popLayout">
                <motion.div
                  key={player ? player.id : `e${i}-${emptyState}`}
                  initial={{ scale: 0.9, y: 6, opacity: 0 }}
                  animate={{ scale: info.selected && player ? 1.06 : 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.85, y: -4, opacity: 0 }}
                  whileHover={player && tappable ? { y: -4, scale: 1.05 } : undefined}
                  transition={{ type: "spring", stiffness: 300, damping: 16 }}
                >
                  {/* grounding shadow — sells the "planted on the pitch" look;
                      grows and softens as the card lifts on hover */}
                  <span aria-hidden className="pitch-card-shadow absolute left-1/2 top-full z-0 h-2.5 w-4/5 -translate-x-1/2 -translate-y-1 rounded-[100%]"
                    style={{ background: "radial-gradient(50% 100% at 50% 50%, rgba(0,0,0,0.55), transparent 72%)", filter: "blur(2.4px)" }} />
                  {player ? (
                    <LineupCard
                      name={player.name}
                      overall={player.overall}
                      colors={player.colors}
                      nationality={player.nationality}
                      seasonLabel={compact ? undefined : player.seasonLabel}
                      slotPos={slot.pos}
                      clubLabel={compact ? undefined : player.club}
                      clubBadgeUrl={player.clubBadgeUrl}
                      nationFlagUrl={player.nationFlagUrl}
                      variant={variant}
                      showRating={showRatings}
                      secondaryColor={secondary ? ownSuit!.color : undefined}
                      captain={captainSlot === i}
                      selected={info.selected}
                      slotGlow={board.slotGlow}
                      widthClass={cardW}
                    />
                  ) : (
                    <EmptyTile
                      variant={variant}
                      pos={slot.pos}
                      state={emptyState}
                      color={info.target ? info.target.color : undefined}
                      sub={info.target && info.target.level !== "blocked" ? info.target.short : undefined}
                      widthClass={cardW}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        );
      })}

      {/* drag ghost — portalled to <body> so the pitch's 3D perspective
          transform (which creates a containing block) can't clip/skew it */}
      {drag && draggedPlayer && typeof document !== "undefined" &&
        createPortal(
          <div
            aria-hidden
            className="pointer-events-none fixed z-[300] w-16 -translate-x-1/2 -translate-y-1/2 scale-110 opacity-90"
            style={{ left: drag.x, top: drag.y, containerType: "inline-size" }}
          >
            <LineupCard
              name={draggedPlayer.name}
              overall={draggedPlayer.overall}
              colors={draggedPlayer.colors}
              variant={variant}
              showRating={showRatings}
              widthClass="w-full"
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
