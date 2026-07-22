// src/repositories/supabase/SupabaseUserRepository.ts
//
// Now backed by the real `public.users` table (Milestone 2's schema) —
// every method here runs as the calling user's own session, so the
// migration's RLS policies (users_select_self, users_select_branch_manager,
// users_update_branch_manager, users_delete_owner) are what actually decide
// what a given caller can see or change, not this file. `invite` is the one
// method still unimplemented: creating a real login still needs Supabase's
// admin API (a service-role key), which this project has no safe place to
// hold yet (static output, no server runtime).
import type { UserRepository, UserListFilters } from "../UserRepository";
import type { User } from "../../types/user";
import type { Paginated, RepositoryResult } from "../shared";
import { supabase } from "../../lib/supabase/client";
import { authError, mapAuthError } from "../../lib/supabase/authErrors";
import { mapUsersRowToDomainUser, type UsersTableRow } from "../../lib/supabase/mapUsersRow";

const DEFAULT_PAGE_SIZE = 20;

export const supabaseUserRepository: UserRepository = {
  async findById(id: string): Promise<RepositoryResult<User>> {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
    if (error) return { data: null, error: mapAuthError(error) };
    if (!data) return { data: null, error: authError("missing_profile") };
    return { data: mapUsersRowToDomainUser(data as UsersTableRow), error: null };
  },

  async findByEmail(email: string): Promise<RepositoryResult<User>> {
    const { data, error } = await supabase.from("users").select("*").eq("email", email).maybeSingle();
    if (error) return { data: null, error: mapAuthError(error) };
    if (!data) return { data: null, error: authError("missing_profile") };
    return { data: mapUsersRowToDomainUser(data as UsersTableRow), error: null };
  },

  async list(filters?: UserListFilters): Promise<RepositoryResult<Paginated<User>>> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from("users").select("*", { count: "exact" });
    if (filters?.branchId) query = query.eq("branch_id", filters.branchId);
    if (filters?.role) query = query.eq("role", filters.role);
    if (filters?.status) query = query.eq("status", filters.status);
    query = query
      .order(filters?.sortBy ?? "created_at", { ascending: filters?.sortDirection !== "desc" })
      .range(from, to);

    const { data, error, count } = await query;
    if (error) return { data: null, error: mapAuthError(error) };

    return {
      data: {
        items: ((data ?? []) as UsersTableRow[]).map(mapUsersRowToDomainUser),
        total: count ?? 0,
        page,
        pageSize,
      },
      error: null,
    };
  },

  async invite(): Promise<RepositoryResult<User>> {
    return { data: null, error: authError("not_implemented") };
  },

  async update(id: string, changes): Promise<RepositoryResult<User>> {
    const patch: Record<string, unknown> = {};
    if (changes.fullName !== undefined) patch.full_name = changes.fullName;
    if (changes.phone !== undefined) patch.phone = changes.phone;
    if (changes.role !== undefined) patch.role = changes.role;
    if (changes.branchId !== undefined) patch.branch_id = changes.branchId;
    if (changes.status !== undefined) patch.status = changes.status;
    if (changes.avatarUrl !== undefined) patch.avatar_url = changes.avatarUrl;

    const { data, error } = await supabase.from("users").update(patch).eq("id", id).select("*").maybeSingle();
    if (error) return { data: null, error: mapAuthError(error) };
    if (!data) return { data: null, error: authError("unauthorized") };
    return { data: mapUsersRowToDomainUser(data as UsersTableRow), error: null };
  },

  async suspend(id: string): Promise<RepositoryResult<User>> {
    const { data, error } = await supabase
      .from("users")
      .update({ status: "suspended" })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) return { data: null, error: mapAuthError(error) };
    if (!data) return { data: null, error: authError("unauthorized") };
    return { data: mapUsersRowToDomainUser(data as UsersTableRow), error: null };
  },

  async delete(id: string): Promise<RepositoryResult<void>> {
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) return { data: null, error: mapAuthError(error) };
    return { data: null, error: null };
  },
};
