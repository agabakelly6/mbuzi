// src/repositories/DeliveryRepository.ts
import type { Delivery, DeliveryStatus } from "../types/delivery";
import type { ListOptions, Paginated, RepositoryResult, Unsubscribe } from "./shared";

export interface DeliveryListFilters extends ListOptions {
  riderId?: string;
  status?: DeliveryStatus;
}

export interface DeliveryRepository {
  findById(id: string): Promise<RepositoryResult<Delivery>>;
  findByOrderId(orderId: string): Promise<RepositoryResult<Delivery>>;
  list(filters?: DeliveryListFilters): Promise<RepositoryResult<Paginated<Delivery>>>;
  create(delivery: Omit<Delivery, "id" | "createdAt" | "updatedAt" | "status" | "riderId">): Promise<RepositoryResult<Delivery>>;
  assignRider(id: string, riderId: string): Promise<RepositoryResult<Delivery>>;
  updateStatus(id: string, status: DeliveryStatus): Promise<RepositoryResult<Delivery>>;
  /** Live feed for a rider's active-delivery screen and a branch manager's delivery board. */
  subscribe(filters: DeliveryListFilters, onChange: (delivery: Delivery) => void): Unsubscribe;
}
