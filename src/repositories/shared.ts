// src/repositories/shared.ts
//
// Common shapes every repository interface below is built from, so a
// repository consumer never has to special-case "this one throws, that one
// returns null." Both the pagination and result shapes are deliberately
// modeled after what Supabase's client already returns (`{ data, error }`,
// range-based pagination) — Phase 3 swapping a mock/in-memory
// implementation for a real `@supabase/supabase-js` one should change
// method bodies, not these contracts.

export interface ListOptions {
  branchId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RepositoryError {
  /** Stable machine-readable code (e.g. "not_found", "conflict", "forbidden") — UI/service code branches on this, not on `message`. */
  code: string;
  message: string;
}

/** Every repository method returns this instead of throwing, so a service calling it branches on the outcome explicitly. */
export interface RepositoryResult<T> {
  data: T | null;
  error: RepositoryError | null;
}

/** A live-updating list subscription, used by the repositories backing real-time surfaces (orders board, kitchen display, delivery tracking, notifications). Returns an unsubscribe function — mirrors the shape of a Supabase Realtime channel subscription so wiring the real implementation later is a body swap, not an interface change. */
export type Unsubscribe = () => void;
