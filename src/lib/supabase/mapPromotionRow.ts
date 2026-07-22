// src/lib/supabase/mapPromotionRow.ts
import type { Promotion, PromotionType } from "../../types/promotion";

export interface PromotionRow {
  id: string;
  branch_id: string;
  code: string;
  name: string;
  type: PromotionType;
  value: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  min_order_value: number | null;
  usage_limit: number | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export function mapPromotionRow(row: PromotionRow): Promotion {
  return {
    id: row.id,
    branchId: row.branch_id,
    code: row.code,
    name: row.name,
    type: row.type,
    value: row.value,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isActive: row.is_active,
    minOrderValue: row.min_order_value ?? undefined,
    usageLimit: row.usage_limit ?? undefined,
    usageCount: row.usage_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
