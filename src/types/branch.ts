// src/types/branch.ts
//
// The operational counterpart to types/location.ts's `Location`. Location
// is presentation content (hero images, gallery, marketing description)
// for the public marketing site; Branch is the operational record every
// staff-facing feature (orders, tables, staff assignment, analytics) scopes
// to. They describe the same real-world restaurant and share an id space,
// but deliberately stay separate types — Location has no `managerId` or
// `settings`, Branch has no `heroImage` or `galleryImages`. Once Supabase
// lands, `branches` is the source-of-truth table; the marketing site's
// LOCATIONS array either reads from it directly or keeps its own content
// fields joined on branchId — that decision belongs to Phase 3, not now.
import type { Entity } from "./base";

export type BranchStatus = "active" | "coming-soon" | "suspended" | "closed";

export interface BranchSettings {
  timezone: string;
  currency: string;
  orderingEnabled: boolean;
  deliveryEnabled: boolean;
  reservationsEnabled: boolean;
  taxRatePercent: number;
}

export interface Branch extends Entity {
  name: string;
  /** Matches Location["id"] in types/location.ts (e.g. "rubaga") — the join key between the marketing and operational sides. */
  slug: string;
  city: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  status: BranchStatus;
  /** User.id of the assigned Branch Manager, or null while unstaffed. */
  managerId: string | null;
  settings: BranchSettings;
}
