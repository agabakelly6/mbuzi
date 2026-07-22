// src/types/table.ts
import type { BranchEntity } from "./base";

export type TableStatus = "available" | "occupied" | "reserved" | "needs_cleaning" | "out_of_service";

export interface Table extends BranchEntity {
  /** Floor label, e.g. "T12" — not a system id, this is what staff and guests see. */
  label: string;
  seats: number;
  status: TableStatus;
  /** Order['id'] currently open at this table, if any. */
  currentOrderId?: string;
}
