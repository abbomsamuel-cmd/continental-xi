"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/lib/useHydrated";
import { play } from "@/lib/sound";
import { useC } from "@/lib/career/copy";
import { useCareer } from "@/lib/career/store";
import { CountryFlag } from "@/components/career/CountryFlag";
import { ClubCrest } from "@/components/career/ClubCrest";

export default function SavesPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const c = useC();
  const saves = useCareer((s) => s.saves);
  const currentId = useCareer((s) => s.currentId);
  const setCurrent = useCareer((s) => s.setCurrent);
  const deleteCareer = useCareer((s) => s.deleteCareer);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (!hydrated) return <div className="min-h-screen" />;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-24 sm:px-6 sm:pt-28">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-black text-white sm:text-3xl">{c("Save Slots", "Partidas")}</h1>
        <Link href="/career/new" onClick={() => play("select")} className="btn btn-career text-sm">+ {c("New Career", "Nueva Carrera")}</Link>
      </div>

      {saves.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-white/12 p-10 text-center text-white/45">
          {c("No careers yet. Create your first player to begin.", "Aún no hay carreras. Crea tu primer jugador para empezar.")}
        </div>
      ) : (
        <div className="mt-5 space-y-2.5">
          {saves.map((s) => {
            const p = s.player;
            const active = s.id === currentId;
            return (
              <div key={s.id} className={`rounded-2xl border p-4 ${active ? "border-gold/40 bg-gold/[0.06]" : "border-white/10 bg-[#0b1122]"}`}>
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-lg font-black text-[#0a0f1e]"
                    style={{ background: "linear-gradient(150deg,#f2d472,#d4af37)" }}>{p.overall}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-display text-base font-extrabold text-white">{p.name}</span>
                      <CountryFlag country={p.nationality} size={13} />
                      {active && <span className="rounded-full bg-gold/20 px-1.5 py-0.5 text-[0.52rem] font-bold uppercase tracking-wider text-gold">{c("Active", "Activa")}</span>}
                    </div>
                    <div className="flex items-center gap-1.5 text-[0.7rem] text-white/45">
                      <ClubCrest short={p.currentClubShort} colors={p.currentClubColors} size={13} />
                      {p.currentClubName} · {p.position} · {c("Age", "Edad")} {p.age}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  {!active && (
                    <button onClick={() => { setCurrent(s.id); play("select"); router.push("/career"); }} className="btn btn-secondary flex-1 text-sm">{c("Load", "Cargar")}</button>
                  )}
                  {active && (
                    <button onClick={() => { play("click"); router.push("/career"); }} className="btn btn-secondary flex-1 text-sm">{c("Open", "Abrir")}</button>
                  )}
                  {confirmId === s.id ? (
                    <>
                      <button onClick={() => { deleteCareer(s.id); setConfirmId(null); play("click"); }} className="btn text-sm" style={{ background: "#c8324a", color: "#fff" }}>{c("Delete", "Borrar")}</button>
                      <button onClick={() => setConfirmId(null)} className="btn btn-ghost text-sm">{c("Cancel", "Cancelar")}</button>
                    </>
                  ) : (
                    <button onClick={() => { setConfirmId(s.id); play("click"); }} className="btn btn-ghost text-sm text-danger/80">{c("Delete", "Borrar")}</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-6 text-center text-[0.68rem] text-white/25">{c("Career saves are stored on this device, separately from your Tournament progress.", "Las partidas se guardan en este dispositivo, aparte de tu progreso de Torneo.")}</p>
    </div>
  );
}
