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
    id: "restaurant-rubaga-interior",
    title: "Rubaga Interior",
    description: "The main dining room, where it all started.",
    src: "/images/gallery/locations/rubaga-interior.jpg",
    alt: "The interior dining space at YPA Mbuzi Choma's Rubaga branch",
    category: "restaurant",
    featured: true,
    width: 1200,
    height: 900,
  },
  {
    id: "restaurant-rubaga-entrance",
    title: "Rubaga Entrance",
    description: "The entrance right on Rubaga Road.",
    src: "/images/gallery/locations/rubaga-entrance.jpg",
    alt: "The entrance to YPA Mbuzi Choma's Rubaga branch",
    category: "restaurant",
    featured: false,
    width: 1200,
    height: 900,
  },
  {
    id: "restaurant-rubaga-outside-sitting",
    title: "Rubaga Outside Seating",
    description: "Outdoor seating right off the terrace.",
    src: "/images/gallery/locations/rubaga-outside-sitting.jpg",
    alt: "Outdoor seating at YPA Mbuzi Choma's Rubaga branch",
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
    id: "restaurant-ntinda-swimming-pool",
    title: "Ntinda Swimming Pool",
    description: "A rare extra for a neighbourhood branch — a pool to go with the grill.",
    src: "/images/gallery/locations/ntinda-swimming-pool.jpg",
    alt: "The swimming pool at YPA Mbuzi Choma's Ntinda branch",
    category: "restaurant",
    featured: false,
    width: 1200,
    height: 900,
  },
  {
    id: "restaurant-ntinda-relaxing-area",
    title: "Ntinda Relaxing Area",
    description: "A lounge space to unwind in before or after the meal.",
    src: "/images/gallery/locations/ntinda-relaxing-area.jpg",
    alt: "A relaxing lounge area at YPA Mbuzi Choma's Ntinda branch",
    category: "restaurant",
    featured: false,
    width: 1200,
    height: 900,
  },
  {
    id: "restaurant-mbarara-interior",
    title: "Mbarara Interior",
    description: "The dining room, brought west — same method, new city.",
    src: "/images/gallery/locations/mbarara-interior.jpg",
    alt: "The interior dining space at YPA Mbuzi Choma's Mbarara branch",
    category: "restaurant",
    featured: false,
    width: 1200,
    height: 900,
  },
  {
    id: "restaurant-mbarara-outside",
    title: "Mbarara Outside",
    description: "Open-air seating, built for Mbarara's cooler evenings.",
    src: "/images/gallery/locations/mbarara-outside.jpg",
    alt: "The outdoor seating area at YPA Mbuzi Choma's Mbarara branch",
    category: "restaurant",
    featured: false,
    width: 1200,
    height: 900,
  },
  {
    id: "restaurant-maddu-terrace",
    title: "Maddu Terrace",
    description: "Our newest terrace, out in Gomba District.",
    src: "/images/gallery/locations/maddu-terrace.jpg",
    alt: "The outdoor terrace at YPA Mbuzi Choma's Maddu branch",
    category: "restaurant",
    featured: false,
    width: 1200,
    height: 900,
  },
  {
    id: "restaurant-maddu-dining",
    title: "Maddu Dining Area",
    description: "A warm dining room built for the Gomba community.",
    src: "/images/gallery/locations/maddu-dining.jpg",
    alt: "The dining area at YPA Mbuzi Choma's Maddu branch",
    category: "restaurant",
    featured: false,
    width: 1200,
    height: 900,
  },
  {
    id: "restaurant-maddu-entrance",
    title: "Maddu Entrance",
    description: "The entrance to our newest branch, out in Gomba District.",
    src: "/images/gallery/locations/maddu-entrance.jpg",
    alt: "The entrance to YPA Mbuzi Choma's Maddu branch",
    category: "restaurant",
    featured: false,
    width: 1200,
    height: 900,
  },
  {
    id: "restaurant-nansana",
    title: "Nansana",
    description: "YPA's next branch, taking shape in Nansana, Wakiso District.",
    src: "/images/gallery/locations/nansana.jpg",
    alt: "YPA Mbuzi Choma's upcoming Nansana branch",
    category: "restaurant",
    featured: false,
    width: 1200,
    height: 900,
  },
];

/** Convenience merge for Locations components doing an id lookup across both collections above — RestaurantExperience.astro should keep importing RESTAURANT_IMAGES directly, not this. */
export const LOCATION_IMAGES: RestaurantImage[] = [...BRANCH_IMAGES, ...RESTAURANT_IMAGES];

// Extra "restaurant" category shots that don't belong on the homepage's
// capped 4-item grid (see the note above RESTAURANT_IMAGES) and aren't
// tied to one branch, so BRANCH_IMAGES isn't the right home either.
// Gallery-only — media/gallery.ts pulls these in individually, the same
// way it cherry-picks the Ntinda pool photo out of BRANCH_IMAGES.
export const FEATURE_IMAGES: RestaurantImage[] = [
  {
    id: "restaurant-smart-waitress",
    title: "Smart Waitress",
    description: "Our AI-assisted table service in action.",
    src: "/images/gallery/smart-waitress.jpg",
    alt: "YPA Mbuzi Choma's smart waitress assisting guests at the table",
    category: "restaurant",
    featured: false,
    width: 1200,
    height: 900,
  },
];