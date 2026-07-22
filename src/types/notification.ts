// src/types/notification.ts
import type { Entity } from "./base";

export type NotificationType =
  | "order_placed"
  | "order_status_changed"
  | "reservation_confirmed"
  | "delivery_assigned"
  | "payment_received"
  | "low_stock"
  | "system";

export type NotificationChannel = "in_app" | "sms" | "whatsapp" | "email" | "push";

export interface Notification extends Entity {
  /** User['id'] of the recipient. Customer-facing notifications go through their linked User once auth exists. */
  recipientUserId: string;
  /** Unset for platform-wide notifications (e.g. an owner-level system alert). */
  branchId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  isRead: boolean;
  /** Id of the record this notification is about — an Order, Reservation, etc. — for deep-linking from the notification. */
  relatedEntityId?: string;
  sentAt?: string;
}
