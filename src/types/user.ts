// src/types/user.ts
//
// `User` is every non-customer platform account (waiter, cashier, chef,
// rider, branch manager, owner) plus, once auth exists, an authenticated
// customer too — see the note on `Customer` in customer.ts for why that
// entity stays separate anyway. `AuthSession` is deliberately not just
// `User` — it carries token/expiry data that belongs to whichever auth
// provider issues it (Supabase Auth today, anything else tomorrow),
// without that provider's concerns leaking into the domain User shape.
import type { Entity } from "./base";
import type { RoleName } from "./role";

export type UserStatus = "active" | "invited" | "suspended" | "deactivated";

export interface User extends Entity {
  fullName: string;
  email: string;
  phone: string;
  role: RoleName;
  /** Required for every branch-scoped staff role; null for `owner` (platform-wide) and `customer` (not branch staff). */
  branchId: string | null;
  status: UserStatus;
  avatarUrl?: string;
  lastLoginAt?: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  /** ISO-8601 expiry of `accessToken`. */
  expiresAt: string;
}
