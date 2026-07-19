// src/components/cards/GalleryCard.tsx
import { motion } from "framer-motion";
import type { GalleryImage } from "../../types/media";

interface GalleryCardProps {
  image: GalleryImage;
  onOpen: () => void;
}

/**
 * Presentational gallery tile. Visually matches ImageGrid's hover-zoom /
 * gradient-overlay treatment for consistency with the rest of the site,
 * but is a genuinely different component — this one is clickable and
 * lives inside the client-hydrated filter/lightbox tree (GalleryFilters),
 * whereas ImageGrid is deliberately static with no click behavior.
 */
export function GalleryCard({ image, onOpen }: GalleryCardProps) {
  return (
    <motion.button
      type="button"
      layout
      onClick={onOpen}
      aria-label={`Open ${image.title} in the lightbox`}
      className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89A4B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5EFE4]"
    >
      <img
        src={image.src}
        alt={image.alt}
        loading="lazy"
        decoding="async"
        width={image.width}
        height={image.height}
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#14100D]/70 via-[#14100D]/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span className="absolute bottom-4 left-4 font-serif text-base font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {image.title}
      </span>
    </motion.button>
  );
}
