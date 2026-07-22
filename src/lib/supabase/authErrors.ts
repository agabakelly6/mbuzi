// src/lib/supabase/authErrors.ts
//
// Maps whatever Supabase/the network throws into the RepositoryError shape
// every repository/service already returns (repositories/shared.ts) —
// production-safe by construction: the raw error (which can contain
// internal detail not meant for an end user) is logged for debugging and
// never returned to the caller; only a fixed, generic message per known
// code is.
import type { RepositoryError } from "../../repositories/shared";

export type AuthErrorCode =
  | "invalid_credentials"
  | "session_expired"
  | "unauthorized"
  | "missing_profile"
  | "network_error"
  | "not_implemented"
  | "unknown";

const MESSAGES: Record<AuthErrorCode, string> = {
  invalid_credentials: "The email or password you entered is incorrect.",
  session_expired: "Your session has expired. Please sign in again.",
  unauthorized: "You don't have permission to do that.",
  missing_profile: "Your account is missing required profile information. Contact an administrator.",
  network_error: "Couldn't reach the server. Check your connection and try again.",
  not_implemented: "This isn't available yet.",
  unknown: "Something went wrong. Please try again.",
};

export function authError(code: AuthErrorCode): RepositoryError {
  return { code, message: MESSAGES[code] };
}

/** Classifies a Supabase Auth error (or a raw network failure) into one of our known codes. Anything unrecognized falls back to "unknown" rather than leaking the original message to the caller. */
export function mapAuthError(error: unknown): RepositoryError {
  console.error("[auth]", error);

  if (error instanceof TypeError) {
    // fetch() itself throwing (offline, DNS failure, CORS) rather than
    // Supabase returning a structured API error.
    return authError("network_error");
  }

  const status = (error as { status?: number } | null | undefined)?.status;
  const message = (error as { message?: string } | null | undefined)?.message ?? "";

  if (/invalid login credentials/i.test(message)) return authError("invalid_credentials");
  if (/expired|invalid refresh token|refresh_token_not_found/i.test(message)) return authError("session_expired");
  if (status === 401 || status === 403) return authError("unauthorized");

  return authError("unknown");
}
