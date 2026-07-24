// src/repositories/supabase/SupabaseTableRepository.ts
import type { TableRepository } from "../TableRepository";
import type { Table, TableStatus } from "../../types/table";
import type { RepositoryResult } from "../shared";
import { supabase } from "../../lib/supabase/client";
import { dbError, mapDbError } from "../../lib/supabase/dbErrors";
import { mapTableRow, type TableRow } from "../../lib/supabase/mapTableRow";

export const supabaseTableRepository: TableRepository = {
  async findById(id: string): Promise<RepositoryResult<Table>> {
    const { data, error } = await supabase.from("restaurant_tables").select("*").eq("id", id).maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapTableRow(data as TableRow), error: null };
  },

  async listByBranch(branchId: string): Promise<RepositoryResult<Table[]>> {
    const { data, error } = await supabase.from("restaurant_tables").select("*").eq("branch_id", branchId).order("label", { ascending: true });
    if (error) return { data: null, error: mapDbError(error) };
    return { data: ((data ?? []) as TableRow[]).map(mapTableRow), error: null };
  },

  async create(table): Promise<RepositoryResult<Table>> {
    const { data, error } = await supabase
      .from("restaurant_tables")
      .insert({ branch_id: table.branchId, label: table.label, seats: table.seats })
      .select("*")
      .single();
    if (error) return { data: null, error: mapDbError(error) };
    return { data: mapTableRow(data as TableRow), error: null };
  },

  async updateStatus(id: string, status: TableStatus): Promise<RepositoryResult<Table>> {
    const { data, error } = await supabase.from("restaurant_tables").update({ status }).eq("id", id).select("*").maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapTableRow(data as TableRow), error: null };
  },

  async assignOrder(id: string, orderId: string): Promise<RepositoryResult<Table>> {
    const { data, error } = await supabase
      .from("restaurant_tables")
      .update({ current_order_id: orderId, status: "occupied" })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapTableRow(data as TableRow), error: null };
  },

  async clear(id: string): Promise<RepositoryResult<Table>> {
    const { data, error } = await supabase
      .from("restaurant_tables")
      .update({ current_order_id: null, status: "needs_cleaning" })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapTableRow(data as TableRow), error: null };
  },

  async delete(id: string): Promise<RepositoryResult<void>> {
    const { error } = await supabase.from("restaurant_tables").delete().eq("id", id);
    if (error) return { data: null, error: mapDbError(error) };
    return { data: null, error: null };
  },
};
