// src/repositories/OrderRepository.ts
import type { Order, OrderStatus, OrderChannel } from "../types/order";
import type { ListOptions, Paginated, RepositoryResult, Unsubscribe } from "./shared";

export interface OrderListFilters extends ListOptions {
  status?: OrderStatus;
  customerId?: string;
  channel?: OrderChannel;
}

export interface OrderRepository {
  findById(id: string): Promise<RepositoryResult<Order>>;
  list(filters?: OrderListFilters): Promise<RepositoryResult<Paginated<Order>>>;
  create(order: Omit<Order, "id" | "createdAt" | "updatedAt" | "orderNumber">): Promise<RepositoryResult<Order>>;
  updateStatus(id: string, status: OrderStatus): Promise<RepositoryResult<Order>>;
  cancel(id: string, reason: string): Promise<RepositoryResult<Order>>;
  delete(id: string): Promise<RepositoryResult<void>>;
  /** Live order-board feed for a branch's cashier/waiter/kitchen screens. */
  subscribe(filters: OrderListFilters, onChange: (order: Order) => void): Unsubscribe;
}
