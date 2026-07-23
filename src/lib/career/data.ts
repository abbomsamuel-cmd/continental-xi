import type { CareerPositionId, ClubRef } from "./types";

/* ------------------------------------------------------------------ */
/*  Country flags — one map, used by the CountryFlag component and     */
/*  everywhere a nation is shown. Emoji keeps proportions consistent   */
/*  and never 404s; swap for custom shields later without touching     */
/*  call sites.                                                        */
/* ------------------------------------------------------------------ */
export const COUNTRY_FLAG: Record<string, string> = {
  Argentina: "🇦🇷", Brazil: "🇧🇷", Uruguay: "🇺🇾", Colombia: "🇨🇴", Chile: "🇨🇱",
  Peru: "🇵🇪", Ecuador: "🇪🇨", Mexico: "🇲🇽", "United States": "🇺🇸", Canada: "🇨🇦",
  Spain: "🇪🇸", England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", France: "🇫🇷", Germany: "🇩🇪", Italy: "🇮🇹",
  Portugal: "🇵🇹", Netherlands: "🇳🇱", Belgium: "🇧🇪", Croatia: "🇭🇷", Poland: "🇵🇱",
  Denmark: "🇩🇰", Sweden: "🇸🇪", Norway: "🇳🇴", Switzerland: "🇨🇭", Austria: "🇦🇹",
  Serbia: "🇷🇸", Turkey: "🇹🇷", Greece: "🇬🇷", Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", Wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  Ireland: "🇮🇪", Nigeria: "🇳🇬", Senegal: "🇸🇳", Ghana: "🇬🇭", "Ivory Coast": "🇨🇮",
  Cameroon: "🇨🇲", Morocco: "🇲🇦", Egypt: "🇪🇬", Algeria: "🇩🇿", Japan: "🇯🇵",
  "South Korea": "🇰🇷", Australia: "🇦🇺", Paraguay: "🇵🇾", Venezuela: "🇻🇪", Bolivia: "🇧🇴",
};

/** Nations a player can be from (creation Step 1). Football-first ordering. */
export const NATIONALITIES: string[] = [
  "Argentina", "Brazil", "Colombia", "Uruguay", "Chile", "Mexico", "United States",
  "Spain", "England", "France", "Germany", "Italy", "Portugal", "Netherlands",
  "Belgium", "Croatia", "Poland", "Denmark", "Sweden", "Norway", "Serbia",
  "Turkey", "Scotland", "Ireland", "Nigeria", "Senegal", "Ghana", "Ivory Coast",
  "Cameroon", "Morocco", "Egypt", "Japan", "South Korea", "Australia",
];

/* ------------------------------------------------------------------ */
/*  Positions — each one explains its job, so creation is a football   */
/*  decision, not a form field.                                        */
/* ------------------------------------------------------------------ */
export type PositionGroup = "GK" | "DEF" | "MID" | "ATT";

export interface PositionInfo {
  id: CareerPositionId;
  name: string;
  group: PositionGroup;
  responsibilities: string;
  style: string;
  attributes: string[];
}

export const POSITIONS: PositionInfo[] = [
  { id: "GK", name: "Goalkeeper", group: "GK",
    responsibilities: "Command the box, keep clean sheets, start attacks from the back.",
    style: "The last line — calm, decisive, a shot-stopper who reads danger early.",
    attributes: ["Reflexes", "Handling", "Positioning", "Distribution"] },
  { id: "RB", name: "Right-Back", group: "DEF",
    responsibilities: "Lock down the right flank and overlap to support the attack.",
    style: "A modern full-back — defends one-on-one, then bombs forward.",
    attributes: ["Pace", "Stamina", "Crossing", "Defending"] },
  { id: "CB", name: "Centre-Back", group: "DEF",
    responsibilities: "Anchor the defence, win duels, marshal the back line.",
    style: "The wall — aerially dominant, composed, a leader at the back.",
    attributes: ["Defending", "Heading", "Strength", "Composure"] },
  { id: "LB", name: "Left-Back", group: "DEF",
    responsibilities: "Own the left flank, defend and provide width going forward.",
    style: "Relentless up and down the touchline, delivery from deep.",
    attributes: ["Pace", "Stamina", "Crossing", "Defending"] },
  { id: "CDM", name: "Defensive Midfielder", group: "MID",
    responsibilities: "Shield the defence, break up play, recycle possession.",
    style: "The metronome and the destroyer — reads the game two moves ahead.",
    attributes: ["Interceptions", "Passing", "Positioning", "Strength"] },
  { id: "CM", name: "Central Midfielder", group: "MID",
    responsibilities: "Link defence and attack, dictate tempo, cover every blade.",
    style: "The engine — box-to-box, technical, tireless.",
    attributes: ["Passing", "Stamina", "Vision", "Dribbling"] },
  { id: "CAM", name: "Attacking Midfielder", group: "MID",
    responsibilities: "Create between the lines, thread the final ball, arrive late.",
    style: "The playmaker — unlocks low blocks with a single pass or run.",
    attributes: ["Vision", "Passing", "Dribbling", "Finishing"] },
  { id: "RW", name: "Right Winger", group: "ATT",
    responsibilities: "Beat your man, cut inside, stretch and terrorise defences.",
    style: "Direct, electric, decisive in the final third.",
    attributes: ["Pace", "Dribbling", "Finishing", "Crossing"] },
  { id: "LW", name: "Left Winger", group: "ATT",
    responsibilities: "Isolate the full-back, drive at goal, deliver and score.",
    style: "A game-breaker on the flank — flair with an end product.",
    attributes: ["Pace", "Dribbling", "Finishing", "Crossing"] },
  { id: "ST", name: "Striker", group: "ATT",
    responsibilities: "Lead the line, stretch defences, and above all — score.",
    style: "The finisher — cold in front of goal, alive in the box.",
    attributes: ["Finishing", "Positioning", "Composure", "Strength"] },
];

export const positionById = (id: CareerPositionId) => POSITIONS.find((p) => p.id === id)!;

/* ------------------------------------------------------------------ */
/*  Archetypes — the character of a player within a position.          */
/* ------------------------------------------------------------------ */
export interface Archetype { id: string; label: string; desc: string }

export const ARCHETYPES: Record<CareerPositionId, Archetype[]> = {
  GK: [
    { id: "shot-stopper", label: "Shot-Stopper", desc: "Lightning reflexes, keeps you in games single-handedly." },
    { id: "sweeper-keeper", label: "Sweeper-Keeper", desc: "Starts high, reads danger, begins attacks with his feet." },
  ],
  RB: [
    { id: "wing-back", label: "Attacking Wing-Back", desc: "A relentless overlapper who provides width and crosses." },
    { id: "full-back", label: "Defensive Full-Back", desc: "Solid, disciplined, wins his flank first and foremost." },
  ],
  CB: [
    { id: "stopper", label: "Stopper", desc: "Aggressive, front-foot defending — steps out and wins the ball." },
    { id: "sweeper", label: "Sweeper", desc: "Reads the game, covers space behind, calm under pressure." },
    { id: "ball-playing", label: "Ball-Playing Defender", desc: "Breaks lines with passing, builds from the back." },
  ],
  LB: [
    { id: "wing-back", label: "Attacking Wing-Back", desc: "A relentless overlapper who provides width and crosses." },
    { id: "full-back", label: "Defensive Full-Back", desc: "Solid, disciplined, wins his flank first and foremost." },
  ],
  CDM: [
    { id: "ball-winner", label: "Ball-Winner", desc: "The destroyer — breaks up play and protects the back four." },
    { id: "regista", label: "Regista", desc: "A deep-lying playmaker who dictates from in front of the defence." },
    { id: "anchor", label: "Anchor Man", desc: "Positional discipline, holds the shape, rarely out of place." },
  ],
  CM: [
    { id: "box-to-box", label: "Box-to-Box", desc: "Covers every blade of grass — defends and joins the attack." },
    { id: "deep-playmaker", label: "Deep Playmaker", desc: "Sets the tempo and sprays passes from a withdrawn role." },
    { id: "mezzala", label: "Mezzala", desc: "Ventures into the half-spaces, arrives late in the box." },
  ],
  CAM: [
    { id: "playmaker", label: "Classic No. 10", desc: "Operates between the lines and delivers the killer pass." },
    { id: "shadow-striker", label: "Shadow Striker", desc: "Ghosts into the box, a genuine goal threat from midfield." },
  ],
  RW: [
    { id: "inside-forward", label: "Inside Forward", desc: "Cuts in onto his stronger foot to shoot and create." },
    { id: "traditional", label: "Traditional Winger", desc: "Hugs the line, beats his man, whips in crosses." },
    { id: "direct-runner", label: "Direct Runner", desc: "Pure pace and directness — runs in behind relentlessly." },
  ],
  LW: [
    { id: "inside-forward", label: "Inside Forward", desc: "Cuts in onto his stronger foot to shoot and create." },
    { id: "traditional", label: "Traditional Winger", desc: "Hugs the line, beats his man, whips in crosses." },
    { id: "creative", label: "Creative Winger", desc: "Drifts inside to link play and unlock defences." },
  ],
  ST: [
    { id: "poacher", label: "Poacher", desc: "Lives on the shoulder, ruthless inside the box." },
    { id: "target-man", label: "Target Man", desc: "Holds it up, wins everything in the air, brings others in." },
    { id: "complete-forward", label: "Complete Forward", desc: "Scores, creates, presses — leads the line every way." },
    { id: "false-9", label: "False 9", desc: "Drops deep to overload midfield and drag markers out." },
    { id: "pressing-forward", label: "Pressing Forward", desc: "The first defender — hunts the ball high up the pitch." },
  ],
};

export const archetypesFor = (pos: CareerPositionId) => ARCHETYPES[pos];
export const archetypeById = (pos: CareerPositionId, id: string) =>
  ARCHETYPES[pos].find((a) => a.id === id) ?? ARCHETYPES[pos][0];

/* ------------------------------------------------------------------ */
/*  Leagues & clubs — the world a career unfolds in. Original crest    */
/*  art (colours + code), tiers drive reputation and later the engine. */
/* ------------------------------------------------------------------ */
export interface League { id: string; name: string; country: string; clubs: ClubRef[] }

// compact authoring: [name, short, tier, colour1, colour2]
type RawClub = [string, string, number, string, string];

function league(id: string, name: string, country: string, raw: RawClub[]): League {
  return {
    id, name, country,
    clubs: raw.map(([cn, short, tier, c1, c2]) => ({
      id: `${id}-${short.toLowerCase()}`,
      name: cn, short, country, colors: [c1, c2] as [string, string], leagueId: id, tier,
    })),
  };
}

export const LEAGUES: League[] = [
  league("arg", "Primera División", "Argentina", [
    ["Boca Juniors", "BOC", 4, "#0a1a6b", "#f5c518"],
    ["River Plate", "RIV", 4, "#e2001a", "#ffffff"],
    ["Racing Club", "RAC", 3, "#6cabdd", "#ffffff"],
    ["Independiente", "IND", 3, "#e2001a", "#111111"],
    ["Vélez Sarsfield", "VEL", 3, "#1e4fbf", "#ffffff"],
    ["Estudiantes", "EST", 2, "#e2001a", "#ffffff"],
    ["Banfield", "BAN", 2, "#0a7d3c", "#ffffff"],
  ]),
  league("bra", "Brasileirão", "Brazil", [
    ["Flamengo", "FLA", 4, "#c52613", "#111111"],
    ["Palmeiras", "PAL", 4, "#0a7d3c", "#ffffff"],
    ["São Paulo", "SAO", 3, "#e2001a", "#111111"],
    ["Corinthians", "COR", 3, "#111111", "#ffffff"],
    ["Grêmio", "GRE", 3, "#1a3aa8", "#111111"],
    ["Fluminense", "FLU", 2, "#7a1530", "#0a7d3c"],
    ["Santos", "SAN", 2, "#111111", "#ffffff"],
  ]),
  league("esp", "LaLiga", "Spain", [
    ["Real Madrid", "RMA", 5, "#ffffff", "#d4af37"],
    ["Barcelona", "BAR", 5, "#0a3a8b", "#a50044"],
    ["Atlético Madrid", "ATM", 4, "#cb2027", "#1a3d94"],
    ["Sevilla", "SEV", 3, "#e2001a", "#ffffff"],
    ["Real Sociedad", "RSO", 3, "#1a53b0", "#ffffff"],
    ["Valencia", "VAL", 2, "#f7a600", "#111111"],
    ["Villarreal", "VIL", 2, "#ffe667", "#005ca9"],
  ]),
  league("eng", "Premier League", "England", [
    ["Manchester City", "MCI", 5, "#6cabdd", "#ffffff"],
    ["Manchester United", "MUN", 5, "#da020e", "#111111"],
    ["Liverpool", "LIV", 5, "#c8102e", "#00b2a9"],
    ["Arsenal", "ARS", 4, "#ef0107", "#ffffff"],
    ["Chelsea", "CHE", 4, "#034694", "#ffffff"],
    ["Tottenham", "TOT", 3, "#ffffff", "#132257"],
    ["Newcastle", "NEW", 3, "#111111", "#ffffff"],
  ]),
  league("ger", "Bundesliga", "Germany", [
    ["Bayern München", "BAY", 5, "#dc052d", "#0066b2"],
    ["Borussia Dortmund", "DOR", 4, "#fde100", "#111111"],
    ["RB Leipzig", "RBL", 4, "#dd0741", "#001f47"],
    ["Bayer Leverkusen", "LEV", 4, "#e32219", "#111111"],
    ["Eintracht Frankfurt", "SGE", 3, "#111111", "#e1000f"],
    ["Wolfsburg", "WOB", 2, "#65b32e", "#ffffff"],
    ["Stuttgart", "STU", 2, "#e30613", "#ffffff"],
  ]),
  league("ita", "Serie A", "Italy", [
    ["Inter", "INT", 5, "#0a1a6b", "#111111"],
    ["Juventus", "JUV", 4, "#111111", "#ffffff"],
    ["AC Milan", "MIL", 4, "#a50021", "#111111"],
    ["Napoli", "NAP", 4, "#12a0d7", "#ffffff"],
    ["AS Roma", "ROM", 3, "#8e1111", "#f0bc42"],
    ["Lazio", "LAZ", 3, "#87d8f7", "#ffffff"],
    ["Atalanta", "ATA", 3, "#1a61a8", "#111111"],
  ]),
  league("fra", "Ligue 1", "France", [
    ["Paris SG", "PSG", 5, "#0a1a4f", "#e30613"],
    ["Marseille", "OM", 3, "#2faee0", "#ffffff"],
    ["Monaco", "MON", 3, "#e30613", "#ffffff"],
    ["Lyon", "LYO", 3, "#ffffff", "#e30613"],
    ["Lille", "LIL", 3, "#e01e13", "#ffffff"],
    ["Nice", "NIC", 2, "#111111", "#e30613"],
    ["Rennes", "REN", 2, "#111111", "#e30613"],
  ]),
  league("por", "Primeira Liga", "Portugal", [
    ["Benfica", "BEN", 4, "#e30613", "#ffffff"],
    ["Porto", "POR", 4, "#004b9e", "#ffffff"],
    ["Sporting CP", "SCP", 4, "#0a7d3c", "#ffffff"],
    ["Braga", "BRA", 3, "#e30613", "#ffffff"],
    ["Vitória SC", "VIT", 2, "#ffffff", "#111111"],
    ["Boavista", "BOA", 2, "#111111", "#ffffff"],
  ]),
  league("ned", "Eredivisie", "Netherlands", [
    ["Ajax", "AJA", 4, "#d2122e", "#ffffff"],
    ["PSV", "PSV", 4, "#ee2e24", "#ffffff"],
    ["Feyenoord", "FEY", 4, "#e30613", "#ffffff"],
    ["AZ Alkmaar", "AZ", 2, "#e30613", "#ffffff"],
    ["Twente", "TWE", 2, "#e30613", "#ffffff"],
    ["Utrecht", "UTR", 2, "#e30613", "#111111"],
  ]),
  league("usa", "Major League Soccer", "United States", [
    ["Inter Miami", "MIA", 3, "#f4b8cb", "#111111"],
    ["LA Galaxy", "LAG", 3, "#00245d", "#ffd200"],
    ["LAFC", "LFC", 3, "#111111", "#c39e6d"],
    ["Seattle Sounders", "SEA", 2, "#5d9741", "#005595"],
    ["Atlanta United", "ATL", 2, "#a01e2b", "#111111"],
    ["Austin FC", "AUS", 2, "#00b140", "#111111"],
  ]),
  league("mex", "Liga MX", "Mexico", [
    ["Club América", "AME", 4, "#ffe100", "#0a1a6b"],
    ["Guadalajara", "GDL", 3, "#e2001a", "#ffffff"],
    ["Monterrey", "MTY", 3, "#00256b", "#ffffff"],
    ["Tigres UANL", "TIG", 3, "#ffb81c", "#00274c"],
    ["Cruz Azul", "CAZ", 3, "#1a53b0", "#ffffff"],
    ["Pumas UNAM", "PUM", 2, "#00224e", "#e8a800"],
  ]),
];

export const leagueById = (id: string) => LEAGUES.find((l) => l.id === id);
export const clubById = (id: string): ClubRef | undefined => {
  for (const l of LEAGUES) {
    const c = l.clubs.find((x) => x.id === id);
    if (c) return c;
  }
  return undefined;
};
export const ALL_CLUBS: ClubRef[] = LEAGUES.flatMap((l) => l.clubs);
