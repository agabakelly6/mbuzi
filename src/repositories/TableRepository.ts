// src/repositories/TableRepository.ts
import type { Table, TableStatus } from "../types/table";
import type { RepositoryResult } from "./shared";

export interface TableRepository {
  findById(id: string): Promise<RepositoryResult<Table>>;
  listByBranch(branchId: string): Promise<RepositoryResult<Table[]>>;
  create(table: Omit<Table, "id" | "createdAt" | "updatedAt" | "status" | "currentOrderId">): Promise<RepositoryResult<Table>>;
  updateStatus(id: string, status: TableStatus): Promise<RepositoryResult<Table>>;
  assignOrder(id: string, orderId: string): Promise<RepositoryResult<Table>>;
  clear(id: string): Promise<RepositoryResult<Table>>;
  delete(id: string): Promise<RepositoryResult<void>>;
}
