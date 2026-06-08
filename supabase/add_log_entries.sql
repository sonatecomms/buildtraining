-- Run this if you already ran schema.sql before the athlete logging feature.
-- Adds the column that stores each athlete's per-movement results
-- (weight, sets/reps done, feeling 1–5, notes).
alter table workout_logs add column if not exists entries jsonb not null default '[]'::jsonb;
