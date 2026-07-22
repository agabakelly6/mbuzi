// src/types/kitchen.ts
//
// A KitchenTicket is generated from an Order the moment it's accepted —
// one ticket per order, one line per OrderItem — and is what the kitchen
// display system (chef's screen) actually works from. Its item-level
// statuses let a chef mark individual dishes ready independently (a grill
// item finishing well before a smoothie) while the ticket as a whole only
// reaches "ready" once every line does.
import type { BranchEntity } from "./base";

export type KitchenTicketStatus = "queued" | "in_progress" | "ready" | "served" | "cancelled";

export interface KitchenTicketItem {
  orderItemId: string;
  nameSnapshot: string;
  quantity: number;
  specialInstructions?: string;
  status: KitchenTicketStatus;
}

export interface KitchenTicket extends BranchEntity {
  orderId: string;
  items: KitchenTicketItem[];
  status: KitchenTicketStatus;
  /** User['id'] of the chef working this ticket, unset while still queued. */
  assignedChefId?: string;
  /** When the ticket entered the kitchen queue — the clock a chef's "elapsed time" display counts from. */
  firedAt: string;
  readyAt?: string;
  servedAt?: string;
}
