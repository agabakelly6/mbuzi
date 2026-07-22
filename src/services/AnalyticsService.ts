// src/services/AnalyticsService.ts
import type { BranchAnalyticsSummary } from "../types/analytics";
import type { RepositoryResult } from "../repositories/shared";

export interface AnalyticsService {
  getBranchSummary(branchId: string): Promise<RepositoryResult<BranchAnalyticsSummary>>;
  /** Platform-wide roll-up across every branch — owner-only per lib/rbac.ts's `analytics` grants. */
  getPlatformSummary(): Promise<RepositoryResult<BranchAnalyticsSummary[]>>;
}
