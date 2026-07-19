// src/components/sections/GalleryFilters.tsx
//
// Despite the name (kept to match the expected component list), this is
// the full interactive orchestrator for the gallery — filter pills, the
// filtered card grid, and the lightbox all share state (which category
// is active, which image index is open), so they're composed here as one
// hydrated island rather than three separately-hydrated components with
// state awkwardly synced between them.
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { GalleryImage, MediaCategory } from "../../types/media";
import type { GalleryFilterOption } from "../../media/gallery";
import { GalleryCard } from "../cards/GalleryCard";
import { GalleryLightbox } from "./GalleryLightbox";

interface GalleryFiltersProps {
  images: GalleryImage[];
  filters: GalleryFilterOption[];
}

export function GalleryFilters({ images, filters }: GalleryFiltersProps) {
  const [activeFilter, setActiveFilter] = useState<MediaCategory | "all">("all");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const filteredImages = useMemo(
    () =>
      activeFilter === "all"
        ? images
        : images.filter((image) => image.category === activeFilter),
    [images, activeFilter]
  );

  const handleFilterChange = (filter: MediaCategory | "all") => {
    setActiveFilter(filter);
    setActiveIndex(null);
  };

  return (
    <section
      id="gallery-grid"
      aria-label="Gallery"
      className="scroll-mt-36 bg-[#F5EFE4] py-20 sm:py-28 lg:scroll-mt-40"
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <div
          role="tablist"
          aria-label="Filter gallery by category"
          className="flex flex-wrap justify-center gap-2"
        >
          {filters.map((filter) => {
            const isActive = filter.id === activeFilter;
            return (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleFilterChange(filter.id)}
                className={`rounded-full px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors duration-300 ${
                  isActive
                    ? "bg-[#14100D] text-white"
                    : "text-[#14100D]/60 hover:bg-[#14100D]/5 hover:text-[#14100D]"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <motion.div layout className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredImages.map((image, index) => (
              <motion.div
                key={image.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.35 }}
              >
                <GalleryCard image={image} onOpen={() => setActiveIndex(index)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <GalleryLightbox
        images={filteredImages}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(null)}
        onNext={() =>
          setActiveIndex((current) =>
            current === null ? null : (current + 1) % filteredImages.length
          )
        }
        onPrev={() =>
          setActiveIndex((current) =>
            current === null
              ? null
              : (current - 1 + filteredImages.length) % filteredImages.length
          )
        }
      />
    </section>
  );
}
