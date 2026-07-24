// src/lib/supabase/mapTableRow.ts
import type { Table, TableStatus } from "../../types/table";

export interface TableRow {
  id: string;
  branch_id: string;
  label: string;
  seats: number;
  status: TableStatus;
  current_order_id: string | null;
  created_at: string;
  updated_at: string;
}

export function mapTableRow(row: TableRow): Table {
  return {
    id: row.id,
    branchId: row.branch_id,
    label: row.label,
    seats: row.seats,
    status: row.status,
    currentOrderId: row.current_order_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
