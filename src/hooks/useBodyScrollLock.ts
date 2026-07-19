// src/hooks/useBodyScrollLock.ts
//
// MobileMenu and GalleryLightbox each locked page scroll while open with
// the identical effect. Extracted once both were found to be byte-for-byte
// the same implementation; the rest of their focus-trap/keyboard handling
// differs enough between the two (different focusable selectors, Escape
// behavior, arrow-key navigation) that it wasn't merged.
import { useEffect } from "react";

export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    document.documentElement.style.overflow = isLocked ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [isLocked]);
}
