-- supabase/migrations/20260725070000_simplify_staff_roles.sql
--
-- Simplifies the operational staff roles down to two: cashier (handles
-- every incoming order end-to-end — accept, prep, serve/dispatch,
-- complete) and branch_manager (full branch control), alongside owner
-- (platform-wide, unchanged) and customer (unchanged). waiter, chef, and
-- rider are removed entirely — their day-to-day duties (taking orders,
-- running the kitchen, delivering) now fall to whichever cashier/manager
-- is on shift, per explicit request. Two features tied to the removed
-- roles go with them: the kitchen ticket queue (chef-only) and the
-- customer-facing order-status tracker (a separate simplification done
-- at the same time, not because it depended on any removed role).
--
-- Note on the role_name enum itself: it still declares waiter/chef/rider
-- as valid labels — see section 6 below for why removing them turned out
-- to be far riskier than it looks on paper, and why leaving them declared
-- but unreachable is the safer, equivalent outcome.

-- ============================================================================
-- 1. Delete the seeded waiter/chef/rider staff accounts.
-- public.users(id) references auth.users(id) on delete cascade, so
-- deleting from auth.users alone removes the matching public.users row
-- too. Every FK that could otherwise block this (deliveries.rider_id,
-- kitchen_tickets.assigned_chef_id, payments.*_by_user_id,
-- reservations.confirmed_by_user_id) is `on delete set null`, so no
-- historical order/payment/reservation row is deleted or blocked — it
-- just loses that one attribution field.
-- ============================================================================
delete from auth.users
where email in (
  'chef.rubaga@ypambuzichoma.com',
  'waiter.rubaga@ypambuzichoma.com',
  'rider.rubaga@ypambuzichoma.com'
);

-- ============================================================================
-- 2. Remove the kitchen ticket queue entirely — it existed solely for the
-- now-removed chef role (see kitchen_tickets' own RLS comment in the
-- platform_schema migration: "waiter (read/list), chef (read/list/
-- update)"). Drops the auto-creation trigger on orders first (it lives on
-- a different table so `drop table ... cascade` below wouldn't reach it),
-- then the table itself (cascade takes its own policies and
-- set_updated_at trigger instance with it).
-- ============================================================================
drop trigger if exists on_order_accepted on public.orders;
drop function if exists public.create_kitchen_ticket_on_order_accepted();
drop table if exists public.kitchen_tickets cascade;

-- ============================================================================
-- 3. Remove the customer-facing order-status tracker's backend — the
-- guest checkout confirmation screen no longer polls this.
-- ============================================================================
drop function if exists public.get_guest_order_status(uuid, text);

-- ============================================================================
-- 4. get_staff_performance referenced kitchen_tickets (chef prep time) and
-- deliveries.rider_id (rider completions) — both dropped/orphaned above.
-- Simplified to just orders a staff member placed; average_prep_time_minutes
-- stays in the return shape (the TS type already treats it as optional)
-- but is always null now — there's no more chef-style "ticket lifecycle"
-- to time.
-- ============================================================================
create or replace function public.get_staff_performance(
  p_user_id uuid,
  p_period_start timestamptz,
  p_period_end timestamptz
)
returns table (
  orders_handled integer,
  average_prep_time_minutes numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_target_branch_id uuid;
begin
  select branch_id into v_target_branch_id from public.users where id = p_user_id;

  if not (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and public.current_user_branch_id() = v_target_branch_id)
    or auth.uid() = p_user_id
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  select
    (
      select count(*) from public.orders o
      where o.placed_by_user_id = p_user_id
        and o.created_at >= p_period_start and o.created_at < p_period_end
    )::integer as orders_handled,
    null::numeric as average_prep_time_minutes;
end;
$$;

-- ============================================================================
-- 5. Rider-specific delivery access — redefine deliveries_select/update/
-- insert without the rider clause. Cashier/branch_manager/owner keep
-- exactly the access they already had; nothing new is granted here.
-- ============================================================================
drop policy if exists deliveries_select on public.deliveries;
create policy deliveries_select on public.deliveries
  for select
  using (
    public.is_owner()
    or (public.current_user_role() in ('cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
    or exists (
      select 1 from public.orders o
      join public.customers c on c.id = o.customer_id
      where o.id = deliveries.order_id and c.user_id = auth.uid()
    )
  );

drop policy if exists deliveries_update on public.deliveries;
create policy deliveries_update on public.deliveries
  for update
  using (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
    or (public.current_user_role() = 'cashier' and branch_id = public.current_user_branch_id())
  )
  with check (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
    or (public.current_user_role() = 'cashier' and branch_id = public.current_user_branch_id())
  );

drop policy if exists deliveries_insert on public.deliveries;
create policy deliveries_insert on public.deliveries
  for insert
  with check (
    public.is_owner()
    or (public.current_user_role() in ('cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
    or (
      public.current_user_role() = 'customer'
      and exists (
        select 1 from public.orders o
        join public.customers c on c.id = o.customer_id
        where o.id = deliveries.order_id
          and c.user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- 6. NOT shrinking the role_name enum itself. Postgres can't drop enum
-- values directly — the standard workaround (rename the type out of the
-- way, create a new one under the original name, migrate every column,
-- drop the old type) turned out to be far riskier here than it looks on
-- paper: current_user_role() returns role_name, and virtually every RLS
-- policy in this schema calls it — changing its return type means
-- recreating that function, which Postgres won't allow via CREATE OR
-- REPLACE across a return-type change, and a plain DROP FUNCTION fails
-- because is_owner() and dozens of policies across every table in this
-- schema depend on it. Fully unwinding that (CASCADE, then hand-recreating
-- every dependent policy — not just the ones this migration otherwise
-- touches) was confirmed live to be a much bigger, riskier blast radius
-- than intended for what should be an application-layer role restriction.
--
-- The 'waiter'/'chef'/'rider' labels stay defined on the enum (Postgres
-- offers no safe way to remove them without the above), but nothing can
-- ever be assigned one again: every account that had one was deleted in
-- step 1 above, handle_new_user() always assigns 'customer' to a fresh
-- signup, and the only other path that can set a role — invite-staff's
-- admin API — now only ever sends 'cashier' (or 'branch_manager' for an
-- owner-initiated hire; see that Edge Function's SUBORDINATE_ROLES/
-- HIRABLE_ROLES). roleNameSchema (src/validators/user.schema.ts) also
-- only accepts the four real roles, so even a direct call to that Edge
-- Function with a stale role string is rejected before it reaches here.
-- These three unused labels are inert, not reachable from anywhere in the
-- app — a cosmetic loose end, not a real gap.
-- ============================================================================

-- ============================================================================
-- 7. Every RLS policy that listed waiter/chef/rider as an allowed role —
-- rewritten to drop those values. Where cashier or branch_manager was
-- already in the same list, they keep exactly the access they already
-- had (nothing new granted). Where a policy was chef-only (menu_items
-- update-for-out-of-stock, inventory_items) it's left branch_manager/owner
-- only — flagging an item out of stock or editing inventory is a manager
-- task now, not spread onto cashier, per explicit scope ("manager page
-- remains as it is... he can edit the menu items and others").
-- ============================================================================

-- menu_items: staff-visibility-of-hidden-items policy.
drop policy if exists menu_items_select_public on public.menu_items;
create policy menu_items_select_public on public.menu_items
  for select
  using (
    availability <> 'hidden'
    or public.current_user_role() in ('owner', 'branch_manager', 'cashier')
  );

-- menu_items: chef could flag out-of-stock; that's a manager-only action now.
drop policy if exists menu_items_update on public.menu_items;
create policy menu_items_update on public.menu_items
  for update
  using (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  )
  with check (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  );

-- restaurant_tables: waiter dropped, cashier/branch_manager already covered.
drop policy if exists restaurant_tables_select on public.restaurant_tables;
create policy restaurant_tables_select on public.restaurant_tables
  for select
  using (
    public.is_owner()
    or (public.current_user_role() in ('cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  );

drop policy if exists restaurant_tables_update on public.restaurant_tables;
create policy restaurant_tables_update on public.restaurant_tables
  for update
  using (
    public.is_owner()
    or (public.current_user_role() in ('cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  )
  with check (
    public.is_owner()
    or (public.current_user_role() in ('cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  );

-- reservations: same waiter-drop, cashier/branch_manager unaffected.
drop policy if exists reservations_select_staff on public.reservations;
create policy reservations_select_staff on public.reservations
  for select
  using (
    public.is_owner()
    or (public.current_user_role() in ('cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  );

drop policy if exists reservations_update_staff on public.reservations;
create policy reservations_update_staff on public.reservations
  for update
  using (
    public.is_owner()
    or (public.current_user_role() in ('cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  )
  with check (
    public.is_owner()
    or (public.current_user_role() in ('cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  );

-- orders: waiter/chef dropped from select; waiter dropped from insert/update.
-- Cashier already covered every one of these — this is what lets cashier
-- drive an order through its entire lifecycle now that waiter/chef/rider
-- are gone (see canRoleTransitionOrder's updated ORDER_TRANSITION_ROLES
-- in src/models/OrderModel.ts, changed in the same pass as this migration).
drop policy if exists orders_select_staff on public.orders;
create policy orders_select_staff on public.orders
  for select
  using (
    public.is_owner()
    or (public.current_user_role() in ('cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  );

drop policy if exists orders_insert_staff on public.orders;
create policy orders_insert_staff on public.orders
  for insert
  with check (
    public.is_owner()
    or (public.current_user_role() in ('cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  );

drop policy if exists orders_update_staff on public.orders;
create policy orders_update_staff on public.orders
  for update
  using (
    public.is_owner()
    or (public.current_user_role() in ('cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  )
  with check (
    public.is_owner()
    or (public.current_user_role() in ('cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  );

-- order_items: mirrors orders_select_staff/orders_update_staff's role list exactly.
drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items
  for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          public.is_owner()
          or (public.current_user_role() in ('cashier', 'branch_manager') and o.branch_id = public.current_user_branch_id())
        )
    )
  );

-- Latest version (security_hardening migration) added the customer-own-
-- pending-order branch — preserved here, only the staff role list changes.
drop policy if exists order_items_write on public.order_items;
create policy order_items_write on public.order_items
  for all
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          public.is_owner()
          or (public.current_user_role() in ('cashier', 'branch_manager') and o.branch_id = public.current_user_branch_id())
          or (
            o.status = 'pending'
            and exists (
              select 1 from public.customers c
              where c.id = o.customer_id and c.user_id = auth.uid()
            )
          )
        )
    )
  )
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          public.is_owner()
          or (public.current_user_role() in ('cashier', 'branch_manager') and o.branch_id = public.current_user_branch_id())
          or (
            o.status = 'pending'
            and exists (
              select 1 from public.customers c
              where c.id = o.customer_id and c.user_id = auth.uid()
            )
          )
        )
    )
  );

-- inventory_items: chef dropped, stays branch_manager/owner only.
drop policy if exists inventory_items_select on public.inventory_items;
create policy inventory_items_select on public.inventory_items
  for select
  using (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  );

drop policy if exists inventory_items_update on public.inventory_items;
create policy inventory_items_update on public.inventory_items
  for update
  using (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  )
  with check (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  );

-- ============================================================================
-- 8. Simplify the cashier/manager demo credentials for easy illustration.
-- Owner's credentials are untouched. Same crypt()/gen_salt() pattern
-- already used by seed.sql and the prior staff-reseed migration.
-- ============================================================================
update auth.users set
  email = 'cashier@ypambuzichoma.com',
  encrypted_password = extensions.crypt('cashier123', extensions.gen_salt('bf'))
where email = 'cashier.rubaga@ypambuzichoma.com';

update public.users set
  email = 'cashier@ypambuzichoma.com'
where email = 'cashier.rubaga@ypambuzichoma.com';

update auth.users set
  email = 'manager@ypambuzichoma.com',
  encrypted_password = extensions.crypt('manager123', extensions.gen_salt('bf'))
where email = 'manager.rubaga@ypambuzichoma.com';

update public.users set
  email = 'manager@ypambuzichoma.com'
where email = 'manager.rubaga@ypambuzichoma.com';
