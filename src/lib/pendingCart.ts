// src/lib/pendingCart.ts
//
// Lightweight "intent to order" list for the public /menu page — just
// item names + quantities, no branch or price yet (the static /menu
// catalog has no branch context, so real DB items can't be resolved
// until a branch is picked). Lets a customer add several dishes while
// continuing to browse the whole menu; PendingCartFAB is what finally
// asks which branch and hands the list off to /order. Deliberately a
// separate store from lib/cart/CartStore.ts (the old, now-unused
// WhatsApp cart's own state) — not reused, to avoid dragging in that
// system's WhatsApp-message-building logic.
export interface PendingCartItem {
  name: string;
  quantity: number;
}

const STORAGE_KEY = "ypa-pending-cart";

let items: PendingCartItem[] = [];
let loaded = false;
const subscribers = new Set<() => void>();

function notify(): void {
  subscribers.forEach((callback) => callback());
}

function persist(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Private-browsing/quota-exceeded — non-fatal, the list just won't survive a reload.
  }
}

function ensureLoaded(): void {
  if (loaded || typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    items = raw ? JSON.parse(raw) : [];
  } catch {
    items = [];
  }
  loaded = true;
}

export function addItem(name: string, quantity = 1): void {
  ensureLoaded();
  const existing = items.find((item) => item.name === name);
  items = existing
    ? items.map((item) => (item.name === name ? { ...item, quantity: item.quantity + quantity } : item))
    : [...items, { name, quantity }];
  persist();
  notify();
}

export function updateQuantity(name: string, quantity: number): void {
  ensureLoaded();
  items =
    quantity <= 0
      ? items.filter((item) => item.name !== name)
      : items.map((item) => (item.name === name ? { ...item, quantity } : item));
  persist();
  notify();
}

export function removeItem(name: string): void {
  updateQuantity(name, 0);
}

export function clear(): void {
  items = [];
  persist();
  notify();
}

export function subscribe(callback: () => void): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function getSnapshot(): PendingCartItem[] {
  ensureLoaded();
  return items;
}

// A stable reference, not a fresh [] each call — useSyncExternalStore
// requires getServerSnapshot to return referentially equal results across
// calls, or it (and any consumer effect keyed on the returned value)
// re-runs on every render. Same fix CartStore.ts's own getServerSnapshot
// already uses for this exact reason.
const EMPTY_SNAPSHOT: PendingCartItem[] = [];

export function getServerSnapshot(): PendingCartItem[] {
  return EMPTY_SNAPSHOT;
}
