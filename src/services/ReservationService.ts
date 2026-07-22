// src/services/ReservationService.ts
import type { Reservation, ReservationStatus } from "../types/reservation";
import type { RepositoryResult, Paginated } from "../repositories/shared";
import type { ReservationListFilters } from "../repositories/ReservationRepository";
import type { CreateReservationInput } from "../validators/reservation.schema";

export interface ReservationService {
  getReservation(id: string): Promise<RepositoryResult<Reservation>>;
  listReservations(filters: ReservationListFilters): Promise<RepositoryResult<Paginated<Reservation>>>;
  requestReservation(input: CreateReservationInput): Promise<RepositoryResult<Reservation>>;
  confirmReservation(id: string, tableId?: string): Promise<RepositoryResult<Reservation>>;
  transitionStatus(id: string, to: ReservationStatus): Promise<RepositoryResult<Reservation>>;
}
