// src/data/menu-sections.ts
//
// Category ids/labels shared between MenuCategories (the sticky quick
// nav) and pages/menu/index.astro (the section ids it jumps to) — one
// source of truth so a label or id never drifts between the two.

export interface MenuSection {
  id: string;
  label: string;
}

export const MENU_SECTIONS: MenuSection[] = [
  { id: "signature-specials", label: "Signature Specials" },
  { id: "platters", label: "Family & Sharing" },
  { id: "sides", label: "Local Sides" },
  { id: "drinks", label: "Drinks" },
];
