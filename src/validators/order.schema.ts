// src/validators/order.schema.ts
import { z } from "zod";
import { nonEmptyStringSchema, phoneSchema, uuidSchema } from "./shared";

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
  /** data/delivery.ts's DeliveryZone['id'] — the customer/cashier's self-reported distance band, same as the existing WhatsApp cart's flow (types/cart.ts's CartState.deliveryZoneId). There's no geocoding to derive this automatically. */
  deliveryZoneId: nonEmptyStringSchema.optional(),
  /** Contact number for the rider — distinct from the linked Customer's phone since an anonymous/guest delivery order has no Customer record to read it from. */
  deliveryPhone: phoneSchema.optional(),
  promoCode: nonEmptyStringSchema.optional(),
  notes: z.string().max(500).optional(),
}).refine((value) => value.channel !== "dine_in" || value.tableId !== undefined, {
  message: "tableId is required for dine_in orders",
  path: ["tableId"],
}).refine((value) => value.channel !== "delivery" || value.deliveryAddress !== undefined, {
  message: "deliveryAddress is required for delivery orders",
  path: ["deliveryAddress"],
}).refine((value) => value.channel !== "delivery" || value.deliveryZoneId !== undefined, {
  message: "deliveryZoneId is required for delivery orders",
  path: ["deliveryZoneId"],
}).refine((value) => value.channel !== "delivery" || value.deliveryPhone !== undefined, {
  message: "deliveryPhone is required for delivery orders",
  path: ["deliveryPhone"],
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
