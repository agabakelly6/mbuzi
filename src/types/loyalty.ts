// src/types/loyalty.ts
//
// Platform-wide, not branch-scoped — a loyalty member earns and redeems
// points across any YPA branch, not just the one they signed up at.
import type { Entity } from "./base";

export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

export interface LoyaltyMember extends Entity {
  customerId: string;
  points: number;
  tier: LoyaltyTier;
  joinedAt: string;
}

export interface LoyaltyTransaction extends Entity {
  loyaltyMemberId: string;
  /** Order['id'] this transaction was earned/redeemed against, if any — a manual adjustment has none. */
  orderId?: string;
  /** Positive = earned, negative = redeemed. */
  points: number;
  reason: string;
}
