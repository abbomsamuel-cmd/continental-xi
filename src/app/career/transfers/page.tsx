"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { useHydrated } from "@/lib/useHydrated";
import { play } from "@/lib/sound";
import { useC } from "@/lib/career/copy";
import { ALL_CLUBS, clubById, leagueById } from "@/lib/career/data";
import { useCurrentPlayer } from "@/lib/career/store";
import { fmtWage } from "@/lib/career/util";
import type { CareerPlayer, ClubRef } from "@/lib/career/types";
import { CountryFlag } from "@/components/career/CountryFlag";
import { ClubCrest } from "@/components/career/ClubCrest";

interface Offer {
  club: ClubRef;
  leagueName: string;
  wage: number;
  years: number;
  playingTime: string;
  role: string;
  competition: string;
  development: number; // 1-5
}

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

function competitionOf(tier: number, c: (en: string, es: string) => string) {
  return tier >= 4 ? c("Champions League", "Champions League") : tier === 3 ? c("European Football", "Fútbol Europeo") : c("Domestic League", "Liga Nacional");
}

function buildOffers(player: CareerPlayer, c: (en: string, es: string) => string): Offer[] {
  const cur = clubById(player.currentClubId);
  const curTier = cur?.tier ?? 2;
  const seed = hash(player.id);
  const pool = ALL_CLUBS.filter((cl) => cl.id !== player.currentClubId && cl.tier >= Math.max(1, curTier - 1) && cl.tier <= Math.min(5, curTier + 1));
  const ordered = [...pool].sort((a, b) => (hash(a.id + player.id) % 1000) - (hash(b.id + player.id) % 1000));
  const n = 2 + (seed % 2);
  return ordered.slice(0, n).map((club) => {
    const up = club.tier - curTier;
    const role = up > 0 ? c("Rotation", "Rotación") : up < 0 ? c("Important Player", "Jugador Importante") : c("Starter", "Titular");
    const playingTime = up > 0 ? c("Squad Player", "Suplente de rotación") : up < 0 ? c("High", "Alta") : c("Regular", "Regular");
    const wage = Math.round((player.wage * (1.25 + up * 0.45 + (hash(club.id) % 5) * 0.05)) / 500) * 500;
    const years = 3 + (hash(club.id + "y") % 3); // 3-5
    const development = Math.max(2, Math.min(5, 5 - up + (hash(club.id + "d") % 2)));
    return { club, leagueName: leagueById(club.leagueId)?.name ?? "", wage, years, playingTime, role, competition: competitionOf(club.tier, c), development };
  });
}

export default function TransfersPage() {
  const hydrated = useHydrated();
  const player = useCurrentPlayer();
  const c = useC();
  const offers = useMemo(() => (player ? buildOffers(player, c) : []), [player, c]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [agreed, setAgreed] = useState<ClubRef | null>(null);
  const [compare, setCompare] = useState<Offer | null>(null);

  if (!hydrated) return <div className="min-h-screen" />;
  if (!player) {
    return (
      <div className="mx-auto max-w-md px-4 pt-32 text-center">
        <p className="text-white/55">{c("No active career.", "No hay carrera activa.")}</p>
        <Link href="/career/new" className="btn btn-gold mt-4">⚽ {c("Create Your Player", "Crea Tu Jugador")}</Link>
      </div>
    );
  }

  const live = offers.filter((o) => !dismissed.has(o.club.id));

  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 sm:px-6 sm:pt-28">
      <h1 className="font-display text-2xl font-black text-white sm:text-3xl">{c("Transfer Window", "Mercado de Fichajes")}</h1>
      <p className="mt-1 text-sm text-white/50">{c("Clubs monitoring you this window. Your current club is always an option.", "Clubes que te siguen este mercado. Tu club actual siempre es una opción.")}</p>

      <div className="mt-3 rounded-xl border border-gold/20 bg-gold/8 px-3 py-2 text-[0.72rem] text-gold/90">
        {c("Preview — accepting, negotiating and moving clubs activate with the season engine.", "Vista previa — aceptar, negociar y cambiar de club se activan con el motor de temporada.")}
      </div>

      {agreed && (
        <div className="mt-4 rounded-2xl border border-green/30 bg-green/10 p-4">
          <div className="font-display text-base font-extrabold text-white">{c("Agreement reached", "Acuerdo alcanzado")}</div>
          <p className="mt-1 text-sm text-white/70">{c("You've agreed to join", "Has acordado fichar por")} <span className="font-bold text-white">{agreed.name}</span>. {c("The move finalises once the season engine ships.", "El traspaso se cierra cuando llegue el motor de temporada.")}</p>
          <button onClick={() => { setAgreed(null); setDismissed(new Set()); play("click"); }} className="btn btn-ghost mt-3 text-sm">{c("Review offers again", "Revisar ofertas de nuevo")}</button>
        </div>
      )}

      {!agreed && (
        <div className="mt-5 space-y-3">
          {/* current club — always present */}
          <StayCard player={player} c={c} onStay={() => { play("select"); setAgreed(clubById(player.currentClubId) ?? null); }} />
          {live.map((o) => (
            <OfferCard key={o.club.id} offer={o} c={c}
              onAccept={() => { play("select"); setAgreed(o.club); }}
              onCompare={() => { play("click"); setCompare(o); }}
              onReject={() => { play("click"); setDismissed((s) => new Set(s).add(o.club.id)); }}
            />
          ))}
          {live.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/12 p-6 text-center text-sm text-white/45">
              {c("No more offers on the table. You can always stay and fight for your place.", "No quedan más ofertas. Siempre puedes quedarte y pelear tu puesto.")}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {compare && <CompareModal player={player} offer={compare} c={c} onClose={() => setCompare(null)} />}
      </AnimatePresence>
    </div>
  );
}

function OfferCard({ offer: o, c, onAccept, onCompare, onReject }: {
  offer: Offer; c: (en: string, es: string) => string;
  onAccept: () => void; onCompare: () => void; onReject: () => void;
}) {
  const rows: [string, string][] = [
    [c("Playing Time", "Minutos"), o.playingTime],
    [c("Role", "Rol"), o.role],
    [c("Salary", "Salario"), fmtWage(o.wage)],
    [c("Contract", "Contrato"), `${o.years} ${c("yrs", "años")}`],
    [c("Competition", "Competición"), o.competition],
    [c("Development", "Desarrollo"), "★".repeat(o.development) + "·".repeat(5 - o.development)],
  ];
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1122]">
      <span aria-hidden className="block h-0.5" style={{ background: `linear-gradient(90deg, ${o.club.colors[0]}, ${o.club.colors[1]})` }} />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <ClubCrest short={o.club.short} colors={o.club.colors} size={44} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-lg font-extrabold text-white">{o.club.name}</div>
            <div className="flex items-center gap-1.5 text-[0.7rem] text-white/45">
              <CountryFlag country={o.club.country} size={13} /> {o.leagueName}
            </div>
          </div>
          <div className="text-right text-[0.62rem] text-gold">{"★".repeat(o.club.tier)}</div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          {rows.map(([k, v]) => (
            <div key={k}>
              <div className="text-[0.5rem] font-bold uppercase tracking-widest text-white/35">{k}</div>
              <div className="text-[0.82rem] font-semibold text-white/85">{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={onAccept} className="btn btn-gold flex-1 text-sm">{c("Accept", "Aceptar")}</button>
          <button onClick={onCompare} className="btn btn-secondary text-sm">{c("Compare", "Comparar")}</button>
          <button onClick={onReject} className="btn btn-ghost text-sm">{c("Reject", "Rechazar")}</button>
        </div>
      </div>
    </motion.div>
  );
}

function StayCard({ player, c, onStay }: { player: CareerPlayer; c: (en: string, es: string) => string; onStay: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-[#0d1430] p-4">
      <ClubCrest short={player.currentClubShort} colors={player.currentClubColors} size={40} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-base font-extrabold text-white">{player.currentClubName}</div>
        <div className="text-[0.7rem] text-white/45">{c("Your current club", "Tu club actual")} · {fmtWage(player.wage)}</div>
      </div>
      <button onClick={onStay} className="btn btn-ghost text-sm">{c("Stay", "Quedarme")}</button>
    </div>
  );
}

function CompareModal({ player, offer, c, onClose }: { player: CareerPlayer; offer: Offer; c: (en: string, es: string) => string; onClose: () => void }) {
  const { lang } = useLang();
  void lang;
  const cur = clubById(player.currentClubId);
  const curTier = cur?.tier ?? 2;
  const rows: [string, string, string][] = [
    [c("Reputation", "Reputación"), "★".repeat(curTier), "★".repeat(offer.club.tier)],
    [c("Salary", "Salario"), fmtWage(player.wage), fmtWage(offer.wage)],
    [c("Playing Time", "Minutos"), c("Current", "Actual"), offer.playingTime],
    [c("Competition", "Competición"), competitionOf(curTier, c), offer.competition],
    [c("Development", "Desarrollo"), "★".repeat(Math.max(2, 5 - curTier + 1)), "★".repeat(offer.development)],
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl border border-white/12 bg-[#0b1122] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold text-white">{c("Compare", "Comparar")}</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
        </div>
        <div className="grid grid-cols-3 items-center gap-2 border-b border-white/10 pb-2">
          <div className="text-[0.6rem] font-bold uppercase tracking-widest text-white/35">{c("Current", "Actual")}</div>
          <div />
          <div className="text-right text-[0.6rem] font-bold uppercase tracking-widest text-gold/70">{offer.club.short}</div>
        </div>
        {rows.map(([k, a, b]) => (
          <div key={k} className="grid grid-cols-3 items-center gap-2 py-2 text-sm">
            <div className="font-semibold text-white/80">{a}</div>
            <div className="text-center text-[0.56rem] font-bold uppercase tracking-widest text-white/35">{k}</div>
            <div className="text-right font-semibold text-white/80">{b}</div>
          </div>
        ))}
        <button onClick={onClose} className="btn btn-secondary mt-4 w-full text-sm">{c("Close", "Cerrar")}</button>
      </motion.div>
    </motion.div>
  );
}
