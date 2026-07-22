// src/repositories/MenuRepository.ts
import type { MenuItem, MenuItemAvailabilityStatus, MenuCategoryRecord } from "../types/menu-item";
import type { ListOptions, Paginated, RepositoryResult } from "./shared";

export interface MenuItemListFilters extends ListOptions {
  categoryId?: string;
  availability?: MenuItemAvailabilityStatus;
}

export interface MenuRepository {
  findItemById(id: string): Promise<RepositoryResult<MenuItem>>;
  listItems(filters?: MenuItemListFilters): Promise<RepositoryResult<Paginated<MenuItem>>>;
  createItem(item: Omit<MenuItem, "id" | "createdAt" | "updatedAt">): Promise<RepositoryResult<MenuItem>>;
  updateItem(id: string, changes: Partial<Omit<MenuItem, "id" | "createdAt" | "updatedAt">>): Promise<RepositoryResult<MenuItem>>;
  setAvailability(id: string, availability: MenuItemAvailabilityStatus): Promise<RepositoryResult<MenuItem>>;
  deleteItem(id: string): Promise<RepositoryResult<void>>;
  listCategories(branchId?: string): Promise<RepositoryResult<MenuCategoryRecord[]>>;
  createCategory(category: Omit<MenuCategoryRecord, "id" | "createdAt" | "updatedAt">): Promise<RepositoryResult<MenuCategoryRecord>>;
}
