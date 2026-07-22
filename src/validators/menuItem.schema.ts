// src/validators/menuItem.schema.ts
import { z } from "zod";
import { moneySchema, nonEmptyStringSchema, uuidSchema } from "./shared";

export const menuItemAvailabilitySchema = z.enum(["available", "out_of_stock", "hidden"]);

export const menuItemVariationInputSchema = z.object({
  label: nonEmptyStringSchema,
  price: moneySchema,
});

export const createMenuItemInputSchema = z.object({
  branchId: uuidSchema,
  name: nonEmptyStringSchema,
  description: z.string().max(500),
  categoryId: uuidSchema,
  basePrice: moneySchema,
  variations: z.array(menuItemVariationInputSchema).default([]),
  imageUrl: z.url(),
  isFeatured: z.boolean().default(false),
  isChefPick: z.boolean().default(false),
  linkedInventoryItemId: uuidSchema.optional(),
});

export const updateMenuItemInputSchema = createMenuItemInputSchema.partial().extend({
  availability: menuItemAvailabilitySchema.optional(),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemInputSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemInputSchema>;
