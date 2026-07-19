// src/types/media.ts
//
// Shared interfaces for every image used across the site. Category-
// specific media files (src/media/*.ts) export arrays typed against
// these rather than each inventing their own shape — this is what makes
// a single Gallery page able to merge and filter across all of them.

export type MediaCategory = "food" | "farm" | "restaurant" | "team" | "events";

export interface MediaImage {
  /**
   * Stable, unique slug. Used as the React key in grids/lightboxes, and
   * as a cross-reference point when other content data needs to point at
   * a specific photo (e.g. a team roster entry referencing a team.ts
   * portrait) without duplicating the image's metadata.
   */
  id: string;
  /** Short display title — gallery card heading / lightbox caption. */
  title: string;
  /** One or two sentences of context, shown in the lightbox. */
  description: string;
  /** Root-relative path to the image file. */
  src: string;
  /** Accessible alt text — deliberately separate from `title`; good alt copy and a good display title often read differently. */
  alt: string;
  category: MediaCategory;
  /** Marks an image for curated/preview use (e.g. a homepage teaser) without needing a second list. */
  featured: boolean;
  width: number;
  height: number;
}

// Category-narrowed aliases. Structurally identical to MediaImage aside
// from a fixed `category` literal — this is what lets src/media/food.ts
// export `FoodImage[]` instead of a generic `MediaImage[]`, catching a
// misfiled category (e.g. a farm photo accidentally in food.ts) at the
// type level.
export interface FoodImage extends MediaImage {
  category: "food";
}

export interface FarmImage extends MediaImage {
  category: "farm";
}

export interface RestaurantImage extends MediaImage {
  category: "restaurant";
}

export interface TeamImage extends MediaImage {
  category: "team";
}

export interface EventImage extends MediaImage {
  category: "events";
}

/** The merged, any-category shape the Gallery page's filter/grid/lightbox work against. */
export type GalleryImage = MediaImage;