// src/types/menu-item.ts
//
// The operational counterpart to data/menu.ts's presentational `MenuItem`
// (which powers today's static /menu page). This one is branch-scoped,
// backend-ready, and drives availability/stock — a dish can be marked
// out_of_stock at the Rubaga branch while still selling at Ntinda. Once
// Supabase lands, this becomes the source of truth and the marketing
// site's static catalog is migrated into it; until then the two coexist
// without conflict; nothing in data/menu.ts needs to change today.
import type { BranchEntity, Entity, Money } from "./base";

export type MenuItemAvailabilityStatus = "available" | "out_of_stock" | "hidden";

/** A category is its own record (not a hardcoded union like data/menu.ts's `MenuCategory`) because a real platform lets a Branch Manager add/reorder categories per branch instead of shipping a code change for every menu update. */
export interface MenuCategoryRecord extends Entity {
  /** null = shared across every branch's catalog; set = a branch-specific category. */
  branchId: string | null;
  name: string;
  sortOrder: number;
}

export interface MenuItemVariation {
  id: string;
  label: string;
  price: Money;
}

export interface MenuItem extends BranchEntity {
  name: string;
  description: string;
  categoryId: string;
  basePrice: Money;
  /** Additional priced options — portion sizes, accompaniments. Empty array when the item has none. */
  variations: MenuItemVariation[];
  imageUrl: string;
  availability: MenuItemAvailabilityStatus;
  isFeatured: boolean;
  isChefPick: boolean;
  /** InventoryItem['id'] — once set, stock automation (Phase 3+) can flip `availability` to out_of_stock automatically when the linked ingredient runs out. */
  linkedInventoryItemId?: string;
}
