-- ============================================================================
-- Notifications — auto-generated at the two most valuable trigger points,
-- not built as a general-purpose "call this from anywhere" feature yet.
-- ============================================================================
-- notifications has no non-owner INSERT policy (see the first migration) —
-- same "no server-side path exists" situation as kitchen_tickets, solved
-- the same way: SECURITY DEFINER triggers on the events that matter,
-- rather than loosening RLS for a direct client insert nothing currently
-- needs. NotificationService.send() only works for an owner session for
-- the same reason SupabaseAuthService.inviteStaff doesn't work at all —
-- there's no trusted place to call it from yet.
--
-- Two triggers:
--   1. An order reaching 'ready' notifies the placing customer — but only
--      if they have a linked account (customer.user_id is not null); a
--      guest/WhatsApp order has nowhere to deliver an in-app notification
--      to, and that's fine, not an error.
--   2. A delivery getting a rider assigned notifies that rider.

create or replace function public.notify_order_ready()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid;
begin
  if new.status = 'ready' and old.status is distinct from 'ready' and new.customer_id is not null then
    select user_id into v_recipient from public.customers where id = new.customer_id;
    if v_recipient is not null then
      insert into public.notifications (recipient_user_id, branch_id, type, channel, title, body, related_entity_id, sent_at)
      values (
        v_recipient,
        new.branch_id,
        'order_status_changed',
        'in_app',
        'Your order is ready',
        'Order ' || new.order_number || ' is ready.',
        new.id,
        now()
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger on_order_ready
  after update on public.orders
  for each row execute function public.notify_order_ready();

create or replace function public.notify_delivery_assigned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.rider_id is not null and old.rider_id is distinct from new.rider_id then
    insert into public.notifications (recipient_user_id, branch_id, type, channel, title, body, related_entity_id, sent_at)
    values (
      new.rider_id,
      new.branch_id,
      'delivery_assigned',
      'in_app',
      'New delivery assigned',
      'A delivery to ' || new.address || ' has been assigned to you.',
      new.id,
      now()
    );
  end if;
  return new;
end;
$$;

create trigger on_delivery_assigned
  after update on public.deliveries
  for each row execute function public.notify_delivery_assigned();

alter publication supabase_realtime add table public.notifications;
