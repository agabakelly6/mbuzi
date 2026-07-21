// src/data/delivery.ts
//
// Delivery pricing and zones, shared by every active branch by default —
// a future branch inherits delivery automatically the moment its status
// flips to "active" in data/locations.ts, with no per-branch setup. Fees
// are placeholders (round UGX figures) meant to be replaced with real
// rates; every component reads them from here, nothing is hardcoded
// inline in a component.
import type { Location } from "../types/location";

export interface DeliveryZone {
  id: string;
  /** Distance band shown to guests, e.g. "Within 3 km". */
  label: string;
  /** UGX. 0 means free delivery for that band. */
  fee: number;
}

export const DELIVERY_CURRENCY = "UGX";

export const DELIVERY_ZONES: DeliveryZone[] = [
  { id: "near", label: "Within 3 km", fee: 5000 },
  { id: "mid", label: "3 – 8 km", fee: 10000 },
  { id: "far", label: "Beyond 8 km", fee: 15000 },
];

export interface DeliveryInfo {
  available: boolean;
  area: string;
  zones: DeliveryZone[];
}

/** Shared by every active branch until a specific branch ever needs its own area/zones. */
export const DEFAULT_DELIVERY: DeliveryInfo = {
  available: true,
  area: "Delivering within approximately 8 km of the branch",
  zones: DELIVERY_ZONES,
};

/**
 * Resolves a branch's delivery info. Only "active" branches deliver — a
 * coming-soon or planned branch has no live delivery service yet. This is
 * the single place that decision is made, so no component needs to
 * special-case a branch by id or name.
 */
export function getDeliveryInfo(location: Pick<Location, "status">): DeliveryInfo | null {
  return location.status === "active" ? DEFAULT_DELIVERY : null;
}
