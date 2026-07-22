// src/media/food.ts
//
// Gallery-facing food/grill photography — atmospheric shots of the food
// and the fire, not per-dish catalog thumbnails. data/menu.ts's MenuItem
// images serve a different purpose (identifying a specific dish to order)
// and intentionally stay separate; these two collections may photograph
// similar subjects without being the same data.

import type { FoodImage } from "../types/media";

export const FOOD_IMAGES: FoodImage[] = [
  {
    id: "food-whole-goat-fire",
    title: "Whole Goat, Open Fire",
    description: "The centerpiece dish, hours into a slow charcoal grill.",
    src: "/images/gallery/food/whole-goat-fire.jpg",
    alt: "A whole goat grilling over open charcoal fire",
    category: "food",
    featured: true,
    width: 1200,
    height: 900,
  },
  {
    id: "food-charcoal-flames",
    title: "Charcoal Flames",
    description: "Real wood charcoal, built up and tended by hand.",
    src: "/images/gallery/food/charcoal-flames.jpg",
    alt: "Close-up of charcoal flames used for grilling at YPA",
    category: "food",
    featured: false,
    width: 1200,
    height: 900,
  },
  {
    id: "food-fresh-cuts",
    title: "Fresh Cuts",
    description: "Hand-butchered the same day the meat reaches the grill.",
    src: "/images/gallery/food/fresh-cuts.jpg",
    alt: "Freshly butchered goat cuts prepared for grilling",
    category: "food",
    featured: false,
    width: 1200,
    height: 900,
  },
  {
    id: "food-plated-choma",
    title: "Plated Choma",
    description: "Straight off the grill and onto the table.",
    src: "/images/gallery/food/plated-choma.jpg",
    alt: "A plate of grilled goat choma ready to serve",
    category: "food",
    featured: true,
    width: 1200,
    height: 900,
  },
  {
    id: "food-grill-master-at-work",
    title: "Grill Master At Work",
    description: "Every skewer turned and watched, never left unattended.",
    src: "/images/gallery/food/grill-master-at-work.jpg",
    alt: "A YPA grill master tending skewers over the fire",
    category: "food",
    featured: false,
    width: 1200,
    height: 900,
  },
  {
    id: "food-smoke-and-fire",
    title: "Smoke & Fire",
    description: "The smell that fills the whole street before service starts.",
    src: "/images/gallery/food/smoke-and-fire.jpg",
    alt: "Smoke rising from the charcoal grills at YPA Mbuzi Choma",
    category: "food",
    featured: false,
    width: 1200,
    height: 900,
  },
  {
    id: "food-lusaniya-platter",
    title: "Lusaniya Platter",
    description: "A sharing platter of grilled goat cuts, built for the table.",
    src: "/images/gallery/food/lusaniya-platter.jpg",
    alt: "A Lusaniya sharing platter of grilled goat cuts at YPA Mbuzi Choma",
    category: "food",
    featured: false,
    width: 1200,
    height: 900,
  },
];