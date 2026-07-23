"use client";

import { useCallback } from "react";
import { useLang, type Lang } from "@/lib/i18n";
import type { PotentialTier, ReputationTier, RoleTier } from "./types";

/**
 * Career Mode keeps its (large, growing) copy local instead of bloating the
 * global dictionary. `useC()` returns a picker bound to the current language:
 *   const c = useC();  c("Start Career", "Empezar Carrera")
 */
export function useC() {
  const { lang } = useLang();
  return useCallback((en: string, es: string) => (lang === "es" ? es : en), [lang]);
}

type Bi = { en: string; es: string };
const pick = (b: Bi, lang: Lang) => (lang === "es" ? b.es : b.en);

const ROLE: Record<RoleTier, Bi> = {
  notSelected: { en: "Not Selected", es: "No Convocado" },
  reserve: { en: "Reserve", es: "Reserva" },
  rotation: { en: "Rotation", es: "Rotación" },
  starter: { en: "Starter", es: "Titular" },
  important: { en: "Important Player", es: "Jugador Importante" },
  star: { en: "Star Player", es: "Estrella" },
  captain: { en: "Captain", es: "Capitán" },
};

const REPUTATION: Record<ReputationTier, Bi> = {
  unknown: { en: "Unknown", es: "Desconocido" },
  prospect: { en: "Prospect", es: "Promesa" },
  wonderkid: { en: "Wonderkid", es: "Joven Maravilla" },
  promising: { en: "Promising", es: "Prometedor" },
  established: { en: "Established", es: "Consolidado" },
  star: { en: "Star", es: "Estrella" },
  superstar: { en: "Superstar", es: "Superestrella" },
  worldClass: { en: "World Class", es: "Clase Mundial" },
  legend: { en: "Legend", es: "Leyenda" },
};

const POTENTIAL: Record<PotentialTier, Bi> = {
  raw: { en: "Raw Talent", es: "Talento en Bruto" },
  promising: { en: "Promising Talent", es: "Talento Prometedor" },
  elite: { en: "Elite Prospect", es: "Promesa de Élite" },
  wonderkid: { en: "Wonderkid", es: "Joven Maravilla" },
  unknown: { en: "Unknown Potential", es: "Potencial Desconocido" },
};

export const roleLabel = (r: RoleTier, lang: Lang) => pick(ROLE[r], lang);
export const reputationLabel = (r: ReputationTier, lang: Lang) => pick(REPUTATION[r], lang);
export const potentialLabel = (p: PotentialTier, lang: Lang) => pick(POTENTIAL[p], lang);

/** Accent colour for a potential tier — a subtle hint, never a number. */
export const potentialAccent: Record<PotentialTier, string> = {
  raw: "#8aa0c6",
  promising: "#7ee081",
  elite: "#22e0ff",
  wonderkid: "#f2d472",
  unknown: "#8aa0c6",
};
