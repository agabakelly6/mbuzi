// src/lib/supabase/mapDeliveryRow.ts
import type { Delivery, DeliveryStatus } from "../../types/delivery";

export interface DeliveryRow {
  id: string;
  branch_id: string;
  order_id: string;
  rider_id: string | null;
  status: DeliveryStatus;
  delivery_zone_id: string;
  fee: number;
  address: string;
  customer_phone: string;
  assigned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export function mapDeliveryRow(row: DeliveryRow): Delivery {
  return {
    id: row.id,
    branchId: row.branch_id,
    orderId: row.order_id,
    riderId: row.rider_id,
    status: row.status,
    deliveryZoneId: row.delivery_zone_id,
    fee: row.fee,
    address: row.address,
    customerPhone: row.customer_phone,
    assignedAt: row.assigned_at ?? undefined,
    pickedUpAt: row.picked_up_at ?? undefined,
    deliveredAt: row.delivered_at ?? undefined,
    failureReason: row.failure_reason ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
