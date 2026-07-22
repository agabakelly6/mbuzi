// src/lib/overlayCoordination.ts
//
// CartWidget and AssistantWidget are two independent React roots (see
// lib/cart/CartStore.ts for why) that happen to share the same
// bottom-right corner. OrderDrawer (inset-y-0 right-0) and AssistantPanel
// (bottom-24 right-6, up to 656px tall) are both large same-corner
// overlays with a higher z-index than either system's small persistent
// FAB — when either is open, it visually covers the OTHER system's FAB
// entirely, leaving it present in the DOM but invisible and unreachable
// until the covering overlay closes. This tiny store just tracks which
// one is currently open so each FAB can hide itself while the other
// system's overlay is up, rather than sitting invisibly underneath it.
export type OverlayId = "cart" | "assistant" | null;

let openOverlay: OverlayId = null;
const subscribers = new Set<() => void>();

function notify(): void {
  subscribers.forEach((callback) => callback());
}

export function setOpenOverlay(id: OverlayId): void {
  openOverlay = id;
  notify();
}

/** Clears the tracked overlay only if it's still `id` — avoids one overlay's close wiping out a different overlay that opened in the meantime. */
export function clearOverlayIfCurrent(id: OverlayId): void {
  if (openOverlay === id) {
    openOverlay = null;
    notify();
  }
}

export function subscribe(callback: () => void): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function getSnapshot(): OverlayId {
  return openOverlay;
}

export function getServerSnapshot(): OverlayId {
  return null;
}
