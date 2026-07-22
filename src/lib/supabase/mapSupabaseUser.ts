// src/lib/supabase/mapSupabaseUser.ts
//
// Bridges Supabase Auth's own user object to our domain `User`
// (types/user.ts). There is no `profiles` table yet (a later milestone),
// so fullName/role/branchId live in Supabase Auth's user_metadata — set
// at invite/signup time — instead of a joined table row. Returns null
// when required profile metadata is missing so callers can surface a
// "missing_profile" error instead of constructing a half-valid User.
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { RoleName } from "../../types/role";
import type { User } from "../../types/user";

const VALID_ROLES: readonly RoleName[] = [
  "customer",
  "waiter",
  "cashier",
  "chef",
  "rider",
  "branch_manager",
  "owner",
];

function isRoleName(value: unknown): value is RoleName {
  return typeof value === "string" && (VALID_ROLES as readonly string[]).includes(value);
}

export function mapSupabaseUserToDomainUser(authUser: SupabaseAuthUser): User | null {
  const metadata = authUser.user_metadata ?? {};
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name : null;
  // Anyone who's authenticated but hasn't been assigned a staff role yet is
  // a customer — the safe default (RBAC's "own" scope) rather than
  // rejecting a guest who just created an account.
  const role: RoleName = isRoleName(metadata.role) ? metadata.role : "customer";
  const branchId = typeof metadata.branch_id === "string" ? metadata.branch_id : null;

  if (!fullName || !authUser.email) {
    return null;
  }

  // Every branch-scoped staff role (types/role.ts) must carry a branchId —
  // a staff account without one is an incomplete profile, not a valid owner/customer.
  if (role !== "owner" && role !== "customer" && !branchId) {
    return null;
  }

  return {
    id: authUser.id,
    fullName,
    email: authUser.email,
    phone: authUser.phone ?? "",
    role,
    branchId,
    status: "active",
    lastLoginAt: authUser.last_sign_in_at ?? undefined,
    createdAt: authUser.created_at,
    updatedAt: authUser.updated_at ?? authUser.created_at,
  };
}
