-- ============================================================================
-- Fix: deliveries_select only allowed owner/branch_manager/rider — but
-- deliveries_insert allows waiter/cashier/branch_manager to create one.
-- PostgREST does `INSERT ... RETURNING *` for `Prefer: return=representation`
-- (what every Supabase*Repository.create() in this codebase uses), and
-- Postgres requires the SELECT policy to also pass for that RETURNING
-- clause — so a cashier creating a delivery got "new row violates
-- row-level security policy," even though their INSERT was itself
-- perfectly allowed. Confirmed live: the insert succeeds with
-- Prefer: return=minimal, fails with return=representation.
--
-- Fix: cashier/waiter can now also read deliveries for their own branch,
-- matching who can create them — the same reasoning already applied to
-- every other "creator needs to read back what they made" case in this
-- schema. Also adds the customer-own branch that was missing entirely —
-- this is the path SupabaseOrderService.placeOrder actually uses when a
-- signed-in customer places a delivery order through /order, so it's the
-- single most important case this fixes, not just the staff one found
-- during testing.
-- ============================================================================

drop policy if exists deliveries_select on public.deliveries;

create policy deliveries_select on public.deliveries
  for select
  using (
    public.is_owner()
    or (public.current_user_role() in ('waiter', 'cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
    or (public.current_user_role() = 'rider' and rider_id = auth.uid())
    or exists (
      select 1 from public.orders o
      join public.customers c on c.id = o.customer_id
      where o.id = deliveries.order_id and c.user_id = auth.uid()
    )
  );

-- Clean up the diagnostic functions created while tracking this down —
-- not part of the real schema.
drop function if exists public.debug_rls_context();
drop function if exists public.debug_list_policies(text);
drop function if exists public.debug_delivery_check(uuid);
drop function if exists public.debug_delivery_check_full(uuid, uuid);
