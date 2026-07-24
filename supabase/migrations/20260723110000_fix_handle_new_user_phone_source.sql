-- ============================================================================
-- Fix: handle_new_user() read phone from `new.phone` — auth.users' native
-- phone-auth column, only populated for phone/OTP signups — instead of
-- `new.raw_user_meta_data->>'phone'`, which is where useAuthActions.signUp
-- and the staff-invite metadata actually put it for email+password
-- signups. Every email+password signup ended up with an empty phone on
-- both public.users and public.customers (confirmed against the live
-- project: seeded with "256700111222" in metadata, landed as "").
-- Now prefers the metadata value, falling back to the native column for
-- phone-based signups, then empty string.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.role_name;
  v_phone text;
begin
  v_role := coalesce((new.raw_user_meta_data ->> 'role')::public.role_name, 'customer');
  v_phone := coalesce(nullif(new.raw_user_meta_data ->> 'phone', ''), new.phone, '');

  insert into public.users (id, full_name, email, phone, role, branch_id, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    v_phone,
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
      v_phone,
      new.email,
      false
    )
    on conflict (user_id) where user_id is not null do nothing;
  end if;

  return new;
end;
$$;
