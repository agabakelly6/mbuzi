// src/hooks/usePendingCart.ts
import { useSyncExternalStore } from "react";
import * as pendingCart from "../lib/pendingCart";

export function usePendingCart() {
  const items = useSyncExternalStore(pendingCart.subscribe, pendingCart.getSnapshot, pendingCart.getServerSnapshot);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    itemCount,
    addItem: pendingCart.addItem,
    updateQuantity: pendingCart.updateQuantity,
    removeItem: pendingCart.removeItem,
    clear: pendingCart.clear,
  };
}
