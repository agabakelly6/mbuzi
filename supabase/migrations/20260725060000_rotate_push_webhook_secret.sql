-- supabase/migrations/20260725060000_rotate_push_webhook_secret.sql
--
-- trigger_push_on_new_notification() previously had the shared webhook
-- secret hardcoded in plaintext, committed permanently to git history
-- (20260724050000_push_notifications.sql). Rotated to a new value (set
-- once via the Management API, never written to any file in this repo —
-- same handling as every other API key this project holds) and stored in
-- Supabase Vault instead, which this SECURITY DEFINER function can read
-- but anon/authenticated cannot. send-push-notification's own
-- PUSH_WEBHOOK_SECRET function secret was rotated to the same new value
-- separately.

create or replace function public.trigger_push_on_new_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_webhook_secret text;
begin
  select decrypted_secret into v_webhook_secret
  from vault.decrypted_secrets
  where name = 'push_webhook_secret';

  if v_webhook_secret is null then
    -- Fail safe, not silent: a misconfigured secret should surface as a
    -- missing push notification, not an unauthenticated webhook call.
    raise warning 'push_webhook_secret is not set in vault; skipping push notification for notification %', new.id;
    return new;
  end if;

  perform net.http_post(
    url := 'https://hbbpzryklsztiyfqznnk.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', v_webhook_secret
    ),
    body := jsonb_build_object('notificationId', new.id)
  );
  return new;
end;
$$;
