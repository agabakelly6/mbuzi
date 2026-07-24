// src/lib/supabase/mapReservationRow.ts
import type { Reservation, ReservationStatus } from "../../types/reservation";

export interface ReservationRow {
  id: string;
  branch_id: string;
  customer_id: string | null;
  guest_name: string;
  guest_phone: string;
  party_size: number;
  reserved_for: string;
  table_id: string | null;
  status: ReservationStatus;
  special_requests: string | null;
  confirmed_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export function mapReservationRow(row: ReservationRow): Reservation {
  return {
    id: row.id,
    branchId: row.branch_id,
    customerId: row.customer_id,
    guestName: row.guest_name,
    guestPhone: row.guest_phone,
    partySize: row.party_size,
    reservedFor: row.reserved_for,
    tableId: row.table_id ?? undefined,
    status: row.status,
    specialRequests: row.special_requests ?? undefined,
    confirmedByUserId: row.confirmed_by_user_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
