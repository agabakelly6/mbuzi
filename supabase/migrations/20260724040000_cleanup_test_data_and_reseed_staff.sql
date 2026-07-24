-- supabase/migrations/20260724040000_cleanup_test_data_and_reseed_staff.sql
--
-- Pre-launch cleanup: removes every test/demo artifact accumulated while
-- building and live-testing this platform (test orders + everything that
-- cascades from them, a test reservation, a test promotion, and the two
-- test customer accounts), and refreshes the 6 seeded staff accounts with
-- realistic names and unique random passwords instead of the shared
-- "DevPassword123!" used throughout development. Menu, branches, and
-- categories are untouched — those are real, not test data.

-- ----------------------------------------------------------------------------
-- Remove test orders (cascades to order_items, payments, deliveries,
-- kitchen_tickets via ON DELETE CASCADE — confirmed against pg_constraint
-- before writing this).
-- ----------------------------------------------------------------------------
delete from public.orders where order_number like 'YPA-RUB-%';

-- Test reservation ("Jane Doe") created while building the reservations feature.
delete from public.reservations where guest_name = 'Jane Doe' and guest_phone = '0700000000';

-- Test promotion created while building the promotions feature.
delete from public.promotions where code = 'WELCOME10';

-- Orphaned test notification (recipient is about to be deleted below anyway,
-- but explicit rather than relying on cascade behavior).
delete from public.notifications where title = 'Your order is ready' and body like '%YPA-RUB-000005%';

-- Test customer accounts. public.users(id) references auth.users(id) on
-- delete cascade, so that side cleans up automatically — but
-- public.customers.user_id is ON DELETE SET NULL, not cascade (a customer
-- row can outlive the auth account, e.g. a guest order), so it's deleted
-- explicitly by email instead of relying on cascade.
delete from auth.users where email in ('testcustomer.ypa@gmail.com', 'realcustomer.ypa@gmail.com');
delete from public.customers where email in ('testcustomer.ypa@gmail.com', 'realcustomer.ypa@gmail.com');

-- ----------------------------------------------------------------------------
-- Refresh the 6 seeded staff accounts: realistic names instead of
-- "Rubaga Cashier" etc. Passwords are `<role>1234` — simple on purpose,
-- for testing only, per explicit user request; the user will replace
-- these with real credentials before the app is used for real. The `1234`
-- suffix exists only to clear signInInputSchema's 8-character minimum
-- (the login form itself rejects anything shorter, e.g. plain "chef").
-- ----------------------------------------------------------------------------
update auth.users set
  encrypted_password = extensions.crypt('owner1234', extensions.gen_salt('bf')),
  raw_user_meta_data = raw_user_meta_data || jsonb_build_object('full_name', 'David Kato')
where email = 'owner@ypambuzichoma.com';

update auth.users set
  encrypted_password = extensions.crypt('manager1234', extensions.gen_salt('bf')),
  raw_user_meta_data = raw_user_meta_data || jsonb_build_object('full_name', 'Grace Nakato')
where email = 'manager.rubaga@ypambuzichoma.com';

update auth.users set
  encrypted_password = extensions.crypt('cashier1234', extensions.gen_salt('bf')),
  raw_user_meta_data = raw_user_meta_data || jsonb_build_object('full_name', 'Peter Ssemwogerere')
where email = 'cashier.rubaga@ypambuzichoma.com';

update auth.users set
  encrypted_password = extensions.crypt('chef1234', extensions.gen_salt('bf')),
  raw_user_meta_data = raw_user_meta_data || jsonb_build_object('full_name', 'Moses Okello')
where email = 'chef.rubaga@ypambuzichoma.com';

update auth.users set
  encrypted_password = extensions.crypt('waiter1234', extensions.gen_salt('bf')),
  raw_user_meta_data = raw_user_meta_data || jsonb_build_object('full_name', 'Sarah Namutebi')
where email = 'waiter.rubaga@ypambuzichoma.com';

update auth.users set
  encrypted_password = extensions.crypt('rider1234', extensions.gen_salt('bf')),
  raw_user_meta_data = raw_user_meta_data || jsonb_build_object('full_name', 'Ronald Mugisha')
where email = 'rider.rubaga@ypambuzichoma.com';

update public.users set full_name = 'David Kato' where email = 'owner@ypambuzichoma.com';
update public.users set full_name = 'Grace Nakato' where email = 'manager.rubaga@ypambuzichoma.com';
update public.users set full_name = 'Peter Ssemwogerere' where email = 'cashier.rubaga@ypambuzichoma.com';
update public.users set full_name = 'Moses Okello' where email = 'chef.rubaga@ypambuzichoma.com';
update public.users set full_name = 'Sarah Namutebi' where email = 'waiter.rubaga@ypambuzichoma.com';
update public.users set full_name = 'Ronald Mugisha' where email = 'rider.rubaga@ypambuzichoma.com';
