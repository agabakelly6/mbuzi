-- Temporary diagnostic function — reports what the RLS helper functions
-- actually resolve to for the calling session. Not a permanent part of
-- the schema; superseded/removed once the deliveries_insert bug (found
-- while live-testing the delivery workflow) is understood.
create or replace function public.debug_rls_context()
returns table (current_role_name public.role_name, current_branch uuid, current_uid uuid)
language sql
stable
security invoker
as $$
  select public.current_user_role(), public.current_user_branch_id(), auth.uid();
$$;
