// src/hooks/useAuthActions.ts
//
// The Sign In / Sign Out entry points staff dashboards use, as callable
// functions rather than a login page component. StaffAuthGate.tsx is the
// only login UI on the whole site — customers never sign in (/order is a
// no-login guest checkout, see CheckoutPanel.tsx), so there's no signUp
// here; it was removed once components/ordering/AuthGate.tsx (its only
// caller) was.
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
