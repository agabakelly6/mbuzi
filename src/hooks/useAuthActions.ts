// src/hooks/useAuthActions.ts
//
// The Sign In / Sign Out entry points this milestone asks for, as callable
// functions rather than a login page — no login form/UI exists yet (out of
// scope: "no dashboards"). A future login form calls `signIn` directly;
// nothing about how AuthContext or useAuth work needs to change when it's
// built.
import { useAuthContext } from "../contexts/AuthContext";
import { supabaseAuthService } from "../services/supabase/SupabaseAuthService";
import type { SignInInput } from "../validators/user.schema";
import type { RepositoryResult } from "../repositories/shared";
import type { AuthSession } from "../types/user";

export interface UseAuthActionsResult {
  signIn(input: SignInInput): Promise<RepositoryResult<AuthSession>>;
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

  async function signOut(): Promise<void> {
    await supabaseAuthService.signOut();
    setUser(null);
    setStatus("unauthenticated");
  }

  return { signIn, signOut };
}
