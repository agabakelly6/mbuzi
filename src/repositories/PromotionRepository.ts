// src/repositories/PromotionRepository.ts
import type { Promotion } from "../types/promotion";
import type { ListOptions, Paginated, RepositoryResult } from "./shared";

export interface PromotionRepository {
  findById(id: string): Promise<RepositoryResult<Promotion>>;
  findByCode(code: string, branchId: string): Promise<RepositoryResult<Promotion>>;
  list(options?: ListOptions & { activeOnly?: boolean }): Promise<RepositoryResult<Paginated<Promotion>>>;
  create(promotion: Omit<Promotion, "id" | "createdAt" | "updatedAt" | "usageCount">): Promise<RepositoryResult<Promotion>>;
  update(id: string, changes: Partial<Omit<Promotion, "id" | "createdAt" | "updatedAt">>): Promise<RepositoryResult<Promotion>>;
  incrementUsage(id: string): Promise<RepositoryResult<Promotion>>;
  deactivate(id: string): Promise<RepositoryResult<Promotion>>;
}
