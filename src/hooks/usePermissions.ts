// src/hooks/usePermissions.ts
import { useAuth } from "./useAuth";
import { can as checkPermission } from "../lib/rbac";
import type { Permission } from "../types/permission";

export interface UsePermissionsResult {
  can(permission: Permission, resourceContext?: { resourceBranchId?: string; resourceOwnerId?: string }): boolean;
}

/** Thin wrapper around lib/rbac.ts's `can()` that fills in the acting user's id/role/branch from AuthContext automatically, so a component only has to supply what's specific to the record it's checking against. */
export function usePermissions(): UsePermissionsResult {
  const { user, role, branchId } = useAuth();

  function can(permission: Permission, resourceContext?: { resourceBranchId?: string; resourceOwnerId?: string }): boolean {
    if (!user || !role) return false;
    return checkPermission(role, permission, {
      actorId: user.id,
      actorBranchId: branchId,
      ...resourceContext,
    });
  }

  return { can };
}
