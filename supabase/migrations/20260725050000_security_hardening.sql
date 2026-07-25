-- supabase/migrations/20260725050000_security_hardening.sql
--
-- Fixes from a full security audit: two privilege-escalation paths (a
-- self-signup could mint its own 'owner' account; a branch_manager could
-- promote itself to owner), unverified order pricing (an anonymous guest
-- checkout call could set its own total), a delivery-insert policy that
-- matched any guest order rather than just the caller's own, an
-- unauthenticated promo-usage-count bump, and a missing order-status
-- guard on customer order_item writes.

-- ============================================================================
-- 1. Staff role escalation via signup metadata.
--
-- handle_new_user() previously read role/status/branch_id straight off
-- raw_user_meta_data — the same field Supabase's public signup endpoint
-- (anon key, already in the browser bundle) lets any caller set via
-- options.data, and the same field invite-staff's inviteUserByEmail call
-- also happened to write to. Nothing distinguished "the trusted invite
-- flow set this" from "a visitor typed this into a signup call". Fix:
-- self-signup always becomes a plain customer; a real role can only be
-- granted afterward via raw_app_meta_data, which only the service-role
-- admin API (i.e. invite-staff) can ever write.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
begin
  v_phone := coalesce(nullif(new.raw_user_meta_data ->> 'phone', ''), new.phone, '');

  insert into public.users (id, full_name, email, phone, role, branch_id, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    v_phone,
    'customer',
    null,
    'active'
  )
  on conflict (id) do nothing;

  insert into public.customers (user_id, full_name, phone, email, marketing_opt_in)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    v_phone,
    new.email,
    false
  )
  on conflict (user_id) where user_id is not null do nothing;

  return new;
end;
$$;

-- Companion half: a real staff role is granted by updating app_metadata
-- (only the admin API can do this), never by the insert above.
create or replace function public.handle_user_app_metadata_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.role_name;
  v_status public.user_status;
  v_branch_id uuid;
begin
  if new.raw_app_meta_data ? 'role' then
    v_role := (new.raw_app_meta_data ->> 'role')::public.role_name;
    v_status := coalesce((new.raw_app_meta_data ->> 'status')::public.user_status, 'invited');
    v_branch_id := nullif(new.raw_app_meta_data ->> 'branch_id', '')::uuid;

    update public.users
    set role = v_role,
        status = v_status,
        branch_id = v_branch_id
    where id = new.id;

    -- handle_new_user() always inserts a customers row first (role is
    -- unknown at that point) — remove it once we learn this signup is
    -- actually staff.
    if v_role <> 'customer' then
      delete from public.customers where user_id = new.id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_app_metadata_updated on auth.users;
create trigger on_auth_user_app_metadata_updated
  after update on auth.users
  for each row
  when (new.raw_app_meta_data is distinct from old.raw_app_meta_data)
  execute function public.handle_user_app_metadata_update();

-- ============================================================================
-- 2. A branch_manager could promote itself (or anyone in its branch) to
-- owner. users_update_branch_manager's RLS only checked which ROW was
-- being touched (same branch), never which COLUMN — role is just another
-- column. RLS can't express column-level rules on its own, so this is a
-- trigger: any change to role/branch_id/status requires the caller to
-- already be an owner, regardless of which policy let the UPDATE through.
-- ============================================================================

create or replace function public.prevent_unauthorized_user_privilege_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role
      or new.branch_id is distinct from old.branch_id
      or new.status is distinct from old.status)
     and not public.is_owner() then
    raise exception 'Only an owner can change role, branch, or status.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_unauthorized_user_privilege_change on public.users;
create trigger prevent_unauthorized_user_privilege_change
  before update on public.users
  for each row execute function public.prevent_unauthorized_user_privilege_change();

-- ============================================================================
-- 3. Order pricing was fully client-trusted: place_guest_order (anon-
-- callable) inserted whatever unitPrice/subtotal/total the caller sent,
-- with no lookup against real menu_items prices. Fix: order_items now
-- has its own price re-derived from menu_items/variations on every
-- insert or update, regardless of what was sent, and orders.subtotal/
-- total are recomputed from the real order_items whenever they change —
-- covering both place_guest_order AND the authenticated placeOrder path
-- (a direct client insert), with one mechanism instead of two.
-- ============================================================================

create or replace function public.recompute_order_item_price()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_menu_item public.menu_items;
  v_variation jsonb;
begin
  select * into v_menu_item from public.menu_items where id = new.menu_item_id;
  if v_menu_item.id is null then
    raise exception 'menu item does not exist' using errcode = '22023';
  end if;

  new.name_snapshot := v_menu_item.name;
  new.unit_price := v_menu_item.base_price;

  if new.variation_label is not null then
    select value into v_variation
    from jsonb_array_elements(v_menu_item.variations)
    where value ->> 'label' = new.variation_label
    limit 1;

    if v_variation is null then
      raise exception 'variation "%" does not exist for menu item %', new.variation_label, v_menu_item.name using errcode = '22023';
    end if;
    new.unit_price := (v_variation ->> 'price')::integer;
  end if;

  new.subtotal := new.unit_price * new.quantity;
  return new;
end;
$$;

drop trigger if exists recompute_order_item_price on public.order_items;
create trigger recompute_order_item_price
  before insert or update on public.order_items
  for each row execute function public.recompute_order_item_price();

create or replace function public.recompute_order_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_subtotal integer;
begin
  v_order_id := coalesce(new.order_id, old.order_id);

  select coalesce(sum(subtotal), 0) into v_subtotal
  from public.order_items
  where order_id = v_order_id;

  update public.orders
  set subtotal = v_subtotal,
      total = greatest(v_subtotal - discount_total, 0) + delivery_fee
  where id = v_order_id;

  return null;
end;
$$;

drop trigger if exists recompute_order_totals_on_item_change on public.order_items;
create trigger recompute_order_totals_on_item_change
  after insert or update or delete on public.order_items
  for each row execute function public.recompute_order_totals();

-- Belt-and-suspenders: even if a discount_total or delivery_fee value
-- makes it onto an order row from somewhere other than place_guest_order
-- (e.g. the authenticated placeOrder path's direct insert), it can never
-- exceed the real subtotal, or an implausible delivery fee.
alter table public.orders
  add constraint orders_discount_not_exceeding_subtotal check (discount_total <= subtotal);
alter table public.orders
  add constraint orders_delivery_fee_bounded check (delivery_fee <= 100000);

-- place_guest_order itself: still receives client-computed values (kept
-- for backward compatibility with the existing caller shape) but no
-- longer trusts any of them for money — item prices are re-derived by
-- the trigger above, subtotal/total follow from that, and discount is
-- re-validated against the real promotions row. Delivery fee is the one
-- exception: real routed distance needs an external HTTP call this
-- database can't make synchronously, so it's bounded rather than fully
-- re-verified (see calculate-delivery-fee's own rate limiting instead).
drop function if exists public.place_guest_order(
  uuid, public.order_channel, text, text, uuid, integer, integer, integer, integer, uuid, text, text, text, jsonb, public.payment_method
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
  v_delivery_fee integer;
  v_promotion public.promotions;
  v_discount_total integer := 0;
  v_subtotal integer;
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

  v_delivery_fee := greatest(least(coalesce(p_delivery_fee, 0), 100000), 0);

  insert into public.orders (
    branch_id, customer_id, channel, status, table_id, guest_name, guest_phone,
    subtotal, delivery_fee, discount_total, tax_total, total, applied_promotion_id, notes
  )
  values (
    p_branch_id, null, p_channel, 'pending', p_table_id, btrim(p_guest_name), btrim(p_guest_phone),
    0, v_delivery_fee, 0, 0, 0, p_applied_promotion_id, p_notes
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
    -- unit_price/subtotal/name_snapshot above are overwritten by
    -- recompute_order_item_price from the real menu_items row — what's
    -- sent here is a starting point, never the stored value.
  end loop;

  select subtotal into v_subtotal from public.orders where id = v_order_id;

  if p_applied_promotion_id is not null then
    select * into v_promotion
    from public.promotions
    where id = p_applied_promotion_id
      and branch_id = p_branch_id
      and is_active = true
      and now() >= starts_at and now() <= ends_at
      and (usage_limit is null or usage_count < usage_limit)
      and (min_order_value is null or v_subtotal >= min_order_value);

    if v_promotion.id is not null then
      if v_promotion.type = 'percentage_discount' then
        v_discount_total := round(v_subtotal * (v_promotion.value / 100));
      elsif v_promotion.type = 'fixed_discount' then
        v_discount_total := v_promotion.value::integer;
      elsif v_promotion.type = 'free_delivery' then
        v_delivery_fee := 0;
      else
        -- bogo: which item is free is a display-only computation done
        -- client-side; accepted here but clamped below so it can never
        -- exceed what's mathematically safe.
        v_discount_total := coalesce(p_discount_total, 0);
      end if;

      v_discount_total := greatest(least(v_discount_total, v_subtotal), 0);
      update public.promotions set usage_count = usage_count + 1 where id = v_promotion.id;
    end if;
  end if;

  update public.orders
  set discount_total = v_discount_total,
      delivery_fee = v_delivery_fee,
      total = greatest(v_subtotal - v_discount_total, 0) + v_delivery_fee
  where id = v_order_id;

  if p_channel = 'delivery' then
    insert into public.deliveries (branch_id, order_id, status, delivery_zone_id, fee, address, customer_phone)
    values (p_branch_id, v_order_id, 'unassigned', p_delivery_zone_id, v_delivery_fee, p_delivery_address, btrim(p_guest_phone))
    returning id into v_delivery_id;

    update public.orders set delivery_id = v_delivery_id where id = v_order_id;
  end if;

  insert into public.payments (branch_id, order_id, method, status, amount, currency)
  select o.branch_id, o.id, p_payment_method, 'pending', o.total, 'UGX'
  from public.orders o where o.id = v_order_id;

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

-- ============================================================================
-- 4. increment_promotion_usage had no validity check at all — anyone
-- could spam-inflate any promo's usage_count with no order involved.
-- ============================================================================

create or replace function public.increment_promotion_usage(promo_id uuid)
returns public.promotions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_promotion public.promotions;
begin
  update public.promotions
  set usage_count = usage_count + 1
  where id = promo_id
    and is_active = true
    and now() >= starts_at and now() <= ends_at
    and (usage_limit is null or usage_count < usage_limit)
  returning * into v_promotion;

  if v_promotion.id is null then
    raise exception 'promotion is not currently valid' using errcode = '22023';
  end if;

  return v_promotion;
end;
$$;

-- ============================================================================
-- 5. order_items_write let a customer edit/delete their own order's line
-- items (including price fields, before fix #3 above) with no check on
-- the order's status — so even a legitimately-priced order could be
-- edited after the kitchen accepted it. Scoped to 'pending' only.
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
          or (public.current_user_role() in ('waiter', 'cashier', 'branch_manager') and o.branch_id = public.current_user_branch_id())
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

-- ============================================================================
-- 6. deliveries_insert's guest branch matched "o.customer_id is null"
-- i.e. ANY guest order, not just one the caller placed — a direct REST
-- call (bypassing the app) with a guessed/known order id could attach or
-- alter another guest's delivery row. place_guest_order already creates
-- deliveries itself (SECURITY DEFINER, bypasses RLS) so this policy's
-- guest branch was never actually needed by the app — narrowed to real
-- ownership only.
-- ============================================================================

drop policy if exists deliveries_insert on public.deliveries;

create policy deliveries_insert on public.deliveries
  for insert
  with check (
    public.is_owner()
    or (public.current_user_role() in ('waiter', 'cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
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
-- 7. Lightweight DB-backed rate limiter for the two anonymously-callable,
-- externally-billed Edge Functions (ai-concierge -> Gemini, calculate-
-- delivery-fee -> OpenRouteService) — neither had any abuse protection,
-- so a scripted caller could burn through either free-tier quota and
-- deny the feature to real customers. Keyed by (bucket, client ip,
-- one-minute window); checked/incremented atomically per call.
-- ============================================================================

create table public.rate_limit_events (
  bucket text not null,
  client_key text not null,
  window_start timestamptz not null,
  request_count integer not null default 1,
  primary key (bucket, client_key, window_start)
);

alter table public.rate_limit_events enable row level security;
-- No policies: this table is only ever touched via the SECURITY DEFINER
-- function below, which bypasses RLS — anon/authenticated get no direct
-- grant on it at all.

create or replace function public.check_rate_limit(p_bucket text, p_client_key text, p_max_per_minute integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz := date_trunc('minute', now());
  v_count integer;
begin
  insert into public.rate_limit_events (bucket, client_key, window_start, request_count)
  values (p_bucket, p_client_key, v_window, 1)
  on conflict (bucket, client_key, window_start)
  do update set request_count = rate_limit_events.request_count + 1
  returning request_count into v_count;

  if random() < 0.01 then
    delete from public.rate_limit_events where window_start < now() - interval '10 minutes';
  end if;

  return v_count <= p_max_per_minute;
end;
$$;

grant execute on function public.check_rate_limit(text, text, integer) to anon, authenticated;
