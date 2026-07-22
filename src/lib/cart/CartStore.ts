// src/lib/cart/CartStore.ts
//
// Cart state as a hand-rolled external store, NOT a React Context. Why:
// the Menu page renders ~44 independent FoodCard islands (one per dish,
// each hydrated separately via client:visible), and the floating cart
// FAB/drawer is a further, separate island mounted once in Layout.astro.
// Astro islands are independently hydrated component trees — a
// createContext()/<Provider> wrapping one island is invisible to a
// sibling island, so React Context cannot make ~45 separate islands
// share one live cart. A module-level singleton can: ES modules are
// evaluated once and shared by reference across every import, so every
// island that imports this file reads/writes the exact same object.
// src/hooks/useCart.ts reads it via React 19's built-in
// useSyncExternalStore (no new dependency — this is core React), which
// is the supported way to subscribe a component to state that lives
// outside React. This file is what "Cart Context"/"Cart Provider" become
// in an islands architecture; there is no JSX <Provider> to render.
import type { MenuItem } from "../../data/menu";
import type { CartLine, CartState, CustomerDetails, OrderType } from "../../types/cart";
import { parsePrice } from "./cartUtils";

const STORAGE_KEY = "ypa-cart-v1";

const EMPTY_CUSTOMER: CustomerDetails = {
  name: "",
  phone: "",
  deliveryAddress: "",
  specialInstructions: "",
};

function createInitialState(): CartState {
  return {
    lines: [],
    orderType: "delivery",
    branchId: "",
    deliveryZoneId: "",
    customer: { ...EMPTY_CUSTOMER },
    isDrawerOpen: false,
  };
}

let state: CartState = createInitialState();
let hydrated = false;
/** Stable reference for getServerSnapshot — useSyncExternalStore requires the same object back on every call, or React re-renders in a loop. */
const SERVER_SNAPSHOT: CartState = createInitialState();
const subscribers = new Set<() => void>();

function notify(): void {
  for (const callback of subscribers) callback();
}

function persist(): void {
  if (typeof window === "undefined") return;
  const { isDrawerOpen: _isDrawerOpen, ...persisted } = state;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch {
    // localStorage can throw in private-browsing/quota-exceeded cases —
    // the cart still works for the current session, it just won't survive
    // a refresh, which is an acceptable degradation rather than a crash.
  }
}

/** Reads localStorage exactly once, on first client-side subscribe — never during SSR/build. */
function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Omit<CartState, "isDrawerOpen">;
    state = { ...state, ...parsed, isDrawerOpen: false };
  } catch {
    // Corrupt/old-shape localStorage data — fall back to the empty cart
    // rather than throwing during hydration.
  }
}

export function subscribe(callback: () => void): () => void {
  hydrate();
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function getSnapshot(): CartState {
  return state;
}

/** Fixed empty cart for Astro's initial server render — avoids a hydration mismatch against localStorage, which doesn't exist server-side. Returns the same object every call, as useSyncExternalStore requires. */
export function getServerSnapshot(): CartState {
  return SERVER_SNAPSHOT;
}

function setState(patch: Partial<CartState>): void {
  state = { ...state, ...patch };
  persist();
  notify();
}

function lineId(menuItemId: string, variationLabel?: string): string {
  return `${menuItemId}::${variationLabel ?? "base"}`;
}

export function addItem(
  item: MenuItem,
  opts?: { variationLabel?: string; quantity?: number; specialInstructions?: string; imageSrc?: string }
): void {
  const quantity = opts?.quantity ?? 1;
  const id = lineId(item.id, opts?.variationLabel);
  const existing = state.lines.find((line) => line.id === id);

  if (existing) {
    updateQuantity(id, existing.quantity + quantity);
    return;
  }

  const variation = opts?.variationLabel
    ? item.variations?.find((v) => v.label === opts.variationLabel)
    : undefined;
  const unitPrice = parsePrice(variation?.price ?? item.price);

  const newLine: CartLine = {
    id,
    menuItemId: item.id,
    name: item.name,
    unitPrice,
    variationLabel: opts?.variationLabel,
    quantity,
    specialInstructions: opts?.specialInstructions,
    imageSrc: opts?.imageSrc,
  };

  setState({ lines: [...state.lines, newLine] });
}

export function updateQuantity(lineId: string, quantity: number): void {
  if (quantity <= 0) {
    removeItem(lineId);
    return;
  }
  setState({
    lines: state.lines.map((line) => (line.id === lineId ? { ...line, quantity } : line)),
  });
}

export function removeItem(lineId: string): void {
  setState({ lines: state.lines.filter((line) => line.id !== lineId) });
}

export function updateLineInstructions(lineId: string, specialInstructions: string): void {
  setState({
    lines: state.lines.map((line) => (line.id === lineId ? { ...line, specialInstructions } : line)),
  });
}

export function setOrderType(orderType: OrderType): void {
  setState({ orderType });
}

export function setBranch(branchId: string): void {
  setState({ branchId, deliveryZoneId: "" });
}

export function setDeliveryZone(deliveryZoneId: string): void {
  setState({ deliveryZoneId });
}

export function updateCustomer(patch: Partial<CustomerDetails>): void {
  setState({ customer: { ...state.customer, ...patch } });
}

export function openDrawer(): void {
  setState({ isDrawerOpen: true });
}

export function closeDrawer(): void {
  setState({ isDrawerOpen: false });
}

export function toggleDrawer(): void {
  setState({ isDrawerOpen: !state.isDrawerOpen });
}

/** Clears everything except the drawer's open/closed state — called after a successful WhatsApp checkout. */
export function clearCart(): void {
  setState({ ...createInitialState(), isDrawerOpen: state.isDrawerOpen });
}
