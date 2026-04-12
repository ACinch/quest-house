# Quest House — Neurospicy Household Reset

A Minecraft-themed chore + reward web app for a neurodivergent family of three.
Built with **Next.js 16**, **TypeScript**, **Tailwind CSS**, and **Zustand**.
Designed to deploy to **Vercel**.

## What it is

A digital companion to a physical chore/reward system. Players (Mom, Maarten,
Winter) earn XP from a sequential **skill tree**, get random **treasure chest
drops**, and convert XP into either weekly **Greenlight cash** (Winter) or
**reward milestones** on an alternating House → Personal cycle (adults).

It is designed around the realities of an ADHD household:

- Short sprint bursts, never marathons
- Stupidly specific tasks (no ambiguity)
- Multiple dopamine layers (XP, money, chests, visual progress)
- **No streaks, no penalties** — missing a day never breaks anything
- **Reskinnable** — Minecraft is the starting theme; the schema separates
  mechanics from flavor so it can be swapped later

See the project specification in this repo's first commit / planning notes for
the full design rationale.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
npm run build
npm run start
```

## Deploying to Vercel

This is a stock Next.js app — push to GitHub and import the repo at
[vercel.com/new](https://vercel.com/new). No environment variables, no
database, no backend. Everything lives in the browser.

## How data works

- All state lives in **`localStorage`** under the key `quest-house-state-v1`,
  managed by Zustand's `persist` middleware.
- The default state is seeded from `src/lib/defaults.ts` on first load (or
  after a reset).
- **Settings → Data** has Export/Import buttons to back up the JSON file or
  restore it on another device. There's also a "Reset to Defaults" button.

There is no server, no auth. If you want to share state across devices, export
the JSON and import it on the other device.

## Project layout

```
src/
├─ app/                       Next.js App Router pages
│  ├─ page.tsx                Dashboard (/)
│  ├─ skills/                 Skill tree (/skills)
│  ├─ log/                    Task & chest logs (/log)
│  ├─ weekly/                 Weekly summary (/weekly)
│  ├─ wishlist/               Adult reward wishlist (/wishlist)
│  ├─ rotation/               Toy rotation tracker (/rotation)
│  ├─ quests/                 Custom quest editor (/quests)
│  ├─ chest-pool/             Chest reward slip editor (/chest-pool)
│  ├─ settings/               Config + import/export (/settings)
│  ├─ layout.tsx              Root layout + fonts
│  └─ globals.css             Minecraft-themed CSS
├─ components/
│  ├─ AppShell.tsx            Header + tab bar + chest modal
│  ├─ UserSwitcher.tsx        Mom / Maarten / Winter toggle
│  ├─ XPBar.tsx               Animated XP bar
│  ├─ RankBadge.tsx           Rank pill
│  ├─ ChestDropModal.tsx      "A treasure chest appeared!" modal
│  └─ views/                  Page-level components
└─ lib/
   ├─ types.ts                All TS types (AppState, UserState, etc.)
   ├─ skills.ts               Skill tree branches & helper functions
   ├─ defaults.ts             Default seed state
   └─ store.ts                Zustand store + game logic
```

## Game mechanics

- **5 branches** for Winter, **5+2 shared** for adults (Home Admin and
  Exterior & Seasonal are shared between Mom and Maarten — completing a
  one-off quest closes it for both).
- Skills within a sequential branch unlock when the previous one is
  **mastered** (10 successful completions, configurable).
- Each completed task has a **15% chance** of dropping a treasure chest.
  Boss-level tasks drop guaranteed chests. Mastery, rank ups, and hitting
  the weekly XP cap also trigger chests.
- Winter: weekly XP cap = 100 → $10/week to Greenlight.
- Adults: 500 XP = 1 milestone reward, alternating House → Personal.
- All thresholds, drop rates, and caps live in **Settings**.

## Customization

- **Custom Quests** (Settings → Custom Quests) — add new "adulting" tasks to
  the Home Admin or Exterior branches at any time. They appear in both
  adults' skill trees automatically.
- **Chest Pool** (Settings → Chest Pool) — edit the slips that get drawn
  when a chest drops, per user.
- **Weekend Reset Level** (Settings) — Level 1 (20–30 min) → Level 2
  (40–50 min) → Level 3 (60–90 min). Start small, level up when ready.
- **Theme** — currently only Minecraft. The skill tree structure is
  theme-agnostic; future themes can override colors, fonts, and flavor text.

## Branch

Active development branch: `claude/neurospicy-household-reset-rEHDr`
