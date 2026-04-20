# Quest House — Neurospicy Household Reset

<!-- Deploy touch: trigger Vercel rebuild after initial merge to main -->

A Minecraft-themed chore + reward web app for a neurodivergent family of three.
Built with **Next.js 16**, **TypeScript**, **Tailwind CSS**, **Zustand**, and
**Vercel Blob** for cross-device sync. Per-user login with credentials from
environment variables. Designed to deploy to **Vercel**.

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

1. Push this repo to GitHub and import it at
   [vercel.com/new](https://vercel.com/new).
2. In the Vercel dashboard for your project, go to **Storage → Create
   Database → Blob**. This provisions a Vercel Blob store and automatically
   adds the `BLOB_READ_WRITE_TOKEN` environment variable to your project.
3. Under **Settings → Environment Variables**, add:

   | Variable             | Required | Notes |
   |----------------------|----------|-------|
   | `AUTH_SECRET`        | yes      | Any random string ≥ 16 chars. Used to sign session cookies. Generate one with `openssl rand -hex 32`. |
   | `WINTER_PASSWORD`    | yes      | Winter's login password. |
   | `REBEKAH_PASSWORD`   | yes      | Rebekah's login password. |
   | `MAARTEN_PASSWORD`   | yes      | Maarten's login password. |
   | `WINTER_USERNAME`    | optional | Defaults to `winter`. |
   | `REBEKAH_USERNAME`   | optional | Defaults to `rebekah`. |
   | `MAARTEN_USERNAME`   | optional | Defaults to `maarten`. |

4. Redeploy. The first time anyone visits the app, they'll see a login
   screen — enter the username + password for that family member. Sessions
   are signed httpOnly cookies that last 30 days.

## How auth works

There are exactly **three accounts** — Winter, Rebekah, and Maarten — with
credentials defined in environment variables. There's no signup, no user
table, no password reset flow. To rotate a password, change the env var in
Vercel and redeploy.

- `POST /api/auth/sign-in` — takes `{ username, password }`, validates
  against the env-var pairs (timing-safe comparison), and on success sets a
  HMAC-signed httpOnly session cookie that lasts 30 days.
- `POST /api/auth/sign-out` — clears the session cookie.
- `GET /api/auth/me` — returns the current user (or `null`) and tells the
  client whether the server is configured at all.

The client API in `src/lib/auth-client.ts` deliberately mirrors
[better-auth](https://www.better-auth.com/)'s React shape:

```ts
import { signIn, signOut, useSession } from "@/lib/auth-client";

const { data: user, isPending } = useSession();
await signIn({ username: "rebekah", password: "..." });
await signOut();
```

This is so we can swap in real better-auth later (once we add a Postgres
database) with minimal call-site changes — the cookie-based sessions, the
sign-in/sign-out flow, and the `useSession()` hook all match its API.

### Why not real better-auth?

Better-auth requires a persistent database (it has `user`, `session`,
`account`, and `verification` tables). With only Vercel Blob in play, there
isn't a good place to put that. Adding Vercel Postgres / Neon would work
and is a clean upgrade path — see "Migrating to better-auth" below.

## How data works

The app has **two layers of persistence**:

1. **Vercel Blob (server)** — the source of truth. A single JSON file
   (`household-state.json`) is read from and written to via two Next.js
   route handlers:
   - `GET /api/state` — returns the current state
   - `PUT /api/state` — overwrites the state
   Both require a valid session cookie (any of the three users).
2. **`localStorage` (browser)** — a working cache, managed by Zustand's
   `persist` middleware. Lets the app render instantly and stay usable
   while offline.

### Sync flow

- On first load, the app calls `GET /api/auth/me`. If there's no session,
  the LoginGate shows a username/password form.
- Once signed in, the sync engine `GET`s the current state from Blob. If
  the server has data, it replaces the local cache. If the server is empty
  (first run), it pushes the local seed up to initialize the household.
- Every change to local state is **debounced 1.5 s** then pushed to Blob.
- The header has a sync indicator (✓ synced, ↻ syncing, ⚠ error, etc.).
  Tap it to manually re-sync.
- **Settings → Sync** has manual Pull / Push buttons. **Settings → Account**
  shows the signed-in user and has a Sign Out button.

### Race conditions

This is a household app — last write wins. If Mom and Winter both edit
state on different devices within ~1.5 s of each other, only the second
write makes it to the server. In practice, this is fine: tasks are
small, mistakes are rare, and the worst case is having to log a chore
twice. If you want stricter merging, you'd need a CRDT or per-user
slices, both of which are overkill for three people in one house.

### Backup / migration

**Settings → Data** still has Export/Import JSON buttons in case you want a
manual backup or want to seed a fresh deployment from an existing one.

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
```

For local dev you need to create a `.env.local` so the LoginGate has
something to validate against:

```
AUTH_SECRET=local-development-secret-at-least-16-chars
WINTER_PASSWORD=winter
REBEKAH_PASSWORD=rebekah
MAARTEN_PASSWORD=maarten
```

If you also want to test cross-device sync against real Vercel Blob, add:

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

The easiest way to get a real Blob token locally is:

```bash
npm install -g vercel
vercel link
vercel env pull .env.local
```

Without `BLOB_READ_WRITE_TOKEN` set, the API returns `503` from `/api/state`
and the sync indicator shows `no blob`. The app still works locally — it
just can't push to or pull from the cloud.

## Migrating to real better-auth

When you're ready for proper user management (signups, password resets,
email verification, multi-factor, OAuth providers, etc.), the migration is:

1. Provision **Vercel Postgres** (Neon) — free tier — from the Storage tab.
2. `npm install better-auth pg`
3. Replace `src/lib/auth.ts` with a `betterAuth({ database, ... })` setup.
4. Replace `src/lib/auth-client.ts` with `createAuthClient(...)` from
   `better-auth/react`. The component-level API (`signIn`, `signOut`,
   `useSession`) is identical.
5. Replace the route handlers under `src/app/api/auth/` with the better-auth
   catch-all handler at `src/app/api/auth/[...all]/route.ts`.
6. The `/api/state` route already takes the user from a server-side
   session helper; just swap it for `auth.api.getSession({ headers })`.

The household state schema, the sync engine, and every UI component stay
unchanged.

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
│  ├─ settings/               Config + import/export + sync (/settings)
│  ├─ api/state/route.ts      GET/PUT household state (Vercel Blob)
│  ├─ api/auth/sign-in/       POST username + password
│  ├─ api/auth/sign-out/      POST → clears session cookie
│  ├─ api/auth/me/            GET current user from session cookie
│  ├─ layout.tsx              Root layout + fonts
│  └─ globals.css             Minecraft-themed CSS
├─ components/
│  ├─ AppShell.tsx            Header + tab bar + chest modal + login gate
│  ├─ LoginGate.tsx           Per-user sign-in screen
│  ├─ SyncIndicator.tsx       Header sync status pill
│  ├─ UserSwitcher.tsx        Winter / Rebekah / Maarten dashboard toggle
│  ├─ XPBar.tsx               Animated XP bar
│  ├─ RankBadge.tsx           Rank pill
│  ├─ ChestDropModal.tsx      "A treasure chest appeared!" modal
│  └─ views/                  Page-level components
└─ lib/
   ├─ types.ts                All TS types (AppState, UserState, etc.)
   ├─ skills.ts               Skill tree branches & helper functions
   ├─ defaults.ts             Default seed state
   ├─ store.ts                Zustand store + game logic (local cache)
   ├─ sync.ts                 Server sync engine (Blob hydrate + push)
   ├─ blob-store.ts           Server-side Vercel Blob read/write
   ├─ auth.ts                 Server-side HMAC session cookies
   └─ auth-client.ts          Client-side signIn/signOut/useSession
```

## A note on the in-app user switcher

The header has a Winter / Rebekah / Maarten toggle. This is a **view
switcher**, not an account switcher — it's the lens you're looking through
when you log a task or browse the skill tree. Any signed-in family member
can flip between views (e.g. Rebekah marking off Winter's chores). If you
want to lock down so each account can only act as their own user, that's
a one-line guard in `Dashboard.tsx` and `SkillsView.tsx`.

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
