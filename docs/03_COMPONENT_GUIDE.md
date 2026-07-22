# Component Guide

Convention used throughout: `.astro` components are static by default (zero client JS) unless they explicitly mount a React island with a `client:*` directive. `.tsx` components only ship JS to the browser if hydrated with a client directive at their call site — many `.tsx` files in this project are rendered from `.astro` files with **no** client directive at all, meaning they render to static HTML with zero interactivity (a deliberate, common pattern here for presentational cards).

All paths are relative to `src/`.

---

## `components/ui/` — generic primitives

### `Button.astro`
- **Purpose**: static button/link primitive for anywhere that doesn't need a Framer Motion wrapper.
- **Props**: `href?`, `variant?: "solid"|"outline"` (default `"solid"`), `size?: "sm"|"md"` (default `"md"`), `tone?: "dark"|"light"` (default `"dark"`), `external?: boolean`, `type?: "button"|"submit"|"reset"`, `ariaLabel?`, `class?`.
- **Dependencies**: `lib/button-variants.ts` (`getButtonClasses`).
- **Used in**: `404.astro`, `CTASection.astro`, `ChefRecommendation.astro`, `ImageGrid.astro`, `SignatureDishes.astro`, `StorySplit.astro`, `YpaConnection.astro`, `gallery/index.astro`.
- **Reusability**: `variant`/`size`/`tone` cover every button style in the site. Delegates all visual classes to `getButtonClasses()`, the single source of truth also used by React components that need identical styling wrapped in `motion.*`.
- **Performance**: zero client JS, always.

### `WhatsAppButton.tsx`
- **Purpose**: the single renderer for every WhatsApp CTA link sitewide — navbar, mobile drawer, footer, location cards, CTA sections.
- **Props**: `href: string` (a `wa.me` URL from `getWhatsAppUrl()`), `label? = "WhatsApp"`, `variant?: "outline"|"solid"|"icon"` (default `"outline"`), `className?`.
- **Dependencies**: `lucide-react` (`MessageCircle`).
- **Used in**: `LocationCard.tsx`, `Footer.astro`, `MobileMenu.tsx`, `NavbarIsland.tsx`, `CTASection.astro`.
- **Reusability**: `variant="icon"` is a round `h-11 w-11` button — the site's de facto floating-action-button style, also mirrored (not reused directly, but pattern-matched) by the Cart and Assistant FABs.
- **Performance**: static markup unless rendered inside an already-hydrated parent island (`NavbarIsland`, `MobileMenu`); zero JS when rendered from `Footer.astro`/`CTASection.astro`.

### `Logo.tsx`
- **Purpose**: shared brand mark — renders a real logo file if `src/assets/branding/logo.*` exists, otherwise a circular monogram + serif wordmark fallback.
- **Props**: `tone?: "light"|"dark"` (default `"light"`), `className?`.
- **Dependencies**: `config/site.ts` (`SITE`), `lib/logo.ts` (`LOGO_SRC`).
- **Used in**: `NavbarIsland.tsx`, `MobileMenu.tsx`, `Footer.astro`.
- **Reusability**: `tone` prop for light/dark surfaces.
- **Performance**: static when rendered from `Footer.astro`; part of the hydrated tree elsewhere.

### `OptimizedImage.astro`
- **Purpose**: drop-in `<img>` replacement — resolves a real photo through `astro:assets`' `<Image>` (resized, format-converted, hashed) or renders a placeholder panel (`bg-[#C89A4B]/10`) when the photo hasn't been added to `src/assets/` yet.
- **Props**: `src: string`, `alt: string`, `class?`, `loading?: "eager"|"lazy"` (default `"lazy"`), `fetchpriority?: "high"|"low"|"auto"` (default `"auto"`).
- **Dependencies**: `astro:assets` (`Image`), `lib/images.ts` (`resolveImage`).
- **Used in**: `Hero.astro`, `ChefRecommendation.astro`, `StorySplit.astro`, `ImageGrid.astro`, `FounderMessage.astro`, `MeetTheTeam.astro`.
- **Reusability**: universal "image with graceful missing-asset fallback" — only usable from `.astro` files, since it depends on Astro's build-time image pipeline (not callable from `.tsx`).
- **Performance**: this is *the* image optimization mechanism for the whole site — every photo through here gets resized/format-converted at build time.

---

## `components/hero/` — the reusable page hero

### `Hero.astro`
- **Purpose**: full-bleed hero used identically by every page — poster image (LCP candidate) + optional desktop-only video overlay + gradient/vignette + Ken Burns zoom (pure CSS).
- **Props**: `eyebrow?`, `mottoLines?: string[]`, `supportingText?`, `posterSrc?`, `posterAlt?`, `videoSrc?`, `reserveHref?`, `reserveLabel?`, `exploreHref?`, `exploreLabel?`, `nextSectionId?` (default `"hero-next"`), `heightClass?` (default `"h-screen"`). Defaults fall back to `SITE.motto`/`NAV_CTAS`/`PRIMARY_NAV` as a safety net — every real page passes its own values from its `content/*.ts` file.
- **Dependencies**: `./HeroContent` (React), `ui/OptimizedImage.astro`, `data/navigation.ts`, `config/site.ts`, `lib/images.ts`.
- **Used in**: every page.
- **Reusability**: fully prop-driven; `videoSrc` is optional and only the homepage sets it.
- **Performance**: poster image loads `eager`/`fetchpriority="high"` (it's the LCP element); video is `lg:` breakpoint only and `preload="metadata"`.

### `HeroContent.tsx`
- **Purpose**: the text/CTA stack centered over the hero media, with staggered entrance animation.
- **Props**: `headingId`, `eyebrow`, `mottoLines: string[]`, `supportingText`, `reserveHref`, `reserveLabel`, `exploreHref`, `exploreLabel`, `nextSectionId` — all required (`Hero.astro` always supplies them).
- **Dependencies**: `framer-motion`, `./HeroButtons`, `./ScrollIndicator`.
- **Used in**: `Hero.astro` only, `client:load`.
- **Performance**: hydrated immediately (`client:load`) since it's above-the-fold, first-paint content.

### `HeroButtons.tsx`
- **Purpose**: the hero's primary/secondary CTA pair with staggered entrance.
- **Props**: `reserveHref`, `reserveLabel`, `exploreHref`, `exploreLabel` (all required).
- **Dependencies**: `framer-motion`.
- **Used in**: `HeroContent.tsx` only.
- **Note**: deliberately *not* built on `ui/Button.astro` — an Astro component can't be wrapped in `motion.*`, so this file duplicates the button visual style independently. A future refactor could reconcile the two if `Button.astro`'s classes become the single source of truth here too.

### `ScrollIndicator.tsx`
- **Purpose**: bouncing "Scroll" cue at the hero's bottom edge; a real `<a href="#...">` so it works with JS disabled.
- **Props**: `targetId?` (default `"hero-next"`).
- **Dependencies**: `framer-motion` (`useReducedMotion`), `lucide-react` (`ChevronDown`).
- **Used in**: `HeroContent.tsx` only.
- **Accessibility**: bounce animation is skipped under `prefers-reduced-motion`.

---

## `components/cards/`

### `FoodCard.tsx`
- **Purpose**: a menu item card — image, name, price, description, variations list, optional "View on Menu" link, optional ordering controls.
- **Props**: `item: MenuItem`, `imageSrc?`, `tone?: "light"|"dark"` (default `"light"`), `showCta?: boolean` (default `true`), `orderable?: boolean` (default `false`).
- **Dependencies**: `data/menu.ts` (`MenuItem`), `cart/OrderControls`.
- **Used in**: `sections/MenuGrid.astro` (`client:visible`, `orderable`, `showCta={false}`) and `sections/SignatureDishes.astro` (homepage preview, static, defaults only).
- **Reusability**: three independent toggles — `tone` (light/dark surface), `showCta` (suppress the circular "already on /menu" link), `orderable` (embed `OrderControls`) — let the same component serve a read-only homepage preview and the fully interactive menu grid without duplicating markup.
- **Performance**: **ships zero client JS unless `orderable` is set**, and even then only hydrates via `client:visible` (see [12_PERFORMANCE.md](./12_PERFORMANCE.md)) — this matters because ~44 instances of this card render on `/menu`.

### `LocationCard.tsx`
- **Purpose**: a full branch card — hero photo, thumbnail strip, address/hours/phone, delivery details, Directions/Reserve/WhatsApp actions.
- **Props**: `location: Location`, `heroImageSrc`, `heroImageAlt`, `thumbnails?: {src,alt}[]`, `reserveLabel`, `directionsLabel`.
- **Dependencies**: `lucide-react`, `types/location.ts`, `ui/WhatsAppButton`, `config/site.ts` (`getWhatsAppUrl`, `getTelUrl`), `lib/button-variants.ts`, `data/delivery.ts` (`getDeliveryInfo`), `./DeliveryDetails`.
- **Used in**: `sections/LocationsGrid.astro`.
- **Reusability**: `location.status === "coming-soon"` toggles a disabled/muted presentation automatically — no separate "coming soon card" component exists.
- **Performance**: ships zero client JS on its own (presentational).

### `DeliveryDetails.tsx`
- **Purpose**: presentational block listing delivery availability, area, and per-zone fees for one branch.
- **Props**: `delivery: DeliveryInfo`. Returns `null` if `delivery.available` is false.
- **Dependencies**: `lucide-react` (`Truck`), `data/delivery.ts`.
- **Used in**: `LocationCard.tsx`.
- **Reusability**: every number rendered is sourced from `data/delivery.ts` — never hardcoded here.

### `TestimonialCard.tsx`
- **Purpose**: a single testimonial quote (star rating, quote, name/location) on a dark surface.
- **Props**: `testimonial: Testimonial`.
- **Dependencies**: `lucide-react` (`Star`), `data/testimonials.ts`.
- **Used in**: `sections/Testimonials.astro`.
- **Performance**: static, no client JS.

### `EventPackageCard.tsx`
- **Purpose**: a single catering package (title, guest range, included services checklist, CTA), with a "Most Popular" badge for the featured package.
- **Props**: `pkg: EventPackage`, `serviceLabels: string[]`, `quoteHref`, `ctaLabel`.
- **Dependencies**: `lucide-react` (`Check`), `data/catering.ts`, `lib/button-variants.ts`.
- **Used in**: `sections/EventPackages.astro`.
- **Reusability**: `pkg.featured` toggles the CTA's solid/outline variant and an accent border.

### `GalleryCard.tsx`
- **Purpose**: a clickable gallery tile (hover-zoom, gradient overlay) that opens the lightbox.
- **Props**: `image: GalleryImage`, `onOpen: () => void`.
- **Dependencies**: `framer-motion`, `types/media.ts`.
- **Used in**: `sections/GalleryFilters.tsx` only.

---

## `components/forms/`

### `BookingForm.tsx`
- **Purpose**: the full reservation form. **No backend** — validates client-side, then offers two real actions: "Send Booking via WhatsApp" (builds a formatted message, opens `getWhatsAppUrl()` to the selected branch's number) and "Call To Book" (a `tel:` link, works even with an incomplete form).
- **Props**: `fields` (per-field `{label, placeholder}` copy for name/phone/email/branch/date/time/guests/occasion/specialRequests), `whatsappCtaLabel`, `callCtaLabel`, `summaryHeading`, `summaryEmptyMessage`.
- **Dependencies**: `framer-motion`, `data/locations.ts` (`ACTIVE_LOCATIONS`), `data/booking.ts` (`TIME_SLOTS`, `PARTY_SIZES`, `OCCASION_TYPES`), `config/site.ts`, `lib/button-variants.ts`, `lib/constants.ts`, `lib/helpers.ts` (validators), `hooks/useFormState.ts`, `./BookingSummary`.
- **Used in**: `pages/booking/index.astro` (`client:visible`).
- **Reusability**: single call site by design, but its state-management pattern (`useFormState`) is shared with `ContactForm`.

### `BookingSummary.tsx`
- **Purpose**: presentational sticky sidebar recapping the current form's selections, so a customer can see what they're about to send before sending it.
- **Props**: `heading`, `emptyMessage`, plus optional already-resolved display values (`name`, `branch: Location`, `date`, `time`, `guests`, `occasion`, `specialRequests`).
- **Dependencies**: `lucide-react`, `types/location.ts`.
- **Used in**: `BookingForm.tsx` only.
- **Note**: deliberately receives already-resolved strings, not raw form state — decouples display from validation concerns.

### `ContactForm.tsx`
- **Purpose**: the contact form. Same no-backend philosophy as `BookingForm` — validates, then offers "Send via WhatsApp" or an email button (`mailto:`, using a department-specific address when one exists).
- **Props**: `fields` (name/phone/email/subject/branch/message copy), `whatsappCtaLabel`, `emailCtaLabel`.
- **Dependencies**: `framer-motion`, `data/contact.ts` (`DEPARTMENTS`), `data/locations.ts` (`ACTIVE_LOCATIONS`), `config/site.ts` (`getWhatsAppUrl`, `getMailtoUrl`), `lib/button-variants.ts`, `lib/constants.ts`, `lib/helpers.ts`, `hooks/useFormState.ts`.
- **Used in**: `pages/contact/index.astro` (`client:visible`).

---

## `components/layout/`

### `Navbar.astro`
- **Purpose**: static shell for the site header — imports nav data and mounts the interactive island.
- **Props**: none (self-contained).
- **Dependencies**: `./NavbarIsland`, `data/navigation.ts` (`PRIMARY_NAV`, `NAV_CTAS`).
- **Used in**: every page.

### `NavbarIsland.tsx`
- **Purpose**: the interactive navbar — scroll-triggered background/blur transition, entrance stagger, desktop links + CTAs, mounts `MobileMenu` for small screens.
- **Props**: `links: NavLink[]`, `ctas: CtaLink[]`.
- **Dependencies**: `framer-motion`, `hooks/useScrollPosition.ts`, `ui/Logo`, `ui/WhatsAppButton`, `./MobileMenu`.
- **Used in**: `Navbar.astro`, `client:load`.

### `MobileMenu.tsx`
- **Purpose**: self-contained hamburger trigger + full-screen slide-over drawer. **This is the canonical modal/drawer recipe in the codebase** — the Cart's `OrderDrawer` clones it explicitly.
- **Props**: `links: NavLink[]`, `ctas: CtaLink[]`.
- **Dependencies**: `framer-motion` (`AnimatePresence`), `ui/Logo`, `ui/WhatsAppButton`, `hooks/useBodyScrollLock.ts`.
- **Used in**: `NavbarIsland.tsx` only.
- **Pattern documented here** (reused by `OrderDrawer.tsx`, and the general recipe followed by `GalleryLightbox.tsx`/`AssistantPanel.tsx`): `useBodyScrollLock(isOpen)` + a `keydown` listener trapping `Tab` and closing on `Escape` (returning focus to the trigger) + `AnimatePresence` wrapping a `fixed inset-0` scrim (`z-40`) and a sliding panel (`z-50`) with `role="dialog" aria-modal="true"`.

### `Footer.astro`
- **Purpose**: fully static site footer — logo, motto, explore links, visit/contact info, hours, copyright. Every business fact sourced from `config/site.ts`.
- **Props**: none.
- **Dependencies**: `ui/Logo`, `ui/WhatsAppButton`, `data/navigation.ts`, `config/site.ts` (`SITE`, `getTelUrl`, `getMailtoUrl`, `getCopyrightText`).
- **Used in**: every page.
- **Performance**: zero client JS anywhere in this file, by explicit design.

---

## `components/sections/` — page-section components

This is the largest folder (~30 files). Most follow one of two patterns:

1. **Thin content wrapper** — a page-specific component with no external props that pulls its own copy from one `content/*.ts` file and renders a shared layout primitive (`StorySplit`, `Timeline`, `PillarGrid`, `ImageGrid`). Examples: `FoodQualityStory.astro`, `FarmStoryPreview.astro`, `Sustainability.astro`, `FarmTimeline.astro`, `BookingProcess.astro`, `WhyChooseYPA.astro`, `WhyFarmToTable.astro`, `RestaurantExperience.astro`, `FarmGalleryPreview.astro`.
2. **Shared layout primitive** — a generic, prop-driven component reused by several of the thin wrappers above. This is where genuine reuse lives:

| Primitive | Reused by | Key props |
|---|---|---|
| `StorySplit.astro` | `FoodQualityStory`, `FarmStoryPreview`, `Sustainability`, `gallery/index.astro`, `locations/index.astro` | `imagePosition: "left"\|"right"`, `sectionClass` |
| `Timeline.astro` | `FarmTimeline`, `BookingProcess` | `tone`, `steps: {id,title,description}[]` |
| `PillarGrid.astro` | `WhyChooseYPA`, `WhyFarmToTable` | `tone`, `columns: 4\|5`, `icons: Record<string, Icon>` |
| `ImageGrid.astro` | `RestaurantExperience`, `FarmGalleryPreview`, `catering/index.astro` | `columns: 2\|3`, `tone`, optional trailing CTA |

Other notable sections:

### `MenuGrid.astro`
- **Purpose**: one menu category section (breakfast, main course, etc.), invoked 8 times from `pages/menu/index.astro`. Groups items by `subcategory` when present (Drinks only).
- **Props**: `id`, `eyebrow`, `heading`, `items: MenuItem[]`, `tone?` (default `"light"`).
- **Dependencies**: `cards/FoodCard` (`client:visible`, `orderable`), `animations/FadeIn.astro`, `lib/images.ts` (`resolveImageSrc`).
- **Used in**: `pages/menu/index.astro` only.
- **Performance**: the one place in the codebase using `client:visible` — see [12_PERFORMANCE.md](./12_PERFORMANCE.md).

### `MenuCategories.tsx`
- **Purpose**: sticky quick-nav pill bar for `/menu` — highlights the active category via `IntersectionObserver` as the user scrolls, smooth-scrolls on click.
- **Props**: `sections: MenuSection[]`.
- **Dependencies**: `data/menu-sections.ts`.
- **Used in**: `pages/menu/index.astro`, `client:load` (a genuine island — active-section tracking must run immediately, unlike below-the-fold `FadeIn` reveals).

### `ChefRecommendation.astro`
- **Purpose**: highlights the single "chef pick" menu item; renders nothing if no item has `chefPick: true`.
- **Dependencies**: `data/menu.ts` (`CHEF_PICK`), `content/menu.ts`, `ui/Button.astro`, `ui/OptimizedImage.astro`.
- **Used in**: `pages/menu/index.astro`.

### `GalleryFilters.tsx`
- **Purpose**: despite the name, the full interactive gallery — filter pills (`role="tablist"`), an animated filtered grid of `GalleryCard`s, and `GalleryLightbox`, all sharing one state tree.
- **Props**: `images: GalleryImage[]`, `filters: GalleryFilterOption[]`.
- **Dependencies**: `framer-motion` (`AnimatePresence`, `layout`), `media/gallery.ts`, `cards/GalleryCard`, `./GalleryLightbox`.
- **Used in**: `pages/gallery/index.astro`, `client:visible`.

### `GalleryLightbox.tsx`
- **Purpose**: full-screen image viewer — keyboard nav (Escape/arrows), focus trap, scroll lock.
- **Props**: `images: GalleryImage[]`, `activeIndex: number|null`, `onClose`, `onNext`, `onPrev`.
- **Dependencies**: `framer-motion`, `lucide-react` (`X`, `ChevronLeft`, `ChevronRight`), `hooks/useBodyScrollLock.ts`.
- **Used in**: `GalleryFilters.tsx` only.

### `LocationsGrid.astro` / `LocationsMap.astro` / `LocationFeatures.astro` / `FutureExpansion.astro`
- **LocationsGrid**: grid of `LocationCard`s, resolving hero + thumbnail images server-side. Used in `contact/index.astro` and `locations/index.astro`.
- **LocationsMap**: zero-client-JS static map — pins positioned via a hand-rolled lat/lng-to-percentage projection over Uganda's bounds, each pin a real Google Maps directions link. "Coming soon" branches get a dashed pin style.
- **LocationFeatures**: amenities comparison table across all branches.
- **FutureExpansion**: lighter-weight "planned" cards for cities without an open branch yet, from `data/expansion.ts`.

### `FAQSection.astro`
- **Purpose**: accordion FAQ using native `<details>/<summary>` — a deliberate choice to avoid a React accordion component for something that needs zero interactivity logic.
- **Props**: `eyebrow`, `heading`, `items: FAQItem[]`.
- **Used in**: `contact`, `booking`, `catering`, `locations` pages.

### `CTASection.astro`
- **Purpose**: the reusable closing call-to-action band on every page.
- **Props**: `headline?`, `supportingText?`, `primary?: {label,href}`, `secondary?: "whatsapp" | {label,href} | Array<...>` (default `"whatsapp"`).
- **Reusability**: `secondary` accepting a single value or an array is what lets Contact's CTA show three actions (menu link, catering link, WhatsApp) while Home's shows just one.

---

## `components/animations/`

### `FadeIn.astro`
- **Purpose**: the sitewide scroll-reveal primitive — a zero-JS-per-instance fade/rise-in wrapper. Replaced what was previously 80+ individually hydrated Framer Motion React islands with one shared `IntersectionObserver` registered once in `Layout.astro`.
- **Props**: `delay?: number` (seconds, default `0`), `y?: number` (px offset, default `24`), `class?`/`className?`.
- **Used in**: nearly every section component sitewide (~25 files).
- **Performance**: this is the single biggest performance decision in the codebase — see [12_PERFORMANCE.md](./12_PERFORMANCE.md).

---

## `components/assistant/` — the AI Restaurant Assistant

See [08_AI_SYSTEM.md](./08_AI_SYSTEM.md) for the full data-flow explanation. Component summary:

| Component | Purpose | Hydration |
|---|---|---|
| `AssistantWidget.tsx` | Top-level island — wraps `AssistantFAB` + `AssistantPanel` in `AssistantProvider`. | Mounted in `Layout.astro` with `client:load` |
| `AssistantFAB.tsx` | Always-visible floating trigger button, positioned below the Cart FAB. | Part of `AssistantWidget`'s tree |
| `AssistantPanel.tsx` | The glassmorphism chat popover — message list, conversation starters, branch selector, text input, WhatsApp handoff. | Part of `AssistantWidget`'s tree |
| `ConversationStarters.tsx` | Renders the 6 suggestion chips from `content/assistant.ts`. | Part of `AssistantWidget`'s tree |
| `MessageBubble.tsx` | Renders one chat message, including an optional recommended-dish card. | Part of `AssistantWidget`'s tree |

**Architecture note**: `AssistantContext.tsx` (`src/context/`) is genuine React Context — valid here because all five components above live in one hydrated island (one `client:load` tree), so Context can propagate between them normally.

---

## `components/cart/` — the WhatsApp Ordering System

See [09_WHATSAPP_ORDERING.md](./09_WHATSAPP_ORDERING.md) for the full data-flow explanation. Component summary:

| Component | Purpose | Hydration |
|---|---|---|
| `CartWidget.tsx` | Top-level island — wraps `CartFAB` + `OrderDrawer`. | Mounted in `Layout.astro` with `client:load` |
| `CartFAB.tsx` | Floating trigger showing item count; renders `null` entirely (not just hidden) when the cart is empty. | Part of `CartWidget`'s tree |
| `OrderDrawer.tsx` | Full checkout slide-over — line items, delivery/pickup toggle, branch + zone selection, customer info, totals, WhatsApp checkout. Explicitly clones the `MobileMenu.tsx` recipe. | Part of `CartWidget`'s tree |
| `OrderControls.tsx` | "Add to Order" / quantity stepper embedded inside an orderable `FoodCard`. | Only present when `FoodCard`'s `orderable` prop is true (i.e. only on `/menu`, via `client:visible`) |

**Architecture note**: unlike the Assistant, the cart's state is **not** React Context — `OrderControls` instances live in up to ~44 *separate* `client:visible` islands on the Menu page, each an independent React root that Context cannot span. Instead, `hooks/useCart.ts` reads a module-level external store (`lib/cart/CartStore.ts`) via React 19's `useSyncExternalStore`, which works correctly across independently-hydrated islands because ES modules are evaluated once and shared by reference. See [09_WHATSAPP_ORDERING.md](./09_WHATSAPP_ORDERING.md) for the full reasoning.

---

## `context/` and `hooks/`

| File | Purpose |
|---|---|
| `context/AssistantContext.tsx` | `AssistantProvider` + `useAssistant()` — chat state for the single-island Assistant widget. |
| `hooks/useBodyScrollLock.ts` | Locks `<html>` scroll while a modal/drawer is open. Used by `MobileMenu`, `GalleryLightbox`, `OrderDrawer`. |
| `hooks/useFormState.ts` | Generic `{form, errors, setErrors, updateField}` state manager. Used by `BookingForm`, `ContactForm`. |
| `hooks/useScrollPosition.ts` | `useScrollPosition(threshold=60): boolean`, rAF-throttled scroll listener. Used by `NavbarIsland`. |
| `hooks/useCart.ts` | `useCart()` (full cart API) and `useCartLine()` (single-line, lower-re-render variant). The only way any component touches cart state. |

Each of these hooks exists because the same logic was found duplicated in two or more places first — none were built speculatively.
