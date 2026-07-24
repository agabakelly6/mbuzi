-- ============================================================================
-- Fix: order_items_write only allowed staff (waiter/cashier/branch_manager)
-- or owner to write order_items — there was no branch for a customer
-- writing items to their OWN order at all. This meant the actual /order
-- checkout flow (SupabaseOrderRepository.create, called by every real
-- customer placing an order) would fail at the order_items insert step
-- every single time. Confirmed live: a customer could create the parent
-- `orders` row (orders_insert_customer_own covers that) but not a single
-- `order_items` row under it.
--
-- This is the same class of bug as the deliveries_select gap found
-- earlier — a table's RLS only covering the staff side of a feature that
-- customers also use directly.
-- ============================================================================

drop policy if exists order_items_write on public.order_items;

create policy order_items_write on public.order_items
  for all
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          public.is_owner()
          or (public.current_user_role() in ('waiter', 'cashier', 'branch_manager') and o.branch_id = public.current_user_branch_id())
          or exists (
            select 1 from public.customers c
            where c.id = o.customer_id and c.user_id = auth.uid()
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
          or (public.current_user_role() in ('waiter', 'cashier', 'branch_manager') and o.branch_id = public.current_user_branch_id())
          or exists (
            select 1 from public.customers c
            where c.id = o.customer_id and c.user_id = auth.uid()
          )
        )
    )
  );
