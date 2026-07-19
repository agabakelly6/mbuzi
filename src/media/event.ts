// src/media/event.ts
//
// Private events / catering photography. No prior source to migrate —
// this is a genuinely new gallery category.

import type { EventImage } from "../types/media";

export const EVENT_IMAGES: EventImage[] = [
  {
    id: "events-private-dinner-setup",
    title: "Private Dinner Setup",
    description: "A reserved table dressed for a private evening.",
    src: "/images/gallery/events/private-dinner-setup.jpg",
    alt: "A private dinner table set up for an event at YPA Mbuzi Choma",
    category: "events",
    featured: true,
    width: 1200,
    height: 900,
  },
  {
    id: "events-birthday-celebration",
    title: "Birthday Celebration",
    description: "One of the many birthdays we've had the honor of hosting.",
    src: "/images/gallery/events/birthday-celebration.jpg",
    alt: "A birthday celebration hosted at YPA Mbuzi Choma",
    category: "events",
    featured: false,
    width: 1200,
    height: 900,
  },
  {
    id: "events-corporate-event",
    title: "Corporate Event",
    description: "Full-restaurant buyouts for teams who want the whole space.",
    src: "/images/gallery/events/corporate-event.jpg",
    alt: "A corporate event set up at YPA Mbuzi Choma",
    category: "events",
    featured: false,
    width: 1200,
    height: 900,
  },
  {
    id: "events-live-grill-station",
    title: "Live Grill Station",
    description: "The grill brought tableside for larger bookings.",
    src: "/images/gallery/events/live-grill-station.jpg",
    alt: "A live charcoal grill station set up for an event",
    category: "events",
    featured: true,
    width: 1200,
    height: 900,
  },
];