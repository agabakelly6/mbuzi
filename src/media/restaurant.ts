// src/media/restaurant.ts
//
// Canonical restaurant/atmosphere photography. Was previously a local
// const inside RestaurantExperience.astro — that component now imports
// from here instead.

import type { RestaurantImage } from "../types/media";

export const RESTAURANT_IMAGES: RestaurantImage[] = [
  {
    id: "restaurant-family-dining",
    title: "Family Dining",
    description: "Long tables built for sharing a meal, not rushing one.",
    src: "/images/gallery/family-dining.jpg",
    alt: "A family sharing a meal together at YPA Mbuzi Choma",
    category: "restaurant",
    featured: true,
    width: 1200,
    height: 900,
  },
  {
    id: "restaurant-outdoor-seating",
    title: "Outdoor Seating",
    description: "Open-air tables under the trees, closer to the fire.",
    src: "/images/gallery/outdoor-seating.jpg",
    alt: "Outdoor seating area at YPA Mbuzi Choma",
    category: "restaurant",
    featured: true,
    width: 1200,
    height: 900,
  },
  {
    id: "restaurant-private-events",
    title: "Private Events",
    description: "Space set aside for celebrations that deserve their own room.",
    src: "/images/gallery/private-events.jpg",
    alt: "A private event space set up at YPA Mbuzi Choma",
    category: "restaurant",
    featured: false,
    width: 1200,
    height: 900,
  },
  {
    id: "restaurant-warm-atmosphere",
    title: "Warm Atmosphere",
    description: "Low light, open fire, and the kind of noise that means a good night.",
    src: "/images/gallery/warm-atmosphere.jpg",
    alt: "The warm evening atmosphere inside YPA Mbuzi Choma",
    category: "restaurant",
    featured: false,
    width: 1200,
    height: 900,
  },
  // Branch-specific imagery, added for the Locations module. Kept as a
  // SEPARATE export (BRANCH_IMAGES, below) rather than appended to
  // RESTAURANT_IMAGES above — RestaurantExperience.astro consumes that
  // array wholesale for the homepage's 4-item grid, and silently growing
  // it to 10 would break that section's layout.
];

export const BRANCH_IMAGES: RestaurantImage[] = [
  {
    id: "restaurant-rubaga-terrace",
    title: "Rubaga Terrace",
    description: "Our original terrace, right on Rubaga Road.",
    src: "/images/gallery/locations/rubaga-terrace.jpg",
    alt: "The outdoor terrace at YPA Mbuzi Choma's Rubaga branch",
    category: "restaurant",
    featured: true,
    width: 1200,
    height: 900,
  },
  {
    id: "restaurant-rubaga-dining-room",
    title: "Rubaga Dining Room",
    description: "The original dining room, where it all started.",
    src: "/images/gallery/locations/rubaga-dining-room.jpg",
    alt: "The main dining room at YPA Mbuzi Choma's Rubaga branch",
    category: "restaurant",
    featured: false,
    width: 1200,
    height: 900,
  },
  {
    id: "restaurant-ntinda-interior",
    title: "Ntinda Interior",
    description: "A brighter, more compact space built for the neighbourhood.",
    src: "/images/gallery/locations/ntinda-interior.jpg",
    alt: "The interior dining space at YPA Mbuzi Choma's Ntinda branch",
    category: "restaurant",
    featured: false,
    width: 1200,
    height: 900,
  },
  {
    id: "restaurant-ntinda-bar",
    title: "Ntinda Bar",
    description: "A small bar for a drink while the grill gets going.",
    src: "/images/gallery/locations/ntinda-bar.jpg",
    alt: "The bar area at YPA Mbuzi Choma's Ntinda branch",
    category: "restaurant",
    featured: false,
    width: 1200,
    height: 900,
  },
  {
    id: "restaurant-mbarara-grill",
    title: "Mbarara Grill Station",
    description: "The fire, brought west — same method, new city.",
    src: "/images/gallery/locations/mbarara-grill.jpg",
    alt: "The charcoal grill station at YPA Mbuzi Choma's Mbarara branch",
    category: "restaurant",
    featured: false,
    width: 1200,
    height: 900,
  },
  {
    id: "restaurant-mbarara-garden",
    title: "Mbarara Garden Seating",
    description: "Open garden seating, built for Mbarara's cooler evenings.",
    src: "/images/gallery/locations/mbarara-garden.jpg",
    alt: "Garden seating at YPA Mbuzi Choma's Mbarara branch",
    category: "restaurant",
    featured: false,
    width: 1200,
    height: 900,
  },
];

/** Convenience merge for Locations components doing an id lookup across both collections above — RestaurantExperience.astro should keep importing RESTAURANT_IMAGES directly, not this. */
export const LOCATION_IMAGES: RestaurantImage[] = [...BRANCH_IMAGES, ...RESTAURANT_IMAGES];