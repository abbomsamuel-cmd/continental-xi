"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { KOTie, KORoundName, MatchResult } from "@/lib/types";
import type { PitchVariant } from "@/components/Pitch";
import { TeamBadge } from "@/components/TeamBadge";
import { Confetti } from "@/components/fx/Atmosphere";
import { useFxLevel } from "@/lib/fx";

export interface BracketTeam { id: string; name: string; short: string; colors: [string, string]; season?: string; isUser?: boolean; country?: string }

interface Props {
  ties: KOTie[];
  teams: Record<string, BracketTeam>;
  userKey: string;
  champion?: string | null;
  variant: PitchVariant;
  rounds: KORoundName[];      // ordered rounds present, first → Final
  thirdPlace?: boolean;
  onTieClick?: (tie: KOTie) => void;
}

const COUNT: Record<string, number> = { "Play-off": 8, "Round of 16": 8, "Quarter-final": 4, "Semi-final": 2 };
const SHORT: Record<string, string> = { "Play-off": "Play-offs", "Round of 16": "Round of 16", "Quarter-final": "Quarter-finals", "Semi-final": "Semi-finals", Final: "Final", "Third Place": "Third Place" };

const PAL: Record<PitchVariant, { accent: string; panel: string; card: string; border: string; line: string; glow: string; confetti: string[] }> = {
  cl: {
    accent: "#00f0ff", panel: "cl-panel cl-streaks",
    card: "linear-gradient(160deg, rgba(24,34,50,0.92), rgba(10,14,23,0.96))", border: "rgba(0,240,255,0.28)",
    line: "rgba(0,240,255,0.5)", glow: "rgba(0,240,255,0.45)", confetti: ["#00f0ff", "#00f0ff", "#ffffff", "#7dfaff"],
  },
  euro: {
    accent: "#ff3b57", panel: "euro-panel euro-grid",
    card: "linear-gradient(160deg, rgba(14,40,110,0.92), rgba(6,16,58,0.96))", border: "rgba(255,59,87,0.3)",
    line: "rgba(255,59,87,0.5)", glow: "rgba(255,59,87,0.4)", confetti: ["#ff3b57", "#ffffff", "#1b3fd0", "#ffffff"],
  },
  copa: {
    accent: "#00e676", panel: "copa-panel copa-heat copa-gold-border",
    card: "linear-gradient(160deg, rgba(16,80,48,0.92), rgba(7,44,26,0.96))", border: "rgba(0,230,118,0.34)",
    line: "rgba(255,215,0,0.5)", glow: "rgba(0,230,118,0.5)", confetti: ["#00e676", "#ffd700", "#0ea5e9", "#ffffff"],
  },
};

function agg(tie: KOTie): [number | null, number | null] {
  if (tie.leg1 && tie.leg2) return [tie.leg1.awayGoals + tie.leg2.homeGoals, tie.leg1.homeGoals + tie.leg2.awayGoals];
  if (tie.leg1) return [tie.leg1.homeGoals, tie.leg1.awayGoals];
  return [null, null];
}
function pensOf(tie: KOTie): [number, number] | undefined {
  return tie.leg2?.penalties ?? tie.leg1?.penalties;
}
function label(t: BracketTeam): string {
  return t.isUser ? t.name : `${t.name}${t.season ? " " + t.season : ""}`;
}

/* ---- one team row inside a match card ---- */
function TeamRow({ team, goals, won, decided, accent, big }: {
  team: BracketTeam; goals: number | null; won: boolean; decided: boolean; accent: string; big?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-1.5 px-2 py-1.5 ${won ? "font-extrabold" : decided ? "opacity-45" : ""}`}
      style={{ color: won ? accent : "#fff" }}>
      <span className="flex min-w-0 items-center gap-1.5">
        <TeamBadge colors={team.colors} code={team.short} size={big ? 20 : 16} nationality={team.country} />
        <span className={`truncate ${big ? "text-[0.72rem]" : "text-[0.6rem]"} font-bold leading-tight`}>{label(team)}{team.isUser ? " ★" : ""}</span>
      </span>
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-display text-[0.72rem] font-extrabold tabular-nums">{goals ?? ""}</motion.span>
    </div>
  );
}

/* ---- one match card ---- */
function TieCard({
  tie, teams, userKey, pal, onClick, expandable, big,
}: { tie: KOTie; teams: Record<string, BracketTeam>; userKey: string; pal: (typeof PAL)[PitchVariant]; onClick?: () => void; expandable?: boolean; big?: boolean }) {
  const [open, setOpen] = useState(false);
  const lvl = useFxLevel();
  const [a, b] = agg(tie);
  const pens = pensOf(tie);
  const isUser = tie.teamA === userKey || tie.teamB === userKey;
  const decided = !!tie.winner;
  // the user's road breathes so their path through the tree stands out
  const userWon = isUser && decided && tie.winner === userKey;
  const pulse = isUser && lvl === "full";

  const handle = () => { if (onClick) onClick(); else if (expandable) setOpen((o) => !o); };

  return (
    <motion.button
      onClick={handle}
      disabled={!onClick && !expandable}
      whileHover={onClick || expandable ? { y: -3, scale: 1.03 } : undefined}
      animate={pulse ? { boxShadow: [`0 0 10px ${pal.glow}`, `0 0 20px ${pal.glow}`, `0 0 10px ${pal.glow}`] } : undefined}
      transition={pulse ? { boxShadow: { duration: 2.4, repeat: Infinity, ease: "easeInOut" }, default: { type: "spring", stiffness: 300, damping: 20 } } : { type: "spring", stiffness: 300, damping: 20 }}
      className={`relative block w-full overflow-hidden rounded-xl text-left ${onClick || expandable ? "cursor-pointer" : "cursor-default"}`}
      style={{
        background: pal.card,
        border: `1.5px solid ${userWon ? pal.accent : isUser ? `${pal.accent}bb` : pal.border}`,
        boxShadow: isUser ? `0 0 14px ${pal.glow}` : "0 4px 10px rgba(0,0,0,0.4)",
      }}
    >
      {/* "advanced" flourish — a check on the tie the user has just won through */}
      {userWon && (
        <span className="absolute right-1 top-1 z-10 grid h-4 w-4 place-items-center rounded-full text-[0.5rem] font-black"
          style={{ background: pal.accent, color: "#04101f" }} aria-hidden>✓</span>
      )}
      <TeamRow team={teams[tie.teamA]} goals={a} won={tie.winner === tie.teamA} decided={decided} accent={pal.accent} big={big} />
      <div className="h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
      <TeamRow team={teams[tie.teamB]} goals={b} won={tie.winner === tie.teamB} decided={decided} accent={pal.accent} big={big} />
      {pens && (
        <div className="px-2 py-[1px] text-center text-[0.5rem] font-bold uppercase tracking-wider" style={{ background: "rgba(0,0,0,0.35)", color: pal.accent }}>
          ⚽ Pens {pens[0]}–{pens[1]}
        </div>
      )}
      <AnimatePresence>
        {open && expandable && (tie.leg1 || tie.leg2) && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t px-2 py-1 text-[0.5rem] text-white/60" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            {legLine("1st Leg", tie.leg1, teams)}
            {legLine("2nd Leg", tie.leg2, teams)}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function legLine(name: string, r: MatchResult | undefined, teams: Record<string, BracketTeam>) {
  if (!r) return null;
  return (
    <div className="flex justify-between py-0.5">
      <span className="uppercase tracking-wider opacity-70">{name}</span>
      <span className="font-bold text-white/80">{teams[r.home]?.short} {r.homeGoals}–{r.awayGoals} {teams[r.away]?.short}</span>
    </div>
  );
}

/* empty future slot */
function EmptySlot({ pal, big }: { pal: (typeof PAL)[PitchVariant]; big?: boolean }) {
  return (
    <div className={`grid w-full place-items-center rounded-xl border border-dashed ${big ? "h-[58px]" : "h-[46px]"}`}
      style={{ borderColor: `${pal.accent}44`, background: "rgba(6,16,44,0.35)", color: `${pal.accent}66` }}>🛡️</div>
  );
}

export function PremiumBracket({ ties, teams, userKey, champion, variant, rounds, thirdPlace, onTieClick }: Props) {
  const pal = PAL[variant] ?? PAL.cl;
  const preFinal = rounds.filter((r) => r !== "Final" && r !== "Third Place");
  const byRound = (r: KORoundName) => ties.filter((t) => t.round === r);
  const fin = byRound("Final")[0] ?? null;
  const third = thirdPlace ? byRound("Third Place")[0] ?? null : null;
  const championTeam = champion ? teams[champion] : null;

  // left/right halves for each pre-final round
  const halves = preFinal.map((r) => {
    const n = COUNT[r] ?? 2;
    const arr: (KOTie | null)[] = [...byRound(r)];
    while (arr.length < n) arr.push(null);
    return { round: r, left: arr.slice(0, n / 2), right: arr.slice(n / 2) };
  });

  const clickable = (t: KOTie | null) => (onTieClick && t && (t.leg1 || t.leg2) ? () => onTieClick(t) : undefined);

  return (
    <div className={`${pal.panel} shine relative overflow-hidden rounded-3xl p-4 sm:p-5`}>
      {championTeam && <Confetti count={34} colors={pal.confetti} />}
      <div className="mb-4 flex items-center justify-center gap-2">
        <span className="h-px w-8" style={{ background: `linear-gradient(90deg, transparent, ${pal.accent})` }} />
        <span className="cl-heading text-[0.62rem] tracking-[0.4em]" style={{ color: pal.accent }}>Road to the Final</span>
        <span className="h-px w-8" style={{ background: `linear-gradient(90deg, ${pal.accent}, transparent)` }} />
      </div>

      {/* ===== DESKTOP: two-sided converging tree ===== */}
      <div className="hidden overflow-x-auto pb-2 md:block">
        <div className="mx-auto flex min-w-[720px] items-stretch justify-center gap-1.5 lg:gap-3" style={{ minHeight: 360 }}>
          {/* left rounds (outer → inner) */}
          {halves.map((h, ri) => (
            <BracketColumn key={`l-${h.round}`} title={SHORT[h.round]} pal={pal} side="left" depth={ri}>
              {h.left.map((t, i) => t
                ? <TieCard key={`l${h.round}${i}`} tie={t} teams={teams} userKey={userKey} pal={pal} onClick={clickable(t)} />
                : <EmptySlot key={`el${h.round}${i}`} pal={pal} />)}
            </BracketColumn>
          ))}

          {/* center: trophy + final + third + champion */}
          <div className="flex min-w-[130px] flex-col items-center justify-center gap-2 px-1">
            <motion.div initial={{ scale: 0.5, opacity: 0, y: 10 }}
              animate={championTeam ? { scale: 1, opacity: 1, y: [0, -5, 0] } : { scale: 1, opacity: 1, y: 0 }}
              transition={championTeam ? { y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" }, scale: { type: "spring", stiffness: 140, damping: 12 } } : { type: "spring", stiffness: 140, damping: 12 }}
              className="text-5xl" style={{ filter: `drop-shadow(0 0 22px ${pal.glow})` }}>🏆</motion.div>
            <span className="cl-heading text-[0.6rem] tracking-[0.3em]" style={{ color: pal.accent }}>Final</span>
            <div className="w-full" style={championTeam ? { filter: `drop-shadow(0 0 12px ${pal.glow})` } : undefined}>
              {fin ? <TieCard tie={fin} teams={teams} userKey={userKey} pal={pal} onClick={clickable(fin)} big /> : <EmptySlot pal={pal} big />}
            </div>
            {third && (
              <div className="w-full">
                <div className="mb-1 text-center text-[0.5rem] uppercase tracking-[0.25em] text-white/40">Third Place</div>
                <TieCard tie={third} teams={teams} userKey={userKey} pal={pal} onClick={clickable(third)} />
              </div>
            )}
            {championTeam && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-center">
                <div className="text-[0.5rem] uppercase tracking-[0.25em] text-white/45">Champions</div>
                <div className="font-display text-[0.8rem] font-extrabold text-gradient-gold text-shine">{label(championTeam)}</div>
              </motion.div>
            )}
          </div>

          {/* right rounds (inner → outer) */}
          {[...halves].reverse().map((h, ri) => (
            <BracketColumn key={`r-${h.round}`} title={SHORT[h.round]} pal={pal} side="right" depth={halves.length - 1 - ri}>
              {h.right.map((t, i) => t
                ? <TieCard key={`r${h.round}${i}`} tie={t} teams={teams} userKey={userKey} pal={pal} onClick={clickable(t)} />
                : <EmptySlot key={`er${h.round}${i}`} pal={pal} />)}
            </BracketColumn>
          ))}
        </div>
      </div>

      {/* ===== MOBILE: rounds stacked; tap a tie to expand legs ===== */}
      <div className="space-y-4 md:hidden">
        {championTeam && (
          <div className="rounded-2xl p-3 text-center" style={{ background: `${pal.accent}14`, border: `1px solid ${pal.accent}55` }}>
            <div className="text-3xl">🏆</div>
            <div className="text-[0.5rem] uppercase tracking-[0.25em] text-white/45">Champions</div>
            <div className="font-display text-sm font-extrabold text-gradient-gold text-shine">{label(championTeam)}</div>
          </div>
        )}
        {[...preFinal, ...(fin ? ["Final" as KORoundName] : []), ...(third ? ["Third Place" as KORoundName] : [])].map((r, ri) => {
          const list = byRound(r);
          if (!list.length) return null;
          return (
            <motion.div key={r} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: ri * 0.05 }}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-[0.55rem] font-bold uppercase tracking-[0.25em]" style={{ color: pal.accent }}>{SHORT[r]}</span>
                <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${pal.accent}44, transparent)` }} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {list.map((t, i) => (
                  <TieCard key={`${r}${i}`} tie={t} teams={teams} userKey={userKey} pal={pal} onClick={onTieClick && (t.leg1 || t.leg2) ? () => onTieClick(t) : undefined} expandable={!onTieClick} big={r === "Final"} />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-3 text-center text-[0.58rem] text-white/45">
        Your ties glow · tap a played tie for both legs & full stats
      </p>
    </div>
  );
}

/* one round column with staggered entrance + an animated connector spine */
function BracketColumn({ title, pal, side, depth, children }: { title: string; pal: (typeof PAL)[PitchVariant]; side: "left" | "right"; depth: number; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div className="relative flex min-w-[128px] flex-col">
      <div className="mb-2 text-center text-[0.5rem] font-bold uppercase tracking-[0.2em]" style={{ color: `${pal.accent}cc` }}>{title}</div>
      <div className="flex flex-1 flex-col justify-around gap-3">
        {items.map((child, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: side === "left" ? -16 : 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: depth * 0.12 + i * 0.06, type: "spring", stiffness: 220, damping: 22 }}
            className="relative"
          >
            {child}
            {/* animated connector spine toward the centre */}
            <motion.span aria-hidden className={`pointer-events-none absolute top-1/2 h-px ${side === "left" ? "left-full" : "right-full"}`}
              style={{ width: 12, background: `linear-gradient(90deg, ${pal.line}, transparent)`, transformOrigin: side === "left" ? "left" : "right" }}
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: depth * 0.12 + i * 0.06 + 0.2, duration: 0.4 }} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
