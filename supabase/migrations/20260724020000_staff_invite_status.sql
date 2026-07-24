-- ============================================================================
-- Feature: staff hire/fire from the branch manager dashboard.
--
-- handle_new_user() previously hardcoded status = 'active' for every new
-- signup. The new invite-staff Edge Function (supabase/functions/invite-staff)
-- calls auth.admin.inviteUserByEmail with status: 'invited' in the metadata
-- so a manager can see, in the staff roster, who hasn't accepted their
-- invite yet — matching UserRepository.invite()'s own doc comment ("creates
-- a User in 'invited' status ahead of them completing auth signup"), which
-- Milestone 1/2 wrote before Milestone 3 had a way to fulfil it. Every other
-- signup path (customer self-registration, the seed script) never sets a
-- 'status' metadata key, so they're unaffected and keep defaulting to
-- 'active'.
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
  v_status public.user_status;
begin
  v_role := coalesce((new.raw_user_meta_data ->> 'role')::public.role_name, 'customer');
  v_phone := coalesce(nullif(new.raw_user_meta_data ->> 'phone', ''), new.phone, '');
  v_status := coalesce((new.raw_user_meta_data ->> 'status')::public.user_status, 'active');

  insert into public.users (id, full_name, email, phone, role, branch_id, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    v_phone,
    v_role,
    nullif(new.raw_user_meta_data ->> 'branch_id', '')::uuid,
    v_status
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
