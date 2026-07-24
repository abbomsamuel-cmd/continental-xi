import { worldLeague, type WorldLeague } from "./world-types";

/* ------------------------------------------------------------------ */
/*  England & Spain — the two deepest pyramids in the world database.  */
/*  Five real competitions with real second and third tiers, so a      */
/*  career can start in League One, climb the Championship and end at  */
/*  the Bernabéu. Compact tuples:                                      */
/*  [name, short, reputation, colour1, colour2, recruitment, needs,    */
/*   objective]                                                        */
/*  Reputation is the hidden 0–100 pull of the club: 100 = Real        */
/*  Madrid / Manchester City, ~60 = Championship, ~50 = League One.    */
/* ------------------------------------------------------------------ */

export const ENG_ESP_LEAGUES: WorldLeague[] = [
  /* ---------------- England · tier 1 ---------------- */
  worldLeague("eng-pl", "Premier League", "England", 1, 100, [
    ["Manchester City", "MCI", 100, "#6cabdd", "#1c2c5b", "elite", ["CB", "CM", "ST"], "Win the Premier League and the Champions League"],
    ["Liverpool", "LIV", 97, "#c8102e", "#00b2a9", "elite", ["CB", "RW", "ST"], "Win the league playing front-foot football"],
    ["Manchester United", "MUN", 94, "#da020e", "#fbe122", "elite", ["CDM", "CAM", "ST"], "Rebuild a title-winning side and return to the top four"],
    ["Chelsea", "CHE", 92, "#034694", "#ffffff", "elite", ["ST", "CB", "GK"], "Turn the youngest squad in Europe into champions"],
    ["Arsenal", "ARS", 90, "#ef0107", "#ffffff", "elite", ["ST", "LW", "CM"], "Win the Premier League"],
    ["Tottenham Hotspur", "TOT", 85, "#ffffff", "#132257", "development", ["CB", "CAM", "ST"], "Break the trophy drought with a young, hungry squad"],
    ["Newcastle United", "NEW", 84, "#241f20", "#ffffff", "elite", ["RW", "CB", "CM"], "Qualify for the Champions League every season"],
    ["Aston Villa", "AVL", 80, "#95bfe5", "#670e36", "midTable", ["ST", "LB", "CM"], "Stay in Europe and push the established elite"],
    ["Brighton & Hove Albion", "BHA", 78, "#0057b8", "#ffffff", "development", ["ST", "CB", "CDM"], "Develop young talent and finish in the European places"],
    ["West Ham United", "WHU", 74, "#7a263a", "#1bb1e7", "midTable", ["CB", "CM", "ST"], "Finish comfortably in the top half"],
    ["Crystal Palace", "CRY", 73, "#1b458f", "#c4122e", "midTable", ["ST", "CM", "RB"], "Kick on from a first trophy and secure European football"],
    ["Everton", "EVE", 72, "#003399", "#ffffff", "midTable", ["ST", "CAM", "RW"], "Establish the new stadium era in the top half"],
    ["Fulham", "FUL", 72, "#ffffff", "#000000", "midTable", ["ST", "LW", "CB"], "Finish in the top ten again"],
    ["Brentford", "BRE", 71, "#e30613", "#ffffff", "development", ["ST", "CM", "RB"], "Find undervalued players and stay a Premier League side"],
    ["AFC Bournemouth", "BOU", 70, "#da291c", "#000000", "development", ["CB", "LW", "ST"], "Recruit young and finish in the top ten"],
    ["Nottingham Forest", "NFO", 70, "#dd0000", "#ffffff", "midTable", ["ST", "CDM", "LB"], "Consolidate as a European club"],
    ["Wolverhampton Wanderers", "WOL", 69, "#fdb913", "#231f20", "survival", ["ST", "CB", "CAM"], "Beat the drop and rebuild"],
    ["Leeds United", "LEE", 68, "#ffffff", "#1d428a", "survival", ["ST", "CB", "GK"], "Survive the first season back in the Premier League"],
    ["Sunderland", "SUN", 64, "#eb172b", "#ffffff", "survival", ["ST", "CB", "CM"], "Stay up and re-establish the club in the top flight"],
    ["Burnley", "BUR", 62, "#6c1d45", "#99d6ea", "survival", ["ST", "CAM", "CB"], "Survive in the top flight"],
  ]),

  /* ---------------- England · tier 2 ---------------- */
  worldLeague("eng-ch", "EFL Championship", "England", 2, 68, [
    ["Leicester City", "LEI", 66, "#003090", "#fdbe11", "promotion", ["ST", "CM", "CB"], "Bounce straight back to the Premier League"],
    ["Southampton", "SOU", 66, "#d71920", "#ffffff", "promotion", ["ST", "CB", "RW"], "Win promotion at the first attempt"],
    ["Ipswich Town", "IPS", 64, "#0044a9", "#ffffff", "promotion", ["ST", "CDM", "LB"], "Return to the Premier League"],
    ["Sheffield United", "SHU", 62, "#ee2737", "#000000", "promotion", ["ST", "CAM", "CB"], "Go one better and win automatic promotion"],
    ["Middlesbrough", "MID", 62, "#d81920", "#ffffff", "promotion", ["ST", "CB", "RW"], "Finish in the play-off places"],
    ["West Bromwich Albion", "WBA", 62, "#122f67", "#ffffff", "promotion", ["ST", "CM", "RB"], "Reach the play-offs and go up"],
    ["Norwich City", "NOR", 61, "#fff200", "#00a650", "development", ["ST", "CB", "CDM"], "Develop academy talent and challenge for promotion"],
    ["Coventry City", "COV", 61, "#78d0f3", "#ffffff", "promotion", ["ST", "CM", "GK"], "Turn a strong squad into a promotion campaign"],
    ["Watford", "WAT", 60, "#fbee23", "#ed2127", "development", ["ST", "CAM", "CB"], "Sign young talent and push for the play-offs"],
    ["Birmingham City", "BIR", 59, "#0b2d8b", "#ffffff", "promotion", ["ST", "CB", "CM"], "Take the club to the Premier League"],
    ["Stoke City", "STK", 59, "#e03a3e", "#ffffff", "promotion", ["ST", "CDM", "LW"], "End years of mid-table and reach the play-offs"],
    ["Bristol City", "BRC", 58, "#e21c38", "#ffffff", "development", ["ST", "CB", "RW"], "Build around young players and reach the play-offs"],
    ["Hull City", "HUL", 58, "#f18a01", "#000000", "midTable", ["CB", "CM", "ST"], "Steady the ship and finish in the top half"],
    ["Derby County", "DER", 58, "#ffffff", "#000000", "survival", ["ST", "CB", "CDM"], "Stay in the Championship"],
    ["Blackburn Rovers", "BLB", 57, "#009ee0", "#ffffff", "development", ["ST", "CB", "CM"], "Promote from the academy and stay competitive"],
    ["Preston North End", "PNE", 56, "#ffffff", "#002d5f", "midTable", ["ST", "CAM", "LB"], "Push into the top half of the Championship"],
    ["Queens Park Rangers", "QPR", 56, "#005cab", "#ffffff", "survival", ["ST", "CB", "GK"], "Secure Championship safety"],
    ["Swansea City", "SWA", 56, "#ffffff", "#000000", "development", ["CM", "ST", "LB"], "Play attractive football with young talent"],
    ["Sheffield Wednesday", "SHW", 56, "#0066b3", "#ffffff", "survival", ["ST", "CB", "CM"], "Survive a difficult season off the pitch"],
    ["Millwall", "MIL", 55, "#001d5b", "#ffffff", "midTable", ["ST", "CB", "RW"], "Make The Den a fortress and chase the play-offs"],
    ["Portsmouth", "POR", 55, "#001489", "#ffffff", "survival", ["ST", "CB", "CDM"], "Stay in the Championship"],
    ["Wrexham", "WRX", 55, "#d0021b", "#ffffff", "promotion", ["ST", "CM", "CB"], "Keep the rise going all the way to the Premier League"],
    ["Charlton Athletic", "CHA", 53, "#d4021d", "#ffffff", "survival", ["ST", "CB", "CM"], "Consolidate after promotion"],
    ["Oxford United", "OXF", 52, "#fff200", "#003c71", "survival", ["ST", "CB", "GK"], "Survive in the second tier"],
  ]),

  /* ---------------- England · tier 3 ---------------- */
  worldLeague("eng-l1", "EFL League One", "England", 3, 50, [
    ["Cardiff City", "CAR", 56, "#0070b5", "#ffffff", "promotion", ["ST", "CB", "CM"], "Win promotion back to the Championship"],
    ["Huddersfield Town", "HUD", 54, "#0e63ad", "#ffffff", "promotion", ["ST", "CAM", "CB"], "Go up at the first attempt"],
    ["Luton Town", "LUT", 54, "#f78f1e", "#002d62", "promotion", ["ST", "CB", "CDM"], "Stop the slide and win promotion"],
    ["Bolton Wanderers", "BOL", 53, "#ffffff", "#002d62", "promotion", ["ST", "CM", "RB"], "Reach the play-offs and go up"],
    ["Reading", "RDG", 52, "#004494", "#ffffff", "development", ["ST", "CB", "CM"], "Rebuild around academy graduates"],
    ["Blackpool", "BLK", 52, "#f68712", "#ffffff", "promotion", ["ST", "LW", "CB"], "Win promotion at the first attempt"],
    ["Barnsley", "BAR", 51, "#e4022d", "#ffffff", "development", ["ST", "CM", "CB"], "Sign young players and challenge at the top"],
    ["Wigan Athletic", "WIG", 51, "#1d5ba4", "#ffffff", "midTable", ["ST", "CB", "CDM"], "Push towards the play-off places"],
    ["Plymouth Argyle", "PLY", 51, "#007b5f", "#ffffff", "promotion", ["ST", "CB", "RW"], "Return to the Championship"],
    ["Bradford City", "BRD", 50, "#ffb612", "#6d071a", "promotion", ["ST", "CM", "CB"], "Build on promotion and keep climbing"],
    ["Stockport County", "STO", 50, "#002d62", "#ffffff", "promotion", ["ST", "CAM", "CB"], "Continue the climb up the pyramid"],
    ["Peterborough United", "PET", 50, "#0072ce", "#ffffff", "development", ["ST", "CAM", "RW"], "Develop and sell young talent while chasing promotion"],
    ["Rotherham United", "ROT", 49, "#e4022d", "#ffffff", "midTable", ["ST", "CB", "CM"], "Stabilise and aim for the play-offs"],
    ["Doncaster Rovers", "DON", 49, "#e4022d", "#ffffff", "midTable", ["ST", "CM", "LB"], "Consolidate after promotion"],
    ["Lincoln City", "LIN", 49, "#e4022d", "#ffffff", "development", ["ST", "CB", "CM"], "Punch above the budget with young signings"],
    ["Port Vale", "VAL", 48, "#ffffff", "#000000", "midTable", ["ST", "CB", "CDM"], "Finish in the top half of League One"],
    ["Northampton Town", "NTH", 47, "#7c2855", "#ffffff", "survival", ["ST", "CB", "GK"], "Stay in League One"],
    ["Leyton Orient", "LEY", 47, "#e30613", "#ffffff", "midTable", ["ST", "CM", "RB"], "Keep the club in the top half"],
    ["Mansfield Town", "MAN", 47, "#f5c518", "#003da5", "survival", ["ST", "CB", "CM"], "Secure League One survival"],
    ["Wycombe Wanderers", "WYC", 47, "#002d62", "#94c1e6", "midTable", ["ST", "CB", "CDM"], "Compete for a play-off place on a small budget"],
  ]),

  /* ---------------- Spain · tier 1 ---------------- */
  worldLeague("esp-ll", "LaLiga", "Spain", 1, 96, [
    ["Real Madrid", "RMA", 100, "#ffffff", "#febe10", "elite", ["CB", "CDM", "LB"], "Win the Champions League"],
    ["Barcelona", "BAR", 100, "#004d98", "#a50044", "elite", ["RW", "CB", "GK"], "Win LaLiga and the Champions League with La Masia at the core"],
    ["Atlético Madrid", "ATM", 90, "#cb3524", "#272e61", "elite", ["ST", "CB", "CM"], "Break the duopoly and win LaLiga"],
    ["Athletic Club", "ATH", 82, "#ee2523", "#ffffff", "development", ["ST", "CB", "CM"], "Qualify for the Champions League with a Basque-only squad"],
    ["Real Sociedad", "RSO", 80, "#0067b1", "#ffffff", "development", ["ST", "CAM", "CB"], "Return to Europe with academy-built football"],
    ["Villarreal", "VIL", 80, "#ffe667", "#005ca9", "development", ["ST", "CB", "LW"], "Qualify for the Champions League"],
    ["Real Betis", "BET", 78, "#00954c", "#ffffff", "midTable", ["ST", "CB", "RB"], "Keep European football at the Benito Villamarín"],
    ["Sevilla", "SEV", 76, "#ffffff", "#d81920", "midTable", ["ST", "CB", "CDM"], "Rebuild the squad and get back into Europe"],
    ["Valencia", "VAL", 72, "#ffffff", "#f7a600", "development", ["ST", "CB", "CAM"], "Trust the academy and climb back up the table"],
    ["Celta Vigo", "CEL", 70, "#8ac3ee", "#ffffff", "development", ["ST", "CB", "CDM"], "Qualify for Europe again"],
    ["Girona", "GIR", 68, "#d81e05", "#ffffff", "development", ["ST", "CB", "CM"], "Recapture the European nights"],
    ["Osasuna", "OSA", 66, "#d81e05", "#0a2240", "midTable", ["ST", "CB", "LW"], "Finish in the top half of LaLiga"],
    ["Rayo Vallecano", "RAY", 64, "#ffffff", "#e53027", "midTable", ["ST", "CAM", "CB"], "Stay in the European conversation on a small budget"],
    ["Mallorca", "MLL", 63, "#e20613", "#000000", "midTable", ["ST", "CM", "CB"], "Finish comfortably clear of the relegation zone"],
    ["Getafe", "GET", 62, "#005999", "#ffffff", "survival", ["ST", "CB", "CDM"], "Grind out another season in LaLiga"],
    ["Deportivo Alavés", "ALA", 60, "#0761af", "#ffffff", "survival", ["ST", "CB", "CM"], "Secure LaLiga safety"],
    ["Espanyol", "ESP", 60, "#007fc8", "#ffffff", "survival", ["ST", "CB", "GK"], "Stay in LaLiga"],
    ["Elche", "ELC", 56, "#007a33", "#ffffff", "survival", ["ST", "CB", "CDM"], "Survive in the top flight"],
    ["Levante", "LEV", 55, "#003399", "#ba0c2f", "survival", ["ST", "CB", "CM"], "Stay up after promotion"],
    ["Real Oviedo", "OVI", 55, "#005bac", "#ffffff", "survival", ["ST", "CB", "GK"], "Keep the club in LaLiga after a long wait"],
  ]),

  /* ---------------- Spain · tier 2 ---------------- */
  worldLeague("esp-l2", "LaLiga Hypermotión", "Spain", 2, 62, [
    ["Las Palmas", "LPA", 62, "#fdd000", "#005bac", "promotion", ["ST", "CB", "CM"], "Win promotion straight back to LaLiga"],
    ["Real Valladolid", "VLL", 61, "#7b2c8f", "#ffffff", "promotion", ["ST", "CB", "CDM"], "Return to LaLiga at the first attempt"],
    ["Almería", "ALM", 61, "#e4022d", "#ffffff", "development", ["ST", "CAM", "CB"], "Develop young talent and go up"],
    ["Deportivo La Coruña", "DEP", 60, "#009de0", "#ffffff", "promotion", ["ST", "CB", "CM"], "Take Dépor back to LaLiga"],
    ["Cádiz", "CAD", 60, "#fbe122", "#003da5", "promotion", ["ST", "CB", "RW"], "Reach the promotion play-offs"],
    ["Granada", "GRA", 60, "#e4022d", "#ffffff", "promotion", ["ST", "CDM", "CB"], "Win promotion back to the top flight"],
    ["Leganés", "LEG", 60, "#003da5", "#ffffff", "promotion", ["ST", "CB", "CM"], "Bounce back to LaLiga"],
    ["Real Zaragoza", "ZAR", 59, "#ffffff", "#005bac", "promotion", ["ST", "CB", "CAM"], "End the long wait for promotion"],
    ["Málaga", "MAL", 58, "#009de0", "#ffffff", "development", ["ST", "CM", "CB"], "Build on the academy and reach the play-offs"],
    ["Sporting Gijón", "SPG", 58, "#e4022d", "#ffffff", "development", ["ST", "CB", "LW"], "Promote from Mareo and challenge for promotion"],
    ["Racing Santander", "RAC", 58, "#ffffff", "#007a33", "promotion", ["ST", "CB", "CDM"], "Finally win promotion to LaLiga"],
    ["Eibar", "EIB", 57, "#005bac", "#e4022d", "midTable", ["ST", "CB", "CM"], "Compete for the play-offs on the smallest budget"],
    ["Huesca", "HUE", 55, "#005bac", "#e4022d", "midTable", ["ST", "CAM", "CB"], "Finish in the top half of the Segunda"],
    ["Burgos", "BUR", 54, "#ffffff", "#1a1a1a", "midTable", ["ST", "CB", "CDM"], "Push towards an unlikely play-off place"],
    ["Córdoba", "COR", 54, "#007a33", "#ffffff", "survival", ["ST", "CB", "CM"], "Consolidate in the second tier"],
    ["Albacete", "ALB", 53, "#ffffff", "#0a2240", "survival", ["ST", "CB", "GK"], "Secure another season in the Segunda"],
    ["Castellón", "CAS", 53, "#000000", "#ffffff", "survival", ["ST", "CB", "CM"], "Stay in the second tier"],
    ["Mirandés", "MIR", 52, "#e4022d", "#000000", "development", ["ST", "CM", "CB"], "Survive on loans and young talent"],
  ]),
];
