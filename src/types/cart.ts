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
