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
  // Empty string allowed, not just a valid URL — matches menu_items.image_url's
  // own "not null default ''" column (no image hosting is wired up, so a
  // branch manager leaving this blank when adding a dish is the normal
  // case, not an error). z.url() alone rejected "" outright, a silent
  // validation failure caught via a real browser test, same bug class as
  // uuidSchema's.
  imageUrl: z.literal("").or(z.url()),
  isFeatured: z.boolean().default(false),
  isChefPick: z.boolean().default(false),
  linkedInventoryItemId: uuidSchema.optional(),
});

export const updateMenuItemInputSchema = createMenuItemInputSchema.partial().extend({
  availability: menuItemAvailabilitySchema.optional(),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemInputSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemInputSchema>;
