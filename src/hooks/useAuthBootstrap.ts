// src/hooks/useAuthBootstrap.ts
//
// The "top-level effect" AuthContext.tsx's own header comment predicts:
// AuthContext stays completely backend-agnostic; this is what wires it to
// Supabase without AuthContext ever importing it. Mount once, inside an
// <AuthProvider>, near the root of whatever screen tree needs auth state —
// there's no such screen yet in this milestone (no dashboard), so this
// hook has no caller today; it's ready for the one the next milestone adds.
//
// Handles session persistence and refresh by *reflecting* them, not by
// performing them — supabase-js already persists the session to
// localStorage and silently refreshes the access token on its own timer;
// onAuthStateChange just tells us when that happened so AuthContext can
// catch up.
import { useEffect } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase/client";
import { supabaseAuthService, resolveUserFromSession } from "../services/supabase/SupabaseAuthService";

export function useAuthBootstrap(): void {
  const { setUser, setStatus } = useAuthContext();

  useEffect(() => {
    let isMounted = true;

    setStatus("authenticating");
    supabaseAuthService.getCurrentUser().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        setUser(null);
        setStatus("error");
        return;
      }
      setUser(data);
      setStatus(data ? "authenticated" : "unauthenticated");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        setStatus("unauthenticated");
        return;
      }

      resolveUserFromSession(session).then(({ data, error }) => {
        if (!isMounted) return;
        if (error || !data) {
          setUser(null);
          setStatus("error");
          return;
        }
        setUser(data);
        setStatus("authenticated");
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setStatus]);
}
