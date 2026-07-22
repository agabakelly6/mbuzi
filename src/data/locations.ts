// src/data/locations.ts
//
// Every branch the site knows about — open or upcoming. The Locations
// page, map, and features/FAQ sections all derive entirely from this
// array; adding a branch means appending one object here, no page or
// component needs to change. Each branch declares its own `status`
// ("active" | "coming-soon") — that single field is what every consumer
// (booking form, structured data, location cards, the map) gates on,
// rather than special-casing a branch by id or name.
import type { Location, OpeningHoursEntry } from "../types/location";

// Every currently operating branch shares this schedule. Kept as one
// constant so a future hours change updates every active branch at once
// instead of drifting per-location.
const STANDARD_OPENING_HOURS: OpeningHoursEntry[] = [
  { days: "Sun – Thu", hours: "06:00 – 23:00" },
  { days: "Friday", hours: "06:00 – 18:00" },
  { days: "Saturday", hours: "18:00 – 23:00" },
];

export const LOCATIONS: Location[] = [
  {
    id: "rubaga",
    name: "YPA Mbuzi Choma — Rubaga",
    city: "Rubaga",
    address: "Rubaga Road, opposite Access Building, Kampala",
    phone: "+256 702 587 863",
    whatsapp: "256702587863",
    email: "rubaga@ypambuzichoma.com",
    tiktok: "https://www.tiktok.com/@ypa.mbuzi.choma.r",
    openingHours: STANDARD_OPENING_HOURS,
    description: "Our original home — where the farm-to-fire story began.",
    services: [
      "parking",
      "indoorSeating",
      "outdoorSeating",
      "familyFriendly",
      "privateDining",
      "delivery",
      "takeaway",
    ],
    coordinates: { lat: 0.309167, lng: 32.562922 },
    googleMapsLink: "https://maps.app.goo.gl/k8nUWLmktWWYZ9q68",
    heroImage: "restaurant-rubaga-interior",
    galleryImages: [
      "restaurant-rubaga-interior",
      "restaurant-rubaga-entrance",
      "restaurant-rubaga-outside-sitting",
    ],
    featured: true,
    status: "active",
  },
  {
    id: "ntinda",
    name: "YPA Mbuzi Choma — Ntinda",
    city: "Ntinda",
    address: "Semawata Road, Ntinda, Kampala",
    phone: "+256 702 587 863",
    whatsapp: "256702587863",
    email: "ntinda@ypambuzichoma.com",
    tiktok: "https://www.tiktok.com/@ypa.mbuzi.choma.n",
    openingHours: STANDARD_OPENING_HOURS,
    description: "A neighbourhood favourite, built for weeknight dinners and weekend family tables.",
    services: ["indoorSeating", "outdoorSeating", "familyFriendly", "delivery", "takeaway"],
    coordinates: { lat: 0.345354, lng: 32.615862 },
    googleMapsLink: "https://maps.app.goo.gl/q3Fv1bD1c2HimR639",
    heroImage: "restaurant-ntinda-interior",
    galleryImages: [
      "restaurant-ntinda-interior",
      "restaurant-ntinda-swimming-pool",
      "restaurant-ntinda-relaxing-area",
    ],
    featured: false,
    status: "active",
  },
  {
    id: "mbarara",
    name: "YPA Mbuzi Choma — Mbarara",
    city: "Mbarara",
    address: "Mbarara-Masaka Road, Mbarara",
    phone: "+256 702 587 863",
    whatsapp: "256702587863",
    email: "mbarara@ypambuzichoma.com",
    tiktok: "https://www.tiktok.com/@ypa.mbuzi.choma.mbara",
    openingHours: STANDARD_OPENING_HOURS,
    description: "Bringing the same farm and fire west, closer to the source.",
    services: ["parking", "outdoorSeating", "familyFriendly", "delivery", "takeaway"],
    coordinates: { lat: -0.581844, lng: 30.70888 },
    googleMapsLink: "https://maps.app.goo.gl/BdRYoERmMtZfWw2E6",
    heroImage: "restaurant-mbarara-interior",
    galleryImages: ["restaurant-mbarara-interior", "restaurant-mbarara-outside"],
    featured: false,
    status: "active",
  },
  {
    id: "maddu",
    name: "YPA Mbuzi Choma — Maddu",
    city: "Maddu",
    address: "Maddu Town, Gomba District",
    phone: "+256 702 587 863",
    whatsapp: "256702587863",
    email: "maddu@ypambuzichoma.com",
    tiktok: "https://www.tiktok.com/@mbuzichoma.r",
    openingHours: STANDARD_OPENING_HOURS,
    description: "Our newest operating branch, carrying the same fire out to Gomba District.",
    services: ["parking", "outdoorSeating", "familyFriendly", "delivery", "takeaway"],
    coordinates: { lat: 0.223947, lng: 31.652167 },
    googleMapsLink: "https://maps.app.goo.gl/BuHfDZik1a2Wg3Ht6",
    heroImage: "restaurant-maddu-terrace",
    galleryImages: ["restaurant-maddu-terrace", "restaurant-maddu-dining"],
    featured: false,
    status: "active",
  },
  {
    id: "nansana",
    name: "YPA Mbuzi Choma — Nansana",
    city: "Nansana",
    address: "Nansana, Wakiso District",
    // Intentionally empty — no live contact line for a branch that isn't
    // open yet. LocationCard hides these rows automatically when empty.
    phone: "",
    whatsapp: "",
    email: "",
    tiktok: "",
    // No hours to show until the branch actually opens.
    openingHours: [],
    description: "Under construction and opening soon — YPA's next branch, out in Wakiso District.",
    services: [],
    // Approximate coordinates for Nansana, Wakiso District — confirm and
    // replace with the exact site pin once it's surveyed.
    coordinates: { lat: 0.3667, lng: 32.5 },
    googleMapsLink: "https://maps.google.com/?q=Nansana+Wakiso+Uganda",
    heroImage: "restaurant-nansana",
    galleryImages: [],
    featured: false,
    status: "coming-soon",
  },
];

export const FEATURED_LOCATION: Location = LOCATIONS.find((loc) => loc.featured) ?? LOCATIONS[0];

/** Branches that are open today — bookable, contactable, and shown with real hours. Use this wherever a booking, live contact, or SEO/structured-data listing must never include a not-yet-open branch. */
export const ACTIVE_LOCATIONS: Location[] = LOCATIONS.filter(
  (location) => location.status === "active"
);
