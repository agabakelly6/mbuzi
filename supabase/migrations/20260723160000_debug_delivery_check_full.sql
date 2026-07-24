create or replace function public.debug_delivery_check_full(p_branch_id uuid, p_order_id uuid)
returns boolean
language sql
stable
security invoker
as $$
  select public.is_owner()
    or (public.current_user_role() in ('waiter', 'cashier', 'branch_manager') and p_branch_id = public.current_user_branch_id())
    or (
      public.current_user_role() = 'customer'
      and exists (
        select 1 from public.orders o
        left join public.customers c on c.id = o.customer_id
        where o.id = p_order_id
          and (o.customer_id is null or c.user_id = auth.uid())
      )
    );
$$;
