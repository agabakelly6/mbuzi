// src/media/farm.ts
//
// Canonical farm photography. Was previously duplicated inline as
// data/farm-story.ts's FARM_GALLERY array — that array has been removed;
// FarmGalleryPreview.astro now imports from here instead.

import type { FarmImage } from "../types/media";

export const FARM_IMAGES: FarmImage[] = [
  {
    id: "farm-morning-pasture",
    title: "Morning Pasture",
    description: "The herd out at first light, before the day's heat sets in.",
    src: "/images/farm/gallery/morning-pasture.jpg",
    alt: "Goats grazing on open pasture at YPA's farm in the early morning",
    category: "farm",
    featured: true,
    width: 1200,
    height: 900,
  },
  {
    id: "farm-the-herd",
    title: "The Herd",
    description: "Free-roaming and grass-fed, exactly the way we've always done it.",
    src: "/images/farm/gallery/the-herd.jpg",
    alt: "A herd of goats roaming freely across the YPA farm",
    category: "farm",
    featured: true,
    width: 1200,
    height: 900,
  },
  {
    id: "farm-hand-selection",
    title: "Hand Selection",
    description: "Our butchers choosing each animal individually — no bulk sourcing.",
    src: "/images/farm/gallery/hand-selection.jpg",
    alt: "A YPA butcher hand-selecting a goat at the farm",
    category: "farm",
    featured: false,
    width: 1200,
    height: 900,
  },
  {
    id: "farm-charcoal-prep",
    title: "Charcoal Prep",
    description: "Building the fire the traditional way, well before service starts.",
    src: "/images/farm/gallery/charcoal-prep.jpg",
    alt: "Charcoal being prepared for grilling at YPA Mbuzi Choma",
    category: "farm",
    featured: false,
    width: 1200,
    height: 900,
  },
  {
    id: "farm-on-the-grill",
    title: "On The Grill",
    description: "Slow-charred over open flame, tended by hand the whole way through.",
    src: "/images/farm/gallery/on-the-grill.jpg",
    alt: "Goat meat slow-grilling over open charcoal",
    category: "farm",
    featured: true,
    width: 1200,
    height: 900,
  },
  {
    id: "farm-sunset",
    title: "Farm Sunset",
    description: "The end of a working day on the land that feeds the restaurant.",
    src: "/images/farm/gallery/farm-sunset.jpg",
    alt: "Sunset over the YPA family farm outside Kampala",
    category: "farm",
    featured: false,
    width: 1200,
    height: 900,
  },
];