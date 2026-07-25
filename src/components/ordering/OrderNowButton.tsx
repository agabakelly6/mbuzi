// src/components/ordering/OrderNowButton.tsx
//
// Per-dish "Order Now" on the public /menu page. Just adds the dish to
// the page-level pending cart (lib/pendingCart.ts) and shows a brief
// confirmation — no navigation, no branch prompt yet, so the customer
// can keep browsing and add more dishes. PendingCartFAB (mounted once
// per page) is what asks which branch and hands the whole list off to
// /order, once they're actually done ordering.
import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { usePendingCart } from "../../hooks/usePendingCart";
import { getButtonClasses } from "../../lib/button-variants";

interface OrderNowButtonProps {
  itemName: string;
}

export function OrderNowButton({ itemName }: OrderNowButtonProps) {
  const { addItem } = usePendingCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleClick() {
    addItem(itemName);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={getButtonClasses({ variant: "solid", size: "sm", className: "mt-4 w-full" })}
    >
      {justAdded ? (
        <>
          <Check size={14} aria-hidden="true" />
          Added To Cart
        </>
      ) : (
        <>
          <ShoppingBag size={14} aria-hidden="true" />
          Order Now
        </>
      )}
    </button>
  );
}
