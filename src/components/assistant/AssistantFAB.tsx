// src/components/assistant/AssistantFAB.tsx
//
// Always visible (unlike CartFAB, which hides when empty) — bottom-right,
// directly below the Cart FAB in the shared stack (see CartFAB.tsx's
// bottom-[6.5rem] offset; this sits at the base bottom-6 position).
import { Bot, X } from "lucide-react";
import { useAssistant } from "../../context/AssistantContext";
import { useOpenOverlay } from "../../hooks/useOpenOverlay";

// Must match the id AssistantPanel.tsx puts on its dialog element — both
// components are app-wide singletons (one AssistantWidget, mounted once
// in Layout.astro), so a fixed id is safe here.
export const ASSISTANT_PANEL_DIALOG_ID = "assistant-panel-dialog";

export function AssistantFAB() {
  const { isOpen, togglePanel } = useAssistant();
  const openOverlay = useOpenOverlay();

  // OrderDrawer is a full-height (inset-y-0) right-edge panel that covers
  // this entire corner, including this FAB's position — hide behind it
  // rather than sit invisibly underneath. See lib/overlayCoordination.ts.
  if (openOverlay === "cart") return null;

  return (
    <button
      type="button"
      onClick={togglePanel}
      aria-expanded={isOpen}
      aria-controls={ASSISTANT_PANEL_DIALOG_ID}
      aria-label={isOpen ? "Close assistant" : "Chat with the YPA assistant"}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-[#14100D]/90 text-white shadow-2xl backdrop-blur-md transition-colors duration-300 hover:border-[#C89A4B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89A4B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100D]"
    >
      {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Bot className="h-6 w-6" aria-hidden="true" />}
    </button>
  );
}
