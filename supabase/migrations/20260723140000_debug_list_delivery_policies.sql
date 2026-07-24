-- Temporary — lists the actual RLS policies live on public.deliveries so
-- we can see what's really there vs. what the migrations intended.
create or replace function public.debug_list_policies(target_table text)
returns table (policy_name text, cmd text, qual text, with_check text)
language sql
stable
security definer
set search_path = public
as $$
  select polname::text,
    case polcmd when 'r' then 'select' when 'a' then 'insert' when 'w' then 'update' when 'd' then 'delete' else '*' end,
    pg_get_expr(polqual, polrelid),
    pg_get_expr(polwithcheck, polrelid)
  from pg_policy
  where polrelid = ('public.' || target_table)::regclass;
$$;
