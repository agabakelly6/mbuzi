// src/types/analytics.ts
//
// Read-model shapes only — analytics are computed (in Phase 3, most likely
// Postgres views or scheduled aggregation) rather than stored as
// hand-written records, so these describe query results, not tables to
// design SQL for yet.
export interface SalesSnapshot {
  branchId: string;
  periodStart: string;
  periodEnd: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
}

export interface StaffPerformanceSnapshot {
  userId: string;
  branchId: string;
  periodStart: string;
  periodEnd: string;
  ordersHandled: number;
  averagePrepTimeMinutes?: number;
}

export interface TopSellingItem {
  menuItemId: string;
  name: string;
  unitsSold: number;
}

export interface BranchAnalyticsSummary {
  branchId: string;
  today: SalesSnapshot;
  last7Days: SalesSnapshot;
  last30Days: SalesSnapshot;
  topSellingItems: TopSellingItem[];
}
