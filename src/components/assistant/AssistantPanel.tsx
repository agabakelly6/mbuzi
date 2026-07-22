// src/components/assistant/AssistantPanel.tsx
//
// Glassmorphism corner popover — combines the site's two documented
// "premium glass" recipes (bg-[#14100D]/90 backdrop-blur-md from the
// scrolled navbar, border border-white/10 bg-white/[0.03] from
// TestimonialCard/FoodCard's dark variant) rather than inventing a new
// surface treatment. Focus-trap/Escape/role="dialog" recipe matches
// MobileMenu.tsx; this is a corner popover (scale+fade) rather than a
// full edge-slide drawer since it's a small chat panel, not primary nav.
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Send } from "lucide-react";
import { useAssistant } from "../../context/AssistantContext";
import { MessageBubble } from "./MessageBubble";
import { ConversationStarters } from "./ConversationStarters";
import { ACTIVE_LOCATIONS } from "../../data/locations";
import { getMenuItemById } from "../../data/assistant";
import { buildAssistantWhatsAppMessage } from "../../lib/assistant/assistantMessage";
import { getWhatsAppUrl } from "../../config/site";
import { getButtonClasses } from "../../lib/button-variants";
import { GREETING, INPUT_PLACEHOLDER, PANEL_TITLE, WHATSAPP_HANDOFF_LABEL } from "../../content/assistant";

export function AssistantPanel() {
  const { messages, isOpen, isTyping, lastQuestion, lastSummary, lastRecommendedItemId, closePanel, sendQuestion } =
    useAssistant();
  const [draft, setDraft] = useState("");
  const [branchId, setBranchId] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
  }, [messages.length, isTyping, prefersReducedMotion]);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePanel();
        return;
      }
      if (event.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), select, input, textarea"
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closePanel]);

  function handleSend() {
    if (!draft.trim()) return;
    sendQuestion(draft);
    setDraft("");
  }

  function handleWhatsAppHandoff() {
    const branch = ACTIVE_LOCATIONS.find((location) => location.id === branchId);
    const recommendedItem = lastRecommendedItemId ? getMenuItemById(lastRecommendedItemId) : undefined;
    const message = buildAssistantWhatsAppMessage({
      question: lastQuestion || "General inquiry",
      summary: lastSummary,
      branch,
      recommendedItem,
    });
    window.open(getWhatsAppUrl(message, branch?.whatsapp), "_blank", "noopener,noreferrer");
  }

  const transition = prefersReducedMotion ? { duration: 0.01 } : { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id={dialogId}
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="YPA Assistant"
          className="fixed bottom-24 right-6 z-50 flex h-[70vh] max-h-[560px] w-[min(24rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#14100D]/95 shadow-2xl backdrop-blur-md"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={transition}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <p className="font-serif text-base font-semibold text-white">{PANEL_TITLE}</p>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close assistant"
              onClick={closePanel}
              className="text-white/50 transition-colors duration-300 hover:text-[#C89A4B]"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-[13px] leading-relaxed text-white/90">
                {GREETING}
              </div>
            </div>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-[13px] text-white/50">
                  Typing…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="space-y-3 border-t border-white/10 px-5 py-4">
            <ConversationStarters />

            <select
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              className="w-full rounded-lg border border-white/15 bg-transparent px-3 py-2 text-[12px] text-white"
              aria-label="Select a branch for WhatsApp handoff (optional)"
            >
              <option value="">No branch selected</option>
              {ACTIVE_LOCATIONS.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.city}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSend()}
                placeholder={INPUT_PLACEHOLDER}
                className="flex-1 rounded-full border border-white/15 bg-transparent px-4 py-2.5 text-[13px] text-white placeholder:text-white/35 focus:border-[#C89A4B] focus:outline-none"
              />
              <button
                type="button"
                aria-label="Send"
                onClick={handleSend}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C89A4B] text-[#14100D] transition-transform duration-300 hover:scale-105"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleWhatsAppHandoff}
              className={getButtonClasses({ variant: "outline", size: "sm", className: "w-full" })}
            >
              {WHATSAPP_HANDOFF_LABEL}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
