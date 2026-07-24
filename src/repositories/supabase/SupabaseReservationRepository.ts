// src/repositories/supabase/SupabaseReservationRepository.ts
import type { ReservationRepository, ReservationListFilters } from "../ReservationRepository";
import type { Reservation, ReservationStatus } from "../../types/reservation";
import type { Paginated, RepositoryResult } from "../shared";
import { supabase } from "../../lib/supabase/client";
import { dbError, mapDbError } from "../../lib/supabase/dbErrors";
import { mapReservationRow, type ReservationRow } from "../../lib/supabase/mapReservationRow";

const DEFAULT_PAGE_SIZE = 20;

export const supabaseReservationRepository: ReservationRepository = {
  async findById(id: string): Promise<RepositoryResult<Reservation>> {
    const { data, error } = await supabase.from("reservations").select("*").eq("id", id).maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapReservationRow(data as ReservationRow), error: null };
  },

  async list(filters?: ReservationListFilters): Promise<RepositoryResult<Paginated<Reservation>>> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from("reservations").select("*", { count: "exact" });
    if (filters?.branchId) query = query.eq("branch_id", filters.branchId);
    if (filters?.customerId) query = query.eq("customer_id", filters.customerId);
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.date) query = query.gte("reserved_for", `${filters.date}T00:00:00Z`).lt("reserved_for", `${filters.date}T23:59:59Z`);
    query = query.order(filters?.sortBy ?? "reserved_for", { ascending: filters?.sortDirection !== "desc" }).range(from, to);

    const { data, error, count } = await query;
    if (error) return { data: null, error: mapDbError(error) };

    return {
      data: {
        items: ((data ?? []) as ReservationRow[]).map(mapReservationRow),
        total: count ?? 0,
        page,
        pageSize,
      },
      error: null,
    };
  },

  async create(reservation): Promise<RepositoryResult<Reservation>> {
    const { data, error } = await supabase
      .from("reservations")
      .insert({
        branch_id: reservation.branchId,
        customer_id: reservation.customerId,
        guest_name: reservation.guestName,
        guest_phone: reservation.guestPhone,
        party_size: reservation.partySize,
        reserved_for: reservation.reservedFor,
        special_requests: reservation.specialRequests ?? null,
      })
      .select("*")
      .single();
    if (error) return { data: null, error: mapDbError(error) };
    return { data: mapReservationRow(data as ReservationRow), error: null };
  },

  async updateStatus(id: string, status: ReservationStatus): Promise<RepositoryResult<Reservation>> {
    const { data, error } = await supabase.from("reservations").update({ status }).eq("id", id).select("*").maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapReservationRow(data as ReservationRow), error: null };
  },

  async assignTable(id: string, tableId: string): Promise<RepositoryResult<Reservation>> {
    const { data, error } = await supabase.from("reservations").update({ table_id: tableId }).eq("id", id).select("*").maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapReservationRow(data as ReservationRow), error: null };
  },

  async cancel(id: string): Promise<RepositoryResult<Reservation>> {
    const { data, error } = await supabase.from("reservations").update({ status: "cancelled" }).eq("id", id).select("*").maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapReservationRow(data as ReservationRow), error: null };
  },
};
