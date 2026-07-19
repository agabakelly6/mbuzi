// src/components/ui/Logo.tsx
import { SITE } from "../../config/site";

interface LogoProps {
  /**
   * "light"  — for use on the transparent/dark hero and the mobile drawer.
   * "dark"   — reserved for any future light-surface placement (e.g. footer
   *            on a cream background) so the mark never needs rebuilding.
   */
  tone?: "light" | "dark";
  className?: string;
}

/**
 * Shared brand mark: a circular monogram (evoking horns curling around an
 * ember) paired with a tracked-out serif wordmark. Used identically in the
 * desktop bar and the mobile drawer so the two never drift out of sync.
 */
export function Logo({ tone = "light", className = "" }: LogoProps) {
  const ink = tone === "light" ? "text-white" : "text-[#14100D]";

  return (
    <a
      href="/"
      aria-label={`${SITE.name} — home`}
      className={`group flex items-center gap-3 ${className}`}
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#C89A4B]/70 transition-colors duration-300 group-hover:border-[#C89A4B]">
        <svg
          viewBox="0 0 40 40"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <path
            d="M8 28c2-10 8-16 12-16s10 6 12 16"
            fill="none"
            stroke="#C89A4B"
            strokeWidth="1.25"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
        <span
          className={`font-serif text-[12px] font-semibold tracking-[0.03em] ${ink}`}
        >
          YPA
        </span>
      </span>

      <span
        className={`font-serif text-[15px] font-semibold uppercase tracking-[0.16em] ${ink} transition-opacity duration-300 group-hover:opacity-80`}
      >
        {SITE.name.replace(`${SITE.shortName} `, "")}
      </span>
    </a>
  );
}
