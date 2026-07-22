// src/validators/reservation.schema.ts
import { z } from "zod";
import { isoDateTimeSchema, nonEmptyStringSchema, phoneSchema, uuidSchema } from "./shared";

export const reservationStatusSchema = z.enum(["requested", "confirmed", "seated", "completed", "no_show", "cancelled"]);

export const createReservationInputSchema = z.object({
  branchId: uuidSchema,
  customerId: uuidSchema.nullable(),
  guestName: nonEmptyStringSchema,
  guestPhone: phoneSchema,
  partySize: z.number().int().positive().max(50),
  reservedFor: isoDateTimeSchema,
  specialRequests: z.string().max(500).optional(),
});

export const updateReservationStatusInputSchema = z.object({
  status: reservationStatusSchema,
});

export const assignReservationTableInputSchema = z.object({
  tableId: uuidSchema,
});

export type CreateReservationInput = z.infer<typeof createReservationInputSchema>;
export type UpdateReservationStatusInput = z.infer<typeof updateReservationStatusInputSchema>;
export type AssignReservationTableInput = z.infer<typeof assignReservationTableInputSchema>;
