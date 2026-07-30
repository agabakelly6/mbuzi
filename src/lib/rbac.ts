// src/lib/rbac.ts
//
// The single source of truth for "who can do what." Route guards, service-
// layer checks, and Postgres RLS policies should all trace back to this
// table; RLS re-implements the same rules at the database layer, it
// doesn't invent new ones.
//
// This is an allow-list, not a deny-list: anything not explicitly granted
// to a role is denied by default. That means a new resource added later
// (e.g. a future accounting entity) is inaccessible to every role until
// someone deliberately grants it here — nothing is "restricted," it simply
// starts at zero access, which is the safer default for a system with
// financial and multi-branch data.
import type { RoleName, RoleScope } from "../types/role";
import type { Permission, PermissionAction, PermissionResource } from "../types/permission";

export const ROLE_SCOPE: Record<RoleName, RoleScope> = {
  customer: "own",
  cashier: "branch",
  branch_manager: "branch",
  owner: "all",
};

function perm(resource: PermissionResource, ...actions: PermissionAction[]): Permission[] {
  return actions.map((action) => ({ resource, action }));
}

const ALL_RESOURCES: PermissionResource[] = [
  "order",
  "order_item",
  "menu_item",
  "table",
  "reservation",
  "delivery",
  "payment",
  "customer",
  "user",
  "branch",
  "promotion",
  "loyalty_member",
  "inventory_item",
  "notification",
  "analytics",
];

const ALL_ACTIONS: PermissionAction[] = [
  "create",
  "read",
  "update",
  "delete",
  "list",
  "assign",
  "cancel",
  "approve",
  "refund",
  "export",
];

/** What each role is granted. Notable restrictions (the complement of this list) are called out per role in docs/16_PLATFORM_ARCHITECTURE.md's RBAC table. */
export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  customer: [
    ...perm("order", "create", "read", "cancel"),
    ...perm("reservation", "create", "read", "cancel"),
    ...perm("menu_item", "read", "list"),
    ...perm("loyalty_member", "read"),
    ...perm("notification", "read"),
    // Added once customers.userId (types/customer.ts) linked a customer to
    // their own auth account — before that, "read/update your own profile"
    // had nothing to scope against.
    ...perm("customer", "read", "update"),
  ],

  // Absorbs what waiter/chef/rider used to do — an order is now handled by
  // whichever cashier is on shift from the moment it's accepted through to
  // completion/delivery, instead of being split across three staff roles.
  cashier: [
    ...perm("order", "create", "read", "list", "update", "cancel"),
    ...perm("payment", "create", "read", "list", "update"),
    ...perm("table", "read", "list", "update"),
    ...perm("reservation", "read", "list", "update"),
    ...perm("delivery", "read", "list", "update"),
    ...perm("customer", "create", "read", "list"),
    ...perm("menu_item", "read", "list"),
    ...perm("notification", "read"),
  ],

  branch_manager: [
    // Read-only on their own branch record — originally omitted entirely
    // (only owner had any `branch` grant), which made a branch_manager
    // unable to even read their own branch's row. Added deliberately, not
    // a redesign of scope: still branch-scoped like everything else here.
    ...perm("branch", "read"),
    ...perm("order", "create", "read", "list", "update", "cancel", "export"),
    ...perm("payment", "create", "read", "list", "update", "refund"),
    ...perm("table", "create", "read", "list", "update", "delete"),
    ...perm("reservation", "create", "read", "list", "update", "cancel"),
    ...perm("delivery", "read", "list", "update", "assign"),
    ...perm("menu_item", "create", "read", "list", "update", "delete"),
    ...perm("customer", "create", "read", "list", "update"),
    ...perm("user", "read", "list", "update"),
    ...perm("promotion", "create", "read", "list", "update"),
    ...perm("loyalty_member", "read", "list"),
    ...perm("inventory_item", "create", "read", "list", "update", "delete"),
    ...perm("analytics", "read", "export"),
    ...perm("notification", "read", "list"),
    // "create" added for staff hiring (invite-staff Edge Function) — "read/
    // list/update" already covered viewing the roster and firing (status ->
    // 'deactivated'). Scoped to cashier only by the Edge Function itself,
    // not by this flag — a branch_manager must never create another
    // branch_manager or owner account, so that check has to live
    // server-side where it can't be bypassed by calling the API directly.
    ...perm("user", "create"),
  ],

  // Owner / Super Admin — every action on every resource, every branch.
  // Deliberately generated rather than hand-listed so a newly added
  // resource or action is automatically covered for the one role that's
  // supposed to have unrestricted access.
  owner: ALL_RESOURCES.flatMap((resource) => perm(resource, ...ALL_ACTIONS)),
};

export function hasPermission(role: RoleName, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].some(
    (p) => p.resource === permission.resource && p.action === permission.action
  );
}

/**
 * Branch-scope check, separate from `hasPermission` on purpose: an action
 * can be permitted in principle (a cashier can update orders) yet still be
 * refused because the specific record belongs to a different branch.
 * Owner (`scope: "all"`) bypasses this; every other staff role must match
 * the branch they're assigned to. Customers use `isOwnResource` instead —
 * their scope is "own," not branch.
 */
export function isWithinScope(role: RoleName, actorBranchId: string | null, resourceBranchId: string): boolean {
  if (ROLE_SCOPE[role] === "all") return true;
  return actorBranchId !== null && actorBranchId === resourceBranchId;
}

/** Scope check for the "own" tier (customers) — an actor may only act on records that belong to them, regardless of branch. */
export function isOwnResource(actorId: string, resourceOwnerId: string | null): boolean {
  return resourceOwnerId !== null && actorId === resourceOwnerId;
}

/**
 * The one function a route guard or service call should actually use —
 * combines the resource/action grant with the appropriate scope check so
 * call sites don't have to remember to call both separately.
 */
export function can(
  role: RoleName,
  permission: Permission,
  context: { actorId: string; actorBranchId: string | null; resourceBranchId?: string; resourceOwnerId?: string }
): boolean {
  if (!hasPermission(role, permission)) return false;

  if (ROLE_SCOPE[role] === "own") {
    return isOwnResource(context.actorId, context.resourceOwnerId ?? null);
  }

  if (ROLE_SCOPE[role] === "branch") {
    return context.resourceBranchId !== undefined
      ? isWithinScope(role, context.actorBranchId, context.resourceBranchId)
      : true;
  }

  return true; // "all" scope — owner
}
