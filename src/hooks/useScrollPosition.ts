// src/hooks/useScrollPosition.ts
import { useEffect, useState } from "react";

/**
 * Tracks whether the page has been scrolled past a given threshold.
 *
 * Uses a passive scroll listener throttled with requestAnimationFrame,
 * so the check never runs more than once per frame — cheap enough to
 * drive a smooth navbar background/blur transition at 60fps.
 */
export function useScrollPosition(threshold = 60): boolean {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    const evaluate = () => {
      setIsScrolled(window.scrollY > threshold);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(evaluate);
        ticking = true;
      }
    };

    // Resolve initial state immediately — handles page loads that start
    // mid-scroll (hash navigation, browser scroll restoration, etc.).
    evaluate();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return isScrolled;
}
