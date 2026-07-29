// src/types/delivery.ts
//
// The operational delivery run for one order — rider assignment, live
// status, timestamps. `deliveryZoneId` is a free-text label (e.g. "6.5 km"
// or "Address-based (fee pending)"), not a lookup key — the fee itself is
// computed from real routed distance (see lib/geo.ts's calculateDeliveryFee),
// never a flat zone table.
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
  /** Human-readable distance/method label for staff reference (e.g. "6.5 km"), not a fee lookup key. */
  deliveryZoneId: string;
  fee: Money;
  address: string;
  customerPhone: string;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  failureReason?: string;
}
