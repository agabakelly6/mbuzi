-- ============================================================================
-- Minimal development seed data.
-- Run automatically by `supabase db reset` against the Supabase CLI's local
-- dev stack. No fake customers, no fake orders, no fake order history —
-- only what the milestone brief asked for: branches, and one staff account
-- per role.
--
-- IMPORTANT: the auth.users/auth.identities insert below targets the
-- schema used by Supabase's managed Postgres. That schema is managed by
-- Supabase and can change between versions. If this section ever fails,
-- check the columns used here against the current auth schema, or create
-- these six accounts via the Auth Admin API (`supabase.auth.admin.createUser`)
-- instead — the public.branches inserts below have no such dependency and
-- are safe regardless.
--
-- crypt()/gen_salt() are schema-qualified as extensions.crypt/gen_salt —
-- on Supabase-hosted projects pgcrypto installs into the `extensions`
-- schema, not `public` or the default search_path, so the unqualified
-- names fail with "function does not exist" (confirmed against a live
-- project while writing this).
--
-- Every seeded password is the literal string below, for local development
-- only. Never reuse it anywhere real.
--   Password: DevPassword123!
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Branches — reusing the real branch identifiers/names/addresses already
-- defined in src/data/locations.ts as the source of truth, so seeded data
-- lines up with the marketing site rather than inventing placeholder names.
-- ----------------------------------------------------------------------------
insert into public.branches (id, name, slug, city, address, phone, whatsapp, email, status, settings)
values
  ('00000000-0000-0000-0000-000000000001', 'YPA Mbuzi Choma — Rubaga', 'rubaga', 'Rubaga',
   'Rubaga Road, opposite Access Building, Kampala', '+256 702 587 863', '256702587863',
   'rubaga@ypambuzichoma.com', 'active',
   '{"timezone":"Africa/Kampala","currency":"UGX","orderingEnabled":true,"deliveryEnabled":true,"reservationsEnabled":true,"taxRatePercent":0}'),
  ('00000000-0000-0000-0000-000000000002', 'YPA Mbuzi Choma — Ntinda', 'ntinda', 'Ntinda',
   'Semawata Road, Ntinda, Kampala', '+256 702 587 863', '256702587863',
   'ntinda@ypambuzichoma.com', 'active',
   '{"timezone":"Africa/Kampala","currency":"UGX","orderingEnabled":true,"deliveryEnabled":true,"reservationsEnabled":true,"taxRatePercent":0}'),
  ('00000000-0000-0000-0000-000000000003', 'YPA Mbuzi Choma — Mbarara', 'mbarara', 'Mbarara',
   'Mbarara-Masaka Road, Mbarara', '+256 702 587 863', '256702587863',
   'mbarara@ypambuzichoma.com', 'active',
   '{"timezone":"Africa/Kampala","currency":"UGX","orderingEnabled":true,"deliveryEnabled":true,"reservationsEnabled":true,"taxRatePercent":0}'),
  ('00000000-0000-0000-0000-000000000004', 'YPA Mbuzi Choma — Maddu', 'maddu', 'Maddu',
   'Maddu Town, Gomba District', '+256 702 587 863', '256702587863',
   'maddu@ypambuzichoma.com', 'active',
   '{"timezone":"Africa/Kampala","currency":"UGX","orderingEnabled":true,"deliveryEnabled":true,"reservationsEnabled":true,"taxRatePercent":0}'),
  ('00000000-0000-0000-0000-000000000005', 'YPA Mbuzi Choma — Nansana', 'nansana', 'Nansana',
   'Nansana, Wakiso District', '', '', '', 'coming-soon',
   '{"timezone":"Africa/Kampala","currency":"UGX","orderingEnabled":false,"deliveryEnabled":false,"reservationsEnabled":false,"taxRatePercent":0}');

-- ----------------------------------------------------------------------------
-- One staff account per role, all assigned to the Rubaga branch (the
-- flagship/featured branch per src/data/locations.ts) for simplicity.
-- Inserting directly into auth.users mirrors the standard Supabase CLI
-- local-seed pattern (encrypted_password via pgcrypto's crypt()/gen_salt(),
-- a matching auth.identities row for password sign-in, email pre-confirmed
-- so no confirmation email is needed in local dev).
-- ----------------------------------------------------------------------------
do $$
declare
  v_password text := 'DevPassword123!';
  v_rubaga uuid := '00000000-0000-0000-0000-000000000001';
  v_staff record;
begin
  for v_staff in
    select * from (values
      ('10000000-0000-0000-0000-000000000001'::uuid, 'owner@ypambuzichoma.com', 'Owner Account', 'owner'::public.role_name, null::uuid),
      ('10000000-0000-0000-0000-000000000002'::uuid, 'manager.rubaga@ypambuzichoma.com', 'Rubaga Branch Manager', 'branch_manager'::public.role_name, v_rubaga),
      ('10000000-0000-0000-0000-000000000003'::uuid, 'cashier.rubaga@ypambuzichoma.com', 'Rubaga Cashier', 'cashier'::public.role_name, v_rubaga),
      ('10000000-0000-0000-0000-000000000004'::uuid, 'chef.rubaga@ypambuzichoma.com', 'Rubaga Chef', 'chef'::public.role_name, v_rubaga),
      ('10000000-0000-0000-0000-000000000005'::uuid, 'waiter.rubaga@ypambuzichoma.com', 'Rubaga Waiter', 'waiter'::public.role_name, v_rubaga),
      ('10000000-0000-0000-0000-000000000006'::uuid, 'rider.rubaga@ypambuzichoma.com', 'Rubaga Rider', 'rider'::public.role_name, v_rubaga)
    ) as t(id, email, full_name, role, branch_id)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    )
    values (
      '00000000-0000-0000-0000-000000000000', v_staff.id, 'authenticated', 'authenticated',
      v_staff.email, extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(),
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('full_name', v_staff.full_name, 'role', v_staff.role, 'branch_id', v_staff.branch_id),
      now(), now(), '', '', '', ''
    )
    on conflict (id) do nothing;

    insert into auth.identities (
      id, provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at
    )
    values (
      gen_random_uuid(), v_staff.id::text, v_staff.id,
      jsonb_build_object('sub', v_staff.id::text, 'email', v_staff.email),
      'email', now(), now(), now()
    )
    on conflict do nothing;

    -- The on_auth_user_created trigger (migration 20260723010000) already
    -- creates the matching public.users row from raw_user_meta_data above;
    -- this update just makes intent explicit in case that trigger's
    -- behavior ever changes.
    update public.users
    set full_name = v_staff.full_name, role = v_staff.role, branch_id = v_staff.branch_id, status = 'active'
    where id = v_staff.id;
  end loop;
end $$;

-- Rubaga's manager_id now points at the seeded branch manager.
update public.branches
set manager_id = '10000000-0000-0000-0000-000000000002'
where id = '00000000-0000-0000-0000-000000000001';
