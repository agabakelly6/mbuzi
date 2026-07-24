// src/lib/supabase/mapPushSubscriptionRow.ts
import type { PushSubscriptionRecord } from "../../types/pushSubscription";

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export function mapPushSubscriptionRow(row: PushSubscriptionRow): PushSubscriptionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth: row.auth,
    createdAt: row.created_at,
  };
}
