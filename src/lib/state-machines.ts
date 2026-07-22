// src/lib/state-machines.ts
//
// The executable spec behind every status enum in types/*.ts and every
// diagram in docs/16_PLATFORM_ARCHITECTURE.md — one transition table per
// entity, each read as "from this status, these are the only legal next
// statuses." models/*.ts layers role/business-rule checks on top of these;
// this file only answers "is the move legal at all," never "is this actor
// allowed to make it."
import type { OrderStatus } from "../types/order";
import type { PaymentStatus } from "../types/payment";
import type { DeliveryStatus } from "../types/delivery";
import type { ReservationStatus } from "../types/reservation";
import type { KitchenTicketStatus } from "../types/kitchen";
import type { TableStatus } from "../types/table";

function canTransition<S extends string>(table: Record<S, S[]>, from: S, to: S): boolean {
  return table[from].includes(to);
}

// ---------------------------------------------------------------------------
// Order
//
//   pending --> accepted --> preparing --> ready --+--> served --> completed        (dine_in)
//      |            |             |         |
//      |            |             |         +--> completed                          (pickup)
//      |            |             |         |
//      |            |             |         +--> out_for_delivery --> delivered --> completed  (delivery)
//      |            |             |
//      +--> rejected +--> cancelled (from pending/accepted/preparing only)
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "rejected", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served", "out_for_delivery", "completed", "cancelled"],
  served: ["completed"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: ["completed"],
  completed: [],
  cancelled: [],
  rejected: [],
};

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return canTransition(ORDER_STATUS_TRANSITIONS, from, to);
}

// ---------------------------------------------------------------------------
// Payment
//
//   pending --> authorized --> paid --+--> partially_refunded --> refunded
//      |             |                |
//      +--> failed   +--> voided      +--> refunded
export const PAYMENT_STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ["authorized", "paid", "failed", "voided"],
  authorized: ["paid", "failed", "voided"],
  paid: ["partially_refunded", "refunded"],
  partially_refunded: ["refunded"],
  refunded: [],
  failed: [],
  voided: [],
};

export function canTransitionPaymentStatus(from: PaymentStatus, to: PaymentStatus): boolean {
  return canTransition(PAYMENT_STATUS_TRANSITIONS, from, to);
}

// ---------------------------------------------------------------------------
// Delivery
//
//   unassigned --> assigned --> picked_up --> en_route --> delivered
//        |             |             |            |
//        +-------------+-------------+------------+--> failed / cancelled
export const DELIVERY_STATUS_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  unassigned: ["assigned", "cancelled"],
  assigned: ["picked_up", "cancelled", "failed"],
  picked_up: ["en_route", "failed"],
  en_route: ["delivered", "failed"],
  delivered: [],
  failed: [],
  cancelled: [],
};

export function canTransitionDeliveryStatus(from: DeliveryStatus, to: DeliveryStatus): boolean {
  return canTransition(DELIVERY_STATUS_TRANSITIONS, from, to);
}

// ---------------------------------------------------------------------------
// Reservation
//
//   requested --> confirmed --> seated --> completed
//        |             |            |
//        +--> cancelled+--> no_show +--> cancelled
export const RESERVATION_STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["seated", "no_show", "cancelled"],
  seated: ["completed"],
  completed: [],
  no_show: [],
  cancelled: [],
};

export function canTransitionReservationStatus(from: ReservationStatus, to: ReservationStatus): boolean {
  return canTransition(RESERVATION_STATUS_TRANSITIONS, from, to);
}

// ---------------------------------------------------------------------------
// Kitchen ticket
//
//   queued --> in_progress --> ready --> served
//      |             |
//      +-------------+--> cancelled
export const KITCHEN_TICKET_STATUS_TRANSITIONS: Record<KitchenTicketStatus, KitchenTicketStatus[]> = {
  queued: ["in_progress", "cancelled"],
  in_progress: ["ready", "cancelled"],
  ready: ["served"],
  served: [],
  cancelled: [],
};

export function canTransitionKitchenTicketStatus(from: KitchenTicketStatus, to: KitchenTicketStatus): boolean {
  return canTransition(KITCHEN_TICKET_STATUS_TRANSITIONS, from, to);
}

// ---------------------------------------------------------------------------
// Table
//
//   available <--> occupied <--> needs_cleaning --> available
//       |
//       +--> reserved --> occupied
//       |
//       +--> out_of_service --> available
export const TABLE_STATUS_TRANSITIONS: Record<TableStatus, TableStatus[]> = {
  available: ["occupied", "reserved", "out_of_service"],
  reserved: ["occupied", "available"],
  occupied: ["needs_cleaning", "available"],
  needs_cleaning: ["available"],
  out_of_service: ["available"],
};

export function canTransitionTableStatus(from: TableStatus, to: TableStatus): boolean {
  return canTransition(TABLE_STATUS_TRANSITIONS, from, to);
}

// ---------------------------------------------------------------------------
// Authentication — a client-side session lifecycle, not a persisted
// entity's status. Drives contexts/AuthContext.tsx.
//
//   idle --> authenticating --+--> authenticated --> unauthenticated
//                              +--> unauthenticated
//                              +--> error --> authenticating / unauthenticated
export type AuthFlowState = "idle" | "authenticating" | "authenticated" | "unauthenticated" | "error";

export const AUTH_FLOW_TRANSITIONS: Record<AuthFlowState, AuthFlowState[]> = {
  idle: ["authenticating"],
  authenticating: ["authenticated", "unauthenticated", "error"],
  authenticated: ["unauthenticated"],
  unauthenticated: ["authenticating"],
  error: ["authenticating", "unauthenticated"],
};

export function canTransitionAuthFlow(from: AuthFlowState, to: AuthFlowState): boolean {
  return canTransition(AUTH_FLOW_TRANSITIONS, from, to);
}
