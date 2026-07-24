-- supabase/migrations/20260725010000_payment_gate_and_guest_checkout_payment.sql
--
-- "Pay first" checkout, per explicit owner decision: a guest now chooses
-- a payment method and confirms payment as part of checkout, and the
-- order cannot be accepted (which is what auto-creates its kitchen
-- ticket — see 20260723050000_kitchen_ticket_auto_creation.sql) until a
-- cashier has confirmed that payment as actually paid. Applies to both
-- pickup and delivery, no exception — dine_in is out of scope entirely
-- (place_guest_order already rejects it, and it has no creation path
-- built yet).
--
-- Two pieces:
--   1. place_guest_order gains a payment method param and now inserts a
--      'pending' payments row atomically alongside the order — the
--      existing "Mark As Paid" flow in OrdersDashboard.tsx becomes the
--      confirmation step, unchanged code, just now gating something.
--   2. A new BEFORE UPDATE trigger blocks the transition to 'accepted'
--      outright (raises, aborting the transaction) unless a 'paid'
--      payment row exists — this must run BEFORE, not AFTER, so it can
--      abort before on_order_accepted's AFTER trigger ever creates a
--      kitchen ticket for an unpaid order.

-- A trailing new parameter makes this a distinct signature, not a
-- same-OID replace — without dropping the old 14-arg overload,
-- PostgREST could still resolve calls to the old version, which
-- silently skips the payments insert below and defeats the whole
-- payment gate. Drop it explicitly.
drop function if exists public.place_guest_order(
  uuid, public.order_channel, text, text, uuid, integer, integer, integer, integer, uuid, text, text, text, jsonb
);

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
  p_items jsonb,
  p_payment_method public.payment_method default 'mobile_money'
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

  insert into public.payments (branch_id, order_id, method, status, amount, currency)
  values (p_branch_id, v_order_id, p_payment_method, 'pending', p_total, 'UGX');

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
  uuid, public.order_channel, text, text, uuid, integer, integer, integer, integer, uuid, text, text, text, jsonb, public.payment_method
) to anon, authenticated;

create or replace function public.enforce_payment_before_accept()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' and new.channel in ('pickup', 'delivery') then
    if not exists (select 1 from public.payments p where p.order_id = new.id and p.status = 'paid') then
      raise exception 'order cannot be accepted until payment has been confirmed as paid' using errcode = '22023';
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_payment_before_order_accepted
  before update on public.orders
  for each row execute function public.enforce_payment_before_accept();
