// src/repositories/supabase/SupabasePaymentRepository.ts
import type { PaymentRepository, PaymentListFilters } from "../PaymentRepository";
import type { Payment, PaymentStatus } from "../../types/payment";
import type { Paginated, RepositoryResult } from "../shared";
import { supabase } from "../../lib/supabase/client";
import { dbError, mapDbError } from "../../lib/supabase/dbErrors";
import { mapPaymentRow, type PaymentRow } from "../../lib/supabase/mapPaymentRow";
import { resolveRefundStatus } from "../../models/PaymentModel";

const DEFAULT_PAGE_SIZE = 20;

export const supabasePaymentRepository: PaymentRepository = {
  async findById(id: string) {
    const { data, error } = await supabase.from("payments").select("*").eq("id", id).maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapPaymentRow(data as PaymentRow), error: null };
  },

  async list(filters?: PaymentListFilters): Promise<RepositoryResult<Paginated<Payment>>> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from("payments").select("*", { count: "exact" });
    if (filters?.branchId) query = query.eq("branch_id", filters.branchId);
    if (filters?.orderId) query = query.eq("order_id", filters.orderId);
    if (filters?.status) query = query.eq("status", filters.status);
    query = query
      .order(filters?.sortBy ?? "created_at", { ascending: filters?.sortDirection !== "desc" })
      .range(from, to);

    const { data, error, count } = await query;
    if (error) return { data: null, error: mapDbError(error) };

    return {
      data: {
        items: ((data ?? []) as PaymentRow[]).map(mapPaymentRow),
        total: count ?? 0,
        page,
        pageSize,
      },
      error: null,
    };
  },

  async create(payment) {
    const { data, error } = await supabase
      .from("payments")
      .insert({
        branch_id: payment.branchId,
        order_id: payment.orderId,
        method: payment.method,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        provider_reference: payment.providerReference ?? null,
        collected_by_user_id: payment.collectedByUserId ?? null,
        paid_at: payment.paidAt ?? null,
      })
      .select("*")
      .single();
    if (error) return { data: null, error: mapDbError(error) };
    return { data: mapPaymentRow(data as PaymentRow), error: null };
  },

  async updateStatus(id: string, status: PaymentStatus) {
    const patch: Record<string, unknown> = { status };
    if (status === "paid") patch.paid_at = new Date().toISOString();

    const { data, error } = await supabase.from("payments").update(patch).eq("id", id).select("*").maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapPaymentRow(data as PaymentRow), error: null };
  },

  async refund(id: string, amount: number) {
    const { data: existing, error: fetchError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (fetchError) return { data: null, error: mapDbError(fetchError) };
    if (!existing) return { data: null, error: dbError("not_found") };

    const payment = mapPaymentRow(existing as PaymentRow);
    const newStatus: PaymentStatus = resolveRefundStatus(payment, amount);

    const { data, error } = await supabase
      .from("payments")
      .update({ amount_refunded: payment.amountRefunded + amount, status: newStatus })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapPaymentRow(data as PaymentRow), error: null };
  },
};
