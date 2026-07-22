// src/repositories/supabase/SupabaseOrderRepository.ts
//
// `create()` is not fully atomic: supabase-js has no cross-table
// transaction API from the browser, so this does two sequential inserts
// (orders, then order_items) with a best-effort compensating delete if the
// second one fails. A genuinely orphaned order row on that failure path is
// the known, accepted tradeoff — the correct fix is a Postgres RPC
// function that does both inserts in one transaction, which needs a live
// project to write and test against safely rather than guessing at
// untestable PL/pgSQL. Every other method here is a single-table
// operation and has no such gap.
import type { OrderRepository, OrderListFilters } from "../OrderRepository";
import type { Order, OrderStatus } from "../../types/order";
import type { Paginated, RepositoryResult, Unsubscribe } from "../shared";
import { supabase } from "../../lib/supabase/client";
import { dbError, mapDbError } from "../../lib/supabase/dbErrors";
import { mapOrderRow, type OrderRow } from "../../lib/supabase/mapOrderRow";

const DEFAULT_PAGE_SIZE = 20;
const ORDER_SELECT = "*, order_items(*)";

export const supabaseOrderRepository: OrderRepository = {
  async findById(id: string): Promise<RepositoryResult<Order>> {
    const { data, error } = await supabase.from("orders").select(ORDER_SELECT).eq("id", id).maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapOrderRow(data as OrderRow), error: null };
  },

  async list(filters?: OrderListFilters): Promise<RepositoryResult<Paginated<Order>>> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from("orders").select(ORDER_SELECT, { count: "exact" });
    if (filters?.branchId) query = query.eq("branch_id", filters.branchId);
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.customerId) query = query.eq("customer_id", filters.customerId);
    if (filters?.channel) query = query.eq("channel", filters.channel);
    query = query
      .order(filters?.sortBy ?? "created_at", { ascending: filters?.sortDirection !== "desc" })
      .range(from, to);

    const { data, error, count } = await query;
    if (error) return { data: null, error: mapDbError(error) };

    return {
      data: {
        items: ((data ?? []) as OrderRow[]).map(mapOrderRow),
        total: count ?? 0,
        page,
        pageSize,
      },
      error: null,
    };
  },

  async create(order): Promise<RepositoryResult<Order>> {
    const { data: orderRow, error: orderError } = await supabase
      .from("orders")
      .insert({
        branch_id: order.branchId,
        customer_id: order.customerId,
        channel: order.channel,
        status: order.status,
        table_id: order.tableId ?? null,
        subtotal: order.subtotal,
        delivery_fee: order.deliveryFee,
        discount_total: order.discountTotal,
        tax_total: order.taxTotal,
        total: order.total,
        applied_promotion_id: order.appliedPromotionId ?? null,
        placed_by_user_id: order.placedByUserId ?? null,
        notes: order.notes ?? null,
      })
      .select("*")
      .single();

    if (orderError) return { data: null, error: mapDbError(orderError) };

    const itemsPayload = order.items.map((item) => ({
      order_id: orderRow.id,
      menu_item_id: item.menuItemId || null,
      name_snapshot: item.nameSnapshot,
      variation_label: item.variationLabel ?? null,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      special_instructions: item.specialInstructions ?? null,
      subtotal: item.subtotal,
    }));

    const { data: itemRows, error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsPayload)
      .select("*");

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", orderRow.id);
      return { data: null, error: mapDbError(itemsError) };
    }

    return { data: mapOrderRow({ ...orderRow, order_items: itemRows } as OrderRow), error: null };
  },

  async updateStatus(id: string, status: OrderStatus): Promise<RepositoryResult<Order>> {
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select(ORDER_SELECT)
      .maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapOrderRow(data as OrderRow), error: null };
  },

  async cancel(id: string, reason: string): Promise<RepositoryResult<Order>> {
    // No dedicated cancellation-reason column exists on orders (a gap in
    // the existing Order type, not something to invent a new column for
    // here) — the reason is appended to `notes` instead of overwriting it,
    // so it's preserved without losing whatever was already there.
    const { data: existing, error: fetchError } = await supabase
      .from("orders")
      .select("notes")
      .eq("id", id)
      .maybeSingle();
    if (fetchError) return { data: null, error: mapDbError(fetchError) };
    if (!existing) return { data: null, error: dbError("not_found") };

    const notes = [existing.notes as string | null, `Cancelled: ${reason}`].filter(Boolean).join(" | ");

    const { data, error } = await supabase
      .from("orders")
      .update({ status: "cancelled", notes })
      .eq("id", id)
      .select(ORDER_SELECT)
      .maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapOrderRow(data as OrderRow), error: null };
  },

  async delete(id: string): Promise<RepositoryResult<void>> {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return { data: null, error: mapDbError(error) };
    return { data: null, error: null };
  },

  subscribe(filters: OrderListFilters, onChange: (order: Order) => void): Unsubscribe {
    const channel = supabase
      .channel(`orders-${filters.branchId ?? "all"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: filters.branchId ? `branch_id=eq.${filters.branchId}` : undefined,
        },
        (payload) => {
          const changedId = (payload.new as { id?: string } | null)?.id ?? (payload.old as { id?: string } | null)?.id;
          if (!changedId) return;
          supabaseOrderRepository.findById(changedId).then(({ data }) => {
            if (data) onChange(data);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
