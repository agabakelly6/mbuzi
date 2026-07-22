// src/lib/supabase/mapUsersRow.ts
//
// Maps a public.users table row (snake_case, as returned by supabase-js)
// to the domain `User` type. Used now that SupabaseUserRepository queries
// the real table (Milestone 2's schema) directly, rather than deriving
// solely from auth metadata — see mapSupabaseUser.ts, still used as a
// fallback for the brief window right after signup before this row is
// guaranteed to exist.
import type { User, UserStatus } from "../../types/user";
import type { RoleName } from "../../types/role";

export interface UsersTableRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: RoleName;
  branch_id: string | null;
  status: UserStatus;
  avatar_url: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export function mapUsersRowToDomainUser(row: UsersTableRow): User {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    branchId: row.branch_id,
    status: row.status,
    avatarUrl: row.avatar_url ?? undefined,
    lastLoginAt: row.last_login_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
