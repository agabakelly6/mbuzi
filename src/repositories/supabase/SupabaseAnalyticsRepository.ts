// src/repositories/supabase/SupabaseAnalyticsRepository.ts
//
// Thin wrapper over three SECURITY DEFINER Postgres functions
// (get_sales_snapshot / get_branch_analytics_summary / get_staff_performance,
// see supabase/migrations/20260724010000_analytics.sql) — the aggregation
// itself lives in the database, not here, since there's no server runtime
// to host a dedicated analytics service and client-side summing doesn't
// scale past a page of rows. Each RPC re-checks the caller's role/branch
// itself, so a 42501 from Postgres maps to "forbidden" the same way any
// RLS denial does elsewhere.
import type { AnalyticsRepository } from "../AnalyticsRepository";
import type { BranchAnalyticsSummary, SalesSnapshot, StaffPerformanceSnapshot } from "../../types/analytics";
import type { RepositoryResult } from "../shared";
import { supabase } from "../../lib/supabase/client";
import { dbError, mapDbError } from "../../lib/supabase/dbErrors";

interface SalesSnapshotRow {
  order_count: number;
  revenue: number;
  average_order_value: number;
}

interface StaffPerformanceRow {
  orders_handled: number;
  average_prep_time_minutes: number | null;
}

export const supabaseAnalyticsRepository: AnalyticsRepository = {
  async getBranchSummary(branchId: string): Promise<RepositoryResult<BranchAnalyticsSummary>> {
    const { data, error } = await supabase.rpc("get_branch_analytics_summary", { p_branch_id: branchId });
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: data as BranchAnalyticsSummary, error: null };
  },

  async getSalesSnapshot(branchId: string, periodStart: string, periodEnd: string): Promise<RepositoryResult<SalesSnapshot>> {
    const { data, error } = await supabase.rpc("get_sales_snapshot", {
      p_branch_id: branchId,
      p_period_start: periodStart,
      p_period_end: periodEnd,
    });
    if (error) return { data: null, error: mapDbError(error) };

    const row = (data as SalesSnapshotRow[] | null)?.[0];
    if (!row) return { data: null, error: dbError("not_found") };

    return {
      data: {
        branchId,
        periodStart,
        periodEnd,
        orderCount: row.order_count,
        revenue: row.revenue,
        averageOrderValue: row.average_order_value,
      },
      error: null,
    };
  },

  async getStaffPerformance(userId: string, periodStart: string, periodEnd: string): Promise<RepositoryResult<StaffPerformanceSnapshot>> {
    const { data: userRow, error: userError } = await supabase.from("users").select("branch_id").eq("id", userId).maybeSingle();
    if (userError) return { data: null, error: mapDbError(userError) };
    if (!userRow) return { data: null, error: dbError("not_found") };

    const { data, error } = await supabase.rpc("get_staff_performance", {
      p_user_id: userId,
      p_period_start: periodStart,
      p_period_end: periodEnd,
    });
    if (error) return { data: null, error: mapDbError(error) };

    const row = (data as StaffPerformanceRow[] | null)?.[0];
    if (!row) return { data: null, error: dbError("not_found") };

    return {
      data: {
        userId,
        branchId: userRow.branch_id as string,
        periodStart,
        periodEnd,
        ordersHandled: row.orders_handled,
        averagePrepTimeMinutes: row.average_prep_time_minutes ?? undefined,
      },
      error: null,
    };
  },
};
