// src/types/location.ts
//
// This file existed as an empty scaffold placeholder before this task —
// it wasn't premature after all, just waiting for the Locations module.

export interface OpeningHoursEntry {
  days: string;
  hours: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export type BranchService =
  | "parking"
  | "indoorSeating"
  | "outdoorSeating"
  | "familyFriendly"
  | "privateDining"
  | "delivery"
  | "takeaway";

export interface Location {
  id: string;
  name: string;
  city: string;
  address: string;
  /** Human-readable, for display. */
  phone: string;
  /** WhatsApp number, digits only — passed to config/site.ts's getWhatsAppUrl() as an override. */
  whatsapp: string;
  email: string;
  openingHours: OpeningHoursEntry[];
  description: string;
  services: BranchService[];
  coordinates: Coordinates;
  googleMapsLink: string;
  /** References a RestaurantImage.id in media/restaurant.ts */
  heroImage: string;
  /** References RestaurantImage.id values in media/restaurant.ts */
  galleryImages: string[];
  /** Marks the main/flagship branch. */
  featured: boolean;
}