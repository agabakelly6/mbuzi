// src/content/homepage.ts
import type {
  SEOContent,
  HeroContent,
  SectionContent,
  FooterCTAContent,
} from "../types/content";

export const HOME_CONTENT = {
  seo: {
    title: "Home",
    description:
      "Premium Ugandan farm-to-table goat choma, raised on our own farm and grilled over charcoal. Reserve your table at YPA Mbuzi Choma in Kampala.",
  } satisfies SEOContent,

  hero: {
    eyebrow: "Authentic Ugandan Goat Choma",
    // No `headline` here on purpose — Hero.astro derives it from
    // config/site.ts's SITE.motto when not overridden, so the brand
    // tagline isn't typed a third time.
    description: "Farm fresh goat meat prepared with authentic Ugandan flavour.",
    primaryCta: { label: "Reserve Table" },
    secondaryCta: { label: "Explore Menu" },
  } satisfies HeroContent,

  trustBar: {
    items: ["Farm Raised", "Charcoal Grilled", "Fresh Ingredients", "Authentic Ugandan Taste"],
  },

  signatureDishes: {
    eyebrow: "From The Grill",
    heading: "Signature Dishes",
    description:
      "Every plate starts on our own farm and finishes over charcoal, the same way it has for generations.",
    cta: { label: "View Full Menu" },
  } satisfies SectionContent,

  farmStory: {
    eyebrow: "Our Roots",
    heading: "Raised on our own land, not a supplier's truck.",
    description:
      "Every goat on your plate was raised on our family farm outside Kampala — grass-fed, free-roaming, and prepared the same way our grandparents did it. No shortcuts, no imported substitutes.",
    cta: { label: "Read Our Story" },
  } satisfies SectionContent,

  experience: {
    eyebrow: "Beyond The Plate",
    heading: "The Restaurant Experience",
  } satisfies SectionContent,

  testimonials: {
    eyebrow: "Guest Stories",
    heading: "What Our Guests Say",
  } satisfies SectionContent,

  cta: {
    headline: "Ready for Authentic Goat Choma?",
    description: "Book your table or reach us directly — we'll have the fire ready.",
    primaryCta: { label: "Reserve Table" },
    secondaryCta: { label: "WhatsApp" },
  } satisfies FooterCTAContent,
} as const;