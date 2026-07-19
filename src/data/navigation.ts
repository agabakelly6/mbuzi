// src/data/navigation.ts
//
// Nav-specific structure only — which links appear in the nav, in what
// order. Business facts that used to be duplicated here (the WhatsApp
// number, the booking/menu URLs, the brand name/motto) now come from
// config/site.ts instead of being retyped.

import { SITE, getWhatsAppUrl } from "../config/site";

export interface NavLink {
  /** Visible label shown to the user */
  label: string;
  /** Destination path or anchor */
  href: string;
}

export interface CtaLink extends NavLink {
  /** Visual treatment for the call-to-action button */
  variant: "solid" | "outline";
  /** Optional icon key, resolved to a lucide-react icon in the component */
  icon?: "whatsapp";
  /** Open in a new tab (used for external links like WhatsApp) */
  external?: boolean;
}

export const PRIMARY_NAV: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Menu", href: SITE.menuUrl },
  { label: "Farm Story", href: "/farm-story" },
  { label: "Gallery", href: "/gallery" },
  { label: "Locations", href: "/locations" },
  { label: "Booking", href: SITE.reservationUrl },
  { label: "Catering", href: "/catering" },
  { label: "Contact", href: "/contact" },
];

export const NAV_CTAS: CtaLink[] = [
  { label: "Reserve Table", href: SITE.reservationUrl, variant: "solid" },
  {
    label: "WhatsApp",
    href: getWhatsAppUrl(),
    variant: "outline",
    icon: "whatsapp",
    external: true,
  },
];