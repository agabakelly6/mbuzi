-- supabase/migrations/20260724060000_notify_cashier_on_new_order.sql
--
-- Third notification trigger, added per explicit request: every active
-- cashier at an order's branch gets notified the moment a new order is
-- placed. One notification row per cashier (recipient_user_id is a single
-- user, not a role broadcast) — a branch with three cashiers on shift
-- means three rows, each separately push-able to whichever of them has
-- notifications enabled on their own device.
create or replace function public.notify_cashiers_on_new_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cashier record;
begin
  for v_cashier in
    select id from public.users
    where branch_id = new.branch_id and role = 'cashier' and status = 'active'
  loop
    insert into public.notifications (recipient_user_id, branch_id, type, channel, title, body, related_entity_id, sent_at)
    values (
      v_cashier.id,
      new.branch_id,
      'order_placed',
      'in_app',
      'New order received',
      'Order ' || new.order_number || ' has come in.',
      new.id,
      now()
    );
  end loop;
  return new;
end;
$$;

create trigger on_order_created_notify_cashiers
  after insert on public.orders
  for each row execute function public.notify_cashiers_on_new_order();
