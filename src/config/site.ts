// src/config/site.ts
//
// Single source of truth for every piece of real-world business
// information about YPA Mbuzi Choma — name, contact details, hours,
// URLs, social links. Nothing here is presentation (see theme.ts) or
// SEO-specific (see seo.ts); it's purely "facts about the business."
//
// Change a phone number, address, or opening hour here once — every
// component that imports it (Footer, Navbar, CTA sections, structured
// data) picks up the change automatically. Do not re-type any of these
// values directly in a component; import them from here instead.

export interface BusinessHours {
  days: string;
  hours: string;
}

export interface SocialLinks {
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
}

export const BUSINESS_HOURS: BusinessHours[] = [
  { days: "Sun – Thu", hours: "06:00 – 23:00" },
  { days: "Friday", hours: "06:00 – 18:00" },
  { days: "Saturday", hours: "18:00 – 23:00" },
];

export const SOCIAL_LINKS: SocialLinks = {
  instagram: "https://instagram.com/ypambuzichoma",
  facebook: "https://facebook.com/ypambuzichoma",
  tiktok: "https://tiktok.com/@ypambuzichoma",
  youtube: "https://youtube.com/@ypambuzichoma",
};

export const SITE = {
  /** Full legal/display name. */
  name: "YPA Mbuzi Choma",
  /** Used for the navbar logo mark and anywhere space is tight. */
  shortName: "YPA",
  motto: "Raised By Us. Grilled For You.",
  description:
    "Premium Ugandan farm-to-table goat choma — raised on our own farm outside Kampala and grilled over charcoal, the same way for three generations.",

  /** Human-readable, for display (tel: links should use phoneDigits). */
  phone: "+256 702 587 863",
  /** Digits only, no spaces or leading +, for tel:/wa.me URL construction. */
  phoneDigits: "256702587863",
  /**
   * WhatsApp business number, digits only. Kept as a distinct field from
   * phoneDigits even though the value is currently identical — the two
   * numbers are conceptually different (voice line vs. WhatsApp business
   * line) and may diverge later.
   */
  whatsappNumber: "256702587863",
  email: "hello@ypambuzichoma.com",

  address: "Kampala, Uganda",
  googleMapsUrl: "https://maps.google.com/?q=YPA+Mbuzi+Choma+Kampala",

  hours: BUSINESS_HOURS,

  reservationUrl: "/booking",
  menuUrl: "/menu",

  social: SOCIAL_LINKS,
} as const;

/** Builds a wa.me URL from the configured WhatsApp number, with an optional pre-filled message. Pass `phoneOverride` (digits only) for a non-default number, e.g. a specific branch's WhatsApp line. */
export function getWhatsAppUrl(message?: string, phoneOverride?: string): string {
  const number = phoneOverride ?? SITE.whatsappNumber;
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Builds a tel: URL from the configured phone number, or a `phoneDigitsOverride` (digits only, no leading +) for a non-default number. */
export function getTelUrl(phoneDigitsOverride?: string): string {
  return `tel:+${phoneDigitsOverride ?? SITE.phoneDigits}`;
}

/** Builds a mailto: URL. Pass options for a pre-filled subject/body, or a specific department address instead of SITE.email. */
export function getMailtoUrl(options?: { subject?: string; body?: string; emailOverride?: string }): string {
  const address = options?.emailOverride ?? SITE.email;
  const params = new URLSearchParams();
  if (options?.subject) params.set("subject", options.subject);
  if (options?.body) params.set("body", options.body);
  const query = params.toString();
  return query ? `mailto:${address}?${query}` : `mailto:${address}`;
}

/** Current-year copyright line for the footer. Computed at call time so the year never goes stale. */
export function getCopyrightText(): string {
  return `© ${new Date().getFullYear()} ${SITE.name}. All rights reserved.`;
}