// src/services/supabase/SupabaseReservationService.ts
import type { ReservationService } from "../ReservationService";
import { createReservationInputSchema } from "../../validators/reservation.schema";
import { dbError } from "../../lib/supabase/dbErrors";
import { canTransitionReservation, isReservationModifiable } from "../../models/ReservationModel";
import { supabaseReservationRepository } from "../../repositories/supabase/SupabaseReservationRepository";

export const supabaseReservationService: ReservationService = {
  async getReservation(id) {
    return supabaseReservationRepository.findById(id);
  },

  async listReservations(filters) {
    return supabaseReservationRepository.list(filters);
  },

  async requestReservation(input) {
    const parsed = createReservationInputSchema.safeParse(input);
    if (!parsed.success) return { data: null, error: dbError("validation_error") };
    return supabaseReservationRepository.create(parsed.data);
  },

  async confirmReservation(id, tableId) {
    const { data: reservation, error } = await supabaseReservationRepository.findById(id);
    if (error || !reservation) return { data: null, error: error ?? dbError("not_found") };
    if (!canTransitionReservation(reservation, "confirmed")) return { data: null, error: dbError("validation_error") };

    if (tableId) {
      const assigned = await supabaseReservationRepository.assignTable(id, tableId);
      if (assigned.error) return assigned;
    }
    return supabaseReservationRepository.updateStatus(id, "confirmed");
  },

  async transitionStatus(id, to) {
    const { data: reservation, error } = await supabaseReservationRepository.findById(id);
    if (error || !reservation) return { data: null, error: error ?? dbError("not_found") };

    if (to === "cancelled" && !isReservationModifiable(reservation)) {
      return { data: null, error: dbError("validation_error") };
    }
    if (!canTransitionReservation(reservation, to)) return { data: null, error: dbError("validation_error") };

    return supabaseReservationRepository.updateStatus(id, to);
  },
};
