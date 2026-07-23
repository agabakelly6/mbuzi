// src/repositories/supabase/SupabasePromotionRepository.ts
//
// `incrementUsage` calls the increment_promotion_usage RPC (see the
// promotions support migration) rather than a plain UPDATE — a customer
// applying a promo code at checkout has no UPDATE grant on promotions at
// all (rbac.ts only grants that to branch_manager/owner), so a narrow
// SECURITY DEFINER function is what actually lets usage tracking happen
// regardless of who placed the order. It's also atomic (a single SQL
// `usage_count = usage_count + 1`), avoiding the read-modify-write race a
// client-side increment would have.
import type { PromotionRepository } from "../PromotionRepository";
import type { ListOptions, Paginated, RepositoryResult } from "../shared";
import type { Promotion } from "../../types/promotion";
import { supabase } from "../../lib/supabase/client";
import { dbError, mapDbError } from "../../lib/supabase/dbErrors";
import { mapPromotionRow, type PromotionRow } from "../../lib/supabase/mapPromotionRow";

const DEFAULT_PAGE_SIZE = 20;

export const supabasePromotionRepository: PromotionRepository = {
  async findById(id: string): Promise<RepositoryResult<Promotion>> {
    const { data, error } = await supabase.from("promotions").select("*").eq("id", id).maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapPromotionRow(data as PromotionRow), error: null };
  },

  async findByCode(code: string, branchId: string): Promise<RepositoryResult<Promotion>> {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("branch_id", branchId)
      .eq("code", code)
      .maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapPromotionRow(data as PromotionRow), error: null };
  },

  async list(options?: ListOptions & { activeOnly?: boolean }): Promise<RepositoryResult<Paginated<Promotion>>> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from("promotions").select("*", { count: "exact" });
    if (options?.branchId) query = query.eq("branch_id", options.branchId);
    if (options?.activeOnly) query = query.eq("is_active", true);
    query = query
      .order(options?.sortBy ?? "created_at", { ascending: options?.sortDirection !== "desc" })
      .range(from, to);

    const { data, error, count } = await query;
    if (error) return { data: null, error: mapDbError(error) };

    return {
      data: {
        items: ((data ?? []) as PromotionRow[]).map(mapPromotionRow),
        total: count ?? 0,
        page,
        pageSize,
      },
      error: null,
    };
  },

  async create(promotion) {
    const { data, error } = await supabase
      .from("promotions")
      .insert({
        branch_id: promotion.branchId,
        code: promotion.code,
        name: promotion.name,
        type: promotion.type,
        value: promotion.value,
        starts_at: promotion.startsAt,
        ends_at: promotion.endsAt,
        is_active: promotion.isActive,
        min_order_value: promotion.minOrderValue ?? null,
        usage_limit: promotion.usageLimit ?? null,
      })
      .select("*")
      .single();
    if (error) return { data: null, error: mapDbError(error) };
    return { data: mapPromotionRow(data as PromotionRow), error: null };
  },

  async update(id, changes) {
    const patch: Record<string, unknown> = {};
    if (changes.code !== undefined) patch.code = changes.code;
    if (changes.name !== undefined) patch.name = changes.name;
    if (changes.type !== undefined) patch.type = changes.type;
    if (changes.value !== undefined) patch.value = changes.value;
    if (changes.startsAt !== undefined) patch.starts_at = changes.startsAt;
    if (changes.endsAt !== undefined) patch.ends_at = changes.endsAt;
    if (changes.isActive !== undefined) patch.is_active = changes.isActive;
    if (changes.minOrderValue !== undefined) patch.min_order_value = changes.minOrderValue;
    if (changes.usageLimit !== undefined) patch.usage_limit = changes.usageLimit;

    const { data, error } = await supabase.from("promotions").update(patch).eq("id", id).select("*").maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapPromotionRow(data as PromotionRow), error: null };
  },

  async incrementUsage(id: string): Promise<RepositoryResult<Promotion>> {
    const { data, error } = await supabase.rpc("increment_promotion_usage", { promo_id: id });
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapPromotionRow(data as PromotionRow), error: null };
  },

  async deactivate(id: string): Promise<RepositoryResult<Promotion>> {
    const { data, error } = await supabase
      .from("promotions")
      .update({ is_active: false })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapPromotionRow(data as PromotionRow), error: null };
  },
};
