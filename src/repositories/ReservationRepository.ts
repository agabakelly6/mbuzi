// src/repositories/ReservationRepository.ts
import type { Reservation, ReservationStatus } from "../types/reservation";
import type { ListOptions, Paginated, RepositoryResult } from "./shared";

export interface ReservationListFilters extends ListOptions {
  customerId?: string;
  status?: ReservationStatus;
  /** ISO date (YYYY-MM-DD) — filters to reservations on that day. */
  date?: string;
}

export interface ReservationRepository {
  findById(id: string): Promise<RepositoryResult<Reservation>>;
  list(filters?: ReservationListFilters): Promise<RepositoryResult<Paginated<Reservation>>>;
  create(reservation: Omit<Reservation, "id" | "createdAt" | "updatedAt" | "status">): Promise<RepositoryResult<Reservation>>;
  updateStatus(id: string, status: ReservationStatus): Promise<RepositoryResult<Reservation>>;
  assignTable(id: string, tableId: string): Promise<RepositoryResult<Reservation>>;
  cancel(id: string): Promise<RepositoryResult<Reservation>>;
}
