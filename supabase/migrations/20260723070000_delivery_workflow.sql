-- ============================================================================
-- Delivery workflow support.
-- ============================================================================
-- Fixes a real gap found while building this: the first migration gave
-- `deliveries` a SELECT and an UPDATE policy but never an INSERT one —
-- meaning nobody, not even owner, could actually create a delivery row.
-- Unlike kitchen_tickets (auto-created by a trigger, no extra input
-- needed), a Delivery needs data no order-status trigger has access to
-- (delivery zone, fee, address, contact phone) — it's created explicitly
-- by SupabaseOrderService.placeOrder right after the order itself, so the
-- INSERT policy mirrors the same actors who could have created that order
-- in the first place: branch staff for their branch, or a customer for
-- their own (or guest) order.

create policy deliveries_insert on public.deliveries
  for insert
  with check (
    public.is_owner()
    or (public.current_user_role() in ('waiter', 'cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
    or (
      public.current_user_role() = 'customer'
      and exists (
        select 1 from public.orders o
        left join public.customers c on c.id = o.customer_id
        where o.id = deliveries.order_id
          and (o.customer_id is null or c.user_id = auth.uid())
      )
    )
  );

alter publication supabase_realtime add table public.deliveries;
