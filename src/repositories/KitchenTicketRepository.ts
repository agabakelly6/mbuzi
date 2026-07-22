// src/repositories/KitchenTicketRepository.ts
import type { KitchenTicket, KitchenTicketStatus } from "../types/kitchen";
import type { ListOptions, Paginated, RepositoryResult, Unsubscribe } from "./shared";

export interface KitchenTicketListFilters extends ListOptions {
  status?: KitchenTicketStatus;
  assignedChefId?: string;
}

export interface KitchenTicketRepository {
  findById(id: string): Promise<RepositoryResult<KitchenTicket>>;
  findByOrderId(orderId: string): Promise<RepositoryResult<KitchenTicket>>;
  list(filters?: KitchenTicketListFilters): Promise<RepositoryResult<Paginated<KitchenTicket>>>;
  create(ticket: Omit<KitchenTicket, "id" | "createdAt" | "updatedAt" | "status">): Promise<RepositoryResult<KitchenTicket>>;
  updateStatus(id: string, status: KitchenTicketStatus): Promise<RepositoryResult<KitchenTicket>>;
  updateItemStatus(id: string, orderItemId: string, status: KitchenTicketStatus): Promise<RepositoryResult<KitchenTicket>>;
  assignChef(id: string, chefId: string): Promise<RepositoryResult<KitchenTicket>>;
  /** Live feed for the kitchen display screen. */
  subscribe(filters: KitchenTicketListFilters, onChange: (ticket: KitchenTicket) => void): Unsubscribe;
}
