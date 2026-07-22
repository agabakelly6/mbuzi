// src/components/ui/Logo.tsx
import { SITE } from "../../config/site";
import { LOGO_SRC } from "../../lib/logo";

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
      className={`group flex items-center gap-2.5 ${className}`}
    >
      {LOGO_SRC ? (
        // Real logo file present (src/assets/branding/logo.*) — a compact
        // circular mark, matching the fallback monogram's size/border
        // treatment below so the two are interchangeable at the same
        // navbar footprint. The wordmark still renders alongside it (see
        // below) rather than being replaced by it, so the restaurant name
        // stays legible even though the photo itself also depicts "YPA".
        <img
          src={LOGO_SRC}
          alt={`${SITE.name} logo`}
          className="h-9 w-9 shrink-0 rounded-full border border-[#C89A4B]/70 object-cover transition-colors duration-300 group-hover:border-[#C89A4B]"
        />
      ) : (
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#C89A4B]/70 transition-colors duration-300 group-hover:border-[#C89A4B]">
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
            className={`font-serif text-[11px] font-semibold tracking-[0.03em] ${ink}`}
          >
            YPA
          </span>
        </span>
      )}

      <span
        className={`font-serif text-[14px] font-semibold uppercase tracking-[0.12em] ${ink} transition-opacity duration-300 group-hover:opacity-80`}
      >
        {SITE.name}
      </span>
    </a>
  );
}
