-- ============================================================================
-- Gap fixes flagged in the Milestone 2 report, before Milestone 3 starts.
-- ============================================================================
-- 1. Links customers to auth.users (customers.user_id) so "is this my
--    order/reservation/loyalty account" can finally be expressed in RLS for
--    an authenticated customer — the real blocker behind departure #3 in
--    the prior migration.
-- 2. Extends handle_new_user() to also provision a linked customers row
--    whenever a new signup's role is 'customer'.
-- 3. Adds the customer-linked RLS policies that were impossible without #1.
-- 4. Adds a branch_manager read policy on their own branch, matching the
--    grant added to lib/rbac.ts's branch_manager permissions alongside
--    this migration (branches was owner-only before, a literal but
--    impractical mirror of the prior rbac.ts).

alter table public.customers
  add column user_id uuid references auth.users (id) on delete set null;

create unique index customers_user_id_key on public.customers (user_id) where user_id is not null;

-- ----------------------------------------------------------------------------
-- handle_new_user(): now also creates a linked customers row for a new
-- 'customer'-role signup (the default role), so a freshly authenticated
-- customer immediately has both a public.users row and a public.customers
-- row without any extra client-side step.
-- ----------------------------------------------------------------------------
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
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- customers: self-access for the linked auth user, alongside the existing
-- staff policies (customers_select / customers_insert / customers_update /
-- customers_delete_owner) from the prior migration.
-- ----------------------------------------------------------------------------
create policy customers_select_self on public.customers
  for select
  using (user_id = auth.uid());

create policy customers_update_self on public.customers
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- orders: a customer may read/cancel their own orders, and create one
-- attributed to their own linked customer row (not just a null/guest one,
-- which orders_insert_customer_guest from the prior migration already
-- covers).
-- ----------------------------------------------------------------------------
create policy orders_select_customer_own on public.orders
  for select
  using (
    exists (
      select 1 from public.customers c
      where c.id = orders.customer_id and c.user_id = auth.uid()
    )
  );

create policy orders_insert_customer_own on public.orders
  for insert
  with check (
    public.current_user_role() = 'customer'
    and customer_id is not null
    and exists (select 1 from public.customers c where c.id = orders.customer_id and c.user_id = auth.uid())
  );

-- A customer's own update is restricted to cancelling — the row must
-- already belong to them (USING) and must end up cancelled (WITH CHECK).
-- Staff's own orders_update_staff policy (prior migration) is unaffected;
-- Postgres OR's permissive policies together, so staff keep their broader
-- update rights via that separate policy.
create policy orders_update_customer_own on public.orders
  for update
  using (
    exists (select 1 from public.customers c where c.id = orders.customer_id and c.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.customers c where c.id = orders.customer_id and c.user_id = auth.uid())
    and status = 'cancelled'
  );

-- ----------------------------------------------------------------------------
-- reservations: same pattern as orders.
-- ----------------------------------------------------------------------------
create policy reservations_select_customer_own on public.reservations
  for select
  using (
    exists (select 1 from public.customers c where c.id = reservations.customer_id and c.user_id = auth.uid())
  );

create policy reservations_insert_customer_own on public.reservations
  for insert
  with check (
    public.current_user_role() = 'customer'
    and customer_id is not null
    and exists (select 1 from public.customers c where c.id = reservations.customer_id and c.user_id = auth.uid())
  );

create policy reservations_update_customer_own on public.reservations
  for update
  using (
    exists (select 1 from public.customers c where c.id = reservations.customer_id and c.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.customers c where c.id = reservations.customer_id and c.user_id = auth.uid())
    and status = 'cancelled'
  );

-- ----------------------------------------------------------------------------
-- loyalty_members: a customer may read their own membership.
-- ----------------------------------------------------------------------------
create policy loyalty_members_select_customer_own on public.loyalty_members
  for select
  using (
    exists (select 1 from public.customers c where c.id = loyalty_members.customer_id and c.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- branches: branch_manager may read their own branch.
-- ----------------------------------------------------------------------------
create policy branches_select_own_branch on public.branches
  for select
  using (
    public.current_user_role() = 'branch_manager' and id = public.current_user_branch_id()
  );
