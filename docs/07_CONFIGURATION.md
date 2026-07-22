# Configuration

Four files govern every non-page-specific fact and setting in the site. None of them require a rebuild step beyond the normal `npm run dev`/`npm run build` — they're plain TypeScript modules, not a separate config format.

There are **no environment variables anywhere in this project** (confirmed: no `.env` file, no `import.meta.env`/`process.env` usage in the codebase). All configuration is committed, plain-text TypeScript.

---

## `src/config/site.ts` — real-world business facts

> *"Single source of truth for every piece of real-world business information about YPA Mbuzi Choma — name, contact details, hours, URLs, social links. Nothing here is presentation (see theme.ts) or SEO-specific (see seo.ts)."*

```ts
export const SITE = {
  name: "YPA Mbuzi Choma",
  shortName: "YPA",
  motto: "Raised By Us. Grilled For You.",
  description: "Premium Ugandan farm-to-table goat choma...",
  phone: "+256 700 000 000",        // human-readable
  phoneDigits: "256700000000",       // for tel:/wa.me URLs
  whatsappNumber: "256700000000",    // kept distinct from phoneDigits even though
                                      // currently identical — conceptually a
                                      // separate line that may diverge later
  email: "hello@ypambuzichoma.com",
  address: "Kampala, Uganda",
  googleMapsUrl: "https://maps.google.com/?q=YPA+Mbuzi+Choma+Kampala",
  hours: BUSINESS_HOURS,             // [{days:"Sun – Thu", hours:"06:00 – 23:00"}, ...]
  reservationUrl: "/booking",
  menuUrl: "/menu",
  social: SOCIAL_LINKS,              // instagram/facebook/tiktok/youtube URLs
} as const;
```

**⚠️ All phone/WhatsApp numbers currently in this file (and in every branch entry in `data/locations.ts`) are placeholders** (`256700000000`-series). This is the single most important thing to fix before real customer traffic hits WhatsApp/call/order flows — see the warning in [10_DEPLOYMENT.md](./10_DEPLOYMENT.md) and [11_MAINTENANCE.md](./11_MAINTENANCE.md).

Also exports three URL-builder functions — **use these instead of hand-building a link anywhere**:

```ts
getWhatsAppUrl(message?: string, phoneOverride?: string): string   // https://wa.me/{number}?text=...
getTelUrl(phoneDigitsOverride?: string): string                     // tel:+{digits}
getMailtoUrl(options?: { subject?, body?, emailOverride? }): string // mailto:...
getCopyrightText(): string                                          // "© {currentYear} YPA Mbuzi Choma..."
```

Every WhatsApp/call/email action anywhere in the site (booking, contact, catering quote, cart checkout, AI assistant handoff) is built from these three functions and nothing else.

## `src/config/seo.ts` — SEO defaults and structured data

```ts
export const DEFAULT_SEO = {
  titleTemplate: (pageTitle) => `${pageTitle} | YPA Mbuzi Choma`,
  defaultTitle: SITE.name,
  defaultDescription: SITE.description,
  author: SITE.name,
  keywords: [/* 6 SEO keywords */],
  defaultOgImage: "/images/hero/hero-main.webp",
  ogType: "website",
  twitterCard: "summary_large_image",
  locale: "en_UG",
} as const;
```

A page's own `title`/`description` (passed to `Layout`) always wins over these — they're fallbacks only.

This file is also home to `getPageStructuredData()`, which composes a full JSON-LD `@graph` per page from **real business data only** — its own header comment is explicit that this exists specifically to avoid pages "hand-rolling schema objects or fabricating data that doesn't exist (reviews, ratings, addresses)." It builds:

- A `WebSite` node and one shared `Restaurant` node (anchored on `FEATURED_LOCATION`, with every *active* branch listed as a `department` — coming-soon branches are deliberately excluded from this operational schema even though they appear on the Locations page itself).
- A `WebPage` node per page.
- Optional `BreadcrumbList`, `FAQPage` (only when a page passes real, already-rendered FAQ items), and `Menu`/`MenuSection`/`MenuItem` (only on `/menu`, via `includeMenu: true`) nodes.
- Includes hand-rolled parsing helpers that convert human-written opening-hours strings (`"Sun – Thu"`, `"06:00 – 23:00"`) into valid schema.org `OpeningHoursSpecification`, and menu price strings (`"UGX 40,000"`) into `{priceCurrency, price}` `Offer` objects — meaning **the format of `data/locations.ts`'s `openingHours` and `data/menu.ts`'s `price` fields is load-bearing for SEO**, not just display. Changing that string format without updating these parsers would silently break structured data.

## `src/config/theme.ts` — design tokens

> *"Single source of truth for the design system's raw tokens... plain values (hex strings, rem strings, numbers) — NOT Tailwind class names."*

```ts
COLORS = {
  primary: "#C89A4B",        // brand gold
  primaryHover: "#E3BD72",
  secondary: "#14100D",      // charcoal — the site's base/ink color
  accent: "#C89A4B",         // alias of primary
  background: { dark, light, cream, creamAlt },
  text: { onDark, onDarkMuted, onLight, onLightMuted },
  border: { onDark, onLight },
  whatsapp: "#25D366", whatsappHover: "#1DA851",
}
RADIUS    = { sm: "0.5rem", md: "1rem", lg: "1.5rem", full: "9999px" }
CONTAINER = { content: "1280px", narrow: "900px", prose: "672px" }
SPACING   = { sectionPaddingY: {mobile,desktop}, sectionPaddingX: {mobile,desktop} }
SHADOW    = { card, cta }
ANIMATION = { durationFast: 0.3, durationBase: 0.6, durationSlow: 0.9, easeOut: [0.16,1,0.3,1], staggerBase: 0.08 }
TYPOGRAPHY = { fontDisplay: "font-serif", fontBody: "font-sans", tracking: {tight,normal,wide,widest} }
```

**Important gap, documented in the file's own header**: most existing components still hardcode these same values as literal Tailwind arbitrary values (`bg-[#C89A4B]`) directly in JSX, predating this file's creation. `theme.ts` is the *intended* single source of truth going forward — new code should import from here, but a full retrofit of every existing component hasn't happened. If you're editing an existing component, matching its existing hardcoded literal is usually more consistent than introducing a new `theme.ts` import halfway through a file that doesn't otherwise use it.

There is also a small set of **stale, unused** CSS custom properties in `src/styles/global.css` (`--charcoal`, `--green`, `--brown`, `--gold`, `--cream`) that don't match the real values above and aren't referenced by any component — leftover from before `theme.ts` existed. Don't use them; don't be misled by them.

## `src/data/navigation.ts` — nav structure

```ts
export const PRIMARY_NAV: NavLink[] = [Home, Menu, Farm Story, Gallery, Locations, Booking, Catering, Contact];
export const NAV_CTAS: CtaLink[] = [
  { label: "Reserve Table", href: SITE.reservationUrl, variant: "solid" },
  { label: "WhatsApp", href: getWhatsAppUrl(), variant: "outline", icon: "whatsapp", external: true },
];
```

Deliberately holds only *structure* (which links, in what order) — every URL is derived from `config/site.ts` rather than retyped. Adding a new top-level nav page means adding one object to `PRIMARY_NAV`; nothing else needs to change (`Navbar.astro`, `NavbarIsland.tsx`, `MobileMenu.tsx`, and `Footer.astro` all consume this array directly).

## How to update business information safely

| Change | File | Notes |
|---|---|---|
| Phone number, address, hours, WhatsApp number (main line) | `config/site.ts` | Propagates to Footer, Navbar CTA, structured data, and everywhere `getWhatsAppUrl()`/`getTelUrl()` is called without an override |
| A specific branch's phone/WhatsApp/hours/address | `data/locations.ts` | See [11_MAINTENANCE.md](./11_MAINTENANCE.md) |
| Brand colors | `config/theme.ts` `COLORS` — but note the hardcoding gap above; a full color change also requires find-and-replace across components using the old hex literal | |
| SEO title/description defaults | `config/seo.ts` `DEFAULT_SEO` | Per-page overrides live in each page's own `content/*.ts` `seo` field and always win |
| Nav menu items | `data/navigation.ts` `PRIMARY_NAV` | |
| Social media links | `config/site.ts` `SOCIAL_LINKS` | Feeds Footer, structured data (`sameAs`), and the Gallery page's Instagram CTA |

**Never** hardcode a business fact (a phone number, an address, a price format) directly into a component — always import it from one of these four files. This is the single most consistently enforced rule in the codebase (see [15_CODE_CONVENTIONS.md](./15_CODE_CONVENTIONS.md)).
