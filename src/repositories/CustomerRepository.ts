// src/repositories/CustomerRepository.ts
import type { Customer } from "../types/customer";
import type { ListOptions, Paginated, RepositoryResult } from "./shared";

export interface CustomerRepository {
  findById(id: string): Promise<RepositoryResult<Customer>>;
  findByPhone(phone: string): Promise<RepositoryResult<Customer>>;
  /** Looks up the Customer linked to an auth.users id (Customer['userId'], added alongside that link — see types/customer.ts). The lookup UserRepository.findById-style methods needed for a self-service "my account" flow. */
  findByUserId(userId: string): Promise<RepositoryResult<Customer>>;
  list(options?: ListOptions): Promise<RepositoryResult<Paginated<Customer>>>;
  create(customer: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<RepositoryResult<Customer>>;
  update(id: string, changes: Partial<Omit<Customer, "id" | "createdAt" | "updatedAt">>): Promise<RepositoryResult<Customer>>;
  delete(id: string): Promise<RepositoryResult<void>>;
}
