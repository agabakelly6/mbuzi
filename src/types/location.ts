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

/**
 * "active" branches are open today — bookable, contactable, shown with
 * real hours. "coming-soon" branches (under construction, not yet open)
 * participate in every Locations display for the growth story, but every
 * consumer gates booking/contact/hours behavior on this field instead of
 * special-casing a branch by id or name.
 */
export type LocationStatus = "active" | "coming-soon";

export interface Location {
  id: string;
  name: string;
  city: string;
  address: string;
  /** Human-readable, for display. Empty string when not yet available (e.g. a coming-soon branch). */
  phone: string;
  /** WhatsApp number, digits only — passed to config/site.ts's getWhatsAppUrl() as an override. Empty string when not yet available. */
  whatsapp: string;
  /** Empty string when not yet available. */
  email: string;
  /** Empty array when there are no hours to show yet (e.g. a coming-soon branch). */
  openingHours: OpeningHoursEntry[];
  description: string;
  /** Empty array when nothing is confirmed yet. */
  services: BranchService[];
  coordinates: Coordinates;
  googleMapsLink: string;
  /** References a RestaurantImage.id in media/restaurant.ts */
  heroImage: string;
  /** References RestaurantImage.id values in media/restaurant.ts */
  galleryImages: string[];
  /** Marks the main/flagship branch. */
  featured: boolean;
  status: LocationStatus;
}