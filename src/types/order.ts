// src/types/order.ts
//
// The central entity every role touches: a customer creates it, a
// cashier/waiter may key it in on their behalf, a chef progresses it
// through the kitchen, a rider delivers it, and it's what every payment,
// analytics snapshot, and notification ultimately references. See
// lib/state-machines.ts for the legal status transitions and
// models/OrderModel.ts for which roles may trigger which transition.
import type { BranchEntity, Money } from "./base";

export type OrderChannel = "dine_in" | "pickup" | "delivery" | "whatsapp";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "served"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled"
  | "rejected";

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  /** Item name captured at order time — stays correct on a historical receipt even if the menu item is later renamed. */
  nameSnapshot: string;
  variationLabel?: string;
  unitPrice: Money;
  quantity: number;
  specialInstructions?: string;
  /** unitPrice * quantity, denormalized so a receipt never has to re-derive it from a price that may have since changed. */
  subtotal: Money;
}

export interface Order extends BranchEntity {
  /** Human-facing, e.g. "YPA-RBG-000123" — what staff and receipts reference; `id` is only for system/API use. */
  orderNumber: string;
  /** Customer['id'], or null for an anonymous/WhatsApp order not yet linked to an account. */
  customerId: string | null;
  channel: OrderChannel;
  status: OrderStatus;
  items: OrderItem[];
  /** Table['id'] — dine_in only. */
  tableId?: string;
  /** Delivery['id'] — delivery only. */
  deliveryId?: string;
  subtotal: Money;
  deliveryFee: Money;
  discountTotal: Money;
  taxTotal: Money;
  total: Money;
  /** Promotion['id'] if a promo code was applied. */
  appliedPromotionId?: string;
  /** User['id'] of the staff member who keyed this order in (cashier/waiter) — undefined for a customer's own self-serve order. */
  placedByUserId?: string;
  notes?: string;
}
