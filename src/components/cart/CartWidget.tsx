// src/components/cart/CartWidget.tsx
//
// Mounted once via client:load in Layout.astro. Both children read the
// same CartStore singleton through useCart()/useCartLine() — no wrapping
// context is needed even within this one island, since the store is
// already the single source of truth every consumer subscribes to.
import { CartFAB } from "./CartFAB";
import { OrderDrawer } from "./OrderDrawer";

export function CartWidget() {
  return (
    <>
      <CartFAB />
      <OrderDrawer />
    </>
  );
}
