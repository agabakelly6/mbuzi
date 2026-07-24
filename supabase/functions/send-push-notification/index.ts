// supabase/functions/send-push-notification/index.ts
//
// Called by the on_notification_created_send_push Postgres trigger (via
// pg_net) the instant a row is inserted into public.notifications — i.e.
// exactly when notify_order_ready/notify_delivery_assigned already fire.
// Looks the notification up server-side rather than trusting whatever the
// caller sends (the payload is just {notificationId}), fetches every
// device the recipient has push-enabled, and sends a real Web Push to
// each one using this project's VAPID keypair.
//
// Deployed with verify_jwt=false (a Postgres trigger via pg_net can't
// mint a JWT) — authenticated instead by a static shared-secret header,
// the same pattern Supabase's own dashboard-generated Database Webhooks
// use. See the migration this trigger lives in for why.
//
// Uses ./webpush.ts (a from-scratch RFC 8291 implementation on Deno's
// native Web Crypto API) instead of the `web-push` npm package — that
// package crashes the Supabase Edge Runtime outright (not even a
// catchable JS error, just a 502 after ~10s) when sendNotification() is
// called, confirmed by isolating it in a standalone test function before
// writing this. The manual implementation was verified against a real
// push service (FCM returned 410 Gone for a fake-but-well-formed request
// — meaning it accepted the VAPID auth and decrypted the payload
// correctly, and only rejected the made-up registration id).
import { createClient } from "jsr:@supabase/supabase-js@2";
import { sendWebPush } from "./webpush.ts";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const expectedSecret = Deno.env.get("PUSH_WEBHOOK_SECRET");
  if (!expectedSecret || req.headers.get("x-webhook-secret") !== expectedSecret) {
    return json({ error: "forbidden" }, 403);
  }

  let body: { notificationId?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "validation_error" }, 400);
  }
  if (!body.notificationId) return json({ error: "validation_error", message: "notificationId is required." }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("STAFF_INVITE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: notification, error: notifError } = await admin
    .from("notifications")
    .select("id, recipient_user_id, title, body, related_entity_id")
    .eq("id", body.notificationId)
    .maybeSingle();
  if (notifError || !notification) return json({ error: "not_found" }, 404);

  const { data: subscriptions, error: subError } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", notification.recipient_user_id);
  if (subError) return json({ error: "unknown", message: subError.message }, 500);
  if (!subscriptions || subscriptions.length === 0) return json({ data: { sent: 0 } }, 200);

  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: "/staff",
  });

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      const result = await sendWebPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload,
        "mailto:support@ypambuzichoma.com",
        vapidPublicKey,
        vapidPrivateKey
      );
      if (result.ok) {
        sent++;
      } else if (result.status === 404 || result.status === 410) {
        // Browser revoked/expired this subscription — clean it up rather than retrying it forever.
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
      }
    } catch {
      // One malformed/unreachable subscription shouldn't block the rest.
    }
  }

  return json({ data: { sent, total: subscriptions.length } }, 200);
});
