// src/data/locations.ts
//
// Every branch the site knows about. The Locations page, map, and
// features/FAQ sections all derive entirely from this array — adding a
// 4th branch means appending one object here; no page or component
// needs to change.
import type { Location } from "../types/location";

export const LOCATIONS: Location[] = [
  {
    id: "rubaga",
    name: "YPA Mbuzi Choma — Rubaga",
    city: "Rubaga",
    address: "Rubaga Road, opposite Access Building, Kampala",
    phone: "+256 700 000 000",
    whatsapp: "256700000000",
    email: "rubaga@ypambuzichoma.com",
    openingHours: [
      { days: "Tue – Sun", hours: "11:00 – 22:00" },
      { days: "Monday", hours: "Closed" },
    ],
    description: "Our original home — where the farm-to-fire story began.",
    services: [
      "parking",
      "indoorSeating",
      "outdoorSeating",
      "familyFriendly",
      "privateDining",
      "takeaway",
    ],
    coordinates: { lat: 0.3106, lng: 32.5511 },
    googleMapsLink: "https://maps.google.com/?q=YPA+Mbuzi+Choma+Rubaga+Kampala",
    heroImage: "restaurant-rubaga-terrace",
    galleryImages: [
      "restaurant-rubaga-terrace",
      "restaurant-rubaga-dining-room",
      "restaurant-warm-atmosphere",
    ],
    featured: true,
  },
  {
    id: "ntinda",
    name: "YPA Mbuzi Choma — Ntinda",
    city: "Ntinda",
    address: "Semawata Road, Ntinda, Kampala",
    phone: "+256 700 000 001",
    whatsapp: "256700000001",
    email: "ntinda@ypambuzichoma.com",
    openingHours: [
      { days: "Tue – Sun", hours: "11:00 – 22:00" },
      { days: "Monday", hours: "Closed" },
    ],
    description: "A neighbourhood favourite, built for weeknight dinners and weekend family tables.",
    services: ["indoorSeating", "outdoorSeating", "familyFriendly", "delivery", "takeaway"],
    coordinates: { lat: 0.3563, lng: 32.6205 },
    googleMapsLink: "https://maps.google.com/?q=YPA+Mbuzi+Choma+Ntinda+Kampala",
    heroImage: "restaurant-ntinda-interior",
    galleryImages: [
      "restaurant-ntinda-interior",
      "restaurant-ntinda-bar",
      "restaurant-family-dining",
    ],
    featured: false,
  },
  {
    id: "mbarara",
    name: "YPA Mbuzi Choma — Mbarara",
    city: "Mbarara",
    address: "Mbarara-Masaka Road, Mbarara",
    phone: "+256 700 000 002",
    whatsapp: "256700000002",
    email: "mbarara@ypambuzichoma.com",
    openingHours: [
      { days: "Wed – Sun", hours: "12:00 – 21:00" },
      { days: "Mon – Tue", hours: "Closed" },
    ],
    description: "Bringing the same farm and fire west, closer to the source.",
    services: ["parking", "outdoorSeating", "familyFriendly", "takeaway"],
    coordinates: { lat: -0.6072, lng: 30.6545 },
    googleMapsLink: "https://maps.google.com/?q=YPA+Mbuzi+Choma+Mbarara",
    heroImage: "restaurant-mbarara-grill",
    galleryImages: [
      "restaurant-mbarara-grill",
      "restaurant-mbarara-garden",
      "restaurant-outdoor-seating",
    ],
    featured: false,
  },
];

export const FEATURED_LOCATION: Location = LOCATIONS.find((loc) => loc.featured) ?? LOCATIONS[0];