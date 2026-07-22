// src/hooks/useCart.ts
//
// The one public entry point every island uses to read/mutate the cart —
// see lib/cart/CartStore.ts for why this wraps a module-level external
// store (useSyncExternalStore) instead of React Context. Derived values
// (itemCount/subtotal/deliveryFee/total/order details) are computed here
// on every read rather than stored in CartState, so they can never drift
// out of sync with the lines/branch/order-type that produced them.
import { useSyncExternalStore } from "react";
import { LOCATIONS } from "../data/locations";
import * as CartStore from "../lib/cart/CartStore";
import {
  buildOrderDetails,
  buildOrderWhatsAppMessage,
  computeCartSubtotal,
  computeDeliveryFee,
} from "../lib/cart/cartUtils";
import type { MenuItem } from "../data/menu";

export function useCart() {
  const state = useSyncExternalStore(
    CartStore.subscribe,
    CartStore.getSnapshot,
    CartStore.getServerSnapshot
  );

  const branch = LOCATIONS.find((location) => location.id === state.branchId);
  const itemCount = state.lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = computeCartSubtotal(state.lines);
  const deliveryFee = computeDeliveryFee(state.orderType, state.deliveryZoneId, branch);
  const total = subtotal + deliveryFee;

  return {
    lines: state.lines,
    orderType: state.orderType,
    branchId: state.branchId,
    branch,
    deliveryZoneId: state.deliveryZoneId,
    customer: state.customer,
    isDrawerOpen: state.isDrawerOpen,

    itemCount,
    subtotal,
    deliveryFee,
    total,

    addItem: (item: MenuItem, opts?: Parameters<typeof CartStore.addItem>[1]) =>
      CartStore.addItem(item, opts),
    updateQuantity: CartStore.updateQuantity,
    removeItem: CartStore.removeItem,
    updateLineInstructions: CartStore.updateLineInstructions,
    setOrderType: CartStore.setOrderType,
    setBranch: CartStore.setBranch,
    setDeliveryZone: CartStore.setDeliveryZone,
    updateCustomer: CartStore.updateCustomer,
    openDrawer: CartStore.openDrawer,
    closeDrawer: CartStore.closeDrawer,
    toggleDrawer: CartStore.toggleDrawer,
    clearCart: CartStore.clearCart,

    buildOrderDetails: () => buildOrderDetails(state, branch),
    buildWhatsAppMessage: () => buildOrderWhatsAppMessage(buildOrderDetails(state, branch)),
  };
}

/** Lightweight variant for a single FoodCard's controls — avoids re-deriving cart-wide totals for a component that only needs its own line's quantity. */
export function useCartLine(menuItemId: string, variationLabel?: string) {
  const state = useSyncExternalStore(
    CartStore.subscribe,
    CartStore.getSnapshot,
    CartStore.getServerSnapshot
  );
  const id = `${menuItemId}::${variationLabel ?? "base"}`;
  const line = state.lines.find((l) => l.id === id);

  return {
    line,
    quantity: line?.quantity ?? 0,
    addItem: (item: MenuItem, opts?: Parameters<typeof CartStore.addItem>[1]) =>
      CartStore.addItem(item, opts),
    updateQuantity: (quantity: number) => line && CartStore.updateQuantity(line.id, quantity),
    removeItem: () => line && CartStore.removeItem(line.id),
  };
}
