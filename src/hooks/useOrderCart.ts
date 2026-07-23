// src/hooks/useOrderCart.ts
//
// Local, in-memory cart state for the new Supabase-backed ordering page
// only — deliberately separate from lib/cart/CartStore.ts and
// hooks/useCart.ts, which back the existing WhatsApp-handoff cart and are
// untouched by this feature. Not persisted (no localStorage, no `carts`
// table row) — Cart/CartItem in types/cart.ts model a future persisted,
// multi-device cart; this is simpler, ephemeral, pre-checkout state,
// cleared once an order is placed.
import { useMemo, useState } from "react";
import type { MenuItem } from "../types/menu-item";

export interface OrderCartLine {
  /** `${menuItemId}::${variationLabel ?? "base"}` — same keying convention as the existing cart's CartLine.id in types/cart.ts. */
  id: string;
  menuItem: MenuItem;
  variationLabel?: string;
  unitPrice: number;
  quantity: number;
  specialInstructions?: string;
}

export interface UseOrderCartResult {
  lines: OrderCartLine[];
  subtotal: number;
  itemCount: number;
  addItem(menuItem: MenuItem, variationLabel?: string, quantity?: number): void;
  updateQuantity(lineId: string, quantity: number): void;
  removeItem(lineId: string): void;
  clear(): void;
}

export function useOrderCart(): UseOrderCartResult {
  const [lines, setLines] = useState<OrderCartLine[]>([]);

  function addItem(menuItem: MenuItem, variationLabel?: string, quantity = 1): void {
    const variation = variationLabel ? menuItem.variations.find((v) => v.label === variationLabel) : undefined;
    const unitPrice = variation?.price ?? menuItem.basePrice;
    const lineId = `${menuItem.id}::${variationLabel ?? "base"}`;

    setLines((prev) => {
      const existing = prev.find((line) => line.id === lineId);
      if (existing) {
        return prev.map((line) =>
          line.id === lineId ? { ...line, quantity: line.quantity + quantity } : line
        );
      }
      return [...prev, { id: lineId, menuItem, variationLabel, unitPrice, quantity }];
    });
  }

  function updateQuantity(lineId: string, quantity: number): void {
    if (quantity <= 0) {
      removeItem(lineId);
      return;
    }
    setLines((prev) => prev.map((line) => (line.id === lineId ? { ...line, quantity } : line)));
  }

  function removeItem(lineId: string): void {
    setLines((prev) => prev.filter((line) => line.id !== lineId));
  }

  function clear(): void {
    setLines([]);
  }

  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0), [lines]);
  const itemCount = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);

  return { lines, subtotal, itemCount, addItem, updateQuantity, removeItem, clear };
}
