// src/components/assistant/AssistantFAB.tsx
//
// Always visible (unlike CartFAB, which hides when empty) — bottom-right,
// directly below the Cart FAB in the shared stack (see CartFAB.tsx's
// bottom-[6.5rem] offset; this sits at the base bottom-6 position).
import { Bot, X } from "lucide-react";
import { useAssistant } from "../../context/AssistantContext";

export function AssistantFAB() {
  const { isOpen, togglePanel } = useAssistant();

  return (
    <button
      type="button"
      onClick={togglePanel}
      aria-expanded={isOpen}
      aria-label={isOpen ? "Close assistant" : "Chat with the YPA assistant"}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-[#14100D]/90 text-white shadow-2xl backdrop-blur-md transition-colors duration-300 hover:border-[#C89A4B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89A4B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100D]"
    >
      {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Bot className="h-6 w-6" aria-hidden="true" />}
    </button>
  );
}
