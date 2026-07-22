// src/services/DeliveryService.ts
import type { Delivery, DeliveryStatus } from "../types/delivery";
import type { RepositoryResult, Paginated } from "../repositories/shared";
import type { DeliveryListFilters } from "../repositories/DeliveryRepository";
import type { CreateDeliveryInput } from "../validators/delivery.schema";

export interface DeliveryService {
  getDelivery(id: string): Promise<RepositoryResult<Delivery>>;
  listDeliveries(filters: DeliveryListFilters): Promise<RepositoryResult<Paginated<Delivery>>>;
  createForOrder(input: CreateDeliveryInput): Promise<RepositoryResult<Delivery>>;
  /** Picks the best available rider for a branch (round-robin/nearest — Phase 3 decides), or assigns a specific one if `riderId` is given. */
  assignRider(id: string, riderId?: string): Promise<RepositoryResult<Delivery>>;
  transitionStatus(id: string, to: DeliveryStatus): Promise<RepositoryResult<Delivery>>;
}
