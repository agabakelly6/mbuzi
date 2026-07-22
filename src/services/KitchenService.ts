// src/services/KitchenService.ts
//
// Consumes OrderRepository's order-accepted event (Phase 3: a Supabase
// trigger or an explicit call from OrderService.transitionStatus) to
// generate a KitchenTicket, then owns that ticket's lifecycle from there.
import type { KitchenTicket, KitchenTicketStatus } from "../types/kitchen";
import type { RepositoryResult } from "../repositories/shared";
import type { KitchenTicketListFilters } from "../repositories/KitchenTicketRepository";

export interface KitchenService {
  getQueue(filters: KitchenTicketListFilters): Promise<RepositoryResult<KitchenTicket[]>>;
  createTicketForOrder(orderId: string): Promise<RepositoryResult<KitchenTicket>>;
  claimTicket(id: string, chefId: string): Promise<RepositoryResult<KitchenTicket>>;
  updateItemStatus(id: string, orderItemId: string, status: KitchenTicketStatus): Promise<RepositoryResult<KitchenTicket>>;
  markReady(id: string): Promise<RepositoryResult<KitchenTicket>>;
}
