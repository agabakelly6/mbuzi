// src/types/reservation.ts
import type { BranchEntity } from "./base";

export type ReservationStatus = "requested" | "confirmed" | "seated" | "completed" | "no_show" | "cancelled";

export interface Reservation extends BranchEntity {
  /** Customer['id'], or null for a guest reservation made without an account (phone/name captured directly). */
  customerId: string | null;
  guestName: string;
  guestPhone: string;
  partySize: number;
  /** ISO-8601 date-time of the booking. */
  reservedFor: string;
  /** Table['id'] once assigned — unset while still just "requested". */
  tableId?: string;
  status: ReservationStatus;
  specialRequests?: string;
  /** User['id'] of the staff member (cashier/branch_manager) who confirmed it. */
  confirmedByUserId?: string;
}
