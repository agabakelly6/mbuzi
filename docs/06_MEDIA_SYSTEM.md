# Media System

## How image resolution actually works

There are **two separate, independent image mechanisms** in this codebase. Confusing them is the most common way to break an image silently.

### 1. The general photo pipeline — `src/lib/images.ts`

```ts
const IMAGE_MODULES = import.meta.glob("/src/assets/**/*.{jpg,jpeg,png,webp,avif}", { eager: true });
const IMAGES_BY_FILENAME = new Map(/* keyed by basename, e.g. "goat-katogo.jpg" */);

export function resolveImage(pathOrFilename: string): ImageMetadata | undefined
export async function resolveImageSrc(pathOrFilename: string): Promise<string | undefined>
```

Every data/content file stores an image as a plain string path like `"/images/food/goat-katogo.jpg"`. **This string is never fetched as a URL.** It's a lookup key — `resolveImage()` strips it down to just the filename (`goat-katogo.jpg`) and looks it up in a map of every file that actually exists under `src/assets/**`, regardless of which subfolder it's really in.

**Consequence**: two different images cannot share the same filename anywhere in `src/assets/`, even in different subfolders — the map is flat, keyed by filename only, and a collision silently picks whichever file `import.meta.glob` happened to enumerate. Folder structure under `src/assets/` is for human organization; it plays no role in resolution.

`resolveImage()` returns the real `ImageMetadata` for use with Astro's `<Image>` component (only callable from `.astro` files). `resolveImageSrc()` goes one step further and calls `astro:assets`' `getImage()` to produce a final, optimized, hashed URL string — this is what gets passed down into React components (like `FoodCard`), since React can't call `astro:assets` itself.

If a filename referenced in data/content has no matching file yet, both functions return `undefined` — components handle this gracefully (`OptimizedImage.astro` renders a placeholder panel; `FoodCard` renders a plain colored div instead of a broken `<img>`). **Nothing crashes when a photo is missing** — it just doesn't render.

### 2. The logo — `src/lib/logo.ts` (a separate, simpler mechanism)

```ts
const LOGO_MODULES = import.meta.glob("../assets/branding/logo.{png,svg,webp}", {
  eager: true, import: "default", query: "?url",
});
export const LOGO_SRC: string | undefined = Object.values(LOGO_MODULES)[0];
```

This does **not** go through `astro:assets` optimization at all — it's a raw `?url` import, because `Logo.tsx` renders both server-side (`Footer.astro`) and inside a client-hydrated island (`NavbarIsland`/`MobileMenu`), and `astro:assets` is server-only.

**Critical**: the logo file must be named exactly `logo.png`, `logo.svg`, or `logo.webp` — **not** `.jpg`/`.jpeg`/`.avif`, and it must live at exactly `src/assets/branding/logo.{png,svg,webp}`. If no such file exists, `Logo.tsx` renders a built-in circular monogram + wordmark fallback instead — nothing breaks, but nothing but the fallback shows either.

## Folder locations

```
src/assets/
├── branding/logo.{png,svg,webp}   ← optional, see above
├── farm/
│   ├── brand-story.jpg, sustainability.jpg
│   └── gallery/                    ← morning-pasture, the-herd, hand-selection,
│                                       charcoal-prep, on-the-grill, farm-sunset
├── food/                           ← every dish photo (data/menu.ts) +
│                                       food-quality-story.jpg
├── gallery/
│   ├── events/                     ← private-dinner-setup, birthday-celebration,
│   │                                   corporate-event, live-grill-station
│   ├── food/                       ← whole-goat-fire, charcoal-flames, fresh-cuts,
│   │                                   plated-choma, grill-master-at-work, smoke-and-fire
│   ├── locations/                  ← 11 branch interior/exterior photos
│   └── family-dining.jpg, outdoor-seating.jpg, private-events.jpg, warm-atmosphere.jpg
├── hero/                           ← one per page: hero-home, hero-menu, hero-farm-story,
│                                       hero-gallery, hero-locations, hero-booking,
│                                       hero-catering, hero-contact, hero-main (OG fallback)
└── team/                           ← rubaga-manager, ntinda-manager, mbarara-manager,
                                        obed-ben (founder)
```

`public/images/hero/hero-main.webp` is the **one exception** — see [02_FOLDER_STRUCTURE.md](./02_FOLDER_STRUCTURE.md) for why the default Open Graph image has to live outside the `src/assets` pipeline.

## Naming convention

The filename in `src/assets/` must **exactly match** (case-sensitive, correct extension) the basename of the path string used in the relevant `data/*.ts` or `media/*.ts` file. To find the required filename for any image:

```bash
grep -rn "your-search-term" src/data/ src/media/ src/content/
```

Every current mapping is enumerable this way — e.g. `data/menu.ts`'s `image: "/images/food/goat-katogo.jpg"` requires a file at `src/assets/**/goat-katogo.jpg` (folder doesn't matter, but `src/assets/food/` is where every other dish photo lives, by convention).

## How to replace an image

1. Find the exact required filename (see above, or check [11_MAINTENANCE.md](./11_MAINTENANCE.md)'s specific recipes).
2. Overwrite (or add) the file at that filename anywhere under `src/assets/` — matching subfolder by convention, not requirement.
3. No code change needed. Rerun `npm run dev` or `npm run build` — Astro's image pipeline re-optimizes automatically.

There is no image-management UI, no CMS, no database record to update — the filesystem *is* the source of truth for which photo renders where.

## Recommended sizes, formats, and compression

Astro's build-time image pipeline (via `sharp`, bundled with Astro) automatically resizes and re-encodes every photo that goes through `resolveImage()`/`OptimizedImage.astro` — during a real build on this project, source photos in the hundreds of KB to low MB range were routinely optimized down to tens of KB as `.webp`. You do not need to pre-compress images before adding them.

That said, upload sensible originals:

| Use case | Recommended source resolution | Why |
|---|---|---|
| Hero images | ≥ 1920px wide | Full-bleed, `h-screen`, often the LCP element — needs to look sharp at large viewport widths |
| Menu dish photos | ≥ 1200px wide | Rendered at `aspect-[4/3]` in a grid; also used at full size nowhere, so this is comfortably enough headroom |
| Gallery / farm / restaurant photos | ≥ 1200×900 (the aspect ratio declared in `media/*.ts`) | Matches the `width`/`height` metadata already declared for these collections |
| Team / founder portraits | ≥ 800×800 (square) | Matches `media/team.ts`'s declared square aspect ratio |
| Logo | Any — SVG strongly preferred if available | A vector logo scales perfectly at the small navbar size (`h-10`); a raster logo works fine too since it's rendered small |

**Formats**: source files can be `.jpg`, `.jpeg`, `.png`, `.webp`, or `.avif` — the resolver globs all five. Astro converts everything to optimized `.webp` output at build time regardless of source format, so there's no strict requirement to pre-convert; `.jpg` is the most common and safest default to hand a non-technical photo source.

**Do not** manually pre-resize/compress aggressively before uploading — you'll just be compressing an already-lossy source that Astro will re-compress again, compounding quality loss for no benefit. Upload the best-quality original you have.

## How hero images work

Each page's `content/*.ts` file declares its own `hero.image`/`hero.imageAlt` (typed as `HeroContent`). `Hero.astro` receives these as `posterSrc`/`posterAlt` props and renders them through `OptimizedImage.astro` (which uses `resolveImage()`). The homepage additionally layers a video (`/videos/hero.mp4`, from `public/`) over the poster on large screens only — every other page is poster-only. See [03_COMPONENT_GUIDE.md](./03_COMPONENT_GUIDE.md#componentshero--the-reusable-page-hero).

## How gallery images work

`src/media/gallery.ts` merges five category collections (`FOOD_IMAGES`, `FARM_IMAGES`, `RESTAURANT_IMAGES`, `TEAM_IMAGES`, `EVENT_IMAGES`) into one `GALLERY_IMAGES` array, each item typed as `MediaImage` (`id`, `title`, `description`, `src`, `alt`, `category`, `featured`, `width`, `height`). `pages/gallery/index.astro` resolves every image's URL server-side via `resolveImageSrc()` (since the gallery UI is a `client:visible` React island that can't call `astro:assets` itself), then passes the resolved array into `GalleryFilters.tsx`, which filters by `category` and opens `GalleryLightbox.tsx` on click.

Adding a new gallery photo means: (1) add the file to the right `src/assets/gallery/{category}/` folder, (2) add a matching entry to the relevant `media/*.ts` file. It will automatically appear in the Gallery page's filtered grid and in the FoodCard/LocationCard/etc. wherever that same `media/*.ts` collection is reused elsewhere (e.g. `media/restaurant.ts`'s `BRANCH_IMAGES` also feeds `LocationCard.tsx` on the Locations page).

## How team images work

`src/media/team.ts` (`TEAM_IMAGES`) holds the photo metadata (id, src, alt); `src/data/farm-story.ts` (`TEAM_ROSTER`) holds the *role* data (job title, group), referencing a `TEAM_IMAGES.id`. `MeetTheTeam.astro` joins the two by id. This split exists so a person's name/role (a roster concern) doesn't have to be duplicated into the media file just because the media file also needs to know who's pictured.

The founder photo (`obed-ben.jpg`) is handled separately via `FOUNDER_PORTRAIT` in `data/farm-story.ts` — it's a one-off, not part of the reusable `TEAM_IMAGES` collection, since only `FounderMessage.astro` uses it.

## How logos work

See the "Two mechanisms" section above. In short: drop `src/assets/branding/logo.png` (or `.svg`/`.webp`) and every `<Logo>` usage sitewide switches to it automatically — no code change, no restart-required config. Remove the file to revert to the built-in monogram fallback.
