// src/components/cards/FoodCard.tsx
import type { MenuItem } from "../../data/menu";

interface FoodCardProps {
  item: MenuItem;
  /**
   * "light" (default) = card sits on a white/cream section, dark text —
   * this is the exact original (pre-extension) look, unchanged.
   * "dark" = card sits on a charcoal section (see MenuGrid.astro's dark
   * category rows), light text and a subtle bordered surface.
   */
  tone?: "light" | "dark";
  /**
   * Whether to show the "View on Menu" link. Defaults to true for the
   * homepage preview (where it sends people to /menu). MenuGrid sets
   * this false on the menu page itself, where linking to /menu from
   * a card already on /menu is circular.
   */
  showCta?: boolean;
}

/**
 * Presentation-only — no internal state or animation. Hover treatment is
 * pure CSS, and entrance animation is applied by the caller via FadeIn,
 * so this ships zero client JS on its own.
 */
export function FoodCard({ item, tone = "light", showCta = true }: FoodCardProps) {
  const isDark = tone === "dark";

  return (
    <article
      className={`group overflow-hidden rounded-2xl ${
        isDark ? "border border-white/10 bg-white/[0.03] p-3" : ""
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14100D]/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>

      <div className={isDark ? "px-1 pb-1 pt-5" : "pt-5"}>
        <div className="flex items-start justify-between gap-4">
          <h3
            className={`font-serif text-lg font-semibold ${
              isDark ? "text-white" : "text-[#14100D]"
            }`}
          >
            {item.name}
          </h3>
          <span className="whitespace-nowrap text-sm font-semibold text-[#C89A4B]">
            {item.price}
          </span>
        </div>
        <p
          className={`mt-2 text-sm leading-relaxed ${
            isDark ? "text-white/65" : "text-[#14100D]/65"
          }`}
        >
          {item.description}
        </p>
        {showCta && (
          <a
            href="/menu"
            className={`mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors duration-300 hover:text-[#C89A4B] ${
              isDark ? "text-white" : "text-[#14100D]"
            }`}
          >
            View on Menu
            <span aria-hidden="true">&rarr;</span>
          </a>
        )}
      </div>
    </article>
  );
}
