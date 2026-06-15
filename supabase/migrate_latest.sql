-- Catch-up migration — safe to run anytime (idempotent). Brings an existing
-- BUILD database up to date with the latest app version. THIS is what makes
-- athlete profile edits (including the photo) actually save to the cloud.

-- columns the app now writes
alter table clients add column if not exists athlete_email text;
alter table clients add column if not exists recovery_email text;
alter table clients add column if not exists archived boolean not null default false;
alter table workout_logs add column if not exists entries jsonb not null default '[]'::jsonb;
-- prescription snapshot for sessions not in the synced program (generator-built
-- workouts, "your own work") so the coach can review what the athlete did
alter table workout_logs add column if not exists workout_snapshot jsonb;

-- let a signed-in athlete UPDATE their own profile (photo, stats, goals)
drop policy if exists "athlete updates own client" on clients;
create policy "athlete updates own client" on clients
  for update using (lower(athlete_email) = lower(auth.jwt() ->> 'email'))
  with check (lower(athlete_email) = lower(auth.jwt() ->> 'email'));

-- Lock sensitive columns against athlete writes: RLS is row-level, so without
-- this an athlete updating their own row could change coach_id / athlete_email /
-- archived (reassign or hijack the record). When the updater is an AUTHENTICATED
-- non-owner (an athlete), force those columns back. The `auth.uid() is not null`
-- guard lets the trusted SERVER (service-role, uid null) write them — that's how
-- coach- and athlete-initiated login changes update athlete_email; athletes still
-- can't touch these columns directly.
create or replace function build_protect_client_cols() returns trigger as $$
begin
  if auth.uid() is not null and auth.uid() is distinct from old.coach_id then
    new.coach_id := old.coach_id;
    new.athlete_email := old.athlete_email;
    new.id := old.id;
    new.archived := old.archived;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists build_protect_client_cols_trg on clients;
create trigger build_protect_client_cols_trg
  before update on clients
  for each row execute function build_protect_client_cols();

-- prevent a second coach from shadowing an athlete by reusing their login id
create unique index if not exists uniq_clients_athlete_email
  on clients (lower(athlete_email)) where athlete_email is not null;

-- enable realtime (live updates between coach and athlete without refresh)
do $$ begin alter publication supabase_realtime add table clients; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table programs; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table workout_logs; exception when duplicate_object then null; end $$;

-- ===========================================================================
-- Hardening (added after the v29 security review). Idempotent — safe to re-run.
-- ===========================================================================

-- 1) Allow-LIST the client columns an authenticated athlete may change, instead of
--    a deny-list (so any NEW column is protected by default). They may edit only
--    their own profile fields; everything else (coach_id, athlete_email, archived,
--    notes, etc.) is forced back. The service role (auth.uid() null) bypasses.
create or replace function build_protect_client_cols() returns trigger as $$
declare
  _name text := new.name;
  _avatar text := new.avatar_url;
  _stats jsonb := new.stats;
  _goals text[] := new.goals;
  _freq int := new.intended_frequency;
  _recovery text := new.recovery_email;
begin
  if auth.uid() is not null and auth.uid() is distinct from old.coach_id then
    new := old;                       -- start from the untouched row…
    new.name := _name;                -- …then re-apply only athlete-editable fields
    new.avatar_url := _avatar;
    new.stats := _stats;
    new.goals := _goals;
    new.intended_frequency := _freq;
    new.recovery_email := _recovery;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = pg_catalog, public;

-- 2) Add the missing WITH CHECK so an athlete can't re-stamp one of their own
--    workout_logs onto a different client_id (cross-client write).
drop policy if exists "athlete updates own logs" on workout_logs;
create policy "athlete updates own logs" on workout_logs
  for update
  using (exists (select 1 from clients c
                 where c.id = workout_logs.client_id
                   and lower(c.athlete_email) = lower(auth.jwt() ->> 'email')))
  with check (exists (select 1 from clients c
                      where c.id = workout_logs.client_id
                        and lower(c.athlete_email) = lower(auth.jwt() ->> 'email')));

-- 3) Indexed email→id lookup so the server stops scanning the whole auth.users
--    table to find one account. service_role-only.
create or replace function get_user_id_by_email(p_email text)
returns uuid language sql stable security definer set search_path = pg_catalog, auth as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;
revoke all on function get_user_id_by_email(text) from public;
grant execute on function get_user_id_by_email(text) to service_role;
