// src/components/ordering/PendingCartFAB.tsx
//
// Floating cart button for the public /menu page — shows once at least
// one dish has been added via an OrderNowButton. Opening it is the
// moment a branch gets asked for (the static /menu catalog has no
// branch context; /order's live one does) and the accumulated items get
// handed off there via a query string, resolved and auto-added once
// /order's real per-branch menu loads (see OrderingApp.tsx).
//
// Positioned at bottom-[6.5rem] (stacked above AssistantFAB's own
// bottom-6 right-6 slot) — the same corner-sharing arrangement the old
// CartFAB used, so the two floating buttons don't overlap/intercept
// each other's clicks.
import { useState } from "react";
import { ShoppingBag, X, Minus, Plus, Trash2 } from "lucide-react";
import { usePendingCart } from "../../hooks/usePendingCart";
import { ACTIVE_LOCATIONS } from "../../data/locations";
import { getButtonClasses } from "../../lib/button-variants";
import { FORM_INPUT_CLASSES, FORM_LABEL_CLASSES } from "../../lib/constants";

const PREFERRED_BRANCH_KEY = "ypa-preferred-branch-slug";

export function PendingCartFAB() {
  const { items, itemCount, updateQuantity, removeItem, clear } = usePendingCart();
  const [isOpen, setIsOpen] = useState(false);
  const [branchSlug, setBranchSlug] = useState(
    () => (typeof window !== "undefined" && window.localStorage.getItem(PREFERRED_BRANCH_KEY)) || ""
  );

  if (itemCount === 0) return null;

  function handleContinue() {
    if (!branchSlug) return;
    window.localStorage.setItem(PREFERRED_BRANCH_KEY, branchSlug);
    const payload = encodeURIComponent(JSON.stringify(items));
    window.location.href = `/order?branch=${branchSlug}&addItems=${payload}`;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="View your order"
        className="fixed bottom-[6.5rem] right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#C89A4B] text-[#14100D] shadow-[0_10px_30px_-8px_rgba(200,154,75,0.6)] transition-transform hover:scale-105"
      >
        <ShoppingBag size={20} />
        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#14100D] text-[11px] font-bold text-white">
          {itemCount}
        </span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Your order"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-6 sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-[#14100D]">Your Order</h3>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Close" className="text-[#14100D]/40 hover:text-[#14100D]">
                <X size={18} />
              </button>
            </div>

            <ul className="mt-4 flex flex-col gap-3">
              {items.map((item) => (
                <li key={item.name} className="flex items-center justify-between gap-3 border-b border-[#14100D]/10 pb-3">
                  <span className="text-sm font-medium text-[#14100D]">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.name, item.quantity - 1)}
                      aria-label={`Decrease quantity of ${item.name}`}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-[#14100D]/20 text-[#14100D] hover:border-[#C89A4B]"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-5 text-center text-sm text-[#14100D]">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.name, item.quantity + 1)}
                      aria-label={`Increase quantity of ${item.name}`}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-[#14100D]/20 text-[#14100D] hover:border-[#C89A4B]"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.name)}
                      aria-label={`Remove ${item.name}`}
                      className="ml-1 text-[#14100D]/30 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-col gap-1.5">
              <label htmlFor="pending-cart-branch" className={FORM_LABEL_CLASSES}>
                Which Branch?
              </label>
              <select
                id="pending-cart-branch"
                value={branchSlug}
                onChange={(event) => setBranchSlug(event.target.value)}
                className={FORM_INPUT_CLASSES}
              >
                <option value="">Choose a branch…</option>
                {ACTIVE_LOCATIONS.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.city}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={clear}
                className={getButtonClasses({ variant: "outline", tone: "light", size: "md" })}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!branchSlug}
                className={getButtonClasses({ variant: "solid", size: "md", className: "flex-1 disabled:opacity-60" })}
              >
                Continue To Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
