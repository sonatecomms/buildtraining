-- Coach ↔ athlete messaging. Run AFTER schema.sql + athlete_access.sql.
-- One direct thread per client (the coach and that athlete). Kept OUT of the
-- whole-DB upsert/prune sync — messages are append-only single inserts, so a
-- prune-style sync would risk deleting the other party's messages.

create table if not exists messages (
  id text primary key,
  coach_id uuid not null references auth.users (id) on delete cascade,
  client_id text not null references clients (id) on delete cascade,
  sender text not null check (sender in ('coach', 'athlete')),
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_messages_client on messages (client_id, created_at);

alter table messages enable row level security;

-- ---- Coach: owns every thread under their account --------------------------
drop policy if exists "coach reads messages" on messages;
create policy "coach reads messages" on messages
  for select using (auth.uid() = coach_id);

drop policy if exists "coach sends messages" on messages;
create policy "coach sends messages" on messages
  for insert with check (auth.uid() = coach_id and sender = 'coach');

drop policy if exists "coach updates messages" on messages;
create policy "coach updates messages" on messages
  for update using (auth.uid() = coach_id) with check (auth.uid() = coach_id);

-- ---- Athlete: only their own thread, only as the 'athlete' sender, only with
-- the coach_id that actually owns their client record (no thread spoofing) -----
drop policy if exists "athlete reads own messages" on messages;
create policy "athlete reads own messages" on messages
  for select using (exists (
    select 1 from clients c
    where c.id = messages.client_id
      and lower(c.athlete_email) = lower(auth.jwt() ->> 'email')));

drop policy if exists "athlete sends own messages" on messages;
create policy "athlete sends own messages" on messages
  for insert with check (sender = 'athlete' and exists (
    select 1 from clients c
    where c.id = messages.client_id
      and c.coach_id = messages.coach_id
      and lower(c.athlete_email) = lower(auth.jwt() ->> 'email')));

drop policy if exists "athlete updates own messages" on messages;
create policy "athlete updates own messages" on messages
  for update using (exists (
    select 1 from clients c
    where c.id = messages.client_id
      and lower(c.athlete_email) = lower(auth.jwt() ->> 'email')))
  with check (exists (
    select 1 from clients c
    where c.id = messages.client_id
      and lower(c.athlete_email) = lower(auth.jwt() ->> 'email')));

-- live delivery between coach and athlete without a refresh
do $$ begin alter publication supabase_realtime add table messages; exception when duplicate_object then null; end $$;
