// src/validators/order.schema.ts
import { z } from "zod";
import { nonEmptyStringSchema, uuidSchema } from "./shared";

export const orderChannelSchema = z.enum(["dine_in", "pickup", "delivery", "whatsapp"]);

export const orderStatusSchema = z.enum([
  "pending",
  "accepted",
  "preparing",
  "ready",
  "served",
  "out_for_delivery",
  "delivered",
  "completed",
  "cancelled",
  "rejected",
]);

export const createOrderItemInputSchema = z.object({
  menuItemId: uuidSchema,
  variationLabel: z.string().optional(),
  quantity: z.number().int().positive(),
  specialInstructions: z.string().max(280).optional(),
});

export const createOrderInputSchema = z.object({
  branchId: uuidSchema,
  customerId: uuidSchema.nullable(),
  channel: orderChannelSchema,
  items: z.array(createOrderItemInputSchema).min(1),
  tableId: uuidSchema.optional(),
  deliveryAddress: z.string().min(5).optional(),
  promoCode: nonEmptyStringSchema.optional(),
  notes: z.string().max(500).optional(),
}).refine((value) => value.channel !== "dine_in" || value.tableId !== undefined, {
  message: "tableId is required for dine_in orders",
  path: ["tableId"],
}).refine((value) => value.channel !== "delivery" || value.deliveryAddress !== undefined, {
  message: "deliveryAddress is required for delivery orders",
  path: ["deliveryAddress"],
});

export const updateOrderStatusInputSchema = z.object({
  status: orderStatusSchema,
});

export const cancelOrderInputSchema = z.object({
  reason: nonEmptyStringSchema,
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusInputSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderInputSchema>;
