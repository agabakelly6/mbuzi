// src/data/contact.ts
//
// Business hours and actual contact values (phone/email/social) are NOT
// duplicated here — they live in config/site.ts (SITE) and are resolved
// at the point of use. This file only holds contact-specific structural
// data that doesn't belong in config: departments, response-time
// expectations, and which channel "kinds" to display as cards (their
// icons/labels, not their values).

export interface Department {
  id: string;
  name: string;
  description: string;
  /** Optional department-specific email. Falls back to SITE.email when absent. */
  email?: string;
}

export const DEPARTMENTS: Department[] = [
  {
    id: "reservations",
    name: "Reservations",
    description: "Table bookings, changes, or questions about an existing reservation.",
  },
  {
    id: "catering",
    name: "Catering & Events",
    description: "Private events, weddings, corporate catering, and quote requests.",
  },
  {
    id: "feedback",
    name: "Feedback",
    description: "Compliments, complaints, or suggestions about your visit.",
  },
  {
    id: "general",
    name: "General Inquiry",
    description: "Anything else we can help with.",
  },
];

export interface ResponseExpectation {
  channel: string;
  expectation: string;
}

export const RESPONSE_EXPECTATIONS: ResponseExpectation[] = [
  { channel: "WhatsApp", expectation: "Within 1 hour during business hours" },
  { channel: "Phone", expectation: "Answered immediately during business hours" },
  { channel: "Email", expectation: "Within 24 hours" },
];

export type ContactChannelKind =
  | "phone"
  | "whatsapp"
  | "email"
  | "facebook"
  | "instagram"
  | "tiktok";

export interface ContactChannelMeta {
  kind: ContactChannelKind;
  label: string;
}

/**
 * Which channel cards to show, and their display label — NOT their
 * actual value/href. ContactChannels.astro resolves each kind's real
 * phone number / URL from SITE at render time.
 */
export const CONTACT_CHANNELS: ContactChannelMeta[] = [
  { kind: "phone", label: "Call Us" },
  { kind: "whatsapp", label: "WhatsApp" },
  { kind: "email", label: "Email Us" },
  { kind: "facebook", label: "Facebook" },
  { kind: "instagram", label: "Instagram" },
  { kind: "tiktok", label: "TikTok" },
];