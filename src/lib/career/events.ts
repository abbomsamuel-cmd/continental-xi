import type { CareerPositionId } from "./types";

/* ------------------------------------------------------------------ */
/*  Career Events — the turning points a career is remembered by.      */
/*                                                                     */
/*  Every event in this catalogue CHANGES THE GAME. There is no pure   */
/*  flavour text here: an event either moves the player (overall,      */
/*  attributes, form, trust, value, reputation), moves his situation   */
/*  (appearances, position, armband, shirt, club, national team) or    */
/*  moves his risk (injury, retirement). If an idea cannot be written  */
/*  as an EventEffects, it belongs in the season feed, not in here.    */
/*                                                                     */
/*  Pure data module: deterministic, no state, no I/O. Randomness is   */
/*  always injected as `rng: () => number` so a chapter replays        */
/*  identically from the same seed.                                    */
/* ------------------------------------------------------------------ */

export type EventCategory = "positive" | "negative" | "decision" | "injury";

/**
 * What an event does. Every field is optional and additive — the engine merges
 * the definition's base effects with the chosen choice's effects (see
 * `resolveEffects`) and applies whatever survives.
 */
export interface EventEffects {
  /** Direct overall move, in rating points. */
  ovr?: number;
  /** Named attribute movements, using the same labels as the development report. */
  attrs?: { label: string; delta: number }[];
  /** Manager-trust points (0–100 scale). */
  trust?: number;
  /** Steps along the form ladder: -2 = two bands worse, +2 = two bands better. */
  formShift?: number;
  /** Market-value change, in percent. */
  marketPct?: number;
  /** Steps along the reputation ladder. */
  reputationShift?: number;
  /** Appearance change for the affected season(s), in percent. */
  appsPct?: number;
  /** Added chance of picking up an injury, 0–1 (negative = more robust). */
  injuryRisk?: number;
  /** Added chance the career ends early, 0–1 (negative = pushes retirement back). */
  retirementRisk?: number;
  /** Permanent career trait unlocked — an id; see TRAIT_LABELS for the copy. */
  trait?: string;
  /** Permanent position switch. */
  positionChange?: CareerPositionId;
  /** Takes (or loses) the club captaincy. */
  captain?: boolean;
  /** Brings the player into the senior national squad. */
  nationalCallUp?: boolean;

  /* ---- situational levers the chapter engine reads ---- */
  /** -1 commit to the club · +1 actively chase a move. Shapes the next window. */
  transferPush?: number;
  /** The player spends the next stretch on loan — games guaranteed, no fee. */
  loanMove?: boolean;
  /** Ends the international career for good. */
  intlRetire?: boolean;
  /** Hangs the boots up at the end of this chapter. */
  retire?: boolean;
  /** New shirt number. */
  shirtNumber?: number;
  /** Weekly-wage change, in percent. */
  wagePct?: number;
}

export interface EventChoice {
  id: string;
  labelEn: string;
  labelEs: string;
  /** One line telling the player what this actually costs him. */
  descEn: string;
  descEs: string;
  effects: EventEffects;
}

/**
 * A career event. `choices` absent = informational, and `effects` applies
 * directly. `choices` present = the player decides, and the chosen choice's
 * effects are merged ON TOP of `effects` (which then reads as the unavoidable
 * part: you cannot un-lose your place, you only choose what to do about it).
 */
export interface CareerEventDef {
  id: string;
  category: EventCategory;
  icon: string;
  titleEn: string;
  titleEs: string;
  bodyEn: string;
  bodyEs: string;
  /** Relative likelihood among the eligible events. */
  weight: number;
  eligible: (ctx: EventContext) => boolean;
  choices?: EventChoice[];
  effects?: EventEffects;
}

/** Everything an event needs to know about the career right now. */
export interface EventContext {
  age: number;
  overall: number;
  /** Overall movement across the chapter just played (negative = decline). */
  ovrDelta: number;
  trust: number;
  apps: number;
  goals: number;
  /** Honour labels won in the chapter, e.g. "League", "Champions League". */
  honours: string[];
  /** The current club's 0–100 world reputation. */
  clubReputation: number;
  seasonsAtClub: number;
  contractYearsLeft: number;
  hasCaptaincy: boolean;
  calledUp: boolean;
  retiredIntl: boolean;
  position: CareerPositionId;
}

/* ------------------------------------------------------------------ */
/*  Traits — stored as ids, rendered from here so every visible string  */
/*  still has both languages.                                           */
/* ------------------------------------------------------------------ */

export const TRAIT_LABELS: Record<string, { en: string; es: string }> = {
  Captain: { en: "Captain", es: "Capitán" },
  Leader: { en: "Natural Leader", es: "Líder Nato" },
  BigGame: { en: "Big-Game Player", es: "Jugador de Grandes Citas" },
  ClubLegend: { en: "Club Legend", es: "Leyenda del Club" },
  RecordBreaker: { en: "Record Breaker", es: "Rompe Récords" },
  ComebackKing: { en: "Comeback King", es: "Rey del Regreso" },
  IronWill: { en: "Iron Will", es: "Voluntad de Hierro" },
  GlassAnkles: { en: "Injury Prone", es: "Propenso a Lesiones" },
  FanFavourite: { en: "Fan Favourite", es: "Ídolo de la Afición" },
  WorldChampion: { en: "World Champion", es: "Campeón del Mundo" },
  Versatile: { en: "Versatile", es: "Polivalente" },
  Journeyman: { en: "Journeyman", es: "Trotamundos" },
  Mentor: { en: "Mentor", es: "Mentor" },
};

/** Human label for a trait id, in either language. */
export function traitLabel(id: string, es = false): string {
  const t = TRAIT_LABELS[id];
  if (!t) return id;
  return es ? t.es : t.en;
}

/* ------------------------------------------------------------------ */
/*  Eligibility helpers                                                 */
/* ------------------------------------------------------------------ */

const ATTACKERS: ReadonlySet<CareerPositionId> = new Set<CareerPositionId>(["ST", "RW", "LW", "CAM"]);
const isAttacker = (p: CareerPositionId) => ATTACKERS.has(p);
const isOutfield = (p: CareerPositionId) => p !== "GK";

/* ------------------------------------------------------------------ */
/*  The catalogue                                                       */
/* ------------------------------------------------------------------ */

export const CAREER_EVENTS: CareerEventDef[] = [
  /* ============================ POSITIVE ============================ */
  {
    id: "breakthrough-season",
    category: "positive",
    icon: "▲",
    titleEn: "The Breakthrough",
    titleEs: "La Explosión",
    bodyEn: "You went from squad filler to first name on the teamsheet in a single year.",
    bodyEs: "Pasaste de relleno de plantilla a primer nombre en la pizarra en un solo año.",
    weight: 7,
    eligible: (c) => c.age <= 23 && c.ovrDelta >= 3 && c.apps >= 20,
    effects: { trust: 8, reputationShift: 1, marketPct: 28, formShift: 1, ovr: 1 },
  },
  {
    id: "first-professional-goal",
    category: "positive",
    icon: "✦",
    titleEn: "Your First Professional Goal",
    titleEs: "Tu Primer Gol Profesional",
    bodyEn: "It went in off your shin and you will never forget it.",
    bodyEs: "Entró de espinilla y no lo olvidarás jamás.",
    weight: 8,
    eligible: (c) => c.age <= 21 && c.goals >= 1 && isOutfield(c.position),
    effects: { trust: 5, formShift: 1, marketPct: 8, attrs: [{ label: "Composure", delta: 1 }] },
  },
  {
    id: "first-international-call-up",
    category: "positive",
    icon: "⚑",
    titleEn: "Called Up",
    titleEs: "Convocado",
    bodyEn: "Your national manager has named you in the senior squad for the first time.",
    bodyEs: "El seleccionador te ha llamado a la absoluta por primera vez.",
    weight: 7,
    eligible: (c) => !c.calledUp && !c.retiredIntl && c.overall >= 70 && c.age >= 17,
    effects: { nationalCallUp: true, reputationShift: 1, marketPct: 10, trust: 2 },
  },
  {
    id: "first-captaincy",
    category: "positive",
    icon: "❂",
    titleEn: "The Armband Finds You",
    titleEs: "El Brazalete Te Encuentra",
    bodyEn: "The captain left in the window and the dressing room turned to you.",
    bodyEs: "El capitán se fue en el mercado y el vestuario te miró a ti.",
    weight: 5,
    eligible: (c) => !c.hasCaptaincy && c.age >= 27 && c.trust >= 74 && c.seasonsAtClub >= 3,
    effects: {
      captain: true, trait: "Captain", trust: 8, reputationShift: 1,
      attrs: [{ label: "Composure", delta: 1 }],
    },
  },
  {
    id: "new-contract",
    category: "positive",
    icon: "✎",
    titleEn: "They Move First",
    titleEs: "Se Adelantan",
    bodyEn: "Before anyone else could call, the club tore up your deal and improved it.",
    bodyEs: "Antes de que llamara nadie, el club rompió tu contrato y lo mejoró.",
    weight: 6,
    eligible: (c) => c.trust >= 70 && c.ovrDelta >= 2 && c.contractYearsLeft <= 2,
    effects: { trust: 5, wagePct: 30, marketPct: 8, transferPush: -1 },
  },
  {
    id: "position-change-worked",
    category: "positive",
    icon: "⌖",
    titleEn: "The New Role Clicks",
    titleEs: "El Nuevo Rol Encaja",
    bodyEn: "Playing deeper has added years to your career — you see the game before it happens.",
    bodyEs: "Jugar más retrasado ha sumado años a tu carrera — ves el juego antes de que ocurra.",
    weight: 5,
    eligible: (c) => c.age >= 25 && c.trust >= 58 && c.ovrDelta >= 1,
    effects: {
      ovr: 1, trust: 5, formShift: 1, retirementRisk: -0.1,
      attrs: [{ label: "Positioning", delta: 2 }, { label: "Passing", delta: 1 }],
    },
  },
  {
    id: "major-final-performance",
    category: "positive",
    icon: "★",
    titleEn: "The Night They Talk About",
    titleEs: "La Noche de la que se Habla",
    bodyEn: "One final, ninety minutes, and every highlight reel starts with you.",
    bodyEs: "Una final, noventa minutos, y todos los resúmenes empiezan contigo.",
    weight: 6,
    eligible: (c) => c.honours.length > 0 && c.overall >= 70,
    effects: { reputationShift: 1, marketPct: 18, trust: 6, formShift: 1, trait: "BigGame" },
  },
  {
    id: "career-revival",
    category: "positive",
    icon: "⟳",
    titleEn: "Written Off, Then This",
    titleEs: "Te Daban por Acabado",
    bodyEn: "Everyone said you were finished. You have just had your best year in five.",
    bodyEs: "Todos decían que estabas acabado. Acabas de firmar tu mejor año en cinco.",
    weight: 5,
    eligible: (c) => c.age >= 30 && c.ovrDelta >= 1 && c.trust >= 48,
    effects: {
      formShift: 2, trust: 8, marketPct: 22, reputationShift: 1,
      retirementRisk: -0.25, trait: "ComebackKing",
    },
  },
  {
    id: "return-from-injury",
    category: "positive",
    icon: "✚",
    titleEn: "Back on the Grass",
    titleEs: "De Vuelta al Césped",
    bodyEn: "Months of rehab, and the first touch back felt like the first day.",
    bodyEs: "Meses de recuperación, y el primer toque supo a primer día.",
    weight: 5,
    eligible: (c) => c.age >= 19 && c.apps <= 22,
    effects: { formShift: 1, trust: 5, appsPct: 15, injuryRisk: 0.05, trait: "IronWill" },
  },
  {
    id: "promotion",
    category: "positive",
    icon: "▲",
    titleEn: "Promoted",
    titleEs: "Ascenso",
    bodyEn: "You dragged this club up a division and the whole town was on the pitch.",
    bodyEs: "Subiste a este club de categoría y el pueblo entero acabó en el campo.",
    weight: 5,
    eligible: (c) => c.clubReputation <= 68 && c.trust >= 45 && c.apps >= 20,
    effects: { trust: 6, reputationShift: 1, marketPct: 15, appsPct: 5, trait: "FanFavourite" },
  },
  {
    id: "league-title",
    category: "positive",
    icon: "◉",
    titleEn: "Champions",
    titleEs: "Campeones",
    bodyEn: "A league title changes how the game says your name.",
    bodyEs: "Un título de liga cambia cómo el fútbol pronuncia tu nombre.",
    weight: 6,
    eligible: (c) => c.honours.includes("League"),
    effects: { reputationShift: 1, marketPct: 14, trust: 5, formShift: 1 },
  },
  {
    id: "continental-trophy",
    category: "positive",
    icon: "◈",
    titleEn: "Kings of the Continent",
    titleEs: "Reyes del Continente",
    bodyEn: "European nights are a different sport, and you just won the biggest one.",
    bodyEs: "Las noches europeas son otro deporte, y acabas de ganar la más grande.",
    weight: 5,
    eligible: (c) => c.honours.includes("Champions League") || c.honours.includes("Europa"),
    effects: { reputationShift: 2, marketPct: 22, trust: 5, trait: "BigGame" },
  },
  {
    id: "individual-award",
    category: "positive",
    icon: "★",
    titleEn: "Player of the Year",
    titleEs: "Jugador del Año",
    bodyEn: "The league voted, and it was not close.",
    bodyEs: "La liga votó, y no estuvo reñido.",
    weight: 5,
    eligible: (c) => c.overall >= 78 && (c.goals >= 15 || c.trust >= 80),
    effects: { reputationShift: 1, marketPct: 18, trust: 4, ovr: 1 },
  },
  {
    id: "record-breaking-season",
    category: "positive",
    icon: "◎",
    titleEn: "Into the Record Books",
    titleEs: "A los Libros de Récords",
    bodyEn: "A number nobody at this club has ever put up now has your name beside it.",
    bodyEs: "Una cifra que nadie en este club había alcanzado lleva ahora tu nombre.",
    weight: 4,
    eligible: (c) => (isAttacker(c.position) ? c.goals >= 24 : c.apps >= 44 && c.overall >= 76),
    effects: { reputationShift: 2, marketPct: 26, trust: 7, trait: "RecordBreaker" },
  },
  {
    id: "successful-loan",
    category: "positive",
    icon: "⇄",
    titleEn: "The Loan That Made You",
    titleEs: "La Cesión Que Te Hizo",
    bodyEn: "A season of real senior football taught you more than three in the academy.",
    bodyEs: "Una temporada de fútbol de verdad te enseñó más que tres en la cantera.",
    weight: 5,
    eligible: (c) => c.age <= 22 && c.apps >= 24 && c.clubReputation <= 74,
    effects: {
      ovr: 2, trust: 7, marketPct: 18, appsPct: 10,
      attrs: [{ label: "Composure", delta: 2 }, { label: "Stamina", delta: 1 }],
    },
  },
  {
    id: "club-legend-status",
    category: "positive",
    icon: "⌂",
    titleEn: "One of Their Own",
    titleEs: "Uno de los Suyos",
    bodyEn: "A stand, a mural, a song. This club is your club now.",
    bodyEs: "Una grada, un mural, un cántico. Este club ya es tu club.",
    weight: 4,
    eligible: (c) => c.seasonsAtClub >= 6 && c.trust >= 68,
    effects: { trust: 10, reputationShift: 1, trait: "ClubLegend", transferPush: -1, appsPct: 5 },
  },
  {
    id: "international-tournament-victory",
    category: "positive",
    icon: "⚑",
    titleEn: "A Summer That Never Ends",
    titleEs: "Un Verano Eterno",
    bodyEn: "You won a major international tournament. Your country will never let you buy a coffee again.",
    bodyEs: "Ganaste un gran torneo internacional. Tu país no te dejará pagar un café nunca más.",
    weight: 4,
    eligible: (c) => c.calledUp && !c.retiredIntl && c.overall >= 76,
    effects: { reputationShift: 2, marketPct: 24, trust: 5, trait: "WorldChampion" },
  },

  /* ============================ NEGATIVE ============================ */
  {
    id: "loss-of-starting-position",
    category: "negative",
    icon: "▼",
    titleEn: "You've Been Dropped",
    titleEs: "Te Han Sentado",
    bodyEn: "A new signing has your shirt and the manager will not meet your eye.",
    bodyEs: "Un fichaje lleva tu camiseta y el técnico no te sostiene la mirada.",
    weight: 7,
    eligible: (c) => c.age >= 19 && c.trust < 56 && c.apps < 26,
    effects: { trust: -6, formShift: -1, appsPct: -30 },
    choices: [
      {
        id: "fight",
        labelEn: "Fight for Your Place",
        labelEs: "Pelear por Tu Sitio",
        descEn: "First in, last out. Win him back on the training pitch.",
        descEs: "El primero en llegar, el último en irse. Recupéralo en los entrenamientos.",
        effects: { trust: 10, appsPct: 15, injuryRisk: 0.06, attrs: [{ label: "Stamina", delta: 1 }] },
      },
      {
        id: "loan",
        labelEn: "Request a Loan",
        labelEs: "Pedir una Cesión",
        descEn: "Games matter more than badges right now.",
        descEs: "Ahora mismo los minutos importan más que el escudo.",
        effects: { loanMove: true, appsPct: 55, ovr: 1, trust: -3, marketPct: -4 },
      },
      {
        id: "transfer",
        labelEn: "Request a Transfer",
        labelEs: "Pedir el Traspaso",
        descEn: "Burn the bridge. Somebody out there wants you.",
        descEs: "Quema el puente. Ahí fuera alguien te quiere.",
        effects: { transferPush: 1, trust: -12, appsPct: -20, marketPct: -8, reputationShift: -1 },
      },
    ],
  },
  {
    id: "poor-form",
    category: "negative",
    icon: "▼",
    titleEn: "Nothing Is Going In",
    titleEs: "No Entra Nada",
    bodyEn: "The touch is heavy, the finishing is worse, and the crowd has noticed.",
    bodyEs: "El control se te va largo, la definición peor, y la grada lo ha notado.",
    weight: 6,
    eligible: (c) => c.ovrDelta <= 0 && c.trust < 72 && c.age >= 18,
    effects: { formShift: -2, trust: -6, marketPct: -10, appsPct: -10 },
  },
  {
    id: "manager-conflict",
    category: "negative",
    icon: "⚔",
    titleEn: "Fallout with the Manager",
    titleEs: "Choque con el Entrenador",
    bodyEn: "You were substituted on the hour and said something you cannot take back.",
    bodyEs: "Te cambiaron en el minuto sesenta y dijiste algo que ya no puedes retirar.",
    weight: 6,
    eligible: (c) => c.age >= 20 && c.trust <= 66,
    effects: { trust: -8, formShift: -1 },
    choices: [
      {
        id: "apologise",
        labelEn: "Apologise Publicly",
        labelEs: "Pedir Perdón en Público",
        descEn: "Swallow it. The dressing room comes first.",
        descEs: "Trágatelo. El vestuario está por encima.",
        effects: { trust: 12, reputationShift: -1, appsPct: 10 },
      },
      {
        id: "stand",
        labelEn: "Stand Your Ground",
        labelEs: "Mantenerte Firme",
        descEn: "You were right, and the fans know it. He picks the team, though.",
        descEs: "Tenías razón, y la afición lo sabe. Pero él pone el once.",
        effects: { trust: -6, reputationShift: 1, appsPct: -25, trait: "IronWill" },
      },
      {
        id: "leave",
        labelEn: "Tell the Board You Want Out",
        labelEs: "Decirle al Club Que Te Vas",
        descEn: "One of you is leaving, and he has a four-year deal.",
        descEs: "Uno de los dos se va, y él tiene contrato por cuatro años.",
        effects: { transferPush: 1, trust: -10, appsPct: -30 },
      },
    ],
  },
  {
    id: "contract-dispute",
    category: "negative",
    icon: "⚖",
    titleEn: "Talks Have Stalled",
    titleEs: "Las Negociaciones se Rompen",
    bodyEn: "Your camp asked for parity with the top earners. The club laughed.",
    bodyEs: "Tu entorno pidió igualarte a los que más cobran. El club se rió.",
    weight: 5,
    eligible: (c) => c.contractYearsLeft <= 2 && c.trust >= 35 && c.age >= 21,
    effects: { trust: -4 },
    choices: [
      {
        id: "holdout",
        labelEn: "Hold Out for Your Number",
        labelEs: "Aguantar Tu Cifra",
        descEn: "You are worth it. The terraces may disagree.",
        descEs: "Lo vales. La grada puede no verlo igual.",
        effects: { wagePct: 30, trust: -8, reputationShift: -1, marketPct: 4 },
      },
      {
        id: "accept",
        labelEn: "Take Their Offer",
        labelEs: "Aceptar Su Oferta",
        descEn: "Less money, more football, no noise.",
        descEs: "Menos dinero, más fútbol, menos ruido.",
        effects: { wagePct: 8, trust: 10, transferPush: -1 },
      },
      {
        id: "rundown",
        labelEn: "Run the Contract Down",
        labelEs: "Agotar el Contrato",
        descEn: "Leave for nothing next summer — and pick where you go.",
        descEs: "Irte gratis el próximo verano — y elegir destino.",
        effects: { transferPush: 1, trust: -14, marketPct: -12, appsPct: -15 },
      },
    ],
  },
  {
    id: "failed-transfer",
    category: "negative",
    icon: "⊘",
    titleEn: "The Move Collapsed",
    titleEs: "El Traspaso se Cayó",
    bodyEn: "Medical passed, terms agreed, and the two clubs could not close it before the deadline.",
    bodyEs: "Pasaste la revisión, acordaste condiciones, y los clubes no cerraron antes del cierre.",
    weight: 5,
    eligible: (c) => c.age >= 20 && c.overall >= 72,
    effects: { trust: -6, formShift: -1, marketPct: -8, transferPush: 1 },
  },
  {
    id: "relegation",
    category: "negative",
    icon: "▼",
    titleEn: "Relegated",
    titleEs: "Descenso",
    bodyEn: "The last day went the wrong way and this club falls a division with you in it.",
    bodyEs: "La última jornada salió mal y el club baja de categoría contigo dentro.",
    weight: 5,
    eligible: (c) => c.clubReputation <= 80 && c.honours.length === 0 && c.age >= 18,
    effects: { marketPct: -18, reputationShift: -1, formShift: -1, trust: -3, transferPush: 1 },
  },
  {
    id: "missed-penalty",
    category: "negative",
    icon: "⊘",
    titleEn: "You Missed It",
    titleEs: "La Fallaste",
    bodyEn: "Semi-final, shootout, and the goalkeeper guessed right. It will follow you.",
    bodyEs: "Semifinal, tanda, y el portero adivinó el lado. Te va a perseguir.",
    weight: 4,
    eligible: (c) => isOutfield(c.position) && c.overall >= 68 && c.age >= 19,
    effects: {
      formShift: -2, trust: -5, reputationShift: -1, marketPct: -6,
      attrs: [{ label: "Composure", delta: -2 }],
    },
  },
  {
    id: "suspension",
    category: "negative",
    icon: "✖",
    titleEn: "Banned",
    titleEs: "Sancionado",
    bodyEn: "A straight red and a violent-conduct charge. You watch the next stretch from the stand.",
    bodyEs: "Roja directa y expediente por conducta violenta. Ves el siguiente tramo desde la grada.",
    weight: 4,
    eligible: (c) => isOutfield(c.position) && c.age >= 18,
    effects: { appsPct: -18, trust: -6, formShift: -1, reputationShift: -1, marketPct: -4 },
  },
  {
    id: "failed-loan",
    category: "negative",
    icon: "⇄",
    titleEn: "The Loan Went Nowhere",
    titleEs: "La Cesión No Salió",
    bodyEn: "You barely played, the manager who wanted you was sacked in October, and you came back behind.",
    bodyEs: "Apenas jugaste, al técnico que te quería lo echaron en octubre, y volviste con retraso.",
    weight: 4,
    eligible: (c) => c.age <= 23 && c.apps < 16,
    effects: { trust: -7, ovr: -1, marketPct: -14, formShift: -1 },
  },
  {
    id: "club-financial-crisis",
    category: "negative",
    icon: "⚖",
    titleEn: "The Wages Are Late",
    titleEs: "Los Sueldos No Llegan",
    bodyEn: "The club is in administration and the squad has been asked to defer.",
    bodyEs: "El club está en concurso de acreedores y le han pedido a la plantilla que aplace su sueldo.",
    weight: 4,
    eligible: (c) => c.clubReputation <= 82 && c.age >= 19,
    effects: { marketPct: -6, formShift: -1 },
    choices: [
      {
        id: "cut",
        labelEn: "Take the Wage Cut",
        labelEs: "Aceptar la Rebaja",
        descEn: "Keep the lights on. They will never forget it.",
        descEs: "Mantén el club vivo. No lo olvidarán jamás.",
        effects: { wagePct: -30, trust: 12, reputationShift: 1, trait: "FanFavourite" },
      },
      {
        id: "force",
        labelEn: "Force a Move Out",
        labelEs: "Forzar la Salida",
        descEn: "This is not your mess to carry.",
        descEs: "Este marrón no es tuyo.",
        effects: { transferPush: 1, trust: -10, marketPct: -5 },
      },
      {
        id: "wait",
        labelEn: "Say Nothing and Play",
        labelEs: "Callar y Jugar",
        descEn: "Let the lawyers work. You keep your head down.",
        descEs: "Que trabajen los abogados. Tú, perfil bajo.",
        effects: { trust: 4, appsPct: -8 },
      },
    ],
  },
  {
    id: "transfer-listed",
    category: "negative",
    icon: "⊘",
    titleEn: "Transfer-Listed",
    titleEs: "En la Lista de Transferibles",
    bodyEn: "You found out from the club website. Training is with the reserves from Monday.",
    bodyEs: "Te enteraste por la web del club. Desde el lunes entrenas con el filial.",
    weight: 4,
    eligible: (c) => c.trust < 42 && c.age >= 22,
    effects: { trust: -10, appsPct: -40, marketPct: -14, transferPush: 1, formShift: -1 },
  },
  {
    id: "released-by-club",
    category: "negative",
    icon: "✖",
    titleEn: "Released",
    titleEs: "Carta de Libertad",
    bodyEn: "No new deal, no explanation. You are a free agent in July.",
    bodyEs: "Sin renovación y sin explicación. En julio eres agente libre.",
    weight: 3,
    eligible: (c) => c.trust < 32 && c.contractYearsLeft <= 0 && c.age >= 20,
    effects: {
      trust: -8, marketPct: -22, transferPush: 1, appsPct: -25,
      retirementRisk: 0.1, trait: "Journeyman",
    },
  },
  {
    id: "international-retirement",
    category: "negative",
    icon: "⚑",
    titleEn: "The Phone Stops Ringing",
    titleEs: "El Teléfono Deja de Sonar",
    bodyEn: "The national manager is building for the next cycle, and you are not in it.",
    bodyEs: "El seleccionador construye para el próximo ciclo, y tú no estás en él.",
    weight: 4,
    eligible: (c) => c.calledUp && !c.retiredIntl && c.age >= 32,
    effects: { intlRetire: true, reputationShift: -1, trust: 3, injuryRisk: -0.08, appsPct: 5 },
  },
  {
    id: "early-retirement-consideration",
    category: "negative",
    icon: "⌛",
    titleEn: "The Body Is Talking",
    titleEs: "El Cuerpo Habla",
    bodyEn: "Two days to recover became five. You have started thinking about after.",
    bodyEs: "Dos días para recuperarte se han vuelto cinco. Ya piensas en el después.",
    weight: 4,
    eligible: (c) => c.age >= 30 && (c.ovrDelta <= -2 || c.apps < 18),
    effects: { retirementRisk: 0.15, formShift: -1 },
    choices: [
      {
        id: "push",
        labelEn: "Push Through It",
        labelEs: "Tirar Hacia Delante",
        descEn: "Painkillers, ice baths, and one more year at this level.",
        descEs: "Analgésicos, hielo y un año más a este nivel.",
        effects: { trust: 4, retirementRisk: -0.12, injuryRisk: 0.15, appsPct: 10 },
      },
      {
        id: "dropdown",
        labelEn: "Drop Down a Level",
        labelEs: "Bajar de Nivel",
        descEn: "Less intensity, more football, several more seasons.",
        descEs: "Menos intensidad, más fútbol, varias temporadas más.",
        effects: { transferPush: 1, appsPct: 30, marketPct: -20, retirementRisk: -0.25, wagePct: -25 },
      },
      {
        id: "plan",
        labelEn: "Start Planning the End",
        labelEs: "Empezar a Planear el Final",
        descEn: "Choose your last day before somebody chooses it for you.",
        descEs: "Elige tu último día antes de que alguien lo elija por ti.",
        effects: { retirementRisk: 0.35, trust: -4, trait: "Mentor" },
      },
    ],
  },

  /* ============================= INJURY ============================= */
  {
    id: "serious-knee-injury",
    category: "injury",
    icon: "✚",
    titleEn: "Knee Ligaments",
    titleEs: "Ligamentos de la Rodilla",
    bodyEn: "You went over awkwardly and the stadium went quiet. It is the big one.",
    bodyEs: "Apoyaste mal y el estadio enmudeció. Es la grave.",
    weight: 4,
    eligible: (c) => c.age >= 19,
    effects: { appsPct: -55, ovr: -1, formShift: -2, injuryRisk: 0.12, marketPct: -12 },
    choices: [
      {
        id: "rush",
        labelEn: "Rush the Rehab",
        labelEs: "Acelerar la Recuperación",
        descEn: "Back for the run-in — and rolling the dice on the joint.",
        descEs: "Vuelves para la recta final — jugándotela con la rodilla.",
        effects: { appsPct: 25, trust: 5, injuryRisk: 0.25, trait: "GlassAnkles" },
      },
      {
        id: "timeline",
        labelEn: "Follow the Timeline",
        labelEs: "Seguir los Plazos",
        descEn: "Do exactly what the medical staff say. Nothing more.",
        descEs: "Haz exactamente lo que dicen los médicos. Nada más.",
        effects: { injuryRisk: 0.02, trust: 2 },
      },
      {
        id: "extra",
        labelEn: "Take the Extra Months",
        labelEs: "Tomarte Meses de Más",
        descEn: "Lose the season, save the career.",
        descEs: "Pierde la temporada, salva la carrera.",
        effects: {
          appsPct: -25, injuryRisk: -0.15, retirementRisk: -0.1, trait: "IronWill",
          attrs: [{ label: "Strength", delta: 1 }],
        },
      },
    ],
  },
  {
    id: "muscle-injury",
    category: "injury",
    icon: "✚",
    titleEn: "Hamstring",
    titleEs: "Isquiotibiales",
    bodyEn: "You felt it go chasing a lost cause in the ninetieth minute.",
    bodyEs: "Lo notaste persiguiendo un balón perdido en el minuto noventa.",
    weight: 6,
    eligible: (c) => c.age >= 18,
    effects: { appsPct: -18, formShift: -1, injuryRisk: 0.08, trust: -2 },
  },
  {
    id: "head-injury",
    category: "injury",
    icon: "✚",
    titleEn: "Concussion Protocol",
    titleEs: "Protocolo de Conmoción",
    bodyEn: "A clash of heads, a dark room, and a fortnight of doing absolutely nothing.",
    bodyEs: "Un choque de cabezas, una habitación a oscuras y quince días sin hacer nada.",
    weight: 4,
    eligible: (c) => c.age >= 18,
    effects: { appsPct: -10, trust: 1, attrs: [{ label: "Heading", delta: -1 }] },
  },
  {
    id: "recurring-injury",
    category: "injury",
    icon: "✚",
    titleEn: "It Keeps Coming Back",
    titleEs: "Vuelve una y Otra Vez",
    bodyEn: "The same muscle, the third time this year. The staff are running out of ideas.",
    bodyEs: "El mismo músculo, la tercera vez este año. Al cuerpo técnico se le acaban las ideas.",
    weight: 4,
    eligible: (c) => c.age >= 29,
    effects: {
      appsPct: -28, injuryRisk: 0.2, retirementRisk: 0.12, trust: -5,
      trait: "GlassAnkles", attrs: [{ label: "Pace", delta: -1 }],
    },
  },
  {
    id: "career-threatening-injury",
    category: "injury",
    icon: "✚",
    titleEn: "They Used the Word 'Career'",
    titleEs: "Usaron la Palabra 'Carrera'",
    bodyEn: "The surgeon would not give you a date. Nobody in the room would.",
    bodyEs: "El cirujano no te dio una fecha. Nadie en la sala te la dio.",
    weight: 2,
    eligible: (c) => c.age >= 24,
    effects: {
      appsPct: -70, ovr: -3, formShift: -2, marketPct: -30,
      retirementRisk: 0.35, injuryRisk: 0.2, attrs: [{ label: "Pace", delta: -2 }],
    },
  },

  /* ============================ DECISION ============================ */
  {
    id: "position-request-deeper",
    category: "decision",
    icon: "⌖",
    titleEn: "Drop Into Midfield?",
    titleEs: "¿Retrasar Tu Posición?",
    bodyEn: "The manager thinks your legs are going but your brain is only getting better.",
    bodyEs: "El técnico cree que las piernas se van pero la cabeza no deja de mejorar.",
    weight: 5,
    eligible: (c) => isAttacker(c.position) && c.age >= 26 && c.trust >= 50,
    choices: [
      {
        id: "accept",
        labelEn: "Move to Central Midfield",
        labelEs: "Pasar al Centro del Campo",
        descEn: "Fewer goals, more football, more years.",
        descEs: "Menos goles, más fútbol, más años.",
        effects: {
          positionChange: "CM", trust: 6, retirementRisk: -0.2, trait: "Versatile",
          attrs: [{ label: "Passing", delta: 2 }, { label: "Positioning", delta: 2 }, { label: "Finishing", delta: -1 }],
        },
      },
      {
        id: "trial",
        labelEn: "Trial It in Cup Games",
        labelEs: "Probarlo en Copa",
        descEn: "Keep your shirt, learn the role quietly.",
        descEs: "Conserva tu puesto y aprende el rol sin ruido.",
        effects: { trust: 3, appsPct: 6, attrs: [{ label: "Positioning", delta: 1 }] },
      },
      {
        id: "refuse",
        labelEn: "Refuse — You're a Forward",
        labelEs: "Negarte — Eres Delantero",
        descEn: "It is what you are. It may not be what he picks.",
        descEs: "Es lo que eres. Puede que no sea lo que él alinea.",
        effects: { trust: -6, appsPct: -12, formShift: -1 },
      },
    ],
  },
  {
    id: "position-request-defence",
    category: "decision",
    icon: "⌖",
    titleEn: "A Move to Centre-Back",
    titleEs: "Reconvertirte a Central",
    bodyEn: "Injuries have left a hole at the back and the staff think you could fill it for good.",
    bodyEs: "Las lesiones han abierto un hueco atrás y el cuerpo técnico cree que puedes taparlo para siempre.",
    weight: 4,
    eligible: (c) => (c.position === "CM" || c.position === "CDM") && c.age >= 28,
    choices: [
      {
        id: "accept",
        labelEn: "Reinvent Yourself at the Back",
        labelEs: "Reinventarte Atrás",
        descEn: "Ball-playing centre-backs age beautifully.",
        descEs: "Los centrales que saben jugar envejecen de maravilla.",
        effects: {
          positionChange: "CB", trust: 7, retirementRisk: -0.2, ovr: 1, trait: "Versatile",
          attrs: [{ label: "Defending", delta: 3 }, { label: "Heading", delta: 2 }],
        },
      },
      {
        id: "refuse",
        labelEn: "Stay in Midfield",
        labelEs: "Seguir en el Medio",
        descEn: "You know your job. So does the squad.",
        descEs: "Sabes cuál es tu trabajo. El vestuario también.",
        effects: { trust: -4, appsPct: -10 },
      },
    ],
  },
  {
    id: "position-request-fullback-right",
    category: "decision",
    icon: "⌖",
    titleEn: "Right-Back Is Open",
    titleEs: "El Lateral Derecho Está Libre",
    bodyEn: "You have the lungs for it and nobody else in the squad does.",
    bodyEs: "Tienes pulmones para ese puesto y nadie más en la plantilla los tiene.",
    weight: 3,
    eligible: (c) => c.position === "RW" && c.age >= 24 && c.trust >= 45,
    choices: [
      {
        id: "accept",
        labelEn: "Become a Right-Back",
        labelEs: "Pasar a Lateral Derecho",
        descEn: "Guaranteed minutes, a longer career, fewer headlines.",
        descEs: "Minutos garantizados, carrera más larga, menos titulares.",
        effects: {
          positionChange: "RB", trust: 8, appsPct: 25, trait: "Versatile",
          attrs: [{ label: "Defending", delta: 3 }, { label: "Stamina", delta: 2 }, { label: "Finishing", delta: -2 }],
        },
      },
      {
        id: "refuse",
        labelEn: "Stay on the Wing",
        labelEs: "Seguir en la Banda",
        descEn: "Attackers get remembered.",
        descEs: "A los atacantes se les recuerda.",
        effects: { trust: -5, appsPct: -15 },
      },
    ],
  },
  {
    id: "position-request-fullback-left",
    category: "decision",
    icon: "⌖",
    titleEn: "Left-Back Is Open",
    titleEs: "El Lateral Izquierdo Está Libre",
    bodyEn: "The manager wants your engine on that flank for ninety minutes, not sixty.",
    bodyEs: "El técnico quiere tu motor en esa banda noventa minutos, no sesenta.",
    weight: 3,
    eligible: (c) => c.position === "LW" && c.age >= 24 && c.trust >= 45,
    choices: [
      {
        id: "accept",
        labelEn: "Become a Left-Back",
        labelEs: "Pasar a Lateral Izquierdo",
        descEn: "Guaranteed minutes, a longer career, fewer headlines.",
        descEs: "Minutos garantizados, carrera más larga, menos titulares.",
        effects: {
          positionChange: "LB", trust: 8, appsPct: 25, trait: "Versatile",
          attrs: [{ label: "Defending", delta: 3 }, { label: "Stamina", delta: 2 }, { label: "Finishing", delta: -2 }],
        },
      },
      {
        id: "refuse",
        labelEn: "Stay on the Wing",
        labelEs: "Seguir en la Banda",
        descEn: "Attackers get remembered.",
        descEs: "A los atacantes se les recuerda.",
        effects: { trust: -5, appsPct: -15 },
      },
    ],
  },
  {
    id: "position-request-striker",
    category: "decision",
    icon: "⌖",
    titleEn: "Play Through the Middle",
    titleEs: "Jugar por el Centro",
    bodyEn: "You keep scoring from wide. The staff want to know what happens if you start central.",
    bodyEs: "No dejas de marcar desde fuera. El cuerpo técnico quiere ver qué pasa si empiezas por dentro.",
    weight: 4,
    eligible: (c) => (c.position === "RW" || c.position === "LW" || c.position === "CAM") && c.age <= 25 && c.goals >= 10,
    choices: [
      {
        id: "accept",
        labelEn: "Move to Striker",
        labelEs: "Pasar a Delantero Centro",
        descEn: "More goals, more pressure, a bigger price tag.",
        descEs: "Más goles, más presión, más precio.",
        effects: {
          positionChange: "ST", trust: 4, marketPct: 12, trait: "Versatile",
          attrs: [{ label: "Finishing", delta: 3 }, { label: "Positioning", delta: 2 }, { label: "Crossing", delta: -2 }],
        },
      },
      {
        id: "refuse",
        labelEn: "Stay Wide",
        labelEs: "Seguir Abierto",
        descEn: "Space out there. None in the box.",
        descEs: "Fuera hay espacio. En el área, ninguno.",
        effects: { trust: -3, formShift: 1 },
      },
    ],
  },
  {
    id: "captaincy-offer",
    category: "decision",
    icon: "❂",
    titleEn: "The Armband",
    titleEs: "El Brazalete",
    bodyEn: "The manager wants you to lead this dressing room.",
    bodyEs: "El entrenador quiere que lideres este vestuario.",
    weight: 5,
    eligible: (c) => !c.hasCaptaincy && c.trust >= 68 && c.seasonsAtClub >= 2 && c.age >= 21,
    choices: [
      {
        id: "accept",
        labelEn: "Take the Captaincy",
        labelEs: "Aceptar la Capitanía",
        descEn: "Everything is yours now, including the blame.",
        descEs: "Todo es tuyo ahora, también las culpas.",
        effects: {
          captain: true, trait: "Captain", trust: 9, reputationShift: 1, formShift: -1,
          attrs: [{ label: "Composure", delta: 2 }],
        },
      },
      {
        id: "vice",
        labelEn: "Ask to Be Vice-Captain",
        labelEs: "Pedir Ser Segundo Capitán",
        descEn: "Lead without the microphone.",
        descEs: "Liderar sin el micrófono.",
        effects: { trust: 5, trait: "Leader", attrs: [{ label: "Composure", delta: 1 }] },
      },
      {
        id: "decline",
        labelEn: "Not Yet",
        labelEs: "Todavía No",
        descEn: "Play your game. Let someone else talk.",
        descEs: "Juega lo tuyo. Que hable otro.",
        effects: { trust: -4, formShift: 1 },
      },
    ],
  },
  {
    id: "new-agent",
    category: "decision",
    icon: "✎",
    titleEn: "Change Agent?",
    titleEs: "¿Cambiar de Agente?",
    bodyEn: "A super-agent with half of Europe on speed dial wants to represent you.",
    bodyEs: "Un superagente con media Europa en la agenda quiere representarte.",
    weight: 4,
    eligible: (c) => c.age >= 20 && c.overall >= 68,
    choices: [
      {
        id: "super",
        labelEn: "Sign with the Super-Agent",
        labelEs: "Firmar con el Superagente",
        descEn: "Doors open everywhere — and he will always want you moving.",
        descEs: "Se abren todas las puertas — y siempre querrá moverte.",
        effects: { marketPct: 15, wagePct: 20, transferPush: 1, trust: -4, reputationShift: 1 },
      },
      {
        id: "family",
        labelEn: "Stay with the Family Friend",
        labelEs: "Seguir con el Amigo de la Familia",
        descEn: "Smaller deals, zero drama, a settled life.",
        descEs: "Contratos menores, cero drama, vida tranquila.",
        effects: { trust: 6, wagePct: 3, transferPush: -1, formShift: 1 },
      },
      {
        id: "self",
        labelEn: "Represent Yourself",
        labelEs: "Representarte a Ti Mismo",
        descEn: "No commission, no advocate.",
        descEs: "Sin comisiones, y sin nadie que te defienda.",
        effects: { wagePct: 10, marketPct: -6, reputationShift: -1, trust: 2 },
      },
    ],
  },
  {
    id: "transfer-request",
    category: "decision",
    icon: "⇄",
    titleEn: "Hand in a Transfer Request?",
    titleEs: "¿Pedir el Traspaso?",
    bodyEn: "You have outgrown this club and everyone in the building knows it.",
    bodyEs: "Se te ha quedado pequeño este club y todo el mundo lo sabe.",
    weight: 5,
    eligible: (c) => c.age >= 20 && c.seasonsAtClub >= 2 && c.trust <= 78,
    choices: [
      {
        id: "submit",
        labelEn: "Hand It In",
        labelEs: "Entregarla",
        descEn: "Offers will come. So will the boos.",
        descEs: "Llegarán ofertas. Y también los pitos.",
        effects: { transferPush: 1, trust: -12, appsPct: -15, reputationShift: -1, marketPct: 5 },
      },
      {
        id: "quiet",
        labelEn: "A Quiet Word with the Manager",
        labelEs: "Hablarlo en Privado con el Técnico",
        descEn: "Let him sell you properly, in the summer, with a handshake.",
        descEs: "Que te venda bien, en verano, con un apretón de manos.",
        effects: { transferPush: 1, trust: -3 },
      },
      {
        id: "commit",
        labelEn: "Commit Another Year",
        labelEs: "Comprometerte un Año Más",
        descEn: "Unfinished business here.",
        descEs: "Aquí queda trabajo por hacer.",
        effects: { transferPush: -1, trust: 10, wagePct: 8, appsPct: 8 },
      },
    ],
  },
  {
    id: "contract-negotiation",
    category: "decision",
    icon: "⚖",
    titleEn: "Your Deal Is Up",
    titleEs: "Se Acaba Tu Contrato",
    bodyEn: "Twelve months left. What happens next is decided this week.",
    bodyEs: "Doce meses por delante. Lo que pase después se decide esta semana.",
    weight: 6,
    eligible: (c) => c.contractYearsLeft <= 1 && c.age >= 18,
    choices: [
      {
        id: "long",
        labelEn: "Sign Long-Term",
        labelEs: "Firmar a Largo Plazo",
        descEn: "Security, the manager's total backing, and no escape hatch.",
        descEs: "Seguridad, el respaldo total del técnico y ninguna salida.",
        effects: { wagePct: 18, trust: 10, marketPct: 6, transferPush: -1, appsPct: 8 },
      },
      {
        id: "demand",
        labelEn: "Demand Elite Wages",
        labelEs: "Exigir Salario de Élite",
        descEn: "Get paid what you are worth, whatever it costs upstairs.",
        descEs: "Cobra lo que vales, cueste lo que cueste arriba.",
        effects: { wagePct: 50, trust: -9, appsPct: -10, marketPct: 4 },
      },
      {
        id: "expire",
        labelEn: "Let It Expire",
        labelEs: "Dejarlo Vencer",
        descEn: "Walk for free next summer and choose your own ending.",
        descEs: "Te vas gratis el próximo verano y eliges tu final.",
        effects: { transferPush: 1, trust: -12, marketPct: -10, wagePct: 0 },
      },
    ],
  },
  {
    id: "national-team-choice",
    category: "decision",
    icon: "⚑",
    titleEn: "Two Countries Are Calling",
    titleEs: "Dos Países Te Llaman",
    bodyEn: "You qualify for both. One cap ties you for life.",
    bodyEs: "Puedes jugar con las dos. Una convocatoria te ata de por vida.",
    weight: 5,
    eligible: (c) => !c.calledUp && !c.retiredIntl && c.overall >= 70 && c.age >= 18,
    choices: [
      {
        id: "birth",
        labelEn: "Play for Where You Were Born",
        labelEs: "Jugar por Donde Naciste",
        descEn: "The shirt you wore as a kid.",
        descEs: "La camiseta que llevabas de niño.",
        effects: { nationalCallUp: true, reputationShift: 1, trust: 2, marketPct: 6 },
      },
      {
        id: "adopted",
        labelEn: "Play for the Bigger Nation",
        labelEs: "Jugar por la Selección Más Grande",
        descEn: "Tournaments, television, and a harder squad to hold down.",
        descEs: "Torneos, televisión y un puesto mucho más difícil de mantener.",
        effects: { nationalCallUp: true, reputationShift: 2, marketPct: 12, appsPct: -6, injuryRisk: 0.08 },
      },
      {
        id: "wait",
        labelEn: "Wait and Focus on Your Club",
        labelEs: "Esperar y Centrarte en el Club",
        descEn: "No travel, no fatigue, no international career yet.",
        descEs: "Sin viajes, sin desgaste, y sin selección de momento.",
        effects: { trust: 6, appsPct: 10, formShift: 1 },
      },
    ],
  },
  {
    id: "loan-offer",
    category: "decision",
    icon: "⇄",
    titleEn: "A Loan Is on the Table",
    titleEs: "Hay una Cesión Sobre la Mesa",
    bodyEn: "Two clubs want you for the season. Your own club will not promise you minutes.",
    bodyEs: "Dos clubes te quieren por una temporada. El tuyo no te garantiza minutos.",
    weight: 5,
    eligible: (c) => c.age <= 24 && c.trust < 62,
    choices: [
      {
        id: "top",
        labelEn: "Top-Flight Loan Abroad",
        labelEs: "Cesión a Primera en el Extranjero",
        descEn: "Harder league, fewer starts, faster growth.",
        descEs: "Liga más dura, menos titularidades, crecimiento más rápido.",
        effects: {
          loanMove: true, appsPct: 30, ovr: 2, marketPct: 12, trust: -2,
          attrs: [{ label: "Composure", delta: 2 }],
        },
      },
      {
        id: "second",
        labelEn: "Second-Tier Loan, Guaranteed Games",
        labelEs: "Cesión a Segunda con Minutos Asegurados",
        descEn: "Play every week and come back a footballer.",
        descEs: "Juega cada semana y vuelve hecho un futbolista.",
        effects: {
          loanMove: true, appsPct: 60, ovr: 1, trust: 3, marketPct: 5,
          attrs: [{ label: "Stamina", delta: 2 }],
        },
      },
      {
        id: "stay",
        labelEn: "Stay and Fight",
        labelEs: "Quedarte y Pelear",
        descEn: "Train with better players, play a lot less.",
        descEs: "Entrenas con mejores, juegas mucho menos.",
        effects: { trust: 5, appsPct: -20, ovr: 1 },
      },
    ],
  },
  {
    id: "change-shirt-number",
    category: "decision",
    icon: "◈",
    titleEn: "A Number Comes Free",
    titleEs: "Queda un Dorsal Libre",
    bodyEn: "The club's iconic shirts are on the table for the first time in a decade.",
    bodyEs: "Los dorsales míticos del club están libres por primera vez en una década.",
    weight: 3,
    eligible: (c) => isOutfield(c.position) && c.seasonsAtClub >= 1 && c.trust >= 52,
    choices: [
      {
        id: "ten",
        labelEn: "Take the No. 10",
        labelEs: "Coger el 10",
        descEn: "The heaviest shirt in the building. Everyone will be watching.",
        descEs: "La camiseta que más pesa del club. Todos estarán mirando.",
        effects: { shirtNumber: 10, reputationShift: 1, marketPct: 8, formShift: -1, trust: 3 },
      },
      {
        id: "seven",
        labelEn: "Take the No. 7",
        labelEs: "Coger el 7",
        descEn: "Flair, freedom, and slightly less scrutiny.",
        descEs: "Descaro, libertad y algo menos de lupa.",
        effects: { shirtNumber: 7, reputationShift: 1, marketPct: 4 },
      },
      {
        id: "keep",
        labelEn: "Keep Your Number",
        labelEs: "Mantener Tu Dorsal",
        descEn: "It got you here. Nothing changes.",
        descEs: "Te ha traído hasta aquí. No cambia nada.",
        effects: { trust: 3, formShift: 1 },
      },
    ],
  },
  {
    id: "return-to-former-club",
    category: "decision",
    icon: "⌂",
    titleEn: "The Club That Made You",
    titleEs: "El Club Que Te Hizo",
    bodyEn: "The club you came through wants you home while you can still play.",
    bodyEs: "El club de tu cantera te quiere de vuelta mientras aún puedas jugar.",
    weight: 4,
    eligible: (c) => c.age >= 29 && c.overall >= 68,
    choices: [
      {
        id: "now",
        labelEn: "Go Home Now",
        labelEs: "Volver Ahora",
        descEn: "Lower wages, lower level, a hero's welcome.",
        descEs: "Menos sueldo, menos nivel, recibimiento de héroe.",
        effects: {
          transferPush: 1, wagePct: -30, trust: 10, marketPct: -15, appsPct: 20,
          trait: "FanFavourite", retirementRisk: -0.1,
        },
      },
      {
        id: "later",
        labelEn: "One More Chapter Here First",
        labelEs: "Un Capítulo Más Aquí Antes",
        descEn: "Win something else, then go back with a trophy.",
        descEs: "Gana algo más y vuelve con un título.",
        effects: { transferPush: -1, trust: 5, formShift: 1 },
      },
      {
        id: "never",
        labelEn: "Say No — the Story Moved On",
        labelEs: "Decir Que No — Esa Historia Terminó",
        descEn: "Sentiment does not win you anything.",
        descEs: "La nostalgia no gana títulos.",
        effects: { trust: 2, marketPct: 3 },
      },
    ],
  },
  {
    id: "retirement-decision",
    category: "decision",
    icon: "⌛",
    titleEn: "How Does This End?",
    titleEs: "¿Cómo Termina Esto?",
    bodyEn: "You get to decide your last day. Very few players do.",
    bodyEs: "Puedes elegir tu último día. Muy pocos futbolistas pueden.",
    weight: 6,
    eligible: (c) => c.age >= 34,
    choices: [
      {
        id: "one-more",
        labelEn: "One More Season",
        labelEs: "Una Temporada Más",
        descEn: "Squeeze every last game out of the body.",
        descEs: "Exprimir hasta el último partido que dé el cuerpo.",
        effects: { retirementRisk: -0.35, trust: 4, injuryRisk: 0.12, appsPct: 5 },
      },
      {
        id: "drop",
        labelEn: "Drop a Division and Keep Playing",
        labelEs: "Bajar de División y Seguir Jugando",
        descEn: "Years more football, far from the cameras.",
        descEs: "Años más de fútbol, lejos de las cámaras.",
        effects: {
          transferPush: 1, appsPct: 30, marketPct: -35, wagePct: -40,
          retirementRisk: -0.45, trait: "Mentor",
        },
      },
      {
        id: "retire",
        labelEn: "Retire at the Top",
        labelEs: "Retirarte en lo Más Alto",
        descEn: "Walk away on your own terms, and let them remember the best of you.",
        descEs: "Marcharte en tus términos y que te recuerden en tu mejor versión.",
        effects: { retire: true, reputationShift: 1, trait: "ClubLegend" },
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Lookup & selection                                                  */
/* ------------------------------------------------------------------ */

const BY_ID = new Map<string, CareerEventDef>(CAREER_EVENTS.map((e) => [e.id, e]));

export function eventById(id: string): CareerEventDef | undefined {
  return BY_ID.get(id);
}

/**
 * Events that can only ever happen once in a career — there is no second first
 * goal. The caller persists these ids and passes them back in `exclude`;
 * everything else may recur in a later chapter.
 */
export const ONCE_ONLY_EVENTS: readonly string[] = [
  "first-professional-goal", "first-international-call-up", "first-captaincy",
  "breakthrough-season", "captaincy-offer", "national-team-choice",
  "club-legend-status", "international-tournament-victory", "promotion",
  "record-breaking-season", "successful-loan", "failed-loan", "new-agent",
  "change-shirt-number", "return-to-former-club", "released-by-club",
  "international-retirement", "career-threatening-injury", "retirement-decision",
  "position-request-deeper", "position-request-defence", "position-request-striker",
  "position-request-fullback-right", "position-request-fullback-left",
  "position-change-worked",
];

/** Every event that could fire right now, minus anything already used. */
export function eligibleEvents(ctx: EventContext, exclude: string[] = []): CareerEventDef[] {
  const skip = new Set(exclude);
  return CAREER_EVENTS.filter((e) => !skip.has(e.id) && e.weight > 0 && e.eligible(ctx));
}

/**
 * Pick one event, weighted by `weight`. Deterministic for a given `rng`, so a
 * chapter replays identically. Returns null when nothing is eligible.
 */
export function pickEvent(
  ctx: EventContext,
  rng: () => number,
  exclude: string[] = [],
): CareerEventDef | null {
  const pool = eligibleEvents(ctx, exclude);
  if (!pool.length) return null;
  const total = pool.reduce((n, e) => n + e.weight, 0);
  let roll = rng() * total;
  for (const e of pool) {
    roll -= e.weight;
    if (roll <= 0) return e;
  }
  return pool[pool.length - 1];
}

/**
 * Pick up to `count` distinct events for one chapter. Each pick excludes the
 * previous ones, so a chapter never fires the same turning point twice.
 */
export function pickEvents(
  ctx: EventContext,
  rng: () => number,
  count: number,
  exclude: string[] = [],
): CareerEventDef[] {
  const out: CareerEventDef[] = [];
  const used = [...exclude];
  for (let i = 0; i < count; i++) {
    const e = pickEvent(ctx, rng, used);
    if (!e) break;
    out.push(e);
    used.push(e.id);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Effect resolution                                                   */
/* ------------------------------------------------------------------ */

const NUMERIC_KEYS = [
  "ovr", "trust", "formShift", "marketPct", "reputationShift", "appsPct",
  "injuryRisk", "retirementRisk", "transferPush", "wagePct",
] as const;

/** Sum numeric effects, last-wins for flags and one-shot fields. */
export function mergeEffects(list: EventEffects[]): EventEffects {
  const out: EventEffects = {};
  const attrs = new Map<string, number>();
  for (const e of list) {
    for (const k of NUMERIC_KEYS) {
      const v = e[k];
      if (typeof v === "number") out[k] = (out[k] ?? 0) + v;
    }
    for (const a of e.attrs ?? []) attrs.set(a.label, (attrs.get(a.label) ?? 0) + a.delta);
    if (e.trait) out.trait = e.trait;
    if (e.positionChange) out.positionChange = e.positionChange;
    if (e.captain !== undefined) out.captain = e.captain;
    if (e.nationalCallUp) out.nationalCallUp = true;
    if (e.loanMove) out.loanMove = true;
    if (e.intlRetire) out.intlRetire = true;
    if (e.retire) out.retire = true;
    if (e.shirtNumber !== undefined) out.shirtNumber = e.shirtNumber;
  }
  if (attrs.size) out.attrs = [...attrs].map(([label, delta]) => ({ label, delta }));
  return out;
}

/**
 * The effects that actually apply: the event's unavoidable base, plus the
 * chosen choice. An unanswered decision falls back to its FIRST choice, so a
 * chapter can always resolve without stalling the 5-10 minute career.
 */
export function resolveEffects(def: CareerEventDef, choiceId?: string): EventEffects {
  const parts: EventEffects[] = [];
  if (def.effects) parts.push(def.effects);
  if (def.choices?.length) {
    const chosen = def.choices.find((c) => c.id === choiceId) ?? def.choices[0];
    parts.push(chosen.effects);
  }
  return mergeEffects(parts);
}

/** The choice a player picked (or the safe default) for rendering the outcome. */
export function choiceOf(def: CareerEventDef, choiceId?: string): EventChoice | null {
  if (!def.choices?.length) return null;
  return def.choices.find((c) => c.id === choiceId) ?? def.choices[0];
}
