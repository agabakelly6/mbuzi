-- supabase/migrations/20260724010000_analytics.sql
--
-- Real, server-side analytics — replaces the client-computed stats panel's
-- naive "fetch a page of orders and sum them in the browser" approach with
-- proper Postgres aggregation. No server runtime exists to host a
-- dedicated analytics service, so these are SECURITY DEFINER RPC functions
-- (same pattern as handle_new_user, create_kitchen_ticket_on_order_accepted,
-- notification triggers): they run with elevated rights to aggregate across
-- rows a caller's own RLS grants wouldn't fully expose, but each function
-- independently re-checks the caller's role/branch before returning
-- anything, so access is exactly as scoped as rbac.ts's
-- analytics: branch_manager/owner grant (plus a "read your own performance"
-- carve-out for get_staff_performance, matching the self-access pattern
-- used elsewhere for notifications/profile).

-- ----------------------------------------------------------------------------
-- get_sales_snapshot — types/analytics.ts's SalesSnapshot for one branch
-- over an arbitrary period. "Revenue" and "average order value" are
-- computed only from completed orders (a cancelled or still-open order
-- hasn't earned anything yet); order_count counts every non-cancelled
-- order placed in the period, completed or not, since "how many orders
-- came in" and "how much did we make" are different questions.
-- ----------------------------------------------------------------------------
create or replace function public.get_sales_snapshot(
  p_branch_id uuid,
  p_period_start timestamptz,
  p_period_end timestamptz
)
returns table (
  order_count integer,
  revenue bigint,
  average_order_value numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (public.is_owner() or (public.current_user_role() = 'branch_manager' and public.current_user_branch_id() = p_branch_id)) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  select
    count(*) filter (where o.status <> 'cancelled')::integer as order_count,
    coalesce(sum(o.total) filter (where o.status = 'completed'), 0)::bigint as revenue,
    case
      when count(*) filter (where o.status = 'completed') = 0 then 0
      else round(coalesce(sum(o.total) filter (where o.status = 'completed'), 0)::numeric / count(*) filter (where o.status = 'completed'), 0)
    end as average_order_value
  from public.orders o
  where o.branch_id = p_branch_id
    and o.created_at >= p_period_start
    and o.created_at < p_period_end;
end;
$$;

-- ----------------------------------------------------------------------------
-- get_branch_analytics_summary — types/analytics.ts's BranchAnalyticsSummary:
-- today/last7Days/last30Days snapshots plus the top 5 selling items over
-- the last 30 days. Returned as jsonb (built with the same field names the
-- TS mapper expects) since a single RPC call replacing three separate
-- snapshot round-trips is worth the jsonb-shaping cost.
-- ----------------------------------------------------------------------------
create or replace function public.get_branch_analytics_summary(p_branch_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_today_start timestamptz := date_trunc('day', now());
  v_result jsonb;
begin
  if not (public.is_owner() or (public.current_user_role() = 'branch_manager' and public.current_user_branch_id() = p_branch_id)) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'branchId', p_branch_id,
    'today', (
      select jsonb_build_object(
        'branchId', p_branch_id,
        'periodStart', v_today_start,
        'periodEnd', now(),
        'orderCount', s.order_count,
        'revenue', s.revenue,
        'averageOrderValue', s.average_order_value
      )
      from public.get_sales_snapshot(p_branch_id, v_today_start, now() + interval '1 second') s
    ),
    'last7Days', (
      select jsonb_build_object(
        'branchId', p_branch_id,
        'periodStart', now() - interval '7 days',
        'periodEnd', now(),
        'orderCount', s.order_count,
        'revenue', s.revenue,
        'averageOrderValue', s.average_order_value
      )
      from public.get_sales_snapshot(p_branch_id, now() - interval '7 days', now() + interval '1 second') s
    ),
    'last30Days', (
      select jsonb_build_object(
        'branchId', p_branch_id,
        'periodStart', now() - interval '30 days',
        'periodEnd', now(),
        'orderCount', s.order_count,
        'revenue', s.revenue,
        'averageOrderValue', s.average_order_value
      )
      from public.get_sales_snapshot(p_branch_id, now() - interval '30 days', now() + interval '1 second') s
    ),
    'topSellingItems', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'menuItemId', t.menu_item_id,
        'name', t.name,
        'unitsSold', t.units_sold
      )), '[]'::jsonb)
      from (
        select oi.menu_item_id, oi.name_snapshot as name, sum(oi.quantity)::integer as units_sold
        from public.order_items oi
        join public.orders o on o.id = oi.order_id
        where o.branch_id = p_branch_id
          and o.status = 'completed'
          and o.created_at >= now() - interval '30 days'
        group by oi.menu_item_id, oi.name_snapshot
        order by units_sold desc
        limit 5
      ) t
    )
  )
  into v_result;

  return v_result;
end;
$$;

-- ----------------------------------------------------------------------------
-- get_staff_performance — types/analytics.ts's StaffPerformanceSnapshot.
-- "Orders handled" is role-dependent (a waiter/cashier places orders, a
-- chef works kitchen tickets, a rider completes deliveries), so this sums
-- across all three — in practice only one term is ever nonzero for a given
-- user, since a user has exactly one role. averagePrepTimeMinutes only
-- applies to chefs (fired_at -> ready_at on their assigned kitchen
-- tickets); it's null for everyone else, matching the optional field in
-- the TS type.
-- ----------------------------------------------------------------------------
create or replace function public.get_staff_performance(
  p_user_id uuid,
  p_period_start timestamptz,
  p_period_end timestamptz
)
returns table (
  orders_handled integer,
  average_prep_time_minutes numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_target_branch_id uuid;
begin
  select branch_id into v_target_branch_id from public.users where id = p_user_id;

  if not (
    public.is_owner()
    or (public.current_user_role() = 'branch_manager' and public.current_user_branch_id() = v_target_branch_id)
    or auth.uid() = p_user_id
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  select
    (
      (select count(*) from public.orders o where o.placed_by_user_id = p_user_id and o.created_at >= p_period_start and o.created_at < p_period_end)
      + (select count(*) from public.kitchen_tickets kt where kt.assigned_chef_id = p_user_id and kt.status in ('ready', 'served') and kt.fired_at >= p_period_start and kt.fired_at < p_period_end)
      + (select count(*) from public.deliveries d where d.rider_id = p_user_id and d.status = 'delivered' and d.created_at >= p_period_start and d.created_at < p_period_end)
    )::integer as orders_handled,
    (
      select round(avg(extract(epoch from (kt.ready_at - kt.fired_at)) / 60)::numeric, 1)
      from public.kitchen_tickets kt
      where kt.assigned_chef_id = p_user_id
        and kt.ready_at is not null
        and kt.fired_at >= p_period_start
        and kt.fired_at < p_period_end
    ) as average_prep_time_minutes;
end;
$$;

grant execute on function public.get_sales_snapshot(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.get_branch_analytics_summary(uuid) to authenticated;
grant execute on function public.get_staff_performance(uuid, timestamptz, timestamptz) to authenticated;
