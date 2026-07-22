// src/services/supabase/SupabaseKitchenService.ts
//
// Orchestrates SupabaseKitchenTicketRepository + models/KitchenModel.ts +
// lib/state-machines.ts's transition rules — the layer UI code should
// depend on, never the repository directly.
//
// Known gap, not fixed here: same as SupabaseOrderService, none of
// KitchenService's interface methods take an acting user/role parameter,
// so authorization for claimTicket/updateItemStatus/markReady relies
// entirely on the database's RLS policies (kitchen_tickets_update) rather
// than a service-level role check like OrderService gets from
// canRoleTransitionOrder. That's consistent with the existing interface,
// not something this implementation can add without changing it.
import type { KitchenService } from "../KitchenService";
import { dbError } from "../../lib/supabase/dbErrors";
import { canTransitionKitchenTicketStatus } from "../../lib/state-machines";
import { canTransitionKitchenTicket, allItemsReady } from "../../models/KitchenModel";
import { supabaseKitchenTicketRepository } from "../../repositories/supabase/SupabaseKitchenTicketRepository";
import { supabaseOrderRepository } from "../../repositories/supabase/SupabaseOrderRepository";

export const supabaseKitchenService: KitchenService = {
  async getQueue(filters) {
    const result = await supabaseKitchenTicketRepository.list(filters);
    if (result.error || !result.data) return { data: null, error: result.error };
    return { data: result.data.items, error: null };
  },

  async createTicketForOrder(orderId) {
    // The normal path: the on_order_accepted DB trigger (see the kitchen
    // ticket auto-creation migration) already created this the instant
    // the order moved to 'accepted' — this just looks it up. The direct
    // insert below only runs (and only succeeds, per RLS) as a fallback
    // for an order accepted before that trigger existed.
    const existing = await supabaseKitchenTicketRepository.findByOrderId(orderId);
    if (existing.data) return existing;

    const { data: order, error: orderError } = await supabaseOrderRepository.findById(orderId);
    if (orderError || !order) return { data: null, error: orderError ?? dbError("not_found") };

    return supabaseKitchenTicketRepository.create({
      branchId: order.branchId,
      orderId: order.id,
      items: order.items.map((item) => ({
        orderItemId: item.id,
        nameSnapshot: item.nameSnapshot,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions,
        status: "queued",
      })),
      firedAt: new Date().toISOString(),
    });
  },

  async claimTicket(id, chefId) {
    const assigned = await supabaseKitchenTicketRepository.assignChef(id, chefId);
    if (assigned.error || !assigned.data) return assigned;

    if (canTransitionKitchenTicket(assigned.data, "in_progress")) {
      return supabaseKitchenTicketRepository.updateStatus(id, "in_progress");
    }
    return assigned;
  },

  async updateItemStatus(id, orderItemId, status) {
    const { data: ticket, error } = await supabaseKitchenTicketRepository.findById(id);
    if (error || !ticket) return { data: null, error: error ?? dbError("not_found") };

    const item = ticket.items.find((i) => i.orderItemId === orderItemId);
    if (!item) return { data: null, error: dbError("not_found") };
    if (!canTransitionKitchenTicketStatus(item.status, status)) {
      return { data: null, error: dbError("validation_error") };
    }

    const result = await supabaseKitchenTicketRepository.updateItemStatus(id, orderItemId, status);
    if (result.error || !result.data) return result;

    // The ticket as a whole only reaches "ready" once every line does —
    // matches types/kitchen.ts's own header comment.
    if (result.data.status !== "ready" && allItemsReady(result.data) && canTransitionKitchenTicket(result.data, "ready")) {
      return supabaseKitchenTicketRepository.updateStatus(id, "ready");
    }
    return result;
  },

  async markReady(id) {
    const { data: ticket, error } = await supabaseKitchenTicketRepository.findById(id);
    if (error || !ticket) return { data: null, error: error ?? dbError("not_found") };
    if (!canTransitionKitchenTicket(ticket, "ready")) {
      return { data: null, error: dbError("validation_error") };
    }
    return supabaseKitchenTicketRepository.updateStatus(id, "ready");
  },
};
