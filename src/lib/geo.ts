// src/lib/geo.ts
//
// Straight-line (haversine) distance, used to price delivery from a
// branch's approximate coordinates to a customer's shared live location
// — no mapping/geocoding API, no key, works entirely client-side. This
// is an estimate, not routed road distance (what a real SafeBoda-style
// integration would use via a paid Google Maps/Mapbox API) — close
// enough within one city to price fairly, and upgradeable later by
// swapping only calculateDeliveryFee's distance input for a routed one.

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Modeled directly on how SafeBoda's own boda-hailing fare works, since
 * that's the real cost this business pays to actually get an order to a
 * customer:
 *  - A flat base fee covering the first 1–2 km (SafeBoda's own published
 *    range is UGX 1,500–2,000; this uses the low end).
 *  - The first 500 m of the trip is deducted from the distance before the
 *    per-km rate is applied — SafeBoda absorbs that stretch into the base
 *    fee rather than metering it.
 *  - UGX 700/km beyond that (SafeBoda's own range goes up to UGX 800/km in
 *    traffic-heavy zones; this uses the flat, non-traffic-adjusted rate
 *    since this app has no live traffic-zone data to key the higher rate
 *    off of).
 *  - UGX 50/minute of transit time, from the same routed-directions call
 *    that supplies distance (see lib/deliveryFee.ts's durationMin).
 *  - A UGX 3,000 minimum — even an 800 m, 3-minute delivery is floored up
 *    to this before rounding.
 * Result is rounded to the nearest 500 UGX (never a flat table — see
 * data/delivery.ts's header comment for why that was removed).
 */
const BASE_FEE_UGX = 1500;
const FIRST_STRETCH_DEDUCTED_KM = 0.5;
const PER_KM_RATE_UGX = 700;
const PER_MIN_RATE_UGX = 50;
const MIN_FEE_UGX = 3000;

export function calculateDeliveryFee(distanceKm: number, durationMin: number): number {
  const billableKm = Math.max(distanceKm - FIRST_STRETCH_DEDUCTED_KM, 0);
  const raw = BASE_FEE_UGX + billableKm * PER_KM_RATE_UGX + durationMin * PER_MIN_RATE_UGX;
  const floored = Math.max(raw, MIN_FEE_UGX);
  return Math.round(floored / 500) * 500;
}

/**
 * Beyond this routed distance, delivery isn't offered for that address at
 * all — a boda ride gets expensive/unreliable well before this, and it's
 * the one number both the guest checkout and the WhatsApp cart flow check
 * against before ever computing a fee.
 */
export const MAX_DELIVERY_RADIUS_KM = 12;

export function isWithinDeliveryRadius(distanceKm: number): boolean {
  return distanceKm <= MAX_DELIVERY_RADIUS_KM;
}
