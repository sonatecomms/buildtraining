-- Run this if you already ran schema.sql before the archive feature.
-- Adds the column that lets a coach archive (and recover) an athlete instead
-- of permanently deleting them.
alter table clients add column if not exists archived boolean not null default false;
