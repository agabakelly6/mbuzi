// src/models/KitchenModel.ts
import type { KitchenTicket, KitchenTicketStatus } from "../types/kitchen";
import { canTransitionKitchenTicketStatus } from "../lib/state-machines";

export function canTransitionKitchenTicket(ticket: KitchenTicket, to: KitchenTicketStatus): boolean {
  return canTransitionKitchenTicketStatus(ticket.status, to);
}

export function elapsedMinutes(ticket: KitchenTicket, now: Date = new Date()): number {
  return Math.round((now.getTime() - new Date(ticket.firedAt).getTime()) / 60_000);
}

/** A ticket is only actually ready once every line on it is — the whole-ticket status shouldn't be flipped manually while an item still lags behind. */
export function allItemsReady(ticket: KitchenTicket): boolean {
  return ticket.items.every((item) => item.status === "ready" || item.status === "served" || item.status === "cancelled");
}
