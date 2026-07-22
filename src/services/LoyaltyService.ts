// src/services/LoyaltyService.ts
import type { LoyaltyMember } from "../types/loyalty";
import type { RepositoryResult } from "../repositories/shared";

export interface LoyaltyService {
  getMember(customerId: string): Promise<RepositoryResult<LoyaltyMember>>;
  enroll(customerId: string): Promise<RepositoryResult<LoyaltyMember>>;
  /** Applies models/LoyaltyModel.ts's earn rules for a completed order, recalculates tier, and records the resulting LoyaltyTransaction. */
  awardPointsForOrder(orderId: string): Promise<RepositoryResult<LoyaltyMember>>;
  redeemPoints(customerId: string, points: number, reason: string): Promise<RepositoryResult<LoyaltyMember>>;
}
