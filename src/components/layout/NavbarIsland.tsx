// src/components/layout/NavbarIsland.tsx
import { motion, type Variants } from "framer-motion";
import type { CtaLink, NavLink } from "../../data/navigation";
import { useScrollPosition } from "../../hooks/useScrollPosition";
import { Logo } from "../ui/Logo";
import { WhatsAppButton } from "../ui/WhatsAppButton";
import { MobileMenu } from "./MobileMenu";

interface NavbarIslandProps {
  links: NavLink[];
  ctas: CtaLink[];
}

const barVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeDown: Variants = {
  hidden: { opacity: 0, y: -14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

/**
 * The interactive navbar shell. Rendered as a client island from
 * Navbar.astro so Framer Motion (and the scroll listener it depends on)
 * only ships where it's needed, while the outer <header> stays part of
 * the server-rendered page shell for fast first paint.
 */
export function NavbarIsland({ links, ctas }: NavbarIslandProps) {
  const isScrolled = useScrollPosition(60);

  const solidCta = ctas.find((cta) => cta.variant === "solid");
  const outlineCta = ctas.find((cta) => cta.variant === "outline");

  return (
    <motion.header
      variants={barVariants}
      initial="hidden"
      animate="visible"
      className={[
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-out",
        isScrolled
          ? "bg-[#14100D]/90 shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur-md"
          : "bg-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-6 lg:h-24 lg:px-12">
        <motion.div variants={fadeDown}>
          <Logo tone="light" />
        </motion.div>

        <nav aria-label="Primary" className="hidden lg:block">
          <motion.ul variants={barVariants} className="flex items-center gap-8 xl:gap-9">
            {links.map((link) => (
              <motion.li key={link.href} variants={fadeDown}>
                <a
                  href={link.href}
                  className="group relative py-2 text-[13px] font-medium uppercase tracking-[0.1em] text-white/90 transition-colors duration-300 hover:text-[#C89A4B] focus-visible:text-[#C89A4B] focus-visible:outline-none"
                >
                  {link.label}
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-0.5 h-px origin-center scale-x-0 bg-[#C89A4B] transition-transform duration-300 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100"
                  />
                </a>
              </motion.li>
            ))}
          </motion.ul>
        </nav>

        <div className="flex items-center gap-3">
          <motion.div variants={fadeIn} className="hidden items-center gap-3 lg:flex">
            {outlineCta && (
              <WhatsAppButton href={outlineCta.href} label={outlineCta.label} variant="outline" />
            )}
            {solidCta && (
              <a
                href={solidCta.href}
                className="rounded-full bg-[#C89A4B] px-6 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#14100D] transition-transform duration-300 hover:scale-[1.03] hover:bg-[#E3BD72] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89A4B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100D]"
              >
                {solidCta.label}
              </a>
            )}
          </motion.div>

          <motion.div variants={fadeIn}>
            <MobileMenu links={links} ctas={ctas} />
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
