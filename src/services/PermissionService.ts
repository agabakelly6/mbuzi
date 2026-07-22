// src/services/PermissionService.ts
//
// The service-layer wrapper around lib/rbac.ts — same rules, but exposed
// as an injectable interface so a service that needs a permission check
// (e.g. OrderService.transitionStatus) depends on this contract rather
// than importing lib/rbac.ts directly. Keeps the RBAC *rules* in one place
// (lib/rbac.ts) while still allowing the *check itself* to be mocked in
// tests or swapped for a server-side policy call in Phase 3.
import type { RoleName } from "../types/role";
import type { Permission } from "../types/permission";

export interface PermissionCheckContext {
  actorId: string;
  actorBranchId: string | null;
  resourceBranchId?: string;
  resourceOwnerId?: string;
}

export interface PermissionService {
  can(role: RoleName, permission: Permission, context: PermissionCheckContext): boolean;
  permissionsForRole(role: RoleName): Permission[];
}
