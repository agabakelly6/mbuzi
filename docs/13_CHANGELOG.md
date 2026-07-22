# Changelog / Project History

Reconstructed from the actual commit history and from header comments left throughout the codebase documenting what replaced what and why. Git history for this repository:

```
4dc115c  Initial commit: YPA Mbuzi Choma Astro site
4264460  Add founder story, YPA connection, delivery, and expansion sections;
         migrate images to src/assets pipeline
17264c1  change (hero-home.webp re-optimized)
cc76d91  Add menu dish and gallery food photography
bde2b48  new (AI Assistant + WhatsApp Ordering systems)
```

## Phase 1 — Initial architecture and core pages

The initial commit (128 files, ~14,300 lines) established the entire foundation in one pass:

- **Architecture**: Astro 7 + React 19 islands + Tailwind v4, the `content/`/`data/`/`media/`/`config/` split, the shared `Layout.astro` shell, and the strict TypeScript config.
- **Navigation**: `Navbar.astro`/`NavbarIsland.tsx`/`MobileMenu.tsx`, driven by `data/navigation.ts`.
- **Hero**: the reusable `Hero.astro` + `HeroContent.tsx`/`HeroButtons.tsx`/`ScrollIndicator.tsx` system, used identically by every page.
- **Homepage**: `TrustBar`, `SignatureDishes`, `RestaurantExperience`, `Testimonials`, `CTASection`.
- **Menu**: the full 8-category menu system (`data/menu.ts`, `MenuGrid.astro`, `MenuCategories.tsx`, `ChefRecommendation.astro`).
- **Farm Story**: an initial version (predating the founder/YPA-connection sections added in Phase 2 — see below).
- **Gallery**: `GalleryFilters.tsx` + `GalleryLightbox.tsx`, `media/gallery.ts`.
- **Booking**: `BookingForm.tsx`/`BookingSummary.tsx`, `data/booking.ts`.
- **Catering**: event types, packages, booking process.
- **Contact**: `ContactForm.tsx`, contact channels.
- **Content system**: the `content/*.ts` per-page copy convention, typed via `types/content.ts`.
- **SEO**: `config/seo.ts`'s `DEFAULT_SEO` and the JSON-LD structured-data builders.
- **A `types/location.ts` scaffold** was created at this stage **before** the Locations module itself existed — its own header comment notes this directly: *"This file existed as an empty scaffold placeholder before this task — it wasn't premature after all, just waiting for the Locations module."* This confirms Locations was planned from the start but landed in the next phase.

## Phase 2 — Founder story, YPA connection, delivery, expansion, and the `src/assets` media migration

Commit `4264460` (86 files, +1,616/−526 lines) added, per its own commit message:

- **Founder section**: `FounderMessage.astro`, `data/farm-story.ts`'s `FOUNDER_PORTRAIT` and `TEAM_ROSTER`, `content/farm-story.ts`'s `founderMessage` copy.
- **YPA connection**: `YpaConnection.astro`, explaining the restaurant's relationship to Youth Platform Africa.
- **Delivery system**: `data/delivery.ts` (`DELIVERY_ZONES`, `getDeliveryInfo()`), `DeliveryDetails.tsx`, wired into `LocationCard.tsx`.
- **Expansion system**: `data/expansion.ts`'s `PLANNED_LOCATIONS`, `FutureExpansion.astro` — cities on the roadmap with no live contact info yet, deliberately kept separate from the operational `LOCATIONS` array.
- **Locations module completed**: `data/locations.ts`'s full `LOCATIONS` array (the Rubaga/Ntinda/Mbarara/Maddu/Nansana branches), `LocationsGrid.astro`, `LocationsMap.astro`, `LocationFeatures.astro`, `LocationCard.tsx` — filling in the scaffold from Phase 1.
- **Media system migration**: real photography moved into `src/assets/`, resolved through the new `lib/images.ts` (`resolveImage`/`resolveImageSrc`) pipeline instead of referencing `public/` paths directly — this is the point where the "filename-only lookup, folder-agnostic" resolution system (documented in [06_MEDIA_SYSTEM.md](./06_MEDIA_SYSTEM.md)) was established as the site's one image mechanism.

**Also evident from code comments, likely refined during this phase or shortly after** (exact commit boundary not preserved in history, but the evidence is in the current code):
- `FadeIn.astro` replaced an earlier per-instance hydrated Framer Motion animation island used in ~80 places — a deliberate performance pass, documented in the component's own header comment.
- `media/farm.ts`'s `FARM_IMAGES` replaced an earlier duplicate `FARM_GALLERY` array that had lived inline in `data/farm-story.ts` — consolidated into the shared `media/` collection pattern.
- `hooks/useBodyScrollLock.ts` and `hooks/useFormState.ts` were extracted after the same logic was found duplicated byte-for-byte in two components each (`MobileMenu`+`GalleryLightbox`; `BookingForm`+`ContactForm`) — a "reuse before you build" refactor, not a feature.

## Phase 3 — Photography pass

Commit `cc76d91`: real photography added for all 44 menu items (`src/assets/food/`) and 6 atmospheric grill shots (`src/assets/gallery/food/`), plus a re-optimized contact hero image. Also `17264c1`: `hero-home.webp` re-compressed (314KB → 106KB). This phase was purely asset work — no code changes.

## Phase 4 — AI Restaurant Assistant + WhatsApp Ordering System

Commit `bde2b48` (59 files, +1,840 lines) — the two newest, largest feature additions to the codebase:

- **AI Restaurant Assistant**: a site-wide floating chat widget (`components/assistant/`), a rule-based answer engine behind a swappable `AssistantEngine` interface (`lib/assistant/assistantEngine.ts`), a structured knowledge base (`data/assistant.ts` + `content/assistant.ts`), and a WhatsApp handoff builder. Uses genuine React Context (`context/AssistantContext.tsx`) since the whole widget is one hydrated island. See [08_AI_SYSTEM.md](./08_AI_SYSTEM.md).
- **WhatsApp Ordering System**: cart/order controls embedded in `FoodCard` on `/menu` (`components/cart/OrderControls.tsx`), a floating order drawer (`OrderDrawer.tsx`), and a WhatsApp checkout message builder. Uses a hand-rolled external store (`lib/cart/CartStore.ts` + `hooks/useCart.ts`, via React 19's `useSyncExternalStore`) instead of Context, since cart state must be shared across up to ~44 independently-hydrated `client:visible` islands on the Menu page plus the globally-mounted cart widget — a problem Context structurally cannot solve. See [09_WHATSAPP_ORDERING.md](./09_WHATSAPP_ORDERING.md).
- Both systems were built with **zero new npm dependencies** — the cross-island state problem was solved with core React (`useSyncExternalStore`) rather than adding a state-management library, consistent with the project's existing "hand-roll everything" philosophy.
- `MenuGrid.astro` gained the codebase's first use of `client:visible` (every other hydrated component elsewhere uses `client:load`) — a deliberate, documented deviation justified by the scale of ~44 cards on one page.
- `Layout.astro` was extended to mount both new widgets (`CartWidget`, `AssistantWidget`) globally, on every page — the first components in the codebase mounted directly in the layout rather than composed per-page like `Navbar`/`Footer`.

## Phase 5 — Cleanup and polish (this session, undocumented in git at time of writing)

- Completed the media asset set: added the remaining breakfast dish photos, the `food-quality-story.jpg` and `farm-story-preview.jpg` one-off section images, and `on-the-grill.jpg` (a farm gallery photo that had been referenced in `media/farm.ts` since Phase 2 but never actually added).
- Corrected a misnamed team asset (`obed ben.png` → `obed-ben.jpg`) to match the filename the code actually looks up.
- Removed leftover empty `public/images/*` subfolders (backgrounds, events, farm, food, gallery, locations, logos, team) and `public/icons/` — dead scaffolding from before the Phase 2 migration to `src/assets`, confirmed via full-codebase reference audit to have zero remaining consumers.
- Straightened the branding logo photo (`src/assets/branding/logo.png`), which had been photographed at a visible tilt.
- This documentation set (`docs/`) was generated.

## Architectural decisions worth remembering

These are the decisions a future maintainer is most likely to second-guess without this context:

1. **No backend, anywhere, by design** — every "submission" in the site (booking, contact, catering quote, food order) is a `wa.me`/`tel:`/`mailto:` deep link, never a fake API call. This isn't a limitation to be fixed; it's the intended architecture. See [01_PROJECT_OVERVIEW.md](./01_PROJECT_OVERVIEW.md).
2. **The Cart uses an external store, not Context; the Assistant uses Context, not an external store** — these look inconsistent at a glance but are each the *correct* choice for their respective island topology. See [08_AI_SYSTEM.md](./08_AI_SYSTEM.md) and [09_WHATSAPP_ORDERING.md](./09_WHATSAPP_ORDERING.md).
3. **`client:visible` appears exactly once**, on Menu page food cards, as a deliberate performance exception to the rest of the site's `client:load`-only convention.
4. **All contact numbers are still placeholders** (`256700000000`-series) as of this writing — see [10_DEPLOYMENT.md](./10_DEPLOYMENT.md)'s pre-launch checklist.
