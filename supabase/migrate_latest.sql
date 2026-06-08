-- Catch-up migration — safe to run anytime (idempotent). Brings an existing
-- BUILD database up to date with the latest app version. THIS is what makes
-- athlete profile edits (including the photo) actually save to the cloud.

-- columns the app now writes
alter table clients add column if not exists athlete_email text;
alter table clients add column if not exists archived boolean not null default false;
alter table workout_logs add column if not exists entries jsonb not null default '[]'::jsonb;

-- let a signed-in athlete UPDATE their own profile (photo, stats, goals)
drop policy if exists "athlete updates own client" on clients;
create policy "athlete updates own client" on clients
  for update using (lower(athlete_email) = lower(auth.jwt() ->> 'email'))
  with check (lower(athlete_email) = lower(auth.jwt() ->> 'email'));

-- enable realtime (live updates between coach and athlete without refresh)
do $$ begin alter publication supabase_realtime add table clients; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table programs; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table workout_logs; exception when duplicate_object then null; end $$;
