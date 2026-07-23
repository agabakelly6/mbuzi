// src/services/supabase/SupabasePromotionService.ts
//
// `bogo` promotions are validated like any other but rejected at the
// apply step — buy-one-get-one needs item-level logic (which item is
// free? cheapest? a matching pair?) this doesn't have a clear enough spec
// to guess at, so it's flagged not_implemented rather than silently
// applying a zero discount that looks like it worked.
import type { PromotionService } from "../PromotionService";
import { dbError } from "../../lib/supabase/dbErrors";
import { isPromotionCurrentlyValid, meetsMinimumOrderValue, calculateDiscount } from "../../models/PromotionModel";
import { supabasePromotionRepository } from "../../repositories/supabase/SupabasePromotionRepository";

export const supabasePromotionService: PromotionService = {
  async listActivePromotions(branchId) {
    const result = await supabasePromotionRepository.list({ branchId, activeOnly: true });
    if (result.error || !result.data) return { data: null, error: result.error };
    return { data: result.data.items.filter((p) => isPromotionCurrentlyValid(p)), error: null };
  },

  async validateCode(code, branchId, orderSubtotal) {
    const { data: promotion, error } = await supabasePromotionRepository.findByCode(code, branchId);
    if (error || !promotion) return { data: null, error: error ?? dbError("not_found") };
    if (!isPromotionCurrentlyValid(promotion)) return { data: null, error: dbError("validation_error") };
    if (!meetsMinimumOrderValue(promotion, orderSubtotal)) return { data: null, error: dbError("validation_error") };
    return { data: promotion, error: null };
  },

  async applyToOrder(code, branchId, orderSubtotal) {
    const validated = await supabasePromotionService.validateCode(code, branchId, orderSubtotal);
    if (validated.error || !validated.data) return { data: null, error: validated.error };

    if (validated.data.type === "bogo") {
      return { data: null, error: dbError("not_implemented") };
    }

    const discountAmount =
      validated.data.type === "free_delivery" ? 0 : calculateDiscount(validated.data, orderSubtotal);
    return { data: { promotion: validated.data, discountAmount }, error: null };
  },
};
