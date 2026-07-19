// src/data/menu.ts
//
// Shared menu data model. The homepage's Signature Dishes preview reads
// FEATURED_MENU_ITEMS (unchanged); the full /menu page reads the
// per-category exports below and CHEF_PICK. One array, several derived
// views — adding a dish means adding one object here, not touching every
// consumer.

export type MenuCategory = "signature" | "platters" | "sides" | "drinks";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  category: MenuCategory;
  featured?: boolean;
  chefPick?: boolean;
}

export const MENU_ITEMS: MenuItem[] = [
  // Signature Goat Specials
  {
    id: "whole-goat-choma",
    name: "Whole Goat Choma",
    description:
      "Slow-charred over open charcoal, basted in our farm's signature marinade.",
    price: "UGX 85,000",
    image: "/images/food/whole-goat-choma.jpg",
    category: "signature",
    featured: true,
    chefPick: true,
  },
  {
    id: "muchomo-skewers",
    name: "Muchomo Skewers",
    description:
      "Hand-cut goat skewers, charcoal-grilled and finished with fresh herbs.",
    price: "UGX 35,000",
    image: "/images/food/muchomo-skewers.jpg",
    category: "signature",
    featured: true,
  },
  {
    id: "goat-luwombo",
    name: "Goat Luwombo",
    description:
      "Traditional banana-leaf steamed stew, slow-cooked with garden vegetables.",
    price: "UGX 42,000",
    image: "/images/food/goat-luwombo.jpg",
    category: "signature",
    featured: true,
  },
  {
    id: "peppered-goat-ribs",
    name: "Peppered Goat Ribs",
    description:
      "Farm-raised ribs finished in a smoky pepper glaze, grilled to order.",
    price: "UGX 48,000",
    image: "/images/food/peppered-goat-ribs.jpg",
    category: "signature",
    featured: true,
  },

  // Family & Sharing Platters
  {
    id: "family-goat-platter",
    name: "Family Goat Platter",
    description:
      "A generous sharing platter of mixed goat cuts, grilled and roasted, served with all the trimmings.",
    price: "UGX 150,000",
    image: "/images/food/family-goat-platter.jpg",
    category: "platters",
  },
  {
    id: "mixed-grill-sharing",
    name: "Mixed Grill Sharing Board",
    description:
      "Goat, chicken, and beef off the charcoal, plated together for the table.",
    price: "UGX 130,000",
    image: "/images/food/mixed-grill-sharing.jpg",
    category: "platters",
  },
  {
    id: "goat-feast-platter",
    name: "The Goat Feast",
    description:
      "Our largest platter — whole roasted cuts, skewers, and sides, built for six or more.",
    price: "UGX 220,000",
    image: "/images/food/goat-feast-platter.jpg",
    category: "platters",
  },

  // Local Sides
  {
    id: "kachumbari",
    name: "Kachumbari",
    description:
      "Fresh tomato, onion, and chili salad, sharp and cooling alongside the grill.",
    price: "UGX 10,000",
    image: "/images/food/kachumbari.jpg",
    category: "sides",
  },
  {
    id: "ugali",
    name: "Ugali",
    description: "Steamed maize meal, the classic companion to any choma.",
    price: "UGX 8,000",
    image: "/images/food/ugali.jpg",
    category: "sides",
  },
  {
    id: "matooke",
    name: "Matooke",
    description:
      "Steamed and mashed green banana, a Ugandan staple done the traditional way.",
    price: "UGX 12,000",
    image: "/images/food/matooke.jpg",
    category: "sides",
  },

  // Drinks Menu
  {
    id: "fresh-passion-juice",
    name: "Fresh Passion Juice",
    description: "Cold-pressed passion fruit, nothing added.",
    price: "UGX 12,000",
    image: "/images/food/fresh-passion-juice.jpg",
    category: "drinks",
  },
  {
    id: "hibiscus-cooler",
    name: "Hibiscus Cooler",
    description: "Chilled hibiscus (wonyo), lightly sweetened.",
    price: "UGX 10,000",
    image: "/images/food/hibiscus-cooler.jpg",
    category: "drinks",
  },
  {
    id: "chilled-ugandan-lager",
    name: "Chilled Ugandan Lager",
    description: "Served ice-cold, the way it should be with choma.",
    price: "UGX 9,000",
    image: "/images/food/chilled-ugandan-lager.jpg",
    category: "drinks",
  },
];

export const FEATURED_MENU_ITEMS = MENU_ITEMS.filter((item) => item.featured);
export const SIGNATURE_ITEMS = MENU_ITEMS.filter((item) => item.category === "signature");
export const PLATTER_ITEMS = MENU_ITEMS.filter((item) => item.category === "platters");
export const SIDE_ITEMS = MENU_ITEMS.filter((item) => item.category === "sides");
export const DRINK_ITEMS = MENU_ITEMS.filter((item) => item.category === "drinks");
export const CHEF_PICK = MENU_ITEMS.find((item) => item.chefPick);
