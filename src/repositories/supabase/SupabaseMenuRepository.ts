// src/repositories/supabase/SupabaseMenuRepository.ts
//
// Read methods are fully implemented — needed for order processing to
// resolve a menu item's name/price when placing an order, and for future
// menu-browsing work to reuse as-is. Write methods (create/update/delete)
// are menu-management, a separate feature from order processing; they're
// stubbed as not_implemented rather than half-built, matching the same
// scoping already applied to SupabaseUserRepository/SupabaseAuthService's
// invite() in earlier milestones.
import type { MenuRepository, MenuItemListFilters } from "../MenuRepository";
import type { MenuItem, MenuCategoryRecord } from "../../types/menu-item";
import type { Paginated, RepositoryResult } from "../shared";
import { supabase } from "../../lib/supabase/client";
import { dbError, mapDbError } from "../../lib/supabase/dbErrors";
import { mapMenuItemRow, mapMenuCategoryRow, type MenuItemRow, type MenuCategoryRow } from "../../lib/supabase/mapMenuItemRow";

const DEFAULT_PAGE_SIZE = 20;

export const supabaseMenuRepository: MenuRepository = {
  async findItemById(id: string): Promise<RepositoryResult<MenuItem>> {
    const { data, error } = await supabase.from("menu_items").select("*").eq("id", id).maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapMenuItemRow(data as MenuItemRow), error: null };
  },

  async listItems(filters?: MenuItemListFilters): Promise<RepositoryResult<Paginated<MenuItem>>> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from("menu_items").select("*", { count: "exact" });
    if (filters?.branchId) query = query.eq("branch_id", filters.branchId);
    if (filters?.categoryId) query = query.eq("category_id", filters.categoryId);
    if (filters?.availability) query = query.eq("availability", filters.availability);
    query = query
      .order(filters?.sortBy ?? "name", { ascending: filters?.sortDirection !== "desc" })
      .range(from, to);

    const { data, error, count } = await query;
    if (error) return { data: null, error: mapDbError(error) };

    return {
      data: {
        items: ((data ?? []) as MenuItemRow[]).map(mapMenuItemRow),
        total: count ?? 0,
        page,
        pageSize,
      },
      error: null,
    };
  },

  async createItem(): Promise<RepositoryResult<MenuItem>> {
    return { data: null, error: dbError("not_implemented") };
  },

  async updateItem(): Promise<RepositoryResult<MenuItem>> {
    return { data: null, error: dbError("not_implemented") };
  },

  async setAvailability(): Promise<RepositoryResult<MenuItem>> {
    return { data: null, error: dbError("not_implemented") };
  },

  async deleteItem(): Promise<RepositoryResult<void>> {
    return { data: null, error: dbError("not_implemented") };
  },

  async listCategories(branchId?: string): Promise<RepositoryResult<MenuCategoryRecord[]>> {
    let query = supabase.from("menu_categories").select("*").order("sort_order", { ascending: true });
    if (branchId) query = query.or(`branch_id.eq.${branchId},branch_id.is.null`);
    const { data, error } = await query;
    if (error) return { data: null, error: mapDbError(error) };
    return { data: ((data ?? []) as MenuCategoryRow[]).map(mapMenuCategoryRow), error: null };
  },

  async createCategory(): Promise<RepositoryResult<MenuCategoryRecord>> {
    return { data: null, error: dbError("not_implemented") };
  },
};
