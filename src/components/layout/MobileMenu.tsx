// src/components/layout/MobileMenu.tsx
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import type { CtaLink, NavLink } from "../../data/navigation";
import { Logo } from "../ui/Logo";
import { WhatsAppButton } from "../ui/WhatsAppButton";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

interface MobileMenuProps {
  links: NavLink[];
  ctas: CtaLink[];
}

/**
 * Self-contained mobile navigation: the hamburger trigger (visible only
 * below `lg`) plus the full-screen drawer it opens. Keeping trigger and
 * panel in one component means open state, focus management, and body
 * scroll locking never have to be threaded through a parent.
 */
export function MobileMenu({ links, ctas }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const dialogId = useId();
  const prefersReducedMotion = useReducedMotion();

  const panelVariants: Variants = {
    closed: { x: "100%", transition: { duration: prefersReducedMotion ? 0.01 : 0.45, ease: [0.76, 0, 0.24, 1] } },
    open: { x: 0, transition: { duration: prefersReducedMotion ? 0.01 : 0.55, ease: [0.16, 1, 0.3, 1] } },
  };

  const listVariants: Variants = {
    closed: {},
    open: { transition: prefersReducedMotion ? {} : { staggerChildren: 0.06, delayChildren: 0.15 } },
  };

  const itemVariants: Variants = {
    closed: { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
    open: { opacity: 1, y: 0, transition: { duration: prefersReducedMotion ? 0.01 : 0.4, ease: "easeOut" } },
  };

  // Closes the drawer and always returns focus to the hamburger trigger —
  // used by every close path (Escape, scrim click, nav link click, CTA
  // click) so focus never gets dropped to <body> regardless of how the
  // drawer was dismissed.
  function closeMenu() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  // Lock page scroll while the drawer is open.
  useBodyScrollLock(isOpen);

  // Move focus into the panel on open; Escape closes and returns focus
  // to the trigger; Tab is trapped inside the panel while it's open.
  useEffect(() => {
    if (!isOpen) return;

    firstLinkRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        return;
      }

      if (event.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])"
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={dialogId}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative z-[60] flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-white transition-colors duration-300 hover:border-[#C89A4B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89A4B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100D]"
      >
        <span className="relative block h-3.5 w-4">
          <motion.span
            className="absolute left-0 top-0 h-[1.5px] w-full bg-current"
            animate={{ rotate: isOpen ? 45 : 0, y: isOpen ? 6 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
          <motion.span
            className="absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 bg-current"
            animate={{ opacity: isOpen ? 0 : 1 }}
            transition={{ duration: 0.2 }}
          />
          <motion.span
            className="absolute bottom-0 left-0 h-[1.5px] w-full bg-current"
            animate={{ rotate: isOpen ? -45 : 0, y: isOpen ? -6 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="scrim"
              className="fixed inset-0 z-40 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={closeMenu}
              aria-hidden="true"
            />

            <motion.div
              key="panel"
              id={dialogId}
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col justify-between bg-[#14100D] px-8 py-10 shadow-2xl"
              variants={panelVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <div className="flex h-full flex-col justify-center">
                <div className="absolute left-8 top-10">
                  <Logo tone="light" />
                </div>

                <motion.ul
                  className="flex flex-col gap-1"
                  variants={listVariants}
                  initial="closed"
                  animate="open"
                >
                  {links.map((link, index) => (
                    <motion.li key={link.href} variants={itemVariants}>
                      <a
                        ref={index === 0 ? firstLinkRef : undefined}
                        href={link.href}
                        onClick={closeMenu}
                        className="block border-b border-white/10 py-4 text-center font-serif text-2xl text-white/90 transition-colors duration-300 hover:text-[#C89A4B] focus-visible:text-[#C89A4B] focus-visible:outline-none"
                      >
                        {link.label}
                      </a>
                    </motion.li>
                  ))}
                </motion.ul>
              </div>

              <motion.div
                className="flex flex-col gap-3"
                variants={listVariants}
                initial="closed"
                animate="open"
              >
                {ctas.map((cta) =>
                  cta.icon === "whatsapp" ? (
                    <motion.div key={cta.href} variants={itemVariants} onClick={closeMenu}>
                      <WhatsAppButton
                        href={cta.href}
                        label={cta.label}
                        variant="outline"
                        className="w-full"
                      />
                    </motion.div>
                  ) : (
                    <motion.a
                      key={cta.href}
                      variants={itemVariants}
                      href={cta.href}
                      onClick={closeMenu}
                      className="flex items-center justify-center rounded-full bg-[#C89A4B] px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] text-[#14100D] transition-transform duration-300 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89A4B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100D]"
                    >
                      {cta.label}
                    </motion.a>
                  )
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
