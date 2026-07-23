// src/lib/supabase/mapBranchRow.ts
import type { Branch, BranchSettings, BranchStatus } from "../../types/branch";

export interface BranchRow {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  status: BranchStatus;
  manager_id: string | null;
  settings: BranchSettings;
  created_at: string;
  updated_at: string;
}

export function mapBranchRow(row: BranchRow): Branch {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    city: row.city,
    address: row.address,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    status: row.status,
    managerId: row.manager_id,
    settings: row.settings,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
