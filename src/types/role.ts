// src/types/role.ts
//
// The seven roles the platform is designed around. "Front Desk" and
// "Cashier" from the product brief are the same role here (`cashier`) —
// front-of-house billing/order-entry duties, one title. "Super Admin" and
// "Owner" are likewise the same role (`owner`): the one platform-wide,
// every-branch scope. Collapsing synonyms here keeps every downstream
// table (RBAC matrix, repositories, RLS policies later) keyed on exactly
// seven values instead of nine with two pairs that always behave identically.

export type RoleName =
  | "customer"
  | "waiter"
  | "cashier"
  | "chef"
  | "rider"
  | "branch_manager"
  | "owner";

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
    description: "Places orders, books tables, tracks deliveries, and manages their own loyalty account.",
    scope: "own",
  },
  waiter: {
    name: "waiter",
    label: "Waiter",
    description: "Takes dine-in orders, manages tables, and coordinates service on the floor of one branch.",
    scope: "branch",
  },
  cashier: {
    name: "cashier",
    label: "Front Desk / Cashier",
    description: "Handles order entry, billing, payments, and walk-in customer registration at one branch.",
    scope: "branch",
  },
  chef: {
    name: "chef",
    label: "Chef",
    description: "Runs the kitchen display, progresses tickets, and flags menu items as out of stock.",
    scope: "branch",
  },
  rider: {
    name: "rider",
    label: "Rider",
    description: "Handles delivery orders assigned to them, from pickup to drop-off.",
    scope: "branch",
  },
  branch_manager: {
    name: "branch_manager",
    label: "Branch Manager",
    description: "Full operational control of one branch — staff, menu, promotions, and reporting.",
    scope: "branch",
  },
  owner: {
    name: "owner",
    label: "Owner / Super Admin",
    description: "Platform-wide control across every branch — the only role not bound by branch scope.",
    scope: "all",
  },
};
