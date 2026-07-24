-- ============================================================================
-- Fix: handle_new_user()'s customers insert used `on conflict (user_id)
-- do nothing`, but customers_user_id_key is a PARTIAL unique index
-- (`where user_id is not null`) — Postgres requires an ON CONFLICT
-- target to match a unique index's predicate exactly, not just its
-- columns, so the plain `on conflict (user_id)` didn't match it. Every
-- new customer signup failed with a generic "Database error saving new
-- user" from Supabase Auth (confirmed against the live project — this is
-- exactly the class of bug that can't be caught without one).
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.role_name;
begin
  v_role := coalesce((new.raw_user_meta_data ->> 'role')::public.role_name, 'customer');

  insert into public.users (id, full_name, email, phone, role, branch_id, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    coalesce(new.phone, ''),
    v_role,
    nullif(new.raw_user_meta_data ->> 'branch_id', '')::uuid,
    'active'
  )
  on conflict (id) do nothing;

  if v_role = 'customer' then
    insert into public.customers (user_id, full_name, phone, email, marketing_opt_in)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', ''),
      coalesce(new.phone, ''),
      new.email,
      false
    )
    on conflict (user_id) where user_id is not null do nothing;
  end if;

  return new;
end;
$$;
