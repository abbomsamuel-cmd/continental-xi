import type { RawPlayer } from "../types";

// Additional real bench / rotation players per squad, keyed by `${club}|${season}`.
// Merged onto each squad at expansion time (see players.ts) so every drawn team
// has more selectable depth — a backup keeper plus extra defenders, a midfielder
// and a forward — without touching the curated starting groups. Ratings are
// deliberately modest (squad-player level). Format:
//   [name, nationality, position, overall, altPositions?, {g,a,cs}?]

export const SQUAD_DEPTH: Record<string, RawPlayer[]> = {
  // ---- Classic era ----
  "Marseille|1993": [
    ["Pascal Olmeta", "France", "GK", 79], ["Jean-Christophe Thomas", "France", "CM", 75],
    ["Bernard Casoni", "France", "CB", 79], ["Franck Sauzée", "France", "CDM", 82],
    ["Alen Bokšić", "Croatia", "CF", 82], ["Rudi Völler", "Germany", "CF", 84],
  ],
  "Milan|1994": [
    ["Marco Simone", "Italy", "ST", 81], ["Stefano Eranio", "Italy", "RM", 80],
    ["Filippo Galli", "Italy", "CB", 80], ["Gianluigi Lentini", "Italy", "RW", 80],
    ["Brian Laudrup", "Denmark", "CF", 83], ["Fernando De Napoli", "Italy", "CM", 79],
  ],
  "Barcelona|1994": [
    ["Julen Lopetegui", "Spain", "GK", 77], ["Miguel Ángel Nadal", "Spain", "CB", 83, ["CDM"]],
    ["Juan Carlos Rodríguez", "Spain", "LB", 78], ["Eusebio Sacristán", "Spain", "CM", 80],
    ["Jordi Cruyff", "Netherlands", "CAM", 78], ["Julio Salinas", "Spain", "ST", 80],
  ],
  "Ajax|1995": [
    ["Fred Grim", "Netherlands", "GK", 74], ["Winston Bogarde", "Netherlands", "CB", 82, ["LB"]],
    ["John Veldman", "Netherlands", "CB", 78], ["Peter van Vossen", "Netherlands", "ST", 79],
    ["Nordin Wooter", "Netherlands", "RW", 75],
  ],
  "Juventus|1996": [
    ["Michelangelo Rampulla", "Italy", "GK", 76], ["Sergio Porrini", "Italy", "RB", 79, ["CB"]],
    ["Pietro Vierchowod", "Italy", "CB", 82], ["Alessio Tacchinardi", "Italy", "CM", 79, ["CDM"]],
    ["Michele Padovano", "Italy", "ST", 78], ["Attilio Lombardo", "Italy", "RM", 82],
  ],
  "Borussia Dortmund|1997": [
    ["Wolfgang de Beer", "Germany", "GK", 74], ["Martin Kree", "Germany", "CB", 78],
    ["Steffen Freund", "Germany", "CDM", 80], ["Heiko Herrlich", "Germany", "ST", 81],
    ["Ibrahim Tanko", "Ghana", "ST", 76], ["Julio César", "Brazil", "CB", 79],
  ],
  "Real Madrid|1998": [
    ["Santiago Cañizares", "Spain", "GK", 82], ["Christian Panucci", "Italy", "RB", 82, ["CB"]],
    ["Iván Campo", "Spain", "CB", 79, ["CDM"]], ["Guti", "Spain", "CAM", 79, ["CM"]],
    ["Davor Šuker", "Croatia", "ST", 84], ["Fernando Sanchís", "Spain", "CB", 76],
  ],
  "Manchester United|1999": [
    ["Raimond van der Gouw", "Netherlands", "GK", 76], ["Henning Berg", "Norway", "CB", 82],
    ["Phil Neville", "England", "LB", 80, ["CM"]], ["Nicky Butt", "England", "CM", 82, ["CDM"]],
    ["Jesper Blomqvist", "Sweden", "LM", 79], ["Jordi Cruyff", "Netherlands", "CF", 76],
  ],
  "Dynamo Kyiv|1999": [
    ["Vitaliy Reva", "Ukraine", "GK", 78], ["Vladyslav Vashchuk", "Ukraine", "CB", 80],
    ["Oleksandr Holovko", "Ukraine", "CB", 80], ["Vasyl Kardash", "Ukraine", "CM", 77],
    ["Serhiy Mizin", "Ukraine", "LM", 77], ["Georgi Demetradze", "Georgia", "ST", 78],
  ],
  "Bayern Munich|2001": [
    ["Bernd Dreher", "Germany", "GK", 74], ["Patrik Andersson", "Sweden", "CB", 82],
    ["Robert Kovač", "Croatia", "CB", 80], ["Ciriaco Sforza", "Switzerland", "CDM", 80],
    ["Alexander Zickler", "Germany", "ST", 78], ["Roque Santa Cruz", "Paraguay", "ST", 79],
  ],
  "Valencia|2001": [
    ["Andrés Palop", "Spain", "GK", 79], ["Fabio Aurélio", "Brazil", "LB", 81, ["LM"]],
    ["David Albelda", "Spain", "CDM", 82], ["Vicente", "Spain", "LW", 82, ["LM"]],
    ["Juan Sánchez", "Spain", "ST", 79], ["Zlatko Zahovič", "Slovenia", "CAM", 82],
  ],
  "Bayer Leverkusen|2002": [
    ["Jörg Butt", "Germany", "GK", 82], ["Diego Placente", "Argentina", "LB", 81],
    ["Boris Živković", "Croatia", "RB", 79, ["CB"]], ["Thomas Brdarić", "Germany", "ST", 77],
    ["Ulf Kirsten", "Germany", "ST", 79], ["Bernd Schneider", "Germany", "RM", 84],
  ],
  "Real Madrid|2002": [
    ["César Sánchez", "Spain", "GK", 80], ["Aitor Karanka", "Spain", "CB", 79],
    ["Flávio Conceição", "Brazil", "CDM", 81], ["Steve McManaman", "England", "RM", 82, ["CAM"]],
    ["Guti", "Spain", "CAM", 82, ["CM"]], ["Fernando Morientes", "Spain", "ST", 84],
  ],
  "Newcastle United|2003": [
    ["Steve Harper", "England", "GK", 77], ["Andy Griffin", "England", "RB", 74],
    ["Titus Bramble", "England", "CB", 77], ["Jermaine Jenas", "England", "CM", 79, ["CAM"]],
    ["Hugo Viana", "Portugal", "CM", 77], ["Shola Ameobi", "England", "ST", 76],
  ],
  "Milan|2003": [
    ["Christian Abbiati", "Italy", "GK", 82], ["Thomas Helveg", "Denmark", "RB", 80],
    ["Martin Laursen", "Denmark", "CB", 80], ["Massimo Ambrosini", "Italy", "CM", 82, ["CDM"]],
    ["Jon Dahl Tomasson", "Denmark", "ST", 81, ["CF"]], ["Rivaldo", "Brazil", "CAM", 84, ["LW"]],
  ],
  "Porto|2004": [
    ["Nuno Espírito Santo", "Portugal", "GK", 78], ["Pedro Emanuel", "Portugal", "CB", 79],
    ["Bosingwa", "Portugal", "RB", 80, ["RWB"]], ["Pedro Mendes", "Portugal", "CM", 80, ["CDM"]],
    ["Hélder Postiga", "Portugal", "ST", 79], ["Nélson", "Portugal", "RB", 76],
  ],
  "Monaco|2004": [
    ["Tony Sylva", "Senegal", "GK", 78], ["Julien Rodriguez", "France", "CB", 80],
    ["Gaël Givet", "France", "CB", 81, ["LB"]], ["Édouard Cissé", "France", "CDM", 79],
    ["Shabani Nonda", "DR Congo", "ST", 82], ["Emmanuel Adebayor", "Togo", "ST", 78],
  ],
  "Deportivo La Coruña|2004": [
    ["José Molina", "Spain", "GK", 78], ["César Martín", "Spain", "CB", 79],
    ["Nourredine Naybet", "Morocco", "CB", 82], ["Sergio", "Spain", "CDM", 80],
    ["Roy Makaay", "Netherlands", "ST", 83], ["Albert Luque", "Spain", "LW", 82, ["ST"]],
  ],
  "Liverpool|2005": [
    ["Scott Carson", "England", "GK", 74], ["Josemi", "Spain", "RB", 76],
    ["Mauricio Pellegrino", "Argentina", "CB", 79], ["Antonio Núñez", "Spain", "RM", 76],
    ["Igor Bišćan", "Croatia", "CM", 78, ["CB"]], ["Fernando Morientes", "Spain", "ST", 82],
  ],
  "Milan|2005": [
    ["Christian Abbiati", "Italy", "GK", 82], ["Kakha Kaladze", "Georgia", "CB", 82, ["LB"]],
    ["Alessandro Costacurta", "Italy", "CB", 81], ["Massimo Ambrosini", "Italy", "CM", 82, ["CDM"]],
    ["Jon Dahl Tomasson", "Denmark", "ST", 80], ["Rui Costa", "Portugal", "CAM", 83],
  ],
  "Barcelona|2006": [
    ["Jorquera", "Spain", "GK", 75], ["Juliano Belletti", "Brazil", "RB", 82, ["RWB"]],
    ["Lilian Thuram", "France", "CB", 83], ["Sylvinho", "Brazil", "LB", 80],
    ["Santiago Ezquerro", "Spain", "ST", 77], ["Maxi López", "Argentina", "ST", 76],
  ],
  "Arsenal|2006": [
    ["Manuel Almunia", "Spain", "GK", 79], ["Philippe Senderos", "Switzerland", "CB", 80],
    ["Mathieu Flamini", "France", "LB", 80, ["CM"]], ["Abou Diaby", "France", "CM", 78, ["CAM"]],
    ["Robin van Persie", "Netherlands", "ST", 82, ["LW"]], ["Emmanuel Adebayor", "Togo", "ST", 81],
  ],
  "Villarreal|2006": [
    ["Mariano Barbosa", "Argentina", "GK", 76], ["Rodolfo Arruabarrena", "Argentina", "LB", 78],
    ["Gonzalo Rodríguez", "Argentina", "CB", 82], ["Josico", "Spain", "CM", 78, ["CDM"]],
    ["Juan Pablo Sorín", "Argentina", "LB", 84, ["LM"]], ["Diego Forlán", "Uruguay", "ST", 85],
  ],
  "Milan|2007": [
    ["Zeljko Kalac", "Australia", "GK", 78], ["Marek Jankulovski", "Czechia", "LB", 81],
    ["Kakha Kaladze", "Georgia", "CB", 81], ["Yoann Gourcuff", "France", "CAM", 78, ["CM"]],
    ["Ricardo Oliveira", "Brazil", "ST", 79], ["Kakha Kaladze", "Georgia", "LB", 80],
  ],
  "Manchester United|2008": [
    ["Tomasz Kuszczak", "Poland", "GK", 78], ["John O'Shea", "Ireland", "RB", 80, ["CB"]],
    ["Mikaël Silvestre", "France", "CB", 80, ["LB"]], ["Anderson", "Brazil", "CM", 82, ["CAM"]],
    ["Louis Saha", "France", "ST", 82], ["Darren Fletcher", "Scotland", "CM", 80],
  ],
  "Chelsea|2008": [
    ["Carlo Cudicini", "Italy", "GK", 80], ["Paulo Ferreira", "Portugal", "RB", 81],
    ["Alex", "Brazil", "CB", 83], ["Juliano Belletti", "Brazil", "RB", 80, ["RWB"]],
    ["Shaun Wright-Phillips", "England", "RW", 80], ["Andriy Shevchenko", "Ukraine", "ST", 82],
  ],
  "Barcelona|2009": [
    ["José Manuel Pinto", "Spain", "GK", 78], ["Rafael Márquez", "Mexico", "CB", 83, ["CDM"]],
    ["Sylvinho", "Brazil", "LB", 78], ["Aliaksandr Hleb", "Belarus", "CAM", 82, ["RW"]],
    ["Bojan Krkić", "Spain", "ST", 79, ["LW"]], ["Martín Cáceres", "Uruguay", "CB", 78, ["RB"]],
  ],

  // ---- Modern era ----
  "Inter Milan|2010": [
    ["Júlio César", "Brazil", "GK", 88], ["Davide Santon", "Italy", "RB", 77, ["LB"]],
    ["Marco Materazzi", "Italy", "CB", 80], ["Sulley Muntari", "Ghana", "CM", 81, ["CDM"]],
    ["Mario Balotelli", "Italy", "ST", 82], ["McDonald Mariga", "Kenya", "CDM", 78],
  ],
  "Bayern Munich|2010": [
    ["Hans-Jörg Butt", "Germany", "GK", 82], ["José Ernesto Sosa", "Argentina", "CAM", 79],
    ["Anatoliy Tymoshchuk", "Ukraine", "CDM", 81, ["CB"]], ["Miroslav Klose", "Germany", "ST", 83],
    ["Danijel Pranjić", "Croatia", "LB", 78, ["LM"]], ["Edson Braafheid", "Netherlands", "LB", 76],
  ],
  "Barcelona|2011": [
    ["José Manuel Pinto", "Spain", "GK", 79], ["Maxwell", "Brazil", "LB", 81],
    ["Adriano", "Brazil", "RB", 80, ["LB"]], ["Ibrahim Afellay", "Netherlands", "CAM", 80, ["RW"]],
    ["Bojan Krkić", "Spain", "ST", 79], ["Andreu Fontàs", "Spain", "CB", 74],
  ],
  "Chelsea|2012": [
    ["Ross Turnbull", "England", "GK", 73], ["José Bosingwa", "Portugal", "RB", 80],
    ["Paulo Ferreira", "Portugal", "RB", 78], ["Raul Meireles", "Portugal", "CM", 82, ["CDM"]],
    ["Florent Malouda", "France", "LW", 81, ["LM"]], ["Daniel Sturridge", "England", "ST", 80],
  ],
  "Bayern Munich|2013": [
    ["Tom Starke", "Germany", "GK", 74], ["Rafinha", "Brazil", "RB", 80],
    ["Anatoliy Tymoshchuk", "Ukraine", "CDM", 79, ["CB"]], ["Xherdan Shaqiri", "Switzerland", "RW", 82, ["CAM"]],
    ["Claudio Pizarro", "Peru", "ST", 79], ["Emre Can", "Germany", "CM", 74],
  ],
  "Borussia Dortmund|2013": [
    ["Mitchell Langerak", "Australia", "GK", 76], ["Felipe Santana", "Brazil", "CB", 79],
    ["Julian Schieber", "Germany", "ST", 75], ["Moritz Leitner", "Germany", "CM", 76, ["CAM"]],
    ["Nuri Şahin", "Turkey", "CM", 82, ["CDM"]], ["Marian Sarr", "Germany", "CB", 72],
  ],
  "Real Madrid|2014": [
    ["Diego López", "Spain", "GK", 83], ["Fábio Coentrão", "Portugal", "LB", 82, ["LM"]],
    ["Nacho", "Spain", "CB", 79, ["RB"]], ["Asier Illarramendi", "Spain", "CDM", 80],
    ["Álvaro Morata", "Spain", "ST", 80], ["Jesé", "Spain", "RW", 79, ["ST"]],
  ],
  "Atlético Madrid|2014": [
    ["Daniel Aranzubia", "Spain", "GK", 76], ["Toby Alderweireld", "Belgium", "CB", 82, ["RB"]],
    ["Cristian Ansaldi", "Argentina", "LB", 78], ["José Sosa", "Argentina", "CAM", 79],
    ["Adrián López", "Spain", "ST", 79], ["Diego Ribas", "Brazil", "CAM", 82],
  ],
  "Barcelona|2015": [
    ["Jordi Masip", "Spain", "GK", 74], ["Douglas", "Brazil", "RB", 75],
    ["Thomas Vermaelen", "Belgium", "CB", 80], ["Sergi Roberto", "Spain", "CM", 79, ["RB"]],
    ["Munir El Haddadi", "Spain", "ST", 76, ["LW"]], ["Adriano", "Brazil", "LB", 79, ["RB"]],
  ],
  "Juventus|2015": [
    ["Marco Storari", "Italy", "GK", 78], ["Martín Cáceres", "Uruguay", "CB", 80, ["RB"]],
    ["Kingsley Coman", "France", "LW", 78, ["RW"]], ["Roberto Pereyra", "Argentina", "CAM", 80, ["CM"]],
    ["Fernando Llorente", "Spain", "ST", 81], ["Simone Padoin", "Italy", "RB", 74, ["CM"]],
  ],
  "Atlético Madrid|2016": [
    ["Miguel Ángel Moyà", "Spain", "GK", 80], ["Stefan Savić", "Montenegro", "CB", 82],
    ["Lucas Hernández", "France", "CB", 76, ["LB"]], ["Thomas Partey", "Ghana", "CDM", 76],
    ["Ángel Correa", "Argentina", "ST", 79, ["RW"]], ["Luciano Vietto", "Argentina", "ST", 77],
  ],
  "Leicester City|2017": [
    ["Ron-Robert Zieler", "Germany", "GK", 78], ["Yohan Benalouane", "Tunisia", "CB", 76],
    ["Daniel Amartey", "Ghana", "CDM", 76, ["CB"]], ["Demarai Gray", "England", "RW", 78, ["LW"]],
    ["Ahmed Musa", "Nigeria", "RW", 78, ["ST"]], ["Nampalys Mendy", "France", "CDM", 77],
  ],
  "Monaco|2017": [
    ["Morgan De Sanctis", "Italy", "GK", 78], ["Andrea Raggi", "Italy", "CB", 78, ["RB"]],
    ["Nabil Dirar", "Morocco", "RB", 79, ["RM"]], ["Gabriel Boschilia", "Brazil", "CAM", 75],
    ["Guido Carrillo", "Argentina", "ST", 77], ["Almamy Touré", "Mali", "RB", 74],
  ],
  "Real Madrid|2017": [
    ["Kiko Casilla", "Spain", "GK", 80], ["Nacho", "Spain", "CB", 82, ["RB"]],
    ["Fábio Coentrão", "Portugal", "LB", 80], ["Mateo Kovačić", "Croatia", "CM", 82, ["CDM"]],
    ["Álvaro Morata", "Spain", "ST", 83], ["Lucas Vázquez", "Spain", "RW", 81, ["RM"]],
  ],
  "Juventus|2017": [
    ["Neto", "Brazil", "GK", 80], ["Medhi Benatia", "Morocco", "CB", 84],
    ["Kwadwo Asamoah", "Ghana", "LB", 80, ["LM"]], ["Claudio Marchisio", "Italy", "CM", 82, ["CDM"]],
    ["Marko Pjaca", "Croatia", "LW", 77], ["Stefano Sturaro", "Italy", "CM", 76],
  ],
  "Liverpool|2018": [
    ["Loris Karius", "Germany", "GK", 78], ["Ragnar Klavan", "Estonia", "CB", 79],
    ["Joe Gomez", "England", "CB", 78, ["RB"]], ["Emre Can", "Germany", "CM", 82, ["CDM"]],
    ["Danny Ings", "England", "ST", 76], ["Dominic Solanke", "England", "ST", 74],
  ],
  "Roma|2018": [
    ["Alisson", "Brazil", "GK", 85], ["Bruno Peres", "Brazil", "RB", 78, ["RWB"]],
    ["Juan Jesus", "Brazil", "CB", 78, ["LB"]], ["Maxime Gonalons", "France", "CDM", 78],
    ["Diego Perotti", "Argentina", "LW", 80, ["CAM"]], ["Gregoire Defrel", "France", "ST", 76],
  ],
  "Liverpool|2019": [
    ["Simon Mignolet", "Belgium", "GK", 79], ["Joe Gomez", "England", "CB", 81, ["RB"]],
    ["Dejan Lovren", "Croatia", "CB", 81], ["Naby Keïta", "Guinea", "CM", 83, ["CDM"]],
    ["Adam Lallana", "England", "CAM", 79], ["Alex Oxlade-Chamberlain", "England", "CM", 81],
  ],
  "Tottenham Hotspur|2019": [
    ["Paulo Gazzaniga", "Argentina", "GK", 77], ["Serge Aurier", "Ivory Coast", "RB", 80, ["RWB"]],
    ["Davinson Sánchez", "Colombia", "CB", 81], ["Victor Wanyama", "Kenya", "CDM", 79],
    ["Érik Lamela", "Argentina", "RW", 80, ["CAM"]], ["Christian Eriksen", "Denmark", "CAM", 85],
  ],
  "Ajax|2019": [
    ["Bruno Varela", "Portugal", "GK", 74], ["Joël Veltman", "Netherlands", "CB", 79, ["RB"]],
    ["Rasmus Kristensen", "Denmark", "RB", 76], ["Carel Eiting", "Netherlands", "CM", 76, ["CDM"]],
    ["Klaas-Jan Huntelaar", "Netherlands", "ST", 79], ["Zakaria Labyad", "Morocco", "CAM", 76],
  ],
  "Bayern Munich|2020": [
    ["Sven Ulreich", "Germany", "GK", 78], ["Álvaro Odriozola", "Spain", "RB", 78],
    ["Lucas Hernández", "France", "CB", 84, ["LB"]], ["Corentin Tolisso", "France", "CM", 82, ["CDM"]],
    ["Philippe Coutinho", "Brazil", "CAM", 83, ["LW"]], ["Javi Martínez", "Spain", "CDM", 81, ["CB"]],
  ],
  "Paris Saint-Germain|2020": [
    ["Sergio Rico", "Spain", "GK", 79], ["Layvin Kurzawa", "France", "LB", 78],
    ["Thilo Kehrer", "Germany", "CB", 80, ["RB"]], ["Idrissa Gueye", "Senegal", "CDM", 83],
    ["Pablo Sarabia", "Spain", "RW", 81, ["CAM"]], ["Leandro Paredes", "Argentina", "CM", 81, ["CDM"]],
  ],
  "RB Leipzig|2020": [
    ["Yvon Mvogo", "Switzerland", "GK", 76], ["Nordi Mukiele", "France", "RB", 80, ["CB"]],
    ["Ibrahima Konaté", "France", "CB", 80], ["Amadou Haidara", "Mali", "CM", 79, ["CDM"]],
    ["Patrik Schick", "Czechia", "ST", 80], ["Christopher Nkunku", "France", "CAM", 81, ["ST"]],
  ],
  "Chelsea|2021": [
    ["Kepa Arrizabalaga", "Spain", "GK", 79], ["Kurt Zouma", "France", "CB", 81],
    ["Marcos Alonso", "Spain", "LB", 81, ["LWB"]], ["Mateo Kovačić", "Croatia", "CM", 83, ["CDM"]],
    ["Hakim Ziyech", "Morocco", "RW", 83, ["CAM"]], ["Olivier Giroud", "France", "ST", 81],
  ],
  "Manchester City|2021": [
    ["Zack Steffen", "United States", "GK", 76], ["Aymeric Laporte", "France", "CB", 85, ["LB"]],
    ["Nathan Aké", "Netherlands", "CB", 81, ["LB"]], ["Fernandinho", "Brazil", "CDM", 82, ["CB"]],
    ["Ferran Torres", "Spain", "RW", 81, ["ST"]], ["Sergio Agüero", "Argentina", "ST", 85],
  ],
  "Real Madrid|2022": [
    ["Andriy Lunin", "Ukraine", "GK", 77], ["Nacho", "Spain", "CB", 81, ["LB"]],
    ["Lucas Vázquez", "Spain", "RB", 80, ["RM"]], ["Marco Asensio", "Spain", "RW", 82, ["CAM"]],
    ["Luka Jović", "Serbia", "ST", 78], ["Mariano Díaz", "Dominican Republic", "ST", 76],
  ],
  "Villarreal|2022": [
    ["Filip Jörgensen", "Denmark", "GK", 74], ["Alberto Moreno", "Spain", "LB", 78, ["LM"]],
    ["Aïssa Mandi", "Algeria", "CB", 80], ["Manu Trigueros", "Spain", "CM", 79, ["CAM"]],
    ["Boulaye Dia", "Senegal", "ST", 78], ["Yeremy Pino", "Spain", "RW", 78, ["LW"]],
  ],
  "Manchester City|2023": [
    ["Stefan Ortega", "Germany", "GK", 79], ["Aymeric Laporte", "France", "CB", 84, ["LB"]],
    ["Sergio Gómez", "Spain", "LB", 76, ["LM"]], ["Kalvin Phillips", "England", "CDM", 80],
    ["Riyad Mahrez", "Algeria", "RW", 85, ["CAM"]], ["Cole Palmer", "England", "CAM", 78, ["RW"]],
  ],
  "Inter Milan|2023": [
    ["Samir Handanović", "Slovenia", "GK", 82], ["Danilo D'Ambrosio", "Italy", "RB", 78, ["CB"]],
    ["Robin Gosens", "Germany", "LWB", 80, ["LM"]], ["Roberto Gagliardini", "Italy", "CM", 77],
    ["Joaquín Correa", "Argentina", "ST", 79, ["CF"]], ["Raoul Bellanova", "Italy", "RWB", 76, ["RB"]],
  ],
  "Napoli|2023": [
    ["Pierluigi Gollini", "Italy", "GK", 78], ["Leo Østigård", "Norway", "CB", 77],
    ["Mário Rui", "Portugal", "LB", 79], ["Tanguy Ndombélé", "France", "CM", 80, ["CAM"]],
    ["Giacomo Raspadori", "Italy", "ST", 80, ["CF"]], ["Giovanni Simeone", "Argentina", "ST", 79],
  ],
  "Real Madrid|2024": [
    ["Andriy Lunin", "Ukraine", "GK", 82], ["Fran García", "Spain", "LB", 79, ["LM"]],
    ["Éder Militão", "Brazil", "CB", 85], ["David Alaba", "Austria", "CB", 84, ["LB"]],
    ["Brahim Díaz", "Spain", "CAM", 81, ["RW"]], ["Fede Valverde", "Uruguay", "RM", 87, ["CM"]],
  ],
  "Borussia Dortmund|2024": [
    ["Alexander Meyer", "Germany", "GK", 73], ["Ramy Bensebaini", "Algeria", "LB", 80, ["CB"]],
    ["Mateu Morey", "Spain", "RB", 74], ["Salih Özcan", "Turkey", "CDM", 78],
    ["Sébastien Haller", "Ivory Coast", "ST", 80], ["Youssoufa Moukoko", "Germany", "ST", 76],
  ],
  "Paris Saint-Germain|2025": [
    ["Matvey Safonov", "Russia", "GK", 79], ["Lucas Beraldo", "Brazil", "CB", 78],
    ["Lucas Hernández", "France", "CB", 82, ["LB"]], ["Fabián Ruiz", "Spain", "CM", 85, ["CDM"]],
    ["Gonçalo Ramos", "Portugal", "ST", 82], ["Lee Kang-in", "South Korea", "CAM", 80, ["RW"]],
  ],
  "Inter Milan|2025": [
    ["Josep Martínez", "Spain", "GK", 78], ["Yann Bisseck", "Germany", "CB", 80, ["RB"]],
    ["Carlos Augusto", "Brazil", "LWB", 80, ["LB"]], ["Nicolò Barella", "Italy", "CM", 87],
    ["Marko Arnautović", "Austria", "ST", 76], ["Mehdi Taremi", "Iran", "ST", 79, ["CF"]],
  ],
  "Barcelona|2025": [
    ["Iñaki Peña", "Spain", "GK", 78], ["Ronald Araújo", "Uruguay", "CB", 85, ["RB"]],
    ["Gerard Martín", "Spain", "LB", 74], ["Fermín López", "Spain", "CAM", 80, ["CM"]],
    ["Gavi", "Spain", "CM", 82, ["CAM"]], ["Pau Víctor", "Spain", "ST", 74],
  ],
  "Arsenal|2025": [
    ["Kepa Arrizabalaga", "Spain", "GK", 79], ["Ben White", "England", "RB", 83, ["CB"]],
    ["Riccardo Calafiori", "Italy", "CB", 81, ["LB"]], ["Jorginho", "Italy", "CDM", 80],
    ["Gabriel Jesus", "Brazil", "ST", 82, ["RW"]], ["Raheem Sterling", "England", "LW", 80],
  ],
  "Bayer Leverkusen|2025": [
    ["Matěj Kovář", "Czechia", "GK", 76], ["Josip Stanišić", "Croatia", "RB", 79, ["CB"]],
    ["Robert Andrich", "Germany", "CDM", 81, ["CM"]], ["Amine Adli", "Morocco", "LW", 79, ["RW"]],
    ["Martin Terrier", "France", "ST", 80, ["LW"]], ["Aleix García", "Spain", "CM", 80, ["CDM"]],
  ],
  "Aston Villa|2025": [
    ["Robin Olsen", "Sweden", "GK", 76], ["Ian Maatsen", "Netherlands", "LB", 78, ["LM"]],
    ["Tyrone Mings", "England", "CB", 80], ["Ross Barkley", "England", "CM", 79, ["CAM"]],
    ["Jhon Durán", "Colombia", "ST", 78], ["Leon Bailey", "Jamaica", "RW", 80, ["LW"]],
  ],
  "Shakhtar Donetsk|2011": [
    ["Andriy Pyatov", "Ukraine", "GK", 81], ["Răzvan Raț", "Romania", "LB", 80],
    ["Dmytro Chygrynskiy", "Ukraine", "CB", 80], ["Alex Teixeira", "Brazil", "CAM", 79, ["RW"]],
    ["Luiz Adriano", "Brazil", "ST", 81], ["Marlos", "Brazil", "RW", 77],
  ],
  "Galatasaray|2013": [
    ["Aykut Erçetin", "Turkey", "GK", 74], ["Gökhan Zan", "Turkey", "CB", 77],
    ["Tomáš Ujfaluši", "Czechia", "CB", 79, ["RB"]], ["Felipe Melo", "Brazil", "CDM", 80],
    ["Umut Bulut", "Turkey", "ST", 76], ["Aydın Yılmaz", "Turkey", "RW", 74],
  ],
  "Porto|2011": [
    ["Beto", "Portugal", "GK", 77], ["Rolando", "Portugal", "CB", 80],
    ["Sapunaru", "Romania", "RB", 77, ["CB"]], ["Souza", "Brazil", "CDM", 78],
    ["Silvestre Varela", "Portugal", "RW", 80, ["LW"]], ["Walter", "Brazil", "ST", 76],
  ],
  "Benfica|2023": [
    ["Samuel Soares", "Portugal", "GK", 73], ["Jan Vertonghen", "Belgium", "CB", 80, ["LB"]],
    ["Gilberto", "Brazil", "RB", 77, ["RWB"]], ["Chiquinho", "Portugal", "CM", 78, ["CAM"]],
    ["Petar Musa", "Croatia", "ST", 77], ["Henrique Araújo", "Portugal", "ST", 73],
  ],
  "Atalanta|2020": [
    ["Marco Sportiello", "Italy", "GK", 78], ["Simon Kjær", "Denmark", "CB", 81],
    ["Timothy Castagne", "Belgium", "RWB", 80, ["RB"]], ["Ruslan Malinovskyi", "Ukraine", "CAM", 80, ["CM"]],
    ["Alejandro Gómez", "Argentina", "LW", 84, ["CAM"]], ["Musa Barrow", "Gambia", "ST", 76],
  ],
  "PSV Eindhoven|2005": [
    ["Gomes", "Brazil", "GK", 82], ["Kasper Bøgelund", "Denmark", "RB", 76],
    ["Wilfred Bouma", "Netherlands", "CB", 80, ["LB"]], ["Johann Vogel", "Switzerland", "CDM", 80],
    ["Jan Vennegoor of Hesselink", "Netherlands", "ST", 80], ["Robert", "Brazil", "ST", 76],
  ],
  "Celtic|2013": [
    ["Lukasz Zaluska", "Poland", "GK", 73], ["Mikael Lustig", "Sweden", "RB", 78, ["CB"]],
    ["Charlie Mulgrew", "Scotland", "CB", 76, ["LB"]], ["Beram Kayal", "Israel", "CM", 76, ["CDM"]],
    ["Anthony Stokes", "Ireland", "ST", 76], ["James Forrest", "Scotland", "RW", 77, ["RM"]],
  ],
  "Olympiacos|2014": [
    ["Balázs Megyeri", "Hungary", "GK", 75], ["Éric Abidal", "France", "CB", 80, ["LB"]],
    ["Omar Elabdellaoui", "Norway", "RB", 76, ["RM"]], ["Delvin N'Dinga", "Congo", "CDM", 77],
    ["Michael Olaitan", "Nigeria", "ST", 74], ["Javier Saviola", "Argentina", "ST", 78, ["CF"]],
  ],
  "Red Star Belgrade|2019": [
    ["Filip Manojlović", "Serbia", "GK", 74], ["Filip Stojković", "Serbia", "RB", 74],
    ["Srđan Babić", "Serbia", "CB", 75], ["Slavoljub Srnić", "Serbia", "RM", 75, ["RW"]],
    ["Richmond Boakye", "Ghana", "ST", 76], ["Lorenzo Ebecilio", "Netherlands", "CAM", 74],
  ],
  "Sevilla|2018": [
    ["David Soria", "Spain", "GK", 78], ["Gabriel Mercado", "Argentina", "CB", 79, ["RB"]],
    ["Sebastián Corchia", "France", "RB", 76], ["Guido Pizarro", "Argentina", "CDM", 79],
    ["Nolito", "Spain", "LW", 79, ["ST"]], ["Sandro Ramírez", "Spain", "ST", 76],
  ],
  "Basel|2014": [
    ["Germano Vailati", "Switzerland", "GK", 74], ["Arlind Ajeti", "Albania", "CB", 74],
    ["Naser Aliji", "Albania", "LB", 73], ["Serey Die", "Ivory Coast", "CDM", 77],
    ["Marcelo Díaz", "Chile", "CM", 79, ["CDM"]], ["Mohamed Elneny", "Egypt", "CM", 76],
  ],
  "Red Bull Salzburg|2020": [
    ["Alexander Walke", "Germany", "GK", 74], ["Albert Vallci", "Austria", "RB", 75, ["CB"]],
    ["Patson Daka", "Zambia", "ST", 79], ["Mohamed Camara", "Mali", "CDM", 76],
    ["Antoine Bernede", "France", "CM", 73, ["CAM"]], ["Sékou Koïta", "Mali", "ST", 76, ["RW"]],
  ],
};
