// src/config/seo.ts
//
// Default SEO values, used as fallbacks by Layout.astro. A page's own
// title/description always wins — these only render when a page doesn't
// override them. Also home to every JSON-LD (schema.org) builder so
// pages compose structured data from real business facts (config/site.ts,
// data/locations.ts, data/menu.ts) instead of hand-rolling schema objects
// or fabricating data that doesn't exist (reviews, ratings, addresses).
import { SITE } from "./site";
import { LOCATIONS, FEATURED_LOCATION } from "../data/locations";
import { MENU_SECTIONS } from "../data/menu-sections";
import { MENU_ITEMS } from "../data/menu";
import type { Location, OpeningHoursEntry } from "../types/location";
import type { FAQItem } from "../types/content";

export const DEFAULT_SEO = {
  /** Layout.astro composes every page's <title> through this, so the "| YPA Mbuzi Choma" suffix only lives in one place. */
  titleTemplate: (pageTitle: string): string => `${pageTitle} | ${SITE.name}`,
  defaultTitle: SITE.name,
  defaultDescription: SITE.description,
  author: SITE.name,
  keywords: [
    "goat choma",
    "Ugandan restaurant",
    "farm to table Kampala",
    "charcoal grill Uganda",
    "mbuzi choma",
    "authentic Ugandan food",
  ],
  /** The only real, existing image asset at launch — see hero/Hero.astro. Swap for a dedicated 1200x630 social-card image once real photography exists. */
  defaultOgImage: "/images/hero/hero-main.webp",
  ogType: "website" as const,
  twitterCard: "summary_large_image" as const,
  locale: "en_UG",
} as const;

// ---------------------------------------------------------------------------
// Shared parsing helpers — every opening-hours string in the codebase
// ("Tue – Sun" / "11:00 – 22:00" / "Closed") is written for humans, not
// schema.org. These convert the real data into valid OpeningHoursSpecification
// without changing what's authored in config/site.ts or data/locations.ts.
// ---------------------------------------------------------------------------

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const DAY_ABBREVIATIONS: Record<string, string> = {
  Sun: "Sunday",
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
};

function resolveDayName(token: string): string | undefined {
  const trimmed = token.trim();
  const resolved = DAY_ABBREVIATIONS[trimmed] ?? trimmed;
  return (DAY_NAMES as readonly string[]).includes(resolved) ? resolved : undefined;
}

function parseDayRange(days: string): string[] {
  const parts = days.split(/–|-/).map((part) => part.trim());
  if (parts.length === 1) {
    const single = resolveDayName(parts[0]);
    return single ? [single] : [];
  }

  const start = resolveDayName(parts[0]);
  const end = resolveDayName(parts[1]);
  if (!start || !end) return [];

  const startIndex = DAY_NAMES.indexOf(start as (typeof DAY_NAMES)[number]);
  const endIndex = DAY_NAMES.indexOf(end as (typeof DAY_NAMES)[number]);
  const result: string[] = [];
  let i = startIndex;
  while (true) {
    result.push(DAY_NAMES[i]);
    if (i === endIndex) break;
    i = (i + 1) % 7;
  }
  return result;
}

function buildOpeningHoursSpecification(entries: OpeningHoursEntry[]) {
  return entries
    .filter((entry) => entry.hours.trim().toLowerCase() !== "closed")
    .map((entry) => {
      const [opens, closes] = entry.hours.split(/–|-/).map((part) => part.trim());
      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: parseDayRange(entry.days),
        opens,
        closes,
      };
    });
}

/** "UGX 85,000" -> { priceCurrency: "UGX", price: "85000" }. Every menu price in data/menu.ts follows this exact "<CURRENCY> <amount>" shape. */
function parsePrice(price: string): { priceCurrency: string; price: string } {
  const [currency, ...rest] = price.trim().split(" ");
  const amount = rest.join("").replace(/[^0-9.]/g, "");
  return { priceCurrency: currency, price: amount };
}

function toAbsolute(path: string, origin: string): string {
  return new URL(path, origin).toString();
}

function branchToLocalBusiness(location: Location, origin: string) {
  return {
    "@type": "Restaurant",
    "@id": `${origin}/locations#${location.id}`,
    name: location.name,
    telephone: location.phone,
    email: location.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: location.address,
      addressLocality: location.city,
      addressCountry: "UG",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: location.coordinates.lat,
      longitude: location.coordinates.lng,
    },
    hasMap: location.googleMapsLink,
    openingHoursSpecification: buildOpeningHoursSpecification(location.openingHours),
    servesCuisine: "Ugandan",
    priceRange: "$$",
    parentOrganization: { "@id": `${origin}/#restaurant` },
  };
}

/**
 * The site's primary Restaurant node — anchored on the flagship branch's
 * real address/coordinates/hours (FEATURED_LOCATION), with every other
 * branch listed under `department`. One node, reused by every page via
 * getPageStructuredData() rather than each page re-deriving it.
 */
function getRestaurantNode(origin: string) {
  return {
    "@type": "Restaurant",
    "@id": `${origin}/#restaurant`,
    name: SITE.name,
    description: SITE.description,
    url: origin,
    image: toAbsolute(DEFAULT_SEO.defaultOgImage, origin),
    telephone: SITE.phone,
    email: SITE.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: FEATURED_LOCATION.address,
      addressLocality: FEATURED_LOCATION.city,
      addressCountry: "UG",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: FEATURED_LOCATION.coordinates.lat,
      longitude: FEATURED_LOCATION.coordinates.lng,
    },
    hasMap: FEATURED_LOCATION.googleMapsLink,
    openingHoursSpecification: buildOpeningHoursSpecification(SITE.hours),
    servesCuisine: "Ugandan",
    priceRange: "$$",
    acceptsReservations: true,
    menu: toAbsolute(SITE.menuUrl, origin),
    sameAs: Object.values(SITE.social),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: SITE.phone,
      email: SITE.email,
      areaServed: "UG",
    },
    department: LOCATIONS.map((location) => branchToLocalBusiness(location, origin)),
    potentialAction: {
      "@type": "ReserveAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: toAbsolute(SITE.reservationUrl, origin),
        actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"],
      },
      result: { "@type": "FoodEstablishmentReservation", name: "Table Reservation" },
    },
  };
}

function getWebSiteNode(origin: string) {
  return {
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    name: SITE.name,
    url: origin,
    publisher: { "@id": `${origin}/#restaurant` },
    inLanguage: "en",
  };
}

function getWebPageNode(options: { canonicalURL: string; name: string; description: string; origin: string }) {
  return {
    "@type": "WebPage",
    "@id": `${options.canonicalURL}#webpage`,
    url: options.canonicalURL,
    name: options.name,
    description: options.description,
    isPartOf: { "@id": `${options.origin}/#website` },
    about: { "@id": `${options.origin}/#restaurant` },
    inLanguage: "en",
  };
}

function getBreadcrumbNode(items: { name: string; url: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function getFAQNode(items: FAQItem[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/** Full Menu -> MenuSection -> MenuItem graph node for the /menu page, built from data/menu.ts + data/menu-sections.ts. */
function getMenuNode(origin: string) {
  const sectionIdToCategory: Record<string, string> = {
    "signature-specials": "signature",
    platters: "platters",
    sides: "sides",
    drinks: "drinks",
  };

  return {
    "@type": "Menu",
    "@id": `${origin}${SITE.menuUrl}#menu`,
    name: `${SITE.name} Menu`,
    url: toAbsolute(SITE.menuUrl, origin),
    hasMenuSection: MENU_SECTIONS.map((section) => ({
      "@type": "MenuSection",
      name: section.label,
      hasMenuItem: MENU_ITEMS.filter(
        (item) => item.category === sectionIdToCategory[section.id]
      ).map((item) => ({
        "@type": "MenuItem",
        name: item.name,
        description: item.description,
        image: toAbsolute(item.image, origin),
        offers: {
          "@type": "Offer",
          ...parsePrice(item.price),
        },
      })),
    })),
  };
}

export interface PageStructuredDataOptions {
  /** The page's own resolved canonical URL — same value passed to Layout's canonicalURL prop. */
  canonicalURL: string;
  /** Page name for the WebPage node and (when breadcrumbs are given) its final breadcrumb entry. */
  name: string;
  description: string;
  /** Home-to-here path, e.g. [{name: "Home", url: origin}, {name: "Menu", url: `${origin}/menu`}]. Omit on the homepage itself. */
  breadcrumbs?: { name: string; url: string }[];
  /** Pass a page's real, already-displayed FAQ items to add an FAQPage node. Never fabricate — only pass content the page actually renders. */
  faqItems?: FAQItem[];
  /** Adds the full Menu/MenuSection/MenuItem graph — /menu only. */
  includeMenu?: boolean;
}

/**
 * Builds the full JSON-LD `@graph` for a page: WebSite + Restaurant
 * (with every branch as a department) + WebPage, plus BreadcrumbList/
 * FAQPage/Menu nodes where the page actually has that content. One
 * function, called once per page, so the Restaurant/WebSite nodes are
 * never redefined per-page.
 */
export function getPageStructuredData(options: PageStructuredDataOptions) {
  const origin = new URL(options.canonicalURL).origin;

  const graph: Record<string, unknown>[] = [
    getWebSiteNode(origin),
    getRestaurantNode(origin),
    getWebPageNode({
      canonicalURL: options.canonicalURL,
      name: options.name,
      description: options.description,
      origin,
    }),
  ];

  if (options.breadcrumbs && options.breadcrumbs.length > 0) {
    graph.push(getBreadcrumbNode(options.breadcrumbs));
  }
  if (options.faqItems && options.faqItems.length > 0) {
    graph.push(getFAQNode(options.faqItems));
  }
  if (options.includeMenu) {
    graph.push(getMenuNode(origin));
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
