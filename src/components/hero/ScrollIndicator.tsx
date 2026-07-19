// src/components/hero/ScrollIndicator.tsx
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface ScrollIndicatorProps {
  /** id of the section to jump to when activated */
  targetId?: string;
}

/**
 * Bouncing scroll cue pinned to the bottom of the hero. Rendered as a
 * real <a href="#..."> so it still works with JS disabled and is
 * keyboard/screen-reader accessible; the bounce is skipped entirely for
 * users who've requested reduced motion.
 */
export function ScrollIndicator({ targetId = "hero-next" }: ScrollIndicatorProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <a
      href={`#${targetId}`}
      aria-label="Scroll to explore"
      className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-white/70 transition-colors duration-300 hover:text-[#C89A4B] focus-visible:text-[#C89A4B] focus-visible:outline-none"
    >
      <span className="text-[10px] font-medium uppercase tracking-[0.28em]">
        Scroll
      </span>
      <motion.span
        animate={shouldReduceMotion ? {} : { y: [0, 8, 0] }}
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <ChevronDown className="h-5 w-5" aria-hidden="true" />
      </motion.span>
    </a>
  );
}
