// src/content/gallery.ts
import type { SEOContent, HeroContent, SectionContent, FooterCTAContent } from "../types/content";

export const GALLERY_CONTENT = {
  seo: {
    title: "Gallery",
    description:
      "A look at YPA Mbuzi Choma — the farm, the fire, the food, and the people behind every plate.",
  } satisfies SEOContent,

  hero: {
    eyebrow: "Gallery",
    headline: ["Moments Worth", "Sharing."],
    description: "A glimpse into the farm, the fire, and everything in between.",
  } satisfies HeroContent,

  behindTheScenes: {
    eyebrow: "Behind The Scenes",
    heading: "Every photo here is a real day at YPA.",
    description:
      "Nothing staged, nothing borrowed — this is the farm, the grill, and the dining room exactly as our guests and our team see them every day.",
    cta: { label: "Read Our Farm Story" },
  } satisfies SectionContent,

  instagramCta: {
    heading: "Follow Along On Instagram",
    description: "More of the farm, the fire, and the food — posted as it happens.",
    cta: { label: "Follow" },
  } satisfies SectionContent,

  cta: {
    headline: "Ready for Authentic Goat Choma?",
    description: "Book your table or reach us directly — we'll have the fire ready.",
    primaryCta: { label: "Reserve Table" },
    secondaryCta: { label: "Explore Menu" },
  } satisfies FooterCTAContent,
} as const;