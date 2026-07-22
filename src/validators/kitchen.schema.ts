// src/validators/kitchen.schema.ts
import { z } from "zod";
import { uuidSchema } from "./shared";

export const kitchenTicketStatusSchema = z.enum(["queued", "in_progress", "ready", "served", "cancelled"]);

export const updateKitchenTicketStatusInputSchema = z.object({
  status: kitchenTicketStatusSchema,
});

export const updateKitchenTicketItemStatusInputSchema = z.object({
  orderItemId: uuidSchema,
  status: kitchenTicketStatusSchema,
});

export const assignChefInputSchema = z.object({
  chefId: uuidSchema,
});

export type UpdateKitchenTicketStatusInput = z.infer<typeof updateKitchenTicketStatusInputSchema>;
export type UpdateKitchenTicketItemStatusInput = z.infer<typeof updateKitchenTicketItemStatusInputSchema>;
export type AssignChefInput = z.infer<typeof assignChefInputSchema>;
