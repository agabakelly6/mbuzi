// src/services/supabase/SupabasePaymentService.ts
//
// Enforces "merchant code (mobile_money) or cash, and delivery orders are
// merchant-code-only" via models/PaymentModel.ts's getAllowedPaymentMethods
// — the same rule the payments table's validate_payment_method trigger
// checks again at the database layer.
//
// Known gaps, not fixed here:
//  - No payment gateway integration exists, so a mobile_money payment is
//    recorded "pending" and stays that way — there's nothing yet that
//    confirms a merchant-code payment actually cleared. Cash is recorded
//    "paid" immediately since a cashier collects it in person.
//  - Same missing-actor-parameter gap as OrderService/KitchenService:
//    collectPayment's interface has no "who collected this" field, so
//    Payment.collectedByUserId is always left unset here.
import type { PaymentService } from "../PaymentService";
import type { PaymentStatus } from "../../types/payment";
import { createPaymentInputSchema, refundPaymentInputSchema } from "../../validators/payment.schema";
import { dbError } from "../../lib/supabase/dbErrors";
import { isPaymentMethodAllowed, isRefundable, remainingRefundable } from "../../models/PaymentModel";
import { supabasePaymentRepository } from "../../repositories/supabase/SupabasePaymentRepository";
import { supabaseOrderRepository } from "../../repositories/supabase/SupabaseOrderRepository";

export const supabasePaymentService: PaymentService = {
  async getPaymentsForOrder(orderId) {
    const result = await supabasePaymentRepository.list({ orderId });
    if (result.error || !result.data) return { data: null, error: result.error };
    return { data: result.data.items, error: null };
  },

  async collectPayment(input) {
    const parsed = createPaymentInputSchema.safeParse(input);
    if (!parsed.success) return { data: null, error: dbError("validation_error") };

    const { data: order, error: orderError } = await supabaseOrderRepository.findById(parsed.data.orderId);
    if (orderError || !order) return { data: null, error: orderError ?? dbError("not_found") };

    if (!isPaymentMethodAllowed(order.channel, parsed.data.method)) {
      return { data: null, error: dbError("validation_error") };
    }

    const status: PaymentStatus = parsed.data.method === "cash" ? "paid" : "pending";

    return supabasePaymentRepository.create({
      branchId: parsed.data.branchId,
      orderId: parsed.data.orderId,
      method: parsed.data.method,
      status,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      providerReference: parsed.data.providerReference,
      paidAt: status === "paid" ? new Date().toISOString() : undefined,
    });
  },

  async refund(id, input) {
    const parsed = refundPaymentInputSchema.safeParse(input);
    if (!parsed.success) return { data: null, error: dbError("validation_error") };

    const { data: payment, error } = await supabasePaymentRepository.findById(id);
    if (error || !payment) return { data: null, error: error ?? dbError("not_found") };

    if (!isRefundable(payment) || parsed.data.amount > remainingRefundable(payment)) {
      return { data: null, error: dbError("validation_error") };
    }

    return supabasePaymentRepository.refund(id, parsed.data.amount);
  },
};
