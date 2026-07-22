// src/services/supabase/SupabaseDeliveryService.ts
//
// Known gap, not fixed here: `assignRider`'s interface allows an omitted
// riderId, meaning "pick the best available rider automatically (round-
// robin/nearest)." That auto-assignment algorithm doesn't exist — it's
// real routing/availability logic, not delivery-workflow plumbing — so
// this implementation only handles the explicit-riderId path and returns
// not_implemented otherwise.
import type { DeliveryService } from "../DeliveryService";
import { createDeliveryInputSchema } from "../../validators/delivery.schema";
import { dbError } from "../../lib/supabase/dbErrors";
import { canReassignRider, canTransitionDelivery } from "../../models/DeliveryModel";
import { supabaseDeliveryRepository } from "../../repositories/supabase/SupabaseDeliveryRepository";

export const supabaseDeliveryService: DeliveryService = {
  async getDelivery(id) {
    return supabaseDeliveryRepository.findById(id);
  },

  async listDeliveries(filters) {
    return supabaseDeliveryRepository.list(filters);
  },

  async createForOrder(input) {
    const parsed = createDeliveryInputSchema.safeParse(input);
    if (!parsed.success) return { data: null, error: dbError("validation_error") };
    return supabaseDeliveryRepository.create(parsed.data);
  },

  async assignRider(id, riderId) {
    if (!riderId) {
      return { data: null, error: dbError("not_implemented") };
    }

    const { data: delivery, error } = await supabaseDeliveryRepository.findById(id);
    if (error || !delivery) return { data: null, error: error ?? dbError("not_found") };
    if (!canReassignRider(delivery)) return { data: null, error: dbError("validation_error") };

    return supabaseDeliveryRepository.assignRider(id, riderId);
  },

  async transitionStatus(id, to) {
    const { data: delivery, error } = await supabaseDeliveryRepository.findById(id);
    if (error || !delivery) return { data: null, error: error ?? dbError("not_found") };
    if (!canTransitionDelivery(delivery, to)) return { data: null, error: dbError("validation_error") };

    return supabaseDeliveryRepository.updateStatus(id, to);
  },
};
