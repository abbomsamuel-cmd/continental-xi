import type { MatchResult } from "./types";

/**
 * Broadcast layer for Live Match 2.0 — everything here is PRESENTATION ONLY,
 * derived deterministically from an already-simulated MatchResult. The engine
 * is never consulted or changed: the same result always produces the same
 * commentary script, ratings, extended statistics and post-match story.
 */

export interface BroadcastTeamRef {
  name: string;
  short: string;
  colors: [string, string];
  season?: number;
  isUser?: boolean;
}

export type FeedKind =
  | "kickoff" | "goal" | "yellow" | "red" | "var"
  | "chance" | "save" | "corner" | "sub" | "midfield"
  | "crossbar" | "atmo" | "ht" | "secondhalf" | "ft";

export interface FeedLine {
  minute: number;
  kind: FeedKind;
  team?: 0 | 1;
  text: string;
  sub?: string;
}

/* ------------------------------------------------------------------ */
/*  Deterministic randomness                                           */
/* ------------------------------------------------------------------ */

function frac(n: number): number {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
}

/** One stable seed per match — same result, same broadcast, every replay. */
export function matchSeed(r: MatchResult): number {
  return (
    r.homeGoals * 97 + r.awayGoals * 31 +
    r.stats.shots[0] * 7 + r.stats.shots[1] * 3 +
    r.stats.corners[0] * 13 + r.stats.fouls[1] * 5 +
    hashStr(r.motm)
  );
}

function pick<T>(arr: readonly T[], seed: number, salt: number): T {
  return arr[Math.floor(frac(seed + salt * 17.31) * arr.length)];
}

/* ------------------------------------------------------------------ */
/*  Commentary banks — templated, seeded, never the same twice         */
/*  {p} player · {t} team · {a} assist · {o} other team                */
/* ------------------------------------------------------------------ */

const KICKOFF = [
  "The referee's whistle pierces the night — we are under way!",
  "A wall of noise greets kick-off. Here we go!",
  "The ball rolls, the crowd rises — this one is live!",
  "Kick-off! You can feel the tension from the first touch.",
  "We're off — the atmosphere is absolutely electric.",
];

const GOAL_MAIN = [
  "GOAL! {p} finds the net for {t}!",
  "GOAL! What a strike from {p}!",
  "{p} SCORES! The {t} end erupts!",
  "IT'S IN! {p} makes no mistake!",
  "GOAL! {p} finishes it off emphatically!",
  "{p} with a moment of magic — GOAL for {t}!",
  "THE NET RIPPLES! {p} delivers for {t}!",
  "GOAL! Clinical from {p} — the keeper had no chance!",
  "{p} strikes! The stadium erupts around us!",
  "GOAL! {p} rises to the occasion for {t}!",
];

const GOAL_ASSIST = [
  "Teed up beautifully by {a}.",
  "{a} with the killer pass.",
  "The vision from {a} made it — an assist to savour.",
  "{a} picked the lock, {p} turned the key.",
  "A gorgeous ball in from {a}.",
  "{a} slides it through — inch-perfect.",
];

const GOAL_SOLO = [
  "A moment of individual brilliance — nobody else touched it.",
  "He carved that chance out of absolutely nothing.",
  "Pure instinct. Right place, right moment.",
  "He wanted it more than anyone on the pitch.",
];

const CHANCE = [
  "{t} carve them open — dragged just wide of the far post!",
  "Half a yard of space and {t} let fly… over the bar!",
  "{t} break at pace — the final ball is cut out at the last second!",
  "A curling effort from the edge of the box… inches past the angle!",
  "{t} flash one across the six-yard box — nobody home!",
  "The crowd can sense a goal — {t} are turning the screw.",
  "A first-time volley from {t} screams just over!",
  "{t} win a free-kick in a very dangerous position.",
  "So close! The flag stays down but the shot drifts wide.",
  "{t} slice through midfield — the last touch lets them down.",
  "A snapshot from {t} — deflected behind at the near post!",
  "One-on-one! But the angle narrows and the chance is gone!",
];

const SAVE = [
  "HUGE SAVE! The keeper somehow gets a hand to it!",
  "What a stop — full stretch, turned around the post!",
  "Point-blank save! How has that stayed out?!",
  "The goalkeeper stands tall and wins the duel!",
  "Brilliant reflexes! He had no right to reach that!",
  "Strong wrists! Beaten to his left but he recovers!",
  "A fingertip away from a goal — magnificent goalkeeping!",
  "He's kept his side alive with that one — sensational!",
];

const CROSSBAR = [
  "OFF THE CROSSBAR! The woodwork rattles and the crowd gasps!",
  "THE POST! Millimetres from a goal — the frame denies them!",
  "CRASHING off the bar! The whole stadium heard that one!",
];

const CORNER = [
  "Corner — swung in dangerously… headed clear at the near post.",
  "The corner causes chaos, but it's scrambled away.",
  "Delivered deep to the back stick — nodded over.",
  "Short corner routine — worked smartly, then recycled.",
  "In-swinger — the keeper punches under pressure.",
];

const MIDFIELD = [
  "A patient spell of possession — probing, waiting for the gap.",
  "Crunching challenge in the middle of the park — fair, just.",
  "The press wins it back high — dangerous territory.",
  "An incredible last-ditch clearance keeps it level!",
  "Both benches are up, screaming instructions.",
  "The tempo drops for a beat — a chess match in midfield.",
  "A raking sixty-yard switch — the full-back deals with it.",
  "He dances through two challenges before the third stops him.",
  "Tenacious work in the tackle — the crowd applauds the effort.",
];

const ATMO = [
  "Flags waving, drums pounding — what an occasion this is.",
  "A sea of colour behind the goal. Football at its finest.",
  "The noise levels rise — the fans demand more.",
  "You can barely hear yourself think in here.",
  "Camera flashes ripple around the top tier.",
];

const YELLOW = [
  "Yellow card — {p} goes into the book.",
  "The referee reaches for his pocket — {p} is cautioned.",
  "A cynical foul, and {p} pays for it. Yellow.",
  "{p} is booked — he can have no complaints.",
  "Late challenge from {p} — a deserved yellow.",
];

const RED = [
  "RED CARD! {p} is OFF! {t} are down to ten men!",
  "STRAIGHT RED! {p} sees red and the tie turns on its head!",
  "He's off! {p} walks — a disaster for {t}!",
];

const SUB = [
  "Change for {t} — fresh legs to alter the pattern.",
  "{t} roll the dice from the bench.",
  "A tactical switch for {t} — the shape shifts.",
  "The manager has seen enough — {t} make a change.",
];

const HT = [
  "The half-time whistle blows. Breathe.",
  "That's the half — the managers have plenty to say.",
  "Half-time. The tunnel swallows twenty-two stories.",
];

const SECOND_HALF = [
  "Second half under way — no hiding place now.",
  "Back out, back at it — the second act begins.",
  "The restart — and the intensity hasn't dropped an inch.",
];

const FT = [
  "The final whistle! It's all over!",
  "Full time — the story is written.",
  "There goes the whistle — finished!",
];

/* ------------------------------------------------------------------ */
/*  The full minute-by-minute script                                   */
/* ------------------------------------------------------------------ */

export function buildFeed(r: MatchResult, home: BroadcastTeamRef, away: BroadcastTeamRef): FeedLine[] {
  const seed = matchSeed(r);
  const teamName = (t: 0 | 1) => (t === 0 ? home.name : away.name);
  const fill = (tpl: string, vars: Record<string, string>) =>
    tpl.replace(/\{(\w)\}/g, (_, k) => vars[k] ?? "");

  const lines: FeedLine[] = [
    { minute: 1, kind: "kickoff", text: pick(KICKOFF, seed, 1) },
  ];
  const used = new Set<number>(r.events.map((e) => e.minute));

  // real engine events, each with its own varied line
  let gi = 0;
  for (const e of r.events) {
    const vars = { p: e.player, t: teamName(e.team), a: e.assist ?? "" };
    if (e.type === "goal") {
      lines.push({
        minute: e.minute, kind: "goal", team: e.team,
        text: fill(pick(GOAL_MAIN, seed, 100 + gi), vars),
        sub: e.assist ? fill(pick(GOAL_ASSIST, seed, 130 + gi), vars) : pick(GOAL_SOLO, seed, 160 + gi),
      });
      gi++;
    } else if (e.type === "yellow") {
      lines.push({ minute: e.minute, kind: "yellow", team: e.team, text: fill(pick(YELLOW, seed, 200 + e.minute), vars), sub: teamName(e.team) });
    } else if (e.type === "red") {
      lines.push({ minute: e.minute, kind: "red", team: e.team, text: fill(pick(RED, seed, 230 + e.minute), vars) });
    } else if (e.type === "var") {
      lines.push({ minute: e.minute, kind: "var", team: e.team, text: "VAR REVIEW — the referee holds play…", sub: e.note });
    }
  }

  // filler beats drawn deterministically from the statistics
  const freeMinute = (n: number, lo = 4, hi = 89) => {
    let m = lo + Math.floor(frac(seed + n * 13.7) * (hi - lo));
    let guard = 0;
    while ((used.has(m) || m === 45 || m === 46) && guard++ < 50) {
      m = lo + Math.floor(frac(seed + n * 13.7 + guard * 3.1) * (hi - lo));
    }
    used.add(m);
    return m;
  };

  let n = 0;
  const homeShare = r.stats.shots[0] / (r.stats.shots[0] + r.stats.shots[1] || 1);
  const sideFor = (i: number): 0 | 1 => (frac(seed + i * 7.3) < homeShare ? 0 : 1);

  const chances = Math.min(6, Math.max(2, Math.round((r.stats.shots[0] + r.stats.shots[1]) / 6)));
  for (let i = 0; i < chances; i++) {
    const team = sideFor(i);
    lines.push({ minute: freeMinute(n++), kind: "chance", team, text: fill(pick(CHANCE, seed, 300 + i * 7), { t: teamName(team) }) });
  }

  const saves = Math.max(0, Math.min(4, r.stats.onTarget[0] + r.stats.onTarget[1] - r.homeGoals - r.awayGoals - 2));
  for (let i = 0; i < saves; i++) {
    lines.push({ minute: freeMinute(n++), kind: "save", text: pick(SAVE, seed, 340 + i * 11) });
  }

  // the woodwork, on nights with plenty of shooting
  if (r.stats.shots[0] + r.stats.shots[1] >= 18 && frac(seed + 77) > 0.4) {
    const team = sideFor(9);
    lines.push({ minute: freeMinute(n++), kind: "crossbar", team, text: pick(CROSSBAR, seed, 380) });
  }

  const corners = Math.min(3, Math.max(1, Math.round((r.stats.corners[0] + r.stats.corners[1]) / 5)));
  for (let i = 0; i < corners; i++) {
    const team = sideFor(20 + i);
    lines.push({ minute: freeMinute(n++), kind: "corner", team, text: pick(CORNER, seed, 400 + i * 13) });
  }

  // substitutions arrive naturally in the second-half window
  for (let i = 0; i < 2; i++) {
    const team = (i % 2) as 0 | 1;
    lines.push({ minute: freeMinute(n++, 58, 82), kind: "sub", team, text: fill(pick(SUB, seed, 440 + i * 9), { t: teamName(team) }) });
  }

  for (let i = 0; i < 2; i++) {
    lines.push({ minute: freeMinute(n++), kind: "midfield", text: pick(MIDFIELD, seed, 480 + i * 7) });
  }
  lines.push({ minute: freeMinute(n++), kind: "atmo", text: pick(ATMO, seed, 520) });

  // structural beats
  const htScore = (t: 0 | 1) => r.events.filter((e) => e.type === "goal" && e.team === t && e.minute <= 45).length;
  lines.push({ minute: 45, kind: "ht", text: pick(HT, seed, 540), sub: `${home.short} ${htScore(0)}–${htScore(1)} ${away.short}` });
  lines.push({ minute: 46, kind: "secondhalf", text: pick(SECOND_HALF, seed, 560) });

  const endMinute = Math.max(90, ...r.events.map((e) => e.minute));
  lines.push({ minute: endMinute, kind: "ft", text: pick(FT, seed, 580), sub: `${home.short} ${r.homeGoals}–${r.awayGoals} ${away.short}` });

  lines.sort((a, b) => a.minute - b.minute || (a.kind === "kickoff" || a.kind === "ht" || a.kind === "secondhalf" ? -1 : 1));
  return lines;
}

/* ------------------------------------------------------------------ */
/*  Live player ratings — start 6.5, move with the match               */
/* ------------------------------------------------------------------ */

export interface RatingInput {
  name: string;
  team: 0 | 1;
  position?: string;
  minute: number;
  finished: boolean;
}

export function liveRating(r: MatchResult, input: RatingInput): number {
  const { name, team, position, minute, finished } = input;
  const seed = matchSeed(r) + hashStr(name);
  let rating = 6.5;

  // slow personal drift that grows as the match develops (deterministic)
  const t = Math.min(1, minute / 90);
  rating += (frac(seed) - 0.45) * 0.9 * t;

  // team momentum share nudges everyone on that side
  const samples = Math.max(1, Math.min(r.momentum.length, Math.ceil((minute / 95) * r.momentum.length)));
  const avgMomentum = r.momentum.slice(0, samples).reduce((s, m) => s + m, 0) / samples;
  rating += (team === 0 ? avgMomentum : -avgMomentum) * 0.45 * t;

  // concrete contributions up to this minute
  let goals = 0;
  for (const e of r.events) {
    if (e.minute > minute) continue;
    if (e.type === "goal" && e.team === team && e.player === name) { goals++; rating += goals === 1 ? 1.0 : 0.8; }
    if (e.type === "goal" && e.team === team && e.assist === name) rating += 0.55;
    if (e.type === "yellow" && e.player === name) rating -= 0.35;
    if (e.type === "red" && e.player === name) rating -= 1.6;
    // keepers and defenders suffer for goals conceded
    if (e.type === "goal" && e.team !== team && (position === "GK" || position === "CB")) rating -= position === "GK" ? 0.3 : 0.18;
  }

  // keepers earn credit for the shots they kept out
  if (position === "GK") {
    const opp = team === 0 ? 1 : 0;
    const saves = Math.max(0, r.stats.onTarget[opp] - (opp === 0 ? r.homeGoals : r.awayGoals));
    rating += Math.min(1.1, saves * 0.22) * t;
  }

  if (finished && r.motm === name) rating += 0.45;
  return Math.max(4.1, Math.min(10, Math.round(rating * 10) / 10));
}

/* ------------------------------------------------------------------ */
/*  Extended statistics — display-only, derived from the real ones     */
/* ------------------------------------------------------------------ */

export interface StatRow {
  label: string;
  h: number;
  a: number;
  decimals?: number;
  suffix?: string;
}

export function extendedStats(r: MatchResult): StatRow[] {
  const seed = matchSeed(r);
  const s = r.stats;
  const d = (base: number, salt: number, spread: number) => Math.max(0, Math.round(base + (frac(seed + salt) - 0.5) * spread));

  const passes: [number, number] = [d(s.possession[0] * 9.2, 11, 60), d(s.possession[1] * 9.2, 12, 60)];
  const bigChances: [number, number] = [
    Math.max(r.homeGoals, Math.round(s.xg[0] * 0.9 + frac(seed + 21) * 1.4)),
    Math.max(r.awayGoals, Math.round(s.xg[1] * 0.9 + frac(seed + 22) * 1.4)),
  ];
  return [
    { label: "Possession", h: s.possession[0], a: s.possession[1], suffix: "%" },
    { label: "Expected Goals", h: s.xg[0], a: s.xg[1], decimals: 2 },
    { label: "Shots", h: s.shots[0], a: s.shots[1] },
    { label: "On Target", h: s.onTarget[0], a: s.onTarget[1] },
    { label: "Big Chances", h: bigChances[0], a: bigChances[1] },
    { label: "Saves", h: Math.max(0, s.onTarget[1] - r.awayGoals), a: Math.max(0, s.onTarget[0] - r.homeGoals) },
    { label: "Corners", h: s.corners[0], a: s.corners[1] },
    { label: "Crosses", h: d(s.corners[0] * 2.4 + s.shots[0] * 0.5, 31, 6), a: d(s.corners[1] * 2.4 + s.shots[1] * 0.5, 32, 6) },
    { label: "Touches", h: d(passes[0] * 1.32, 41, 40), a: d(passes[1] * 1.32, 42, 40) },
    { label: "Passes", h: passes[0], a: passes[1] },
    { label: "Pass Accuracy", h: s.passAcc[0], a: s.passAcc[1], suffix: "%" },
    { label: "Long Balls", h: d(14 + (100 - s.possession[0]) * 0.3, 51, 8), a: d(14 + (100 - s.possession[1]) * 0.3, 52, 8) },
    { label: "Tackles", h: d(s.fouls[0] * 1.15 + 6, 61, 6), a: d(s.fouls[1] * 1.15 + 6, 62, 6) },
    { label: "Interceptions", h: d(9 + (100 - s.possession[0]) * 0.12, 71, 6), a: d(9 + (100 - s.possession[1]) * 0.12, 72, 6) },
    { label: "Recoveries", h: d(34 + (100 - s.possession[0]) * 0.28, 81, 10), a: d(34 + (100 - s.possession[1]) * 0.28, 82, 10) },
    { label: "Fouls", h: s.fouls[0], a: s.fouls[1] },
    { label: "Offsides", h: s.offsides[0], a: s.offsides[1] },
    { label: "Yellow Cards", h: s.yellows[0], a: s.yellows[1] },
    { label: "Red Cards", h: s.reds[0], a: s.reds[1] },
  ];
}

/* ------------------------------------------------------------------ */
/*  Post-match story — a unique three-to-five sentence recap           */
/* ------------------------------------------------------------------ */

const DOMINANCE = [
  "{w} controlled long stretches through sheer weight of possession",
  "{w} dictated the rhythm from the opening minutes",
  "{w} were the more incisive side whenever the game opened up",
  "{w} had to dig in and pick their moments",
];
const KEEPER_NOTE = [
  "Only a string of outstanding saves kept the scoreline respectable.",
  "The goalkeeping on show deserved its own headline.",
  "Both keepers produced moments that defied the xG.",
];
const CLOSE_WIN = [
  "In the end the margins were razor-thin, and {w} seized them.",
  "It was decided by fine details — and {w} handled them better.",
  "One moment of quality separated the sides at the last.",
];
const COMFORT_WIN = [
  "Once ahead, {w} managed the tie with real authority.",
  "{w} never looked back after breaking through.",
  "From there {w} closed the door and turned the screw.",
];
const DRAW_LINE = [
  "Neither side blinked, and the spoils were shared.",
  "A game of chess ended all square — deservedly so.",
  "For all the effort, a draw felt like the honest result.",
];

export function matchStory(
  r: MatchResult,
  home: BroadcastTeamRef,
  away: BroadcastTeamRef,
  roundLabel?: string,
): string {
  const seed = matchSeed(r);
  const s = r.stats;
  const drawn = r.homeGoals === r.awayGoals;
  const winnerIdx: 0 | 1 = r.homeGoals >= r.awayGoals ? 0 : 1;
  const winner = winnerIdx === 0 ? home.name : away.name;
  const loser = winnerIdx === 0 ? away.name : home.name;
  const fill = (tpl: string) => tpl.replace("{w}", winner).replace("{l}", loser);

  const parts: string[] = [];

  // 1 — how the game flowed
  const possWinner = s.possession[winnerIdx];
  const opener = possWinner >= 55 ? DOMINANCE[0] : possWinner <= 45 ? DOMINANCE[3] : pick(DOMINANCE.slice(1, 3), seed, 3);
  parts.push(fill(opener) + (roundLabel ? ` in this ${roundLabel.toLowerCase()}` : "") + ".");

  // 2 — the statistical wrinkle
  const totalSaves = Math.max(0, s.onTarget[0] - r.homeGoals) + Math.max(0, s.onTarget[1] - r.awayGoals);
  const shotsDiff = Math.abs(s.shots[0] - s.shots[1]);
  if (totalSaves >= 6) parts.push(pick(KEEPER_NOTE, seed, 7));
  else if (shotsDiff >= 6) {
    const shotHeavy = s.shots[0] > s.shots[1] ? home.name : away.name;
    parts.push(`${shotHeavy} out-shot their opponents ${Math.max(...s.shots)} to ${Math.min(...s.shots)}, yet the game refused to follow the pattern.`);
  }
  if (s.reds[0] + s.reds[1] > 0) {
    const redTeam = s.reds[0] > 0 ? home.name : away.name;
    parts.push(`The red card shown to ${redTeam} changed the complexion of everything that followed.`);
  }

  // 3 — the decisive moment
  const goals = r.events.filter((e) => e.type === "goal");
  if (goals.length > 0 && !drawn) {
    const winnersGoals = goals.filter((g) => g.team === winnerIdx);
    const decisive = winnersGoals[winnersGoals.length - 1];
    if (decisive) {
      const counts = new Map<string, number>();
      winnersGoals.forEach((g) => counts.set(g.player, (counts.get(g.player) ?? 0) + 1));
      const braceMan = [...counts.entries()].find(([, c]) => c >= 2);
      if (braceMan) parts.push(`${braceMan[0]} was the difference with ${braceMan[1] >= 3 ? "a stunning hat-trick" : "two decisive goals"}.`);
      else parts.push(`${decisive.player}'s strike in the ${decisive.minute}${ordinalSuffix(decisive.minute)} minute proved decisive${decisive.assist ? `, crafted by ${decisive.assist}` : ""}.`);
    }
  } else if (goals.length === 0) {
    parts.push("For all the pressure, the final touch never arrived.");
  }

  // 4 — the verdict
  if (r.penalties) parts.push(`Level after extra time, it took penalties — ${r.penalties[0]}–${r.penalties[1]} — to separate them, ${winner} holding their nerve when it mattered most.`);
  else if (drawn) parts.push(pick(DRAW_LINE, seed, 13));
  else if (Math.abs(r.homeGoals - r.awayGoals) === 1) parts.push(fill(pick(CLOSE_WIN, seed, 17)));
  else parts.push(fill(pick(COMFORT_WIN, seed, 19)));

  return parts.join(" ");
}

function ordinalSuffix(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  return ["th", "st", "nd", "rd"][Math.min(n % 10, 4)] ?? "th";
}

/* ------------------------------------------------------------------ */
/*  Match facts — invented, but stable per result                      */
/* ------------------------------------------------------------------ */

const REFEREES = [
  "M. Keller", "A. Rossi", "D. Fontaine", "J. Navarro", "P. Kovács",
  "L. Björkman", "R. Cardoso", "T. Van Dijk", "S. Petrov", "C. Moreau",
  "E. Sanabria", "H. Weiss", "I. Kowalski", "N. Papadopoulos", "O. Jensen",
];

export function refereeName(r: MatchResult): string {
  return pick(REFEREES, matchSeed(r), 91);
}

export function attendance(r: MatchResult): number {
  const seed = matchSeed(r);
  return 48000 + Math.floor(frac(seed + 97) * 34000);
}
