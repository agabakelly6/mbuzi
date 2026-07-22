// src/lib/supabase/mapOrderRow.ts
//
// Maps public.orders (+ its embedded public.order_items, fetched via
// PostgREST's `select("*, order_items(*)")` resource embedding) to the
// domain `Order`/`OrderItem` types.
import type { Order, OrderItem } from "../../types/order";

export interface OrderItemRow {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name_snapshot: string;
  variation_label: string | null;
  unit_price: number;
  quantity: number;
  special_instructions: string | null;
  subtotal: number;
}

export interface OrderRow {
  id: string;
  branch_id: string;
  order_number: string;
  customer_id: string | null;
  channel: Order["channel"];
  status: Order["status"];
  table_id: string | null;
  delivery_id: string | null;
  subtotal: number;
  delivery_fee: number;
  discount_total: number;
  tax_total: number;
  total: number;
  applied_promotion_id: string | null;
  placed_by_user_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItemRow[];
}

function mapOrderItemRow(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    // menu_item_id is nullable in the table (ON DELETE SET NULL, so order
    // history survives a menu item being removed) but OrderItem.menuItemId
    // is non-nullable in the type — name_snapshot is what actually matters
    // for a historical receipt, so an empty string here is a safe, inert
    // fallback rather than a real identifier.
    menuItemId: row.menu_item_id ?? "",
    nameSnapshot: row.name_snapshot,
    variationLabel: row.variation_label ?? undefined,
    unitPrice: row.unit_price,
    quantity: row.quantity,
    specialInstructions: row.special_instructions ?? undefined,
    subtotal: row.subtotal,
  };
}

export function mapOrderRow(row: OrderRow): Order {
  return {
    id: row.id,
    branchId: row.branch_id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    channel: row.channel,
    status: row.status,
    items: (row.order_items ?? []).map(mapOrderItemRow),
    tableId: row.table_id ?? undefined,
    deliveryId: row.delivery_id ?? undefined,
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    discountTotal: row.discount_total,
    taxTotal: row.tax_total,
    total: row.total,
    appliedPromotionId: row.applied_promotion_id ?? undefined,
    placedByUserId: row.placed_by_user_id ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
