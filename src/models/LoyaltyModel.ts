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

/** One order's spend, mapped to the points it earns. Placeholder figures — same convention as data/delivery.ts's fee table — meant to be tuned to real numbers before this goes live, not treated as final. */
export interface LoyaltyEarnBracket {
  /** Inclusive. */
  minSpend: number;
  /** Inclusive; null means open-ended (no upper bound). */
  maxSpend: number | null;
  points: number;
}

export const LOYALTY_EARN_BRACKETS: LoyaltyEarnBracket[] = [
  { minSpend: 10_000, maxSpend: 29_999, points: 1 },
  { minSpend: 30_000, maxSpend: 49_999, points: 3 },
  { minSpend: 50_000, maxSpend: 69_999, points: 5 },
  { minSpend: 70_000, maxSpend: 89_999, points: 7 },
  { minSpend: 90_000, maxSpend: 109_999, points: 9 },
  { minSpend: 110_000, maxSpend: null, points: 11 },
];

/**
 * Points a single order earns, based purely on that order's own total —
 * not cumulative across a customer's order history (that accumulation is
 * `LoyaltyMember.points`, updated separately once this is recorded as a
 * `LoyaltyTransaction`). An order below the first bracket earns nothing.
 */
export function calculateEarnedPoints(orderTotal: number): number {
  const bracket = LOYALTY_EARN_BRACKETS.find(
    (b) => orderTotal >= b.minSpend && (b.maxSpend === null || orderTotal <= b.maxSpend)
  );
  return bracket?.points ?? 0;
}
