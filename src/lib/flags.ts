// Nationality → flag emoji for every nationality in the player database.
// Historical entities map to their modern flags; aliases are folded together.

const FLAG: Record<string, string> = {
  Albania: "🇦🇱", Algeria: "🇩🇿", Angola: "🇦🇴", Argentina: "🇦🇷", Armenia: "🇦🇲",
  Australia: "🇦🇺", Austria: "🇦🇹", Belarus: "🇧🇾", Belgium: "🇧🇪", Bolivia: "🇧🇴",
  "Bosnia & Herzegovina": "🇧🇦", "Bosnia and Herzegovina": "🇧🇦", Brazil: "🇧🇷",
  Bulgaria: "🇧🇬", "Burkina Faso": "🇧🇫", Cameroon: "🇨🇲", Canada: "🇨🇦", Chile: "🇨🇱",
  Colombia: "🇨🇴", Comoros: "🇰🇲", Congo: "🇨🇬", "Costa Rica": "🇨🇷", Croatia: "🇭🇷",
  Czechia: "🇨🇿", "Czech Republic": "🇨🇿", Czechoslovakia: "🇨🇿", "DR Congo": "🇨🇩",
  Denmark: "🇩🇰", "Dominican Republic": "🇩🇴", Ecuador: "🇪🇨", Egypt: "🇪🇬",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Estonia: "🇪🇪", Finland: "🇫🇮", France: "🇫🇷", Gambia: "🇬🇲",
  Georgia: "🇬🇪", Germany: "🇩🇪", "West Germany": "🇩🇪", "East Germany": "🇩🇪",
  Ghana: "🇬🇭", Greece: "🇬🇷", Guinea: "🇬🇳", Honduras: "🇭🇳", Hungary: "🇭🇺",
  Iceland: "🇮🇸", Iran: "🇮🇷", Ireland: "🇮🇪", "Republic of Ireland": "🇮🇪",
  Israel: "🇮🇱", Italy: "🇮🇹", "Ivory Coast": "🇨🇮", Jamaica: "🇯🇲", Japan: "🇯🇵",
  Kenya: "🇰🇪", Kosovo: "🇽🇰", Mali: "🇲🇱", Mexico: "🇲🇽", Montenegro: "🇲🇪",
  Morocco: "🇲🇦", Mozambique: "🇲🇿", Netherlands: "🇳🇱", Nigeria: "🇳🇬",
  "North Macedonia": "🇲🇰", "Northern Ireland": "🇬🇧", Norway: "🇳🇴", Paraguay: "🇵🇾",
  Peru: "🇵🇪", Poland: "🇵🇱", Portugal: "🇵🇹", Romania: "🇷🇴", Russia: "🇷🇺",
  "Soviet Union": "🇷🇺", Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", Senegal: "🇸🇳", Serbia: "🇷🇸",
  Slovakia: "🇸🇰", Slovenia: "🇸🇮", "South Africa": "🇿🇦", "South Korea": "🇰🇷",
  Spain: "🇪🇸", Sweden: "🇸🇪", Switzerland: "🇨🇭", Togo: "🇹🇬",
  "Trinidad and Tobago": "🇹🇹", Tunisia: "🇹🇳", Turkey: "🇹🇷", "Türkiye": "🇹🇷",
  Ukraine: "🇺🇦", "United States": "🇺🇸", Uruguay: "🇺🇾", Venezuela: "🇻🇪",
  Wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", Zambia: "🇿🇲", Zimbabwe: "🇿🇼", Yugoslavia: "🇷🇸",
};

/** Flag emoji for a nationality, or undefined when we don't know it.
 *  Used only where a real SVG can't be drawn (e.g. canvas image export —
 *  see lib/share-xi.ts). DOM UI should use <Flag> (components/Flag.tsx),
 *  which renders a real bundled flag-icons SVG instead of an emoji glyph. */
export function flagFor(nationality?: string): string | undefined {
  if (!nationality) return undefined;
  return FLAG[nationality] ?? FLAG[nationality.trim()];
}

// Nationality → flag-icons SVG code (ISO 3166-1 alpha-2, plus the UK's home
// nations and Kosovo, which flag-icons ships as gb-eng/gb-sct/gb-wls/gb-nir/xk).
// Historical entities map to their modern successor's flag, same as above.
const FLAG_CODE: Record<string, string> = {
  Albania: "al", Algeria: "dz", Angola: "ao", Argentina: "ar", Armenia: "am",
  Australia: "au", Austria: "at", Belarus: "by", Belgium: "be", Bolivia: "bo",
  "Bosnia & Herzegovina": "ba", "Bosnia and Herzegovina": "ba", Brazil: "br",
  Bulgaria: "bg", "Burkina Faso": "bf", Cameroon: "cm", Canada: "ca", Chile: "cl",
  Colombia: "co", Comoros: "km", Congo: "cg", "Costa Rica": "cr", Croatia: "hr",
  Czechia: "cz", "Czech Republic": "cz", Czechoslovakia: "cz", "DR Congo": "cd",
  Denmark: "dk", "Dominican Republic": "do", Ecuador: "ec", Egypt: "eg",
  England: "gb-eng", Estonia: "ee", Finland: "fi", France: "fr", Gambia: "gm",
  Georgia: "ge", Germany: "de", "West Germany": "de", "East Germany": "de",
  Ghana: "gh", Greece: "gr", Guinea: "gn", Honduras: "hn", Hungary: "hu",
  Iceland: "is", Iran: "ir", Ireland: "ie", "Republic of Ireland": "ie",
  Israel: "il", Italy: "it", "Ivory Coast": "ci", Jamaica: "jm", Japan: "jp",
  Kenya: "ke", Kosovo: "xk", Mali: "ml", Mexico: "mx", Montenegro: "me",
  Morocco: "ma", Mozambique: "mz", Netherlands: "nl", Nigeria: "ng",
  "North Macedonia": "mk", "Northern Ireland": "gb-nir", Norway: "no", Paraguay: "py",
  Peru: "pe", Poland: "pl", Portugal: "pt", Romania: "ro", Russia: "ru",
  "Soviet Union": "ru", Scotland: "gb-sct", Senegal: "sn", Serbia: "rs",
  Slovakia: "sk", Slovenia: "si", "South Africa": "za", "South Korea": "kr",
  Spain: "es", Sweden: "se", Switzerland: "ch", Togo: "tg",
  "Trinidad and Tobago": "tt", Tunisia: "tn", Turkey: "tr", "Türkiye": "tr",
  Ukraine: "ua", "United States": "us", Uruguay: "uy", Venezuela: "ve",
  Wales: "gb-wls", Zambia: "zm", Zimbabwe: "zw", Yugoslavia: "rs",
};

/** flag-icons SVG code for a nationality, or undefined when unknown. */
export function flagCodeFor(nationality?: string): string | undefined {
  if (!nationality) return undefined;
  return FLAG_CODE[nationality] ?? FLAG_CODE[nationality.trim()];
}
