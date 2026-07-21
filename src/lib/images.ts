// src/lib/images.ts
//
// Bridges the data layer's plain image paths (data/menu.ts, data/locations.ts,
// media/*.ts, content/*.ts — all just strings like "/images/food/goat-katogo.jpg")
// with Astro's real image optimization pipeline. That pipeline only ever
// processes images it can see as imported ESM modules; a plain string
// pointing into public/ is served completely unprocessed (no resizing, no
// format conversion, no srcset). So every real photo lives in src/assets/
// instead, imported once here via import.meta.glob, and looked up by
// filename — meaning none of the data files above had to change.
//
// Filenames are unique across the whole site's photography, so one flat
// map covers every category (hero, food, gallery, team, farm) rather than
// each caller needing to know which category resolver to reach for.
import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";

type ImageModule = { default: ImageMetadata };

const IMAGE_MODULES = import.meta.glob<ImageModule>("/src/assets/**/*.{jpg,jpeg,png,webp,avif}", {
  eager: true,
});

const IMAGES_BY_FILENAME = new Map<string, ImageMetadata>(
  Object.entries(IMAGE_MODULES).map(([path, mod]) => [path.split("/").pop()!, mod.default])
);

/**
 * Resolves a data-layer image path (or bare filename) to its imported,
 * optimizable ImageMetadata — or `undefined` if that file hasn't been
 * added to src/assets/ yet. Every Astro-rendered image should resolve
 * through this (see components/ui/OptimizedImage.astro) rather than
 * rendering the raw path in an <img> directly.
 */
export function resolveImage(pathOrFilename: string): ImageMetadata | undefined {
  return IMAGES_BY_FILENAME.get(pathOrFilename.split("/").pop()!);
}

/**
 * Same resolution, pre-rendered to a plain optimized URL string. For
 * React island components (FoodCard, LocationCard, GalleryCard...) that
 * can't use the astro:assets <Image> component directly — their Astro
 * parent calls this at build time and passes the resulting string down
 * as an ordinary prop. Returns `undefined` when the file doesn't exist
 * yet, same as resolveImage.
 */
export async function resolveImageSrc(pathOrFilename: string): Promise<string | undefined> {
  const resolved = resolveImage(pathOrFilename);
  if (!resolved) return undefined;
  const optimized = await getImage({ src: resolved, width: resolved.width });
  return optimized.src;
}
