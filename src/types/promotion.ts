// src/types/promotion.ts
import type { BranchEntity, Money } from "./base";

export type PromotionType = "percentage_discount" | "fixed_discount" | "bogo" | "free_delivery";

export interface Promotion extends BranchEntity {
  code: string;
  name: string;
  type: PromotionType;
  /** Meaning depends on `type`: a percentage (0–100) for percentage_discount, a Money amount for fixed_discount, unused for bogo/free_delivery. */
  value: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  minOrderValue?: Money;
  usageLimit?: number;
  usageCount: number;
}
