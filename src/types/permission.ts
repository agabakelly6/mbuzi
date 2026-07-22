// src/types/permission.ts
//
// The resource/action vocabulary the whole RBAC system (lib/rbac.ts) is
// built from. Kept as closed unions rather than free-form strings so a
// typo in a permission check fails at compile time instead of silently
// always returning false.
import type { RoleName, RoleScope } from "./role";

export type PermissionResource =
  | "order"
  | "order_item"
  | "menu_item"
  | "table"
  | "reservation"
  | "kitchen_ticket"
  | "delivery"
  | "payment"
  | "customer"
  | "user"
  | "branch"
  | "promotion"
  | "loyalty_member"
  | "inventory_item"
  | "notification"
  | "analytics";

export type PermissionAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "list"
  | "assign"
  | "cancel"
  | "approve"
  | "refund"
  | "export";

export interface Permission {
  resource: PermissionResource;
  action: PermissionAction;
}

/** Descriptive record of a role's full grant — what lib/rbac.ts's ROLE_PERMISSIONS resolves to for one role, useful for admin UIs that need to display "what can a Waiter do" rather than just check it. */
export interface RolePermissions {
  role: RoleName;
  scope: RoleScope;
  allowed: Permission[];
}
