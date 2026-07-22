// src/lib/supabase/mapKitchenTicketRow.ts
import type { KitchenTicket, KitchenTicketItem, KitchenTicketStatus } from "../../types/kitchen";

export interface KitchenTicketItemJson {
  orderItemId: string;
  nameSnapshot: string;
  quantity: number;
  specialInstructions?: string;
  status: KitchenTicketStatus;
}

export interface KitchenTicketRow {
  id: string;
  branch_id: string;
  order_id: string;
  items: KitchenTicketItemJson[];
  status: KitchenTicketStatus;
  assigned_chef_id: string | null;
  fired_at: string;
  ready_at: string | null;
  served_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapItem(item: KitchenTicketItemJson): KitchenTicketItem {
  return {
    orderItemId: item.orderItemId,
    nameSnapshot: item.nameSnapshot,
    quantity: item.quantity,
    specialInstructions: item.specialInstructions,
    status: item.status,
  };
}

export function mapKitchenTicketRow(row: KitchenTicketRow): KitchenTicket {
  return {
    id: row.id,
    branchId: row.branch_id,
    orderId: row.order_id,
    items: (row.items ?? []).map(mapItem),
    status: row.status,
    assignedChefId: row.assigned_chef_id ?? undefined,
    firedAt: row.fired_at,
    readyAt: row.ready_at ?? undefined,
    servedAt: row.served_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
