// src/lib/supabase/mapInventoryItemRow.ts
import type { InventoryItem, InventoryUnit } from "../../types/inventory";

export interface InventoryItemRow {
  id: string;
  branch_id: string;
  name: string;
  unit: InventoryUnit;
  quantity_on_hand: number;
  reorder_threshold: number;
  created_at: string;
  updated_at: string;
}

export function mapInventoryItemRow(row: InventoryItemRow): InventoryItem {
  return {
    id: row.id,
    branchId: row.branch_id,
    name: row.name,
    unit: row.unit,
    quantityOnHand: row.quantity_on_hand,
    reorderThreshold: row.reorder_threshold,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
