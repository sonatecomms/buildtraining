-- Run this if you already ran athlete_access.sql before athletes could edit
-- their own profile. Lets a signed-in athlete update their own client record
-- (photo, stats, goals, frequency) without being able to reassign it.
drop policy if exists "athlete updates own client" on clients;
create policy "athlete updates own client" on clients
  for update using (lower(athlete_email) = lower(auth.jwt() ->> 'email'))
  with check (lower(athlete_email) = lower(auth.jwt() ->> 'email'));
