-- Forge — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query → paste → Run).
--
-- IDs are text so the app's client-generated ids work the same locally and in the
-- cloud. Every row is scoped to a coach (auth user) and protected by RLS, so a
-- signed-in coach only ever sees their own data.

create table if not exists clients (
  id text primary key,
  coach_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  avatar_url text,
  stats jsonb not null default '{}'::jsonb,
  goals text[] not null default '{}',
  intended_frequency int not null default 3,
  notes text,
  archived boolean not null default false,
  created_at text not null default to_char(now(), 'YYYY-MM-DD')
);

create table if not exists exercises (
  id text primary key,
  coach_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null,
  equipment text not null,
  primary_muscle text not null,
  youtube_url text,
  custom boolean not null default true
);

create table if not exists programs (
  id text primary key,
  coach_id uuid not null references auth.users (id) on delete cascade,
  client_id text not null references clients (id) on delete cascade,
  name text not null default 'New Program',
  workouts jsonb not null default '[]'::jsonb, -- [{ id, name, dow, blocks: [...] }]
  updated_at text not null default to_char(now(), 'YYYY-MM-DD')
);

create table if not exists workout_logs (
  id text primary key,
  coach_id uuid not null references auth.users (id) on delete cascade,
  client_id text not null references clients (id) on delete cascade,
  workout_id text not null,
  workout_name text not null,
  date text not null,
  duration_min int,
  completed_item_ids text[] not null default '{}',
  rpe int,
  entries jsonb not null default '[]'::jsonb, -- athlete's per-movement results
  workout_snapshot jsonb, -- prescription for sessions not in the synced program
  unique (client_id, workout_id, date)
);

create index if not exists idx_clients_coach on clients (coach_id);
create index if not exists idx_programs_client on programs (client_id);
create index if not exists idx_logs_client on workout_logs (client_id);

-- ---- Row Level Security -----------------------------------------------------
alter table clients enable row level security;
alter table exercises enable row level security;
alter table programs enable row level security;
alter table workout_logs enable row level security;

drop policy if exists "own clients" on clients;
create policy "own clients" on clients
  for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);

drop policy if exists "own exercises" on exercises;
create policy "own exercises" on exercises
  for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);

drop policy if exists "own programs" on programs;
create policy "own programs" on programs
  for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);

drop policy if exists "own logs" on workout_logs;
create policy "own logs" on workout_logs
  for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);
