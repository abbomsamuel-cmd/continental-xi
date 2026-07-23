"use client";

import Link from "next/link";
import { useC } from "@/lib/career/copy";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function CareerSettingsPage() {
  const c = useC();
  return (
    <div className="mx-auto max-w-2xl px-4 pt-24 sm:px-6 sm:pt-28">
      <h1 className="font-display text-2xl font-black text-white sm:text-3xl">{c("Settings", "Ajustes")}</h1>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0b1122] p-4">
          <div>
            <div className="font-display text-sm font-extrabold text-white">{c("Language", "Idioma")}</div>
            <div className="text-[0.72rem] text-white/45">{c("Applies across the whole game.", "Se aplica a todo el juego.")}</div>
          </div>
          <LanguageToggle />
        </div>

        <Link href="/career/saves" className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0b1122] p-4 hover:border-white/20">
          <div>
            <div className="font-display text-sm font-extrabold text-white">{c("Manage Careers", "Gestionar Carreras")}</div>
            <div className="text-[0.72rem] text-white/45">{c("Load, rename or delete your save slots.", "Carga, renombra o borra tus partidas.")}</div>
          </div>
          <span className="text-white/40">→</span>
        </Link>

        <Link href="/stats?tab=settings" className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0b1122] p-4 hover:border-white/20">
          <div>
            <div className="font-display text-sm font-extrabold text-white">{c("App Settings", "Ajustes de la App")}</div>
            <div className="text-[0.72rem] text-white/45">{c("Sound, motion and performance options.", "Sonido, movimiento y rendimiento.")}</div>
          </div>
          <span className="text-white/40">→</span>
        </Link>
      </div>

      <p className="mt-6 text-[0.7rem] text-white/30">
        {c("Autosave, cloud sync and career export arrive with the season engine.",
          "El autoguardado, la sincronización y la exportación llegan con el motor de temporada.")}
      </p>
    </div>
  );
}
