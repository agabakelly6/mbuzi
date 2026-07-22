-- ============================================================================
-- loyalty_transactions — types/loyalty.ts's LoyaltyTransaction
-- ============================================================================
-- Deferred out of the original Milestone 2 table list (it wasn't one of
-- the 16 named tables); added now as its own small, self-contained
-- migration. This is the ledger LoyaltyMember.points is the running total
-- of — every earn (models/LoyaltyModel.ts's calculateEarnedPoints) or
-- redemption becomes one row here, positive or negative. Actually writing
-- to it when an order completes is Milestone 3's job (order-completion
-- logic); this migration only adds the table and its access rules.

create table public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  loyalty_member_id uuid not null references public.loyalty_members (id) on delete cascade,
  -- Null for a manual adjustment not tied to an order, matching the type's
  -- own comment exactly.
  order_id uuid references public.orders (id) on delete set null,
  -- Positive = earned, negative = redeemed, matching the type's own
  -- comment exactly. Zero is meaningless for a ledger entry.
  points integer not null check (points <> 0),
  reason text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.loyalty_transactions
  for each row execute function public.set_updated_at();

create index idx_loyalty_transactions_loyalty_member_id on public.loyalty_transactions (loyalty_member_id);
create index idx_loyalty_transactions_order_id on public.loyalty_transactions (order_id);
create index idx_loyalty_transactions_created_at on public.loyalty_transactions (created_at);

alter table public.loyalty_transactions enable row level security;

-- No dedicated `loyalty_transaction` PermissionResource exists in
-- types/permission.ts (only `loyalty_member` does) — access is derived
-- from the parent loyalty_members row's access instead of a separate
-- grant, the same reasoning already applied to order_items in the prior
-- migration: a ledger entry has no meaning apart from the membership it
-- belongs to.
create policy loyalty_transactions_select on public.loyalty_transactions
  for select
  using (
    exists (
      select 1 from public.loyalty_members lm
      where lm.id = loyalty_transactions.loyalty_member_id
        and (
          public.current_user_role() in ('owner', 'branch_manager')
          or exists (
            select 1 from public.customers c
            where c.id = lm.customer_id and c.user_id = auth.uid()
          )
        )
    )
  );

-- Writing a transaction (earning/redeeming points) is order-completion /
-- loyalty-service logic, explicitly out of scope until Milestone 3 wires
-- LoyaltyService.awardPointsForOrder — owner-only for now, the same
-- "no direct client insert" treatment given to kitchen_tickets and
-- deliveries.
create policy loyalty_transactions_insert_owner on public.loyalty_transactions
  for insert
  with check (public.is_owner());
