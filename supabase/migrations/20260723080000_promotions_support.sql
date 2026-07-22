-- ============================================================================
-- Promotions support.
-- ============================================================================
-- 1. `promotions` had exactly one RLS policy (owner/branch_manager, from
--    the first migration) — no one else could even SELECT a promo code to
--    validate it at checkout. rbac.ts's `promotion` grants don't include
--    customer or cashier either. Same reasoning as menu_items' public-read
--    carve-out: a promo code is meant to be publicly checkable by whoever
--    is placing an order, so currently-valid promotions get their own
--    public SELECT policy, additive to (not replacing) the existing
--    management one.
-- 2. incrementUsage needs to run regardless of who places the order
--    (including a customer, who has no UPDATE grant on promotions at
--    all) — same "no server-side path exists" situation as kitchen
--    tickets, solved the same way: a narrow SECURITY DEFINER function
--    that does exactly one safe thing (bump a counter), callable via
--    supabase.rpc(), bypassing RLS deliberately and only for this.

create policy promotions_select_active_public on public.promotions
  for select
  using (is_active = true and now() >= starts_at and now() <= ends_at);

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
  returning * into v_promotion;

  return v_promotion;
end;
$$;
