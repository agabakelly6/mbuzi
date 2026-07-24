// src/lib/supabase/mapNotificationRow.ts
import type { Notification, NotificationChannel, NotificationType } from "../../types/notification";

export interface NotificationRow {
  id: string;
  recipient_user_id: string;
  branch_id: string | null;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  is_read: boolean;
  related_entity_id: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export function mapNotificationRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    recipientUserId: row.recipient_user_id,
    branchId: row.branch_id ?? undefined,
    type: row.type,
    channel: row.channel,
    title: row.title,
    body: row.body,
    isRead: row.is_read,
    relatedEntityId: row.related_entity_id ?? undefined,
    sentAt: row.sent_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
