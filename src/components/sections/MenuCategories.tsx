// src/components/sections/MenuCategories.tsx
import { useEffect, useState } from "react";
import type { MenuSection } from "../../data/menu-sections";

interface MenuCategoriesProps {
  sections: MenuSection[];
}

/**
 * Sticky quick-nav for the menu page. Tracks which category section is
 * currently in view via IntersectionObserver and highlights the matching
 * pill; clicking a pill smooth-scrolls to that section. A genuine island
 * (client:load) — unlike the below-the-fold FadeIn reveals, active-section
 * tracking has to be running as soon as the page is interactive.
 */
export function MenuCategories({ sections }: MenuCategoriesProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        // Bias the trigger zone to the upper part of the viewport, below
        // the sticky nav itself, so a section reads as "active" once
        // it's meaningfully in view rather than just barely peeking in.
        rootMargin: "-15% 0px -70% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const handleClick = (id: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
    setActiveId(id);
  };

  return (
    <nav
      aria-label="Menu categories"
      className="sticky top-20 z-30 border-b border-[#14100D]/10 bg-[#F5EFE4]/95 backdrop-blur-md lg:top-24"
    >
      <div className="mx-auto flex max-w-[1280px] flex-wrap justify-center gap-2 px-6 py-4 lg:px-12">
        {sections.map((section) => {
          const isActive = section.id === activeId;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={handleClick(section.id)}
              aria-current={isActive ? "true" : undefined}
              className={`rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors duration-300 ${
                isActive
                  ? "bg-[#14100D] text-white"
                  : "text-[#14100D]/60 hover:bg-[#14100D]/5 hover:text-[#14100D]"
              }`}
            >
              {section.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
