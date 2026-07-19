// src/content/locations.ts
import type {
  SEOContent,
  HeroContent,
  SectionContent,
  FooterCTAContent,
  FAQItem,
} from "../types/content";
import type { BranchService } from "../types/location";

export const LOCATIONS_CONTENT = {
  seo: {
    title: "Locations",
    description:
      "Find your nearest YPA Mbuzi Choma branch — Rubaga, Ntinda, or Mbarara. Hours, directions, and how to reach us.",
  } satisfies SEOContent,

  hero: {
    eyebrow: "Find Us",
    headline: ["Find Your", "Nearest YPA."],
    description: "Three branches, one farm, the same fire at every table.",
  } satisfies HeroContent,

  branchOverview: {
    eyebrow: "Our Branches",
    heading: "Choose Your Nearest Table",
    description: "Every branch is stocked from the same farm and grills the same way.",
  } satisfies SectionContent,

  map: {
    eyebrow: "On The Map",
    heading: "Get Directions",
  } satisfies SectionContent,

  features: {
    eyebrow: "What Each Branch Offers",
    heading: "Branch Details",
    serviceLabels: {
      parking: "Parking",
      indoorSeating: "Indoor Seating",
      outdoorSeating: "Outdoor Seating",
      familyFriendly: "Family Friendly",
      privateDining: "Private Dining",
      delivery: "Delivery",
      takeaway: "Takeaway",
    } satisfies Record<BranchService, string>,
  },

  whyVisit: {
    eyebrow: "Why Visit YPA",
    heading: "The same farm. The same fire. Every branch.",
    description:
      "Every YPA branch is stocked from one farm and grills over the same charcoal method — wherever you sit, you're getting the same plate we started with.",
    cta: { label: "Read Our Farm Story" },
  } satisfies SectionContent,

  faq: {
    eyebrow: "Questions",
    heading: "Frequently Asked Questions",
    items: [
      {
        question: "Do all branches serve the same menu?",
        answer:
          "Yes — every branch serves the full YPA menu, sourced from the same farm and grilled the same way.",
      },
      {
        question: "Can I reserve online?",
        answer:
          "Yes, use the Reserve Table button on this page or any branch card to book online, or reach us on WhatsApp directly.",
      },
      {
        question: "Do you offer parking?",
        answer:
          "Rubaga and Mbarara have on-site parking. Ntinda does not — see each branch's details above.",
      },
      {
        question: "Are all locations family friendly?",
        answer: "Yes, every branch welcomes families, with high chairs and kid-friendly seating available.",
      },
    ] satisfies FAQItem[],
  },

  cta: {
    headline: "Ready for Authentic Goat Choma?",
    description: "Book your table or reach us directly — we'll have the fire ready.",
    primaryCta: { label: "Reserve Table" },
    secondaryCta: { label: "View Menu" },
  } satisfies FooterCTAContent,

  branchCard: {
    reserveLabel: "Reserve Table",
    directionsLabel: "Directions",
  },
} as const;