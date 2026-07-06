import type { Rng } from "../rng";

// Original name pools per country used to generate AI squad player names.
// These are generated fictional players, not real people.

const SURNAMES: Record<string, string[]> = {
  Spain: ["Navarro", "Serrano", "Ibáñez", "Castell", "Herrera", "Roldán", "Cazorla", "Doménech", "Vives", "Alcaraz"],
  England: ["Whitfield", "Barrow", "Hartley", "Cresswell", "Osborne", "Fletcher", "Radcliffe", "Sowerby", "Denton", "Mercer"],
  Germany: ["Brandt", "Keller", "Vogler", "Sturm", "Reinhardt", "Falke", "Lindner", "Hoffner", "Ziegler", "Adler"],
  Italy: ["Moretti", "Rinaldi", "Càssano", "Ferretti", "De Luca", "Santoro", "Vitale", "Marchetti", "Colombo", "Grassi"],
  France: ["Lefèvre", "Moreau", "Garnier", "Perrin", "Chevalier", "Da Costa", "N'Diaye", "Rousseau", "Bellamy", "Voisin"],
  Portugal: ["Carvalho", "Antunes", "Sequeira", "Machado", "Tavares", "Peixoto", "Fonseca", "Barros", "Leitão", "Amaral"],
  Netherlands: ["Van Dam", "De Wit", "Koster", "Vermeer", "Hendriks", "Van Leeuwen", "Bosman", "Sneek", "Kuipers", "Brouwer"],
  Belgium: ["Vandenberg", "Claes", "Dumont", "Peeters", "Lambrecht", "Verhoeven", "Maes", "Gérard", "Willems", "Segers"],
  Scotland: ["MacAllister", "Buchanan", "Ferguson", "McCrae", "Lennox", "Douglas", "Kerr", "Blair", "Muir", "Cunningham"],
  Turkey: ["Yıldız", "Demir", "Kaya", "Şahin", "Aslan", "Çetin", "Koç", "Arslan", "Doğan", "Öztürk"],
  Greece: ["Papadakis", "Nikolaou", "Stavros", "Vasilakis", "Kotsis", "Alexiou", "Manos", "Petridis", "Zervas", "Doukas"],
  Serbia: ["Petrović", "Jovanović", "Stanković", "Milanović", "Đorđević", "Nikolić", "Radovanović", "Simić", "Kostić", "Lazić"],
  Croatia: ["Horvat", "Kovačić", "Babić", "Marić", "Jurić", "Novak", "Tomić", "Pavlović", "Šarić", "Vuković"],
  Ukraine: ["Kovalenko", "Bondarenko", "Tkachenko", "Shevchuk", "Melnyk", "Kravets", "Boyko", "Lysenko", "Moroz", "Rudenko"],
  Russia: ["Volkov", "Smirnov", "Kuznetsov", "Popov", "Sokolov", "Lebedev", "Kozlov", "Novikov", "Morozov", "Orlov"],
  Denmark: ["Jørgensen", "Andersen", "Nielsen", "Poulsen", "Madsen", "Kristensen", "Thomsen", "Bak", "Holm", "Dahl"],
  Sweden: ["Lindqvist", "Bergström", "Nyström", "Åkesson", "Holmberg", "Sandell", "Ekdahl", "Forsberg", "Lundgren", "Hedman"],
  Norway: ["Solbakken", "Haugen", "Berge", "Strand", "Iversen", "Dahl", "Moen", "Nygård", "Bakke", "Rønning"],
  Finland: ["Korhonen", "Virtanen", "Mäkinen", "Laine", "Heikkinen", "Salo", "Rantanen", "Niemi", "Aalto", "Kettunen"],
  Switzerland: ["Bühler", "Steiner", "Frei", "Zbinden", "Marti", "Wyss", "Kaufmann", "Roth", "Gerber", "Schmid"],
  Austria: ["Gruber", "Steindl", "Wallner", "Pichler", "Moser", "Leitner", "Hofer", "Egger", "Brunner", "Maier"],
  Czechia: ["Novák", "Svoboda", "Dvořák", "Černý", "Procházka", "Krejčí", "Horák", "Beneš", "Fiala", "Sedláček"],
  Poland: ["Kowalski", "Nowak", "Wiśniewski", "Wójcik", "Kamiński", "Zieliński", "Szymański", "Dąbrowski", "Kozłowski", "Mazur"],
  Hungary: ["Nagy", "Kovács", "Tóth", "Szabó", "Horváth", "Varga", "Kiss", "Molnár", "Németh", "Farkas"],
  Romania: ["Popescu", "Ionescu", "Stancu", "Dumitru", "Georgescu", "Marin", "Stoica", "Radu", "Munteanu", "Ciobanu"],
  Bulgaria: ["Ivanov", "Dimitrov", "Georgiev", "Petrov", "Todorov", "Stoyanov", "Hristov", "Kolev", "Angelov", "Iliev"],
  Moldova: ["Rusu", "Ceban", "Munteanu", "Sirbu", "Lungu", "Popa", "Turcan", "Gori", "Bragoi", "Cojocari"],
  Belarus: ["Kavaliou", "Zhuk", "Sidorenko", "Hleb", "Miakota", "Baranov", "Krot", "Salei", "Padolski", "Verameyeu"],
  Israel: ["Cohen", "Levi", "Peretz", "Ben-David", "Azoulay", "Malka", "Biton", "Ohana", "Dahan", "Amar"],
  Cyprus: ["Charalambous", "Ioannou", "Christofi", "Georgiou", "Constantinou", "Efrem", "Kyriakou", "Sotiriou", "Panayi", "Demetriou"],
  Azerbaijan: ["Aliyev", "Mammadov", "Hasanov", "Huseynov", "Guliyev", "Ismayilov", "Karimov", "Rzayev", "Bayramov", "Nabiyev"],
  Kazakhstan: ["Seydakhmet", "Zainutdinov", "Alip", "Bekturov", "Omarov", "Suyumbayev", "Tuyakbayev", "Erlanov", "Kairat", "Abiken"],
};

const FIRST_INITIALS = "ABCDEFGHIJKLMNOPRSTV";

export function generateAiName(rng: Rng, country: string): string {
  const pool = SURNAMES[country] ?? SURNAMES.Spain;
  const surname = pool[Math.floor(rng() * pool.length)];
  const initial = FIRST_INITIALS[Math.floor(rng() * FIRST_INITIALS.length)];
  return `${initial}. ${surname}`;
}

export function shortName(name: string): string {
  const bits = name.split(" ");
  if (bits.length === 1) return name;
  return bits[bits.length - 1];
}
