// src/contexts/AuthContext.tsx
//
// Backend-agnostic session boundary. Holds whatever AuthService.getCurrentUser()
// last resolved — nothing here knows about Supabase or any other provider.
// Phase 3 wires a real AuthService implementation into whatever calls
// setUser/setStatus (a top-level effect, most likely); every consumer below
// (useAuth, usePermissions, future route guards) keeps working unchanged.
import { createContext, useContext, useState, type ReactNode } from "react";
import type { User } from "../types/user";
import type { AuthFlowState } from "../lib/state-machines";

export interface AuthContextValue {
  user: User | null;
  status: AuthFlowState;
  setUser: (user: User | null) => void;
  setStatus: (status: AuthFlowState) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthFlowState>("idle");

  return <AuthContext.Provider value={{ user, status, setUser, setStatus }}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within an AuthProvider");
  return ctx;
}
