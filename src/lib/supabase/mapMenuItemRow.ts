// src/lib/supabase/mapMenuItemRow.ts
//
// Maps public.menu_items / public.menu_categories rows to the domain
// MenuItem / MenuCategoryRecord types.
import type { MenuItem, MenuItemVariation, MenuCategoryRecord } from "../../types/menu-item";

export interface MenuItemRow {
  id: string;
  branch_id: string;
  name: string;
  description: string;
  category_id: string;
  base_price: number;
  variations: MenuItemVariation[];
  image_url: string;
  availability: MenuItem["availability"];
  is_featured: boolean;
  is_chef_pick: boolean;
  linked_inventory_item_id: string | null;
  created_at: string;
  updated_at: string;
}

export function mapMenuItemRow(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    branchId: row.branch_id,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
    basePrice: row.base_price,
    variations: row.variations ?? [],
    imageUrl: row.image_url,
    availability: row.availability,
    isFeatured: row.is_featured,
    isChefPick: row.is_chef_pick,
    linkedInventoryItemId: row.linked_inventory_item_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface MenuCategoryRow {
  id: string;
  branch_id: string | null;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function mapMenuCategoryRow(row: MenuCategoryRow): MenuCategoryRecord {
  return {
    id: row.id,
    branchId: row.branch_id,
    name: row.name,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
