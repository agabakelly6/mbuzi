// src/models/PaymentModel.ts
import type { Payment, PaymentMethod, PaymentStatus } from "../types/payment";
import type { OrderChannel } from "../types/order";
import { canTransitionPaymentStatus } from "../lib/state-machines";

/**
 * Which payment methods are accepted for a given order channel. Cash is
 * gone entirely — every order pays upfront now (mobile money merchant
 * code, or card once a processor exists), confirmed before the kitchen
 * prep cycle begins (see enforce_payment_before_accept in
 * 20260725010000_payment_gate_and_guest_checkout_payment.sql). No
 * channel-based distinction remains since cash was the only thing that
 * differed by channel; `channel` is kept as a parameter for call-site
 * compatibility. `bank_transfer` still exists in the PaymentMethod type
 * for later, not offered yet.
 */
export function getAllowedPaymentMethods(_channel: OrderChannel): PaymentMethod[] {
  return ["mobile_money", "card"];
}

/** Whether an order has at least one payment that's actually confirmed paid — the gate `enforce_payment_before_accept` also enforces server-side before an order can move to 'accepted'. */
export function hasConfirmedPayment(payments: Payment[]): boolean {
  return payments.some((payment) => payment.status === "paid");
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
