-- supabase/migrations/20260724080000_guest_order_status_lookup.sql
--
-- Powers the live order-status tracker on the guest confirmation page.
-- Same capability-token pattern as place_guest_order: anon has zero SELECT
-- access to orders (deliberate — see the guest_checkout migration), so
-- this SECURITY DEFINER function is the only way to read one back, and it
-- requires the caller to know BOTH the exact order id AND the exact phone
-- number that placed it — knowing the id alone isn't enough, which stops
-- someone from just guessing/iterating ids to peek at other guests'
-- orders. The confirmation page already has both values in memory right
-- after checkout (place_guest_order's own response includes guestPhone),
-- so nothing new is asked of the customer.
create or replace function public.get_guest_order_status(
  p_order_id uuid,
  p_guest_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'id', o.id,
    'orderNumber', o.order_number,
    'status', o.status,
    'channel', o.channel,
    'total', o.total,
    'updatedAt', o.updated_at
  )
  into v_result
  from public.orders o
  where o.id = p_order_id
    and o.guest_phone = btrim(p_guest_phone);

  return v_result;
end;
$$;

grant execute on function public.get_guest_order_status(uuid, text) to anon, authenticated;
