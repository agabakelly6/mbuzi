// src/repositories/supabase/SupabaseBranchRepository.ts
//
// Read-only for now — branch management (create/update/delete) is a
// separate admin feature, not needed for order placement. Same treatment
// already given to SupabaseMenuRepository's write methods.
import type { BranchRepository } from "../BranchRepository";
import type { Branch } from "../../types/branch";
import type { ListOptions, Paginated, RepositoryResult } from "../shared";
import { supabase } from "../../lib/supabase/client";
import { dbError, mapDbError } from "../../lib/supabase/dbErrors";
import { mapBranchRow, type BranchRow } from "../../lib/supabase/mapBranchRow";

const DEFAULT_PAGE_SIZE = 20;

export const supabaseBranchRepository: BranchRepository = {
  async findById(id: string): Promise<RepositoryResult<Branch>> {
    const { data, error } = await supabase.from("branches").select("*").eq("id", id).maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapBranchRow(data as BranchRow), error: null };
  },

  async findBySlug(slug: string): Promise<RepositoryResult<Branch>> {
    const { data, error } = await supabase.from("branches").select("*").eq("slug", slug).maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapBranchRow(data as BranchRow), error: null };
  },

  async list(options?: ListOptions): Promise<RepositoryResult<Paginated<Branch>>> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("branches")
      .select("*", { count: "exact" })
      .order(options?.sortBy ?? "name", { ascending: options?.sortDirection !== "desc" })
      .range(from, to);
    if (error) return { data: null, error: mapDbError(error) };

    return {
      data: {
        items: ((data ?? []) as BranchRow[]).map(mapBranchRow),
        total: count ?? 0,
        page,
        pageSize,
      },
      error: null,
    };
  },

  async create(): Promise<RepositoryResult<Branch>> {
    return { data: null, error: dbError("not_implemented") };
  },

  async update(): Promise<RepositoryResult<Branch>> {
    return { data: null, error: dbError("not_implemented") };
  },

  async delete(): Promise<RepositoryResult<void>> {
    return { data: null, error: dbError("not_implemented") };
  },
};
