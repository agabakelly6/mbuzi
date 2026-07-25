// src/components/ordering/OrderNowButton.tsx
//
// Per-dish "Order Now" on the public /menu page — takes the customer
// straight into the real (database-backed) ordering flow with this dish
// already in the cart, rather than a WhatsApp free-text message (the old
// behavior, retired). /menu is static with no branch context, so the
// first time this is pressed it asks which branch, remembers the answer
// (localStorage) for next time, then hands off to /order via a query
// string — OrderingApp resolves the branch by slug and auto-adds the
// matching live menu item once its real (branch-scoped, DB-backed) menu
// has loaded. The static catalog here and the live one at /order are
// deliberately separate data sources (see data/menu.ts's own header
// comment) — matching by exact name is what bridges them, since both
// were seeded from the same real 47-item menu.
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { ACTIVE_LOCATIONS } from "../../data/locations";
import { getButtonClasses } from "../../lib/button-variants";

const PREFERRED_BRANCH_KEY = "ypa-preferred-branch-slug";

interface OrderNowButtonProps {
  itemName: string;
}

export function OrderNowButton({ itemName }: OrderNowButtonProps) {
  const [showPicker, setShowPicker] = useState(false);

  function goToOrder(slug: string) {
    window.localStorage.setItem(PREFERRED_BRANCH_KEY, slug);
    window.location.href = `/order?branch=${slug}&addItem=${encodeURIComponent(itemName)}`;
  }

  function handleClick() {
    const remembered = window.localStorage.getItem(PREFERRED_BRANCH_KEY);
    if (remembered && ACTIVE_LOCATIONS.some((loc) => loc.id === remembered)) {
      goToOrder(remembered);
      return;
    }
    setShowPicker(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={getButtonClasses({ variant: "solid", size: "sm", className: "mt-4 w-full" })}
      >
        <ShoppingBag size={14} aria-hidden="true" />
        Order Now
      </button>

      {showPicker && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choose a branch"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowPicker(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="font-serif text-lg font-semibold text-[#14100D]">Order From Which Branch?</h3>
            <p className="mt-1 text-sm text-[#14100D]/60">We'll remember this for next time.</p>
            <div className="mt-4 flex flex-col gap-2">
              {ACTIVE_LOCATIONS.map((location) => (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => goToOrder(location.id)}
                  className="rounded-xl border border-[#14100D]/15 px-4 py-3 text-left text-sm font-semibold text-[#14100D] transition-colors hover:border-[#C89A4B] hover:bg-[#C89A4B]/5"
                >
                  {location.city}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="mt-4 text-xs font-semibold text-[#14100D]/50 underline underline-offset-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
