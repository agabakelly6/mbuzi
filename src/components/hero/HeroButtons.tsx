// src/components/hero/HeroButtons.tsx
import { motion, type Variants } from "framer-motion";

interface HeroButtonsProps {
  reserveHref: string;
  reserveLabel: string;
  exploreHref: string;
  exploreLabel: string;
}

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

/**
 * Primary/secondary hero CTA pair, kept as its own component because
 * every future page hero (Menu, Farm Story, Booking...) reuses this exact
 * pattern with different copy and links, not just the homepage.
 *
 * NOTE: your project already has components/ui/Button.astro. I did not
 * base this on it — its contents aren't visible to me, and it's a static
 * Astro component, not motion-compatible for the stagger animation these
 * CTAs need inside a React island. If Button.astro's visual style should
 * be the source of truth, share it and I'll reconcile the two.
 */
export function HeroButtons({
  reserveHref,
  reserveLabel,
  exploreHref,
  exploreLabel,
}: HeroButtonsProps) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row"
    >
      <motion.a
        variants={rise}
        href={reserveHref}
        className="w-full rounded-full bg-[#C89A4B] px-8 py-3.5 text-center text-[13px] font-semibold uppercase tracking-[0.1em] text-[#14100D] transition-transform duration-300 hover:scale-[1.03] hover:bg-[#E3BD72] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89A4B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100D] sm:w-auto"
      >
        {reserveLabel}
      </motion.a>

      <motion.a
        variants={rise}
        href={exploreHref}
        className="w-full rounded-full border border-white/40 px-8 py-3.5 text-center text-[13px] font-semibold uppercase tracking-[0.1em] text-white transition-colors duration-300 hover:border-[#C89A4B] hover:text-[#C89A4B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89A4B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100D] sm:w-auto"
      >
        {exploreLabel}
      </motion.a>
    </motion.div>
  );
}
