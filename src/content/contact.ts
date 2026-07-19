// src/content/contact.ts
import type { SEOContent, HeroContent, SectionContent, FooterCTAContent, FAQItem } from "../types/content";

export interface ContactFieldCopy {
  label: string;
  placeholder: string;
}

export const CONTACT_CONTENT = {
  seo: {
    title: "Contact",
    description: "Get in touch with YPA Mbuzi Choma — call, WhatsApp, email, or find your nearest branch.",
  } satisfies SEOContent,

  hero: {
    eyebrow: "Get In Touch",
    headline: ["Get In", "Touch."],
    description: "Questions, feedback, or just want to say hello — reach out any time.",
  } satisfies HeroContent,

  channels: {
    eyebrow: "Reach Us",
    heading: "However You Prefer",
  } satisfies SectionContent,

  form: {
    eyebrow: "Send A Message",
    heading: "Get In Touch",
    description:
      "Fill in your details, then send them to us via WhatsApp or email — there's no ticketing system, just a real person reading it.",
    fields: {
      name: { label: "Full Name", placeholder: "e.g. Grace Namono" } satisfies ContactFieldCopy,
      phone: { label: "Phone Number", placeholder: "e.g. 0700 000 000" } satisfies ContactFieldCopy,
      email: { label: "Email Address", placeholder: "you@example.com" } satisfies ContactFieldCopy,
      subject: { label: "Subject", placeholder: "Select a department" } satisfies ContactFieldCopy,
      branch: { label: "Preferred Branch", placeholder: "Select a branch (optional)" } satisfies ContactFieldCopy,
      message: { label: "Message", placeholder: "How can we help?" } satisfies ContactFieldCopy,
    },
    whatsappCta: "Send Via WhatsApp",
    emailCta: "Send Via Email",
  },

  branches: {
    eyebrow: "Find Us",
    heading: "Our Branches",
    description: "Every branch is stocked from the same farm and grills the same way.",
  } satisfies SectionContent,

  map: {
    eyebrow: "On The Map",
    heading: "Get Directions",
  } satisfies SectionContent,

  hours: {
    eyebrow: "Opening Hours",
    heading: "When We're Open",
  } satisfies SectionContent,

  responseExpectations: {
    heading: "How Quickly We Respond",
  },

  faq: {
    eyebrow: "Questions",
    heading: "Contact FAQ",
    items: [
      {
        question: "What's the fastest way to reach you?",
        answer: "WhatsApp — most messages get a reply within an hour during business hours.",
      },
      {
        question: "Can I request catering through this page?",
        answer:
          "Yes — select \"Catering & Events\" as your subject, or use the Request Catering quick action below.",
      },
      {
        question: "Do all branches share the same contact number?",
        answer:
          "Each branch has its own phone and WhatsApp number, shown on its card in the Branches section above.",
      },
      {
        question: "How do I leave feedback about a recent visit?",
        answer: "Select \"Feedback\" as your subject and let us know — we read every message.",
      },
    ] satisfies FAQItem[],
  },

  cta: {
    headline: "Ready For Authentic Goat Choma?",
    description: "Book your table, explore the menu, or plan your event.",
    primaryCta: { label: "Reserve Table" },
    secondaryCta: { label: "View Menu" },
  } satisfies FooterCTAContent,
} as const;