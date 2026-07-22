// src/models/LoyaltyModel.ts
import type { LoyaltyTier } from "../types/loyalty";

/** Cumulative point thresholds — reaching "silver" means 2,000+ lifetime points, not 2,000 more than the previous tier. */
const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  bronze: 0,
  silver: 2000,
  gold: 5000,
  platinum: 10000,
};

export function calculateTier(points: number): LoyaltyTier {
  if (points >= TIER_THRESHOLDS.platinum) return "platinum";
  if (points >= TIER_THRESHOLDS.gold) return "gold";
  if (points >= TIER_THRESHOLDS.silver) return "silver";
  return "bronze";
}

export function pointsToNextTier(points: number): number | null {
  const tier = calculateTier(points);
  if (tier === "platinum") return null;
  const next = tier === "bronze" ? "silver" : tier === "silver" ? "gold" : "platinum";
  return TIER_THRESHOLDS[next] - points;
}
