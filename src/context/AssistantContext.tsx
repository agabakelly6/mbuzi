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
import type { AssistantMessage, RecommendationContext } from "../types/assistant";

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
  sendRecommendation: (context: RecommendationContext) => void;
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

  const pushAssistantReply = useCallback((text: string, recommendedItemId?: string) => {
    setIsTyping(true);
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: nextMessageId(), role: "assistant", text, timestamp: Date.now(), recommendedItemId },
      ]);
      setLastSummary(text);
      if (recommendedItemId) setLastRecommendedItemId(recommendedItemId);
      setIsTyping(false);
    }, 350);
  }, []);

  const sendQuestion = useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;
      setMessages((prev) => [...prev, { id: nextMessageId(), role: "user", text: trimmed, timestamp: Date.now() }]);
      setLastQuestion(trimmed);
      const response = getAssistantEngine().answer(trimmed, messages);
      pushAssistantReply(response.text, response.recommendedItemId);
    },
    [messages, pushAssistantReply]
  );

  const sendRecommendation = useCallback(
    (context: RecommendationContext) => {
      const response = getAssistantEngine().recommend(context);
      setLastQuestion(`Recommend something for: ${context}`);
      pushAssistantReply(response.text, response.recommendedItemId);
    },
    [pushAssistantReply]
  );

  const value: AssistantContextValue = {
    messages,
    isOpen,
    isTyping,
    lastRecommendedItemId,
    lastQuestion,
    lastSummary,
    openPanel: () => setIsOpen(true),
    closePanel: () => setIsOpen(false),
    togglePanel: () => setIsOpen((prev) => !prev),
    sendQuestion,
    sendRecommendation,
  };

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant(): AssistantContextValue {
  const context = useContext(AssistantContext);
  if (!context) throw new Error("useAssistant must be used within an AssistantProvider");
  return context;
}
