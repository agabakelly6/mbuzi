// src/types/delivery.ts
//
// The operational delivery run for one order — rider assignment, live
// status, timestamps. Distinct from data/delivery.ts's `DeliveryZone`,
// which is just the marketing site's static fee lookup table; this entity
// references a zone by id for fee calculation but owns the actual
// fulfillment lifecycle, which DeliveryZone was never meant to model.
import type { BranchEntity, Money } from "./base";

export type DeliveryStatus =
  | "unassigned"
  | "assigned"
  | "picked_up"
  | "en_route"
  | "delivered"
  | "failed"
  | "cancelled";

export interface Delivery extends BranchEntity {
  orderId: string;
  /** User['id'] of the assigned rider, or null before assignment. */
  riderId: string | null;
  status: DeliveryStatus;
  /** References data/delivery.ts's DeliveryZone['id'] for the fee band applied. */
  deliveryZoneId: string;
  fee: Money;
  address: string;
  customerPhone: string;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  failureReason?: string;
}
