-- supabase/migrations/20260724050000_push_notifications.sql
--
-- Real push notifications (pop up even when the staff dashboard tab isn't
-- focused), on top of the existing in-app notifications table/bell. Two
-- new pieces:
--   1. push_subscriptions — one row per browser a user has enabled push on
--      (a person could have it on both their phone and a desktop). Each
--      row is the Web Push subscription object the browser's PushManager
--      returns (endpoint + p256dh/auth keys), which is what the server
--      needs to actually deliver a push.
--   2. A trigger on public.notifications that fires the moment a row is
--      inserted (i.e. exactly when notify_order_ready/notify_delivery_assigned
--      already create one) and calls the new send-push-notification Edge
--      Function via pg_net — the only way a Postgres trigger can reach an
--      HTTP endpoint. This project has no Supabase "Database Webhooks" UI
--      configured (that feature depends on the supabase_functions schema,
--      which isn't present here), so this wires the same underlying
--      mechanism (pg_net) directly instead.
--
-- Authentication for that trigger->function call: pg_net can't mint a JWT,
-- so the Edge Function is deployed with verify_jwt=false and instead
-- checks a static shared-secret header — the exact pattern Supabase's own
-- dashboard-generated Database Webhooks use under the hood. The secret is
-- necessarily committed here (a SQL trigger has no other way to hold one);
-- blast radius if leaked is "someone can ask the function to (re)send a
-- push for a real, already-existing notification row" — not access to any
-- other data, since the function looks the notification up server-side
-- rather than trusting whatever payload a caller sends.

create extension if not exists pg_net;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index idx_push_subscriptions_user_id on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- Self-access only — same category as users_select_self (users_update_own
-- notification/profile rows): a push subscription belongs entirely to the
-- person who granted it, no role/branch scoping applies.
create policy push_subscriptions_own on public.push_subscriptions
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.trigger_push_on_new_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://hbbpzryklsztiyfqznnk.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', '79TmG6e0tukjNCQSudwOI8KclCp_FZxx'
    ),
    body := jsonb_build_object('notificationId', new.id)
  );
  return new;
end;
$$;

create trigger on_notification_created_send_push
  after insert on public.notifications
  for each row execute function public.trigger_push_on_new_notification();
