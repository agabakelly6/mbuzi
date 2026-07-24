// src/validators/shared.ts
//
// Common Zod primitives every entity schema below is built from, so a
// phone/money/uuid rule only has to be right in one place. These validate
// *input* (what a form or API request body looks like before it becomes a
// domain record) — not full entities, which include server-generated
// fields (id, createdAt/updatedAt) a client never submits. See
// types/base.ts for the equivalent TypeScript-only shapes these mirror.
import { z } from "zod";

// z.guid() not z.uuid() — Zod v4's z.uuid() strictly enforces the RFC 4122
// version/variant nibbles, but this project's seed data uses simplified
// ids like "00000000-0000-0000-0000-000000000001" for branches/roles
// that are shape-valid but not real v1-8 UUIDs. z.uuid() rejected them
// outright (silently broke every branch-manager form client-side —
// create promotion, create menu item, hire staff, place a guest order —
// caught only via an actual Playwright run through the real UI, not the
// curl-based testing used everywhere else this session, since curl calls
// bypass this validation layer entirely). z.guid() checks the general
// 8-4-4-4-12 hex shape without enforcing version bits — accepts both real
// gen_random_uuid() values and this project's seed ids.
export const uuidSchema = z.guid();
export const isoDateTimeSchema = z.iso.datetime({ offset: true });
/** Whole UGX units, matching types/base.ts's `Money` alias. */
export const moneySchema = z.number().int().nonnegative();
export const phoneSchema = z.string().regex(/^\+?[0-9]{9,15}$/, "Enter a valid phone number");
export const emailSchema = z.email();
export const nonEmptyStringSchema = z.string().trim().min(1);
