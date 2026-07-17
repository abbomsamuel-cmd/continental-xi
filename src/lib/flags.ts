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

/** Flag emoji for a nationality, or undefined when we don't know it. */
export function flagFor(nationality?: string): string | undefined {
  if (!nationality) return undefined;
  return FLAG[nationality] ?? FLAG[nationality.trim()];
}
