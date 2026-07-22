// src/repositories/UserRepository.ts
import type { User, UserStatus } from "../types/user";
import type { RoleName } from "../types/role";
import type { ListOptions, Paginated, RepositoryResult } from "./shared";

export interface UserListFilters extends ListOptions {
  role?: RoleName;
  status?: UserStatus;
}

export interface UserRepository {
  findById(id: string): Promise<RepositoryResult<User>>;
  findByEmail(email: string): Promise<RepositoryResult<User>>;
  list(filters?: UserListFilters): Promise<RepositoryResult<Paginated<User>>>;
  /** Staff invite — creates a `User` in "invited" status ahead of them completing auth signup, scoped to one branch (or none, for an owner-level account). */
  invite(user: Omit<User, "id" | "createdAt" | "updatedAt" | "status" | "lastLoginAt">): Promise<RepositoryResult<User>>;
  update(id: string, changes: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>): Promise<RepositoryResult<User>>;
  suspend(id: string): Promise<RepositoryResult<User>>;
  delete(id: string): Promise<RepositoryResult<void>>;
}
