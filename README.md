# Continental XI — Champions Draft & Tournament Simulator

An original, **unofficial fan-made** football draft game inspired by the addictive
"pick-one-per-round" loop and the prestige of European club football. Draft
legendary players — each rated for one **exact** Champions campaign, not their
career — build the ultimate XI, then lead it through the modern **36-team Swiss
league phase** and knockouts to continental glory.

> Not affiliated with UEFA or any club. No official logos, branding or protected
> assets are used — the visual identity, names and artwork are original.

---

## Highlights

- **Season-specific ratings.** Messi '11 is a 96, Cristiano '17 a 95, Lewandowski
  '20 a 94 — ratings reflect that specific European campaign, never inflated.
  944 rated players across 77 legendary squads (1993–2025) and a registry of 111
  clubs.
- **Deep chemistry.** Links form for same club, nation, league, manager and era,
  plus special bonuses for **36 historic partnerships** (MSN, the BBC, Xavi–
  Iniesta–Busquets, Modrić–Kroos–Casemiro, Maldini–Nesta–Baresi, Robbery…).
- **Smart draft randomization.** Weighted so recently-shown clubs and leagues
  fade, no club appears in consecutive rounds, and every offered squad can
  actually fill the slot. No duplicate players or seasons.
- **Modern league phase (2024+ format).** One 36-club table, 8 matchdays, 4 home
  / 4 away vs 8 different pot-balanced opponents. Top 8 → Round of 16, 9–24 →
  play-offs, 25–36 eliminated. Live animated position changes and qualification
  bands.
- **Advanced match engine.** Not a ratings comparison — form, chemistry, home
  advantage, attack/defense split, big-match factor and genuine football
  variance drive Poisson-based scorelines with full stats (xG, possession,
  shots, cards, momentum, MOTM, VAR). Weaker sides win sometimes.
- **Full knockouts + trophy.** Two-legged play-offs and ties, single-match
  neutral final, penalty shootouts, confetti celebration and tournament awards
  (Golden Ball / Boot / Glove).
- **Meta systems.** 18 achievements, a lifetime stats dashboard with charts, a
  deterministic **daily challenge** (identical draft worldwide), and instant
  search across players, clubs, squads, managers, stadiums and eras.
- **Two skill modes.** *Classic* shows everything; *Expert* hides overall and
  attributes — only name, club, position and season — rewarding real knowledge.

## Tech stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript** (strict)
- **Tailwind CSS v4** · **Framer Motion** (animations, page transitions)
- **Zustand** + `persist` (state + localStorage save)
- Canvas-based stadium background (particles / stars / light beams) and
  synthesized **Web Audio** sound manager — no external asset files, fully
  mutable.
- PWA manifest, SEO metadata, `prefers-reduced-motion` support, mobile-first
  responsive layout.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # eslint (clean)
```

No environment variables or backend are required — guest mode saves everything
to the device.

## Project structure

```
src/
  app/                 # routes: / draft squad tournament database daily stats
  components/          # PlayerCard, Pitch, LeagueTable, MatchModal,
                       # KnockoutBracket, TrophyCelebration, RadarChart, ...
  lib/
    data/              # squads-classic, squads-modern, clubs, partnerships
    engine/            # match.ts (sim), tournament.ts (Swiss + knockouts), names
    players.ts         # raw squads -> full Player objects (derived attributes)
    draft.ts chemistry.ts analysis.ts   # core game logic
    store.ts           # Zustand store (draft + tournament + profile)
    achievements.ts sound.ts rng.ts formations.ts
prisma/schema.prisma   # scale-up database blueprint (see below)
```

## Adding data (no code changes)

The database is data-driven. To add a squad, append a `RawSquad` to
`src/lib/data/squads-modern.ts` (or `-classic`):

```ts
{
  club: "Ajax", country: "Netherlands", league: "Eredivisie", season: 1995,
  coach: "Louis van Gaal", stadium: "De Meer", colors: ["#D2122E", "#FFFFFF"],
  honor: "Champions 1994-95",
  players: [
    // [name, nationality, position, overall, altPositions?, {g,a,cs}?]
    ["Jari Litmanen", "Finland", "CAM", 89, ["CF"], { g: 6, a: 3 }],
    // ...
  ],
}
```

Full six-attribute EA-style profiles, traits, skill/weak-foot, work rates and
IDs are **derived deterministically** from the four core fields — so a squad is
a dozen short lines, and the same player always expands identically. New clubs
for the AI opponent pool go in `src/lib/data/clubs.ts`; new partnerships in
`partnerships.ts`.

## Scaling up (hosted build)

The shipped app is intentionally backend-free. `prisma/schema.prisma` is the
drop-in path to a hosted, multiplayer, leaderboard-backed version:

1. Point `DATABASE_URL` at Postgres (Supabase) and `prisma migrate dev`.
2. Convert `src/lib/data/*` into seed scripts (the shapes already map 1:1 to the
   `SeasonSquad` / `PlayerRating` tables).
3. Swap the Zustand persistence layer for server actions / TanStack Query against
   the same store interface.

The schema is **competition-agnostic** — everything hangs off `Competition` and
`Season`, so Europa League, the World Cup or domestic leagues plug in without
schema changes. It also models users, draft runs, tournament results,
achievements, global/daily/weekly leaderboards and multiplayer lobbies. Social
login (Google / Discord / Email) and an admin panel (bulk CSV/JSON import,
rating edits, moderation, role-based access) are the natural next milestones on
top of it.

## Design

Dark by default. Midnight blue `#061A40`, UEFA blue `#003B8E`, gold `#D4AF37`,
neon cyan `#22E0FF` and white. Glassmorphism, animated gradients, stadium
lighting, drifting particles, 3D card hovers, smooth page transitions and
micro-interactions throughout — built to feel like an AAA football product.
