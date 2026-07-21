// src/data/catering.ts
//
// FAQ content deliberately does NOT live here despite being listed under
// "Data" in the brief — every other page in this project keeps FAQ
// copy in content/*.ts (Booking, Locations), and breaking that pattern
// here would make the content/data boundary inconsistent sitewide. See
// content/catering.ts for the FAQ items.

export type EventTypeIcon =
  | "corporate"
  | "birthday"
  | "family"
  | "graduation"
  | "wedding"
  | "private";

export interface EventType {
  id: string;
  title: string;
  description: string;
  icon: EventTypeIcon;
}

export const EVENT_TYPES: EventType[] = [
  {
    id: "corporate",
    title: "Corporate Meetings",
    description: "Team lunches, launches, and off-sites — catered without disrupting the agenda.",
    icon: "corporate",
  },
  {
    id: "birthday",
    title: "Birthday Parties",
    description: "From intimate dinners to full celebrations, built around the guest of honour.",
    icon: "birthday",
  },
  {
    id: "family",
    title: "Family Gatherings",
    description: "Long tables, shared plates, and enough food that no one's counting.",
    icon: "family",
  },
  {
    id: "graduation",
    title: "Graduations",
    description: "Celebrate the milestone with a spread that matches the occasion.",
    icon: "graduation",
  },
  {
    id: "wedding",
    title: "Wedding Receptions",
    description: "Full-scale catering for the biggest table you'll ever host.",
    icon: "wedding",
  },
  {
    id: "private",
    title: "Private Celebrations",
    description: "Anniversaries, reunions, or just because — tailored to the moment.",
    icon: "private",
  },
];

export type ServiceId =
  | "charcoal-grill-station"
  | "waitstaff"
  | "table-setup"
  | "sound-system"
  | "custom-menu-tasting"
  | "delivery-setup"
  | "dedicated-coordinator"
  | "decor-styling"
  | "custom-cake";

export interface CateringService {
  id: ServiceId;
  label: string;
}

export const CATERING_SERVICES: CateringService[] = [
  { id: "charcoal-grill-station", label: "Live Charcoal Grill Station" },
  { id: "waitstaff", label: "Professional Waitstaff" },
  { id: "table-setup", label: "Table & Seating Setup" },
  { id: "sound-system", label: "Sound System" },
  { id: "custom-menu-tasting", label: "Custom Menu Tasting" },
  { id: "delivery-setup", label: "Delivery & Setup" },
  { id: "dedicated-coordinator", label: "Dedicated Event Coordinator" },
  { id: "decor-styling", label: "Décor & Table Styling" },
  { id: "custom-cake", label: "Custom Event Cake" },
];

export interface EventPackage {
  id: string;
  title: string;
  description: string;
  minGuests: number;
  maxGuests: number;
  serviceIds: ServiceId[];
  featured?: boolean;
}

export const EVENT_PACKAGES: EventPackage[] = [
  {
    id: "intimate-gathering",
    title: "Intimate Gathering",
    description: "A smaller, closer setup — perfect for birthdays and family get-togethers.",
    minGuests: 10,
    maxGuests: 30,
    serviceIds: ["charcoal-grill-station", "table-setup", "custom-menu-tasting", "custom-cake"],
  },
  {
    id: "celebration-package",
    title: "Celebration Package",
    description: "Built for graduations, anniversaries, and milestone celebrations.",
    minGuests: 30,
    maxGuests: 80,
    serviceIds: [
      "charcoal-grill-station",
      "waitstaff",
      "table-setup",
      "sound-system",
      "custom-menu-tasting",
      "custom-cake",
    ],
    featured: true,
  },
  {
    id: "grand-event",
    title: "Grand Event",
    description: "Full-scale catering for weddings and large corporate functions.",
    minGuests: 80,
    maxGuests: 250,
    serviceIds: [
      "charcoal-grill-station",
      "waitstaff",
      "table-setup",
      "sound-system",
      "dedicated-coordinator",
      "decor-styling",
      "delivery-setup",
      "custom-cake",
    ],
  },
  {
    id: "corporate-package",
    title: "Corporate Package",
    description: "Professional catering for meetings, launches, and team events.",
    minGuests: 15,
    maxGuests: 100,
    serviceIds: ["delivery-setup", "table-setup", "custom-menu-tasting", "dedicated-coordinator"],
  },
];

export interface BookingProcessStep {
  id: string;
  title: string;
  description: string;
}

export const BOOKING_PROCESS: BookingProcessStep[] = [
  {
    id: "inquiry",
    title: "Inquiry",
    description: "Reach out via WhatsApp or phone with your event date, guest count, and occasion.",
  },
  {
    id: "consultation",
    title: "Consultation",
    description: "Our events team walks you through package options and tailors the menu to your occasion.",
  },
  {
    id: "quote",
    title: "Quote",
    description: "You'll receive a clear, itemized quote based on your guest count and chosen services.",
  },
  {
    id: "confirmation",
    title: "Confirmation",
    description: "Confirm your date with a deposit via mobile money merchant code.",
  },
  {
    id: "event-day",
    title: "Event Day",
    description: "Our team arrives early to set up, grill, and serve — you focus on your guests.",
  },
];