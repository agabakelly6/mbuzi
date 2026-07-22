// src/components/cart/CartFAB.tsx
//
// Renders nothing until the cart has an item — per the confirmed UX
// decision, this FAB should be invisible on a fresh visit or right after
// checkout, not just empty-looking. Sits directly above the Assistant FAB
// (see AssistantFAB.tsx's bottom offset) in the shared bottom-right stack.
import { ShoppingBag } from "lucide-react";
import { useCart } from "../../hooks/useCart";
import { useOpenOverlay } from "../../hooks/useOpenOverlay";

// Must match the id OrderDrawer.tsx puts on its dialog element — both
// components are app-wide singletons (one CartWidget, mounted once in
// Layout.astro), so a fixed id is safe here, unlike a component that
// could render more than once per page.
export const CART_DRAWER_DIALOG_ID = "cart-order-drawer";

export function CartFAB() {
  const { itemCount, isDrawerOpen, toggleDrawer } = useCart();
  const openOverlay = useOpenOverlay();

  if (itemCount === 0) return null;
  // The Assistant panel is a full-height overlay in this same corner —
  // hide behind it rather than sit invisibly (but still "present") under
  // its higher z-index. See lib/overlayCoordination.ts.
  if (openOverlay === "assistant") return null;

  return (
    <button
      type="button"
      onClick={toggleDrawer}
      aria-expanded={isDrawerOpen}
      aria-controls={CART_DRAWER_DIALOG_ID}
      aria-label={`Open your order, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
      className="fixed bottom-[6.5rem] right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#C89A4B] text-[#14100D] shadow-2xl transition-transform duration-300 hover:scale-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89A4B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100D]"
    >
      <ShoppingBag className="h-6 w-6" aria-hidden="true" />
      <span
        aria-live="polite"
        className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#14100D] text-[11px] font-bold text-white"
      >
        {itemCount}
      </span>
    </button>
  );
}
