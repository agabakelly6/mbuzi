// src/data/menu-sections.ts
//
// Category ids/labels shared between MenuCategories (the sticky quick
// nav) and pages/menu/index.astro (the section ids it jumps to) — one
// source of truth so a label or id never drifts between the two. Ids
// match MenuItem["category"] values in data/menu.ts one-to-one, so
// section -> item lookups (here and in config/seo.ts's menu schema)
// need no separate mapping table.

export interface MenuSection {
  id: string;
  label: string;
}

export const MENU_SECTIONS: MenuSection[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "main-course", label: "Main Course" },
  { id: "burgers", label: "Burgers" },
  { id: "sandwiches", label: "Sandwiches" },
  { id: "pizza", label: "Pizza" },
  { id: "lusaniya", label: "Lusaniya" },
  { id: "smoothies", label: "Smoothies" },
  { id: "drinks", label: "Drinks" },
];
