// src/types/role.ts
//
// Four roles. Waiter, chef, and rider were removed — a cashier now
// handles an order end-to-end (accept, prep, serve/dispatch, complete)
// instead of splitting that lifecycle across three separate staff roles,
// and branch_manager/owner are unchanged. "Front Desk" and "Cashier" from
// the product brief were already the same role here; "Super Admin" and
// "Owner" are likewise the same role (`owner`): the one platform-wide,
// every-branch scope.

export type RoleName = "customer" | "cashier" | "branch_manager" | "owner";

export type RoleScope = "all" | "branch" | "own";

export interface Role {
  name: RoleName;
  label: string;
  description: string;
  /** "all" = every branch, platform-wide (owner only). "branch" = the staff member's one assigned branch. "own" = customer-only, scoped to their own records regardless of branch. */
  scope: RoleScope;
}

export const ROLES: Record<RoleName, Role> = {
  customer: {
    name: "customer",
    label: "Customer",
    description: "Places orders, books tables, and manages their own loyalty account.",
    scope: "own",
  },
  cashier: {
    name: "cashier",
    label: "Cashier",
    description: "Handles every incoming order end-to-end — accept, prep, serve or dispatch, payment, and completion — plus billing, tables, and reservations at one branch.",
    scope: "branch",
  },
  branch_manager: {
    name: "branch_manager",
    label: "Branch Manager",
    description: "Full operational control of one branch — staff, menu, promotions, inventory, and reporting.",
    scope: "branch",
  },
  owner: {
    name: "owner",
    label: "Owner / Super Admin",
    description: "Platform-wide control across every branch — the only role not bound by branch scope.",
    scope: "all",
  },
};
