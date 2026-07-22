// src/services/OrderService.ts
//
// Orchestrates OrderRepository + models/OrderModel.ts + PermissionService:
// validates the input, checks the acting role may make the requested
// transition, recalculates totals, and only then calls the repository.
// UI code should depend on this, never on OrderRepository directly.
import type { Order, OrderStatus } from "../types/order";
import type { RoleName } from "../types/role";
import type { RepositoryResult, Paginated } from "../repositories/shared";
import type { OrderListFilters } from "../repositories/OrderRepository";
import type { CreateOrderInput, CancelOrderInput } from "../validators/order.schema";

export interface OrderService {
  getOrder(id: string): Promise<RepositoryResult<Order>>;
  listOrders(filters: OrderListFilters): Promise<RepositoryResult<Paginated<Order>>>;
  placeOrder(input: CreateOrderInput): Promise<RepositoryResult<Order>>;
  transitionStatus(id: string, to: OrderStatus, actingRole: RoleName): Promise<RepositoryResult<Order>>;
  cancelOrder(id: string, input: CancelOrderInput, actingRole: RoleName): Promise<RepositoryResult<Order>>;
}
