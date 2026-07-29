// src/lib/cart/cartUtils.ts
//
// Pure functions — no React, no store access. MenuItem prices are strings
// like "UGX 40,000" (see data/menu.ts); parsePrice/formatPrice are the one
// place that string<->number conversion happens, so the cart's math never
// re-derives its own parsing rules. buildOrderWhatsAppMessage follows the
// same line-array-joined-with-"\n" style as BookingForm.tsx's
// buildWhatsAppMessage, matching this project's one established pattern
// for turning structured data into a WhatsApp-ready message.
import type { Location } from "../../types/location";
import type { CartLine, CartState, CustomerDetails, OrderDetails, OrderType } from "../../types/cart";
import { getDeliveryInfo } from "../../data/delivery";
import { calculateDeliveryFee, isWithinDeliveryRadius } from "../geo";

/** "UGX 40,000" -> 40000. Strips everything but digits. */
export function parsePrice(price: string): number {
  const digitsOnly = price.replace(/[^0-9]/g, "");
  return digitsOnly ? Number.parseInt(digitsOnly, 10) : 0;
}

/** 40000 -> "UGX 40,000". Hand-rolled thousands separator — no Intl locale dependency. */
export function formatPrice(amount: number): string {
  const withSeparators = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `UGX ${withSeparators}`;
}

export function computeLineSubtotal(line: CartLine): number {
  return line.unitPrice * line.quantity;
}

export function computeCartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + computeLineSubtotal(line), 0);
}

/** Resolves the delivery fee from real routed distance + transit time — 0 until both are captured (fee then confirmed by phone) or if distance is beyond the delivery radius. Never a flat zone/fee table. */
export function computeDeliveryFee(
  orderType: OrderType,
  deliveryDistanceKm: number | null,
  deliveryDurationMin: number | null,
  branch: Location | undefined
): number {
  if (orderType !== "delivery" || !branch) return 0;
  if (!getDeliveryInfo(branch)) return 0;
  if (deliveryDistanceKm === null || !isWithinDeliveryRadius(deliveryDistanceKm)) return 0;
  return calculateDeliveryFee(deliveryDistanceKm, deliveryDurationMin ?? 0);
}

export function buildOrderDetails(state: CartState, branch: Location | undefined): OrderDetails {
  const subtotal = computeCartSubtotal(state.lines);
  const deliveryFee = computeDeliveryFee(state.orderType, state.deliveryDistanceKm, state.deliveryDurationMin, branch);

  return {
    lines: state.lines,
    branchId: state.branchId,
    branchName: branch?.city ?? "",
    orderType: state.orderType,
    deliveryDistanceKm:
      state.orderType === "delivery" && state.deliveryDistanceKm !== null ? state.deliveryDistanceKm : undefined,
    customer: state.customer,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
  };
}

function formatCustomerDetailsLines(customer: CustomerDetails, orderType: OrderType): string[] {
  const lines: string[] = [];
  if (orderType === "delivery" && customer.deliveryAddress.trim()) {
    lines.push(`Delivery Address: ${customer.deliveryAddress.trim()}`);
  }
  lines.push(`Customer Name: ${customer.name.trim()}`);
  lines.push(`Phone: ${customer.phone.trim()}`);
  if (customer.specialInstructions.trim()) {
    lines.push(`Special Instructions: ${customer.specialInstructions.trim()}`);
  }
  return lines;
}

/** Builds the exact WhatsApp order message format from the brief. */
export function buildOrderWhatsAppMessage(order: OrderDetails): string {
  const lines = [
    "Hello YPA Mbuzi Choma 👋",
    "",
    "I would like to order:",
    "",
    ...order.lines.map((line) => {
      const variation = line.variationLabel ? ` (${line.variationLabel})` : "";
      const note = line.specialInstructions?.trim() ? ` — ${line.specialInstructions.trim()}` : "";
      return `• ${line.quantity} × ${line.name}${variation}${note}`;
    }),
    "",
    `Branch: ${order.branchName}`,
    `Order Type: ${order.orderType === "delivery" ? "Delivery" : "Pickup"}`,
    ...formatCustomerDetailsLines(order.customer, order.orderType),
    ...(order.orderType === "delivery" && order.deliveryDistanceKm === undefined
      ? ["Delivery Fee: To be confirmed by phone"]
      : []),
    `Estimated Total: ${formatPrice(order.total)}`,
    "",
    "Please confirm my order.",
  ];
  return lines.join("\n");
}
