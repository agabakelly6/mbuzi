// src/validators/notification.schema.ts
import { z } from "zod";
import { nonEmptyStringSchema, uuidSchema } from "./shared";

export const notificationTypeSchema = z.enum([
  "order_placed",
  "order_status_changed",
  "reservation_confirmed",
  "delivery_assigned",
  "payment_received",
  "low_stock",
  "system",
]);

export const notificationChannelSchema = z.enum(["in_app", "sms", "whatsapp", "email", "push"]);

export const createNotificationInputSchema = z.object({
  recipientUserId: uuidSchema,
  branchId: uuidSchema.optional(),
  type: notificationTypeSchema,
  channel: notificationChannelSchema,
  title: nonEmptyStringSchema,
  body: nonEmptyStringSchema,
  relatedEntityId: uuidSchema.optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationInputSchema>;
