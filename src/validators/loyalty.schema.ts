// src/validators/loyalty.schema.ts
import { z } from "zod";
import { nonEmptyStringSchema, uuidSchema } from "./shared";

export const enrollLoyaltyMemberInputSchema = z.object({
  customerId: uuidSchema,
});

export const recordLoyaltyTransactionInputSchema = z.object({
  loyaltyMemberId: uuidSchema,
  orderId: uuidSchema.optional(),
  points: z.number().int(),
  reason: nonEmptyStringSchema,
});

export type EnrollLoyaltyMemberInput = z.infer<typeof enrollLoyaltyMemberInputSchema>;
export type RecordLoyaltyTransactionInput = z.infer<typeof recordLoyaltyTransactionInputSchema>;
