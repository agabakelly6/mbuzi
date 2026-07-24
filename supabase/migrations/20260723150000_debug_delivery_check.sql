create or replace function public.debug_delivery_check(p_branch_id uuid)
returns boolean
language sql
stable
security invoker
as $$
  select public.is_owner()
    or (public.current_user_role() in ('waiter', 'cashier', 'branch_manager') and p_branch_id = public.current_user_branch_id());
$$;
