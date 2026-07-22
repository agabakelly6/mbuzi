// src/types/inventory.ts
//
// Placeholder-level, as requested — just enough shape for MenuItem's
// `linkedInventoryItemId` and the Chef role's inventory permissions to
// compile against something real. A full inventory system (suppliers,
// purchase orders, waste tracking, unit conversion) is out of scope for
// Phase 2 and should be designed fresh when that phase actually starts,
// not guessed at now.
import type { BranchEntity } from "./base";

export type InventoryUnit = "kg" | "litre" | "piece" | "pack";

export interface InventoryItem extends BranchEntity {
  name: string;
  unit: InventoryUnit;
  quantityOnHand: number;
  reorderThreshold: number;
}
