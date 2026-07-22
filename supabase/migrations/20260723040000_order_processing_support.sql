-- ============================================================================
-- Order processing support: order_number generation + realtime.
-- ============================================================================
-- orders.order_number is NOT NULL UNIQUE with no way for a client to supply
-- a collision-free value itself — generating it in the database (not the
-- app) is what actually guarantees uniqueness under concurrent inserts.
-- Format: "YPA-{first 3 letters of the branch slug, uppercased}-{6-digit
-- sequence}" — e.g. "YPA-RUB-000001". A single shared sequence (not one
-- per branch) keeps this migration simple; the numeric part isn't meant to
-- be a per-branch running count, just a collision-free suffix.

create sequence public.orders_order_number_seq;

create or replace function public.generate_order_number()
returns trigger
language plpgsql
as $$
declare
  v_branch_code text;
begin
  if new.order_number is null or new.order_number = '' then
    select upper(left(slug, 3)) into v_branch_code from public.branches where id = new.branch_id;
    new.order_number := 'YPA-' || coalesce(v_branch_code, 'GEN') || '-'
      || lpad(nextval('public.orders_order_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create trigger set_order_number before insert on public.orders
  for each row execute function public.generate_order_number();

-- ----------------------------------------------------------------------------
-- Realtime: repositories/OrderRepository.ts's `subscribe()` method (part of
-- the existing architecture, not new scope) needs the orders table in the
-- Realtime publication to receive postgres_changes events at all.
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table public.orders;
