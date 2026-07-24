// src/repositories/supabase/SupabaseInventoryRepository.ts
//
// `adjustQuantity` is a read-modify-write, not an atomic RPC — the same
// accepted tradeoff as SupabaseKitchenTicketRepository.updateItemStatus.
// Unlike promotions' usage counter (many concurrent customers) or kitchen
// tickets (a live queue), inventory adjustments are typically one chef
// updating stock after use — low real concurrency, so the simpler
// implementation is the right call here, not a gap.
import type { InventoryRepository } from "../InventoryRepository";
import type { InventoryItem } from "../../types/inventory";
import type { ListOptions, Paginated, RepositoryResult } from "../shared";
import { supabase } from "../../lib/supabase/client";
import { dbError, mapDbError } from "../../lib/supabase/dbErrors";
import { mapInventoryItemRow, type InventoryItemRow } from "../../lib/supabase/mapInventoryItemRow";

const DEFAULT_PAGE_SIZE = 20;

export const supabaseInventoryRepository: InventoryRepository = {
  async findById(id: string): Promise<RepositoryResult<InventoryItem>> {
    const { data, error } = await supabase.from("inventory_items").select("*").eq("id", id).maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapInventoryItemRow(data as InventoryItemRow), error: null };
  },

  async list(options?: ListOptions): Promise<RepositoryResult<Paginated<InventoryItem>>> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from("inventory_items").select("*", { count: "exact" });
    if (options?.branchId) query = query.eq("branch_id", options.branchId);
    query = query.order(options?.sortBy ?? "name", { ascending: options?.sortDirection !== "desc" }).range(from, to);

    const { data, error, count } = await query;
    if (error) return { data: null, error: mapDbError(error) };

    return {
      data: {
        items: ((data ?? []) as InventoryItemRow[]).map(mapInventoryItemRow),
        total: count ?? 0,
        page,
        pageSize,
      },
      error: null,
    };
  },

  async create(item): Promise<RepositoryResult<InventoryItem>> {
    const { data, error } = await supabase
      .from("inventory_items")
      .insert({
        branch_id: item.branchId,
        name: item.name,
        unit: item.unit,
        quantity_on_hand: item.quantityOnHand,
        reorder_threshold: item.reorderThreshold,
      })
      .select("*")
      .single();
    if (error) return { data: null, error: mapDbError(error) };
    return { data: mapInventoryItemRow(data as InventoryItemRow), error: null };
  },

  async adjustQuantity(id: string, delta: number): Promise<RepositoryResult<InventoryItem>> {
    const { data: existing, error: fetchError } = await supabase.from("inventory_items").select("quantity_on_hand").eq("id", id).maybeSingle();
    if (fetchError) return { data: null, error: mapDbError(fetchError) };
    if (!existing) return { data: null, error: dbError("not_found") };

    const newQuantity = Math.max(0, (existing.quantity_on_hand as number) + delta);
    const { data, error } = await supabase.from("inventory_items").update({ quantity_on_hand: newQuantity }).eq("id", id).select("*").maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapInventoryItemRow(data as InventoryItemRow), error: null };
  },

  async delete(id: string): Promise<RepositoryResult<void>> {
    const { error } = await supabase.from("inventory_items").delete().eq("id", id);
    if (error) return { data: null, error: mapDbError(error) };
    return { data: null, error: null };
  },
};
