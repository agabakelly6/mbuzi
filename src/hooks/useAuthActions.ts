// src/hooks/useAuthActions.ts
//
// The Sign In / Sign Out entry points this milestone asks for, as callable
// functions rather than a login page — no login form/UI exists yet (out of
// scope: "no dashboards"). A future login form calls `signIn` directly;
// nothing about how AuthContext or useAuth work needs to change when it's
// built.
//
// `signUp` is a later addition, for the customer-facing ordering page —
// self-service registration, distinct from AuthService.inviteStaff (an
// admin inviting a staff member). Calls supabase.auth.signUp directly
// rather than adding a method to the AuthService interface, keeping it at
// the same "hook-level convenience" layer as signIn/signOut above.
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase/client";
import { supabaseAuthService, resolveUserFromSession } from "../services/supabase/SupabaseAuthService";
import { authError, mapAuthError } from "../lib/supabase/authErrors";
import type { SignInInput, SignUpCustomerInput } from "../validators/user.schema";
import type { RepositoryResult } from "../repositories/shared";
import type { AuthSession } from "../types/user";

export interface UseAuthActionsResult {
  signIn(input: SignInInput): Promise<RepositoryResult<AuthSession>>;
  signUp(input: SignUpCustomerInput): Promise<RepositoryResult<AuthSession>>;
  signOut(): Promise<void>;
}

export function useAuthActions(): UseAuthActionsResult {
  const { setUser, setStatus } = useAuthContext();

  async function signIn(input: SignInInput): Promise<RepositoryResult<AuthSession>> {
    setStatus("authenticating");
    const result = await supabaseAuthService.signInWithPassword(input);
    if (result.error || !result.data) {
      setStatus("error");
      return result;
    }
    setUser(result.data.user);
    setStatus("authenticated");
    return result;
  }

  async function signUp(input: SignUpCustomerInput): Promise<RepositoryResult<AuthSession>> {
    setStatus("authenticating");
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        // role omitted deliberately — the on_auth_user_created DB trigger
        // defaults every signup with no role metadata to 'customer'.
        data: { full_name: input.fullName, phone: input.phone },
      },
    });
    if (error) {
      setStatus("error");
      return { data: null, error: mapAuthError(error) };
    }
    if (!data.session) {
      // The Supabase project requires email confirmation before a session
      // is issued — not a failure, just not signed in yet.
      setStatus("unauthenticated");
      return { data: null, error: authError("confirmation_required") };
    }

    const resolved = await resolveUserFromSession(data.session);
    if (!resolved.data) {
      setStatus("error");
      return { data: null, error: resolved.error };
    }
    setUser(resolved.data);
    setStatus("authenticated");
    return {
      data: {
        user: resolved.data,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: new Date((data.session.expires_at ?? 0) * 1000).toISOString(),
      },
      error: null,
    };
  }

  async function signOut(): Promise<void> {
    await supabaseAuthService.signOut();
    setUser(null);
    setStatus("unauthenticated");
  }

  return { signIn, signUp, signOut };
}
