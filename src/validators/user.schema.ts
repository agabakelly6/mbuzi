// src/validators/user.schema.ts
import { z } from "zod";
import { emailSchema, nonEmptyStringSchema, phoneSchema, uuidSchema } from "./shared";

export const roleNameSchema = z.enum([
  "customer",
  "waiter",
  "cashier",
  "chef",
  "rider",
  "branch_manager",
  "owner",
]);

export const signInInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(8),
});

/** Self-service customer registration — distinct from signUpStaffInputSchema below, which is an admin inviting a staff member, not someone registering themselves. Role is never accepted here; the on_auth_user_created DB trigger defaults every new signup to 'customer' when no role is set. */
export const signUpCustomerInputSchema = z.object({
  fullName: nonEmptyStringSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: z.string().min(8),
});

export const signUpStaffInputSchema = z.object({
  fullName: nonEmptyStringSchema,
  email: emailSchema,
  phone: phoneSchema,
  role: roleNameSchema,
  /** Required for every role except owner, enforced with `.refine` below rather than left implicit. */
  branchId: uuidSchema.nullable(),
}).refine((value) => value.role === "owner" || value.branchId !== null, {
  message: "branchId is required for every role except owner",
  path: ["branchId"],
});

export type SignInInput = z.infer<typeof signInInputSchema>;
export type SignUpCustomerInput = z.infer<typeof signUpCustomerInputSchema>;
export type SignUpStaffInput = z.infer<typeof signUpStaffInputSchema>;
