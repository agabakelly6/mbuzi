// src/validators/customer.schema.ts
import { z } from "zod";
import { emailSchema, nonEmptyStringSchema, phoneSchema, uuidSchema } from "./shared";

export const createCustomerInputSchema = z.object({
  fullName: nonEmptyStringSchema,
  phone: phoneSchema,
  email: emailSchema.optional(),
  defaultDeliveryAddress: z.string().min(5).optional(),
  preferredBranchId: uuidSchema.optional(),
  marketingOptIn: z.boolean().default(false),
});

export const updateCustomerInputSchema = createCustomerInputSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerInputSchema>;
