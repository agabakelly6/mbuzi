// src/validators/inventory.schema.ts
import { z } from "zod";
import { nonEmptyStringSchema, uuidSchema } from "./shared";

export const inventoryUnitSchema = z.enum(["kg", "litre", "piece", "pack"]);

export const createInventoryItemInputSchema = z.object({
  branchId: uuidSchema,
  name: nonEmptyStringSchema,
  unit: inventoryUnitSchema,
  quantityOnHand: z.number().nonnegative(),
  reorderThreshold: z.number().nonnegative(),
});

export const adjustInventoryQuantityInputSchema = z.object({
  delta: z.number(),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemInputSchema>;
export type AdjustInventoryQuantityInput = z.infer<typeof adjustInventoryQuantityInputSchema>;
