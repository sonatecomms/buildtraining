# BUILD: Fitness Coaching App

A TrueCoach-style PWA: coaches build training programs, athletes log workouts and
chase streaks. Installable to the iOS/Android home screen.

## Stack
- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Tailwind v4** — palette in `src/app/globals.css`
- **Supabase** (optional) — Postgres + Auth + Storage; schema in `supabase/schema.sql`
- Runs **local-first**: a typed `localStorage` store seeded with demo data, so it
  works with zero backend setup.

## Run
```bash
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Features
- **Program builder** — training days, movements, supersets & circuits, per-set
  reps/rest/cues, YouTube demo links, reorderable blocks.
- **Exercise library** — ~35 seeded movements with form videos; add your own.
- **Athlete profile** — photo upload (auto-cropped square), stats, weekly
  frequency, fitness goals (strength, cardio, mobility…), coach notes.
- **Workout logging** — run a session, check off movements, finish to log.
- **Gamification** — day streaks, levels & points, weekly target ring, badges.
- **PWA** — manifest + service worker + icons; "Add to Home Screen" on iOS/Android.

## App map
- `/` — coach dashboard (athlete list)
- `/clients/[id]` — athlete hub: **Program** | **Train** | **Profile** tabs
- `/exercises` — movement library
- `/install` — install instructions + demo reset

## Connecting Supabase (cloud sync + login)
Follow **`SUPABASE_SETUP.md`** (about 5 minutes). In short: create a free project,
run `supabase/schema.sql`, paste the URL + anon key into `.env.local`, set the auth
redirect to `http://localhost:3000`, restart. The app then requires a magic-link
coach sign in and syncs every change to the cloud. With no keys present it stays
fully local. Wiring lives in `src/lib/supabase.ts`, `src/lib/sync.ts`, and
`src/components/SessionProvider.tsx`.

## Program scheduling
Workouts are assigned to a weekday (`dow`, 0=Sun…6=Sat). Both the coach builder and
the athlete Train view show a **Sun–Sat dated week strip** and one day at a time.
Blocks (movements / supersets / circuits) are **drag-to-reorder**, and each movement
has an in-app **video picker** (paste/preview a YouTube clip; per-use override falls
back to the exercise's default demo).

## Data model
See `src/lib/types.ts`. Programs hold nested `workouts → blocks → items`, stored
as JSONB on the program row in Supabase.
