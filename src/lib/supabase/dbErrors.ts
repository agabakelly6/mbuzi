// src/lib/supabase/dbErrors.ts
//
// General-purpose mapper for Postgres/PostgREST errors surfaced through
// supabase-js — same approach as lib/supabase/authErrors.ts (log the real
// error, return a fixed safe message per known code), but for data-layer
// operations rather than auth specifically. Repositories/services outside
// auth should use this one.
import type { RepositoryError } from "../../repositories/shared";

export type DbErrorCode =
  | "not_found"
  | "conflict"
  | "forbidden"
  | "validation_error"
  | "network_error"
  | "not_implemented"
  | "unknown";

const MESSAGES: Record<DbErrorCode, string> = {
  not_found: "That record couldn't be found.",
  conflict: "That conflicts with an existing record.",
  forbidden: "You don't have permission to do that.",
  validation_error: "That request wasn't valid.",
  network_error: "Couldn't reach the server. Check your connection and try again.",
  not_implemented: "This isn't available yet.",
  unknown: "Something went wrong. Please try again.",
};

export function dbError(code: DbErrorCode): RepositoryError {
  return { code, message: MESSAGES[code] };
}

/** Classifies a Postgres/PostgREST error into one of our known codes — see https://postgrest.org/en/stable/references/errors.html for the code list this pattern-matches against. Anything unrecognized falls back to "unknown" rather than leaking the original message to the caller. */
export function mapDbError(error: unknown): RepositoryError {
  console.error("[db]", error);

  if (error instanceof TypeError) return dbError("network_error");

  const code = (error as { code?: string } | null | undefined)?.code ?? "";
  const message = (error as { message?: string } | null | undefined)?.message ?? "";

  if (code === "PGRST116") return dbError("not_found"); // "no rows" for .single()/.maybeSingle()
  if (code === "23505") return dbError("conflict"); // unique_violation
  if (code === "23503") return dbError("validation_error"); // foreign_key_violation
  if (code === "42501" || code === "PGRST301") return dbError("forbidden"); // RLS denial / JWT issue
  if (/not found/i.test(message)) return dbError("not_found");

  return dbError("unknown");
}
