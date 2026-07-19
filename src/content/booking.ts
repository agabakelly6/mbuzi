// src/content/booking.ts
import type { SEOContent, HeroContent, SectionContent, FooterCTAContent, FAQItem } from "../types/content";

export interface BookingFieldCopy {
  label: string;
  placeholder: string;
}

export const BOOKING_CONTENT = {
  seo: {
    title: "Reserve a Table",
    description: "Book your table at YPA Mbuzi Choma — farm-to-table goat choma in Kampala.",
  } satisfies SEOContent,

  hero: {
    eyebrow: "Booking",
    headline: ["Reserve Your", "Table."],
    description: "Tell us when you're coming, and we'll have the grill going.",
  } satisfies HeroContent,

  form: {
    eyebrow: "Booking Details",
    heading: "Reserve Your Table",
    description:
      "Fill in your details, then send them to us on WhatsApp or call your branch directly — there's no online checkout, just a real person confirming your table.",
    fields: {
      name: { label: "Full Name", placeholder: "e.g. Grace Namono" } satisfies BookingFieldCopy,
      phone: { label: "Phone Number", placeholder: "e.g. 0700 000 000" } satisfies BookingFieldCopy,
      email: { label: "Email", placeholder: "you@example.com" } satisfies BookingFieldCopy,
      branch: { label: "Branch", placeholder: "Select a branch" } satisfies BookingFieldCopy,
      date: { label: "Date", placeholder: "" } satisfies BookingFieldCopy,
      time: { label: "Time", placeholder: "Select a time" } satisfies BookingFieldCopy,
      guests: { label: "Guests", placeholder: "Select party size" } satisfies BookingFieldCopy,
      occasion: { label: "Occasion", placeholder: "Select an occasion" } satisfies BookingFieldCopy,
      specialRequests: {
        label: "Special Requests",
        placeholder: "Allergies, seating preference, celebration details…",
      } satisfies BookingFieldCopy,
    },
    whatsappCta: "Send Booking via WhatsApp",
    callCta: "Call To Book",
  },

  summary: {
    heading: "Your Reservation",
    emptyMessage: "Fill in the form to see your reservation details here.",
  },

  payment: {
    eyebrow: "Secure Your Table",
    heading: "How To Pay",
    description:
      "Reservations are secured with a mobile money merchant code payment — dial your provider's code below and enter our merchant code. Cash is only accepted when you're dining with us in person, not to hold a reservation remotely.",
  } satisfies SectionContent,

  policies: {
    eyebrow: "Good To Know",
    heading: "Booking Rules",
  } satisfies SectionContent,

  privateEvents: {
    eyebrow: "Hosting Something Bigger?",
    heading: "Ask About Private Events & Catering",
    description:
      "For parties, corporate events, or full restaurant buyouts, our catering team can build a menu around your occasion.",
    cta: { label: "Explore Catering" },
  } satisfies SectionContent,

  faq: {
    eyebrow: "Questions",
    heading: "Reservation FAQ",
    items: [
      {
        question: "How far in advance should I book?",
        answer:
          "We recommend booking at least 24 hours ahead, especially for weekends and groups of 6 or more.",
      },
      {
        question: "Can I modify my reservation after booking?",
        answer:
          "Yes — message the branch directly on WhatsApp with your name and original booking time to make changes.",
      },
      {
        question: "How do I pay to secure my reservation?",
        answer:
          "Send payment to our mobile money merchant code (see the Payment section above), then share your payment confirmation with us on WhatsApp.",
      },
      {
        question: "What happens if I'm running late?",
        answer:
          "Send us a quick WhatsApp message — we'll hold your table for up to 15 minutes past your reservation time.",
      },
    ] satisfies FAQItem[],
  },

  cta: {
    headline: "Prefer To Book By Phone Or WhatsApp?",
    description: "Our team is just as happy to take your reservation directly.",
    primaryCta: { label: "Reserve Table" },
    secondaryCta: { label: "Call Us" },
  } satisfies FooterCTAContent,
} as const;