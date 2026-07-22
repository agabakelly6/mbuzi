// src/services/MenuService.ts
import type { MenuItem, MenuItemAvailabilityStatus } from "../types/menu-item";
import type { RepositoryResult, Paginated } from "../repositories/shared";
import type { MenuItemListFilters } from "../repositories/MenuRepository";
import type { CreateMenuItemInput, UpdateMenuItemInput } from "../validators/menuItem.schema";

export interface MenuService {
  getMenu(filters: MenuItemListFilters): Promise<RepositoryResult<Paginated<MenuItem>>>;
  addItem(input: CreateMenuItemInput): Promise<RepositoryResult<MenuItem>>;
  updateItem(id: string, input: UpdateMenuItemInput): Promise<RepositoryResult<MenuItem>>;
  /** Chef-facing: flip a dish out of stock mid-service without a full edit form. */
  setAvailability(id: string, availability: MenuItemAvailabilityStatus): Promise<RepositoryResult<MenuItem>>;
}
