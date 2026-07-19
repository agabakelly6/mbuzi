// src/config/theme.ts
//
// Single source of truth for the design system's raw tokens. This file
// exports plain values (hex strings, rem strings, numbers) — NOT
// Tailwind class names. Anything that programmatically builds class
// strings (button-variants.ts is the canonical example) should import
// these tokens rather than hardcoding hex codes inline.
//
// IMPORTANT MIGRATION NOTE: most existing section/card components
// currently reference these same colors as literal Tailwind arbitrary
// values (e.g. `bg-[#C89A4B]`) written directly in JSX/markup, predating
// this file. That is a real, acknowledged gap — see the write-up
// accompanying this file for the full list and a recommended follow-up
// pass. New code should not add to that gap: import COLORS here instead
// of typing a new hex literal.

export const COLORS = {
  primary: "#C89A4B", // brand gold
  primaryHover: "#E3BD72",
  secondary: "#14100D", // charcoal — the site's base/ink color
  accent: "#C89A4B", // alias of primary, kept distinct for semantic intent at call sites
  background: {
    dark: "#14100D",
    light: "#FFFFFF",
    cream: "#F5EFE4",
    creamAlt: "#FAF6EF",
  },
  text: {
    onDark: "#FFFFFF",
    onDarkMuted: "rgba(255,255,255,0.7)",
    onLight: "#14100D",
    onLightMuted: "rgba(20,16,13,0.65)",
  },
  border: {
    onDark: "rgba(255,255,255,0.3)",
    onLight: "rgba(20,16,13,0.25)",
  },
  whatsapp: "#25D366",
  whatsappHover: "#1DA851",
} as const;

export const RADIUS = {
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  full: "9999px",
} as const;

/** Section/content max-widths used across every page. */
export const CONTAINER = {
  content: "1280px", // standard section max-width
  narrow: "900px", // single-column narrative content (e.g. FarmTimeline)
  prose: "672px", // section intros/eyebrow blocks (~max-w-2xl)
} as const;

export const SPACING = {
  sectionPaddingY: {
    mobile: "5rem", // py-20
    desktop: "7rem", // py-28
  },
  sectionPaddingX: {
    mobile: "1.5rem", // px-6
    desktop: "3rem", // px-12
  },
} as const;

export const SHADOW = {
  card: "0 4px 24px rgba(0,0,0,0.25)",
  cta: "0 25px 50px -12px rgba(0,0,0,0.4)",
} as const;

/** Durations in seconds (Framer Motion's native unit). */
export const ANIMATION = {
  durationFast: 0.3, // hover states, button transitions
  durationBase: 0.6, // standard fade-up reveals
  durationSlow: 0.9, // hero entrance
  easeOut: [0.16, 1, 0.3, 1] as const, // the cubic-bezier used across FadeIn, Hero, MobileMenu
  staggerBase: 0.08, // seconds between staggered siblings
} as const;

export const TYPOGRAPHY = {
  fontDisplay: "font-serif", // headings — currently Tailwind's default serif stack
  fontBody: "font-sans",
  tracking: {
    tight: "0.03em",
    normal: "0.08em",
    wide: "0.14em",
    widest: "0.28em",
  },
} as const;