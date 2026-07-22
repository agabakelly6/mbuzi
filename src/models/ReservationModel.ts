// src/models/ReservationModel.ts
import type { Reservation, ReservationStatus } from "../types/reservation";
import { canTransitionReservationStatus } from "../lib/state-machines";

export function canTransitionReservation(reservation: Reservation, to: ReservationStatus): boolean {
  return canTransitionReservationStatus(reservation.status, to);
}

/** A guest can still change party size/time/table while it's requested or confirmed — once seated, editing the booking itself no longer makes sense. */
export function isReservationModifiable(reservation: Reservation): boolean {
  return reservation.status === "requested" || reservation.status === "confirmed";
}

/** Reservations flip to no_show automatically once far enough past the booked time with no seating — the grace window a background job (Phase 3) would use. */
export function isOverdue(reservation: Reservation, now: Date = new Date(), graceMinutes = 20): boolean {
  if (reservation.status !== "confirmed") return false;
  const reservedFor = new Date(reservation.reservedFor).getTime();
  return now.getTime() - reservedFor > graceMinutes * 60_000;
}
