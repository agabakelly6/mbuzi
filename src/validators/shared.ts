// src/validators/shared.ts
//
// Common Zod primitives every entity schema below is built from, so a
// phone/money/uuid rule only has to be right in one place. These validate
// *input* (what a form or API request body looks like before it becomes a
// domain record) — not full entities, which include server-generated
// fields (id, createdAt/updatedAt) a client never submits. See
// types/base.ts for the equivalent TypeScript-only shapes these mirror.
import { z } from "zod";

export const uuidSchema = z.uuid();
export const isoDateTimeSchema = z.iso.datetime({ offset: true });
/** Whole UGX units, matching types/base.ts's `Money` alias. */
export const moneySchema = z.number().int().nonnegative();
export const phoneSchema = z.string().regex(/^\+?[0-9]{9,15}$/, "Enter a valid phone number");
export const emailSchema = z.email();
export const nonEmptyStringSchema = z.string().trim().min(1);
