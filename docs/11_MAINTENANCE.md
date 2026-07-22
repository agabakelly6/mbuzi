# Maintenance Recipes

Practical, step-by-step instructions for the changes a future developer (or restaurant owner working with one) will make most often. Every recipe names the exact file and field.

## Add a menu item

1. Open `src/data/menu.ts`.
2. Add a new object to `MENU_ITEMS`, matching the `MenuItem` interface:
   ```ts
   {
     id: "unique-kebab-case-id",
     name: "Dish Name",
     description: "One or two sentences.",
     price: "UGX 20,000",              // must be "<CURRENCY> <amount>" — also parsed for JSON-LD SEO
     variations: [{ label: "...", price: "UGX 25,000" }],  // optional
     image: "/images/food/unique-kebab-case-id.jpg",
     category: "breakfast",             // must be one of the 8 MenuCategory values
     subcategory: "Milkshakes",         // optional, only meaningful for "drinks"
     featured: false,                   // shows on homepage's Signature Dishes + Assistant's "favourites"
     chefPick: false,                   // only one item should ever have this true
   }
   ```
3. Add the photo to `src/assets/food/` with the exact filename from step 2 (see [06_MEDIA_SYSTEM.md](./06_MEDIA_SYSTEM.md)).
4. Nothing else needs to change — the item automatically appears in its category's `MenuGrid` (via the derived arrays `BREAKFAST_ITEMS`, etc., all computed from `MENU_ITEMS`), gets ordering controls on `/menu`, and is automatically indexed into the AI assistant's knowledge base (`lib/assistant/knowledgeBase.ts` rebuilds from `MENU_ITEMS` directly) without any assistant-specific change.

## Add a branch (fully operational)

1. Open `src/data/locations.ts`, add a new object to `LOCATIONS` matching the `Location` interface — `id`, `name`, `city`, `address`, real `phone`/`whatsapp` (digits only, no `+`, for `whatsapp`), `email`, `openingHours`, `description`, `services: BranchService[]`, `coordinates: {lat,lng}`, `googleMapsLink`, `heroImage`/`galleryImages` (referencing `RestaurantImage.id` values — see step 2), `featured: false`, `status: "active"`.
2. Add corresponding entries to `src/media/restaurant.ts`'s `BRANCH_IMAGES` array (photo id/src/alt for the branch), and add the real photos to `src/assets/gallery/locations/`.
3. That's it. `ACTIVE_LOCATIONS` (filtered from `LOCATIONS`) automatically feeds: the Locations page grid + map, `BookingForm`'s branch selector, `ContactForm`'s branch selector, the Cart's `OrderDrawer` branch selector, and the AI Assistant's location answers. The branch also automatically appears in SEO structured data (`getRestaurantNode()` in `config/seo.ts` lists every `ACTIVE_LOCATIONS` entry as a `department`).

## Add a branch (planned / "coming soon")

- **Not yet operational** (no real contact info yet): add to `src/data/expansion.ts`'s `PLANNED_LOCATIONS` (`{id, city, note}`) instead — shows on the Locations page's Future Expansion section without needing real hours/coordinates/contact.
- **Under construction, has a name/address but isn't open**: add to `LOCATIONS` (like a full branch) but set `status: "coming-soon"` and leave `phone`/`whatsapp`/`email` as empty strings and `openingHours: []` — this is exactly how Nansana is modeled today. `ACTIVE_LOCATIONS` automatically excludes it from bookable/contactable flows while it still appears on the Locations page.

## Replace hero images

Each page's hero image is set in that page's `content/*.ts` file, under `hero.image`/`hero.imageAlt`:

| Page | File | Field |
|---|---|---|
| Home | `content/homepage.ts` | `hero.image` |
| Menu | `content/menu.ts` | `hero.image` |
| Farm Story | `content/farm-story.ts` | `hero.image` |
| Gallery | `content/gallery.ts` | `hero.image` |
| Locations | `content/locations.ts` | `hero.image` |
| Booking | `content/booking.ts` | `hero.image` |
| Catering | `content/catering.ts` | `hero.image` |
| Contact | `content/contact.ts` | `hero.image` |

To change the photo, just replace the file at `src/assets/hero/{filename}` with the same filename — no need to touch the content file at all. To use a *different* filename, update the `hero.image` string too. See [06_MEDIA_SYSTEM.md](./06_MEDIA_SYSTEM.md) for size/format guidance.

## Replace gallery photos

Photos are grouped by category, each its own file under `src/media/`: `food.ts`, `farm.ts`, `restaurant.ts`, `team.ts`, `event.ts`. To swap a photo, overwrite the file in `src/assets/` at the matching filename. To add a *new* gallery photo, add an entry to the relevant `media/*.ts` array (`{id, title, description, src, alt, category, featured, width, height}`) and add the file to `src/assets/`. It will automatically appear in `/gallery`'s filtered grid (via `media/gallery.ts`'s `GALLERY_IMAGES` merge) — no change needed to `GalleryFilters.tsx` or the Gallery page itself.

## Update delivery fees

Edit `src/data/delivery.ts`'s `DELIVERY_ZONES` array (`{id, label, fee}` — fee in UGX). This one array is shared by **every** active branch today (there's no per-branch override) and feeds both the Locations page's `DeliveryDetails` card and the Cart's `OrderDrawer` zone selector — one edit updates both. If a future requirement needs per-branch fees, see [14_FUTURE_ROADMAP.md](./14_FUTURE_ROADMAP.md).

## Update business hours

- **Sitewide default** (footer, structured data, AI assistant's hours answer): `config/site.ts`'s `BUSINESS_HOURS` array.
- **A specific branch's hours** (if it differs from the standard schedule): edit that branch's `openingHours` array directly in `data/locations.ts` (note most branches currently share one `STANDARD_OPENING_HOURS` constant defined at the top of that file — either edit the shared constant to change all of them at once, or replace one branch's `openingHours` with its own array to make it different).

Format matters: strings like `"Sun – Thu"` and `"06:00 – 23:00"` are parsed by `config/seo.ts`'s structured-data builder into valid schema.org `OpeningHoursSpecification` — keep the en-dash (`–`) separator and day abbreviations (`Sun`/`Mon`/`Tue`/`Wed`/`Thu`/`Fri`/`Sat`) consistent with the existing entries, or the JSON-LD output will silently omit that entry.

## Update SEO

- **Per-page title/description**: each page's `content/*.ts` file's `seo: {title, description, keywords?}` field.
- **Sitewide fallback**: `config/seo.ts`'s `DEFAULT_SEO` object.
- **Structured data (JSON-LD)**: automatically derived from real data — you generally don't need to hand-edit it. If a page's FAQ section changes, its `faqItems` (passed to `getPageStructuredData()` in that page's `.astro` file) should be updated to match, since the convention here is "never pass FAQ items to structured data that aren't actually visible on the page."

## Add team members

1. Add the portrait to `src/assets/team/{id}-manager.jpg` (or similar).
2. Add a photo entry to `src/media/team.ts`'s `TEAM_IMAGES` array (`{id, title, description, src, alt, category: "team", featured, width, height}`).
3. Add a roster entry to `src/data/farm-story.ts`'s `TEAM_ROSTER` array (`{imageId, role, group: "Branch Leadership"}`), referencing the `TEAM_IMAGES.id` from step 2.

`MeetTheTeam.astro` (on `/farm-story`) joins these two by id automatically.

## Replace the logo

Add a file at exactly `src/assets/branding/logo.png`, `.svg`, or `.webp` (no other extension is recognized for the logo specifically — see [06_MEDIA_SYSTEM.md](./06_MEDIA_SYSTEM.md)). `Logo.tsx` picks it up automatically everywhere (navbar, mobile drawer, footer) with no code change. Delete the file to revert to the built-in text/SVG monogram fallback.

## Update contact details

All in `src/config/site.ts`'s `SITE` object: `phone`, `phoneDigits`, `whatsappNumber`, `email`, `address`, `googleMapsUrl`. One edit propagates everywhere via the shared `getWhatsAppUrl()`/`getTelUrl()`/`getMailtoUrl()` helpers — never hand-edit a phone number inside a component.

For a specific branch's own contact details (not the site-wide default), edit that branch's entry in `data/locations.ts` instead.

For contact-page departments (Reservations/Catering/Feedback/General) and their optional department-specific email addresses, edit `src/data/contact.ts`'s `DEPARTMENTS` array.

## Update the founder message

`src/content/farm-story.ts`'s `founderMessage` object — `eyebrow`, `heading`, `paragraphs: string[]` (each a separate paragraph, first-person voice), and `signature: {name, title, organizations}`. The founder's portrait (`FOUNDER_PORTRAIT`) is a separate one-off entry in `src/data/farm-story.ts` — replace the photo at `src/assets/team/obed-ben.jpg` (or update the `src` field if renaming) to change the portrait.

## General rule for all of the above

If you're ever tempted to type a business fact (a phone number, a price, an address) directly into a `.astro` or `.tsx` component file, stop — it almost certainly already has a home in `config/`, `data/`, or `content/`, and a component should only ever *import* it. See [15_CODE_CONVENTIONS.md](./15_CODE_CONVENTIONS.md).
