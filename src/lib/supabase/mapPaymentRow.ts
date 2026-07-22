// src/lib/supabase/mapPaymentRow.ts
import type { Payment, PaymentMethod, PaymentStatus } from "../../types/payment";

export interface PaymentRow {
  id: string;
  branch_id: string;
  order_id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  amount_refunded: number;
  currency: string;
  provider_reference: string | null;
  collected_by_user_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export function mapPaymentRow(row: PaymentRow): Payment {
  return {
    id: row.id,
    branchId: row.branch_id,
    orderId: row.order_id,
    method: row.method,
    status: row.status,
    amount: row.amount,
    amountRefunded: row.amount_refunded,
    currency: row.currency,
    providerReference: row.provider_reference ?? undefined,
    collectedByUserId: row.collected_by_user_id ?? undefined,
    paidAt: row.paid_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
