// src/hooks/useOpenOverlay.ts
//
// Reads lib/overlayCoordination.ts's cross-island "which large overlay is
// currently open" signal via useSyncExternalStore — the same
// cross-island-safe mechanism useCart.ts uses, needed here because
// CartFAB/AssistantFAB and OrderDrawer/AssistantPanel are split across
// two independently-mounted React roots (CartWidget, AssistantWidget).
import { useSyncExternalStore } from "react";
import { getSnapshot, getServerSnapshot, subscribe, type OverlayId } from "../lib/overlayCoordination";

export function useOpenOverlay(): OverlayId {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
