// src/hooks/useAuth.ts
import { useAuthContext } from "../contexts/AuthContext";
import type { User } from "../types/user";
import type { RoleName } from "../types/role";

export interface UseAuthResult {
  user: User | null;
  isAuthenticated: boolean;
  role: RoleName | null;
  branchId: string | null;
}

export function useAuth(): UseAuthResult {
  const { user, status } = useAuthContext();
  return {
    user,
    isAuthenticated: status === "authenticated" && user !== null,
    role: user?.role ?? null,
    branchId: user?.branchId ?? null,
  };
}
