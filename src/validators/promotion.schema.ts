// src/validators/promotion.schema.ts
import { z } from "zod";
import { isoDateTimeSchema, moneySchema, nonEmptyStringSchema, uuidSchema } from "./shared";

export const promotionTypeSchema = z.enum(["percentage_discount", "fixed_discount", "bogo", "free_delivery"]);

export const createPromotionInputSchema = z.object({
  branchId: uuidSchema,
  code: z.string().regex(/^[A-Z0-9_-]{3,20}$/, "Uppercase letters, numbers, hyphens, underscores only"),
  name: nonEmptyStringSchema,
  type: promotionTypeSchema,
  value: z.number().nonnegative(),
  startsAt: isoDateTimeSchema,
  endsAt: isoDateTimeSchema,
  minOrderValue: moneySchema.optional(),
  usageLimit: z.number().int().positive().optional(),
});

export const updatePromotionInputSchema = createPromotionInputSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreatePromotionInput = z.infer<typeof createPromotionInputSchema>;
export type UpdatePromotionInput = z.infer<typeof updatePromotionInputSchema>;
