// src/components/ui/WhatsAppButton.tsx
import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  /** Full wa.me link (or any href) — sourced from data/navigation.ts's CtaLink. */
  href: string;
  /** Visible label. Omit for the icon-only variant. */
  label?: string;
  /** "outline" — nav pill on a dark bar. "solid" — WhatsApp-green filled button. "icon" — round icon-only, e.g. a floating action button. */
  variant?: "outline" | "solid" | "icon";
  className?: string;
}

/**
 * The single place that renders WhatsApp CTAs across the site — the
 * navbar, mobile drawer, footer, or a floating action button should all
 * import this rather than hand-rolling their own <a> + icon markup, so
 * the link behavior (target, rel, icon) never drifts between instances.
 */
export function WhatsAppButton({
  href,
  label = "WhatsApp",
  variant = "outline",
  className = "",
}: WhatsAppButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase tracking-[0.08em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89A4B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100D]";

  const variantStyles: Record<NonNullable<WhatsAppButtonProps["variant"]>, string> = {
    outline:
      "border border-white/30 px-5 py-2.5 text-[12px] text-white hover:border-[#C89A4B] hover:text-[#C89A4B]",
    solid:
      "bg-[#25D366] px-6 py-2.5 text-[12px] text-white hover:scale-[1.03] hover:bg-[#1DA851]",
    icon: "h-11 w-11 border border-white/25 text-white hover:border-[#C89A4B]",
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={variant === "icon" ? "Chat with us on WhatsApp" : undefined}
      className={`${base} ${variantStyles[variant]} ${className}`}
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      {variant !== "icon" && label}
    </a>
  );
}
