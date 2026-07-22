// src/services/PaymentService.ts
import type { Payment } from "../types/payment";
import type { RepositoryResult } from "../repositories/shared";
import type { CreatePaymentInput, RefundPaymentInput } from "../validators/payment.schema";

export interface PaymentService {
  getPaymentsForOrder(orderId: string): Promise<RepositoryResult<Payment[]>>;
  /** For cash: records the payment as already `paid`. For mobile_money/card: creates it `pending` and returns a provider redirect/reference for the client to complete — the specific provider integration is a Phase 3 concern, this contract doesn't change either way. */
  collectPayment(input: CreatePaymentInput): Promise<RepositoryResult<Payment>>;
  refund(id: string, input: RefundPaymentInput): Promise<RepositoryResult<Payment>>;
}
