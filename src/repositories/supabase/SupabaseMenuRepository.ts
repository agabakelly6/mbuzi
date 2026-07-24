// src/repositories/supabase/SupabaseMenuRepository.ts
//
// Write methods now back the branch-manager menu management panel
// (components/staff/BranchManagementDashboard.tsx). RLS (menu_items_insert/
// update/delete, menu_categories_write) already matched rbac.ts exactly
// from Milestone 2 — branch_manager/owner full CRUD, chef update-only
// (availability toggling) — so no migration was needed here, only these
// method bodies.
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

  async createItem(item): Promise<RepositoryResult<MenuItem>> {
    const { data, error } = await supabase
      .from("menu_items")
      .insert({
        branch_id: item.branchId,
        name: item.name,
        description: item.description,
        category_id: item.categoryId,
        base_price: item.basePrice,
        variations: item.variations,
        image_url: item.imageUrl,
        availability: item.availability,
        is_featured: item.isFeatured,
        is_chef_pick: item.isChefPick,
        linked_inventory_item_id: item.linkedInventoryItemId ?? null,
      })
      .select("*")
      .single();
    if (error) return { data: null, error: mapDbError(error) };
    return { data: mapMenuItemRow(data as MenuItemRow), error: null };
  },

  async updateItem(id: string, changes): Promise<RepositoryResult<MenuItem>> {
    const patch: Record<string, unknown> = {};
    if (changes.name !== undefined) patch.name = changes.name;
    if (changes.description !== undefined) patch.description = changes.description;
    if (changes.categoryId !== undefined) patch.category_id = changes.categoryId;
    if (changes.basePrice !== undefined) patch.base_price = changes.basePrice;
    if (changes.variations !== undefined) patch.variations = changes.variations;
    if (changes.imageUrl !== undefined) patch.image_url = changes.imageUrl;
    if (changes.availability !== undefined) patch.availability = changes.availability;
    if (changes.isFeatured !== undefined) patch.is_featured = changes.isFeatured;
    if (changes.isChefPick !== undefined) patch.is_chef_pick = changes.isChefPick;
    if (changes.linkedInventoryItemId !== undefined) patch.linked_inventory_item_id = changes.linkedInventoryItemId ?? null;

    const { data, error } = await supabase.from("menu_items").update(patch).eq("id", id).select("*").maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapMenuItemRow(data as MenuItemRow), error: null };
  },

  async setAvailability(id: string, availability): Promise<RepositoryResult<MenuItem>> {
    const { data, error } = await supabase.from("menu_items").update({ availability }).eq("id", id).select("*").maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapMenuItemRow(data as MenuItemRow), error: null };
  },

  async deleteItem(id: string): Promise<RepositoryResult<void>> {
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return { data: null, error: mapDbError(error) };
    return { data: null, error: null };
  },

  async listCategories(branchId?: string): Promise<RepositoryResult<MenuCategoryRecord[]>> {
    let query = supabase.from("menu_categories").select("*").order("sort_order", { ascending: true });
    if (branchId) query = query.or(`branch_id.eq.${branchId},branch_id.is.null`);
    const { data, error } = await query;
    if (error) return { data: null, error: mapDbError(error) };
    return { data: ((data ?? []) as MenuCategoryRow[]).map(mapMenuCategoryRow), error: null };
  },

  async createCategory(category): Promise<RepositoryResult<MenuCategoryRecord>> {
    const { data, error } = await supabase
      .from("menu_categories")
      .insert({
        branch_id: category.branchId,
        name: category.name,
        sort_order: category.sortOrder,
      })
      .select("*")
      .single();
    if (error) return { data: null, error: mapDbError(error) };
    return { data: mapMenuCategoryRow(data as MenuCategoryRow), error: null };
  },
};
