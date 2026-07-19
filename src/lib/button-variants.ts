// src/lib/button-variants.ts
//
// Plain TypeScript, no framework coupling — this is what makes it usable
// from both Button.astro (static) and any React component that needs the
// same visual style wrapped in motion.* (e.g. HeroButtons.tsx). Astro
// components can't be imported into .tsx files, so the class-name logic,
// not the component itself, is the actual shared unit here.

export type ButtonVariant = "solid" | "outline";
export type ButtonSize = "sm" | "md";
/**
 * The surface a button sits on — NOT the button's own color.
 * "dark"  (default): charcoal/hero/night sections → white outline.
 * "light": cream/white sections → charcoal outline.
 * Only affects `outline`; `solid` is gold-on-charcoal regardless of tone,
 * since gold reads fine against both.
 */
export type ButtonTone = "dark" | "light";

interface ButtonClassOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: ButtonTone;
  /** Extra classes appended after the variant/size classes (layout utilities like w-full, not overrides of them — see the Tailwind specificity note in WhatsAppButton.tsx). */
  className?: string;
}

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase tracking-[0.1em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89A4B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100D]";

const VARIANT_CLASSES: Record<ButtonVariant, Record<ButtonTone, string>> = {
  solid: {
    dark: "bg-[#C89A4B] text-[#14100D] hover:bg-[#E3BD72] hover:scale-[1.03]",
    light: "bg-[#C89A4B] text-[#14100D] hover:bg-[#E3BD72] hover:scale-[1.03]",
  },
  outline: {
    dark: "border border-white/30 text-white hover:border-[#C89A4B] hover:text-[#C89A4B]",
    light:
      "border border-[#14100D]/25 text-[#14100D] hover:border-[#C89A4B] hover:text-[#C89A4B]",
  },
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-5 py-2.5 text-[12px]",
  md: "px-8 py-3.5 text-[13px]",
};

export function getButtonClasses({
  variant = "solid",
  size = "md",
  tone = "dark",
  className = "",
}: ButtonClassOptions = {}): string {
  return [BASE, VARIANT_CLASSES[variant][tone], SIZE_CLASSES[size], className]
    .filter(Boolean)
    .join(" ");
}
