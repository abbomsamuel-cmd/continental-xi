"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { Pitch } from "@/components/Pitch";
import { FormationPicker } from "@/components/FormationPicker";
import { LineupPresentation } from "@/components/LineupPresentation";
import { formationCanHold } from "@/lib/formations";
import { EuroScene, CopaScene } from "@/components/fx/Scenes";
import { suitability } from "@/lib/suitability";
import { TACTICS, tacticById, tacticFit, tacticFitBand, tacticFitReasons, tacticMatchupSummary, type TacticId } from "@/lib/tactics";
import { shareXI, type ShareFormat } from "@/lib/share-xi";
import { POSITION_GROUP } from "@/lib/formations";
import type { Player } from "@/lib/types";
import { play } from "@/lib/sound";

/* per-competition presentation — same information, three different rooms */
const COMP = {
  clubs: {
    label: "Champions League", compLine: "CHAMPIONS LEAGUE", accent: "#22e0ff", accent2: "#d4af37",
    soft: "rgba(34,224,255,0.14)", panel: "cl-panel cl-streaks", heading: "text-gradient-gold",
    enter: "Enter League Phase →", bg: ["#0a1f52", "#02081b"] as [string, string], scene: null,
  },
  euro: {
    label: "UEFA EURO", compLine: "UEFA EURO", accent: "#37e0ff", accent2: "#dbe6ff",
    soft: "rgba(55,224,255,0.14)", panel: "euro-panel euro-grid", heading: "text-gradient-euro",
    enter: "Enter Group Stage →", bg: ["#0a1c52", "#040a20"] as [string, string], scene: "euro",
  },
  copa: {
    label: "Copa América", compLine: "COPA AMÉRICA", accent: "#ffc93c", accent2: "#17c97a",
    soft: "rgba(255,201,60,0.14)", panel: "copa-panel copa-heat copa-gold-border", heading: "text-gradient-copa",
    enter: "Enter Group Stage →", bg: ["#0a3a24", "#04140b"] as [string, string], scene: "copa",
  },
} as const;

function Bar({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-[0.68rem]">
        <span className="font-bold uppercase tracking-widest text-white/55">{label}</span>
        <span className="font-display font-extrabold text-white">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${accent}88, ${accent})` }}
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.min(100, value)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function SquadPage() {
  const router = useRouter();
  const formation = useGame((s) => s.formation);
  const setup = useGame((s) => s.setup);
  const draftComplete = useGame((s) => s.draftComplete);
  const getXI = useGame((s) => s.getXI);
  const getAnalysis = useGame((s) => s.getAnalysis);
  const finish = useGame((s) => s.finishDraftIntoTournament);
  const swapSlots = useGame((s) => s.swapSlots);
  const changeFormation = useGame((s) => s.changeFormation);
  const setTactic = useGame((s) => s.setTactic);
  const captainId = useGame((s) => s.captainId);
  const setCaptain = useGame((s) => s.setCaptain);
  const profileName = useGame((s) => s.profile.name);

  const [teamName, setTeamName] = useState("");
  const [mode, setMode] = useState<"view" | "edit" | "captain" | "compare">("view");
  const [swapSel, setSwapSel] = useState<number | null>(null);
  const [compareSel, setCompareSel] = useState<number[]>([]);
  const [showTactics, setShowTactics] = useState(false);
  const [showFormation, setShowFormation] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const [notice, setNotice] = useState("");

  // a campaign is already running — read-only squad view, never a restart door
  const hydrated = useGame((s) => s.hydrated);
  const tournament = useGame((s) => s.tournament);
  const intl = useGame((s) => s.intl);
  const campaignActive = !!tournament || !!intl;

  // Formation changes here are gated to lossless remaps, so the XI stays
  // complete — the review screen only shows for a finished draft.
  const invalid = !formation || !setup || !draftComplete;
  useEffect(() => {
    if (hydrated && invalid) router.replace("/draft");
  }, [hydrated, invalid, router]);

  // default the armband to the analysis suggestion once the XI is complete
  const xiForEffect = useGame((s) => s.picks);
  useEffect(() => {
    if (invalid || captainId) return;
    const xi = getXI();
    const analysis = getAnalysis();
    const cap = xi.find((p) => p?.name === analysis?.captain);
    if (cap) setCaptain(cap.id);
  }, [invalid, captainId, getXI, getAnalysis, setCaptain, xiForEffect]);

  const xi = useMemo(() => (invalid ? [] : getXI()), [invalid, getXI, xiForEffect]); // eslint-disable-line react-hooks/exhaustive-deps
  const analysis = invalid ? null : getAnalysis();

  if (!hydrated || invalid || !analysis) return null;

  const pool = (setup!.pool ?? "clubs") as keyof typeof COMP;
  const c = COMP[pool] ?? COMP.clubs;
  const tactic = tacticById(setup!.tactic);
  const captainSlot = captainId ? xi.findIndex((p) => p?.id === captainId) : -1;
  const captainPlayer = captainSlot >= 0 ? xi[captainSlot] : null;

  // ---- lineup validity: every slot filled, every player in a legal role ----
  const emptyCount = formation!.slots.length - xi.filter(Boolean).length;
  const misplaced = xi
    .map((p, i) => ({ p, i }))
    .filter((x) => x.p && suitability(x.p!.position, x.p!.altPositions, formation!.slots[x.i].pos).level === "blocked");
  const lineupValid = emptyCount === 0 && misplaced.length === 0;
  const placedForRemap = xi.filter(Boolean) as Player[];

  /* ---- key players by role ---- */
  const filled = xi
    .map((p, i) => ({ p, slot: formation!.slots[i], i }))
    .filter((x): x is { p: Player; slot: (typeof formation.slots)[number]; i: number } => !!x.p);
  const byBest = (score: (x: (typeof filled)[number]) => number, exclude: Set<string> = new Set()) =>
    [...filled].filter((x) => !exclude.has(x.p.id)).sort((a, b) => score(b) - score(a))[0]?.p;
  const star = byBest((x) => x.p.overall);
  const usedIds = new Set(star ? [star.id] : []);
  const playmaker = byBest((x) => (POSITION_GROUP[x.slot.pos] !== "DEF" && x.slot.pos !== "GK" ? x.p.attributes.passing : 0), usedIds);
  if (playmaker) usedIds.add(playmaker.id);
  const defLeader = byBest((x) => (POSITION_GROUP[x.slot.pos] === "DEF" || x.slot.pos === "GK" ? x.p.attributes.defending + x.p.overall : 0));
  const goalThreat = byBest((x) => (POSITION_GROUP[x.slot.pos] === "ATT" ? x.p.attributes.shooting + x.p.overall * 0.4 : 0), usedIds);
  const roles = [
    { role: "Star Player", icon: "⭐", p: star },
    { role: "Playmaker", icon: "🎨", p: playmaker },
    { role: "Defensive Leader", icon: "🧱", p: defLeader },
    { role: "Goal Threat", icon: "⚽", p: goalThreat },
    { role: "Captain", icon: "©️", p: captainPlayer ?? undefined },
  ].filter((r) => r.p);

  const startTournament = () => {
    if (!lineupValid) {
      setNotice(emptyCount > 0
        ? `${emptyCount} position${emptyCount > 1 ? "s are" : " is"} still empty — fill every slot before kick-off.`
        : "Some players are out of position — reposition them before continuing.");
      play("error");
      return;
    }
    if (!setup!.tactic) {
      setShowTactics(true);
      setNotice("Choose a tactical style before kick-off.");
      play("error");
      return;
    }
    finish(teamName || `${profileName}'s XI`);
    play("select");
    router.push(pool === "clubs" ? "/tournament" : "/international");
  };

  const onSlotTap = (i: number) => {
    if (mode === "captain") {
      if (xi[i]) { setCaptain(xi[i]!.id); play("select"); setMode("view"); setNotice(`${xi[i]!.name.split(" ").pop()} wears the armband.`); }
      return;
    }
    if (mode === "compare") {
      if (!xi[i]) return;
      const next = compareSel.includes(i) ? compareSel.filter((x) => x !== i) : [...compareSel, i].slice(-2);
      setCompareSel(next);
      play("click");
      return;
    }
    if (mode === "edit") {
      if (swapSel === null) { if (xi[i]) { setSwapSel(i); setNotice("Now tap where he should go — only valid slots light up."); play("click"); } return; }
      if (swapSel === i) { setSwapSel(null); setNotice("Tap a player to move."); return; }
      const moved = xi[swapSel];
      const ok = swapSlots(swapSel, i);
      if (!ok) {
        const other = xi[i];
        setNotice(`Can’t swap — ${moved?.name.split(" ").pop() ?? "he"} can’t play ${formation!.slots[i].pos}${other ? ` or ${other.name.split(" ").pop()} can’t play ${formation!.slots[swapSel].pos}` : ""}.`);
        play("error");
        return;
      }
      const s = moved ? suitability(moved.position, moved.altPositions, formation!.slots[i].pos) : null;
      setNotice(s && s.level !== "natural" ? `Heads up: ${moved!.name.split(" ").pop()} is ${s.label.toLowerCase()} at ${formation!.slots[i].pos}.` : "Moved.");
      play("select");
      setSwapSel(null);
    }
  };

  const shareOpts = (format: ShareFormat) =>
    shareXI({
      compLabel: c.label,
      teamName: teamName || `${profileName}'s XI`,
      formation: formation!,
      players: xi,
      captainId,
      overall: analysis.overall,
      tacticName: tactic?.name,
      accent: c.accent,
      accent2: c.accent2,
      bg: c.bg,
      variant: pool === "clubs" ? "cl" : pool,
    }, format);

  const cmp = compareSel.map((i) => ({ p: xi[i]!, slot: formation!.slots[i] })).filter((x) => x.p);

  return (
    <>
      {c.scene === "euro" && <EuroScene />}
      {c.scene === "copa" && <CopaScene />}
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-24 sm:pt-28">

        {/* ===================== A. HEADER ===================== */}
        <div className={`shine relative overflow-hidden rounded-3xl p-5 ${c.panel}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="cl-heading text-[0.58rem] tracking-[0.4em]" style={{ color: c.accent }}>
                {campaignActive ? "Season in Progress" : "Draft Complete"} · {c.label}
              </div>
              <h1 className={`mt-1 font-display text-3xl font-extrabold sm:text-4xl ${c.heading}`}>
                {teamName || `${profileName}'s XI`}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="chip bg-white/8 text-white/80">{setup!.formationName}</span>
                <button
                  className="chip transition-colors"
                  style={tactic ? { background: c.soft, color: c.accent } : { background: "rgba(255,90,106,0.15)", color: "#ff5a6a" }}
                  onClick={() => { if (!campaignActive) { setShowTactics(true); play("click"); } }}
                >
                  {tactic ? `${tactic.icon} ${tactic.name}` : "⚠️ Choose a tactic"}
                </button>
                {captainPlayer && <span className="chip bg-gold/15 text-gold">© {captainPlayer.name.split(" ").pop()}</span>}
              </div>
            </div>
            {!campaignActive && (
              <button
                className={`btn text-xs ${mode === "edit" ? "btn-gold" : "btn-ghost"}`}
                onClick={() => { setMode(mode === "edit" ? "view" : "edit"); setSwapSel(null); setNotice(mode === "edit" ? "" : "Tap two players to swap their positions."); play("click"); }}
              >
                {mode === "edit" ? "✓ Done Editing" : "✏️ Edit Squad"}
              </button>
            )}
          </div>
        </div>

        {/* ===================== B. TEAM SNAPSHOT ===================== */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,560px)_1fr]">
          <div>
            <div className={`glass rounded-2xl p-2.5 sm:p-3 ${mode !== "view" ? "ring-2" : ""}`}
              style={mode !== "view" ? { boxShadow: `0 0 26px ${c.soft}` } : undefined}>
              {mode !== "view" && (
                <div className="mb-2 rounded-lg px-3 py-1.5 text-center text-[0.66rem] font-bold"
                  style={{ background: c.soft, color: c.accent }}>
                  {mode === "edit" ? (swapSel === null ? "Tap a player to move" : "Now tap where he goes")
                    : mode === "captain" ? "Tap the player who wears the armband"
                    : `Tap two players to compare (${compareSel.length}/2)`}
                </div>
              )}
              <Pitch
                formation={formation!}
                players={xi}
                variant={pool === "clubs" ? "cl" : pool}
                captainSlot={captainSlot >= 0 ? captainSlot : undefined}
                interaction={
                  mode === "view"
                    ? null
                    : {
                        kind: "edit",
                        selectedSlots: mode === "edit" ? (swapSel !== null ? [swapSel] : []) : mode === "compare" ? compareSel : [],
                        moving: mode === "edit" && swapSel !== null && xi[swapSel]
                          ? { position: xi[swapSel]!.position, altPositions: xi[swapSel]!.altPositions }
                          : null,
                        onSlot: onSlotTap,
                      }
                }
              />
              <p className="mt-2 min-h-[1rem] text-center text-[0.66rem] text-muted">{notice}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* the number + why */}
            <div className={`relative overflow-hidden rounded-2xl p-5 ${c.panel}`}>
              <div className="flex flex-wrap items-center gap-6">
                <div className="text-center">
                  <div className="font-display text-6xl font-extrabold leading-none text-gradient-gold">{analysis.overall}</div>
                  <div className="mt-1 text-[0.58rem] font-bold uppercase tracking-[0.3em] text-white/55">Team Overall</div>
                </div>
                <div className="min-w-[200px] flex-1 space-y-2.5">
                  <Bar label="Player Quality" value={analysis.breakdown.playerQuality} accent={c.accent} />
                  <Bar label="Position Suitability" value={analysis.breakdown.positionSuitability} accent="#2ee6a6" />
                  <Bar label="Tactical Fit" value={analysis.breakdown.tacticFit} accent={c.accent2} />
                  <Bar label="Experience & Leadership" value={analysis.breakdown.experience} accent="#f2d472" />
                </div>
              </div>
              <p className="mt-3 text-[0.62rem] text-white/40">
                90% player quality (position-adjusted) · 6% suitability · 4% experience — Tactical Fit is scored separately and never inflates Overall
              </p>
            </div>

            {/* unit ratings */}
            <div className="grid grid-cols-4 gap-3">
              {[
                ["Attack", analysis.attack], ["Midfield", analysis.midfield],
                ["Defense", analysis.defense], ["Goalkeeper", analysis.goalkeeper],
              ].map(([label, v]) => (
                <div key={label as string} className="glass rounded-xl py-3 text-center">
                  <div className="font-display text-2xl font-extrabold text-white">{v}</div>
                  <div className="text-[0.55rem] font-bold uppercase tracking-widest text-muted">{label}</div>
                </div>
              ))}
            </div>

            {/* C. squad evaluation */}
            <div className="glass rounded-2xl p-5">
              <div className="cl-heading mb-3 text-[0.58rem] tracking-[0.3em]" style={{ color: c.accent }}>Squad Evaluation</div>
              <div className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                <Bar label="Position Suitability" value={analysis.positionFit} accent="#2ee6a6" />
                <Bar label="Formation Balance" value={analysis.balance} accent={c.accent} />
                <Bar label="Possession Play" value={analysis.possession} accent={c.accent} />
                <Bar label="Counter Attack" value={analysis.counter} accent={c.accent2} />
                <Bar label="Set Pieces" value={analysis.setPieces} accent={c.accent2} />
                <Bar label="Leadership" value={analysis.leadership} accent="#f2d472" />
              </div>
            </div>

            {/* D. strengths & weaknesses */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="glass rounded-2xl p-4">
                <div className="mb-2 text-[0.58rem] font-bold uppercase tracking-[0.25em] text-green">Strengths</div>
                <ul className="space-y-1.5 text-[0.76rem] text-white/80">
                  {analysis.strengths.slice(0, 4).map((s) => <li key={s}>▲ {s}</li>)}
                </ul>
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="mb-2 text-[0.58rem] font-bold uppercase tracking-[0.25em] text-danger">Weaknesses</div>
                <ul className="space-y-1.5 text-[0.76rem] text-white/70">
                  {analysis.weaknesses.slice(0, 4).map((s) => <li key={s}>▼ {s}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== E. KEY PLAYERS ===================== */}
        <div className="mt-8">
          <div className="cl-heading text-[0.58rem] tracking-[0.3em]" style={{ color: c.accent }}>Key Players</div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {roles.map(({ role, icon, p }) => (
              <motion.div
                key={role}
                whileHover={{ y: -4 }}
                className="shine overflow-hidden rounded-2xl"
                style={{ background: `linear-gradient(165deg, ${p!.colors[0]}cc, #0a1024 75%)`, border: `1px solid ${c.accent}33` }}
              >
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <span className="text-lg" aria-hidden>{icon}</span>
                    <span className="font-display text-xl font-extrabold text-gradient-gold">{p!.overall}</span>
                  </div>
                  <div className="mt-3 truncate font-display text-[0.82rem] font-extrabold text-white">{p!.name}</div>
                  <div className="truncate text-[0.58rem] text-white/60">{p!.club} {p!.seasonLabel}</div>
                  <div className="mt-1.5 text-[0.55rem] font-bold uppercase tracking-[0.2em]" style={{ color: c.accent }}>{role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ===================== F. ACTIONS ===================== */}
        {campaignActive ? (
          <div className="glass-strong mt-8 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-sm text-sm text-muted">
                This XI is locked into your current campaign — review it, but the story continues on the pitch.
              </p>
              <button className="btn btn-gold" onClick={() => { play("select"); router.push(intl ? "/international" : "/tournament"); }}>
                ← Back to Tournament
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-strong mt-8 rounded-2xl p-5">
            <div className="flex flex-wrap items-center gap-2">
              <button className={`btn text-[0.68rem] ${mode === "captain" ? "btn-gold" : "btn-ghost"}`}
                onClick={() => { setMode(mode === "captain" ? "view" : "captain"); setNotice(mode === "captain" ? "" : "Tap the player who takes the armband."); play("click"); }}>
                © Choose Captain
              </button>
              <button className="btn btn-ghost text-[0.68rem]" onClick={() => { setShowTactics(true); play("click"); }}>
                {tactic ? `${tactic.icon} Tactics` : "🧠 Choose Tactics"}
              </button>
              <button className={`btn text-[0.68rem] ${mode === "compare" ? "btn-gold" : "btn-ghost"}`}
                onClick={() => { setMode(mode === "compare" ? "view" : "compare"); setCompareSel([]); setNotice(""); play("click"); }}>
                ⚖️ Compare Players
              </button>
              <button className="btn btn-ghost text-[0.68rem]" onClick={() => { setShowFormation(true); play("click"); }}>
                🔁 {setup!.formationName}
              </button>
              <button className="btn btn-ghost text-[0.68rem]" onClick={() => { setShowPresentation(true); play("click"); }}>
                📺 Watch Presentation
              </button>
              <button className="btn btn-ghost text-[0.68rem]" onClick={() => { setShowShare(true); play("click"); }}>
                📸 Share XI
              </button>
            </div>
            {!lineupValid && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-[0.72rem] font-semibold text-danger">
                ⚠️ {emptyCount > 0
                  ? `Some players must be repositioned before continuing — ${emptyCount} slot${emptyCount > 1 ? "s" : ""} empty.`
                  : "Some players are out of position — move them to a valid slot."}
              </div>
            )}
            <div className="mt-4 flex flex-col gap-3 border-t border-white/8 pt-4 sm:flex-row">
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder={`${profileName}'s XI`}
                maxLength={28}
                className="flex-1 rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold"
              />
              <button
                className={`btn btn-pulse ${pool === "copa" ? "btn-copa" : pool === "euro" ? "btn-euro" : "btn-gold"} ${!tactic || !lineupValid ? "opacity-70" : ""}`}
                onClick={startTournament}
              >
                {c.enter}
              </button>
            </div>
            <button
              className="mt-3 text-xs text-muted underline-offset-2 hover:underline"
              onClick={() => { play("click"); router.push("/draft"); useGame.getState().resetDraft(); }}
            >
              Start a new draft instead
            </button>
          </div>
        )}

        {/* ===================== FORMATION MODAL ===================== */}
        {showFormation && !campaignActive && (
          <FormationPicker
            current={setup!.formationName}
            accent={c.accent}
            isAllowed={(f) => f.name === setup!.formationName || formationCanHold(placedForRemap, f)}
            onPick={(name) => {
              changeFormation(name);
              setShowFormation(false);
              setMode("view"); setSwapSel(null);
              setNotice(`Switched to ${name}. Every player kept a valid position.`);
              play("select");
            }}
            onClose={() => setShowFormation(false)}
            title="Change Formation"
          />
        )}

        {/* ===================== TACTICS MODAL ===================== */}
        <AnimatePresence>
          {showTactics && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-16"
              onClick={() => setShowTactics(false)}
            >
              <motion.div
                initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }}
                className="glass-strong w-full max-w-3xl rounded-3xl p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="cl-heading text-[0.6rem] tracking-[0.4em]" style={{ color: c.accent }}>Team Talk</div>
                <h2 className="mt-1 font-display text-2xl font-extrabold text-white">Choose your tactical style</h2>
                <p className="mt-1 text-xs text-muted">The style shapes how your team plays and who it counters — <span className="text-white/70">Tactical Fit</span> shows how well this XI pulls it off. It never changes your Squad OVR.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {TACTICS.map((t) => {
                    const fit = tacticFit(t.id, formation!, xi);
                    const band = tacticFitBand(fit);
                    const reasons = tacticFitReasons(t.id, formation!, xi);
                    const mu = tacticMatchupSummary(t.id);
                    const active = setup!.tactic === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => { setTactic(t.id as TacticId); play("select"); setShowTactics(false); setNotice(`${t.name} it is.`); }}
                        className="rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5"
                        style={{
                          borderColor: active ? c.accent : "rgba(255,255,255,0.12)",
                          background: active ? c.soft : "rgba(255,255,255,0.04)",
                          boxShadow: active ? `0 0 22px ${c.soft}` : undefined,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-base font-extrabold text-white">{t.icon} {t.name}</span>
                          <span className="text-right leading-none">
                            <span className="font-display text-lg font-extrabold" style={{ color: band.color }}>{fit}</span>
                            <span className="block text-[0.5rem] font-bold uppercase tracking-wider" style={{ color: band.color }}>{band.band} fit</span>
                          </span>
                        </div>
                        {/* tiny shape diagram */}
                        <div className="mt-2 flex flex-col gap-0.5">
                          {[...t.shape].reverse().map((w, i) => (
                            <span key={i} className="h-1 rounded-full"
                              style={{ width: `${34 + w * 26}%`, background: `${c.accent}${w === 2 ? "cc" : w === 1 ? "77" : "33"}` }} />
                          ))}
                        </div>
                        <p className="mt-2 text-[0.66rem] leading-relaxed text-white/65">{t.description}</p>
                        {/* dynamic — read off THIS XI's attributes, not static copy */}
                        <div className="mt-1.5 space-y-0.5">
                          {reasons.length
                            ? reasons.map((r, i) => (
                                <p key={i} className="text-[0.6rem]" style={{ color: r.startsWith("＋") ? "#7ee081" : "#f5a15a" }}>{r}</p>
                              ))
                            : <><p className="text-[0.6rem] text-green/90">▲ {t.strengths[0]}</p><p className="text-[0.6rem] text-danger/90">▼ {t.weaknesses[0]}</p></>}
                        </div>
                        {/* style matchup — who it beats / struggles against */}
                        {(mu.beats.length > 0 || mu.loses.length > 0) && (
                          <p className="mt-1.5 text-[0.56rem] leading-relaxed text-white/50">
                            {mu.beats.length > 0 && <>⚔ Counters <span className="text-white/75">{mu.beats.join(", ")}</span>. </>}
                            {mu.loses.length > 0 && <>Exposed to <span className="text-white/75">{mu.loses.join(", ")}</span>.</>}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 text-[0.58rem] italic leading-relaxed text-white/40">Opponents play their own styles too — the right matchup is worth a small edge each game (±5%), a little more over a knockout tie.</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===================== COMPARISON ===================== */}
        <AnimatePresence>
          {mode === "compare" && cmp.length === 2 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-16"
              onClick={() => setCompareSel([])}
            >
              <motion.div
                initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }}
                className="glass-strong w-full max-w-lg rounded-3xl p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
                  {cmp.map(({ p }, side) => (
                    <div key={p.id} style={{ order: side * 2 }}>
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl font-display text-lg font-extrabold text-white"
                        style={{ background: `linear-gradient(150deg, ${p.colors[0]}, ${p.colors[1]})` }}>
                        {p.overall}
                      </div>
                      <div className="mt-1 truncate font-display text-sm font-extrabold text-white">{p.name}</div>
                      <div className="text-[0.58rem] text-white/55">{p.club} {p.seasonLabel} · {p.position}</div>
                    </div>
                  ))}
                  <div className="font-display text-xl font-extrabold text-white/50" style={{ order: 1 }}>VS</div>
                </div>
                <div className="mt-4 space-y-1.5">
                  {([
                    ["Overall", (p: Player) => p.overall],
                    ["In this slot", (p: Player, i: number) => Math.round(p.overall * suitability(p.position, p.altPositions, cmp[i].slot.pos).mult)],
                    ["Pace", (p: Player) => p.attributes.pace],
                    ["Shooting", (p: Player) => p.attributes.shooting],
                    ["Passing", (p: Player) => p.attributes.passing],
                    ["Dribbling", (p: Player) => p.attributes.dribbling],
                    ["Defending", (p: Player) => p.attributes.defending],
                    ["Physical", (p: Player) => p.attributes.physical],
                    ["Goals", (p: Player) => p.goals],
                    ["Assists", (p: Player) => p.assists],
                  ] as [string, (p: Player, i: number) => number][]).map(([label, fn]) => {
                    const a = fn(cmp[0].p, 0);
                    const b = fn(cmp[1].p, 1);
                    return (
                      <div key={label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg bg-white/4 px-3 py-1.5 text-sm">
                        <span className={`text-left font-display font-extrabold ${a > b ? "text-green" : a < b ? "text-white/45" : "text-white/75"}`}>{a}</span>
                        <span className="text-[0.58rem] font-bold uppercase tracking-widest text-white/45">{label}</span>
                        <span className={`text-right font-display font-extrabold ${b > a ? "text-green" : b < a ? "text-white/45" : "text-white/75"}`}>{b}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex justify-center">
                  <button className="btn btn-ghost text-xs" onClick={() => { setCompareSel([]); setMode("view"); }}>Close Comparison</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===================== SHARE XI ===================== */}
        <AnimatePresence>
          {showShare && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 p-4"
              onClick={() => setShowShare(false)}
            >
              <motion.div
                initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }}
                className="glass-strong w-full max-w-sm rounded-3xl p-6 text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="cl-heading text-[0.6rem] tracking-[0.4em]" style={{ color: c.accent }}>Share XI</div>
                <h2 className="mt-1 font-display text-xl font-extrabold text-white">Pick a format</h2>
                <div className="mt-4 grid gap-2.5">
                  {([
                    ["portrait", "📱 Instagram Portrait", "1080 × 1350"],
                    ["square", "🟦 Square", "1080 × 1080"],
                    ["landscape", "🐦 X / Twitter", "1200 × 675"],
                  ] as [ShareFormat, string, string][]).map(([f, label, size]) => (
                    <button key={f}
                      className="flex items-center justify-between rounded-xl border border-white/12 bg-white/4 px-4 py-3 text-left text-sm font-bold text-white transition-all hover:border-white/30"
                      onClick={async () => { play("select"); await shareOpts(f); setShowShare(false); }}>
                      {label}
                      <span className="text-[0.6rem] font-semibold text-white/45">{size}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[0.6rem] text-white/40">Shares via your device&apos;s share sheet, or downloads as a PNG.</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===================== PRESENTATION ===================== */}
        <AnimatePresence>
          {showPresentation && (
            <LineupPresentation
              compLabel={c.compLine}
              teamName={teamName || `${profileName}'s XI`}
              formation={formation!}
              players={xi}
              captainId={captainId}
              tacticName={tactic?.name}
              overall={analysis.overall}
              accent={c.accent}
              variant={pool === "clubs" ? "cl" : pool}
              onDone={() => setShowPresentation(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
