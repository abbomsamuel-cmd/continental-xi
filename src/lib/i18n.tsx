"use client";

/**
 * Lightweight EN/ES internationalisation for a fully static export.
 *
 * There is no server, so the language lives in localStorage and is applied on
 * the client after mount. The provider renders English on the server and the
 * first client paint (matching the static HTML), then swaps to the stored /
 * browser language once mounted — standard for static i18n and avoids any
 * hydration mismatch.
 *
 * Usage:
 *   const t = useT();
 *   t("nav.home")                    → "Home" | "Inicio"
 *   t("draft.pickOf", { n: 3, total: 11 })  → interpolates {n}/{total}
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

export type Lang = "en" | "es";
export const LANGS: { id: Lang; label: string; full: string }[] = [
  { id: "en", label: "EN", full: "English" },
  { id: "es", label: "ES", full: "Español" },
];

const STORAGE_KEY = "cxi-lang";

type Vars = Record<string, string | number>;
type Entry = { en: string; es: string };

/* ================================================================== */
/*  Dictionary — every user-facing string that has been localised.    */
/*  Keys are namespaced by surface. Missing keys fall back to English */
/*  (or the key itself) so the app never shows a blank.               */
/* ================================================================== */
const DICT: Record<string, Entry> = {
  /* ---- navigation ---- */
  "nav.home": { en: "Home", es: "Inicio" },
  "nav.draft": { en: "Draft", es: "Sorteo" },
  "nav.tournament": { en: "Tournament", es: "Torneo" },
  "nav.international": { en: "International", es: "Selecciones" },
  "nav.daily": { en: "Daily", es: "Diario" },
  "nav.history": { en: "History", es: "Historial" },
  "nav.profile": { en: "Profile", es: "Perfil" },
  "nav.trophies": { en: "trophies", es: "trofeos" },
  "nav.toggleSound": { en: "Toggle sound", es: "Activar/silenciar sonido" },
  "nav.menu": { en: "Menu", es: "Menú" },
  "nav.language": { en: "Language", es: "Idioma" },
  /* grouped navigation */
  "nav.play": { en: "Play", es: "Jugar" },
  "nav.career": { en: "Career", es: "Carrera" },
  "nav.more": { en: "More", es: "Más" },
  "nav.play.newDraft": { en: "New Draft", es: "Nuevo Sorteo" },
  "nav.play.cl": { en: "Champions League", es: "Champions League" },
  "nav.play.euro": { en: "UEFA EURO", es: "Eurocopa" },
  "nav.play.copa": { en: "Copa América", es: "Copa América" },
  "nav.play.continue": { en: "Continue Campaign", es: "Continuar Campaña" },
  "nav.career.mode": { en: "Career Mode", es: "Modo Carrera" },
  "nav.career.tournament": { en: "Tournament", es: "Torneo" },
  "nav.career.history": { en: "Match History", es: "Historial de Partidos" },
  "nav.career.profile": { en: "Profile", es: "Perfil" },
  "nav.career.achievements": { en: "Achievements", es: "Logros" },
  "nav.more.howToPlay": { en: "How to Play", es: "Cómo Jugar" },
  "nav.more.updates": { en: "Updates", es: "Novedades" },
  "nav.more.settings": { en: "Settings", es: "Ajustes" },
  "nav.more.reportBug": { en: "Report a Bug", es: "Reportar un error" },
  "nav.group.play.hint": { en: "Start a new team", es: "Empieza un equipo" },
  "nav.group.career.hint": { en: "Your record & profile", es: "Tu palmarés y perfil" },
  "nav.group.more.hint": { en: "Help & settings", es: "Ayuda y ajustes" },

  /* bug report modal */
  "bug.title": { en: "Report a Bug", es: "Reportar un error" },
  "bug.intro": {
    en: "Found something broken? Tell us what happened — the page and device are attached automatically.",
    es: "¿Encontraste algo roto? Cuéntanos qué pasó — la página y el dispositivo se adjuntan automáticamente.",
  },
  "bug.what": { en: "What happened?", es: "¿Qué pasó?" },
  "bug.placeholder": {
    en: "Describe the bug — what you did, what you expected, what went wrong…",
    es: "Describe el error — qué hiciste, qué esperabas, qué salió mal…",
  },
  "bug.emailLabel": { en: "Your email (optional, for follow-up)", es: "Tu correo (opcional, para seguimiento)" },
  "bug.send": { en: "Send report", es: "Enviar reporte" },
  "bug.sending": { en: "Sending…", es: "Enviando…" },
  "bug.cancel": { en: "Cancel", es: "Cancelar" },
  "bug.close": { en: "Close", es: "Cerrar" },
  "bug.sentTitle": { en: "Report sent — thank you!", es: "Reporte enviado — ¡gracias!" },
  "bug.sentBody": {
    en: "We read every report. It really helps while the new features are being tested.",
    es: "Leemos cada reporte. Ayuda mucho mientras probamos las nuevas funciones.",
  },
  "bug.errorTitle": { en: "Couldn't send", es: "No se pudo enviar" },
  "bug.errorBody": { en: "Please try again in a moment.", es: "Inténtalo de nuevo en un momento." },
  "bug.notConfigured": {
    en: "Bug reporting is being set up — check back soon.",
    es: "El reporte de errores se está configurando — vuelve pronto.",
  },

  /* ---- common / shared ---- */
  "common.back": { en: "← Back", es: "← Atrás" },
  "common.selected": { en: "Selected", es: "Elegido" },
  "common.continue": { en: "Continue →", es: "Continuar →" },
  "common.save": { en: "Save", es: "Guardar" },
  "common.loading": { en: "Loading…", es: "Cargando…" },
  "common.retry": { en: "Try again", es: "Reintentar" },
  "common.wentWrong": { en: "Something went wrong", es: "Algo salió mal" },
  "common.wentWrongBody": {
    en: "This page hit an unexpected error. Your saved progress is safe on this device.",
    es: "Esta página tuvo un error inesperado. Tu progreso guardado está a salvo en este dispositivo.",
  },
  "common.reportBug": { en: "Report a Bug", es: "Reportar un error" },
  "common.historicSquads": { en: "historic squads", es: "plantillas históricas" },
  "common.editions": { en: "editions", es: "ediciones" },
  "common.pastChampions": { en: "Past Champions", es: "Campeones anteriores" },

  /* ---- language / settings ---- */
  "settings.title": { en: "Settings", es: "Ajustes" },
  "settings.language": { en: "Language", es: "Idioma" },
  "settings.languageHint": {
    en: "Switch the whole interface between English and Spanish.",
    es: "Cambia toda la interfaz entre inglés y español.",
  },
  "settings.sound": { en: "Sound effects", es: "Efectos de sonido" },
  "settings.soundOn": { en: "On", es: "Activado" },
  "settings.soundOff": { en: "Off", es: "Silenciado" },
  "settings.reportHint": {
    en: "Found something broken? Tell us — it helps while the new features are being tested.",
    es: "¿Encontraste algo roto? Cuéntanos — ayuda mientras probamos las nuevas funciones.",
  },

  /* ---- home ---- */
  "home.kicker": { en: "Football Hub", es: "Centro de Fútbol" },
  "home.welcome": { en: "Welcome back,", es: "Bienvenido," },
  "home.trophiesLabel": { en: "trophies", es: "trofeos" },
  "home.continueKicker": { en: "Continue Playing", es: "Seguir Jugando" },
  "home.next": { en: "Next", es: "Próximo" },
  "home.resume.continueTournament": { en: "Continue Tournament", es: "Continuar Torneo" },
  "home.resume.collectResult": { en: "Collect Your Result", es: "Recoge Tu Resultado" },
  "home.resume.continueDraft": { en: "Continue Draft", es: "Continuar Sorteo" },
  "home.resume.enterTournament": { en: "Enter the Tournament", es: "Entrar al Torneo" },
  "home.resume.draftInProgress": { en: "Draft in progress", es: "Sorteo en curso" },
  "home.resume.xiReady": { en: "Your XI is ready", es: "Tu once está listo" },
  "home.resume.squadReview": { en: "Squad review", es: "Revisión de plantilla" },
  "home.resume.pickOf": { en: "Pick {n} of {total}", es: "Elección {n} de {total}" },
  "stage.leaguePhase": { en: "League Phase · Matchday {n} of 8", es: "Fase de Liga · Jornada {n} de 8" },
  "stage.groupStage": { en: "Group Stage · Matchday {n} of 3", es: "Fase de Grupos · Jornada {n} de 3" },
  "stage.playoffs": { en: "Knockout Play-offs", es: "Play-offs Eliminatorios" },
  "stage.r16": { en: "Round of 16", es: "Octavos de final" },
  "stage.qf": { en: "Quarter-finals", es: "Cuartos de final" },
  "stage.sf": { en: "Semi-finals", es: "Semifinales" },
  "stage.final": { en: "The Final", es: "La Final" },
  "stage.bronze": { en: "The Bronze Final", es: "La Final de Bronce" },
  "stage.clComplete": { en: "Season complete — collect your result", es: "Temporada completa — recoge tu resultado" },
  "stage.intlComplete": { en: "Tournament complete — collect your result", es: "Torneo completo — recoge tu resultado" },
  "home.startKicker": { en: "Start Your Story", es: "Empieza Tu Historia" },
  "home.noCampaign": { en: "No active campaign — the touchline is waiting", es: "Sin campaña activa — la banda te espera" },
  "home.noCampaignBody": {
    en: "Draft an XI from seven decades of legends and take it through a full season, or lead a historic nation into a summer tournament.",
    es: "Sortea un once entre siete décadas de leyendas y llévalo por una temporada completa, o dirige a una selección histórica en un torneo de verano.",
  },
  "home.startDraft": { en: "⚡ Start New Draft", es: "⚡ Nuevo Sorteo" },
  "home.leadNation": { en: "Lead a Nation", es: "Dirige una Selección" },
  "home.qa.newDraft": { en: "New Draft", es: "Nuevo Sorteo" },
  "home.qa.daily": { en: "Daily Challenge", es: "Reto Diario" },
  "home.qa.history": { en: "Match History", es: "Historial de Partidos" },
  "home.qa.leadNation": { en: "Lead a Nation", es: "Dirige una Selección" },
  "home.qa.profile": { en: "Your Profile", es: "Tu Perfil" },
  "home.qa.career": { en: "Career Mode", es: "Modo Carrera" },
  "home.career.kicker": { en: "Player Career Mode", es: "Modo Carrera del Jugador" },
  "home.career.title.a": { en: "Live a career — ", es: "Vive una carrera — " },
  "home.career.title.b": { en: "academy to retirement", es: "de la cantera al retiro" },
  "home.career.body": {
    en: "Create a player and live an entire career in minutes: break through at a small club, earn transfers, lift trophies, survive injuries, play for your nation — and finish with a shareable Legacy Card.",
    es: "Crea un jugador y vive una carrera entera en minutos: debuta en un club pequeño, gánate traspasos, levanta títulos, supera lesiones, juega con tu selección — y termina con una Tarjeta de Legado para compartir.",
  },
  "home.career.start": { en: "Start a Career", es: "Empezar una Carrera" },
  "home.career.continue": { en: "Continue Career", es: "Continuar Carrera" },
  "home.career.view": { en: "View Timeline", es: "Ver Trayectoria" },
  "home.career.chip1": { en: "5–10 minutes", es: "5–10 minutos" },
  "home.career.chip2": { en: "Age-chapter timeline", es: "Capítulos por edad" },
  "home.career.chip3": { en: "Shareable Legacy Card", es: "Tarjeta de Legado" },
  "home.career.activeKicker": { en: "Active career", es: "Carrera activa" },
  "home.career.ageClub": { en: "Age {age} · {club}", es: "Edad {age} · {club}" },
  "home.career.retiredTag": { en: "Retired", es: "Retirado" },
  "home.career.arcLabel": { en: "Academy → Legend", es: "Cantera → Leyenda" },
  "home.daily.kicker": { en: "Daily Challenge", es: "Reto Diario" },
  "home.daily.today": { en: "Today:", es: "Hoy:" },
  "home.daily.formationIn": { en: "a {formation} in {mode} mode", es: "un {formation} en modo {mode}" },
  "home.daily.body": {
    en: "One universal draft, identical for every manager in the world today — same squads, same order, pure skill.",
    es: "Un sorteo universal, idéntico para cada entrenador del mundo hoy — mismas plantillas, mismo orden, puro talento.",
  },
  "home.daily.playToday": { en: "Play Today's Challenge →", es: "Jugar el Reto de Hoy →" },
  "home.daily.viewResult": { en: "View Today's Result", es: "Ver el Resultado de Hoy" },
  "home.daily.playedToday": { en: "✓ Played today", es: "✓ Jugado hoy" },
  "home.recent.kicker": { en: "Recent Activity", es: "Actividad Reciente" },
  "home.recent.full": { en: "Full history →", es: "Historial completo →" },
  "home.recent.empty": {
    en: "Nothing on the reel yet — your matches, trophies and drafts will appear here as you play.",
    es: "Nada en el carrete todavía — tus partidos, trofeos y sorteos aparecerán aquí mientras juegas.",
  },
  "home.comps.kicker": { en: "Featured Competitions", es: "Competiciones Destacadas" },
  "home.comps.title.a": { en: "Choose your ", es: "Elige tu " },
  "home.comps.title.b": { en: "road to glory", es: "camino a la gloria" },
  "home.comps.enter": { en: "Enter Tournament", es: "Entrar al Torneo" },
  "home.comps.previewXI": { en: "Broadcast XI style", es: "Estilo de alineación TV" },
  "home.champs.kicker": { en: "Hall of Champions", es: "Salón de Campeones" },
  "home.champs.title": { en: "Latest champions", es: "Últimos campeones" },
  "home.champs.titlesWon": { en: "{n} title{s} won", es: "{n} título{s} ganado{s}" },
  "home.champs.empty": {
    en: "The board is waiting for its first name. Win any competition and your champion XI is engraved here forever.",
    es: "El cuadro espera su primer nombre. Gana cualquier competición y tu once campeón quedará grabado aquí para siempre.",
  },
  "home.champs.claim": { en: "Claim it →", es: "Conquístalo →" },
  "home.stats.kicker": { en: "Your Numbers", es: "Tus Números" },
  "home.stats.title": { en: "Career statistics", es: "Estadísticas de carrera" },
  "home.stats.drafts": { en: "Drafts Played", es: "Sorteos Jugados" },
  "home.stats.trophies": { en: "Trophies Lifted", es: "Trofeos Levantados" },
  "home.stats.goals": { en: "Goals Scored", es: "Goles Marcados" },
  "home.stats.matches": { en: "Matches Played", es: "Partidos Jugados" },
  "home.stats.campaigns": { en: "Campaigns", es: "Campañas" },
  "home.stats.achievements": { en: "Achievements", es: "Logros" },
  "home.news.kicker": { en: "Game News", es: "Novedades" },
  "home.news.title": { en: "Latest from the touchline", es: "Lo último desde la banda" },
  "home.about.kicker": { en: "About the Game", es: "Sobre el Juego" },
  "home.about.title": { en: "What is Continental XI?", es: "¿Qué es Continental XI?" },
  "home.about.summary": {
    en: "The full story — competitions, drafting, and why it exists",
    es: "La historia completa — competiciones, sorteos y por qué existe",
  },
  "home.faq.kicker": { en: "Help", es: "Ayuda" },
  "home.faq.title": { en: "Frequently asked questions", es: "Preguntas frecuentes" },
  "home.about.readSummary": {
    en: "The full story — competitions, drafting, and why it exists",
    es: "La historia completa — competiciones, sorteos y por qué existe",
  },
  "about.p1": {
    en: "Continental XI is a free football draft game and tournament simulator where you build your ultimate team using legendary clubs and national teams from football's greatest competitions. Draft iconic players from every era, create your dream XI, and see if it has what it takes to become champions.",
    es: "Continental XI es un juego de sorteo de fútbol y simulador de torneos gratuito donde construyes tu equipo definitivo con clubes legendarios y selecciones de las mayores competiciones del fútbol. Sortea jugadores icónicos de cada época, crea tu once soñado y comprueba si tiene lo necesario para ser campeón.",
  },
  "about.p2": {
    en: "Every draft begins with a spin of the wheel, landing on real clubs or national teams from iconic seasons. Select one player from that squad, build your lineup position by position, and create a team unlike any other. Mix generations, combine football legends with modern superstars, and answer the ultimate football question: what if these players played together?",
    es: "Cada sorteo empieza con un giro que cae en clubes o selecciones reales de temporadas icónicas. Elige un jugador de esa plantilla, arma tu alineación posición por posición y crea un equipo único. Mezcla generaciones, combina leyendas con superestrellas modernas y responde a la gran pregunta: ¿y si estos jugadores jugaran juntos?",
  },
  "about.p3": {
    en: "Once your squad is complete, your journey is just beginning. Compete in realistic tournament simulations featuring authentic competition formats, league tables, knockout rounds, live match broadcasts with cinematic overlays, and dramatic trophy celebrations. Every tournament is different, every decision matters, and every match creates a new football story.",
    es: "Cuando tu plantilla está completa, tu viaje apenas empieza. Compite en simulaciones realistas con formatos auténticos, tablas de liga, eliminatorias, retransmisiones en vivo con gráficos cinematográficos y celebraciones de trofeo espectaculares. Cada torneo es distinto, cada decisión cuenta y cada partido crea una nueva historia.",
  },
  "about.p4": {
    en: "Created by football fans, Continental XI is built for anyone who loves football history, legendary players, and debating the greatest teams of all time. Unlike fantasy football, it isn't tied to current seasons — every player represents a real club or national team from a specific season, with carefully balanced ratings based on that campaign.",
    es: "Creado por aficionados, Continental XI es para quien ama la historia del fútbol, los jugadores legendarios y debatir sobre los mejores equipos de todos los tiempos. A diferencia del fantasy, no depende de la temporada actual — cada jugador representa a un club o selección real de una temporada concreta, con valoraciones cuidadosamente equilibradas de esa campaña.",
  },
  "faq.q1": { en: "What is Continental XI?", es: "¿Qué es Continental XI?" },
  "faq.a1": {
    en: "Continental XI is a free football draft game and tournament simulator where you build your ultimate team using legendary clubs and national teams. Draft iconic players from every era, create your dream XI, and see if it can become champions.",
    es: "Continental XI es un juego de sorteo de fútbol y simulador de torneos gratuito donde construyes tu equipo definitivo con clubes y selecciones legendarios. Sortea jugadores icónicos de cada época, crea tu once soñado y comprueba si puede ser campeón.",
  },
  "faq.q2": { en: "How do you play?", es: "¿Cómo se juega?" },
  "faq.a2": {
    en: "Every draft begins with a spin, landing on a real club or national team from an iconic season. Select one player from that squad, build your lineup position by position, then take your XI into a realistic tournament simulation — league tables, knockout rounds, live match broadcasts and trophy celebrations.",
    es: "Cada sorteo empieza con un giro que cae en un club o selección real de una temporada icónica. Elige un jugador de esa plantilla, arma tu alineación posición por posición y lleva tu once a una simulación realista — tablas de liga, eliminatorias, retransmisiones en vivo y celebraciones de trofeo.",
  },
  "faq.q3": { en: "Which competitions can I play?", es: "¿Qué competiciones puedo jugar?" },
  "faq.q4": { en: "Which players and clubs are included?", es: "¿Qué jugadores y clubes se incluyen?" },
  "faq.a4": {
    en: "Over 1,700 rated players across 105 legendary club squads (1960–2025), 30 historic EURO squads and 18 Copa América selecciones — from Di Stéfano's Real Madrid to modern treble winners. Each competition fields a set number per tournament: 24 nations at the EURO, 12 at the Copa América. Every player represents one specific season, and you can mix generations freely.",
    es: "Más de 1.700 jugadores valorados en 105 plantillas de clubes legendarias (1960–2025), 30 plantillas históricas de la Eurocopa y 18 selecciones de la Copa América — desde el Real Madrid de Di Stéfano hasta los tripletes modernos. Cada competición inscribe un número fijo por torneo: 24 selecciones en la Eurocopa y 12 en la Copa América. Cada jugador representa una temporada concreta y puedes mezclar generaciones con total libertad.",
  },
  "faq.q5": { en: "Is Continental XI free to play?", es: "¿Continental XI es gratis?" },
  "faq.a5": {
    en: "Yes — completely free, no accounts, no sign-up, no ads. Your saves live in your own browser and never leave your device.",
    es: "Sí — totalmente gratis, sin cuentas, sin registro, sin anuncios. Tus partidas viven en tu propio navegador y nunca salen de tu dispositivo.",
  },
  "faq.q6": { en: "Is it a fantasy football game?", es: "¿Es un juego de fantasy?" },
  "faq.a6": {
    en: "No. Unlike fantasy football, Continental XI isn't tied to current seasons or live performances. Every player represents a real club or national team from a specific campaign, with carefully balanced ratings based on how they performed that season.",
    es: "No. A diferencia del fantasy, Continental XI no depende de la temporada actual ni del rendimiento en vivo. Cada jugador representa a un club o selección real de una campaña concreta, con valoraciones equilibradas según cómo rindió esa temporada.",
  },
  "faq.q7": { en: "Is it affiliated with any league or federation?", es: "¿Está afiliado a alguna liga o federación?" },
  "faq.a7": {
    en: "No — Continental XI is an original, unofficial fan project created by football fans. It is not affiliated with UEFA, CONMEBOL, FIFA, or any club, and uses no official logos, branding or protected assets.",
    es: "No — Continental XI es un proyecto original y no oficial creado por aficionados. No está afiliado a la UEFA, la CONMEBOL, la FIFA ni club alguno, y no usa logos, marcas ni activos protegidos.",
  },
  "faq.q8": { en: "Where do the player ratings come from?", es: "¿De dónde salen las valoraciones?" },
  "faq.a8": {
    en: "Every rating is hand-balanced to reflect one exact campaign — never a career average. Full attribute profiles are derived deterministically from those season ratings, so the same player always plays the same way.",
    es: "Cada valoración se ajusta a mano para reflejar una campaña exacta — nunca un promedio de carrera. Los perfiles completos de atributos se derivan de forma determinista de esas valoraciones de temporada, así que el mismo jugador siempre juega igual.",
  },
  "faq.a3.cl": {
    en: "UEFA Champions League — build an all-time club XI and fight through the official format, from the 36-team league phase to the final.",
    es: "UEFA Champions League — construye un once de club de todos los tiempos y avanza por el formato oficial, desde la fase de liga de 36 equipos hasta la final.",
  },
  "faq.a3.euro": {
    en: "UEFA EURO — assemble a dream national team from historic European squads and guide your country through the official EURO to lift the trophy.",
    es: "Eurocopa — arma una selección soñada con plantillas europeas históricas y guía a tu país por la Eurocopa oficial hasta levantar el trofeo.",
  },
  "faq.a3.copa": {
    en: "Copa América — draft legends from South America's greatest nations, then battle through the Copa — third-place match included — to become champions.",
    es: "Copa América — sortea leyendas de las mayores selecciones sudamericanas y lucha en la Copa — con partido por el tercer puesto — hasta ser campeón.",
  },
  "home.footer.tagline": {
    en: "An original, unofficial fan project. Not affiliated with UEFA, CONMEBOL or any club. No official logos, branding or protected assets are used.",
    es: "Un proyecto original y no oficial hecho por aficionados. Sin afiliación con la UEFA, la CONMEBOL o club alguno. No se usan logos, marcas ni activos protegidos.",
  },
  "home.footer.play": { en: "Play", es: "Jugar" },
  "home.footer.explore": { en: "Explore", es: "Explorar" },
  "home.footer.stat": {
    en: "{squads} legendary squads · {players} rated players · your saves live on this device — no accounts, ever.",
    es: "{squads} plantillas legendarias · {players} jugadores valorados · tus partidas viven en este dispositivo — sin cuentas, nunca.",
  },

  /* ---- competition mode cards (home) ---- */
  "mode.cl.kicker": { en: "Club · Europe", es: "Clubes · Europa" },
  "mode.cl.title": { en: "Champions League", es: "Champions League" },
  "mode.cl.body": {
    en: "Draft legends from every European Cup era, then survive the 36-team league phase and the road to the final.",
    es: "Sortea leyendas de cada era de la Copa de Europa y sobrevive a la fase de liga de 36 equipos y al camino a la final.",
  },
  "mode.cl.chip1": { en: "36-team Swiss phase", es: "Fase suiza de 36" },
  "mode.cl.chip2": { en: "Two-leg knockouts", es: "Eliminatorias ida y vuelta" },
  "mode.cl.chip3": { en: "Tactics & suitability", es: "Táctica y adecuación" },
  "mode.euro.kicker": { en: "International · UEFA", es: "Selecciones · UEFA" },
  "mode.euro.title": { en: "UEFA EURO", es: "Eurocopa" },
  "mode.euro.body": {
    en: "Twenty-four historic national sides, six groups, a full Round of 16. Lead a nation or enter your drafted XI.",
    es: "Veinticuatro selecciones históricas, seis grupos, unos octavos completos. Dirige a una selección o inscribe tu once sorteado.",
  },
  "mode.euro.chip1": { en: "24 nations play", es: "Juegan 24 selecciones" },
  "mode.euro.chip2": { en: "Official R16 format", es: "Formato oficial de octavos" },
  "mode.copa.kicker": { en: "International · CONMEBOL", es: "Selecciones · CONMEBOL" },
  "mode.copa.title": { en: "Copa América", es: "Copa América" },
  "mode.copa.body": {
    en: "Twelve legendary selecciones fighting for the oldest prize in international football — bronze final included.",
    es: "Doce selecciones legendarias luchando por el trofeo más antiguo del fútbol internacional — con final de bronce.",
  },
  "mode.copa.chip1": { en: "12 selecciones play", es: "Juegan 12 selecciones" },
  "mode.copa.chip2": { en: "Third-place match", es: "Partido por el tercer puesto" },

  /* ---- news (home) ---- */
  "news.bilingual.title": { en: "Now in English & Spanish", es: "Ahora en inglés y español" },
  "news.bilingual.body": {
    en: "The whole interface can switch language instantly — tap 🌐 EN/ES in the navigation or Settings.",
    es: "Toda la interfaz cambia de idioma al instante — toca 🌐 EN/ES en la navegación o en Ajustes.",
  },
  "news.lineups.title": { en: "New broadcast lineups", es: "Nuevas alineaciones de TV" },
  "news.lineups.body": {
    en: "Champions League, EURO and Copa América each have their own premium lineup card design.",
    es: "Champions League, Eurocopa y Copa América tienen cada una su propio diseño premium de alineación.",
  },
  "news.shootout.title": { en: "Live penalty shootouts", es: "Tandas de penaltis en vivo" },
  "news.shootout.body": {
    en: "Watch every spot-kick unfold — Watch Live, Quick or Skip — instead of an instant result.",
    es: "Vive cada penalti — En Vivo, Rápido o Saltar — en vez de un resultado instantáneo.",
  },
  "news.mobile.title": { en: "Mobile & desktop polish", es: "Mejoras en móvil y escritorio" },
  "news.mobile.body": {
    en: "Cleaner formations, better spacing, reliable trophy celebrations and improved touch controls.",
    es: "Formaciones más limpias, mejor espaciado, celebraciones de trofeo fiables y controles táctiles mejorados.",
  },

  /* ---- draft setup ---- */
  "draft.kicker": { en: "Draft Studio", es: "Estudio de Sorteo" },
  "draft.buildA": { en: "Build a ", es: "Construye un once de " },
  "draft.buildXI": { en: " XI", es: "" },
  "draft.intro": {
    en: "Pick a position, spin for a legendary squad, then choose a player who genuinely fits the role — and where he plays. Choose your competition, shape and challenge to begin.",
    es: "Elige una posición, gira para conseguir una plantilla legendaria y escoge un jugador que encaje de verdad en el puesto — y dónde juega. Elige competición, dibujo y dificultad para empezar.",
  },
  "draft.competition": { en: "Competition", es: "Competición" },
  "draft.gameMode": { en: "Game Mode", es: "Modo de Juego" },
  "draft.formation": { en: "Formation", es: "Formación" },
  "draft.difficulty": { en: "Difficulty", es: "Dificultad" },
  "draft.begin": { en: "Begin {label} Draft →", es: "Empezar Sorteo {label} →" },
  "draft.beginCl": { en: "Begin Champions Draft →", es: "Empezar Sorteo de Champions →" },
  "draft.mode.classic.title": { en: "Classic", es: "Clásico" },
  "draft.mode.classic.tag": { en: "Show everything", es: "Muestra todo" },
  "draft.mode.classic.body": {
    en: "Ratings, all six attributes and full stats are visible on every card.",
    es: "La valoración, los seis atributos y todas las estadísticas se ven en cada carta.",
  },
  "draft.mode.expert.title": { en: "Expert", es: "Experto" },
  "draft.mode.expert.tag": { en: "Knowledge test", es: "Prueba de conocimiento" },
  "draft.mode.expert.body": {
    en: "Overall and attributes hidden. Only name, club, position and season — reward real football knowledge.",
    es: "Media y atributos ocultos. Solo nombre, club, posición y temporada — premia el conocimiento futbolístico real.",
  },
  "draft.diff.easy.title": { en: "Easy", es: "Fácil" },
  "draft.diff.easy.body": { en: "Plenty of team re-rolls to shape a dream squad.", es: "Muchos re-giros de equipo para armar la plantilla soñada." },
  "draft.diff.easy.rerolls": { en: "3 team re-rolls", es: "3 re-giros de equipo" },
  "draft.diff.easy.extra": { en: "More forgiving simulation · best for first-timers", es: "Simulación más indulgente · ideal para empezar" },
  "draft.diff.medium.title": { en: "Medium", es: "Medio" },
  "draft.diff.medium.body": { en: "A few re-rolls — pick your moments.", es: "Unos pocos re-giros — elige tus momentos." },
  "draft.diff.medium.rerolls": { en: "1 team re-roll", es: "1 re-giro de equipo" },
  "draft.diff.medium.extra": { en: "Standard simulation · recommended", es: "Simulación estándar · recomendada" },
  "draft.diff.medium.recommended": { en: "Recommended", es: "Recomendada" },
  "draft.diff.hard.title": { en: "Hard", es: "Difícil" },
  "draft.diff.hard.body": { en: "No re-rolls. Take what the reel gives you.", es: "Sin re-giros. Acepta lo que te da el carrete." },
  "draft.diff.hard.rerolls": { en: "No re-rolls", es: "Sin re-giros" },
  "draft.diff.hard.extra": { en: "Tougher opponents · higher pressure", es: "Rivales más duros · más presión" },
  "draft.note.clubs": {
    en: "Every rating is season-specific — your XI is built from player quality, position suitability, tactics and experience.",
    es: "Cada valoración es de una temporada concreta — tu once se construye con la calidad del jugador, la adecuación de posición, la táctica y la experiencia.",
  },
  "draft.note.euro": {
    en: "National-team football — your XI is judged on attack, midfield, defence, goalkeeper, experience and balance.",
    es: "Fútbol de selecciones — tu once se juzga por ataque, medio campo, defensa, portería, experiencia y equilibrio.",
  },
  "draft.note.copa": {
    en: "Pure footballing quality decides how far your selección goes — plus the tactics you choose.",
    es: "La pura calidad futbolística decide hasta dónde llega tu selección — más la táctica que elijas.",
  },

  /* ---- daily ---- */
  "daily.title.a": { en: "Daily ", es: "Reto " },
  "daily.title.b": { en: "Challenge", es: "Diario" },
  "daily.intro": {
    en: "One universal draft, the same for every manager in the world today. Identical squads, identical order — pure skill. Compare your run on the global leaderboard.",
    es: "Un sorteo universal, el mismo para cada entrenador del mundo hoy. Plantillas idénticas, orden idéntico — puro talento. Compara tu partida en la clasificación global.",
  },
  "daily.formation": { en: "Formation", es: "Formación" },
  "daily.mode": { en: "Mode", es: "Modo" },
  "daily.todaysResult": { en: "Today's result", es: "Resultado de hoy" },
  "daily.champion": { en: "🏆 Champion!", es: "🏆 ¡Campeón!" },
  "daily.reached": { en: "Reached: {stage}", es: "Alcanzó: {stage}" },
  "daily.replay": { en: "Replay Today's Draft", es: "Repetir el Sorteo de Hoy" },
  "daily.play": { en: "Play Today's Challenge →", es: "Jugar el Reto de Hoy →" },
  "daily.oneAttempt": { en: "Same teams. Same order. One attempt.", es: "Mismos equipos. Mismo orden. Un intento." },
  "daily.leaderboards": { en: "Global Leaderboards", es: "Clasificaciones Globales" },
  "daily.leaderboardsBody": {
    en: "Highest Overall · Fastest Champion · Most Goals · Daily & Weekly Champions.",
    es: "Mejor Media · Campeón Más Rápido · Más Goles · Campeones Diarios y Semanales.",
  },
  "daily.comingSoon": { en: "Global leaderboard coming soon.", es: "Clasificación global muy pronto." },
  "daily.yourBest": { en: "Your local best today:", es: "Tu mejor marca local de hoy:" },
  "daily.notPlayed": { en: "not played yet", es: "aún sin jugar" },

  /* ---- international ---- */
  "intl.kicker": { en: "National Teams", es: "Selecciones Nacionales" },
  "intl.title.a": { en: "International ", es: "Torneos " },
  "intl.title.b": { en: "Tournaments", es: "Internacionales" },
  "intl.lobbyIntro": {
    en: "Lead a historic national team through a full tournament — group stage, knockouts, and a final. Every squad rated for that exact summer.",
    es: "Dirige a una selección histórica en un torneo completo — fase de grupos, eliminatorias y final. Cada plantilla valorada para ese verano exacto.",
  },
  "intl.emptyKicker": { en: "Choose Your International Journey", es: "Elige Tu Camino Internacional" },
  "intl.emptyBody": {
    en: "Select a historic nation, build your XI, and compete in EURO or Copa América.",
    es: "Elige una selección histórica, construye tu once y compite en la Eurocopa o la Copa América.",
  },
  "intl.playEuro": { en: "Play EURO", es: "Jugar Eurocopa" },
  "intl.playCopa": { en: "Play Copa América", es: "Jugar Copa América" },
  "intl.draftYourXI": { en: "🎴 Draft Your XI →", es: "🎴 Sortea Tu Once →" },
  "intl.leadNation": { en: "Lead a Nation", es: "Dirige una Selección" },
  "intl.euroSub": { en: "European Championship", es: "Campeonato de Europa" },
  "intl.euroBlurb": {
    en: "Sixteen historic national sides. Four groups. One summer of silver.",
    es: "Dieciséis selecciones históricas. Cuatro grupos. Un verano de plata.",
  },
  "intl.copaSub": { en: "CONMEBOL", es: "CONMEBOL" },
  "intl.copaBlurb": {
    en: "Twelve legendary selecciones. Three groups. The oldest prize in football.",
    es: "Doce selecciones legendarias. Tres grupos. El trofeo más antiguo del fútbol.",
  },
  "intl.chooseNation": { en: "Choose Your Nation", es: "Elige Tu Selección" },
  "intl.chooseNationHint": {
    en: "Pick the squad you will lead — other nations draw a random vintage.",
    es: "Elige la plantilla que dirigirás — las demás selecciones sortean una época al azar.",
  },
  "intl.yourNation": { en: "Your Nation", es: "Tu Selección" },
  "intl.groupStage": { en: "Group stage", es: "Fase de grupos" },
  "intl.matchday": { en: "Matchday {n}", es: "Jornada {n}" },
  "intl.matchdayOf": { en: "Matchday {n} of 3", es: "Jornada {n} de 3" },
  "intl.play": { en: "Play {round}", es: "Jugar {round}" },
  "intl.playing": { en: "Playing…", es: "Jugando…" },
  "intl.finishSave": { en: "Finish & Save", es: "Terminar y Guardar" },
  "intl.yourMatches": { en: "Your Matches", es: "Tus Partidos" },
  "intl.abandon": { en: "Abandon Tournament", es: "Abandonar Torneo" },
  "intl.knockoutStage": { en: "Knockout Stage", es: "Fase Eliminatoria" },
  "intl.round.r16": { en: "Round of 16", es: "Octavos de final" },
  "intl.round.qf": { en: "Quarter-finals", es: "Cuartos de final" },
  "intl.round.sf": { en: "Semi-finals", es: "Semifinales" },
  "intl.round.final": { en: "The Final", es: "La Final" },
  "intl.round.bronze": { en: "The Bronze Final", es: "La Final de Bronce" },
  "intl.final.tonight": { en: "One Night · One Trophy", es: "Una Noche · Un Trofeo" },
  "intl.final.bronze": { en: "One Last Stand · Bronze", es: "Un Último Esfuerzo · Bronce" },
  "intl.final.theFinal": { en: "THE FINAL", es: "LA FINAL" },
  "intl.final.thirdMatch": { en: "THIRD-PLACE MATCH", es: "PARTIDO POR EL TERCER PUESTO" },
  "intl.kickBronze": { en: "⚽ Kick Off the Bronze Final", es: "⚽ Arrancar la Final de Bronce" },
  "intl.kickFinal": { en: "⚽ Kick Off the Final", es: "⚽ Arrancar la Final" },
  "intl.liftTrophy": { en: "Lift the Trophy", es: "Levanta el Trofeo" },
  "intl.saveReturn": { en: "Save & Return", es: "Guardar y Volver" },
  "intl.viewBracket": { en: "View bracket", es: "Ver cuadro" },
  "intl.playAgain": { en: "Play Again", es: "Jugar de Nuevo" },
  "intl.startNewDraft": { en: "Start New Draft", es: "Nuevo Sorteo" },
  "intl.returnHome": { en: "Return Home", es: "Volver al Inicio" },
  "intl.quickSim": { en: "Quick Sim", es: "Sim Rápida" },
  "intl.quickSimGroup": { en: "Sim Group Stage", es: "Sim Fase de Grupos" },
  "intl.viewFinalStats": { en: "View final match stats", es: "Ver estadísticas de la final" },
  "intl.topQualify": { en: "Top {n} + best thirds qualify", es: "Clasifican los {n} primeros + mejores terceros" },
  "intl.qualification": { en: "qualification", es: "clasificación" },
  "intl.bestThirds": { en: "best thirds", es: "mejores terceros" },
  "intl.group": { en: "Group {letter}", es: "Grupo {letter}" },
  "intl.finalShort": { en: "Final", es: "Final" },
  "intl.thirdPlace": { en: "Third Place", es: "Tercer Puesto" },
  "intl.champions": { en: "Champions", es: "Campeones" },

  /* ---- tournament / career hub ---- */
  "tour.careerHub": { en: "Career Hub", es: "Centro de Carrera" },
  "tour.noCampaign": { en: "No campaign in progress", es: "Ninguna campaña en curso" },
  "tour.noCampaignBody": {
    en: "This is where a live season runs — the table, the bracket, your record. Start a draft and it comes alive.",
    es: "Aquí transcurre una temporada en vivo — la tabla, el cuadro, tu palmarés. Empieza un sorteo y cobra vida.",
  },
  "tour.startNewDraft": { en: "⚡ Start New Draft", es: "⚡ Nuevo Sorteo" },
  "tour.activeCampaign": { en: "Active Campaign", es: "Campaña Activa" },
  "tour.intlInProgress": {
    en: "You have an international tournament in progress",
    es: "Tienes un torneo internacional en curso",
  },
  "tour.pastCampaigns": { en: "Past Campaigns", es: "Campañas Anteriores" },
  "tour.pastEmpty": {
    en: "Your career starts with the first draft — every run you finish is recorded here.",
    es: "Tu carrera empieza con el primer sorteo — cada partida que termines queda registrada aquí.",
  },
  "tour.record": { en: "Record", es: "Balance" },
  "tour.lastResult": { en: "Last Result", es: "Último Resultado" },
  "tour.nextOpponent": { en: "Next Opponent", es: "Próximo Rival" },
  "tour.managerDesk": { en: "Manager Desk", es: "Mesa del Entrenador" },
  "tour.squad": { en: "Squad", es: "Plantilla" },
  "tour.trophyCabinet": { en: "Trophy Cabinet", es: "Vitrina de Trofeos" },
  "tour.newDraft": { en: "New Draft", es: "Nuevo Sorteo" },
  "tour.viewProfile": { en: "View Profile", es: "Ver Perfil" },
  "tour.seasonStarts": { en: "The season starts now.", es: "La temporada empieza ahora." },
  "tour.campaignOver": { en: "Campaign over", es: "Campaña terminada" },
  "tour.waitingDraw": { en: "Waiting on the draw…", es: "Esperando el sorteo…" },

  /* ---- profile / stats ---- */
  "stats.titles": { en: "titles", es: "títulos" },
  "stats.drafts": { en: "drafts", es: "sorteos" },
  "stats.tab.stats": { en: "stats", es: "estadísticas" },
  "stats.tab.achievements": { en: "achievements", es: "logros" },
  "stats.tab.history": { en: "history", es: "historial" },
  "stats.tab.settings": { en: "settings", es: "ajustes" },
  "stats.welcomeKicker": { en: "New Manager", es: "Nuevo Entrenador" },
  "stats.welcomeTitle": { en: "Your manager career begins here", es: "Tu carrera de entrenador empieza aquí" },
  "stats.welcomeBody": {
    en: "Complete your first draft to unlock your career statistics, trophy cabinet, favourite formation, most-drafted players, match history and achievements.",
    es: "Completa tu primer sorteo para desbloquear tus estadísticas de carrera, la vitrina de trofeos, tu formación favorita, tus jugadores más elegidos, el historial de partidos y los logros.",
  },
  "stats.startFirst": { en: "⚡ Start First Draft", es: "⚡ Empezar Primer Sorteo" },
  "stats.unlockList": { en: "Complete your first draft to unlock:", es: "Completa tu primer sorteo para desbloquear:" },
  "stats.unlock.stats": { en: "Career statistics", es: "Estadísticas de carrera" },
  "stats.unlock.cabinet": { en: "Trophy cabinet", es: "Vitrina de trofeos" },
  "stats.unlock.formation": { en: "Favourite formation", es: "Formación favorita" },
  "stats.unlock.players": { en: "Most-drafted players", es: "Jugadores más elegidos" },
  "stats.unlock.history": { en: "Match history", es: "Historial de partidos" },
  "stats.unlock.achievements": { en: "Achievements", es: "Logros" },
  "stats.draftsPlayed": { en: "Drafts Played", es: "Sorteos Jugados" },
  "stats.clTitles": { en: "CL Titles", es: "Títulos CL" },
  "stats.finals": { en: "Finals", es: "Finales" },
  "stats.semis": { en: "Semi-finals", es: "Semifinales" },
  "stats.winPct": { en: "Win %", es: "% Victorias" },
  "stats.avgOverall": { en: "Avg Overall", es: "Media" },
  "stats.bestOverall": { en: "Best Overall", es: "Mejor Media" },
  "stats.totalGoals": { en: "Total Goals", es: "Goles Totales" },
  "stats.bestRuns": { en: "Career Best Runs", es: "Mejores Trayectorias" },
  "stats.favourites": { en: "Favourites", es: "Favoritos" },
  "stats.fav.formation": { en: "Formation", es: "Formación" },
  "stats.fav.club": { en: "Club drafted", es: "Club elegido" },
  "stats.fav.player": { en: "Most-drafted player", es: "Jugador más elegido" },
  "stats.fav.goals": { en: "Total tournament goals", es: "Goles totales en torneos" },
  "stats.noDrafts": { en: "No drafts yet. Go build an XI!", es: "Aún sin sorteos. ¡Ve a construir un once!" },
  /* ---- lobby featured CTAs + motion setting ---- */
  "intl.viewEuro": { en: "View EURO", es: "Ver Eurocopa" },
  "intl.viewCopa": { en: "View Copa América", es: "Ver Copa América" },
  "settings.motion": { en: "Motion & effects", es: "Movimiento y efectos" },
  "settings.motionHint": {
    en: "Auto trims heavy effects on phones. Reduced keeps it light everywhere; Off freezes all motion.",
    es: "Auto reduce los efectos pesados en móviles. Reducido lo mantiene ligero siempre; Sin efectos congela todo el movimiento.",
  },
  "settings.motion.auto": { en: "Auto", es: "Auto" },
  "settings.motion.full": { en: "Full", es: "Completo" },
  "settings.motion.reduced": { en: "Reduced", es: "Reducido" },
  "settings.motion.off": { en: "Off", es: "Sin efectos" },
  "settings.volume": { en: "Master volume", es: "Volumen general" },
  "settings.volumeHint": {
    en: "Stadium crowd, ball, whistles and celebrations — the atmosphere that carries the match.",
    es: "Público del estadio, balón, silbatos y celebraciones — la atmósfera que lleva el partido.",
  },
  /* ---- hidden emblems (easter eggs) ---- */
  "egg.discovered": { en: "Emblem Discovered", es: "Emblema Descubierto" },
  "egg.title": { en: "Hidden Emblems", es: "Emblemas Ocultos" },
  "egg.subtitle": {
    en: "Secret badges unlocked by fielding legendary XIs. Discover them your own way.",
    es: "Insignias secretas que se desbloquean alineando onces legendarios. Descúbrelas a tu manera.",
  },
  "egg.progress": { en: "{n} of {total} discovered", es: "{n} de {total} descubiertos" },
  "egg.locked": { en: "Undiscovered", es: "Sin descubrir" },
};

/* ================================================================== */

function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

/* ---- external language store (localStorage-backed) ------------------ *
 * Read through useSyncExternalStore so the server / first client paint is
 * always "en" (matching the static HTML) and the client hydrates to the
 * stored language with no mismatch and no setState-in-effect.               */
let currentLang: Lang | null = null;
const listeners = new Set<() => void>();

function readInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "es") return stored;
  } catch {
    /* ignore */
  }
  if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("es")) return "es";
  return "en";
}

function getClientLang(): Lang {
  if (currentLang === null) currentLang = readInitialLang();
  return currentLang;
}

function getServerLang(): Lang {
  return "en";
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function setLangGlobal(l: Lang) {
  currentLang = l;
  try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
  try { document.documentElement.lang = l; } catch { /* ignore */ }
  listeners.forEach((cb) => cb());
}

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getClientLang, getServerLang);

  // Keep <html lang> in sync (DOM sync — not React state).
  useEffect(() => {
    try { document.documentElement.lang = lang; } catch { /* ignore */ }
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangGlobal(l), []);
  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/** Returns a translate function bound to the current language. */
export function useT() {
  const { lang } = useContext(LangContext);
  return useCallback(
    (key: string, vars?: Vars): string => {
      const entry = DICT[key];
      if (!entry) return interpolate(key, vars);
      return interpolate(entry[lang] ?? entry.en, vars);
    },
    [lang],
  );
}
