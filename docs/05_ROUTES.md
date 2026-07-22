# Routes

This is a static site with file-based routing and no dynamic routes — 9 pages total, all under `src/pages/`. Every page shares `src/layouts/Layout.astro` (SEO meta, the two global floating widgets, the sitewide `FadeIn` observer) and composes `Navbar` + `Footer` itself.

Every page (except Home and 404) passes `breadcrumbs: [Home, <PageName>]` to `getPageStructuredData()` (`config/seo.ts`). Every page with a visible FAQ section also passes `faqItems` matching that section exactly — never fabricated JSON-LD that doesn't correspond to visible content.

---

## `/` — Home (`src/pages/index.astro`)

- **Purpose**: landing page — hero, trust signals, signature dishes teaser, farm story teaser, restaurant experience, testimonials, closing CTA.
- **Components** (in order): `Layout` → `Navbar` → `Hero` (with `videoSrc="/videos/hero.mp4"`, the only page with a video hero) → `TrustBar` → `SignatureDishes` → `FarmStoryPreview` → `RestaurantExperience` → `Testimonials` → `CTASection` → `Footer`.
- **Content source**: `HOME_CONTENT` (`content/homepage.ts`) — `hero`, `cta`, `seo`.
- **Data source**: none imported directly at page level — each section pulls its own (`SignatureDishes` → `data/menu.ts`, `Testimonials` → `data/testimonials.ts`, etc.).
- **SEO**: `title={HOME_CONTENT.seo.title}`, `description={HOME_CONTENT.seo.description}`.
- **Structured data**: `getPageStructuredData({ canonicalURL, name, description })` — **no breadcrumbs** (the only page besides 404 to omit them), no `faqItems`, no `includeMenu`.

---

## `/menu` (`src/pages/menu/index.astro`)

- **Purpose**: the full menu, 8 categories, 44 dishes.
- **Components**: `Layout` → `Navbar` → `Hero` → `MenuCategories` (`client:load`) → `MenuGrid` ×8 (Breakfast, Main Course, Burgers, Sandwiches, Pizza, Lusaniya, Smoothies, Drinks — alternating `tone="light"`/`"dark"`) → `ChefRecommendation` → `FoodQualityStory` → `CTASection` → `Footer`.
- **Content source**: `MENU_CONTENT` (`content/menu.ts`) — `hero`, `categorySections.{breakfast,main-course,burgers,sandwiches,pizza,lusaniya,smoothies,drinks}`, `cta`, `seo`.
- **Data source**: `MENU_SECTIONS` (`data/menu-sections.ts`, feeds the sticky nav); `BREAKFAST_ITEMS` / `MAIN_COURSE_ITEMS` / `BURGER_ITEMS` / `SANDWICH_ITEMS` / `PIZZA_ITEMS` / `LUSANIYA_ITEMS` / `SMOOTHIE_ITEMS` / `DRINK_ITEMS` (`data/menu.ts`).
- **SEO**: `title={MENU_CONTENT.seo.title}`, `description={MENU_CONTENT.seo.description}`.
- **Structured data**: `getPageStructuredData({ ..., breadcrumbs: [Home, Menu], includeMenu: true })` — **the only page with `includeMenu: true`**, which adds a full `Menu`/`MenuSection`/`MenuItem` JSON-LD graph.
- **Special functionality**:
  - `MenuCategories` is a sticky pill nav using `IntersectionObserver` (`rootMargin: "-15% 0px -70% 0px"`) to highlight the active category on scroll and smooth-scroll on click. Each `MenuGrid` section's `id` (`breakfast`, `main-course`, …) is the scroll target; the Hero's "Explore Menu" CTA anchors to `#breakfast`.
  - Every `FoodCard` on this page is `orderable` and hydrated `client:visible` — see [09_WHATSAPP_ORDERING.md](./09_WHATSAPP_ORDERING.md).

---

## `/farm-story` (`src/pages/farm-story/index.astro`)

- **Purpose**: brand/farm origin story — founder message, YPA connection, timeline, team, sustainability.
- **Components**: `Layout` → `Navbar` → `Hero` → `StorySplit` (id `brand-story`) → `FounderMessage` → `YpaConnection` → `FarmTimeline` → `FarmGalleryPreview` → `WhyFarmToTable` → `MeetTheTeam` → `Sustainability` → `CTASection` → `Footer`.
- **Content source**: `FARM_STORY_CONTENT` (`content/farm-story.ts`) — `hero`, `brandStory`, `cta`, `seo`.
- **Data source**: `BRAND_STORY_IMAGE` (`data/farm-story.ts`, feeds `StorySplit`).
- **SEO**: `title={FARM_STORY_CONTENT.seo.title}`, `description={FARM_STORY_CONTENT.seo.description}`.
- **Structured data**: `getPageStructuredData({ ..., breadcrumbs: [Home, Farm Story] })` — no `faqItems`, no `includeMenu`.
- **Special functionality**: `StorySplit`'s CTA and `CTASection`'s secondary link both point to `/menu` ("See What We Grill").

---

## `/gallery` (`src/pages/gallery/index.astro`)

- **Purpose**: filterable photo gallery with lightbox, plus a behind-the-scenes story section and Instagram CTA.
- **Components**: `Layout` → `Navbar` → `Hero` → `GalleryFilters` (`client:visible`) → `StorySplit` (id `behind-the-scenes`) → inline Instagram CTA section → `CTASection` → `Footer`.
- **Content source**: `GALLERY_CONTENT` (`content/gallery.ts`) — `hero`, `behindTheScenes`, `instagramCta`, `cta`, `seo`.
- **Data source**: `GALLERY_IMAGES`, `GALLERY_FILTERS` (`media/gallery.ts`); `SITE.social.instagram` (`config/site.ts`).
- **SEO**: `title={GALLERY_CONTENT.seo.title}`, `description={GALLERY_CONTENT.seo.description}`.
- **Structured data**: `getPageStructuredData({ ..., breadcrumbs: [Home, Gallery] })`.
- **Special functionality**:
  - The page pre-resolves every gallery image's URL via `resolveImageSrc()` **server-side, before hydration** — `GalleryFilters` is a `client:visible` island with no server access at runtime.
  - `GalleryFilters` combines filter pills (`role="tablist"`), a Framer Motion `AnimatePresence`/`layout`-animated filtered grid, and the lightbox in one shared state tree.

---

## `/locations` (`src/pages/locations/index.astro`)

- **Purpose**: branch listing, static map, service features comparison, future expansion teaser, FAQ.
- **Components**: `Layout` → `Navbar` → `Hero` → `LocationsGrid` → `LocationsMap` → `LocationFeatures` → `FutureExpansion` → `StorySplit` (id `why-visit`) → `FAQSection` → `CTASection` → `Footer`.
- **Content source**: `LOCATIONS_CONTENT` (`content/locations.ts`) — `hero`, `branchOverview`, `map`, `features`, `futureExpansion`, `whyVisit`, `faq`, `cta`, `branchCard`.
- **Data source**: `LOCATIONS` (`data/locations.ts`); `SITE.menuUrl`.
- **SEO**: `title={LOCATIONS_CONTENT.seo.title}`, `description={LOCATIONS_CONTENT.seo.description}`.
- **Structured data**: `getPageStructuredData({ ..., breadcrumbs: [Home, Locations], faqItems: [...faq.items] })`.
- **Special functionality**: `LocationsMap` renders pins via a hand-rolled lat/lng-to-percentage projection over Uganda's bounds, using each branch's real `coordinates` — no external map SDK. `CTASection`'s `secondary` is an array (menu link + WhatsApp).

---

## `/booking` (`src/pages/booking/index.astro`)

- **Purpose**: table reservation form, plus payment info, policies, a private-events teaser, and FAQ.
- **Components**: `Layout` → `Navbar` → `Hero` → `BookingForm` (`client:visible`, inside an inline `<section id="reservation-form">`) → `PaymentOptions` → `ReservationPolicies` → inline private-events section (links to `/catering`) → `FAQSection` → `CTASection` → `Footer`.
- **Content source**: `BOOKING_CONTENT` (`content/booking.ts`) — `hero`, `form`, `summary`, `payment`, `policies`, `privateEvents`, `faq`, `cta`.
- **Data source**: `BookingForm` internally pulls `ACTIVE_LOCATIONS` (`data/locations.ts`) and `TIME_SLOTS`/`PARTY_SIZES`/`OCCASION_TYPES` (`data/booking.ts`); page-level import of `getTelUrl` (`config/site.ts`).
- **SEO**: `title={BOOKING_CONTENT.seo.title}`, `description={BOOKING_CONTENT.seo.description}`.
- **Structured data**: `getPageStructuredData({ ..., breadcrumbs: [Home, Booking], faqItems: [...faq.items] })`.
- **Special functionality**: `BookingForm` has no backend — see [03_COMPONENT_GUIDE.md](./03_COMPONENT_GUIDE.md#componentsforms). `CTASection` secondary is `[{label, href: getTelUrl()}, "whatsapp"]`.

---

## `/catering` (`src/pages/catering/index.astro`)

- **Purpose**: events/catering services — event types, packages, booking process, gallery preview, testimonials, FAQ.
- **Components**: `Layout` → `Navbar` → `Hero` → `EventTypes` → `EventPackages` → `WhyChooseYPA` → `BookingProcess` → `ImageGrid` (id `event-gallery`, `columns={2}`) → `Testimonials` (overridden with catering-specific testimonials) → `FAQSection` → `CTASection` → `Footer`.
- **Content source**: `CATERING_CONTENT` (`content/catering.ts`) — `hero`, `eventsOverview`, `packages`, `bookingProcess`, `galleryPreview`, `testimonials`, `faq`, `cta`.
- **Data source**: `EVENT_IMAGES` (`media/event.ts`); `CATERING_TESTIMONIALS` (`data/testimonials.ts`); `getWhatsAppUrl`, `getTelUrl` (`config/site.ts`).
- **SEO**: `title={CATERING_CONTENT.seo.title}`, `description={CATERING_CONTENT.seo.description}`.
- **Structured data**: `getPageStructuredData({ ..., breadcrumbs: [Home, Catering], faqItems: [...faq.items] })`.
- **Special functionality**: the primary CTA button is `getWhatsAppUrl("Hi YPA, I'd like a quote for an event. Here are the details:")` — a pre-filled WhatsApp quote request. `ImageGrid` links to `/gallery`.

---

## `/contact` (`src/pages/contact/index.astro`)

- **Purpose**: contact channels, contact form, branch listing/map, business hours, FAQ.
- **Components**: `Layout` → `Navbar` → `Hero` → `ContactChannels` → `ContactForm` (`client:visible`, inline `<section id="contact-form">`) → `LocationsGrid` → `LocationsMap` → `BusinessHours` → `FAQSection` → `CTASection` → `Footer`.
- **Content source**: `CONTACT_CONTENT` (`content/contact.ts`) — `hero`, `channels`, `form`, `branches`, `map`, `hours`, `responseExpectations`, `faq`, `cta`.
- **Data source**: `LOCATIONS` (`data/locations.ts`); `ContactForm` internally pulls `DEPARTMENTS` (`data/contact.ts`) and `ACTIVE_LOCATIONS`; page-level `SITE.reservationUrl`, `SITE.menuUrl`.
- **SEO**: `title={CONTACT_CONTENT.seo.title}`, `description={CONTACT_CONTENT.seo.description}`.
- **Structured data**: `getPageStructuredData({ ..., breadcrumbs: [Home, Contact], faqItems: [...faq.items] })`.
- **Special functionality**: `ContactForm` offers WhatsApp or `mailto:` (department-specific email when available). `CTASection` has both a `primary` (reservation link) and a three-item `secondary` array (menu, "Request Catering", WhatsApp).

---

## 404 (`src/pages/404.astro`)

- **Purpose**: custom not-found page.
- **Components**: `Layout` → `Navbar` → inline centered section (404 label/heading/copy) → `Button` ("Back To Home" → `/`) → `Footer`.
- **Content source**: none from `content/*` — copy is hardcoded inline on this one page (`"Page Not Found"`, etc.).
- **Data source**: `SITE.name` (`config/site.ts`) only, interpolated into the description string.
- **SEO**: `title="Page Not Found"`.
- **Robots**: `robots="noindex, follow"` — **the only page that overrides `Layout`'s default** (`"index, follow"`).
- **Structured data**: **none** — the only page with no `structuredData` prop at all.

---

## What every page has in common

- **No backend, ever.** Every form action resolves to `getWhatsAppUrl()`, `getTelUrl()`, or `getMailtoUrl()` (all from `config/site.ts`) — confirmed by grep: there is no `src/pages/api/` directory anywhere in this project.
- **`Navbar` and `Footer` are always rendered by the page itself**, first and last respectively — never by `Layout.astro`.
- **The two global widgets (`CartWidget`, `AssistantWidget`) are always present**, mounted once in `Layout.astro`, regardless of which page is active — including 404.
