// src/content/catering.ts
import type {
  SEOContent,
  HeroContent,
  SectionContent,
  FooterCTAContent,
  FAQItem,
} from "../types/content";

export interface WhyChooseReason {
  icon: "professional" | "farmFresh" | "flexible" | "experienced" | "authentic";
  title: string;
  description: string;
}

export const CATERING_CONTENT = {
  seo: {
    title: "Catering & Events",
    description:
      "YPA Mbuzi Choma catering — farm-to-table goat choma, live grill stations, and full event service for corporate meetings, weddings, and celebrations in Kampala.",
  } satisfies SEOContent,

  hero: {
    eyebrow: "Catering & Events",
    headline: ["Celebrate", "With YPA."],
    description: "The same farm, the same fire, wherever you're hosting.",
    image: "/images/hero/hero-catering.webp",
    imageAlt: "A large buffet spread set up for a wedding or corporate event",
  } satisfies HeroContent,

  eventsOverview: {
    eyebrow: "What We Cater",
    heading: "Every Occasion, One Fire",
    description: "From boardroom lunches to wedding receptions, we bring the full YPA experience to you.",
  } satisfies SectionContent,

  packages: {
    eyebrow: "What We Offer",
    heading: "Catering Packages",
    description: "From intimate gatherings to full events — every package starts with our own farm.",
    cta: { label: "Request A Quote" },
  } satisfies SectionContent,

  whyChooseYPA: {
    eyebrow: "Why YPA",
    heading: "Why Choose YPA For Your Event",
    reasons: [
      {
        icon: "professional",
        title: "Professional Catering",
        description: "A dedicated events team that handles setup, service, and cleanup from start to finish.",
      },
      {
        icon: "farmFresh",
        title: "Farm-Fresh Ingredients",
        description: "Every event is stocked from the same farm that supplies our restaurants — nothing outsourced.",
      },
      {
        icon: "flexible",
        title: "Flexible Packages",
        description: "From 10 guests to 250, every package scales and customizes to your occasion.",
      },
      {
        icon: "experienced",
        title: "Experienced Team",
        description: "Years of grilling for weddings, corporate events, and everything in between.",
      },
      {
        icon: "authentic",
        title: "Authentic Ugandan Cuisine",
        description: "The same recipes and charcoal method our restaurants are known for, brought to your venue.",
      },
    ] satisfies WhyChooseReason[],
  },

  bookingProcess: {
    eyebrow: "How It Works",
    heading: "Booking Your Event",
  } satisfies SectionContent,

  galleryPreview: {
    eyebrow: "Past Events",
    heading: "Events We've Catered",
  } satisfies SectionContent,

  testimonials: {
    eyebrow: "Guest Stories",
    heading: "What Hosts Say",
  } satisfies SectionContent,

  faq: {
    eyebrow: "Questions",
    heading: "Catering FAQ",
    items: [
      {
        question: "How far in advance should I book catering?",
        answer:
          "We recommend at least 2 weeks for smaller gatherings and 4-6 weeks for weddings or events over 80 guests.",
      },
      {
        question: "Can you accommodate dietary restrictions?",
        answer:
          "Yes — let us know during your consultation and we'll tailor the menu, including vegetarian options.",
      },
      {
        question: "Can we bring our own cake for the event?",
        answer:
          "No outside cakes — YPA bakes every event cake in-house, made to order. Tell us your flavour, design, and size during your consultation and we'll build it into your package.",
      },
      {
        question: "Do you deliver, or is there a minimum guest count?",
        answer:
          "We deliver and set up for events of any size within our service area — larger events may include a dedicated coordinator.",
      },
      {
        question: "How is payment for catering handled?",
        answer:
          "A deposit via mobile money merchant code confirms your date; the balance is settled on or before the event, as agreed in your quote.",
      },
    ] satisfies FAQItem[],
  },

  cta: {
    headline: "Ready To Plan Your Event?",
    description: "Tell us the occasion, and we'll build a menu around it.",
    primaryCta: { label: "Request A Quote" },
    secondaryCta: { label: "Call Us" },
  } satisfies FooterCTAContent,
} as const;