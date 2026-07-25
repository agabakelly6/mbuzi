-- supabase/migrations/20260725030000_assistant_analytics.sql
--
-- Anonymous capture of what customers actually ask the AI concierge —
-- no customer identifier of any kind (not even a session id), just the
-- question, which knowledge categories it was scoped to (a cheap proxy
-- for topic/intent), and which page it was asked from. Written only by
-- the ai-concierge Edge Function (service-role, bypasses RLS entirely,
-- same pattern every other server-side write in this project uses) —
-- anon has zero access, not even insert, since the Edge Function is the
-- only legitimate writer. No viewing UI yet; this just gets the data
-- accumulating so "most common questions" / "things we couldn't answer"
-- reporting is possible later without a schema change.

create table public.assistant_analytics (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  categories text[] not null default '{}',
  page_context text,
  created_at timestamptz not null default now()
);

alter table public.assistant_analytics enable row level security;

create policy assistant_analytics_owner_select
  on public.assistant_analytics
  for select
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'owner'
    )
  );
