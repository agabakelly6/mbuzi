// src/validators/branch.schema.ts
import { z } from "zod";
import { emailSchema, nonEmptyStringSchema, phoneSchema } from "./shared";

export const branchStatusSchema = z.enum(["active", "coming-soon", "suspended", "closed"]);

export const branchSettingsSchema = z.object({
  timezone: nonEmptyStringSchema,
  currency: z.string().length(3),
  orderingEnabled: z.boolean(),
  deliveryEnabled: z.boolean(),
  reservationsEnabled: z.boolean(),
  taxRatePercent: z.number().min(0).max(100),
});

export const createBranchInputSchema = z.object({
  name: nonEmptyStringSchema,
  slug: z.string().regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  city: nonEmptyStringSchema,
  address: nonEmptyStringSchema,
  phone: phoneSchema,
  whatsapp: phoneSchema,
  email: emailSchema,
  status: branchStatusSchema,
  managerId: z.uuid().nullable(),
  settings: branchSettingsSchema,
});

export const updateBranchInputSchema = createBranchInputSchema.partial();

export type CreateBranchInput = z.infer<typeof createBranchInputSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchInputSchema>;
