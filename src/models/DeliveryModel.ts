// src/models/DeliveryModel.ts
import type { Delivery, DeliveryStatus } from "../types/delivery";
import { canTransitionDeliveryStatus } from "../lib/state-machines";

export function canTransitionDelivery(delivery: Delivery, to: DeliveryStatus): boolean {
  return canTransitionDeliveryStatus(delivery.status, to);
}

export function isDeliveryActive(delivery: Delivery): boolean {
  return delivery.status === "assigned" || delivery.status === "picked_up" || delivery.status === "en_route";
}

/** A rider can only be reassigned before pickup — once they've physically collected the order, swapping riders means starting a new delivery, not editing this one. */
export function canReassignRider(delivery: Delivery): boolean {
  return delivery.status === "unassigned" || delivery.status === "assigned";
}
