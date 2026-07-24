-- supabase/migrations/20260724070000_guest_checkout.sql
--
-- Removes the login requirement from the customer ordering flow entirely,
-- per explicit user decision: "the customer or anyone apart from staff
-- shouldn't have a login UI — only staff." A customer now just states
-- their name and phone (no email — matches the original pre-Supabase
-- WhatsApp cart's CustomerDetails shape exactly: name, phone,
-- deliveryAddress, specialInstructions) and places the order as a
-- true anonymous visitor, no account created.
--
-- Two schema pieces:
--   1. orders.guest_name / orders.guest_phone — same pattern
--      reservations already uses for guest bookings (guest_name/
--      guest_phone columns there), rather than requiring a customers row
--      (and the RLS complexity of anon writing to a second table) for
--      every walk-up order.
--   2. place_guest_order — a SECURITY DEFINER RPC that does the whole
--      order+order_items(+delivery, +promo usage increment) write in one
--      atomic transaction and returns the created order directly. This
--      deliberately avoids granting `anon` any direct INSERT/SELECT
--      policy on orders/order_items: PostgREST's `insert().select()`
--      requires the SELECT policy to also pass for the row (the same
--      RETURNING-clause gotcha that caused real bugs earlier in this
--      project for authenticated roles), and there is no safe way to
--      write a broad anon SELECT policy on orders without leaking every
--      guest's name/phone/order details to any anonymous visitor who
--      queries the table directly. A SECURITY DEFINER function returns
--      exactly the one row it just created, sidestepping that problem
--      entirely, and — as a side benefit — makes the guest order+items
--      write atomic (the existing authenticated-customer path is two
--      sequential client-side inserts with a compensating delete on
--      failure, an accepted but real non-atomicity gap this doesn't
--      have).
--
-- Price/discount amounts are still trusted from the caller (menu prices
-- are public-readable, so this mirrors the same trust model the existing
-- authenticated ordering flow already uses — not a new gap introduced
-- here, just extended to anonymous callers too).

alter table public.orders add column if not exists guest_name text;
alter table public.orders add column if not exists guest_phone text;

create or replace function public.place_guest_order(
  p_branch_id uuid,
  p_channel public.order_channel,
  p_guest_name text,
  p_guest_phone text,
  p_table_id uuid,
  p_subtotal integer,
  p_delivery_fee integer,
  p_discount_total integer,
  p_total integer,
  p_applied_promotion_id uuid,
  p_notes text,
  p_delivery_zone_id text,
  p_delivery_address text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_delivery_id uuid;
  v_result jsonb;
begin
  if p_guest_name is null or btrim(p_guest_name) = '' then
    raise exception 'guest name is required' using errcode = '22023';
  end if;
  if p_guest_phone is null or btrim(p_guest_phone) = '' then
    raise exception 'guest phone is required' using errcode = '22023';
  end if;
  if p_channel = 'dine_in' then
    raise exception 'dine-in orders require a table and staff assistance, not guest checkout' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'at least one item is required' using errcode = '22023';
  end if;

  insert into public.orders (
    branch_id, customer_id, channel, status, table_id, guest_name, guest_phone,
    subtotal, delivery_fee, discount_total, tax_total, total, applied_promotion_id, notes
  )
  values (
    p_branch_id, null, p_channel, 'pending', p_table_id, btrim(p_guest_name), btrim(p_guest_phone),
    p_subtotal, p_delivery_fee, p_discount_total, 0, p_total, p_applied_promotion_id, p_notes
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.order_items (
      order_id, menu_item_id, name_snapshot, variation_label, unit_price, quantity, special_instructions, subtotal
    )
    values (
      v_order_id,
      nullif(v_item->>'menuItemId', '')::uuid,
      v_item->>'nameSnapshot',
      nullif(v_item->>'variationLabel', ''),
      (v_item->>'unitPrice')::integer,
      (v_item->>'quantity')::integer,
      nullif(v_item->>'specialInstructions', ''),
      (v_item->>'subtotal')::integer
    );
  end loop;

  if p_applied_promotion_id is not null then
    update public.promotions set usage_count = usage_count + 1 where id = p_applied_promotion_id;
  end if;

  if p_channel = 'delivery' then
    insert into public.deliveries (branch_id, order_id, status, delivery_zone_id, fee, address, customer_phone)
    values (p_branch_id, v_order_id, 'unassigned', p_delivery_zone_id, p_delivery_fee, p_delivery_address, btrim(p_guest_phone))
    returning id into v_delivery_id;

    update public.orders set delivery_id = v_delivery_id where id = v_order_id;
  end if;

  select jsonb_build_object(
    'id', o.id,
    'orderNumber', o.order_number,
    'branchId', o.branch_id,
    'channel', o.channel,
    'status', o.status,
    'guestName', o.guest_name,
    'guestPhone', o.guest_phone,
    'subtotal', o.subtotal,
    'deliveryFee', o.delivery_fee,
    'discountTotal', o.discount_total,
    'taxTotal', o.tax_total,
    'total', o.total,
    'createdAt', o.created_at,
    'updatedAt', o.updated_at
  )
  into v_result
  from public.orders o
  where o.id = v_order_id;

  return v_result;
end;
$$;

grant execute on function public.place_guest_order(
  uuid, public.order_channel, text, text, uuid, integer, integer, integer, integer, uuid, text, text, text, jsonb
) to anon, authenticated;
