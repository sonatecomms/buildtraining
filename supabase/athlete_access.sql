-- Athlete access — run AFTER schema.sql.
-- Lets an athlete sign in (magic link) and see ONLY their own client record,
-- program, and the coach's exercises, and log their own workouts. The coach
-- assigns the athlete's login email on the client's profile (clients.athlete_email).

alter table clients add column if not exists athlete_email text;
create index if not exists idx_clients_athlete on clients (lower(athlete_email));

-- Athlete can read the client record that carries their email.
drop policy if exists "athlete reads own client" on clients;
create policy "athlete reads own client" on clients
  for select using (lower(athlete_email) = lower(auth.jwt() ->> 'email'));

-- Athlete can update their own profile (photo, stats, goals) but not reassign it.
drop policy if exists "athlete updates own client" on clients;
create policy "athlete updates own client" on clients
  for update using (lower(athlete_email) = lower(auth.jwt() ->> 'email'))
  with check (lower(athlete_email) = lower(auth.jwt() ->> 'email'));

-- Athlete can read the program for their client.
drop policy if exists "athlete reads own program" on programs;
create policy "athlete reads own program" on programs
  for select using (
    exists (
      select 1 from clients c
      where c.id = programs.client_id
        and lower(c.athlete_email) = lower(auth.jwt() ->> 'email')
    )
  );

-- Athlete can read the coach's exercise library (to render names/videos).
drop policy if exists "athlete reads coach exercises" on exercises;
create policy "athlete reads coach exercises" on exercises
  for select using (
    exists (
      select 1 from clients c
      where c.coach_id = exercises.coach_id
        and lower(c.athlete_email) = lower(auth.jwt() ->> 'email')
    )
  );

-- Athlete can read and write (log) their own workout logs.
drop policy if exists "athlete reads own logs" on workout_logs;
create policy "athlete reads own logs" on workout_logs
  for select using (
    exists (
      select 1 from clients c
      where c.id = workout_logs.client_id
        and lower(c.athlete_email) = lower(auth.jwt() ->> 'email')
    )
  );

drop policy if exists "athlete writes own logs" on workout_logs;
create policy "athlete writes own logs" on workout_logs
  for insert with check (
    exists (
      select 1 from clients c
      where c.id = workout_logs.client_id
        and lower(c.athlete_email) = lower(auth.jwt() ->> 'email')
    )
  );

drop policy if exists "athlete updates own logs" on workout_logs;
create policy "athlete updates own logs" on workout_logs
  for update using (
    exists (
      select 1 from clients c
      where c.id = workout_logs.client_id
        and lower(c.athlete_email) = lower(auth.jwt() ->> 'email')
    )
  );
