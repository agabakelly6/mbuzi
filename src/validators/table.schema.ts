// src/validators/table.schema.ts
import { z } from "zod";
import { nonEmptyStringSchema, uuidSchema } from "./shared";

export const tableStatusSchema = z.enum(["available", "occupied", "reserved", "needs_cleaning", "out_of_service"]);

export const createTableInputSchema = z.object({
  branchId: uuidSchema,
  label: nonEmptyStringSchema,
  seats: z.number().int().positive(),
});

export const updateTableStatusInputSchema = z.object({
  status: tableStatusSchema,
});

export type CreateTableInput = z.infer<typeof createTableInputSchema>;
export type UpdateTableStatusInput = z.infer<typeof updateTableStatusInputSchema>;
