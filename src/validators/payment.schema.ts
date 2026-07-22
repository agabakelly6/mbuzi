// src/validators/payment.schema.ts
import { z } from "zod";
import { moneySchema, uuidSchema } from "./shared";

export const paymentMethodSchema = z.enum(["cash", "mobile_money", "card", "bank_transfer"]);

export const paymentStatusSchema = z.enum([
  "pending",
  "authorized",
  "paid",
  "failed",
  "partially_refunded",
  "refunded",
  "voided",
]);

export const createPaymentInputSchema = z.object({
  branchId: uuidSchema,
  orderId: uuidSchema,
  method: paymentMethodSchema,
  amount: moneySchema,
  currency: z.string().length(3).default("UGX"),
  providerReference: z.string().optional(),
});

export const updatePaymentStatusInputSchema = z.object({
  status: paymentStatusSchema,
});

export const refundPaymentInputSchema = z.object({
  amount: moneySchema,
  reason: z.string().min(1),
});

export type CreatePaymentInput = z.infer<typeof createPaymentInputSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusInputSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentInputSchema>;
