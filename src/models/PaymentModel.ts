// src/models/PaymentModel.ts
import type { Payment, PaymentMethod, PaymentStatus } from "../types/payment";
import type { OrderChannel } from "../types/order";
import { canTransitionPaymentStatus } from "../lib/state-machines";

/**
 * Which payment methods are accepted for a given order channel — a
 * deliberately narrow starting rule: delivery orders require a mobile
 * money merchant code (no cash handed to a rider); dine-in, pickup, and
 * whatsapp orders accept either a merchant code or cash. `card` and
 * `bank_transfer` exist in the PaymentMethod type for later — not offered
 * by any channel yet. "For now," per the brief this came from; revisit
 * when a real payment gateway/card terminal integration exists.
 */
export function getAllowedPaymentMethods(channel: OrderChannel): PaymentMethod[] {
  return channel === "delivery" ? ["mobile_money"] : ["mobile_money", "cash"];
}

export function isPaymentMethodAllowed(channel: OrderChannel, method: PaymentMethod): boolean {
  return getAllowedPaymentMethods(channel).includes(method);
}

export function canTransitionPayment(payment: Payment, to: PaymentStatus): boolean {
  return canTransitionPaymentStatus(payment.status, to);
}

export function isRefundable(payment: Payment): boolean {
  return payment.status === "paid" && payment.amountRefunded < payment.amount;
}

export function remainingRefundable(payment: Payment): number {
  return payment.amount - payment.amountRefunded;
}

/** Which of the two refund statuses a given refund amount produces — a full refund closes the payment out, a partial one keeps it open for further (partial) refunds up to the remaining balance. */
export function resolveRefundStatus(payment: Payment, refundAmount: number): PaymentStatus {
  const totalRefunded = payment.amountRefunded + refundAmount;
  return totalRefunded >= payment.amount ? "refunded" : "partially_refunded";
}
