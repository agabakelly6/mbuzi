// src/components/cart/OrderControls.tsx
//
// Embedded inside FoodCard when `orderable` — never rendered on the
// homepage's read-only preview cards. Reads/writes the cart exclusively
// through useCartLine/useCart (hooks/useCart.ts), so this component has
// no local notion of "the cart" beyond its own item+variation's line.
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { MenuItem } from "../../data/menu";
import { useCartLine } from "../../hooks/useCart";
import { formatPrice, parsePrice } from "../../lib/cart/cartUtils";
import { getButtonClasses } from "../../lib/button-variants";

interface OrderControlsProps {
  item: MenuItem;
  imageSrc?: string;
  tone?: "light" | "dark";
}

export function OrderControls({ item, imageSrc, tone = "light" }: OrderControlsProps) {
  const hasVariations = Boolean(item.variations && item.variations.length > 0);
  const [variationLabel, setVariationLabel] = useState<string | undefined>(
    hasVariations ? item.variations![0].label : undefined
  );
  const { quantity, addItem, updateQuantity } = useCartLine(item.id, variationLabel);

  const isDark = tone === "dark";
  const mutedText = isDark ? "text-white/65" : "text-[#14100D]/65";
  const borderColor = isDark ? "border-white/15" : "border-[#14100D]/10";

  const selectedVariation = hasVariations
    ? item.variations!.find((v) => v.label === variationLabel)
    : undefined;
  const unitPrice = parsePrice(selectedVariation?.price ?? item.price);

  const stepperButtonClasses = `flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-300 ${
    isDark
      ? "border-white/25 text-white hover:border-[#C89A4B]"
      : "border-[#14100D]/20 text-[#14100D] hover:border-[#C89A4B]"
  }`;

  return (
    <div className={`mt-4 space-y-3 border-t pt-4 ${borderColor}`}>
      {hasVariations && (
        <select
          value={variationLabel}
          onChange={(event) => setVariationLabel(event.target.value)}
          className={`w-full rounded-lg border bg-transparent px-3 py-2 text-[13px] ${
            isDark ? "border-white/15 text-white" : "border-[#14100D]/15 text-[#14100D]"
          }`}
          aria-label={`Choose a portion for ${item.name}`}
        >
          {item.variations!.map((variation) => (
            <option key={variation.label} value={variation.label} className="text-[#14100D]">
              {variation.label} — {variation.price}
            </option>
          ))}
        </select>
      )}

      {quantity > 0 ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={`Decrease quantity of ${item.name}`}
              onClick={() => updateQuantity(quantity - 1)}
              className={stepperButtonClasses}
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className={`w-6 text-center text-sm font-semibold ${isDark ? "text-white" : "text-[#14100D]"}`}>
              {quantity}
            </span>
            <button
              type="button"
              aria-label={`Increase quantity of ${item.name}`}
              onClick={() => updateQuantity(quantity + 1)}
              className={stepperButtonClasses}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <span className={`text-[12px] font-semibold uppercase tracking-[0.08em] ${mutedText}`}>
            {formatPrice(unitPrice * quantity)} in order
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() =>
            addItem(item, { variationLabel, quantity: 1, imageSrc })
          }
          className={getButtonClasses({ variant: "solid", size: "sm", className: "w-full" })}
        >
          Add to Order
        </button>
      )}
    </div>
  );
}
