// src/types/cart.ts
//
// Shared shapes for the WhatsApp ordering system. A CartLine is keyed by
// menu item + variation (not just menu item id) so "Mbuzi Choma Special —
// With Accompaniments" and "...Without Accompaniments" can sit in the cart
// as two independent lines. OrderDetails is the one object a future
// payment integration (Flutterwave/Pesapal/MTN MoMo/Airtel Money/Stripe)
// would consume instead of, or alongside, the WhatsApp handoff — building
// it now keeps that swap to "add a new checkout action", not a rewrite.

export interface CartLine {
  /** `${menuItemId}::${variationLabel ?? "base"}` — stable across re-renders, unique per item+variation combo. */
  id: string;
  menuItemId: string;
  name: string;
  /** Numeric unit price in UGX, already parsed from MenuItem's "UGX 40,000"-style string. */
  unitPrice: number;
  variationLabel?: string;
  quantity: number;
  specialInstructions?: string;
  /** Pre-resolved image URL, threaded down from the FoodCard that added this line — never re-resolved client-side. */
  imageSrc?: string;
}

export type OrderType = "delivery" | "pickup";

export interface CustomerDetails {
  name: string;
  phone: string;
  deliveryAddress: string;
  specialInstructions: string;
}

export interface CartState {
  lines: CartLine[];
  orderType: OrderType;
  /** Location["id"], or "" until the customer picks a branch. */
  branchId: string;
  /** DeliveryZone["id"], or "" until picked / not applicable for pickup. */
  deliveryZoneId: string;
  customer: CustomerDetails;
  isDrawerOpen: boolean;
}

/** The one object a future payment step would receive instead of/alongside the WhatsApp message. */
export interface OrderDetails {
  lines: CartLine[];
  branchId: string;
  branchName: string;
  orderType: OrderType;
  deliveryZoneId?: string;
  customer: CustomerDetails;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Phase 2 platform domain cart — a backend-persisted, multi-device cart tied
// to a Customer once auth exists, letting someone start an order on their
// phone and finish it in-branch. Deliberately separate from CartState/
// CartLine above: those back today's local-storage WhatsApp checkout (see
// hooks/useCart.ts, lib/cart/CartStore.ts) and keep working completely
// unchanged — this is what replaces them once Supabase-backed order
// placement (services/OrderService.ts) exists.

export interface CartItem {
  id: string;
  menuItemId: string;
  variationLabel?: string;
  quantity: number;
  specialInstructions?: string;
}

export interface Cart {
  id: string;
  /** Null for a not-yet-authenticated guest cart, keyed instead by a device/session id at the storage layer. */
  customerId: string | null;
  branchId: string;
  channel: "dine_in" | "pickup" | "delivery";
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}
