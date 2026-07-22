// src/repositories/supabase/SupabaseKitchenTicketRepository.ts
//
// `create()` only succeeds for an owner — kitchen_tickets has no non-owner
// INSERT policy by design (see the migration's RLS comment). The real
// creation path is the on_order_accepted DB trigger, which this
// repository doesn't need to know about; SupabaseKitchenService just
// looks the resulting row up via findByOrderId instead of inserting.
//
// `updateItemStatus` is a read-modify-write on the `items` jsonb column
// (find the item, replace it, write the whole array back) rather than an
// atomic in-database array update — supabase-js has no operator for
// "update one element of a jsonb array" from the client. Same accepted
// tradeoff as SupabaseOrderRepository.create's non-atomicity: fine at
// this project's concurrency (one chef working one ticket at a time), a
// real fix is a Postgres function.
import type { KitchenTicketRepository, KitchenTicketListFilters } from "../KitchenTicketRepository";
import type { KitchenTicket, KitchenTicketStatus } from "../../types/kitchen";
import type { Paginated, RepositoryResult, Unsubscribe } from "../shared";
import { supabase } from "../../lib/supabase/client";
import { dbError, mapDbError } from "../../lib/supabase/dbErrors";
import { mapKitchenTicketRow, type KitchenTicketRow } from "../../lib/supabase/mapKitchenTicketRow";

const DEFAULT_PAGE_SIZE = 20;

export const supabaseKitchenTicketRepository: KitchenTicketRepository = {
  async findById(id: string): Promise<RepositoryResult<KitchenTicket>> {
    const { data, error } = await supabase.from("kitchen_tickets").select("*").eq("id", id).maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapKitchenTicketRow(data as KitchenTicketRow), error: null };
  },

  async findByOrderId(orderId: string): Promise<RepositoryResult<KitchenTicket>> {
    const { data, error } = await supabase.from("kitchen_tickets").select("*").eq("order_id", orderId).maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapKitchenTicketRow(data as KitchenTicketRow), error: null };
  },

  async list(filters?: KitchenTicketListFilters): Promise<RepositoryResult<Paginated<KitchenTicket>>> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from("kitchen_tickets").select("*", { count: "exact" });
    if (filters?.branchId) query = query.eq("branch_id", filters.branchId);
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.assignedChefId) query = query.eq("assigned_chef_id", filters.assignedChefId);
    query = query
      .order(filters?.sortBy ?? "fired_at", { ascending: filters?.sortDirection !== "desc" })
      .range(from, to);

    const { data, error, count } = await query;
    if (error) return { data: null, error: mapDbError(error) };

    return {
      data: {
        items: ((data ?? []) as KitchenTicketRow[]).map(mapKitchenTicketRow),
        total: count ?? 0,
        page,
        pageSize,
      },
      error: null,
    };
  },

  async create(ticket): Promise<RepositoryResult<KitchenTicket>> {
    const { data, error } = await supabase
      .from("kitchen_tickets")
      .insert({
        branch_id: ticket.branchId,
        order_id: ticket.orderId,
        items: ticket.items,
        fired_at: ticket.firedAt,
        assigned_chef_id: ticket.assignedChefId ?? null,
      })
      .select("*")
      .single();
    if (error) return { data: null, error: mapDbError(error) };
    return { data: mapKitchenTicketRow(data as KitchenTicketRow), error: null };
  },

  async updateStatus(id: string, status: KitchenTicketStatus): Promise<RepositoryResult<KitchenTicket>> {
    const patch: Record<string, unknown> = { status };
    if (status === "ready") patch.ready_at = new Date().toISOString();
    if (status === "served") patch.served_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("kitchen_tickets")
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapKitchenTicketRow(data as KitchenTicketRow), error: null };
  },

  async updateItemStatus(id: string, orderItemId: string, status: KitchenTicketStatus): Promise<RepositoryResult<KitchenTicket>> {
    const current = await supabaseKitchenTicketRepository.findById(id);
    if (current.error || !current.data) return current;

    const items = current.data.items.map((item) =>
      item.orderItemId === orderItemId ? { ...item, status } : item
    );

    const { data, error } = await supabase
      .from("kitchen_tickets")
      .update({ items })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapKitchenTicketRow(data as KitchenTicketRow), error: null };
  },

  async assignChef(id: string, chefId: string): Promise<RepositoryResult<KitchenTicket>> {
    const { data, error } = await supabase
      .from("kitchen_tickets")
      .update({ assigned_chef_id: chefId })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapKitchenTicketRow(data as KitchenTicketRow), error: null };
  },

  subscribe(filters: KitchenTicketListFilters, onChange: (ticket: KitchenTicket) => void): Unsubscribe {
    const channel = supabase
      .channel(`kitchen-tickets-${filters.branchId ?? "all"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kitchen_tickets",
          filter: filters.branchId ? `branch_id=eq.${filters.branchId}` : undefined,
        },
        (payload) => {
          const changedId = (payload.new as { id?: string } | null)?.id ?? (payload.old as { id?: string } | null)?.id;
          if (!changedId) return;
          supabaseKitchenTicketRepository.findById(changedId).then(({ data }) => {
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
