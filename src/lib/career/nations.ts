/* ------------------------------------------------------------------ */
/*  Nations — the expanded nationality database.                       */
/*                                                                     */
/*  A career should be able to start anywhere. Not just the twelve     */
/*  nations that win World Cups: a Curaçao winger, a Solomon Islands   */
/*  keeper and a Kosovar No. 10 are all legitimate stories, and each   */
/*  one has a believable route into the world's leagues.               */
/*                                                                     */
/*  `strength` is national-team level, 0–100 — it colours how the      */
/*  world reacts to a player (call-ups, scouting reach, the size of a  */
/*  breakthrough). Brazil/France ~92, Panama ~48, Fiji ~20.            */
/*                                                                     */
/*  `affinity` is a short list of world-DB league ids a player of this */
/*  nationality most plausibly starts at or moves to — the pipelines   */
/*  that actually exist in football (Cape Verde → Portugal, Curaçao →  */
/*  the Netherlands, Ghana → Belgium, Uzbekistan → the Gulf). Ids are  */
/*  plain strings on purpose: importing the club files from here would */
/*  create a cycle, and an id the world DB does not (yet) carry is     */
/*  simply ignored by callers.                                         */
/* ------------------------------------------------------------------ */

export type NationRegion =
  | "Europe"
  | "South America"
  | "North America"
  | "Central America"
  | "Caribbean"
  | "Africa"
  | "Asia"
  | "Middle East"
  | "Oceania";

export interface Nation {
  name: string; // official country name
  flag: string; // emoji flag
  region: NationRegion;
  strength: number; // 0-100 national-team strength (Brazil/France ~92, Panama ~48, Fiji ~20)
  /** Leagues in the world DB this nation's players most plausibly start or move to, by league id. */
  affinity: string[];
}

export const REGIONS: NationRegion[] = [
  "Europe",
  "South America",
  "North America",
  "Central America",
  "Caribbean",
  "Africa",
  "Asia",
  "Middle East",
  "Oceania",
];

/** Compact authoring tuple so a whole region is a readable block of lines. */
type RawNation = [name: string, flag: string, strength: number, affinity: string[]];

function group(r: NationRegion, raw: RawNation[]): Nation[] {
  return raw.map(([name, flag, strength, affinity]) => ({ name, flag, region: r, strength, affinity }));
}

export const NATIONS: Nation[] = [
  /* -------------------------------- Europe ------------------------------- */
  // The home nations carry their own sub-flags; Northern Ireland has no
  // sub-flag emoji any platform actually renders, so it flies the Union Jack.
  ...group("Europe", [
    ["England", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", 90, ["eng-pl", "eng-ch", "sco-pr", "ita-sa"]],
    ["Scotland", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", 62, ["sco-pr", "eng-ch", "eng-pl"]],
    ["Wales", "🏴󠁧󠁢󠁷󠁬󠁳󠁿", 60, ["eng-pl", "eng-ch", "sco-pr"]],
    ["Northern Ireland", "🇬🇧", 52, ["eng-ch", "eng-pl", "sco-pr"]],
    ["Ireland", "🇮🇪", 56, ["eng-ch", "eng-pl", "sco-pr"]],
    ["Spain", "🇪🇸", 92, ["esp-ll", "esp-l2", "eng-pl", "ita-sa"]],
    ["France", "🇫🇷", 92, ["fra-l1", "eng-pl", "esp-ll", "ita-sa"]],
    ["Germany", "🇩🇪", 88, ["ger-bl", "eng-pl", "aut-bl", "sui-sl"]],
    ["Italy", "🇮🇹", 87, ["ita-sa", "ita-sb", "eng-pl", "esp-ll"]],
    ["Portugal", "🇵🇹", 90, ["por-pl", "esp-ll", "eng-pl", "fra-l1"]],
    ["Netherlands", "🇳🇱", 87, ["ned-ed", "bel-pl", "eng-pl", "ger-bl"]],
    ["Belgium", "🇧🇪", 84, ["bel-pl", "ned-ed", "eng-pl", "fra-l1"]],
    ["Croatia", "🇭🇷", 84, ["cro-hnl", "ita-sa", "ger-bl", "aut-bl"]],
    ["Serbia", "🇷🇸", 76, ["srb-sl", "ita-sa", "ger-bl", "tur-sl"]],
    ["Bosnia and Herzegovina", "🇧🇦", 64, ["cro-hnl", "aut-bl", "ger-bl", "tur-sl"]],
    ["Slovenia", "🇸🇮", 62, ["aut-bl", "ita-sa", "ger-bl", "cro-hnl"]],
    ["Slovakia", "🇸🇰", 63, ["cze-fl", "aut-bl", "ger-bl", "ita-sa"]],
    ["Czech Republic", "🇨🇿", 70, ["cze-fl", "ger-bl", "eng-pl", "aut-bl"]],
    ["Poland", "🇵🇱", 70, ["pol-ek", "ger-bl", "ita-sa", "eng-pl"]],
    ["Ukraine", "🇺🇦", 72, ["ukr-pl", "ita-sa", "eng-pl", "pol-ek"]],
    ["Romania", "🇷🇴", 63, ["rou-l1", "ita-sa", "tur-sl", "esp-ll"]],
    ["Bulgaria", "🇧🇬", 52, ["bul-pl", "tur-sl", "rou-l1", "ita-sb"]],
    ["Greece", "🇬🇷", 66, ["gre-sl", "ita-sa", "eng-ch", "tur-sl"]],
    ["Turkey", "🇹🇷", 74, ["tur-sl", "ger-bl", "ned-ed", "eng-pl"]],
    ["Austria", "🇦🇹", 76, ["aut-bl", "ger-bl", "sui-sl", "ned-ed"]],
    ["Switzerland", "🇨🇭", 76, ["sui-sl", "ger-bl", "ita-sa", "fra-l1"]],
    ["Denmark", "🇩🇰", 80, ["den-sl", "ned-ed", "ger-bl", "eng-pl"]],
    ["Sweden", "🇸🇪", 70, ["swe-al", "ned-ed", "ita-sa", "eng-pl"]],
    ["Norway", "🇳🇴", 72, ["nor-el", "ned-ed", "eng-pl", "ger-bl"]],
    ["Finland", "🇫🇮", 56, ["fin-vl", "swe-al", "ned-ed", "eng-ch"]],
    ["Iceland", "🇮🇸", 55, ["nor-el", "swe-al", "den-sl", "eng-ch"]],
    ["Hungary", "🇭🇺", 66, ["hun-nb", "aut-bl", "ger-bl", "ita-sa"]],
    ["Albania", "🇦🇱", 58, ["ita-sa", "ita-sb", "gre-sl", "sui-sl"]],
    ["Kosovo", "🇽🇰", 52, ["sui-sl", "ger-bl", "tur-sl", "ita-sb"]],
    ["North Macedonia", "🇲🇰", 53, ["gre-sl", "tur-sl", "cro-hnl", "ita-sb"]],
    ["Montenegro", "🇲🇪", 55, ["srb-sl", "ita-sb", "tur-sl", "cro-hnl"]],
    ["Georgia", "🇬🇪", 60, ["geo-el", "ita-sa", "ned-ed", "tur-sl"]],
    ["Armenia", "🇦🇲", 46, ["arm-pl", "rou-l1", "cyp-fd", "pol-ek"]],
    ["Azerbaijan", "🇦🇿", 44, ["aze-pl", "tur-sl", "rou-l1", "pol-ek"]],
    ["Cyprus", "🇨🇾", 44, ["cyp-fd", "gre-sl", "eng-ch", "por-pl"]],
  ]),

  /* ---------------------------- South America ---------------------------- */
  ...group("South America", [
    ["Argentina", "🇦🇷", 93, ["arg-pd", "esp-ll", "ita-sa", "por-pl", "mex-mx"]],
    ["Brazil", "🇧🇷", 92, ["bra-sa", "por-pl", "esp-ll", "eng-pl", "ita-sa"]],
    ["Uruguay", "🇺🇾", 84, ["uru-pd", "arg-pd", "ita-sa", "esp-ll", "bra-sa"]],
    ["Colombia", "🇨🇴", 84, ["col-pa", "bra-sa", "esp-ll", "por-pl", "mex-mx"]],
    ["Ecuador", "🇪🇨", 76, ["ecu-lp", "bra-sa", "esp-ll", "eng-pl", "mex-mx"]],
    ["Chile", "🇨🇱", 70, ["chi-pd", "arg-pd", "bra-sa", "esp-ll", "mex-mx"]],
    ["Paraguay", "🇵🇾", 68, ["par-pd", "arg-pd", "bra-sa", "esp-ll", "mex-mx"]],
    ["Peru", "🇵🇪", 66, ["per-l1", "bra-sa", "mex-mx", "por-pl", "arg-pd"]],
    ["Venezuela", "🇻🇪", 62, ["ven-pf", "por-pl", "esp-ll", "bra-sa", "usa-mls"]],
    ["Bolivia", "🇧🇴", 55, ["bol-pd", "arg-pd", "bra-sa", "mex-mx"]],
  ]),

  /* ---------------------------- North America ---------------------------- */
  ...group("North America", [
    ["United States", "🇺🇸", 78, ["usa-mls", "eng-ch", "ger-bl", "ned-ed", "bel-pl"]],
    ["Mexico", "🇲🇽", 78, ["mex-mx", "usa-mls", "esp-ll", "ned-ed", "bel-pl"]],
    ["Canada", "🇨🇦", 72, ["usa-mls", "eng-ch", "bel-pl", "ita-sa"]],
  ]),

  /* --------------------------- Central America --------------------------- */
  ...group("Central America", [
    ["Costa Rica", "🇨🇷", 58, ["usa-mls", "mex-mx", "bel-pl", "ned-ed"]],
    ["Honduras", "🇭🇳", 50, ["usa-mls", "mex-mx", "gre-sl"]],
    ["Panama", "🇵🇦", 48, ["usa-mls", "mex-mx", "por-pl", "bel-pl"]],
    ["Guatemala", "🇬🇹", 46, ["mex-mx", "usa-mls", "esp-l2"]],
    ["El Salvador", "🇸🇻", 42, ["usa-mls", "mex-mx", "por-pl"]],
    ["Nicaragua", "🇳🇮", 32, ["mex-mx", "usa-mls"]],
    ["Belize", "🇧🇿", 24, ["usa-mls", "mex-mx"]],
  ]),

  /* ------------------------------- Caribbean ----------------------------- */
  ...group("Caribbean", [
    ["Jamaica", "🇯🇲", 56, ["eng-ch", "eng-pl", "usa-mls", "sco-pr"]],
    ["Trinidad and Tobago", "🇹🇹", 46, ["usa-mls", "eng-ch", "sco-pr"]],
    ["Haiti", "🇭🇹", 46, ["fra-l1", "usa-mls", "bel-pl", "mex-mx"]],
    ["Curacao", "🇨🇼", 44, ["ned-ed", "bel-pl", "usa-mls"]],
    ["Dominican Republic", "🇩🇴", 38, ["usa-mls", "esp-l2", "mex-mx"]],
    ["Cuba", "🇨🇺", 34, ["usa-mls", "mex-mx", "esp-l2"]],
    ["Puerto Rico", "🇵🇷", 28, ["usa-mls", "esp-l2", "mex-mx"]],
    ["Grenada", "🇬🇩", 26, ["eng-ch", "usa-mls", "sco-pr"]],
    ["Barbados", "🇧🇧", 24, ["eng-ch", "usa-mls"]],
    ["Aruba", "🇦🇼", 22, ["ned-ed", "bel-pl", "usa-mls"]],
  ]),

  /* -------------------------------- Africa ------------------------------- */
  ...group("Africa", [
    ["Morocco", "🇲🇦", 86, ["mar-bo", "fra-l1", "esp-ll", "ned-ed", "bel-pl"]],
    ["Senegal", "🇸🇳", 84, ["fra-l1", "eng-pl", "bel-pl", "esp-ll"]],
    ["Nigeria", "🇳🇬", 80, ["eng-pl", "eng-ch", "bel-pl", "por-pl", "tur-sl"]],
    ["Ivory Coast", "🇨🇮", 78, ["fra-l1", "eng-pl", "bel-pl", "tur-sl"]],
    ["Egypt", "🇪🇬", 76, ["egy-pl", "eng-pl", "tur-sl", "por-pl", "ksa-pl"]],
    ["Algeria", "🇩🇿", 74, ["alg-l1", "fra-l1", "tur-sl", "por-pl"]],
    ["Ghana", "🇬🇭", 74, ["eng-ch", "ger-bl", "bel-pl", "ita-sa"]],
    ["Cameroon", "🇨🇲", 72, ["fra-l1", "ger-bl", "bel-pl", "tur-sl"]],
    ["Tunisia", "🇹🇳", 70, ["tun-l1", "fra-l1", "bel-pl", "tur-sl"]],
    ["Mali", "🇲🇱", 70, ["fra-l1", "bel-pl", "por-pl", "tur-sl"]],
    ["DR Congo", "🇨🇩", 68, ["bel-pl", "fra-l1", "tur-sl", "por-pl"]],
    ["Burkina Faso", "🇧🇫", 66, ["fra-l1", "bel-pl", "tur-sl", "por-pl"]],
    ["Guinea", "🇬🇳", 64, ["fra-l1", "bel-pl", "esp-ll", "tur-sl"]],
    ["South Africa", "🇿🇦", 64, ["rsa-pl", "bel-pl", "ned-ed", "eng-ch"]],
    ["Cape Verde", "🇨🇻", 60, ["por-pl", "ned-ed", "bel-pl", "fra-l1"]],
    ["Angola", "🇦🇴", 54, ["por-pl", "bel-pl", "fra-l1"]],
    ["Gabon", "🇬🇦", 52, ["fra-l1", "tur-sl", "bel-pl"]],
    ["Gambia", "🇬🇲", 50, ["bel-pl", "ita-sa", "tur-sl", "fra-l1"]],
    ["Zambia", "🇿🇲", 50, ["rsa-pl", "bel-pl", "eng-ch"]],
    ["Congo", "🇨🇬", 48, ["fra-l1", "bel-pl", "por-pl"]],
    ["Uganda", "🇺🇬", 46, ["rsa-pl", "eng-ch", "tur-sl"]],
    ["Mozambique", "🇲🇿", 44, ["por-pl", "rsa-pl", "bel-pl"]],
    ["Zimbabwe", "🇿🇼", 44, ["rsa-pl", "eng-ch", "bel-pl"]],
    ["Kenya", "🇰🇪", 44, ["rsa-pl", "eng-ch", "bel-pl"]],
    ["Tanzania", "🇹🇿", 44, ["rsa-pl", "egy-pl", "bel-pl"]],
    ["Ethiopia", "🇪🇹", 36, ["egy-pl", "rsa-pl", "ksa-pl"]],
  ]),

  /* --------------------------------- Asia -------------------------------- */
  ...group("Asia", [
    ["Japan", "🇯🇵", 82, ["jpn-j1", "ger-bl", "bel-pl", "ned-ed", "eng-pl"]],
    ["South Korea", "🇰🇷", 80, ["kor-k1", "ger-bl", "eng-pl", "jpn-j1", "por-pl"]],
    ["Uzbekistan", "🇺🇿", 60, ["uzb-sl", "tur-sl", "kor-k1", "ksa-pl"]],
    ["China", "🇨🇳", 50, ["chn-sl", "por-pl", "esp-l2", "jpn-j1"]],
    ["Thailand", "🇹🇭", 46, ["tha-t1", "jpn-j1", "bel-pl", "kor-k1"]],
    ["Vietnam", "🇻🇳", 46, ["vie-v1", "tha-t1", "jpn-j1", "kor-k1"]],
    ["Kazakhstan", "🇰🇿", 46, ["kaz-pl", "tur-sl", "pol-ek", "uzb-sl"]],
    ["Indonesia", "🇮🇩", 44, ["idn-l1", "ned-ed", "bel-pl", "jpn-j1"]],
    ["India", "🇮🇳", 38, ["ind-isl", "por-pl", "tha-t1"]],
    ["Malaysia", "🇲🇾", 38, ["mys-sl", "tha-t1", "idn-l1", "jpn-j1"]],
    ["Philippines", "🇵🇭", 34, ["jpn-j1", "tha-t1", "usa-mls"]],
    ["Singapore", "🇸🇬", 32, ["sgp-pl", "tha-t1", "mys-sl", "jpn-j1"]],
  ]),

  /* ------------------------------ Middle East ---------------------------- */
  ...group("Middle East", [
    ["Iran", "🇮🇷", 72, ["irn-pg", "ksa-pl", "qat-sl", "tur-sl", "bel-pl"]],
    ["Saudi Arabia", "🇸🇦", 66, ["ksa-pl", "qat-sl", "uae-pl", "por-pl"]],
    ["Qatar", "🇶🇦", 62, ["qat-sl", "ksa-pl", "uae-pl", "bel-pl"]],
    ["Iraq", "🇮🇶", 60, ["ksa-pl", "qat-sl", "irn-pg", "tur-sl"]],
    ["Israel", "🇮🇱", 58, ["isr-pl", "ita-sa", "bel-pl", "ger-bl", "eng-ch"]],
    ["United Arab Emirates", "🇦🇪", 58, ["uae-pl", "ksa-pl", "qat-sl", "por-pl"]],
    ["Jordan", "🇯🇴", 56, ["ksa-pl", "qat-sl", "uae-pl", "tur-sl"]],
    ["Oman", "🇴🇲", 50, ["ksa-pl", "uae-pl", "qat-sl"]],
    ["Syria", "🇸🇾", 46, ["ksa-pl", "qat-sl", "irn-pg", "tur-sl"]],
    ["Bahrain", "🇧🇭", 44, ["ksa-pl", "qat-sl", "uae-pl"]],
    ["Lebanon", "🇱🇧", 42, ["ksa-pl", "qat-sl", "cyp-fd", "tur-sl"]],
    ["Kuwait", "🇰🇼", 40, ["ksa-pl", "qat-sl", "uae-pl"]],
  ]),

  /* ------------------------------- Oceania ------------------------------- */
  ...group("Oceania", [
    ["Australia", "🇦🇺", 72, ["aus-al", "eng-ch", "sco-pr", "ned-ed", "jpn-j1"]],
    ["New Zealand", "🇳🇿", 56, ["aus-al", "eng-ch", "usa-mls", "sco-pr"]],
    ["Fiji", "🇫🇯", 20, ["aus-al", "usa-mls"]],
    ["Solomon Islands", "🇸🇧", 20, ["aus-al", "usa-mls"]],
    ["Papua New Guinea", "🇵🇬", 18, ["aus-al", "idn-l1"]],
  ]),
];

/** name → emoji, for every call site that only needs the flag. */
export const NATION_FLAG: Record<string, string> = Object.fromEntries(
  NATIONS.map((n) => [n.name, n.flag]),
);

/** Strip accents and case so "Curacao" finds Curaçao and "cote" finds Côte. */
function fold(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function nationByName(name: string): Nation | undefined {
  const exact = NATIONS.find((n) => n.name === name);
  if (exact) return exact;
  const folded = fold(name.trim());
  return NATIONS.find((n) => fold(n.name) === folded);
}

export function nationsByRegion(region: NationRegion): Nation[] {
  return NATIONS.filter((n) => n.region === region);
}

/** Case/accent-insensitive substring match on the nation name. */
export function searchNations(query: string): Nation[] {
  const q = fold(query.trim());
  if (!q) return NATIONS;
  return NATIONS.filter((n) => fold(n.name).includes(q));
}
