// src/repositories/AnalyticsRepository.ts
//
// Read-only by design — analytics are derived from other tables (orders,
// payments...), never written to directly, so there's no create/update/
// delete here to mirror.
import type { BranchAnalyticsSummary, SalesSnapshot, StaffPerformanceSnapshot } from "../types/analytics";
import type { RepositoryResult } from "./shared";

export interface AnalyticsRepository {
  getBranchSummary(branchId: string): Promise<RepositoryResult<BranchAnalyticsSummary>>;
  getSalesSnapshot(branchId: string, periodStart: string, periodEnd: string): Promise<RepositoryResult<SalesSnapshot>>;
  getStaffPerformance(userId: string, periodStart: string, periodEnd: string): Promise<RepositoryResult<StaffPerformanceSnapshot>>;
}
