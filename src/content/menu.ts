// src/content/menu.ts
import type {
  SEOContent,
  HeroContent,
  SectionContent,
  FooterCTAContent,
} from "../types/content.ts";

export const MENU_CONTENT = {
  seo: {
    title: "Menu",
    description:
      "Explore the full YPA Mbuzi Choma menu — signature goat specials, sharing platters, local sides, and drinks, all grilled over charcoal in Kampala.",
  } satisfies SEOContent,

  hero: {
    eyebrow: "The Full Menu",
    headline: ["Every Cut.", "Every Flavour."],
    description: "From the charcoal grill to your table — explore everything we serve.",
    image: "/images/hero/hero-menu.webp",
    imageAlt: "Beautifully plated YPA signature dishes",
    secondaryCta: { label: "See The Menu" },
  } satisfies HeroContent,

  // One entry per MenuGrid instance, in page order. Keyed by the same id
  // MenuGrid renders as its section id, so pages/menu/index.astro can zip
  // this together with data/menu-sections.ts's category ids without a
  // second, parallel list of section keys.
  categorySections: {
    breakfast: {
      eyebrow: "To Start The Day",
      heading: "Breakfast",
    } satisfies SectionContent,
    "main-course": {
      eyebrow: "From The Grill",
      heading: "Main Course",
    } satisfies SectionContent,
    burgers: {
      eyebrow: "Between The Buns",
      heading: "Burgers",
    } satisfies SectionContent,
    sandwiches: {
      eyebrow: "Quick Bites",
      heading: "Sandwiches",
    } satisfies SectionContent,
    pizza: {
      eyebrow: "Goat Meets Pizza",
      heading: "Pizza",
    } satisfies SectionContent,
    lusaniya: {
      eyebrow: "Built For Sharing",
      heading: "Lusaniya",
    } satisfies SectionContent,
    smoothies: {
      eyebrow: "Fresh & Blended",
      heading: "Smoothies",
    } satisfies SectionContent,
    drinks: {
      eyebrow: "To Drink",
      heading: "Drinks Menu",
    } satisfies SectionContent,
  },

  // Note: the section's <h2> is the dish name itself ({CHEF_PICK.name}
  // from data/menu.ts), not static copy — only the eyebrow is fixed text.
  // The CTA reuses NAV_CTAS's "Reserve Table" label already; no separate
  // copy needed here.
  chefRecommendation: {
    eyebrow: "Chef's Recommendation",
  },

  foodQualityStory: {
    eyebrow: "How We Cook",
    heading: "Same fire, same recipe, every single plate.",
    description:
      "Every dish on this menu is grilled to order over real charcoal, seasoned with our own farm-grown herbs, and finished by hands that have been doing this for generations. Nothing here is a shortcut.",
    cta: { label: "Our Farm Story" },
  } satisfies SectionContent,

  cta: {
    headline: "Ready for Authentic Goat Choma?",
    description: "Book your table or reach us directly — we'll have the fire ready.",
    primaryCta: { label: "Reserve Table" },
    secondaryCta: { label: "WhatsApp" },
  } satisfies FooterCTAContent,
} as const;