// src/context/AssistantContext.tsx
//
// Genuine React Context — unlike the cart (see lib/cart/CartStore.ts),
// the assistant widget is a single island: the FAB, panel, message list,
// and starters all mount together as one client:load component tree in
// Layout.astro, so nothing outside that tree needs to read this state.
// A real createContext/<Provider> is the correct, idiomatic choice here.
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { getAssistantEngine } from "../lib/assistant/assistantEngine";
import { GREETING } from "../content/assistant";
import type { AssistantMessage } from "../types/assistant";

interface AssistantContextValue {
  messages: AssistantMessage[];
  isOpen: boolean;
  isTyping: boolean;
  lastRecommendedItemId?: string;
  lastQuestion: string;
  lastSummary: string;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  sendQuestion: (question: string) => void;
}

const AssistantContext = createContext<AssistantContextValue | undefined>(undefined);

let messageCounter = 0;
function nextMessageId(): string {
  messageCounter += 1;
  return `msg-${messageCounter}`;
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [lastRecommendedItemId, setLastRecommendedItemId] = useState<string | undefined>();
  const [lastQuestion, setLastQuestion] = useState("");
  const [lastSummary, setLastSummary] = useState(GREETING);

  const sendQuestion = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;
      const historySoFar = messages;
      setMessages((prev) => [...prev, { id: nextMessageId(), role: "user", text: trimmed, timestamp: Date.now() }]);
      setLastQuestion(trimmed);

      const assistantId = nextMessageId();
      setIsTyping(true);
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", text: "", timestamp: Date.now(), streaming: true },
      ]);

      const response = await getAssistantEngine().answer(trimmed, historySoFar, (delta) => {
        setIsTyping(false);
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, text: m.text + delta } : m))
        );
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, text: response.text, streaming: false, recommendedItemId: response.recommendedItemId }
            : m
        )
      );
      setLastSummary(response.text);
      if (response.recommendedItemId) setLastRecommendedItemId(response.recommendedItemId);
      setIsTyping(false);
    },
    [messages]
  );

  // Memoized so AssistantPanel's focus-trap effect (deps: [isOpen, closePanel])
  // only re-runs on an actual open/close transition, not on every message —
  // an unmemoized closePanel here previously gave that effect a fresh
  // reference on every render, re-running it mid-interaction and stealing
  // focus to the close button while a user was still pressing Enter to
  // send a message, which the browser then interpreted as activating the
  // now-focused close button.
  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);
  const togglePanel = useCallback(() => setIsOpen((prev) => !prev), []);

  const value: AssistantContextValue = {
    messages,
    isOpen,
    isTyping,
    lastRecommendedItemId,
    lastQuestion,
    lastSummary,
    openPanel,
    closePanel,
    togglePanel,
    sendQuestion,
  };

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant(): AssistantContextValue {
  const context = useContext(AssistantContext);
  if (!context) throw new Error("useAssistant must be used within an AssistantProvider");
  return context;
}
