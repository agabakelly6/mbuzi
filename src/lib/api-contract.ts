// src/lib/api-contract.ts
//
// Pure type-level description of the future REST API surface — no runtime
// code, no fetch calls. Each key is `"METHOD /path"` mapped to its
// params/query/body/response shape. Phase 3 either backs these directly
// with Supabase PostgREST/Edge Functions matching this shape, or a thin
// API layer translates to it — either way, a typed client can be
// generated mechanically from this file instead of hand-writing fetch
// calls per screen, and every shape referenced here already exists in
// types/ and validators/, so there's nothing new to design later.
import type { Branch } from "../types/branch";
import type { User, AuthSession } from "../types/user";
import type { Customer } from "../types/customer";
import type { MenuItem } from "../types/menu-item";
import type { Order } from "../types/order";
import type { Payment } from "../types/payment";
import type { Delivery } from "../types/delivery";
import type { Table } from "../types/table";
import type { Reservation } from "../types/reservation";
import type { KitchenTicket } from "../types/kitchen";
import type { Notification } from "../types/notification";
import type { Promotion } from "../types/promotion";
import type { LoyaltyMember } from "../types/loyalty";
import type { BranchAnalyticsSummary } from "../types/analytics";
import type { Paginated } from "../repositories/shared";

import type { SignInInput, SignUpStaffInput } from "../validators/user.schema";
import type { CreateCustomerInput } from "../validators/customer.schema";
import type { CreateMenuItemInput, UpdateMenuItemInput } from "../validators/menuItem.schema";
import type { CreateOrderInput, UpdateOrderStatusInput, CancelOrderInput } from "../validators/order.schema";
import type { CreatePaymentInput, UpdatePaymentStatusInput, RefundPaymentInput } from "../validators/payment.schema";
import type { CreateDeliveryInput, UpdateDeliveryStatusInput, AssignRiderInput } from "../validators/delivery.schema";
import type { UpdateTableStatusInput } from "../validators/table.schema";
import type { CreateReservationInput, UpdateReservationStatusInput } from "../validators/reservation.schema";
import type { UpdateKitchenTicketStatusInput } from "../validators/kitchen.schema";
import type { CreatePromotionInput } from "../validators/promotion.schema";

export interface AuthApi {
  "POST /auth/sign-in": { body: SignInInput; response: AuthSession };
  "POST /auth/sign-out": { response: void };
  "POST /auth/staff": { body: SignUpStaffInput; response: User };
  "GET /auth/me": { response: User };
}

export interface BranchApi {
  "GET /branches": { response: Paginated<Branch> };
  "GET /branches/:id": { params: { id: string }; response: Branch };
}

export interface MenuApi {
  "GET /branches/:branchId/menu": { params: { branchId: string }; response: MenuItem[] };
  "POST /branches/:branchId/menu": { params: { branchId: string }; body: CreateMenuItemInput; response: MenuItem };
  "PATCH /menu-items/:id": { params: { id: string }; body: UpdateMenuItemInput; response: MenuItem };
  "DELETE /menu-items/:id": { params: { id: string }; response: void };
}

export interface OrderApi {
  "GET /orders": { query: { branchId?: string; status?: string; customerId?: string }; response: Paginated<Order> };
  "GET /orders/:id": { params: { id: string }; response: Order };
  "POST /orders": { body: CreateOrderInput; response: Order };
  "PATCH /orders/:id/status": { params: { id: string }; body: UpdateOrderStatusInput; response: Order };
  "POST /orders/:id/cancel": { params: { id: string }; body: CancelOrderInput; response: Order };
}

export interface TableApi {
  "GET /branches/:branchId/tables": { params: { branchId: string }; response: Table[] };
  "PATCH /tables/:id/status": { params: { id: string }; body: UpdateTableStatusInput; response: Table };
}

export interface ReservationApi {
  "GET /reservations": { query: { branchId?: string; status?: string; date?: string }; response: Paginated<Reservation> };
  "POST /reservations": { body: CreateReservationInput; response: Reservation };
  "PATCH /reservations/:id/status": { params: { id: string }; body: UpdateReservationStatusInput; response: Reservation };
}

export interface KitchenApi {
  "GET /branches/:branchId/kitchen-tickets": { params: { branchId: string }; response: KitchenTicket[] };
  "PATCH /kitchen-tickets/:id/status": { params: { id: string }; body: UpdateKitchenTicketStatusInput; response: KitchenTicket };
}

export interface DeliveryApi {
  "GET /deliveries": { query: { branchId?: string; riderId?: string; status?: string }; response: Paginated<Delivery> };
  "POST /deliveries": { body: CreateDeliveryInput; response: Delivery };
  "PATCH /deliveries/:id/assign": { params: { id: string }; body: AssignRiderInput; response: Delivery };
  "PATCH /deliveries/:id/status": { params: { id: string }; body: UpdateDeliveryStatusInput; response: Delivery };
}

export interface PaymentApi {
  "GET /payments": { query: { orderId?: string }; response: Payment[] };
  "POST /payments": { body: CreatePaymentInput; response: Payment };
  "PATCH /payments/:id/status": { params: { id: string }; body: UpdatePaymentStatusInput; response: Payment };
  "POST /payments/:id/refund": { params: { id: string }; body: RefundPaymentInput; response: Payment };
}

export interface CustomerApi {
  "GET /customers/:id": { params: { id: string }; response: Customer };
  "POST /customers": { body: CreateCustomerInput; response: Customer };
}

export interface PromotionApi {
  "GET /promotions": { query: { branchId?: string; active?: boolean }; response: Promotion[] };
  "POST /promotions": { body: CreatePromotionInput; response: Promotion };
}

export interface LoyaltyApi {
  "GET /loyalty-members/:customerId": { params: { customerId: string }; response: LoyaltyMember };
  "POST /loyalty-members/:customerId/enroll": { params: { customerId: string }; response: LoyaltyMember };
}

export interface NotificationApi {
  "GET /notifications": { query: { userId: string; unreadOnly?: boolean }; response: Notification[] };
  "PATCH /notifications/:id/read": { params: { id: string }; response: Notification };
}

export interface AnalyticsApi {
  "GET /branches/:branchId/analytics/summary": { params: { branchId: string }; response: BranchAnalyticsSummary };
}

/** The whole surface, merged — mainly useful for a future codegen script that needs one type to walk. */
export type ApiContract = AuthApi &
  BranchApi &
  MenuApi &
  OrderApi &
  TableApi &
  ReservationApi &
  KitchenApi &
  DeliveryApi &
  PaymentApi &
  CustomerApi &
  PromotionApi &
  LoyaltyApi &
  NotificationApi &
  AnalyticsApi;
