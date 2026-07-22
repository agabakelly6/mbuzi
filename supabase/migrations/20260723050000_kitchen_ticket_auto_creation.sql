-- ============================================================================
-- Kitchen ticket auto-creation.
-- ============================================================================
-- kitchen_tickets has no non-owner INSERT policy (see its RLS comment in
-- the first migration: creation was always meant to go through a "trusted
-- server-side path"). This project has no server runtime at all (static
-- output, browser-only Supabase client) — there is no such path on the
-- client side. Rather than loosening kitchen_tickets' RLS to let
-- waiter/cashier/branch_manager insert directly (which rbac.ts doesn't
-- grant them either — `kitchen_ticket` has no "create" permission for
-- anyone but owner), a ticket is generated automatically, atomically, by
-- the database itself the moment an order's status becomes 'accepted'.
-- SupabaseKitchenService.createTicketForOrder becomes a lookup of what
-- this trigger already created, not a real insert path for most callers.

create or replace function public.create_kitchen_ticket_on_order_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    insert into public.kitchen_tickets (branch_id, order_id, items, status, fired_at)
    select
      new.branch_id,
      new.id,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'orderItemId', oi.id,
            'nameSnapshot', oi.name_snapshot,
            'quantity', oi.quantity,
            'specialInstructions', oi.special_instructions,
            'status', 'queued'
          )
        ),
        '[]'::jsonb
      ),
      'queued',
      now()
    from public.order_items oi
    where oi.order_id = new.id
    on conflict (order_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_order_accepted
  after update on public.orders
  for each row execute function public.create_kitchen_ticket_on_order_accepted();

alter publication supabase_realtime add table public.kitchen_tickets;
