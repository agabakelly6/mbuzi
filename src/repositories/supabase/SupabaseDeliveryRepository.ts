// src/repositories/supabase/SupabaseDeliveryRepository.ts
import type { DeliveryRepository, DeliveryListFilters } from "../DeliveryRepository";
import type { Delivery, DeliveryStatus } from "../../types/delivery";
import type { Paginated, RepositoryResult, Unsubscribe } from "../shared";
import { supabase } from "../../lib/supabase/client";
import { dbError, mapDbError } from "../../lib/supabase/dbErrors";
import { mapDeliveryRow, type DeliveryRow } from "../../lib/supabase/mapDeliveryRow";

const DEFAULT_PAGE_SIZE = 20;

export const supabaseDeliveryRepository: DeliveryRepository = {
  async findById(id: string): Promise<RepositoryResult<Delivery>> {
    const { data, error } = await supabase.from("deliveries").select("*").eq("id", id).maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapDeliveryRow(data as DeliveryRow), error: null };
  },

  async findByOrderId(orderId: string): Promise<RepositoryResult<Delivery>> {
    const { data, error } = await supabase.from("deliveries").select("*").eq("order_id", orderId).maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapDeliveryRow(data as DeliveryRow), error: null };
  },

  async list(filters?: DeliveryListFilters): Promise<RepositoryResult<Paginated<Delivery>>> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from("deliveries").select("*", { count: "exact" });
    if (filters?.branchId) query = query.eq("branch_id", filters.branchId);
    if (filters?.riderId) query = query.eq("rider_id", filters.riderId);
    if (filters?.status) query = query.eq("status", filters.status);
    query = query
      .order(filters?.sortBy ?? "created_at", { ascending: filters?.sortDirection !== "desc" })
      .range(from, to);

    const { data, error, count } = await query;
    if (error) return { data: null, error: mapDbError(error) };

    return {
      data: {
        items: ((data ?? []) as DeliveryRow[]).map(mapDeliveryRow),
        total: count ?? 0,
        page,
        pageSize,
      },
      error: null,
    };
  },

  async create(delivery): Promise<RepositoryResult<Delivery>> {
    const { data, error } = await supabase
      .from("deliveries")
      .insert({
        branch_id: delivery.branchId,
        order_id: delivery.orderId,
        delivery_zone_id: delivery.deliveryZoneId,
        fee: delivery.fee,
        address: delivery.address,
        customer_phone: delivery.customerPhone,
      })
      .select("*")
      .single();
    if (error) return { data: null, error: mapDbError(error) };
    return { data: mapDeliveryRow(data as DeliveryRow), error: null };
  },

  async assignRider(id: string, riderId: string): Promise<RepositoryResult<Delivery>> {
    const { data, error } = await supabase
      .from("deliveries")
      .update({ rider_id: riderId, status: "assigned", assigned_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapDeliveryRow(data as DeliveryRow), error: null };
  },

  async updateStatus(id: string, status: DeliveryStatus): Promise<RepositoryResult<Delivery>> {
    const patch: Record<string, unknown> = { status };
    if (status === "picked_up") patch.picked_up_at = new Date().toISOString();
    if (status === "delivered") patch.delivered_at = new Date().toISOString();

    const { data, error } = await supabase.from("deliveries").update(patch).eq("id", id).select("*").maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapDeliveryRow(data as DeliveryRow), error: null };
  },

  subscribe(filters: DeliveryListFilters, onChange: (delivery: Delivery) => void): Unsubscribe {
    const channel = supabase
      .channel(`deliveries-${filters.branchId ?? filters.riderId ?? "all"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deliveries",
          filter: filters.branchId ? `branch_id=eq.${filters.branchId}` : undefined,
        },
        (payload) => {
          const changedId = (payload.new as { id?: string } | null)?.id ?? (payload.old as { id?: string } | null)?.id;
          if (!changedId) return;
          supabaseDeliveryRepository.findById(changedId).then(({ data }) => {
            if (data && (!filters.riderId || data.riderId === filters.riderId)) onChange(data);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
