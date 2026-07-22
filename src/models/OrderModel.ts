// src/models/OrderModel.ts
//
// Pure business-rule functions over `Order` — no I/O, no repository calls.
// lib/state-machines.ts answers "is this transition legal at all"; this
// file adds "is this specific actor allowed to make it," which is a
// different question — a chef can move preparing→ready, but only a
// cashier/branch_manager can close out a completed pickup order.
import type { Order, OrderStatus } from "../types/order";
import type { RoleName } from "../types/role";
import { canTransitionOrderStatus } from "../lib/state-machines";

const ORDER_TRANSITION_ROLES: Partial<Record<OrderStatus, RoleName[]>> = {
  accepted: ["cashier", "waiter", "branch_manager", "owner"],
  rejected: ["cashier", "waiter", "branch_manager", "owner"],
  preparing: ["chef", "branch_manager", "owner"],
  ready: ["chef", "branch_manager", "owner"],
  served: ["waiter", "branch_manager", "owner"],
  out_for_delivery: ["rider", "branch_manager", "owner"],
  delivered: ["rider", "branch_manager", "owner"],
  completed: ["cashier", "waiter", "branch_manager", "owner"],
  cancelled: ["customer", "cashier", "branch_manager", "owner"],
};

/** Combines the raw state-machine check with the role gate — the one function order-transition UI/services should call. */
export function canRoleTransitionOrder(role: RoleName, order: Order, to: OrderStatus): boolean {
  if (!canTransitionOrderStatus(order.status, to)) return false;
  const allowedRoles = ORDER_TRANSITION_ROLES[to];
  return allowedRoles ? allowedRoles.includes(role) : false;
}

export function calculateOrderTotal(order: Pick<Order, "subtotal" | "deliveryFee" | "discountTotal" | "taxTotal">): number {
  return order.subtotal + order.deliveryFee + order.taxTotal - order.discountTotal;
}

/** Only a still-pending order can have its items changed — once a branch accepts it, the kitchen may already be acting on it. */
export function isOrderEditable(order: Order): boolean {
  return order.status === "pending";
}

export function isOrderCancellable(order: Order): boolean {
  return order.status === "pending" || order.status === "accepted" || order.status === "preparing";
}

/** A dine_in order isn't done until served *and* paid; delivery/pickup close on `completed` alone. Kept as a helper because "is this order actually finished" comes up in analytics, table-clearing, and receipt logic alike. */
export function isOrderClosed(order: Order): boolean {
  return order.status === "completed" || order.status === "cancelled" || order.status === "rejected";
}
