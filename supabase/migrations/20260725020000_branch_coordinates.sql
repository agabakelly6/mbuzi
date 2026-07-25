-- supabase/migrations/20260725020000_branch_coordinates.sql
--
-- Adds branch coordinates so delivery fee can be calculated from real
-- distance (haversine, client-side — see src/lib/geo.ts) instead of a
-- flat "pick your distance band" picker. Values below are approximate
-- town/neighborhood-center coordinates (public knowledge), not the exact
-- pin for each branch's street address — good enough for a straight-line
-- distance estimate, but worth refining to the real address's precise
-- coordinates (e.g. via a Google Maps pin) once that's convenient.

alter table public.branches
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

update public.branches set latitude = 0.3021, longitude = 32.5525 where slug = 'rubaga';
update public.branches set latitude = 0.3476, longitude = 32.6119 where slug = 'ntinda';
update public.branches set latitude = -0.6072, longitude = 30.6545 where slug = 'mbarara';
update public.branches set latitude = 0.2833, longitude = 31.7667 where slug = 'maddu';
update public.branches set latitude = 0.3742, longitude = 32.5111 where slug = 'nansana';
