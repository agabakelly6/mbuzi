// src/models/PaymentModel.ts
import type { Payment, PaymentStatus } from "../types/payment";
import { canTransitionPaymentStatus } from "../lib/state-machines";

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
