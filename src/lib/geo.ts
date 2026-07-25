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
 * Calibrated against real SafeBoda fares for two Kampala routes (base fee
 * + per-km rate, rounded to the nearest 500 UGX): Rubaga branch → Kibuli
 * Hospital (6.52km routed, UGX 5,000) and Kibuli Hospital → Arena Mall
 * (~3km, UGX 3,000). Re-calibrate the same way if real fares drift.
 */
const BASE_FEE_UGX = 1500;
const PER_KM_RATE_UGX = 500;

export function calculateDeliveryFee(distanceKm: number): number {
  const raw = BASE_FEE_UGX + distanceKm * PER_KM_RATE_UGX;
  return Math.round(raw / 500) * 500;
}
