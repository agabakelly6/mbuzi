// src/repositories/BranchRepository.ts
//
// Interface only — no implementation yet. A future Supabase-backed class
// implements this same contract; every service/hook that needs branch data
// depends on this interface, never on a concrete implementation.
import type { Branch } from "../types/branch";
import type { ListOptions, Paginated, RepositoryResult } from "./shared";

export interface BranchRepository {
  findById(id: string): Promise<RepositoryResult<Branch>>;
  findBySlug(slug: string): Promise<RepositoryResult<Branch>>;
  list(options?: ListOptions): Promise<RepositoryResult<Paginated<Branch>>>;
  create(branch: Omit<Branch, "id" | "createdAt" | "updatedAt">): Promise<RepositoryResult<Branch>>;
  update(id: string, changes: Partial<Omit<Branch, "id" | "createdAt" | "updatedAt">>): Promise<RepositoryResult<Branch>>;
  delete(id: string): Promise<RepositoryResult<void>>;
}
