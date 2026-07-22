// src/services/PromotionService.ts
//
// Phase 2 gave every other repository a matching service interface except
// this one — added now, in the same "interface only, no implementation
// tied to it" spirit as the rest of services/*.ts, since order processing
// needs real "apply this code" orchestration, not just repository CRUD.
import type { Promotion } from "../types/promotion";
import type { RepositoryResult } from "../repositories/shared";

export interface PromotionService {
  listActivePromotions(branchId: string): Promise<RepositoryResult<Promotion[]>>;
  /** Checks a code is usable right now (active, within its date window, under its usage limit, order meets minOrderValue) without applying it. */
  validateCode(code: string, branchId: string, orderSubtotal: number): Promise<RepositoryResult<Promotion>>;
  /** Validates the code and computes the resulting discount for an order's subtotal. `discountAmount` is 0 for a `bogo`/`free_delivery` promotion — see models/PromotionModel.ts's calculateDiscount for why. */
  applyToOrder(
    code: string,
    branchId: string,
    orderSubtotal: number
  ): Promise<RepositoryResult<{ promotion: Promotion; discountAmount: number }>>;
}
