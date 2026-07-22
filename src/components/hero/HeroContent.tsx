// src/components/hero/HeroContent.tsx
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { HeroButtons } from "./HeroButtons";
import { ScrollIndicator } from "./ScrollIndicator";

interface HeroContentProps {
  headingId: string;
  eyebrow: string;
  mottoLines: string[];
  supportingText: string;
  reserveHref: string;
  reserveLabel: string;
  exploreHref: string;
  exploreLabel: string;
  nextSectionId: string;
}

/**
 * Text/CTA stack centered over the hero media. Mounted with client:load
 * (not client:visible like the below-the-fold sections) because it's the
 * first thing visitors see — its entrance animation should start on load.
 */
export function HeroContent({
  headingId,
  eyebrow,
  mottoLines,
  supportingText,
  reserveHref,
  reserveLabel,
  exploreHref,
  exploreLabel,
  nextSectionId,
}: HeroContentProps) {
  const prefersReducedMotion = useReducedMotion();

  const stagger: Variants = {
    hidden: {},
    visible: {
      transition: prefersReducedMotion
        ? {}
        : { staggerChildren: 0.12, delayChildren: 0.15 },
    },
  };

  const rise: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.01 : 0.6, ease: "easeOut" },
    },
  };

  return (
    <>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-6 px-6 text-center"
      >
        <motion.p
          variants={rise}
          className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#C89A4B]"
        >
          {eyebrow}
        </motion.p>

        <motion.h1
          id={headingId}
          variants={rise}
          className="font-serif text-4xl font-semibold text-white sm:text-5xl lg:text-6xl"
        >
          {mottoLines.map((line, index) => (
            <span key={line} className="block">
              {line}
              {index < mottoLines.length - 1 && <br />}
            </span>
          ))}
        </motion.h1>

        <motion.p variants={rise} className="max-w-xl text-base text-white/80 sm:text-lg">
          {supportingText}
        </motion.p>

        <motion.div variants={rise} className="mt-2 w-full">
          <HeroButtons
            reserveHref={reserveHref}
            reserveLabel={reserveLabel}
            exploreHref={exploreHref}
            exploreLabel={exploreLabel}
          />
        </motion.div>
      </motion.div>

      <ScrollIndicator targetId={nextSectionId} />
    </>
  );
}
