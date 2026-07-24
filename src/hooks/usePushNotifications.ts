// src/hooks/usePushNotifications.ts
//
// Wraps the browser's Push API: registers public/sw.js, requests
// notification permission, subscribes via PushManager, and persists the
// subscription through PushSubscriptionRepository so the
// send-push-notification Edge Function has somewhere to deliver to. A
// user enables this once per browser/device — the repository's
// (user_id, endpoint) upsert means re-enabling on the same device is a
// no-op, not a duplicate row.
import { useEffect, useState } from "react";
import { supabasePushSubscriptionRepository } from "../repositories/supabase/SupabasePushSubscriptionRepository";

export type PushPermissionState = "unsupported" | "default" | "denied" | "granted";

export interface UsePushNotificationsResult {
  state: PushPermissionState;
  isEnabling: boolean;
  error: string | null;
  enable(): Promise<void>;
}

function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export function usePushNotifications(userId: string | undefined): UsePushNotificationsResult {
  const [state, setState] = useState<PushPermissionState>("default");
  const [isEnabling, setIsEnabling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    setState(Notification.permission as PushPermissionState);
  }, []);

  async function enable() {
    if (!userId || state === "unsupported") return;
    setError(null);
    setIsEnabling(true);
    try {
      const permission = await Notification.requestPermission();
      setState(permission as PushPermissionState);
      if (permission !== "granted") return;

      const vapidKey = import.meta.env.PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setError("Push isn't configured yet.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const json = subscription.toJSON();
      const result = await supabasePushSubscriptionRepository.save({
        userId,
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh,
        auth: json.keys!.auth,
      });
      if (result.error) setError(result.error.message);
    } catch {
      setError("Couldn't enable push notifications on this device.");
    } finally {
      setIsEnabling(false);
    }
  }

  return { state, isEnabling, error, enable };
}
