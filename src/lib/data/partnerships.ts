// Historic partnerships. Any pair of names within a group that ends up in the
// same drafted XI receives a special chemistry bonus.

export interface Partnership {
  label: string;
  players: string[];
}

export const PARTNERSHIPS: Partnership[] = [
  { label: "MSN", players: ["Lionel Messi", "Luis Suárez", "Neymar"] },
  { label: "BBC", players: ["Cristiano Ronaldo", "Karim Benzema", "Gareth Bale"] },
  { label: "Tiki-Taka Core", players: ["Xavi", "Andrés Iniesta", "Sergio Busquets"] },
  { label: "Madrid Engine Room", players: ["Luka Modrić", "Toni Kroos", "Casemiro"] },
  { label: "Rossoneri Wall", players: ["Paolo Maldini", "Alessandro Nesta", "Franco Baresi"] },
  { label: "Old Trafford Rock", players: ["Nemanja Vidić", "Rio Ferdinand"] },
  { label: "Robbery", players: ["Arjen Robben", "Franck Ribéry"] },
  { label: "Catalan Guard", players: ["Gerard Piqué", "Carles Puyol"] },
  { label: "Bavarian Spine", players: ["Philipp Lahm", "Bastian Schweinsteiger"] },
  { label: "Fergie's Wings", players: ["Ryan Giggs", "David Beckham", "Paul Scholes"] },
  { label: "Anfield Front Three", players: ["Mohamed Salah", "Sadio Mané", "Roberto Firmino"] },
  { label: "Gegenpress Full-backs", players: ["Trent Alexander-Arnold", "Andrew Robertson"] },
  { label: "Nerazzurri Treble", players: ["Wesley Sneijder", "Diego Milito", "Samuel Eto'o"] },
  { label: "Milan Metronome", players: ["Andrea Pirlo", "Gennaro Gattuso", "Clarence Seedorf"] },
  { label: "Galáctico Axis", players: ["Zinédine Zidane", "Luís Figo", "Raúl"] },
  { label: "Kyiv-to-Milan Pipeline", players: ["Andriy Shevchenko", "Kakha Kaladze"] },
  { label: "City Conductors", players: ["Kevin De Bruyne", "Erling Haaland"] },
  { label: "Bernabéu Wingback Line", players: ["Marcelo", "Cristiano Ronaldo"] },
  { label: "Gerrard–Alonso Double Pivot", players: ["Steven Gerrard", "Xabi Alonso"] },
  { label: "Drogba–Lampard Link", players: ["Didier Drogba", "Frank Lampard"] },
  { label: "Kane–Son Connection", players: ["Harry Kane", "Son Heung-min"] },
  { label: "Yamal–Raphinha Flick Wings", players: ["Lamine Yamal", "Raphinha"] },
  { label: "Parisian New Wave", players: ["Ousmane Dembélé", "Vitinha", "Achraf Hakimi"] },
  { label: "Aimar–Mendieta Craft", players: ["Pablo Aimar", "Gaizka Mendieta"] },
  { label: "Dream Team Front", players: ["Romário", "Hristo Stoichkov", "Michael Laudrup"] },
  { label: "Ajax Academy '95", players: ["Jari Litmanen", "Frank de Boer", "Ronald de Boer", "Marc Overmars"] },
  { label: "Klopp's Dortmund Core", players: ["Robert Lewandowski", "Marco Reus", "Mario Götze", "Mats Hummels"] },
  { label: "Atleti Iron Curtain", players: ["Diego Godín", "Jan Oblak"] },
  { label: "Mbappé–Neymar Combo", players: ["Kylian Mbappé", "Neymar"] },
  { label: "Kaká–Pirlo Supply Line", players: ["Kaká", "Andrea Pirlo"] },
  { label: "Bianconeri Old Guard", players: ["Gianluigi Buffon", "Giorgio Chiellini", "Leonardo Bonucci"] },
  { label: "Ronaldinho–Eto'o Duet", players: ["Ronaldinho", "Samuel Eto'o"] },
  { label: "Highbury Speed", players: ["Thierry Henry", "Robert Pires"] },
  { label: "Sheva–Rebrov", players: ["Andriy Shevchenko", "Serhiy Rebrov"] },
  { label: "Kroos–Modrić Dial", players: ["Toni Kroos", "Luka Modrić"] },
  { label: "Inzaghi's Shadow", players: ["Filippo Inzaghi", "Andrea Pirlo"] },
  { label: "Neverlusen Spine", players: ["Florian Wirtz", "Granit Xhaka", "Alejandro Grimaldo"] },
];
