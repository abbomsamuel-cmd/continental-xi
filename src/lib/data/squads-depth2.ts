import type { RawPlayer } from "../types";

// A second depth pass — mostly real defenders (with a few mids/forwards) to
// deepen the thin back-line pool so defensive rounds offer more options.
// Keyed by `${club}|${season}`, merged in players.ts (deduped by name).
// Format: [name, nationality, position, overall, altPositions?, {g,a,cs}?]

export const SQUAD_DEPTH_2: Record<string, RawPlayer[]> = {
  // ---- Classic era ----
  "Marseille|1993": [
    ["Jean-Philippe Durand", "France", "CM", 78, ["RM"]], ["Marcel Desailly", "France", "CB", 86],
    ["Éric Di Meco", "France", "LB", 81], ["Jocelyn Angloma", "France", "RB", 81],
  ],
  "Milan|1994": [
    ["Christian Panucci", "Italy", "RB", 82, ["CB"]], ["Alessandro Costacurta", "Italy", "CB", 85],
    ["Paolo Maldini", "Italy", "LB", 90, ["CB"]], ["Marcel Desailly", "France", "CB", 87],
  ],
  "Barcelona|1994": [
    ["Albert Ferrer", "Spain", "RB", 82], ["Sergi Barjuán", "Spain", "LB", 82],
    ["Miguel Ángel Nadal", "Spain", "CB", 83, ["CDM"]], ["Ronald Koeman", "Netherlands", "CB", 85],
  ],
  "Ajax|1995": [
    ["Michael Reiziger", "Netherlands", "RB", 82], ["Frank de Boer", "Netherlands", "CB", 84, ["LB"]],
    ["Danny Blind", "Netherlands", "CB", 83], ["Frank Rijkaard", "Netherlands", "CDM", 86, ["CB"]],
  ],
  "Juventus|1996": [
    ["Ciro Ferrara", "Italy", "CB", 86], ["Mark Iuliano", "Italy", "CB", 79],
    ["Gianluca Pessotto", "Italy", "LB", 81, ["RB"]], ["Moreno Torricelli", "Italy", "RB", 80],
  ],
  "Borussia Dortmund|1997": [
    ["Jürgen Kohler", "Germany", "CB", 86], ["Stefan Reuter", "Germany", "RB", 82],
    ["Wolfgang Feiersinger", "Austria", "CB", 78], ["Jörg Heinrich", "Germany", "LB", 80, ["LM"]],
  ],
  "Real Madrid|1998": [
    ["Roberto Carlos", "Brazil", "LB", 88, ["LWB"]], ["Fernando Hierro", "Spain", "CB", 87, ["CDM"]],
    ["Manolo Sanchís", "Spain", "CB", 83], ["Christian Panucci", "Italy", "RB", 82],
  ],
  "Manchester United|1999": [
    ["Gary Neville", "England", "RB", 84], ["Denis Irwin", "Ireland", "LB", 83],
    ["Ronny Johnsen", "Norway", "CB", 82], ["David May", "England", "CB", 76],
  ],
  "Dynamo Kyiv|1999": [
    ["Oleh Luzhny", "Ukraine", "RB", 82], ["Kakha Kaladze", "Georgia", "CB", 82, ["LB"]],
    ["Vladyslav Vashchuk", "Ukraine", "CB", 80], ["Serhiy Fedorov", "Ukraine", "CB", 78],
  ],
  "Bayern Munich|2001": [
    ["Willy Sagnol", "France", "RB", 82], ["Bixente Lizarazu", "France", "LB", 85],
    ["Thomas Linke", "Germany", "CB", 81], ["Robert Kovač", "Croatia", "CB", 80],
  ],
  "Valencia|2001": [
    ["Amedeo Carboni", "Italy", "LB", 81], ["Jocelyn Angloma", "France", "RB", 81],
    ["Mauricio Pellegrino", "Argentina", "CB", 82], ["Roberto Ayala", "Argentina", "CB", 86],
  ],
  "Bayer Leverkusen|2002": [
    ["Zé Roberto", "Brazil", "LB", 84, ["LM"]], ["Diego Placente", "Argentina", "LB", 80],
    ["Jens Nowotny", "Germany", "CB", 84], ["Lúcio", "Brazil", "CB", 86],
  ],
  "Real Madrid|2002": [
    ["Míchel Salgado", "Spain", "RB", 82], ["Roberto Carlos", "Brazil", "LB", 89],
    ["Iván Helguera", "Spain", "CB", 83, ["CDM"]], ["Fernando Hierro", "Spain", "CB", 85],
  ],
  "Newcastle United|2003": [
    ["Andy Griffin", "England", "RB", 75], ["Aaron Hughes", "Northern Ireland", "CB", 78, ["RB"]],
    ["Jonathan Woodgate", "England", "CB", 82], ["Olivier Bernard", "France", "LB", 77],
  ],
  "Milan|2003": [
    ["Cafu", "Brazil", "RB", 86, ["RWB"]], ["Paolo Maldini", "Italy", "CB", 89, ["LB"]],
    ["Alessandro Nesta", "Italy", "CB", 90], ["Kakha Kaladze", "Georgia", "LB", 81, ["CB"]],
  ],
  "Porto|2004": [
    ["Paulo Ferreira", "Portugal", "RB", 83], ["Nuno Valente", "Portugal", "LB", 80],
    ["Jorge Costa", "Portugal", "CB", 82], ["Ricardo Carvalho", "Portugal", "CB", 86],
  ],
  "Monaco|2004": [
    ["Hugo Ibarra", "Argentina", "RB", 79], ["Patrice Evra", "France", "LB", 82],
    ["Julien Rodriguez", "France", "CB", 80], ["Sébastien Squillaci", "France", "CB", 80],
  ],
  "Deportivo La Coruña|2004": [
    ["Manuel Pablo", "Spain", "RB", 80], ["Enrique Romero", "Spain", "LB", 78],
    ["Jorge Andrade", "Portugal", "CB", 82], ["Nourredine Naybet", "Morocco", "CB", 82],
  ],
  "Liverpool|2005": [
    ["Steve Finnan", "Ireland", "RB", 81], ["John Arne Riise", "Norway", "LB", 82, ["LM"]],
    ["Jamie Carragher", "England", "CB", 86], ["Sami Hyypiä", "Finland", "CB", 85],
  ],
  "Milan|2005": [
    ["Cafu", "Brazil", "RB", 85], ["Paolo Maldini", "Italy", "CB", 88, ["LB"]],
    ["Jaap Stam", "Netherlands", "CB", 85], ["Alessandro Nesta", "Italy", "CB", 89],
  ],
  "Barcelona|2006": [
    ["Oleguer", "Spain", "RB", 79], ["Giovanni van Bronckhorst", "Netherlands", "LB", 81],
    ["Carles Puyol", "Spain", "CB", 87], ["Rafael Márquez", "Mexico", "CB", 84, ["CDM"]],
  ],
  "Arsenal|2006": [
    ["Emmanuel Eboué", "Ivory Coast", "RB", 80, ["RM"]], ["Ashley Cole", "England", "LB", 85],
    ["Kolo Touré", "Ivory Coast", "CB", 84], ["Philippe Senderos", "Switzerland", "CB", 79],
  ],
  "Villarreal|2006": [
    ["Javi Venta", "Spain", "RB", 78], ["Quique Álvarez", "Spain", "CB", 79],
    ["Gonzalo Rodríguez", "Argentina", "CB", 82], ["Juan Pablo Sorín", "Argentina", "LB", 83, ["LM"]],
  ],
  "Milan|2007": [
    ["Massimo Oddo", "Italy", "RB", 81], ["Marek Jankulovski", "Czechia", "LB", 81],
    ["Alessandro Nesta", "Italy", "CB", 89], ["Paolo Maldini", "Italy", "CB", 87, ["LB"]],
  ],
  "Manchester United|2008": [
    ["Wes Brown", "England", "RB", 82, ["CB"]], ["Patrice Evra", "France", "LB", 85],
    ["Rio Ferdinand", "England", "CB", 89], ["Nemanja Vidić", "Serbia", "CB", 88],
  ],
  "Chelsea|2008": [
    ["Paulo Ferreira", "Portugal", "RB", 81], ["Ashley Cole", "England", "LB", 86],
    ["John Terry", "England", "CB", 88], ["Ricardo Carvalho", "Portugal", "CB", 86],
  ],
  "Barcelona|2009": [
    ["Dani Alves", "Brazil", "RB", 85], ["Éric Abidal", "France", "LB", 83, ["CB"]],
    ["Carles Puyol", "Spain", "CB", 87], ["Gerard Piqué", "Spain", "CB", 84],
  ],

  // ---- Modern era ----
  "Inter Milan|2010": [
    ["Maicon", "Brazil", "RB", 87, ["RWB"]], ["Cristian Chivu", "Romania", "LB", 81, ["CB"]],
    ["Lúcio", "Brazil", "CB", 86], ["Walter Samuel", "Argentina", "CB", 85],
  ],
  "Bayern Munich|2010": [
    ["Philipp Lahm", "Germany", "RB", 86, ["LB"]], ["Holger Badstuber", "Germany", "CB", 79, ["LB"]],
    ["Daniel Van Buyten", "Belgium", "CB", 82], ["Martín Demichelis", "Argentina", "CB", 81],
  ],
  "Barcelona|2011": [
    ["Dani Alves", "Brazil", "RB", 88], ["Éric Abidal", "France", "LB", 84, ["CB"]],
    ["Gerard Piqué", "Spain", "CB", 88], ["Javier Mascherano", "Argentina", "CB", 83, ["CDM"]],
  ],
  "Chelsea|2012": [
    ["Branislav Ivanović", "Serbia", "RB", 84, ["CB"]], ["Ashley Cole", "England", "LB", 85],
    ["David Luiz", "Brazil", "CB", 83, ["CDM"]], ["Gary Cahill", "England", "CB", 82],
  ],
  "Bayern Munich|2013": [
    ["Philipp Lahm", "Germany", "RB", 89], ["David Alaba", "Austria", "LB", 83],
    ["Jérôme Boateng", "Germany", "CB", 84], ["Dante", "Brazil", "CB", 84],
  ],
  "Borussia Dortmund|2013": [
    ["Łukasz Piszczek", "Poland", "RB", 83], ["Marcel Schmelzer", "Germany", "LB", 82],
    ["Mats Hummels", "Germany", "CB", 87], ["Neven Šubotić", "Serbia", "CB", 82],
  ],
  "Real Madrid|2014": [
    ["Dani Carvajal", "Spain", "RB", 82], ["Marcelo", "Brazil", "LB", 87, ["LWB"]],
    ["Sergio Ramos", "Spain", "CB", 88], ["Pepe", "Portugal", "CB", 85],
  ],
  "Atlético Madrid|2014": [
    ["Juanfran", "Spain", "RB", 83], ["Filipe Luís", "Brazil", "LB", 84],
    ["Diego Godín", "Uruguay", "CB", 87], ["Miranda", "Brazil", "CB", 84],
  ],
  "Barcelona|2015": [
    ["Dani Alves", "Brazil", "RB", 85], ["Jordi Alba", "Spain", "LB", 85],
    ["Gerard Piqué", "Spain", "CB", 87], ["Javier Mascherano", "Argentina", "CB", 85],
  ],
  "Juventus|2015": [
    ["Stephan Lichtsteiner", "Switzerland", "RB", 82], ["Patrice Evra", "France", "LB", 82],
    ["Leonardo Bonucci", "Italy", "CB", 86], ["Giorgio Chiellini", "Italy", "CB", 87],
  ],
  "Atlético Madrid|2016": [
    ["Juanfran", "Spain", "RB", 83], ["Filipe Luís", "Brazil", "LB", 84],
    ["Diego Godín", "Uruguay", "CB", 88], ["José Giménez", "Uruguay", "CB", 82],
  ],
  "Leicester City|2017": [
    ["Danny Simpson", "England", "RB", 77], ["Christian Fuchs", "Austria", "LB", 78],
    ["Wes Morgan", "Jamaica", "CB", 79], ["Robert Huth", "Germany", "CB", 78],
  ],
  "Monaco|2017": [
    ["Djibril Sidibé", "France", "RB", 81], ["Benjamin Mendy", "France", "LB", 82, ["LWB"]],
    ["Kamil Glik", "Poland", "CB", 82], ["Jemerson", "Brazil", "CB", 79],
  ],
  "Real Madrid|2017": [
    ["Dani Carvajal", "Spain", "RB", 85], ["Marcelo", "Brazil", "LB", 88, ["LWB"]],
    ["Sergio Ramos", "Spain", "CB", 90], ["Raphaël Varane", "France", "CB", 85],
  ],
  "Juventus|2017": [
    ["Dani Alves", "Brazil", "RB", 84, ["RWB"]], ["Alex Sandro", "Brazil", "LB", 84],
    ["Leonardo Bonucci", "Italy", "CB", 88], ["Andrea Barzagli", "Italy", "CB", 84],
  ],
  "Liverpool|2018": [
    ["Trent Alexander-Arnold", "England", "RB", 80], ["Andrew Robertson", "Scotland", "LB", 82],
    ["Virgil van Dijk", "Netherlands", "CB", 87], ["Dejan Lovren", "Croatia", "CB", 81],
  ],
  "Roma|2018": [
    ["Alessandro Florenzi", "Italy", "RB", 81, ["RM"]], ["Aleksandar Kolarov", "Serbia", "LB", 83],
    ["Kostas Manolas", "Greece", "CB", 84], ["Federico Fazio", "Argentina", "CB", 82],
  ],
  "Liverpool|2019": [
    ["Trent Alexander-Arnold", "England", "RB", 85], ["Andrew Robertson", "Scotland", "LB", 86],
    ["Virgil van Dijk", "Netherlands", "CB", 90], ["Joël Matip", "Cameroon", "CB", 82],
  ],
  "Tottenham Hotspur|2019": [
    ["Kieran Trippier", "England", "RB", 82], ["Danny Rose", "England", "LB", 81],
    ["Toby Alderweireld", "Belgium", "CB", 85], ["Jan Vertonghen", "Belgium", "CB", 85],
  ],
  "Ajax|2019": [
    ["Noussair Mazraoui", "Morocco", "RB", 80], ["Nicolás Tagliafico", "Argentina", "LB", 82],
    ["Matthijs de Ligt", "Netherlands", "CB", 86], ["Daley Blind", "Netherlands", "CB", 82, ["LB"]],
  ],
  "Bayern Munich|2020": [
    ["Benjamin Pavard", "France", "RB", 82], ["Alphonso Davies", "Canada", "LB", 84, ["LWB"]],
    ["Jérôme Boateng", "Germany", "CB", 83], ["David Alaba", "Austria", "CB", 85, ["LB"]],
  ],
  "Paris Saint-Germain|2020": [
    ["Thilo Kehrer", "Germany", "RB", 79, ["CB"]], ["Juan Bernat", "Spain", "LB", 81],
    ["Marquinhos", "Brazil", "CB", 86, ["CDM"]], ["Presnel Kimpembe", "France", "CB", 82],
  ],
  "RB Leipzig|2020": [
    ["Nordi Mukiele", "France", "RB", 80, ["CB"]], ["Angeliño", "Spain", "LB", 80, ["LWB"]],
    ["Dayot Upamecano", "France", "CB", 83], ["Lukas Klostermann", "Germany", "CB", 80, ["RB"]],
  ],
  "Chelsea|2021": [
    ["Reece James", "England", "RB", 82, ["RWB"]], ["Ben Chilwell", "England", "LB", 82],
    ["Antonio Rüdiger", "Germany", "CB", 84], ["Thiago Silva", "Brazil", "CB", 85],
  ],
  "Manchester City|2021": [
    ["Kyle Walker", "England", "RB", 84], ["Oleksandr Zinchenko", "Ukraine", "LB", 80, ["CM"]],
    ["Rúben Dias", "Portugal", "CB", 87], ["John Stones", "England", "CB", 84],
  ],
  "Real Madrid|2022": [
    ["Dani Carvajal", "Spain", "RB", 83], ["Ferland Mendy", "France", "LB", 83],
    ["Éder Militão", "Brazil", "CB", 84], ["David Alaba", "Austria", "CB", 85, ["LB"]],
  ],
  "Villarreal|2022": [
    ["Juan Foyth", "Argentina", "RB", 81, ["CB"]], ["Alfonso Pedraza", "Spain", "LB", 79],
    ["Pau Torres", "Spain", "CB", 84], ["Raúl Albiol", "Spain", "CB", 81],
  ],
  "Manchester City|2023": [
    ["Kyle Walker", "England", "RB", 84], ["Nathan Aké", "Netherlands", "LB", 83, ["CB"]],
    ["Rúben Dias", "Portugal", "CB", 88], ["Manuel Akanji", "Switzerland", "CB", 84],
  ],
  "Inter Milan|2023": [
    ["Denzel Dumfries", "Netherlands", "RWB", 82, ["RB"]], ["Federico Dimarco", "Italy", "LWB", 83, ["LB"]],
    ["Alessandro Bastoni", "Italy", "CB", 85], ["Milan Škriniar", "Slovakia", "CB", 84],
  ],
  "Napoli|2023": [
    ["Giovanni Di Lorenzo", "Italy", "RB", 83], ["Mário Rui", "Portugal", "LB", 79],
    ["Kim Min-jae", "South Korea", "CB", 85], ["Amir Rrahmani", "Kosovo", "CB", 82],
  ],
  "Real Madrid|2024": [
    ["Dani Carvajal", "Spain", "RB", 85], ["Ferland Mendy", "France", "LB", 82],
    ["Antonio Rüdiger", "Germany", "CB", 86], ["Nacho", "Spain", "CB", 82, ["LB"]],
  ],
  "Borussia Dortmund|2024": [
    ["Julian Ryerson", "Norway", "RB", 78, ["LB"]], ["Ian Maatsen", "Netherlands", "LB", 80],
    ["Mats Hummels", "Germany", "CB", 85], ["Nico Schlotterbeck", "Germany", "CB", 83],
  ],
  "Paris Saint-Germain|2025": [
    ["Achraf Hakimi", "Morocco", "RB", 87, ["RWB"]], ["Nuno Mendes", "Portugal", "LB", 85, ["LWB"]],
    ["Marquinhos", "Brazil", "CB", 85], ["Willian Pacho", "Ecuador", "CB", 83],
  ],
  "Inter Milan|2025": [
    ["Denzel Dumfries", "Netherlands", "RWB", 84, ["RB"]], ["Federico Dimarco", "Italy", "LWB", 84, ["LB"]],
    ["Alessandro Bastoni", "Italy", "CB", 86], ["Francesco Acerbi", "Italy", "CB", 82],
  ],
  "Barcelona|2025": [
    ["Jules Koundé", "France", "RB", 85, ["CB"]], ["Alejandro Balde", "Spain", "LB", 83],
    ["Pau Cubarsí", "Spain", "CB", 84], ["Iñigo Martínez", "Spain", "CB", 84],
  ],
  "Arsenal|2025": [
    ["Jurrien Timber", "Netherlands", "RB", 83, ["CB"]], ["Myles Lewis-Skelly", "England", "LB", 79],
    ["William Saliba", "France", "CB", 87], ["Gabriel Magalhães", "Brazil", "CB", 86],
  ],
  "Bayer Leverkusen|2025": [
    ["Jeremie Frimpong", "Netherlands", "RWB", 83, ["RB"]], ["Alejandro Grimaldo", "Spain", "LWB", 85, ["LB"]],
    ["Jonathan Tah", "Germany", "CB", 85], ["Edmond Tapsoba", "Burkina Faso", "CB", 83],
  ],
  "Aston Villa|2025": [
    ["Matty Cash", "Poland", "RB", 80], ["Lucas Digne", "France", "LB", 80],
    ["Ezri Konsa", "England", "CB", 82], ["Pau Torres", "Spain", "CB", 83],
  ],
  "Shakhtar Donetsk|2011": [
    ["Darijo Srna", "Croatia", "RB", 84, ["RWB"]], ["Răzvan Raț", "Romania", "LB", 80],
    ["Dmytro Chygrynskiy", "Ukraine", "CB", 80], ["Yaroslav Rakitskiy", "Ukraine", "CB", 81],
  ],
  "Galatasaray|2013": [
    ["Sabri Sarıoğlu", "Turkey", "RB", 77], ["Hakan Balta", "Turkey", "LB", 77, ["CB"]],
    ["Tomáš Ujfaluši", "Czechia", "CB", 79], ["Semih Kaya", "Turkey", "CB", 78],
  ],
  "Porto|2011": [
    ["Sapunaru", "Romania", "RB", 77, ["CB"]], ["Álvaro Pereira", "Uruguay", "LB", 81],
    ["Rolando", "Portugal", "CB", 80], ["Nicolás Otamendi", "Argentina", "CB", 82],
  ],
  "Benfica|2023": [
    ["Alexander Bah", "Denmark", "RB", 80], ["Alejandro Grimaldo", "Spain", "LB", 84, ["LWB"]],
    ["António Silva", "Portugal", "CB", 81], ["Nicolás Otamendi", "Argentina", "CB", 84],
  ],
  "Atalanta|2020": [
    ["Hans Hateboer", "Netherlands", "RWB", 80, ["RB"]], ["Robin Gosens", "Germany", "LWB", 82, ["LB"]],
    ["Rafael Tolói", "Italy", "CB", 81], ["José Luis Palomino", "Argentina", "CB", 80],
  ],
  "PSV Eindhoven|2005": [
    ["André Ooijer", "Netherlands", "RB", 80, ["CB"]], ["Lee Young-pyo", "South Korea", "LB", 79],
    ["Alex", "Brazil", "CB", 83], ["Wilfred Bouma", "Netherlands", "CB", 80, ["LB"]],
  ],
  "Celtic|2013": [
    ["Mikael Lustig", "Sweden", "RB", 78], ["Emilio Izaguirre", "Honduras", "LB", 77],
    ["Efe Ambrose", "Nigeria", "CB", 76], ["Kelvin Wilson", "England", "CB", 76],
  ],
  "Olympiacos|2014": [
    ["Omar Elabdellaoui", "Norway", "RB", 76], ["José Holebas", "Greece", "LB", 78, ["LWB"]],
    ["Kostas Manolas", "Greece", "CB", 81], ["Dimitris Siovas", "Greece", "CB", 77],
  ],
  "Red Star Belgrade|2019": [
    ["Marko Gobeljić", "Serbia", "RB", 74], ["Milan Rodić", "Serbia", "LB", 75],
    ["Vujadin Savić", "Serbia", "CB", 76], ["Nemanja Milunović", "Serbia", "CB", 75],
  ],
  "Sevilla|2018": [
    ["Jesús Navas", "Spain", "RB", 82, ["RM"]], ["Sergio Escudero", "Spain", "LB", 79],
    ["Clément Lenglet", "France", "CB", 82], ["Simon Kjær", "Denmark", "CB", 81],
  ],
  "Basel|2014": [
    ["Philipp Degen", "Switzerland", "RB", 76], ["Behrang Safari", "Sweden", "LB", 76],
    ["Fabian Schär", "Switzerland", "CB", 80], ["Aleksandar Dragović", "Austria", "CB", 79],
  ],
  "Red Bull Salzburg|2020": [
    ["Rasmus Kristensen", "Denmark", "RB", 77], ["Andreas Ulmer", "Austria", "LB", 77],
    ["Maximilian Wöber", "Austria", "CB", 78], ["Jérôme Onguéné", "Cameroon", "CB", 77],
  ],
};
