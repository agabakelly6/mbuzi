// src/media/gallery.ts
//
// The Gallery page's single import. Merges every category collection
// rather than the page reaching into food.ts/farm.ts/restaurant.ts/
// team.ts/events.ts individually — if a new category is ever added, this
// is the one file that needs updating, not the page itself.

import type { GalleryImage, MediaCategory } from "../types/media";
import { FOOD_IMAGES } from "./food";
import { FARM_IMAGES } from "./farm";
import { RESTAURANT_IMAGES, BRANCH_IMAGES, FEATURE_IMAGES } from "./restaurant";
import { TEAM_IMAGES } from "./team";
import { EVENT_IMAGES } from "./event";

// Reuses the Ntinda branch's pool photo and Maddu's entrance shot from
// BRANCH_IMAGES rather than duplicating them — BRANCH_IMAGES itself stays
// out of this merge (see the note in restaurant.ts) so the rest of the
// branch-specific set doesn't flood the general gallery.
const NTINDA_SWIMMING_POOL = BRANCH_IMAGES.find(
  (image) => image.id === "restaurant-ntinda-swimming-pool"
)!;
const MADDU_ENTRANCE = BRANCH_IMAGES.find((image) => image.id === "restaurant-maddu-entrance")!;

export const GALLERY_IMAGES: GalleryImage[] = [
  ...FOOD_IMAGES,
  ...FARM_IMAGES,
  ...RESTAURANT_IMAGES,
  NTINDA_SWIMMING_POOL,
  MADDU_ENTRANCE,
  ...FEATURE_IMAGES,
  ...TEAM_IMAGES,
  ...EVENT_IMAGES,
];

export const FEATURED_GALLERY_IMAGES: GalleryImage[] = GALLERY_IMAGES.filter(
  (image) => image.featured
);

export interface GalleryFilterOption {
  id: MediaCategory | "all";
  label: string;
}

export const GALLERY_FILTERS: GalleryFilterOption[] = [
  { id: "all", label: "All" },
  { id: "food", label: "Food" },
  { id: "farm", label: "Farm" },
  { id: "restaurant", label: "Restaurant" },
  { id: "events", label: "Events" },
  { id: "team", label: "Team" },
];