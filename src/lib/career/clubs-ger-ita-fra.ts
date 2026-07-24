import { worldLeague, type WorldLeague } from "./world-types";

/* ------------------------------------------------------------------ */
/*  The German, Italian and French pyramids — six leagues, top two     */
/*  tiers of each: Bundesliga / 2. Bundesliga, Serie A / Serie B and   */
/*  Ligue 1 / Ligue 2. Reputation is the only dial that matters here;  */
/*  budgets, wages and squad quality all fall out of it inside         */
/*  `worldLeague()`, so a club is one readable line.                   */
/*  Tuple: [name, short, reputation, colour1, colour2, recruitment,    */
/*          needs, objective]                                          */
/* ------------------------------------------------------------------ */

export const GER_ITA_FRA_LEAGUES: WorldLeague[] = [
  /* ---------------- Germany · Bundesliga ---------------- */
  worldLeague("ger-bl", "Bundesliga", "Germany", 1, 94, [
    ["Bayern München", "BAY", 98, "#dc052d", "#0066b2", "elite", ["CB", "RW"], "Win the Champions League"],
    ["Borussia Dortmund", "DOR", 89, "#fde100", "#111111", "development", ["ST", "CB"], "Challenge for the title and develop the next star"],
    ["Bayer Leverkusen", "LEV", 88, "#e32219", "#111111", "development", ["CAM", "LB"], "Return to the Champions League places"],
    ["RB Leipzig", "RBL", 85, "#dd0741", "#001f47", "development", ["ST", "CDM"], "Sign young talent and finish in the top four"],
    ["Eintracht Frankfurt", "SGE", 82, "#111111", "#e1000f", "development", ["ST", "CM"], "Qualify for Europe and sell on at a profit"],
    ["VfB Stuttgart", "STU", 80, "#e30613", "#ffffff", "development", ["RW", "CB"], "Back into the Champions League"],
    ["SC Freiburg", "SCF", 76, "#e2001a", "#111111", "development", ["CM", "LW"], "Punch above our budget and reach Europe"],
    ["Borussia Mönchengladbach", "BMG", 74, "#ffffff", "#00843d", "midTable", ["CAM", "CB"], "Climb back into the top half"],
    ["VfL Wolfsburg", "WOB", 74, "#65b32e", "#ffffff", "midTable", ["ST", "LB"], "Finish in the European places"],
    ["Werder Bremen", "SVW", 73, "#1d9053", "#ffffff", "midTable", ["CDM", "ST"], "A comfortable mid-table season"],
    ["TSG Hoffenheim", "TSG", 71, "#1961b5", "#ffffff", "development", ["CAM", "RB"], "Build around young players and stay clear of trouble"],
    ["1. FSV Mainz 05", "M05", 70, "#c3141e", "#ffffff", "midTable", ["ST", "CM"], "Consolidate in the top flight"],
    ["Hamburger SV", "HSV", 70, "#003da5", "#ffffff", "survival", ["CB", "ST"], "Establish ourselves back in the Bundesliga"],
    ["1. FC Union Berlin", "FCU", 69, "#eb1923", "#ffe500", "survival", ["ST", "CDM"], "Stay in the Bundesliga"],
    ["1. FC Köln", "KOE", 69, "#ffffff", "#e2001a", "survival", ["CM", "LW"], "Survive in the top flight"],
    ["FC Augsburg", "FCA", 68, "#c8102e", "#00693c", "midTable", ["RW", "CB"], "Secure safety with games to spare"],
    ["FC St. Pauli", "STP", 64, "#6b3f24", "#ffffff", "survival", ["ST", "CB"], "Stay up and keep the Millerntor bouncing"],
    ["1. FC Heidenheim", "FCH", 62, "#e2001a", "#003da5", "survival", ["ST", "GK"], "Beat the drop again"],
  ]),

  /* ---------------- Germany · 2. Bundesliga ---------------- */
  worldLeague("ger-b2", "2. Bundesliga", "Germany", 2, 62, [
    ["FC Schalke 04", "S04", 68, "#004d9d", "#ffffff", "promotion", ["ST", "CB"], "Get this club back where it belongs"],
    ["Hertha BSC", "BSC", 66, "#005ca9", "#ffffff", "promotion", ["CAM", "ST"], "Win promotion back to the Bundesliga"],
    ["VfL Bochum", "BOC", 64, "#0a4595", "#ffffff", "promotion", ["ST", "CM"], "Bounce straight back up"],
    ["1. FC Nürnberg", "FCN", 62, "#ad1220", "#111111", "promotion", ["CB", "RW"], "Challenge for automatic promotion"],
    ["Fortuna Düsseldorf", "F95", 62, "#e2001a", "#ffffff", "promotion", ["ST", "LB"], "Reach the promotion play-off"],
    ["Hannover 96", "H96", 62, "#00963f", "#111111", "promotion", ["CM", "ST"], "Push for promotion at last"],
    ["1. FC Kaiserslautern", "FCK", 61, "#e2001a", "#ffffff", "promotion", ["ST", "CDM"], "Return to the Bundesliga"],
    ["Holstein Kiel", "KIE", 60, "#003c7d", "#ffffff", "survival", ["CB", "GK"], "Rebuild after relegation"],
    ["Karlsruher SC", "KSC", 59, "#005ca9", "#ffffff", "midTable", ["RW", "CB"], "Finish in the top half"],
    ["SC Paderborn 07", "SCP", 58, "#0a3b7c", "#ffffff", "development", ["CAM", "LW"], "Develop young players and gatecrash the top six"],
    ["SV Darmstadt 98", "D98", 57, "#004b93", "#ffffff", "midTable", ["ST", "CM"], "A solid, stable season"],
    ["1. FC Magdeburg", "FCM", 57, "#004b93", "#ffffff", "development", ["CAM", "RB"], "Play brave football and surprise the division"],
    ["SpVgg Greuther Fürth", "SGF", 56, "#00954c", "#ffffff", "midTable", ["CB", "ST"], "Comfortable mid-table finish"],
    ["SV Elversberg", "SVE", 55, "#c8102e", "#111111", "development", ["CM", "LW"], "Keep overachieving with young legs"],
    ["Arminia Bielefeld", "DSC", 55, "#004b93", "#ffffff", "survival", ["ST", "CDM"], "Stay in the second tier"],
    ["Dynamo Dresden", "SGD", 55, "#f8e100", "#111111", "survival", ["CB", "ST"], "Survive in front of a full Rudolf-Harbig"],
    ["Eintracht Braunschweig", "EBS", 54, "#f8b200", "#003da5", "survival", ["GK", "ST"], "Avoid relegation"],
    ["Preußen Münster", "PRM", 53, "#007a3d", "#ffffff", "survival", ["CB", "CM"], "Beat the drop in our first full campaign back"],
  ]),

  /* ---------------- Italy · Serie A ---------------- */
  worldLeague("ita-sa", "Serie A", "Italy", 1, 94, [
    ["Inter", "INT", 92, "#0a1a6b", "#111111", "elite", ["ST", "LB"], "Win the Scudetto and go deep in Europe"],
    ["Juventus", "JUV", 90, "#111111", "#ffffff", "elite", ["CM", "ST"], "Reclaim the Scudetto"],
    ["AC Milan", "MIL", 90, "#a50021", "#111111", "elite", ["ST", "CDM"], "Win the league and return to the Champions League"],
    ["Napoli", "NAP", 90, "#12a0d7", "#ffffff", "elite", ["RW", "CB"], "Defend the Scudetto"],
    ["Atalanta", "ATA", 86, "#1a61a8", "#111111", "development", ["ST", "CAM"], "Champions League football again"],
    ["AS Roma", "ROM", 84, "#8e1111", "#f0bc42", "midTable", ["ST", "RB"], "Return to the Champions League places"],
    ["Lazio", "LAZ", 82, "#87d8f7", "#ffffff", "midTable", ["CM", "ST"], "Qualify for Europe"],
    ["Fiorentina", "FIO", 80, "#6a2c8f", "#ffffff", "development", ["ST", "CDM"], "Break into the European places and win a trophy"],
    ["Bologna", "BOL", 78, "#a5122a", "#1a2a5e", "development", ["CAM", "CB"], "Prove Europe was no fluke"],
    ["Torino", "TOR", 72, "#7b1a1a", "#ffffff", "midTable", ["ST", "CAM"], "Finish in the top half"],
    ["Como", "COM", 72, "#005bac", "#ffffff", "development", ["LW", "CM"], "Build a young side and climb the table"],
    ["Udinese", "UDI", 70, "#111111", "#ffffff", "development", ["ST", "CB"], "Sign talent early and sell high"],
    ["Genoa", "GEN", 68, "#a01e2b", "#002d62", "survival", ["ST", "CM"], "Secure Serie A safety"],
    ["Cagliari", "CAG", 66, "#a4193d", "#002855", "survival", ["ST", "GK"], "Stay in Serie A"],
    ["Parma", "PAR", 66, "#f8d000", "#003da5", "development", ["CB", "RW"], "Keep the youngest squad in Italy up"],
    ["Sassuolo", "SAS", 65, "#00a04a", "#111111", "development", ["CAM", "LB"], "Establish ourselves back in Serie A"],
    ["Hellas Verona", "VER", 64, "#f8d000", "#003da5", "survival", ["ST", "CB"], "Avoid relegation once more"],
    ["Lecce", "LEC", 63, "#f8d000", "#e2001a", "survival", ["CDM", "ST"], "Survive in the top flight"],
    ["Pisa", "PIS", 58, "#111111", "#003da5", "survival", ["ST", "CB"], "Stay up in our first season back"],
    ["Cremonese", "CRE", 58, "#c8102e", "#8a8d8f", "survival", ["GK", "ST"], "Beat the drop"],
  ]),

  /* ---------------- Italy · Serie B ---------------- */
  worldLeague("ita-sb", "Serie B", "Italy", 2, 60, [
    ["Sampdoria", "SAM", 63, "#1b5aa8", "#ffffff", "promotion", ["ST", "CB"], "Drag this club back to Serie A"],
    ["Palermo", "PAL", 62, "#f4a7c0", "#111111", "promotion", ["ST", "CAM"], "Win promotion to Serie A"],
    ["Monza", "MZA", 62, "#e2001a", "#ffffff", "promotion", ["CM", "ST"], "Bounce straight back to Serie A"],
    ["Empoli", "EMP", 61, "#005ca9", "#ffffff", "development", ["CAM", "ST"], "Promote from within and go up again"],
    ["Venezia", "VEN", 60, "#111111", "#f57c00", "development", ["LW", "CB"], "Play attractive football and win promotion"],
    ["Spezia", "SPE", 58, "#111111", "#ffffff", "promotion", ["ST", "CDM"], "Reach the promotion play-offs"],
    ["Bari", "BAR", 58, "#e2001a", "#ffffff", "promotion", ["ST", "RB"], "End the wait for Serie A"],
    ["Frosinone", "FRO", 57, "#f8d000", "#005ca9", "midTable", ["CM", "CB"], "Challenge for the play-off places"],
    ["Catanzaro", "CAT", 55, "#f8d000", "#e2001a", "midTable", ["ST", "LW"], "Finish in the top half"],
    ["Cesena", "CES", 54, "#ffffff", "#111111", "midTable", ["CB", "ST"], "Consolidate in Serie B"],
    ["Modena", "MOD", 54, "#f8d000", "#005ca9", "midTable", ["CAM", "CDM"], "A steady mid-table season"],
    ["Reggiana", "REG", 53, "#a01e2b", "#ffffff", "survival", ["ST", "GK"], "Stay in Serie B"],
    ["Padova", "PAD", 52, "#ffffff", "#c8102e", "survival", ["CB", "ST"], "Survive in our first year back"],
    ["Pescara", "PES", 52, "#005ca9", "#ffffff", "survival", ["CM", "CB"], "Avoid the drop"],
    ["Avellino", "AVE", 52, "#00954c", "#ffffff", "survival", ["ST", "CDM"], "Keep Avellino in Serie B"],
    ["Südtirol", "SUD", 52, "#ffffff", "#e2001a", "survival", ["ST", "LB"], "Another season of safety"],
    ["Juve Stabia", "JST", 51, "#f8d000", "#111111", "survival", ["CB", "CM"], "Beat relegation on the smallest budget"],
    ["Virtus Entella", "ENT", 50, "#005ca9", "#f8d000", "survival", ["ST", "GK"], "Stay up"],
    ["Carrarese", "CAR", 50, "#f8d000", "#005ca9", "survival", ["CB", "ST"], "Survive in Serie B"],
    ["Mantova", "MAN", 50, "#e2001a", "#ffffff", "survival", ["CM", "ST"], "Avoid relegation"],
  ]),

  /* ---------------- France · Ligue 1 ---------------- */
  worldLeague("fra-l1", "Ligue 1", "France", 1, 88, [
    ["Paris Saint-Germain", "PSG", 96, "#0a1a4f", "#e30613", "elite", ["CB", "ST"], "Win the Champions League"],
    ["Marseille", "MAR", 84, "#2faee0", "#ffffff", "midTable", ["ST", "CDM"], "Finish second and reach the Champions League"],
    ["Monaco", "MON", 82, "#e30613", "#ffffff", "development", ["CB", "CAM"], "Develop wonderkids and finish on the podium"],
    ["Lyon", "LYO", 80, "#ffffff", "#e30613", "development", ["ST", "CB"], "Get back to the Champions League"],
    ["Lille", "LIL", 79, "#e01e13", "#003da5", "development", ["ST", "RB"], "Qualify for Europe and sell on at a profit"],
    ["Nice", "NIC", 76, "#111111", "#e30613", "development", ["CAM", "CB"], "Secure European football"],
    ["Rennes", "REN", 74, "#111111", "#e30613", "development", ["LW", "CDM"], "Back into the European places"],
    ["RC Lens", "RCL", 74, "#f8d000", "#e30613", "development", ["ST", "LB"], "Return to Europe with Bollaert behind us"],
    ["Strasbourg", "STR", 72, "#005ca9", "#ffffff", "development", ["ST", "CM"], "Trust the youngest squad in France and reach Europe"],
    ["Toulouse", "TFC", 68, "#6a2c8f", "#ffffff", "development", ["ST", "CB"], "Finish in the top half and develop the next sale"],
    ["Brest", "BRE", 67, "#e30613", "#ffffff", "midTable", ["CM", "ST"], "Repeat last season's European push"],
    ["Nantes", "NAN", 66, "#f8d000", "#00954c", "midTable", ["ST", "CB"], "A calm season in mid-table"],
    ["Paris FC", "PFC", 63, "#005ca9", "#ffffff", "midTable", ["ST", "CDM"], "Establish ourselves in Ligue 1"],
    ["Auxerre", "AUX", 62, "#005ca9", "#ffffff", "survival", ["ST", "CB"], "Stay in Ligue 1"],
    ["Lorient", "LOR", 60, "#f8a800", "#111111", "survival", ["CB", "CM"], "Survive in the top flight"],
    ["Angers", "ANG", 60, "#111111", "#ffffff", "survival", ["ST", "GK"], "Beat the drop"],
    ["Le Havre", "HAC", 60, "#0a1a4f", "#87ceeb", "survival", ["ST", "CDM"], "Another season of Ligue 1 survival"],
    ["Metz", "MET", 59, "#7a0d1e", "#ffffff", "survival", ["CB", "ST"], "Avoid relegation"],
  ]),

  /* ---------------- France · Ligue 2 ---------------- */
  worldLeague("fra-l2", "Ligue 2", "France", 2, 56, [
    ["Saint-Étienne", "ASS", 62, "#00954c", "#ffffff", "promotion", ["ST", "CB"], "Win promotion at the first attempt"],
    ["Reims", "REI", 61, "#e30613", "#ffffff", "promotion", ["ST", "CM"], "Go straight back up to Ligue 1"],
    ["Montpellier", "MHS", 60, "#f8a800", "#005ca9", "promotion", ["CAM", "CB"], "Return to Ligue 1"],
    ["Troyes", "TRO", 55, "#005ca9", "#ffffff", "development", ["LW", "CDM"], "Develop young talent and chase the play-offs"],
    ["Clermont Foot", "CLE", 54, "#e30613", "#005ca9", "midTable", ["ST", "CB"], "Challenge for a play-off place"],
    ["Guingamp", "GUI", 53, "#e30613", "#111111", "midTable", ["ST", "RB"], "Finish in the top half"],
    ["Amiens", "AMI", 53, "#005ca9", "#ffffff", "midTable", ["CM", "ST"], "A solid mid-table campaign"],
    ["Grenoble", "GRE", 53, "#005ca9", "#e30613", "midTable", ["CB", "CAM"], "Push towards the promotion race"],
    ["Bastia", "BAS", 52, "#005ca9", "#ffffff", "survival", ["ST", "CDM"], "Stay in Ligue 2"],
    ["Dunkerque", "DUN", 52, "#005ca9", "#e30613", "midTable", ["ST", "LB"], "Consolidate after last season's surprise"],
    ["Laval", "LAV", 51, "#f8a800", "#111111", "survival", ["CB", "ST"], "Survive in Ligue 2"],
    ["Red Star", "RED", 51, "#00954c", "#ffffff", "survival", ["CM", "ST"], "Keep Red Star in the second tier"],
    ["Nancy", "NAN", 51, "#e30613", "#ffffff", "survival", ["ST", "GK"], "Avoid relegation"],
    ["Le Mans", "LMN", 50, "#e30613", "#f8d000", "survival", ["CB", "CM"], "Stay up on the smallest budget in the league"],
    ["Pau", "PAU", 50, "#f8d000", "#005ca9", "survival", ["ST", "CB"], "Beat the drop"],
    ["Rodez", "ROD", 50, "#c8102e", "#f8d000", "survival", ["CDM", "ST"], "Another year of Ligue 2 football"],
    ["Annecy", "ANN", 50, "#e30613", "#ffffff", "survival", ["ST", "CB"], "Survive the season"],
    ["Boulogne", "BOU", 50, "#e30613", "#111111", "survival", ["GK", "ST"], "Avoid an immediate return to National"],
  ]),
];
