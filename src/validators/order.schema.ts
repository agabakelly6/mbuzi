// src/validators/order.schema.ts
import { z } from "zod";
import { nonEmptyStringSchema, phoneSchema, uuidSchema } from "./shared";
import { MAX_DELIVERY_RADIUS_KM } from "../lib/geo";

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
  /** Human-readable label for staff reference only (e.g. "6.5 km" or "Address-based (fee pending)") — never the trusted fee source. */
  deliveryZoneId: nonEmptyStringSchema.optional(),
  /** Real routed road distance in km (see lib/geo.ts's calculateDeliveryFee) — the only trusted source for delivery fee. Capped at MAX_DELIVERY_RADIUS_KM; addresses beyond that aren't deliverable. */
  deliveryDistanceKm: z.number().positive().max(MAX_DELIVERY_RADIUS_KM).optional(),
  /** Routed transit time in minutes for the same trip — the fee formula's per-minute component. Set alongside deliveryDistanceKm, never independently. */
  deliveryDurationMin: z.number().nonnegative().optional(),
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
}).refine((value) => value.channel !== "delivery" || value.deliveryPhone !== undefined, {
  message: "deliveryPhone is required for delivery orders",
  path: ["deliveryPhone"],
});

/** Guest checkout — no customerId, name/phone collected directly instead. The only order-placement path /order uses now; no customer login exists. */
export const createGuestOrderInputSchema = z.object({
  branchId: uuidSchema,
  guestName: nonEmptyStringSchema,
  guestPhone: phoneSchema,
  channel: z.enum(["pickup", "delivery"]),
  items: z.array(createOrderItemInputSchema).min(1),
  deliveryAddress: z.string().min(5).optional(),
  /** Human-readable label for display/staff reference only (e.g. "2.3 km" or "Address-based (fee pending)") — never the trusted fee source. */
  deliveryZoneId: nonEmptyStringSchema.optional(),
  /** Real routed road distance in km from OpenRouteService (see CheckoutPanel.tsx's "Share My Location" flow) — the only trusted source for delivery fee calculation. Capped at MAX_DELIVERY_RADIUS_KM; there is no flat-fee fallback. If absent, the fee isn't auto-computed and the branch confirms it by phone against deliveryAddress instead. */
  deliveryDistanceKm: z.number().positive().max(MAX_DELIVERY_RADIUS_KM).optional(),
  /** Routed transit time in minutes for the same trip — the fee formula's per-minute component. Set alongside deliveryDistanceKm, never independently. */
  deliveryDurationMin: z.number().nonnegative().optional(),
  promoCode: nonEmptyStringSchema.optional(),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum(["mobile_money", "card"]),
}).refine(
  (value) => value.channel !== "delivery" || value.deliveryDistanceKm !== undefined || value.deliveryAddress !== undefined,
  {
    message: "Share your location or enter your delivery address",
    path: ["deliveryAddress"],
  }
);

export const updateOrderStatusInputSchema = z.object({
  status: orderStatusSchema,
});

export const cancelOrderInputSchema = z.object({
  reason: nonEmptyStringSchema,
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
export type CreateGuestOrderInput = z.infer<typeof createGuestOrderInputSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusInputSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderInputSchema>;
