// src/repositories/LoyaltyRepository.ts
import type { LoyaltyMember, LoyaltyTransaction } from "../types/loyalty";
import type { RepositoryResult } from "./shared";

export interface LoyaltyRepository {
  findMemberByCustomerId(customerId: string): Promise<RepositoryResult<LoyaltyMember>>;
  enroll(customerId: string): Promise<RepositoryResult<LoyaltyMember>>;
  listTransactions(loyaltyMemberId: string): Promise<RepositoryResult<LoyaltyTransaction[]>>;
  recordTransaction(transaction: Omit<LoyaltyTransaction, "id" | "createdAt" | "updatedAt">): Promise<RepositoryResult<LoyaltyTransaction>>;
}
