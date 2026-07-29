// src/data/delivery.ts
//
// Delivery availability, shared by every active branch by default — a
// future branch inherits delivery automatically the moment its status
// flips to "active" in data/locations.ts, with no per-branch setup.
//
// There is deliberately no flat fee table here anymore. A prior version
// priced delivery off fixed distance bands ("Within 3 km" — UGX 5,000,
// etc.), which was inaccurate — actual road distance to a customer varies
// a lot within any band. The real fee is now only ever computed from a
// customer's shared live location and the routed road distance to the
// branch (see lib/geo.ts's calculateDeliveryFee + MAX_DELIVERY_RADIUS_KM,
// lib/deliveryFee.ts, and CheckoutPanel.tsx's "Share My Location" flow).
import type { Location } from "../types/location";
import { MAX_DELIVERY_RADIUS_KM } from "../lib/geo";

export const DELIVERY_CURRENCY = "UGX";

export interface DeliveryInfo {
  available: boolean;
  area: string;
  maxRadiusKm: number;
}

/** Shared by every active branch until a specific branch ever needs its own area. */
export const DEFAULT_DELIVERY: DeliveryInfo = {
  available: true,
  area: `Delivering within approximately ${MAX_DELIVERY_RADIUS_KM} km of the branch`,
  maxRadiusKm: MAX_DELIVERY_RADIUS_KM,
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
