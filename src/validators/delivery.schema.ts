// src/validators/delivery.schema.ts
import { z } from "zod";
import { moneySchema, nonEmptyStringSchema, phoneSchema, uuidSchema } from "./shared";

export const deliveryStatusSchema = z.enum([
  "unassigned",
  "assigned",
  "picked_up",
  "en_route",
  "delivered",
  "failed",
  "cancelled",
]);

export const createDeliveryInputSchema = z.object({
  branchId: uuidSchema,
  orderId: uuidSchema,
  deliveryZoneId: nonEmptyStringSchema,
  fee: moneySchema,
  address: z.string().min(5),
  customerPhone: phoneSchema,
});

export const updateDeliveryStatusInputSchema = z.object({
  status: deliveryStatusSchema,
  failureReason: z.string().optional(),
});

export const assignRiderInputSchema = z.object({
  riderId: uuidSchema,
});

export type CreateDeliveryInput = z.infer<typeof createDeliveryInputSchema>;
export type UpdateDeliveryStatusInput = z.infer<typeof updateDeliveryStatusInputSchema>;
export type AssignRiderInput = z.infer<typeof assignRiderInputSchema>;
