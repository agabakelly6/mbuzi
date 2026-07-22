// src/types/payment.ts
//
// One Order can have more than one Payment record over its life (a failed
// mobile money attempt followed by a successful cash payment, or a partial
// refund after the fact) — that's why Payment is its own entity referencing
// orderId rather than a couple of fields inlined on Order.
import type { BranchEntity, Money } from "./base";

export type PaymentMethod = "cash" | "mobile_money" | "card" | "bank_transfer";

export type PaymentStatus =
  | "pending"
  | "authorized"
  | "paid"
  | "failed"
  | "partially_refunded"
  | "refunded"
  | "voided";

export interface Payment extends BranchEntity {
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: Money;
  amountRefunded: Money;
  /** ISO 4217, e.g. "UGX". Kept explicit per-payment rather than assumed, since a future branch or provider could settle in a different currency. */
  currency: string;
  /** Provider transaction id — MTN MoMo, Airtel Money, Flutterwave, Pesapal, Stripe, whichever settles it. */
  providerReference?: string;
  /** User['id'] of the cashier who took a cash payment; undefined for a customer-initiated mobile money/card payment. */
  collectedByUserId?: string;
  paidAt?: string;
}
