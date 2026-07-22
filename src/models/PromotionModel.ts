// src/models/PromotionModel.ts
//
// No PromotionModel existed in Phase 2 despite every other resource with a
// repository having one — added now since order processing needs real
// "is this code usable right now" rules, not just a repository lookup.
import type { Promotion } from "../types/promotion";

export function isPromotionCurrentlyValid(promotion: Promotion, now: Date = new Date()): boolean {
  if (!promotion.isActive) return false;
  const nowTime = now.getTime();
  if (nowTime < new Date(promotion.startsAt).getTime()) return false;
  if (nowTime > new Date(promotion.endsAt).getTime()) return false;
  if (promotion.usageLimit !== undefined && promotion.usageCount >= promotion.usageLimit) return false;
  return true;
}

export function meetsMinimumOrderValue(promotion: Promotion, orderSubtotal: number): boolean {
  return promotion.minOrderValue === undefined || orderSubtotal >= promotion.minOrderValue;
}

/**
 * The subtotal discount a promotion produces — 0 for `bogo` and
 * `free_delivery`, whose effects aren't a subtotal discount at all
 * (bogo needs item-level logic this doesn't have enough information to
 * apply correctly; free_delivery zeroes the delivery fee instead, which
 * is the caller's job, not this function's).
 */
export function calculateDiscount(promotion: Promotion, orderSubtotal: number): number {
  switch (promotion.type) {
    case "percentage_discount":
      return Math.round(orderSubtotal * (promotion.value / 100));
    case "fixed_discount":
      return Math.min(promotion.value, orderSubtotal);
    case "bogo":
    case "free_delivery":
      return 0;
  }
}
