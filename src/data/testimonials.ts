// src/data/testimonials.ts

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  location: string;
  rating: 1 | 2 | 3 | 4 | 5;
  /** Defaults to a dining testimonial when omitted — existing entries are unaffected. */
  context?: "dining" | "catering";
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    quote:
      "The most authentic goat choma I've had outside my grandmother's kitchen. Every bite tastes like home.",
    name: "Grace N.",
    location: "Kampala",
    rating: 5,
  },
  {
    id: "t2",
    quote:
      "Farm-to-table isn't a slogan here — you can taste the difference in every dish.",
    name: "David M.",
    location: "Entebbe",
    rating: 5,
  },
  {
    id: "t3",
    quote:
      "Warm service, beautiful outdoor seating, and the muchomo skewers are unmatched.",
    name: "Sarah K.",
    location: "Kampala",
    rating: 5,
  },
  {
    id: "t4",
    quote:
      "YPA catered our wedding reception and every guest asked where the food was from. Seamless from quote to cleanup.",
    name: "Patricia & James",
    location: "Kampala",
    rating: 5,
    context: "catering",
  },
  {
    id: "t5",
    quote:
      "Booked them for a 60-person corporate launch. The live grill station was the highlight of the whole event.",
    name: "Michael O.",
    location: "Kampala",
    rating: 5,
    context: "catering",
  },
];

export const DINING_TESTIMONIALS = TESTIMONIALS.filter((t) => t.context !== "catering");
export const CATERING_TESTIMONIALS = TESTIMONIALS.filter((t) => t.context === "catering");