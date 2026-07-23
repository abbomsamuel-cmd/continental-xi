import type { CareerPlayer, CareerPositionId, TrainingFocus } from "./types";

/**
 * Career Moments — the decisions that make a season feel lived. Data-driven and
 * kept out of the UI: each moment declares when it can trigger and what each
 * choice does. The season engine picks eligible ones; the modal just renders.
 */

export interface MomentEffects {
  trust?: number;          // manager-trust points
  repShift?: number;       // steps along the reputation ladder
  marketPct?: number;      // market-value change, %
  trait?: string;          // permanent career trait unlocked
  training?: TrainingFocus;
  injuredMonths?: number;  // games missed → fewer appearances
  reinjuryRisk?: boolean;
  nationalCallup?: boolean;
  positionChange?: boolean;
  transferPush?: number;   // -1 commit to club · +1 chase a move (shapes offers)
}

export interface MomentChoice {
  id: string;
  en: string; es: string;
  effects: MomentEffects;
  outEn?: string; outEs?: string; // one-line consequence
}

export interface CareerMoment {
  id: string;
  rarity: "common" | "uncommon" | "rare";
  category: "club" | "national" | "media" | "training" | "medical" | "transfer";
  icon: string;
  titleEn: string; titleEs: string;
  descEn: string; descEs: string;
  newPosition?: CareerPositionId;
  choices: MomentChoice[];
  eligible: (p: CareerPlayer) => boolean;
}

const contractExpiring = (p: CareerPlayer) => p.contractUntil - p.currentYear <= 1;

export const MOMENTS: CareerMoment[] = [
  {
    id: "training", rarity: "common", category: "training", icon: "◷",
    titleEn: "Pre-season Focus", titleEs: "Enfoque de Pretemporada",
    descEn: "Your coach asks what you want to sharpen this year.",
    descEs: "Tu entrenador te pregunta qué quieres pulir este año.",
    eligible: () => true,
    choices: [
      { id: "finishing", en: "Finishing", es: "Definición", effects: { training: "finishing" } },
      { id: "passing", en: "Passing", es: "Pase", effects: { training: "passing" } },
      { id: "pace", en: "Pace", es: "Velocidad", effects: { training: "pace" } },
      { id: "strength", en: "Strength", es: "Fuerza", effects: { training: "strength" } },
      { id: "leadership", en: "Leadership", es: "Liderazgo", effects: { training: "leadership" } },
    ],
  },
  {
    id: "press", rarity: "common", category: "media", icon: "◉",
    titleEn: "Press Conference", titleEs: "Rueda de Prensa",
    descEn: "“Can your side really challenge for the title this year?”",
    descEs: "“¿Puede tu equipo pelear de verdad por el título este año?”",
    eligible: () => true,
    choices: [
      { id: "confident", en: "Confident", es: "Confiado", effects: { repShift: 1, trust: -2 }, outEn: "The fans love the swagger; the pressure rises.", outEs: "A la afición le encanta; la presión sube." },
      { id: "balanced", en: "Balanced", es: "Equilibrado", effects: { trust: 2 }, outEn: "A measured answer keeps everyone calm.", outEs: "Una respuesta medida mantiene la calma." },
      { id: "humble", en: "Humble", es: "Humilde", effects: { trust: 1 }, outEn: "The manager appreciates the professionalism.", outEs: "Al técnico le gusta la profesionalidad." },
    ],
  },
  {
    id: "injury", rarity: "uncommon", category: "medical", icon: "✚",
    titleEn: "In the Treatment Room", titleEs: "En la Enfermería",
    descEn: "You've picked up a hamstring strain. How hard do you push the recovery?",
    descEs: "Te has lesionado el isquio. ¿Cuánto fuerzas la recuperación?",
    eligible: (p) => p.age >= 19,
    choices: [
      { id: "fast", en: "Fast Recovery", es: "Recuperación Rápida", effects: { injuredMonths: 1, reinjuryRisk: true }, outEn: "Back in weeks — but the risk lingers.", outEs: "Vuelves en semanas — pero el riesgo persiste." },
      { id: "normal", en: "Normal Recovery", es: "Recuperación Normal", effects: { injuredMonths: 2 }, outEn: "The standard road back.", outEs: "El camino habitual de vuelta." },
      { id: "safe", en: "Safe Recovery", es: "Recuperación Segura", effects: { injuredMonths: 3, trust: 1 }, outEn: "Longer out, but you come back strong.", outEs: "Más tiempo fuera, pero vuelves fuerte." },
    ],
  },
  {
    id: "contract", rarity: "uncommon", category: "club", icon: "✎",
    titleEn: "Contract Talks", titleEs: "Renovación",
    descEn: "Your club want to extend your deal on improved terms.",
    descEs: "Tu club quiere renovarte con mejores condiciones.",
    eligible: (p) => contractExpiring(p) && p.trust >= 45,
    choices: [
      { id: "accept", en: "Accept", es: "Aceptar", effects: { trust: 6, marketPct: 4 }, outEn: "Signed. The club builds around you.", outEs: "Firmado. El club construye a tu alrededor." },
      { id: "reject", en: "Hold Off", es: "Esperar", effects: { trust: -5 }, outEn: "You keep your options open — the manager isn't thrilled.", outEs: "Dejas la puerta abierta — al técnico no le gusta." },
    ],
  },
  {
    id: "captaincy", rarity: "rare", category: "club", icon: "❂",
    titleEn: "The Armband", titleEs: "El Brazalete",
    descEn: "The manager has chosen you as the next club captain.",
    descEs: "El entrenador te ha elegido como próximo capitán.",
    eligible: (p) => p.trust >= 70 && p.seasonsAtClub >= 2 && !p.traits.includes("Captain"),
    choices: [
      { id: "accept", en: "Accept the Captaincy", es: "Aceptar la Capitanía", effects: { trust: 8, repShift: 1, trait: "Captain" }, outEn: "You lead the team out. A defining moment.", outEs: "Sales como capitán. Un momento clave." },
      { id: "decline", en: "Not Yet", es: "Aún No", effects: { trust: -3 }, outEn: "Someone else takes the band.", outEs: "Otro toma el brazalete." },
    ],
  },
  {
    id: "national", rarity: "uncommon", category: "national", icon: "⚑",
    titleEn: "International Call-Up", titleEs: "Convocatoria",
    descEn: "Your country's manager has named you in the senior squad.",
    descEs: "El seleccionador te ha llamado a la absoluta.",
    eligible: (p) => !p.national.calledUp && p.overall >= 72,
    choices: [
      { id: "accept", en: "Accept the Call", es: "Aceptar", effects: { nationalCallup: true, repShift: 1, trust: 1 }, outEn: "You'll represent your nation.", outEs: "Representarás a tu país." },
      { id: "decline", en: "Focus on the Club", es: "Centrarme en el Club", effects: { repShift: -1 }, outEn: "You stay with the club — the nation waits.", outEs: "Te quedas en el club — la selección espera." },
    ],
  },
  {
    id: "transfer-interest", rarity: "uncommon", category: "transfer", icon: "⇄",
    titleEn: "Your Agent Calls", titleEs: "Llama Tu Agente",
    descEn: "Bigger clubs are asking about your situation.",
    descEs: "Clubes más grandes preguntan por tu situación.",
    eligible: (p) => p.overall >= 74 && (p.reputation === "established" || p.reputation === "star" || p.reputation === "superstar"),
    choices: [
      { id: "push", en: "Tell Him to Explore It", es: "Que lo Explore", effects: { transferPush: 1, trust: -2 }, outEn: "The rumours build — expect offers this summer.", outEs: "Crecen los rumores — habrá ofertas en verano." },
      { id: "focus", en: "I'm Happy Here", es: "Estoy Bien Aquí", effects: { transferPush: -1, trust: 4 }, outEn: "Loyalty noted. The fans respect it.", outEs: "Se nota la lealtad. La afición lo respeta." },
    ],
  },
  {
    id: "position", rarity: "uncommon", category: "club", icon: "⌖",
    titleEn: "A Tactical Rethink", titleEs: "Replanteo Táctico",
    descEn: "The manager believes a slightly deeper role suits you now.",
    descEs: "El técnico cree que un rol algo más retrasado te viene mejor ahora.",
    eligible: (p) => p.trust >= 55 && (p.position === "ST" || p.position === "CAM" || p.position === "RW" || p.position === "LW"),
    newPosition: "CAM",
    choices: [
      { id: "accept", en: "Trust the Manager", es: "Confiar en el Técnico", effects: { positionChange: true, trust: 3 }, outEn: "You adapt to a new role.", outEs: "Te adaptas a un nuevo rol." },
      { id: "decline", en: "Stay in My Position", es: "Mantener Mi Posición", effects: { trust: -2 }, outEn: "You keep your natural role.", outEs: "Mantienes tu rol natural." },
    ],
  },
];

export const momentById = (id: string) => MOMENTS.find((m) => m.id === id);

/** Eligible non-training moments, for the engine to sprinkle through the season. */
export function eligibleMoments(p: CareerPlayer): CareerMoment[] {
  return MOMENTS.filter((m) => m.id !== "training" && m.eligible(p));
}
