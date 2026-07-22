// src/lib/assistant/assistantEngine.ts
//
// The AI provider abstraction. Named `AssistantEngine` (not
// `AssistantProvider`) specifically to avoid colliding with the React
// context component in context/AssistantContext.tsx — this is the
// service layer, that is the UI-state layer.
//
// `retrievalAssistantEngine` is the current implementation: a
// retrieval-augmented engine (see knowledgeBase.ts, retrieval.ts,
// skills/, synthesize.ts) — it reasons over the project's own real
// content/data instead of matching a fixed list of keywords, and admits
// honestly when nothing relevant exists rather than guessing. Swapping
// in a real LLM later (Claude/OpenAI/Gemini) means writing a new object
// satisfying this same `AssistantEngine` interface — most naturally, one
// that still calls getKnowledgeBase()/retrieve() to ground its prompt in
// real facts, then asks the LLM to phrase the answer — and changing
// getAssistantEngine()'s return value. Nothing else in the widget,
// context, or components needs to change.
import { getKnowledgeBase } from "./knowledgeBase";
import { retrieve, tokenize } from "./retrieval";
import { runSkills } from "./skills";
import { synthesize } from "./synthesize";
import { getMenuItemById, getPopularDishes, getRecommendationForContext } from "../../data/assistant";
import { FALLBACK_RESPONSES } from "../../content/assistant";
import type { AssistantMessage, AssistantResponse, RecommendationContext } from "../../types/assistant";

export interface AssistantEngine {
  answer(question: string, history: AssistantMessage[]): AssistantResponse;
  recommend(context: RecommendationContext): AssistantResponse;
}

function formatRecommendation(itemId: string, reason: string): { text: string; recommendedItemId: string } {
  const item = getMenuItemById(itemId);
  if (!item) return { text: reason, recommendedItemId: itemId };
  return {
    text: `${item.name} (${item.price}) — ${reason}`,
    recommendedItemId: item.id,
  };
}

export const retrievalAssistantEngine: AssistantEngine = {
  answer(question: string): AssistantResponse {
    const chunks = getKnowledgeBase();
    const topChunks = retrieve(question, chunks, 5);
    const skillResult = runSkills({ query: question, tokens: tokenize(question), topChunks });
    return synthesize(topChunks, skillResult);
  },

  recommend(context: RecommendationContext): AssistantResponse {
    if (context === "favourites") {
      const popular = getPopularDishes();
      if (popular.length === 0) return { text: FALLBACK_RESPONSES[0], intent: "fallback" };
      const names = popular.map((item) => `${item.name} (${item.price})`).join(", ");
      return {
        text: `Today's favourites: ${names}.`,
        intent: "recommendation",
        recommendedItemId: popular[0].id,
      };
    }

    const rule = getRecommendationForContext(context);
    if (!rule) {
      return { text: FALLBACK_RESPONSES[0], intent: "fallback" };
    }
    const { text, recommendedItemId } = formatRecommendation(rule.itemId, rule.reason);
    return { text, intent: "recommendation", recommendedItemId };
  },
};

/** The single call site every component uses — swap this to return an LLM-backed engine later without touching UI code. */
export function getAssistantEngine(): AssistantEngine {
  return retrievalAssistantEngine;
}
