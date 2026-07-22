// src/services/supabase/SupabaseAuthService.ts
//
// Implements services/AuthService.ts's interface — nothing here changes
// that interface, this just fills its methods in against the Supabase
// client from lib/supabase/client.ts. `resolveUserFromSession` now prefers
// the real `public.users` table (Milestone 2's schema) as the source of
// truth, falling back to mapping straight from auth metadata only for the
// brief window right after signup before the on_auth_user_created trigger's
// row is guaranteed visible.
import type { Session } from "@supabase/supabase-js";
import type { AuthService } from "../AuthService";
import type { AuthSession, User } from "../../types/user";
import type { RepositoryResult } from "../../repositories/shared";
import type { SignInInput, SignUpStaffInput } from "../../validators/user.schema";
import { supabase } from "../../lib/supabase/client";
import { authError, mapAuthError } from "../../lib/supabase/authErrors";
import { mapSupabaseUserToDomainUser } from "../../lib/supabase/mapSupabaseUser";
import { supabaseUserRepository } from "../../repositories/supabase/SupabaseUserRepository";

export async function resolveUserFromSession(session: Session): Promise<RepositoryResult<User>> {
  const fromTable = await supabaseUserRepository.findById(session.user.id);
  if (fromTable.data) return fromTable;

  const fallback = mapSupabaseUserToDomainUser(session.user);
  return fallback ? { data: fallback, error: null } : { data: null, error: authError("missing_profile") };
}

async function toAuthSessionResult(session: Session): Promise<RepositoryResult<AuthSession>> {
  const resolved = await resolveUserFromSession(session);
  if (!resolved.data) return { data: null, error: resolved.error };

  return {
    data: {
      user: resolved.data,
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: new Date((session.expires_at ?? 0) * 1000).toISOString(),
    },
    error: null,
  };
}

export const supabaseAuthService: AuthService = {
  async signInWithPassword(input: SignInInput): Promise<RepositoryResult<AuthSession>> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error) return { data: null, error: mapAuthError(error) };
    if (!data.session) return { data: null, error: authError("unknown") };
    return toAuthSessionResult(data.session);
  },

  async signInWithOtp(phone: string): Promise<RepositoryResult<{ challengeId: string }>> {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) return { data: null, error: mapAuthError(error) };
    // Supabase's phone OTP flow verifies against the phone number itself,
    // not a separate server-issued challenge id — so the phone number
    // doubles as the "challengeId" this interface expects.
    return { data: { challengeId: phone }, error: null };
  },

  async verifyOtp(challengeId: string, code: string): Promise<RepositoryResult<AuthSession>> {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: challengeId,
      token: code,
      type: "sms",
    });
    if (error) return { data: null, error: mapAuthError(error) };
    if (!data.session) return { data: null, error: authError("unknown") };
    return toAuthSessionResult(data.session);
  },

  async inviteStaff(_input: SignUpStaffInput): Promise<RepositoryResult<User>> {
    // Requires Supabase's admin API (auth.admin.inviteUserByEmail), which
    // needs the service-role key — that key must never reach a browser
    // bundle, and this project has no server runtime yet (static output,
    // no adapter) to hold it safely.
    return { data: null, error: authError("not_implemented") };
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("[SupabaseAuthService.signOut]", error);
  },

  async getCurrentUser(): Promise<RepositoryResult<User | null>> {
    const { data, error } = await supabase.auth.getSession();
    if (error) return { data: null, error: mapAuthError(error) };
    if (!data.session) return { data: null, error: null }; // no session = signed out, not a failure
    return resolveUserFromSession(data.session);
  },

  async refreshSession(refreshToken: string): Promise<RepositoryResult<AuthSession>> {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error) return { data: null, error: mapAuthError(error) };
    if (!data.session) return { data: null, error: authError("session_expired") };
    return toAuthSessionResult(data.session);
  },
};
