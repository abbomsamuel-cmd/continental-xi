import { worldLeague, type WorldLeague } from "./world-types";

/* ------------------------------------------------------------------ */
/*  The rest of Europe — seventeen top divisions, from the Primeira    */
/*  Liga down to the Eliteserien. This is the middle of the career     */
/*  ladder: the leagues a teenager breaks through in, the leagues a    */
/*  fringe player drops to, and the leagues that sell to the giants.   */
/*  England, Spain, Germany, Italy and France live in their own files. */
/*  Compact tuples:                                                    */
/*  [name, short, reputation, colour1, colour2, recruitment, needs,    */
/*   objective]                                                        */
/*  Reputation is the hidden 0–100 pull of the club: ~84 = Benfica,    */
/*  ~70 = Celtic / Salzburg, ~50 = a bottom-half side in a small       */
/*  nation's top flight.                                               */
/* ------------------------------------------------------------------ */

export const EUROPE_LEAGUES: WorldLeague[] = [
  /* ---------------- Portugal ---------------- */
  worldLeague("por-pl", "Primeira Liga", "Portugal", 1, 78, [
    ["Benfica", "BEN", 84, "#e30613", "#ffffff", "development", ["ST", "CM", "CB"], "Win the title and reach the Champions League knockouts"],
    ["FC Porto", "POR", 83, "#004b9e", "#ffffff", "development", ["CB", "CAM", "ST"], "Win the league back and sell on the next star"],
    ["Sporting CP", "SCP", 83, "#0a7d3c", "#ffffff", "development", ["RW", "CDM", "ST"], "Defend the title with academy graduates"],
    ["SC Braga", "BRA", 74, "#e30613", "#ffffff", "midTable", ["ST", "LB", "CM"], "Break into the big three and stay in Europe"],
    ["Vitória SC", "VIT", 68, "#ffffff", "#111111", "development", ["CAM", "ST", "CB"], "Qualify for Europe from Guimarães"],
    ["Famalicão", "FAM", 61, "#0a7d3c", "#ffffff", "development", ["CM", "RW", "CB"], "Buy young, finish top six, sell high"],
    ["Boavista", "BOA", 60, "#111111", "#ffffff", "survival", ["CB", "ST", "GK"], "Keep the Panthers in the Primeira Liga"],
    ["FC Arouca", "ARO", 60, "#f2c200", "#1a3aa8", "survival", ["ST", "CM"], "Finish in the top half again"],
    ["Rio Ave", "RIO", 59, "#0a7d3c", "#ffffff", "development", ["LW", "CM", "CB"], "Stay up and develop the next sale"],
    ["Gil Vicente", "GIL", 58, "#e30613", "#ffffff", "survival", ["ST", "CDM", "RB"], "Avoid the relegation play-off"],
    ["Estoril Praia", "EST", 57, "#f7d417", "#1a3aa8", "development", ["CAM", "LB", "ST"], "Turn young talent into a top-half finish"],
    ["Moreirense", "MOR", 56, "#0a7d3c", "#ffffff", "survival", ["ST", "CB"], "Survive on the smallest budget in the league"],
    ["Casa Pia", "CAS", 55, "#111111", "#ffffff", "survival", ["GK", "CB", "ST"], "Keep a Lisbon underdog in the top flight"],
    ["Santa Clara", "SCL", 55, "#e30613", "#ffffff", "survival", ["ST", "CM"], "Stay up and make the island a fortress"],
    ["CD Nacional", "NAC", 54, "#111111", "#ffffff", "survival", ["CB", "ST"], "Survive the first season back"],
    ["Farense", "FAR", 54, "#111111", "#ffffff", "survival", ["ST", "CDM", "GK"], "Beat the drop in the Algarve"],
  ]),

  /* ---------------- Netherlands ---------------- */
  worldLeague("ned-ed", "Eredivisie", "Netherlands", 1, 78, [
    ["Ajax", "AJA", 80, "#d2122e", "#ffffff", "development", ["CB", "CAM", "ST"], "Win the title with a homegrown spine"],
    ["PSV", "PSV", 79, "#ee2e24", "#ffffff", "development", ["RW", "CDM", "ST"], "Win the Eredivisie and reach the Champions League groups"],
    ["Feyenoord", "FEY", 77, "#e30613", "#ffffff", "development", ["ST", "CB", "LB"], "Take the title back to De Kuip"],
    ["AZ Alkmaar", "AZA", 70, "#e30613", "#ffffff", "development", ["ST", "CM", "CB"], "Develop the academy and finish in the European places"],
    ["FC Twente", "TWE", 66, "#e30613", "#ffffff", "midTable", ["CAM", "ST", "GK"], "Qualify for Europe from Enschede"],
    ["FC Utrecht", "UTR", 64, "#e30613", "#111111", "midTable", ["ST", "CM", "CB"], "Break the top four"],
    ["NEC Nijmegen", "NEC", 60, "#e30613", "#111111", "midTable", ["LW", "CB", "ST"], "Finish in the European play-offs"],
    ["SC Heerenveen", "HEE", 58, "#1a53b0", "#ffffff", "development", ["ST", "CM", "LB"], "Blood teenagers and finish mid-table"],
    ["FC Groningen", "GRO", 58, "#0a7d3c", "#ffffff", "development", ["CAM", "CB", "ST"], "Rebuild around the academy"],
    ["Go Ahead Eagles", "GAE", 57, "#e30613", "#f7d417", "midTable", ["ST", "RB", "CM"], "Turn a cup run into European football"],
    ["Sparta Rotterdam", "SPA", 56, "#e30613", "#ffffff", "survival", ["ST", "CB"], "Keep Rotterdam's oldest club in the Eredivisie"],
    ["PEC Zwolle", "ZWO", 54, "#1a53b0", "#ffffff", "survival", ["ST", "CDM", "GK"], "Stay clear of the play-off places"],
    ["Fortuna Sittard", "FOR", 53, "#f7d417", "#0a7d3c", "survival", ["CB", "ST"], "Survive another season in the top flight"],
    ["Heracles Almelo", "HER", 53, "#111111", "#ffffff", "survival", ["ST", "CM", "CB"], "Beat the drop"],
    ["RKC Waalwijk", "RKC", 52, "#f7d417", "#1a53b0", "survival", ["GK", "CB", "ST"], "Survive on the smallest budget in the league"],
    ["Willem II", "WIL", 52, "#e30613", "#1a53b0", "survival", ["ST", "CM"], "Stay up after promotion"],
  ]),

  /* ---------------- Belgium ---------------- */
  worldLeague("bel-pl", "Pro League", "Belgium", 1, 72, [
    ["Club Brugge", "CLB", 74, "#1a53b0", "#111111", "development", ["ST", "CB", "CM"], "Win the title and qualify for the Champions League"],
    ["RSC Anderlecht", "AND", 70, "#4f2d7f", "#ffffff", "development", ["ST", "CDM", "CB"], "Restore Anderlecht to Belgian champions"],
    ["Union Saint-Gilloise", "USG", 68, "#f7d417", "#1a53b0", "development", ["CM", "ST", "RB"], "Prove the fairytale was not a one-off"],
    ["KRC Genk", "GNK", 68, "#1a53b0", "#ffffff", "development", ["RW", "CB", "ST"], "Win the play-offs with academy players"],
    ["Royal Antwerp", "ANT", 66, "#e30613", "#ffffff", "midTable", ["ST", "CM", "CB"], "Return to the Champions League play-offs"],
    ["KAA Gent", "GNT", 65, "#1a53b0", "#ffffff", "midTable", ["ST", "LB", "CAM"], "Finish in the European places"],
    ["Standard Liège", "STL", 62, "#e30613", "#ffffff", "midTable", ["ST", "CB", "GK"], "Rebuild a fallen giant"],
    ["Cercle Brugge", "CER", 58, "#0a7d3c", "#111111", "development", ["ST", "CM", "LB"], "Develop loanees into a European finish"],
    ["Sporting Charleroi", "CHA", 57, "#111111", "#ffffff", "midTable", ["CAM", "CB", "ST"], "Sneak into the Europe play-offs"],
    ["KV Mechelen", "MEC", 56, "#f7d417", "#e30613", "survival", ["ST", "CDM"], "Finish comfortably clear of the drop"],
    ["Sint-Truiden", "STV", 55, "#fff200", "#1a3aa8", "development", ["CM", "ST", "RB"], "Develop young imports and stay up"],
    ["OH Leuven", "OHL", 54, "#111111", "#ffffff", "survival", ["ST", "CB", "GK"], "Survive in the Pro League"],
    ["KVC Westerlo", "WES", 54, "#ffd200", "#003a70", "survival", ["ST", "CM"], "Avoid the relegation play-offs"],
    ["Zulte Waregem", "ZUL", 52, "#e30613", "#111111", "survival", ["CB", "ST"], "Stay up after promotion"],
    ["Beerschot", "BEE", 50, "#4b2e83", "#ffffff", "survival", ["ST", "GK", "CB"], "Keep Beerschot in the top flight"],
  ]),

  /* ---------------- Turkey ---------------- */
  worldLeague("tur-sl", "Süper Lig", "Turkey", 1, 72, [
    ["Galatasaray", "GAL", 79, "#a90432", "#fbb034", "showcase", ["ST", "CAM", "CB"], "Win the title and sign a name the world knows"],
    ["Fenerbahçe", "FEN", 78, "#edbb00", "#12326e", "showcase", ["ST", "CM", "CB"], "End the title drought whatever it costs"],
    ["Beşiktaş", "BJK", 74, "#111111", "#ffffff", "midTable", ["ST", "LW", "CDM"], "Get the Black Eagles back into the title race"],
    ["Trabzonspor", "TRA", 70, "#6a1b32", "#4ba3dc", "midTable", ["ST", "CB", "CM"], "Break the Istanbul monopoly"],
    ["İstanbul Başakşehir", "IBS", 64, "#f36c21", "#12326e", "development", ["CAM", "ST", "RB"], "Return to the European places"],
    ["Adana Demirspor", "ADS", 60, "#1a53b0", "#ffffff", "midTable", ["ST", "CB", "GK"], "Finish in the top half"],
    ["Alanyaspor", "ALA", 58, "#f7931e", "#0a7d3c", "survival", ["ST", "CM"], "Stay comfortably in the Süper Lig"],
    ["Konyaspor", "KON", 58, "#0a7d3c", "#ffffff", "survival", ["ST", "CB", "CDM"], "Beat the drop in Anatolia"],
    ["Antalyaspor", "ATS", 57, "#e30613", "#ffffff", "survival", ["ST", "CM", "CB"], "Survive and build on the coast"],
    ["Sivasspor", "SIV", 57, "#e30613", "#ffffff", "survival", ["CB", "ST"], "Stay up after a difficult season"],
    ["Samsunspor", "SAM", 56, "#e30613", "#ffffff", "midTable", ["ST", "LW", "CB"], "Consolidate as a top-half club"],
    ["Kasımpaşa", "KAS", 56, "#1a53b0", "#ffffff", "survival", ["ST", "CAM"], "Avoid a relegation fight"],
    ["Göztepe", "GOZ", 55, "#e30613", "#f7d417", "development", ["ST", "CM", "RB"], "Develop young talent in İzmir and stay up"],
    ["Çaykur Rizespor", "RIZ", 55, "#0a7d3c", "#1a53b0", "survival", ["CB", "ST", "GK"], "Survive on the Black Sea coast"],
    ["Gaziantep FK", "GAZ", 55, "#e30613", "#111111", "survival", ["ST", "CDM"], "Beat the drop"],
    ["Kayserispor", "KAY", 54, "#e30613", "#f7d417", "survival", ["ST", "CB"], "Escape the relegation zone"],
  ]),

  /* ---------------- Scotland ---------------- */
  worldLeague("sco-pr", "Scottish Premiership", "Scotland", 1, 64, [
    ["Celtic", "CEL", 72, "#018749", "#ffffff", "development", ["ST", "CB", "CM"], "Win the title and get out of the Champions League group"],
    ["Rangers", "RAN", 70, "#1b458f", "#e30613", "midTable", ["ST", "CB", "CDM"], "Stop Celtic and win the league back"],
    ["Aberdeen", "ABE", 60, "#e30613", "#ffffff", "midTable", ["ST", "CM", "CB"], "Finish best of the rest and qualify for Europe"],
    ["Heart of Midlothian", "HEA", 59, "#7b1e2b", "#ffffff", "midTable", ["ST", "CAM", "CB"], "Break the Old Firm's grip on the top two"],
    ["Hibernian", "HIB", 58, "#0a7d3c", "#ffffff", "development", ["ST", "LW", "CB"], "Bring through young players and reach Europe"],
    ["Dundee United", "DUN", 55, "#f5a623", "#111111", "survival", ["ST", "CB", "GK"], "Establish the club back in the Premiership"],
    ["Motherwell", "MOT", 55, "#f7c600", "#7b1e2b", "survival", ["ST", "CM"], "Finish in the top six"],
    ["St Mirren", "STM", 53, "#111111", "#ffffff", "survival", ["ST", "CB"], "Stay in the top flight and upset the big clubs"],
    ["Kilmarnock", "KIL", 53, "#1a53b0", "#ffffff", "survival", ["ST", "CDM", "CB"], "Survive on a shoestring budget"],
    ["Dundee", "DEE", 52, "#0a4a8f", "#ffffff", "survival", ["GK", "CB", "ST"], "Avoid the relegation play-off"],
    ["Ross County", "ROS", 51, "#1a53b0", "#ffffff", "survival", ["ST", "CM"], "Keep top-flight football in the Highlands"],
    ["St Johnstone", "STJ", 51, "#1a53b0", "#ffffff", "survival", ["ST", "CB"], "Beat the drop in Perth"],
  ]),

  /* ---------------- Austria ---------------- */
  worldLeague("aut-bl", "Austrian Bundesliga", "Austria", 1, 64, [
    ["Red Bull Salzburg", "SAL", 70, "#e30613", "#ffffff", "development", ["ST", "CM", "CB"], "Win the title and sell on the next superstar"],
    ["Sturm Graz", "SGR", 65, "#111111", "#ffffff", "development", ["ST", "CB", "RW"], "Defend the title and get back to the Champions League"],
    ["Rapid Wien", "RAP", 62, "#0a7d3c", "#ffffff", "development", ["ST", "CAM", "LB"], "Return the Austrian giants to the title"],
    ["Austria Wien", "AUS", 59, "#7b1e2b", "#ffffff", "development", ["ST", "CM", "CB"], "Rebuild through the academy and reach Europe"],
    ["LASK", "LAS", 58, "#111111", "#ffffff", "midTable", ["ST", "CDM", "CB"], "Finish in the championship round"],
    ["Wolfsberger AC", "WAC", 56, "#ffffff", "#111111", "survival", ["ST", "CM"], "Punch above the budget again"],
    ["SCR Altach", "ALT", 52, "#e30613", "#ffffff", "survival", ["ST", "CB"], "Stay in the Bundesliga"],
    ["Austria Klagenfurt", "KLA", 52, "#4b2e83", "#ffffff", "survival", ["ST", "GK", "CB"], "Avoid the relegation round"],
    ["WSG Tirol", "WSG", 52, "#0a7d3c", "#ffffff", "survival", ["ST", "CM", "CB"], "Survive in the top flight"],
    ["Blau-Weiß Linz", "BWL", 51, "#1a53b0", "#ffffff", "survival", ["CB", "ST"], "Keep the newcomers up"],
    ["TSV Hartberg", "HAR", 51, "#111111", "#ffffff", "survival", ["ST", "CDM"], "Beat the drop with the smallest squad"],
    ["Grazer AK", "GAK", 50, "#e30613", "#111111", "survival", ["GK", "CB", "ST"], "Survive the season back in the Bundesliga"],
  ]),

  /* ---------------- Switzerland ---------------- */
  worldLeague("sui-sl", "Swiss Super League", "Switzerland", 1, 62, [
    ["BSC Young Boys", "BSC", 65, "#f7d417", "#111111", "development", ["ST", "CB", "CM"], "Win the title and return to the Champions League"],
    ["FC Basel", "BAS", 64, "#e30613", "#1a53b0", "development", ["ST", "CAM", "CB"], "Win the double and sell to the big five"],
    ["FC St. Gallen", "STG", 58, "#0a7d3c", "#ffffff", "development", ["ST", "RW", "CB"], "Press, entertain and qualify for Europe"],
    ["Servette", "SER", 58, "#7b1e2b", "#ffffff", "midTable", ["ST", "CM", "CB"], "Bring European nights back to Geneva"],
    ["FC Zürich", "FCZ", 58, "#1a53b0", "#ffffff", "midTable", ["ST", "CB", "CDM"], "Get back into the title race"],
    ["FC Lugano", "LUG", 57, "#111111", "#ffffff", "midTable", ["ST", "CM", "LB"], "Finish in the European places"],
    ["FC Luzern", "LUZ", 55, "#1a53b0", "#ffffff", "survival", ["ST", "CAM"], "Finish in the top half"],
    ["Grasshopper", "GCZ", 54, "#1a53b0", "#ffffff", "survival", ["ST", "CB", "GK"], "Steady the record champions"],
    ["Lausanne-Sport", "LAU", 53, "#1a53b0", "#ffffff", "survival", ["ST", "CM"], "Stay clear of the relegation play-off"],
    ["FC Sion", "SIO", 53, "#e30613", "#ffffff", "survival", ["ST", "CB"], "Keep the Valais club in the Super League"],
    ["Yverdon-Sport", "YVE", 50, "#0a7d3c", "#ffffff", "survival", ["CB", "ST", "GK"], "Survive the season"],
    ["FC Winterthur", "WIN", 50, "#e30613", "#ffffff", "survival", ["ST", "CDM"], "Beat the drop on the smallest budget"],
  ]),

  /* ---------------- Denmark ---------------- */
  worldLeague("den-sl", "Superliga", "Denmark", 1, 62, [
    ["FC København", "FCK", 66, "#ffffff", "#12326e", "development", ["ST", "CB", "CM"], "Win the title and reach the Champions League groups"],
    ["FC Midtjylland", "FCM", 63, "#111111", "#e30613", "development", ["ST", "RW", "CB"], "Win the league using data and young talent"],
    ["Brøndby IF", "BIF", 60, "#f7d417", "#1a53b0", "development", ["ST", "CM", "CB"], "Take the title back to Vestegnen"],
    ["FC Nordsjælland", "FCN", 58, "#f7d417", "#e30613", "development", ["ST", "CAM", "CB"], "Play the kids and sell them to Europe's elite"],
    ["AGF Aarhus", "AGF", 57, "#ffffff", "#111111", "midTable", ["ST", "CB", "CDM"], "Qualify for Europe from Aarhus"],
    ["Silkeborg IF", "SIL", 55, "#1a53b0", "#ffffff", "midTable", ["ST", "CAM", "LB"], "Finish in the championship round"],
    ["Randers FC", "RND", 54, "#1a53b0", "#ffffff", "survival", ["ST", "CB"], "Stay in the top six"],
    ["Viborg FF", "VFF", 54, "#0a7d3c", "#ffffff", "survival", ["ST", "CM"], "Avoid the relegation group"],
    ["AaB Aalborg", "AAB", 53, "#e30613", "#ffffff", "survival", ["ST", "CB", "GK"], "Re-establish the club in the Superliga"],
    ["SønderjyskE", "SON", 52, "#1a53b0", "#f7d417", "survival", ["ST", "CDM"], "Survive in the top flight"],
    ["Lyngby BK", "LYN", 51, "#1a53b0", "#ffffff", "survival", ["CB", "ST"], "Beat the drop"],
    ["Vejle BK", "VEJ", 50, "#e30613", "#ffffff", "survival", ["GK", "CB", "ST"], "Stay up after promotion"],
  ]),

  /* ---------------- Norway ---------------- */
  worldLeague("nor-es", "Eliteserien", "Norway", 1, 56, [
    ["Bodø/Glimt", "BOD", 62, "#f7d417", "#111111", "development", ["ST", "CM", "CB"], "Win the title and shock Europe again"],
    ["Molde", "MOL", 58, "#1a53b0", "#ffffff", "development", ["ST", "RW", "CB"], "Win the league and sell the next Haaland"],
    ["Rosenborg", "RBK", 57, "#ffffff", "#111111", "development", ["ST", "CM", "CB"], "Restore Trondheim to Norwegian champions"],
    ["SK Brann", "BRN", 56, "#e30613", "#ffffff", "midTable", ["ST", "CAM", "LB"], "Keep Bergen in the European places"],
    ["Viking", "VIK", 54, "#1a53b0", "#ffffff", "midTable", ["ST", "CB", "CM"], "Finish in the top four"],
    ["Lillestrøm", "LSK", 52, "#f7d417", "#111111", "survival", ["ST", "CDM"], "Finish comfortably in the top half"],
    ["Vålerenga", "VIF", 52, "#1a53b0", "#e30613", "survival", ["ST", "CB", "GK"], "Re-establish Oslo's biggest club"],
    ["Tromsø", "TRO", 51, "#e30613", "#ffffff", "survival", ["ST", "CM"], "Make the Arctic a fortress and stay up"],
    ["Sarpsborg 08", "SAR", 50, "#1a53b0", "#ffffff", "survival", ["ST", "CB"], "Avoid the relegation play-off"],
    ["Fredrikstad", "FFK", 50, "#e30613", "#ffffff", "survival", ["ST", "CM", "CB"], "Consolidate after promotion"],
    ["FK Haugesund", "HAU", 50, "#ffffff", "#1a53b0", "survival", ["ST", "CDM"], "Stay in the Eliteserien"],
    ["Kristiansund BK", "KBK", 49, "#1a53b0", "#ffffff", "survival", ["CB", "ST"], "Beat the drop"],
    ["Hamarkameratene", "HKA", 49, "#0a7d3c", "#ffffff", "survival", ["ST", "GK"], "Survive on the smallest budget"],
    ["KFUM Oslo", "KFU", 48, "#1a53b0", "#ffffff", "survival", ["CB", "ST", "GK"], "Keep the newcomers in the top flight"],
  ]),

  /* ---------------- Sweden ---------------- */
  worldLeague("swe-as", "Allsvenskan", "Sweden", 1, 56, [
    ["Malmö FF", "MFF", 60, "#7ab5e6", "#ffffff", "development", ["ST", "CB", "CM"], "Win the title and qualify for a European group stage"],
    ["Djurgårdens IF", "DIF", 57, "#1a53b0", "#ffffff", "development", ["ST", "CAM", "CB"], "Win the league and go deep in the Conference League"],
    ["AIK", "AIK", 55, "#111111", "#f7d417", "midTable", ["ST", "CB", "CDM"], "End the wait for another Allsvenskan title"],
    ["Hammarby IF", "HAM", 55, "#0a7d3c", "#ffffff", "midTable", ["ST", "LW", "CB"], "Finally win the league for Söderstadion"],
    ["BK Häcken", "HAC", 55, "#f7d417", "#111111", "development", ["ST", "CM", "RB"], "Recruit smart and stay in the title race"],
    ["IFK Göteborg", "IFK", 54, "#1a53b0", "#ffffff", "midTable", ["ST", "CB", "CAM"], "Bring the glory days back to Gothenburg"],
    ["IF Elfsborg", "ELF", 54, "#f7d417", "#111111", "development", ["ST", "CM", "LB"], "Develop young Swedes and reach Europe"],
    ["IFK Norrköping", "NOR", 52, "#1a53b0", "#ffffff", "survival", ["ST", "CB"], "Finish in the top half"],
    ["Mjällby AIF", "MJA", 52, "#f7d417", "#111111", "survival", ["ST", "CDM"], "Keep the village club punching above its weight"],
    ["Kalmar FF", "KFF", 50, "#e30613", "#ffffff", "survival", ["ST", "CB", "GK"], "Stay clear of the relegation play-off"],
    ["Halmstads BK", "HAL", 49, "#1a53b0", "#ffffff", "survival", ["ST", "CM"], "Survive in the Allsvenskan"],
    ["IK Sirius", "SIR", 49, "#1a53b0", "#ffffff", "survival", ["CB", "ST"], "Beat the drop in Uppsala"],
    ["IFK Värnamo", "VAR", 48, "#e30613", "#ffffff", "survival", ["ST", "GK"], "Keep the smallest club in the top flight"],
    ["GAIS", "GAI", 48, "#0a7d3c", "#ffffff", "survival", ["ST", "CB", "CDM"], "Stay up after promotion"],
  ]),

  /* ---------------- Poland ---------------- */
  worldLeague("pol-ek", "Ekstraklasa", "Poland", 1, 56, [
    ["Legia Warszawa", "LEG", 60, "#0a7d3c", "#ffffff", "development", ["ST", "CB", "CM"], "Win the title and go deep in Europe"],
    ["Lech Poznań", "LEH", 58, "#1a53b0", "#ffffff", "development", ["ST", "CAM", "CB"], "Win the league with academy graduates"],
    ["Raków Częstochowa", "RAK", 57, "#e30613", "#1a53b0", "midTable", ["ST", "CDM", "CB"], "Keep the newcomers among the champions"],
    ["Jagiellonia Białystok", "JAG", 56, "#f7d417", "#e30613", "midTable", ["ST", "RW", "CB"], "Turn a first title into a European run"],
    ["Pogoń Szczecin", "POG", 55, "#1a53b0", "#7b1e2b", "midTable", ["ST", "CM", "LB"], "Finally win a first major trophy"],
    ["Widzew Łódź", "WID", 53, "#e30613", "#ffffff", "survival", ["ST", "CB"], "Re-establish Widzew in the top half"],
    ["Śląsk Wrocław", "SLW", 53, "#0a7d3c", "#ffffff", "survival", ["ST", "CDM", "GK"], "Stay clear of the relegation places"],
    ["Górnik Zabrze", "GOR", 52, "#1a53b0", "#ffffff", "survival", ["ST", "CM", "CB"], "Take a proud old club back to Europe"],
    ["Cracovia", "CRA", 52, "#e30613", "#ffffff", "survival", ["ST", "CB"], "Finish in the top half of the Ekstraklasa"],
    ["Lechia Gdańsk", "LEC", 51, "#0a7d3c", "#ffffff", "survival", ["ST", "CM"], "Stabilise the club after promotion"],
    ["Piast Gliwice", "PIA", 51, "#e30613", "#1a53b0", "survival", ["ST", "CB", "GK"], "Survive in the top flight"],
    ["Zagłębie Lubin", "ZAG", 50, "#f57f20", "#0a7d3c", "survival", ["ST", "CDM"], "Avoid a relegation fight"],
    ["Radomiak Radom", "RAD", 49, "#0a7d3c", "#ffffff", "survival", ["ST", "CB"], "Beat the drop"],
    ["Korona Kielce", "KOR", 48, "#f7d417", "#e30613", "survival", ["GK", "CB", "ST"], "Keep Korona in the Ekstraklasa"],
    ["Motor Lublin", "MTL", 48, "#1a53b0", "#ffffff", "survival", ["ST", "CM", "CB"], "Survive the first season back"],
  ]),

  /* ---------------- Greece ---------------- */
  worldLeague("gre-sl", "Super League Greece", "Greece", 1, 62, [
    ["Olympiacos", "OLY", 70, "#e30613", "#ffffff", "midTable", ["ST", "CB", "CM"], "Win the title and go deep in Europe again"],
    ["PAOK", "PAK", 66, "#111111", "#ffffff", "midTable", ["ST", "CAM", "CB"], "Take the title back to Thessaloniki"],
    ["Panathinaikos", "PAO", 66, "#0a7d3c", "#ffffff", "midTable", ["ST", "CDM", "CB"], "End the long wait for a league title"],
    ["AEK Athens", "AEK", 65, "#f7d417", "#111111", "midTable", ["ST", "CM", "LB"], "Win the double in the new stadium"],
    ["Aris", "ARI", 58, "#f7d417", "#111111", "midTable", ["ST", "CB", "GK"], "Break into the Champions League play-offs"],
    ["OFI Crete", "OFI", 52, "#111111", "#ffffff", "survival", ["ST", "CM"], "Make Crete a fortress and finish mid-table"],
    ["Atromitos", "ATR", 52, "#1a53b0", "#ffffff", "survival", ["ST", "CB"], "Stay in the top half"],
    ["Asteras Tripolis", "AST", 50, "#f7d417", "#1a53b0", "survival", ["ST", "CDM"], "Avoid the relegation round"],
    ["Volos", "VOL", 50, "#1a53b0", "#ffffff", "survival", ["ST", "CB", "GK"], "Survive in the Super League"],
    ["Panetolikos", "PTL", 49, "#0a7d3c", "#ffffff", "survival", ["ST", "CM"], "Beat the drop"],
    ["Panserraikos", "PAN", 49, "#e30613", "#ffffff", "survival", ["CB", "ST"], "Keep the club up after promotion"],
    ["Kifisia", "KIF", 48, "#1a53b0", "#ffffff", "survival", ["ST", "GK"], "Stay in the top flight"],
    ["Levadiakos", "LEV", 48, "#0a7d3c", "#ffffff", "survival", ["ST", "CB"], "Escape the relegation places"],
    ["Lamia", "LAM", 48, "#ffffff", "#111111", "survival", ["ST", "CDM", "CB"], "Survive on the smallest budget"],
  ]),

  /* ---------------- Croatia ---------------- */
  worldLeague("cro-hnl", "HNL", "Croatia", 1, 58, [
    ["Dinamo Zagreb", "DIN", 64, "#1a53b0", "#ffffff", "development", ["ST", "CB", "CM"], "Win the title and sell a teenager to the big five"],
    ["Hajduk Split", "HAJ", 60, "#ffffff", "#1a53b0", "development", ["ST", "CAM", "CB"], "End the long title drought on Poljud"],
    ["HNK Rijeka", "RIJ", 58, "#ffffff", "#1a53b0", "development", ["ST", "CM", "LB"], "Defend the title with young players"],
    ["NK Osijek", "OSI", 54, "#1a53b0", "#ffffff", "development", ["ST", "CB", "RW"], "Break the Zagreb–Split duopoly"],
    ["Lokomotiva Zagreb", "LOK", 50, "#1a53b0", "#ffffff", "development", ["CAM", "ST", "CB"], "Develop talent and sell it on every summer"],
    ["Slaven Belupo", "SLB", 49, "#1a53b0", "#f7931e", "survival", ["ST", "CM"], "Finish mid-table and stay up"],
    ["Istra 1961", "IST", 48, "#0a7d3c", "#f7d417", "survival", ["ST", "CB"], "Survive in the HNL"],
    ["HNK Gorica", "GRC", 48, "#f7d417", "#1a53b0", "survival", ["ST", "CDM", "GK"], "Avoid the relegation play-off"],
    ["NK Varaždin", "VZD", 48, "#1a53b0", "#ffffff", "survival", ["ST", "CB"], "Beat the drop"],
    ["HNK Šibenik", "SIB", 47, "#ffffff", "#111111", "survival", ["GK", "CB", "ST"], "Keep the club in the top flight"],
  ]),

  /* ---------------- Serbia ---------------- */
  worldLeague("srb-sl", "SuperLiga", "Serbia", 1, 56, [
    ["Crvena zvezda", "ZVE", 62, "#e30613", "#ffffff", "development", ["ST", "CB", "CM"], "Win the title and reach the Champions League groups"],
    ["Partizan", "PAR", 58, "#111111", "#ffffff", "development", ["ST", "CAM", "CB"], "Beat Zvezda and win the eternal derby race"],
    ["Vojvodina", "VOJ", 52, "#e30613", "#ffffff", "development", ["ST", "CM", "CB"], "Break the Belgrade duopoly with academy players"],
    ["TSC Bačka Topola", "TSC", 51, "#1a53b0", "#ffffff", "midTable", ["ST", "CB", "CDM"], "Keep the club in Europe"],
    ["Čukarički", "CUK", 51, "#f7931e", "#111111", "development", ["ST", "CM", "RB"], "Develop and sell the next Serbian export"],
    ["Radnički Niš", "RNI", 50, "#e30613", "#1a53b0", "survival", ["ST", "CB"], "Finish in the top half"],
    ["Spartak Subotica", "SPA", 48, "#1a53b0", "#ffffff", "survival", ["ST", "CDM"], "Stay clear of the relegation group"],
    ["Novi Pazar", "NPZ", 47, "#1a53b0", "#ffffff", "survival", ["ST", "CB", "GK"], "Survive in the SuperLiga"],
    ["Napredak", "NAK", 47, "#1a53b0", "#ffffff", "survival", ["ST", "CM"], "Beat the drop in Kruševac"],
    ["IMT Belgrade", "IMT", 47, "#1a53b0", "#f7d417", "survival", ["ST", "CB"], "Keep the newcomers up"],
    ["Javor Ivanjica", "JAV", 46, "#0a7d3c", "#ffffff", "survival", ["GK", "CB", "ST"], "Survive on the smallest budget"],
    ["Mladost Lučani", "MLA", 46, "#e30613", "#ffffff", "survival", ["ST", "CDM"], "Stay in the top flight"],
  ]),

  /* ---------------- Czech Republic ---------------- */
  worldLeague("cze-fl", "Fortuna Liga", "Czech Republic", 1, 58, [
    ["Slavia Praha", "SLA", 62, "#e30613", "#ffffff", "development", ["ST", "CB", "CM"], "Win the title and reach the Champions League groups"],
    ["Sparta Praha", "SPT", 62, "#7b1e2b", "#ffffff", "development", ["ST", "CAM", "CB"], "Win the Prague derby and the league"],
    ["Viktoria Plzeň", "PLZ", 58, "#e30613", "#1a53b0", "midTable", ["ST", "CM", "CB"], "Break the Prague duopoly again"],
    ["Baník Ostrava", "BAN", 52, "#1a53b0", "#ffffff", "midTable", ["ST", "CB", "GK"], "Get Ostrava back into Europe"],
    ["Sigma Olomouc", "OLO", 52, "#1a53b0", "#ffffff", "development", ["ST", "CAM", "CB"], "Develop young Czechs and finish top six"],
    ["Slovan Liberec", "LIB", 51, "#1a53b0", "#ffffff", "development", ["ST", "CM", "LB"], "Recruit young and stay in the top half"],
    ["FK Jablonec", "JAB", 51, "#0a7d3c", "#f7d417", "survival", ["ST", "CDM"], "Qualify for the European play-offs"],
    ["Mladá Boleslav", "MBO", 50, "#1a53b0", "#ffffff", "survival", ["ST", "CB"], "Finish mid-table and stay comfortable"],
    ["Slovácko", "SLC", 50, "#1a53b0", "#ffffff", "survival", ["ST", "CM"], "Avoid the relegation group"],
    ["Bohemians 1905", "BOH", 49, "#0a7d3c", "#ffffff", "survival", ["ST", "CB", "GK"], "Keep the Prague underdogs up"],
    ["Hradec Králové", "HKR", 49, "#1a53b0", "#ffffff", "survival", ["ST", "CDM"], "Survive in the Fortuna Liga"],
    ["FK Teplice", "TEP", 48, "#f7d417", "#1a53b0", "survival", ["ST", "CB"], "Beat the drop"],
    ["Dukla Praha", "DUK", 47, "#7b1e2b", "#f7d417", "survival", ["GK", "CB", "ST"], "Stay up after promotion"],
    ["MFK Karviná", "KAR", 47, "#1a53b0", "#ffffff", "survival", ["ST", "CM", "CB"], "Escape the relegation places"],
  ]),

  /* ---------------- Romania ---------------- */
  worldLeague("rou-l1", "SuperLiga România", "Romania", 1, 52, [
    ["FCSB", "FCS", 55, "#e30613", "#1a53b0", "midTable", ["ST", "CB", "CM"], "Defend the title and stay in Europe"],
    ["CFR Cluj", "CFR", 54, "#7b1e2b", "#ffffff", "midTable", ["ST", "CDM", "CB"], "Win the championship play-off"],
    ["Universitatea Craiova", "UCV", 52, "#1a53b0", "#ffffff", "midTable", ["ST", "CAM", "CB"], "End the long wait for a league title"],
    ["Rapid București", "RBU", 51, "#7b1e2b", "#f7d417", "midTable", ["ST", "CM", "LB"], "Take Rapid back into Europe"],
    ["Dinamo București", "DIB", 50, "#e30613", "#ffffff", "survival", ["ST", "CB", "GK"], "Rebuild a fallen giant"],
    ["Farul Constanța", "FRL", 49, "#1a53b0", "#ffffff", "development", ["ST", "CM", "CB"], "Play the academy kids and reach the play-off"],
    ["Sepsi OSK", "SEP", 48, "#111111", "#ffffff", "survival", ["ST", "CDM"], "Stay in the championship group"],
    ["UTA Arad", "UTA", 47, "#e30613", "#ffffff", "survival", ["ST", "CB"], "Avoid the relegation play-out"],
    ["Petrolul Ploiești", "PET", 47, "#f7d417", "#1a53b0", "survival", ["ST", "CM"], "Survive in the SuperLiga"],
    ["FC Botoșani", "BOT", 46, "#e30613", "#f7d417", "survival", ["ST", "CB"], "Beat the drop on a small budget"],
    ["Oțelul Galați", "OTL", 46, "#e30613", "#ffffff", "survival", ["GK", "CB", "ST"], "Keep the club in the top flight"],
    ["FC Hermannstadt", "HSB", 46, "#e30613", "#111111", "survival", ["ST", "CDM"], "Stay clear of relegation"],
    ["Politehnica Iași", "POL", 46, "#1a53b0", "#ffffff", "survival", ["ST", "CB"], "Escape the bottom of the table"],
    ["Unirea Slobozia", "USL", 45, "#1a53b0", "#ffffff", "survival", ["GK", "CB", "ST"], "Survive the first season back"],
  ]),

  /* ---------------- Ukraine ---------------- */
  worldLeague("ukr-pl", "Ukrainian Premier League", "Ukraine", 1, 60, [
    ["Shakhtar Donetsk", "SHA", 66, "#f7931e", "#111111", "development", ["ST", "CAM", "CB"], "Win the title and unearth the next Brazilian gem"],
    ["Dynamo Kyiv", "DYN", 64, "#ffffff", "#1a53b0", "development", ["ST", "CB", "CM"], "Beat Shakhtar and win the league back"],
    ["Zorya Luhansk", "ZOR", 52, "#111111", "#ffffff", "development", ["ST", "CM", "LB"], "Develop young Ukrainians and reach Europe"],
    ["SC Dnipro-1", "DNI", 52, "#1a53b0", "#ffffff", "midTable", ["ST", "CB", "CDM"], "Qualify for European football"],
    ["Kryvbas", "KRY", 50, "#e30613", "#111111", "survival", ["ST", "CM"], "Finish in the top half"],
    ["Vorskla Poltava", "VOR", 50, "#0a7d3c", "#ffffff", "survival", ["ST", "CB"], "Stay clear of the relegation group"],
    ["Oleksandriya", "OLE", 50, "#f7d417", "#111111", "survival", ["ST", "CAM", "CB"], "Punch above the budget again"],
    ["Chornomorets Odesa", "CHO", 48, "#1a53b0", "#ffffff", "survival", ["ST", "CB", "GK"], "Keep Odesa in the Premier League"],
    ["Karpaty Lviv", "KRP", 48, "#0a7d3c", "#ffffff", "survival", ["ST", "CM"], "Re-establish Karpaty in the top flight"],
    ["Rukh Lviv", "RUK", 47, "#1a53b0", "#ffffff", "survival", ["ST", "CDM"], "Survive another season"],
    ["Kolos Kovalivka", "KOL", 47, "#0a7d3c", "#f7d417", "survival", ["ST", "CB"], "Keep the village club in the top flight"],
    ["Veres Rivne", "VER", 46, "#e30613", "#ffffff", "survival", ["GK", "CB", "ST"], "Beat the drop"],
    ["LNZ Cherkasy", "LNZ", 46, "#0a7d3c", "#ffffff", "survival", ["ST", "CM"], "Stay up after promotion"],
    ["Obolon Kyiv", "OBO", 45, "#1a53b0", "#ffffff", "survival", ["ST", "CB", "GK"], "Survive on the smallest budget in the league"],
  ]),
];
