-- ============================================================================
-- Milestone 2: Production Database Architecture
-- ============================================================================
-- One logical migration, ordered so every foreign key resolves without
-- forward references except four genuinely circular relationships
-- (branches<->users, restaurant_tables<->orders, orders<->deliveries,
-- customers<->loyalty_members), each patched with an ALTER TABLE right
-- after both sides exist — clearly marked below.
--
-- Every table, column, enum, and constraint here is a direct translation
-- of an existing Phase 2 TypeScript type (src/types/*.ts) and the RBAC
-- matrix (src/lib/rbac.ts) — nothing here invents a new domain concept.
-- Where a column has no TS equivalent (id, created_at, updated_at on
-- Entity/BranchEntity), it mirrors src/types/base.ts directly.
--
-- Naming: `restaurant_tables` (not `tables`) matches the milestone brief
-- exactly and avoids any ambiguity with the SQL keyword.

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Enum types — one per TS union type, values copied verbatim
-- ----------------------------------------------------------------------------
create type public.role_name as enum (
  'customer', 'waiter', 'cashier', 'chef', 'rider', 'branch_manager', 'owner'
);

create type public.user_status as enum ('active', 'invited', 'suspended', 'deactivated');

create type public.branch_status as enum ('active', 'coming-soon', 'suspended', 'closed');

create type public.menu_item_availability as enum ('available', 'out_of_stock', 'hidden');

create type public.order_channel as enum ('dine_in', 'pickup', 'delivery', 'whatsapp');

create type public.order_status as enum (
  'pending', 'accepted', 'preparing', 'ready', 'served',
  'out_for_delivery', 'delivered', 'completed', 'cancelled', 'rejected'
);

create type public.payment_method as enum ('cash', 'mobile_money', 'card', 'bank_transfer');

create type public.payment_status as enum (
  'pending', 'authorized', 'paid', 'failed', 'partially_refunded', 'refunded', 'voided'
);

create type public.delivery_status as enum (
  'unassigned', 'assigned', 'picked_up', 'en_route', 'delivered', 'failed', 'cancelled'
);

create type public.table_status as enum (
  'available', 'occupied', 'reserved', 'needs_cleaning', 'out_of_service'
);

create type public.reservation_status as enum (
  'requested', 'confirmed', 'seated', 'completed', 'no_show', 'cancelled'
);

create type public.kitchen_ticket_status as enum ('queued', 'in_progress', 'ready', 'served', 'cancelled');

create type public.notification_type as enum (
  'order_placed', 'order_status_changed', 'reservation_confirmed',
  'delivery_assigned', 'payment_received', 'low_stock', 'system'
);

create type public.notification_channel as enum ('in_app', 'sms', 'whatsapp', 'email', 'push');

create type public.promotion_type as enum ('percentage_discount', 'fixed_discount', 'bogo', 'free_delivery');

create type public.loyalty_tier as enum ('bronze', 'silver', 'gold', 'platinum');

create type public.inventory_unit as enum ('kg', 'litre', 'piece', 'pack');

-- ----------------------------------------------------------------------------
-- Shared trigger: keep updated_at current on every table that has one
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- branches — types/branch.ts's Branch
-- ----------------------------------------------------------------------------
create table public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Matches Location["id"] in types/location.ts (e.g. "rubaga") — the join
  -- key between the marketing site's static content and this operational row.
  slug text not null unique,
  city text not null,
  address text not null,
  phone text not null default '',
  whatsapp text not null default '',
  email text not null default '',
  status public.branch_status not null default 'coming-soon',
  -- References users(id); added below via ALTER TABLE once users exists
  -- (branches <-> users is genuinely circular: a branch has a manager, a
  -- manager belongs to a branch).
  manager_id uuid,
  -- BranchSettings {timezone, currency, orderingEnabled, deliveryEnabled,
  -- reservationsEnabled, taxRatePercent} — small, always-loaded-with-the-row
  -- config, not one of the milestone's 16 named tables, so it stays JSONB
  -- rather than inventing a 17th table for it.
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.branches is 'Operational branch record — see types/branch.ts. Distinct from the marketing site''s static Location content.';

-- ----------------------------------------------------------------------------
-- users — types/user.ts's User, a 1:1 profile extension of auth.users
-- ----------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text not null default '',
  role public.role_name not null default 'customer',
  branch_id uuid references public.branches (id) on delete set null,
  status public.user_status not null default 'active',
  avatar_url text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Mirrors the type comment on User.branchId exactly: required for every
  -- branch-scoped staff role, null only for owner (platform-wide) and
  -- customer (not branch staff).
  constraint users_branch_required_for_staff check (
    role in ('owner', 'customer') or branch_id is not null
  )
);

comment on table public.users is 'Staff + authenticated-customer profile — see types/user.ts. One row per auth.users row.';

alter table public.branches
  add constraint branches_manager_id_fkey
  foreign key (manager_id) references public.users (id) on delete set null;

create trigger set_updated_at before update on public.branches
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.users
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RBAC helper functions — the single place "who is asking" is resolved,
-- so every RLS policy below reads the same way lib/rbac.ts's `can()` does.
-- SECURITY DEFINER + a fixed search_path so they can read public.users
-- regardless of the calling role's own RLS grants (avoiding recursive
-- RLS evaluation when a users-table policy would otherwise need to query
-- users itself).
-- ----------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.role_name
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.current_user_branch_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select branch_id from public.users where id = auth.uid();
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
as $$
  select public.current_user_role() = 'owner';
$$;

-- ----------------------------------------------------------------------------
-- New Supabase Auth signups get a matching public.users row automatically,
-- read from auth signup metadata (full_name/role/branch_id) — the same
-- metadata contract src/lib/supabase/mapSupabaseUser.ts (Milestone 1)
-- already reads. Role defaults to 'customer' when unset, matching that
-- file's documented default.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, email, phone, role, branch_id, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    coalesce(new.phone, ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.role_name, 'customer'),
    nullif(new.raw_user_meta_data ->> 'branch_id', '')::uuid,
    'active'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- customers — types/customer.ts's Customer
-- Deliberately NOT linked to auth.users: a Customer can exist with zero
-- authentication (an anonymous WhatsApp order captures name/phone only),
-- exactly as that type's header comment describes. See the RLS section's
-- notes on the resulting "own resource" limitation for authenticated
-- customers — that gap is real and documented there, not fixed here.
-- ----------------------------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  default_delivery_address text,
  preferred_branch_id uuid references public.branches (id) on delete set null,
  -- References loyalty_members(id); added below once that table exists
  -- (customers <-> loyalty_members is circular).
  loyalty_member_id uuid,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index customers_phone_key on public.customers (phone) where phone <> '';

create trigger set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- menu_categories — types/menu-item.ts's MenuCategoryRecord
-- ----------------------------------------------------------------------------
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  -- null = shared across every branch's catalog, matching the type's own comment.
  branch_id uuid references public.branches (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (branch_id, name)
);

create trigger set_updated_at before update on public.menu_categories
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- inventory_items — types/inventory.ts's InventoryItem (placeholder-level,
-- as that file's own header comment says; created ahead of menu_items so
-- MenuItem.linkedInventoryItemId needs no forward-reference patch).
-- ----------------------------------------------------------------------------
create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  name text not null,
  unit public.inventory_unit not null,
  quantity_on_hand numeric(12, 3) not null default 0 check (quantity_on_hand >= 0),
  reorder_threshold numeric(12, 3) not null default 0 check (reorder_threshold >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (branch_id, name)
);

create trigger set_updated_at before update on public.inventory_items
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- menu_items — types/menu-item.ts's MenuItem
-- ----------------------------------------------------------------------------
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  name text not null,
  description text not null default '',
  category_id uuid not null references public.menu_categories (id) on delete restrict,
  base_price integer not null check (base_price >= 0),
  -- MenuItemVariation[] — {id, label, price}, always loaded with the item,
  -- never queried independently, so JSONB rather than a 17th table.
  variations jsonb not null default '[]'::jsonb,
  image_url text not null default '',
  availability public.menu_item_availability not null default 'available',
  is_featured boolean not null default false,
  is_chef_pick boolean not null default false,
  linked_inventory_item_id uuid references public.inventory_items (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.menu_items
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- restaurant_tables — types/table.ts's Table
-- ----------------------------------------------------------------------------
create table public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  label text not null,
  seats integer not null check (seats > 0),
  status public.table_status not null default 'available',
  -- References orders(id); added below once orders exists (circular:
  -- an order can name its table, a table can name its current order).
  current_order_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (branch_id, label)
);

create trigger set_updated_at before update on public.restaurant_tables
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- promotions — types/promotion.ts's Promotion (created ahead of orders so
-- Order.appliedPromotionId needs no forward-reference patch)
-- ----------------------------------------------------------------------------
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  code text not null,
  name text not null,
  type public.promotion_type not null,
  -- Meaning depends on `type`: a percentage (0-100, may have decimals) or a
  -- fixed UGX amount — numeric(12,2) covers both without over-constraining.
  value numeric(12, 2) not null check (value >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  min_order_value integer check (min_order_value >= 0),
  usage_limit integer check (usage_limit > 0),
  usage_count integer not null default 0 check (usage_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (branch_id, code),
  check (ends_at > starts_at)
);

create trigger set_updated_at before update on public.promotions
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- reservations — types/reservation.ts's Reservation
-- ----------------------------------------------------------------------------
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete restrict,
  -- Null for a guest reservation made without an account (phone/name
  -- captured directly), matching the type's own comment exactly.
  customer_id uuid references public.customers (id) on delete set null,
  guest_name text not null,
  guest_phone text not null,
  party_size integer not null check (party_size > 0),
  reserved_for timestamptz not null,
  table_id uuid references public.restaurant_tables (id) on delete set null,
  status public.reservation_status not null default 'requested',
  special_requests text,
  confirmed_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.reservations
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- orders — types/order.ts's Order
-- ----------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  -- RESTRICT, not CASCADE: a branch with order history is financial record
  -- data and must never disappear silently because the branch row was removed.
  branch_id uuid not null references public.branches (id) on delete restrict,
  order_number text not null unique,
  -- Null for an anonymous/WhatsApp order not yet linked to an account,
  -- matching the type's own comment exactly.
  customer_id uuid references public.customers (id) on delete set null,
  channel public.order_channel not null,
  status public.order_status not null default 'pending',
  table_id uuid references public.restaurant_tables (id) on delete set null,
  -- References deliveries(id); added below once deliveries exists (circular:
  -- an order can name its delivery, a delivery always names its order).
  delivery_id uuid,
  subtotal integer not null default 0 check (subtotal >= 0),
  delivery_fee integer not null default 0 check (delivery_fee >= 0),
  discount_total integer not null default 0 check (discount_total >= 0),
  tax_total integer not null default 0 check (tax_total >= 0),
  total integer not null default 0 check (total >= 0),
  applied_promotion_id uuid references public.promotions (id) on delete set null,
  placed_by_user_id uuid references public.users (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Mirrors validators/order.schema.ts's createOrderInputSchema refine rule
  -- exactly: a dine_in order must name its table.
  check (channel <> 'dine_in' or table_id is not null)
);

create trigger set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- order_items — types/order.ts's OrderItem (note: that TS interface has no
-- updatedAt field — it doesn't extend Entity — so this table has no
-- updated_at/trigger either; a line item is written once and never edited
-- in place).
-- ----------------------------------------------------------------------------
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  -- Kept even if the menu item is later deleted — name_snapshot preserves
  -- what the receipt needs regardless.
  menu_item_id uuid references public.menu_items (id) on delete set null,
  name_snapshot text not null,
  variation_label text,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  special_instructions text,
  subtotal integer not null check (subtotal >= 0),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- payments — types/payment.ts's Payment
-- ----------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete restrict,
  order_id uuid not null references public.orders (id) on delete cascade,
  method public.payment_method not null,
  status public.payment_status not null default 'pending',
  amount integer not null check (amount >= 0),
  amount_refunded integer not null default 0 check (amount_refunded >= 0),
  currency text not null default 'UGX',
  provider_reference text,
  collected_by_user_id uuid references public.users (id) on delete set null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (amount_refunded <= amount)
);

create trigger set_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- deliveries — types/delivery.ts's Delivery
-- ----------------------------------------------------------------------------
create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete restrict,
  -- One delivery per order — UNIQUE enforces the 1:1 the type implies
  -- (Order.deliveryId is singular).
  order_id uuid not null unique references public.orders (id) on delete cascade,
  rider_id uuid references public.users (id) on delete set null,
  status public.delivery_status not null default 'unassigned',
  -- References data/delivery.ts's static DeliveryZone.id ("near"/"mid"/"far")
  -- — a marketing-site constant, not a database table, so plain text rather
  -- than a foreign key, matching the type's own comment.
  delivery_zone_id text not null,
  fee integer not null default 0 check (fee >= 0),
  address text not null,
  customer_phone text not null,
  assigned_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.deliveries
  for each row execute function public.set_updated_at();

alter table public.orders
  add constraint orders_delivery_id_fkey
  foreign key (delivery_id) references public.deliveries (id) on delete set null;

alter table public.restaurant_tables
  add constraint restaurant_tables_current_order_id_fkey
  foreign key (current_order_id) references public.orders (id) on delete set null;

-- ----------------------------------------------------------------------------
-- kitchen_tickets — types/kitchen.ts's KitchenTicket
-- ----------------------------------------------------------------------------
create table public.kitchen_tickets (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete restrict,
  -- One ticket per order, matching the type's own header comment exactly.
  order_id uuid not null unique references public.orders (id) on delete cascade,
  -- KitchenTicketItem[] has no id of its own in the TS type (orderItemId is
  -- its natural key) — designed as embedded data, so JSONB rather than a
  -- 17th table.
  items jsonb not null default '[]'::jsonb,
  status public.kitchen_ticket_status not null default 'queued',
  assigned_chef_id uuid references public.users (id) on delete set null,
  fired_at timestamptz not null default now(),
  ready_at timestamptz,
  served_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.kitchen_tickets
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- notifications — types/notification.ts's Notification
-- ----------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.users (id) on delete cascade,
  branch_id uuid references public.branches (id) on delete cascade,
  type public.notification_type not null,
  channel public.notification_channel not null,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  -- Polymorphic reference (an Order id, a Reservation id, ...) — no single
  -- table it can point to, so intentionally left without a foreign key.
  related_entity_id uuid,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.notifications
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- loyalty_members — types/loyalty.ts's LoyaltyMember
-- (LoyaltyTransaction is not created this milestone — see the final
-- report's Remaining Work; it wasn't in the milestone's named table list.)
-- ----------------------------------------------------------------------------
create table public.loyalty_members (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null unique references public.customers (id) on delete cascade,
  points integer not null default 0 check (points >= 0),
  tier public.loyalty_tier not null default 'bronze',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.loyalty_members
  for each row execute function public.set_updated_at();

alter table public.customers
  add constraint customers_loyalty_member_id_fkey
  foreign key (loyalty_member_id) references public.loyalty_members (id) on delete set null;

-- ============================================================================
-- Indexes
-- ============================================================================
-- branches
create index idx_branches_status on public.branches (status);

-- users
create index idx_users_branch_id on public.users (branch_id);
-- email already has a unique index from the UNIQUE constraint above.

-- customers
-- phone already has a unique index from customers_phone_key above.
create index idx_customers_email on public.customers (email);

-- menu_categories
create index idx_menu_categories_branch_id on public.menu_categories (branch_id);

-- inventory_items
create index idx_inventory_items_branch_id on public.inventory_items (branch_id);

-- menu_items
create index idx_menu_items_branch_id on public.menu_items (branch_id);
create index idx_menu_items_category_id on public.menu_items (category_id);
create index idx_menu_items_availability on public.menu_items (availability);

-- restaurant_tables
create index idx_restaurant_tables_branch_id on public.restaurant_tables (branch_id);
create index idx_restaurant_tables_status on public.restaurant_tables (status);

-- promotions
create index idx_promotions_branch_id on public.promotions (branch_id);
create index idx_promotions_is_active on public.promotions (is_active);

-- reservations
create index idx_reservations_branch_id on public.reservations (branch_id);
create index idx_reservations_customer_id on public.reservations (customer_id);
create index idx_reservations_status on public.reservations (status);
create index idx_reservations_reserved_for on public.reservations (reserved_for);
create index idx_reservations_created_at on public.reservations (created_at);

-- orders
create index idx_orders_branch_id on public.orders (branch_id);
create index idx_orders_customer_id on public.orders (customer_id);
create index idx_orders_status on public.orders (status);
create index idx_orders_created_at on public.orders (created_at);
create index idx_orders_table_id on public.orders (table_id);

-- order_items
create index idx_order_items_order_id on public.order_items (order_id);
create index idx_order_items_menu_item_id on public.order_items (menu_item_id);

-- payments
create index idx_payments_branch_id on public.payments (branch_id);
create index idx_payments_order_id on public.payments (order_id);
create index idx_payments_status on public.payments (status);
create index idx_payments_created_at on public.payments (created_at);

-- deliveries
create index idx_deliveries_branch_id on public.deliveries (branch_id);
-- order_id already has a unique index from the UNIQUE constraint above.
create index idx_deliveries_rider_id on public.deliveries (rider_id);
create index idx_deliveries_status on public.deliveries (status);
create index idx_deliveries_created_at on public.deliveries (created_at);

-- kitchen_tickets
create index idx_kitchen_tickets_branch_id on public.kitchen_tickets (branch_id);
create index idx_kitchen_tickets_status on public.kitchen_tickets (status);
create index idx_kitchen_tickets_created_at on public.kitchen_tickets (created_at);

-- notifications
create index idx_notifications_recipient_user_id on public.notifications (recipient_user_id);
create index idx_notifications_created_at on public.notifications (created_at);

-- loyalty_members
create index idx_loyalty_members_tier on public.loyalty_members (tier);

-- ============================================================================
-- Row Level Security
-- ============================================================================
-- Every policy below is a direct translation of lib/rbac.ts's
-- ROLE_PERMISSIONS grants for the matching PermissionResource, using
-- current_user_role()/current_user_branch_id() so the rule is evaluated
-- identically to the app-level `can()` check. Three deliberate categories
-- of departure from a literal, mechanical translation are called out
-- inline with a "NOTE:" comment and summarized in the migration's
-- accompanying report — they are not oversights:
--
--   1. A few self-scoped grants (a user reading their own profile row, a
--      user marking their own notification read) that lib/rbac.ts's
--      `user`/`notification` resource lists don't literally grant to
--      non-owner roles, but that are safe, minimal, and necessary for the
--      app to function at all.
--   2. `menu_items`/`menu_categories` public SELECT — the menu is public
--      product data on the marketing site today; gating it behind a role
--      would break the one thing every visitor needs to see.
--   3. Customer "own resource" access (their own orders/reservations) is
--      NOT implemented — Customer has no auth.users link in the current
--      type (types/customer.ts), so "is this my order" can't be expressed
--      in SQL yet. Flagged as Remaining Work, not silently invented.

alter table public.branches enable row level security;
alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.menu_categories enable row level security;
alter table public.inventory_items enable row level security;
alter table public.menu_items enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.promotions enable row level security;
alter table public.reservations enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.deliveries enable row level security;
alter table public.kitchen_tickets enable row level security;
alter table public.notifications enable row level security;
alter table public.loyalty_members enable row level security;

-- ---- branches ----------------------------------------------------------
-- rbac.ts grants the `branch` resource to owner only — no other role has
-- any permission entry for it. Mirrored exactly, including that gap; see
-- the report.
create policy branches_owner_all on public.branches
  for all
  using (public.is_owner())
  with check (public.is_owner());

-- ---- users ---------------------------------------------------------------
-- rbac.ts: branch_manager (read/list/update, own branch), owner (all).
-- NOTE (departure #1): every user may also read their own row — required
-- for the app to load its own session profile at all, and inherently safe
-- (self-access only).
create policy users_select_self on public.users
  for select
  using (id = auth.uid());

create policy users_select_branch_manager on public.users
  for select
  using (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  );

create policy users_update_branch_manager on public.users
  for update
  using (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  )
  with check (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  );

create policy users_delete_owner on public.users
  for delete
  using (public.is_owner());
-- No INSERT policy: new rows are created solely by the on_auth_user_created
-- trigger (SECURITY DEFINER, bypasses RLS) — there is no direct-insert path.

-- ---- customers -------------------------------------------------------------
-- rbac.ts: cashier (create/read/list), branch_manager (create/read/list/
-- update), owner (all). Customer has no branch_id column (platform-wide,
-- per its own type comment) — matching lib/rbac.ts's `can()` behavior when
-- resourceBranchId is undefined, access here is role-gated only, not
-- branch-filtered.
create policy customers_select on public.customers
  for select
  using (public.current_user_role() in ('owner', 'cashier', 'branch_manager'));

create policy customers_insert on public.customers
  for insert
  with check (public.current_user_role() in ('owner', 'cashier', 'branch_manager'));

create policy customers_update on public.customers
  for update
  using (public.current_user_role() in ('owner', 'branch_manager'))
  with check (public.current_user_role() in ('owner', 'branch_manager'));

create policy customers_delete_owner on public.customers
  for delete
  using (public.is_owner());

-- ---- menu_categories / menu_items -----------------------------------------
-- rbac.ts `menu_item`: customer/waiter/cashier (read/list), chef (read/
-- list/update), branch_manager (create/read/list/update/delete), owner
-- (all). menu_categories has no dedicated PermissionResource in
-- types/permission.ts; treated the same as menu_items since it's
-- structurally part of "the menu."
-- NOTE (departure #2): SELECT is public (including unauthenticated/anon)
-- for non-hidden items — the menu is public product data on the marketing
-- site today (see data/menu.ts); gating it behind a role would regress
-- that.
create policy menu_categories_select_public on public.menu_categories
  for select
  using (true);

create policy menu_categories_write on public.menu_categories
  for all
  using (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and (branch_id = public.current_user_branch_id() or branch_id is null))
  )
  with check (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and (branch_id = public.current_user_branch_id() or branch_id is null))
  );

create policy menu_items_select_public on public.menu_items
  for select
  using (
    availability <> 'hidden'
    or public.current_user_role() in ('owner', 'branch_manager', 'chef', 'cashier', 'waiter')
  );

create policy menu_items_insert on public.menu_items
  for insert
  with check (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  );

create policy menu_items_update on public.menu_items
  for update
  using (
    public.is_owner()
    or (public.current_user_role() in ('branch_manager', 'chef') and branch_id = public.current_user_branch_id())
  )
  with check (
    public.is_owner()
    or (public.current_user_role() in ('branch_manager', 'chef') and branch_id = public.current_user_branch_id())
  );

create policy menu_items_delete on public.menu_items
  for delete
  using (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  );

-- ---- restaurant_tables ------------------------------------------------------
-- rbac.ts `table`: waiter/cashier (read/list/update), branch_manager
-- (create/read/list/update/delete), owner (all).
create policy restaurant_tables_select on public.restaurant_tables
  for select
  using (
    public.is_owner()
    or (public.current_user_role() in ('waiter', 'cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  );

create policy restaurant_tables_insert on public.restaurant_tables
  for insert
  with check (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  );

create policy restaurant_tables_update on public.restaurant_tables
  for update
  using (
    public.is_owner()
    or (public.current_user_role() in ('waiter', 'cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  )
  with check (
    public.is_owner()
    or (public.current_user_role() in ('waiter', 'cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  );

create policy restaurant_tables_delete on public.restaurant_tables
  for delete
  using (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  );

-- ---- promotions --------------------------------------------------------
-- rbac.ts `promotion`: branch_manager (create/read/list/update), owner
-- (all). No other role is granted access — customer-facing promo-code
-- lookup at checkout is ordering logic, explicitly out of scope.
create policy promotions_all on public.promotions
  for all
  using (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  )
  with check (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  );

-- ---- reservations --------------------------------------------------------
-- rbac.ts `reservation`: customer (create/read/cancel), waiter/cashier
-- (read/list/update), branch_manager (create/read/list/update/cancel),
-- owner (all).
-- NOTE (departure #3): customer SELECT/UPDATE("cancel") are NOT
-- implemented — doing so correctly requires matching "this reservation
-- belongs to the requesting customer," which needs a customers<->auth.users
-- link that doesn't exist in the current Customer type. The one customer
-- capability that IS safely expressible without that link — creating a
-- guest-style reservation (customer_id left null, guest_name/guest_phone
-- captured directly, exactly as the type supports) — is implemented below.
create policy reservations_select_staff on public.reservations
  for select
  using (
    public.is_owner()
    or (public.current_user_role() in ('waiter', 'cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  );

create policy reservations_insert_staff on public.reservations
  for insert
  with check (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  );

create policy reservations_insert_customer_guest on public.reservations
  for insert
  with check (public.current_user_role() = 'customer' and customer_id is null);

create policy reservations_update_staff on public.reservations
  for update
  using (
    public.is_owner()
    or (public.current_user_role() in ('waiter', 'cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  )
  with check (
    public.is_owner()
    or (public.current_user_role() in ('waiter', 'cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  );

-- ---- orders / order_items -------------------------------------------------
-- rbac.ts `order`: customer (create/read/cancel), waiter (create/read/
-- list/update), cashier (create/read/list/update/cancel), chef (read/
-- list), branch_manager (create/read/list/update/cancel/export), owner
-- (all). Same customer "own resource" gap as reservations (departure #3) —
-- guest-style insert (customer_id null) implemented; customer SELECT/
-- cancel are not.
-- `order_item` has no non-owner grants of its own in rbac.ts at all; its
-- access is derived from the parent order's access instead of a separate
-- literal-empty grant, since a line item has no meaning apart from its
-- order.
create policy orders_select_staff on public.orders
  for select
  using (
    public.is_owner()
    or (public.current_user_role() in ('waiter', 'cashier', 'chef', 'branch_manager') and branch_id = public.current_user_branch_id())
  );

create policy orders_insert_staff on public.orders
  for insert
  with check (
    public.is_owner()
    or (public.current_user_role() in ('waiter', 'cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  );

create policy orders_insert_customer_guest on public.orders
  for insert
  with check (public.current_user_role() = 'customer' and customer_id is null);

create policy orders_update_staff on public.orders
  for update
  using (
    public.is_owner()
    or (public.current_user_role() in ('waiter', 'cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  )
  with check (
    public.is_owner()
    or (public.current_user_role() in ('waiter', 'cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  );

create policy order_items_select on public.order_items
  for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          public.is_owner()
          or (public.current_user_role() in ('waiter', 'cashier', 'chef', 'branch_manager') and o.branch_id = public.current_user_branch_id())
        )
    )
  );

create policy order_items_write on public.order_items
  for all
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          public.is_owner()
          or (public.current_user_role() in ('waiter', 'cashier', 'branch_manager') and o.branch_id = public.current_user_branch_id())
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
        )
    )
  );

-- ---- payments --------------------------------------------------------
-- rbac.ts `payment`: cashier (create/read/list/update), branch_manager
-- (create/read/list/update/refund), owner (all). No waiter/chef/rider/
-- customer grant at all — matches docs/16_PLATFORM_ARCHITECTURE.md's RBAC
-- table ("a Chef can read orders but never touch payments").
create policy payments_select on public.payments
  for select
  using (
    public.is_owner()
    or (public.current_user_role() in ('cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  );

create policy payments_insert on public.payments
  for insert
  with check (
    public.is_owner()
    or (public.current_user_role() in ('cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  );

create policy payments_update on public.payments
  for update
  using (
    public.is_owner()
    or (public.current_user_role() in ('cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  )
  with check (
    public.is_owner()
    or (public.current_user_role() in ('cashier', 'branch_manager') and branch_id = public.current_user_branch_id())
  );

-- ---- deliveries --------------------------------------------------------
-- rbac.ts `delivery`: rider (read/list/update), branch_manager (read/
-- list/update/assign), owner (all). Riders are restricted to their own
-- assigned deliveries (rider_id = auth.uid()) rather than every delivery
-- in their branch — this is the stricter reading, and matches what
-- lib/rbac.ts's own comment on the rider role documents as intended
-- ("a Rider only ever sees their own assigned deliveries"), even though
-- the generic branch-scope helper alone doesn't enforce that; RLS is the
-- right layer to hold the line here since it's a real privacy boundary
-- between riders.
create policy deliveries_select on public.deliveries
  for select
  using (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
    or (public.current_user_role() = 'rider' and rider_id = auth.uid())
  );

create policy deliveries_update on public.deliveries
  for update
  using (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
    or (public.current_user_role() = 'rider' and rider_id = auth.uid())
  )
  with check (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
    or (public.current_user_role() = 'rider' and rider_id = auth.uid())
  );

-- ---- kitchen_tickets --------------------------------------------------------
-- rbac.ts `kitchen_ticket`: waiter (read/list), chef (read/list/update),
-- branch_manager (read/list/update), owner (all). No create/delete grant
-- for anyone but owner — tickets are meant to be generated by
-- KitchenService.createTicketForOrder (services/KitchenService.ts), a
-- trusted server-side path, not a direct client insert.
create policy kitchen_tickets_select on public.kitchen_tickets
  for select
  using (
    public.is_owner()
    or (public.current_user_role() in ('waiter', 'chef', 'branch_manager') and branch_id = public.current_user_branch_id())
  );

create policy kitchen_tickets_update on public.kitchen_tickets
  for update
  using (
    public.is_owner()
    or (public.current_user_role() in ('chef', 'branch_manager') and branch_id = public.current_user_branch_id())
  )
  with check (
    public.is_owner()
    or (public.current_user_role() in ('chef', 'branch_manager') and branch_id = public.current_user_branch_id())
  );

-- ---- notifications --------------------------------------------------------
-- rbac.ts `notification`: every role gets "read" on their own inbox;
-- branch_manager also gets "list"; owner gets everything. No create grant
-- for anyone but owner — notifications are service-generated.
-- NOTE (departure #1): marking a notification read is technically an
-- UPDATE, which rbac.ts doesn't literally grant to any non-owner role —
-- but it's scoped to strictly the recipient's own row, so it's included
-- as the same category of safe, necessary self-access as `users_select_self`.
create policy notifications_select_own on public.notifications
  for select
  using (public.is_owner() or recipient_user_id = auth.uid());

create policy notifications_mark_own_read on public.notifications
  for update
  using (recipient_user_id = auth.uid())
  with check (recipient_user_id = auth.uid());

-- ---- loyalty_members --------------------------------------------------------
-- rbac.ts `loyalty_member`: customer (read — same "own resource" gap as
-- orders/reservations, not implemented, see departure #3), branch_manager
-- (read/list), owner (all). LoyaltyMember has no branch_id (platform-wide,
-- per its type comment), so branch_manager access here is role-gated only,
-- matching the same `can()` behavior noted for `customers` above.
create policy loyalty_members_select on public.loyalty_members
  for select
  using (public.current_user_role() in ('owner', 'branch_manager'));

-- ---- inventory_items --------------------------------------------------------
-- rbac.ts `inventory_item`: chef (read/list/update), branch_manager
-- (create/read/list/update/delete), owner (all).
create policy inventory_items_select on public.inventory_items
  for select
  using (
    public.is_owner()
    or (public.current_user_role() in ('chef', 'branch_manager') and branch_id = public.current_user_branch_id())
  );

create policy inventory_items_insert on public.inventory_items
  for insert
  with check (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  );

create policy inventory_items_update on public.inventory_items
  for update
  using (
    public.is_owner()
    or (public.current_user_role() in ('chef', 'branch_manager') and branch_id = public.current_user_branch_id())
  )
  with check (
    public.is_owner()
    or (public.current_user_role() in ('chef', 'branch_manager') and branch_id = public.current_user_branch_id())
  );

create policy inventory_items_delete on public.inventory_items
  for delete
  using (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  );
