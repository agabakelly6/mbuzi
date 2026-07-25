// src/components/assistant/AssistantPanel.tsx
//
// Full-screen takeover, not a corner popover — the YPA AI Concierge is
// meant to feel like a real, spacious conversation (closer to how
// ChatGPT/Claude's own chat UIs present themselves) rather than a small
// widget bolted onto the corner of the page. Visual language still
// extends the site's existing premium-glass recipe (near-black ground,
// gold accent, backdrop-blur surfaces) rather than inventing a new one —
// just given room to breathe. Every accessibility mechanic from the old
// popover carries over unchanged: role="dialog", manual focus trap,
// Escape-to-close, focus capture/restore, body scroll lock, and overlay
// coordination with the mobile-menu/cart overlays (lib/overlayCoordination.ts).
// Mounted directly via AssistantWidget in Layout.astro (a sibling of the
// header, not nested inside it) — no portal needed, since it's never a
// descendant of anything with backdrop-filter (see NavbarIsland.tsx's
// fix for that exact class of bug).
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Send, Flame } from "lucide-react";
import { useAssistant } from "../../context/AssistantContext";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { Logo } from "../ui/Logo";
import { MessageBubble } from "./MessageBubble";
import { ConversationStarters } from "./ConversationStarters";
import { ACTIVE_LOCATIONS } from "../../data/locations";
import { getMenuItemById } from "../../data/assistant";
import { buildAssistantWhatsAppMessage } from "../../lib/assistant/assistantMessage";
import { getWhatsAppUrl } from "../../config/site";
import { getButtonClasses } from "../../lib/button-variants";
import { GREETING, INPUT_PLACEHOLDER, WHATSAPP_HANDOFF_LABEL } from "../../content/assistant";
import { setOpenOverlay, clearOverlayIfCurrent } from "../../lib/overlayCoordination";
import { ASSISTANT_PANEL_DIALOG_ID } from "./AssistantFAB";

export function AssistantPanel() {
  const { messages, isOpen, isTyping, lastQuestion, lastSummary, lastRecommendedItemId, closePanel, sendQuestion } =
    useAssistant();
  const [draft, setDraft] = useState("");
  const [branchId, setBranchId] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const externalTriggerRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useBodyScrollLock(isOpen);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
  }, [messages.length, messages[messages.length - 1]?.text, prefersReducedMotion]);

  // Captures whatever had focus before opening (the AssistantFAB, in
  // practice) and restores it when the panel closes via any path.
  useEffect(() => {
    if (!isOpen) return;
    externalTriggerRef.current = document.activeElement as HTMLElement | null;
    setOpenOverlay("assistant");
    return () => {
      externalTriggerRef.current?.focus();
      clearOverlayIfCurrent("assistant");
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    // Focus the input, not the close button — with the whole screen now
    // dedicated to typing, that's the more useful place to land.
    inputRef.current?.focus();

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

  const transition = prefersReducedMotion ? { duration: 0.01 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id={ASSISTANT_PANEL_DIALOG_ID}
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="YPA AI Concierge"
          className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#0F0C09]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
        >
          {/* Atmosphere layer — the same radial gold glow recipe CTASection.astro already uses, not a new visual language. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_50%_0%,rgba(200,154,75,0.16),transparent_55%)]"
          />

          <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-5 lg:px-10">
            <div className="flex items-center gap-3">
              <Logo tone="light" />
              <div className="hidden h-6 w-px bg-white/15 sm:block" />
              <p className="hidden font-serif text-sm text-white/50 sm:block">AI Concierge</p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close assistant"
              onClick={closePanel}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/60 transition-colors duration-300 hover:border-[#C89A4B] hover:text-[#C89A4B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89A4B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0C09]"
            >
              ✕
            </button>
          </header>

          <div className="relative z-10 flex-1 overflow-y-auto">
            <div className="mx-auto flex min-h-full w-full max-w-[760px] flex-col justify-end px-6 py-8 lg:px-0">
              {messages.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-6 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#C89A4B]/30 bg-[#C89A4B]/10">
                    <Flame size={24} className="text-[#C89A4B]" aria-hidden="true" />
                  </div>
                  <p className="max-w-md font-serif text-2xl leading-snug text-white sm:text-3xl">{GREETING}</p>
                  <div className="mt-2 flex justify-center">
                    <ConversationStarters />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6" role="log" aria-live="polite" aria-label="Conversation">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  {isTyping && (
                    <div className="flex items-center gap-1.5 pl-1">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/40" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/40 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/40 [animation-delay:300ms]" />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          <div className="relative z-10 shrink-0 border-t border-white/10 bg-[#0F0C09]/80 px-6 py-5 backdrop-blur-md lg:px-0">
            <div className="mx-auto flex w-full max-w-[760px] flex-col gap-3">
              <div className="flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-2 py-2 pl-5 transition-colors duration-300 focus-within:border-[#C89A4B]">
                <input
                  ref={inputRef}
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && handleSend()}
                  placeholder={INPUT_PLACEHOLDER}
                  className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Send"
                  onClick={handleSend}
                  disabled={!draft.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C89A4B] text-[#14100D] transition-transform duration-300 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-white/40">
                <div className="flex items-center gap-2">
                  <label htmlFor="assistant-branch" className="sr-only">
                    Select a branch for WhatsApp handoff (optional)
                  </label>
                  <select
                    id="assistant-branch"
                    value={branchId}
                    onChange={(event) => setBranchId(event.target.value)}
                    className="rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-white/60"
                  >
                    <option value="">No branch selected</option>
                    {ACTIVE_LOCATIONS.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.city}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleWhatsAppHandoff}
                  className={getButtonClasses({ variant: "outline", size: "sm" })}
                >
                  {WHATSAPP_HANDOFF_LABEL}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
