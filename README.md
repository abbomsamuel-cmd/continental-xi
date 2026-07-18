# Continental XI — Champions Draft & Tournament Simulator

An original, **unofficial fan-made** football game inspired by the addictive
"pick-one-per-round" loop and the prestige of international football. Draft
legendary players — each rated for one **exact** campaign, not their career —
build the ultimate XI, then lead it through the **Champions League**, the
**UEFA EURO**, or the **Copa América** to continental glory.

**Play it:** https://continental-xi-snowy.vercel.app/

> Not affiliated with UEFA, CONMEBOL, FIFA or any club. No official logos,
> branding or protected assets are used — the visual identity, names and
> artwork are original. All rights reserved — see [LICENSE](LICENSE).

---

## Highlights

- **Season-specific ratings.** Messi '11 is a 96, Cristiano '17 a 95, Lewandowski
  '20 a 94 — ratings reflect that specific campaign, never inflated.
  **1,725 rated players** across **105 legendary club squads** (1960–2025),
  **30 EURO** and **18 Copa América** national vintages, and a registry of 139
  clubs.
- **Three competitions, three identities.** The 36-team Swiss league phase, the
  official 24-team EURO format (six groups, best thirds, a true Round of 16),
  and Copa América with its bronze final — each with its own art direction.
- **📡 Live Match Mode.** Semi-finals and finals can be watched minute by
  minute: commentary feed, live statistics, half-time, penalties, pause,
  ×2/×4 speed and skip-to-result.
- **Football Hub homepage.** Continue your campaign, today's daily challenge,
  recent activity, hall of champions and career statistics the moment you open
  the game.
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
- **Runs end where you finish.** Just like 38-0 / 48-0: only *your* matches are
  simulated. Finish 25th–36th in the league phase and the run stops there; lose
  a knockout tie and it ends immediately. No account, no login — progress saves
  on your device.
- **Meta systems.** 18 achievements, a lifetime stats dashboard with charts, a
  deterministic **daily challenge** (identical draft worldwide), and instant
  search across players, clubs, squads, managers, stadiums and eras.
- **Two skill modes.** *Classic* shows everything; *Expert* hides overall and
  attributes — only name, club, position and season — rewarding real knowledge.

## Tech stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript** (strict)
- **Tailwind CSS v4** · **Framer Motion** (animations, page transitions)
- **Zustand** + `persist` (all progress saved on-device via `localStorage` — no
  accounts, no server, no database)
- Canvas-based stadium background (particles / stars / light beams) and
  synthesized **Web Audio** sound manager — no external asset files, fully
  mutable.
- Ships as a fully **static site** (`next build` → `out/`), auto-deployed to
  **GitHub Pages**. PWA manifest, SEO metadata, `prefers-reduced-motion`
  support, mobile-first responsive layout.

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
.github/workflows/deploy.yml   # static export -> GitHub Pages
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

## Deploying (GitHub Pages)

The app is a fully static site with **no backend and no database** — nothing
about you is stored anywhere but your own browser. `next build` emits static
files to `out/`, and `.github/workflows/deploy.yml` publishes them to GitHub
Pages on every push to `main`.

(The repo name is wired via `basePath` in `next.config.ts`, gated on the
`GITHUB_PAGES` env var so local dev still runs at the root.)

Rehosting this game or its database elsewhere is not permitted — see
[LICENSE](LICENSE).

The data layer is competition-agnostic, so future competitions (Europa League,
the World Cup, domestic leagues) can be added purely by dropping new squads into
`src/lib/data/` — no schema, no migrations, no code changes.

## Design

Dark by default. Midnight blue `#061A40`, UEFA blue `#003B8E`, gold `#D4AF37`,
neon cyan `#22E0FF` and white. Glassmorphism, animated gradients, stadium
lighting, drifting particles, 3D card hovers, smooth page transitions and
micro-interactions throughout — built to feel like an AAA football product.
