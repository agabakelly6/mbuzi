// src/lib/supabase/mapCustomerRow.ts
import type { Customer } from "../../types/customer";

export interface CustomerRow {
  id: string;
  user_id: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  default_delivery_address: string | null;
  preferred_branch_id: string | null;
  loyalty_member_id: string | null;
  marketing_opt_in: boolean;
  created_at: string;
  updated_at: string;
}

export function mapCustomerRow(row: CustomerRow): Customer {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email ?? undefined,
    defaultDeliveryAddress: row.default_delivery_address ?? undefined,
    preferredBranchId: row.preferred_branch_id ?? undefined,
    loyaltyMemberId: row.loyalty_member_id ?? undefined,
    marketingOptIn: row.marketing_opt_in,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
