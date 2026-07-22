// src/types/base.ts
//
// Shared shapes every Phase 2 platform entity builds on, so "what does a
// record look like once Supabase is the source of truth" is answered once
// instead of per-entity. `id` maps to a Postgres uuid primary key,
// createdAt/updatedAt to timestamptz columns with defaults/triggers —
// nothing here is Supabase-specific, but the shapes are chosen so that
// mapping is direct when Phase 3 generates the schema from these types.

/** Root-level unique identifier. `string` today (any format); a uuid once a real database backs it. */
export type UUID = string;

/** Always an ISO-8601 string end to end — API responses, form state, and storage all agree on one representation, no Date objects crossing a serialization boundary. */
export type ISODateString = string;

/** Whole UGX units (no subunit/cents) — matches how price already flows through the existing WhatsApp cart (`CartLine.unitPrice` in cart.ts). Kept as a distinct alias rather than bare `number` so a future multi-currency change is a type search-and-replace, not a guess. */
export type Money = number;

export interface Identifiable {
  id: UUID;
}

export interface Timestamps {
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** Base shape for any platform-wide record (not tied to one branch) — e.g. Customer, User, Notification. */
export interface Entity extends Identifiable, Timestamps {}

/** Base shape for any record that belongs to exactly one branch — the overwhelming majority of operational entities (Order, Table, Reservation, KitchenTicket...). Branch scoping is enforced at three layers that must all agree: this field, lib/rbac.ts's `isWithinScope`, and — once Phase 3 lands — Postgres RLS policies keyed on the same column. */
export interface BranchEntity extends Entity {
  branchId: UUID;
}
