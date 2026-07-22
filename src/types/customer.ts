// src/types/customer.ts
//
// Kept separate from `User` even though both are "an account" — a Customer
// can exist with zero authentication (an anonymous WhatsApp order captures
// name/phone and nothing else) while every `User` is a real login. Once a
// customer creates an account, `User.role` is `"customer"` and this record
// is what it links to for order history, delivery defaults, and loyalty —
// the auth identity and the customer profile stay independently editable.
import type { Entity } from "./base";

export interface Customer extends Entity {
  fullName: string;
  phone: string;
  email?: string;
  /** auth.users['id'] once this customer has a real account — undefined for an anonymous/guest customer (e.g. a WhatsApp order captured by name/phone only). Lets RLS express "is this my order/reservation/loyalty account" for an authenticated customer. */
  userId?: string;
  defaultDeliveryAddress?: string;
  /** Branch['id'] of the branch this customer orders from most, used to personalize menu/promotions defaults. */
  preferredBranchId?: string;
  /** LoyaltyMember['id'] once enrolled — undefined until they join. */
  loyaltyMemberId?: string;
  marketingOptIn: boolean;
}
