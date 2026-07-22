// src/repositories/InventoryRepository.ts
//
// Interface-level placeholder matching types/inventory.ts's placeholder
// entity — enough for MenuRepository/ChefService to compile against a
// real contract now, without committing to a full inventory system design.
import type { InventoryItem } from "../types/inventory";
import type { ListOptions, Paginated, RepositoryResult } from "./shared";

export interface InventoryRepository {
  findById(id: string): Promise<RepositoryResult<InventoryItem>>;
  list(options?: ListOptions): Promise<RepositoryResult<Paginated<InventoryItem>>>;
  create(item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">): Promise<RepositoryResult<InventoryItem>>;
  adjustQuantity(id: string, delta: number): Promise<RepositoryResult<InventoryItem>>;
  delete(id: string): Promise<RepositoryResult<void>>;
}
