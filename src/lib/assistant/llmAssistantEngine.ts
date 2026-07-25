// src/lib/assistant/llmAssistantEngine.ts
//
// Real conversational engine: grounds every reply in getKnowledgeBase()
// (the same data every other page on the site reads from — menu,
// branches, hours, delivery, booking, catering, farm story, FAQ),
// builds the master system prompt (systemPrompt.ts), and streams the
// actual reply from the ai-concierge Edge Function token-by-token via
// onToken. If that call fails for any reason (network, quota, the
// function being unreachable), falls back to retrievalAssistantEngine —
// the master prompt this runs on explicitly forbids ever telling the
// customer "I don't have access," so degrading to a real (if less
// natural) answer beats surfacing an error.
import { getKnowledgeBase } from "./knowledgeBase";
import { retrieve } from "./retrieval";
import { detectRelevantCategories } from "./intentDetection";
import { buildSystemPrompt } from "./systemPrompt";
import { retrievalAssistantEngine, type AssistantEngine } from "./assistantEngine";
import { MENU_ITEMS } from "../../data/menu";
import type { AssistantMessage, AssistantResponse, KnowledgeChunk, RecommendationContext } from "../../types/assistant";

const AI_CONCIERGE_URL = `${import.meta.env.PUBLIC_SUPABASE_URL}/functions/v1/ai-concierge`;

const PAGE_LABELS: Record<string, string> = {
  "/": "the Home page",
  "/menu": "the Menu page",
  "/booking": "the Booking / Reservations page",
  "/catering": "the Catering page",
  "/contact": "the Contact page",
  "/locations": "the Locations page",
  "/farm-story": "the Farm Story page",
  "/gallery": "the Gallery page",
};

function getPageContext(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  return PAGE_LABELS[path];
}

function serializeKnowledgeBase(chunks: KnowledgeChunk[]): string {
  const byCategory = new Map<string, KnowledgeChunk[]>();
  for (const chunk of chunks) {
    const list = byCategory.get(chunk.category) ?? [];
    list.push(chunk);
    byCategory.set(chunk.category, list);
  }
  const sections: string[] = [];
  for (const [category, items] of byCategory) {
    sections.push(`### ${category.toUpperCase()}\n${items.map((c) => `- ${c.title}: ${c.text}`).join("\n")}`);
  }
  return sections.join("\n\n");
}

/** Cheap post-hoc match, not a rule lookup — if the LLM's free-text reply happens to name a real dish, attach it so MessageBubble can render the existing recommendation card. */
function findMentionedItemId(text: string): string | undefined {
  const lower = text.toLowerCase();
  const match = MENU_ITEMS.find((item) => lower.includes(item.name.toLowerCase()));
  return match?.id;
}

async function streamFromEdgeFunction(
  message: string,
  history: AssistantMessage[],
  system: string,
  categories: string[],
  pageContext: string | undefined,
  onToken?: (delta: string) => void
): Promise<string> {
  const response = await fetch(AI_CONCIERGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${import.meta.env.PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      message,
      history: history.map((m) => ({ role: m.role, text: m.text })),
      system,
      // Sent for analytics only (see ai-concierge/index.ts) — the
      // categories the client already computed to scope retrieval,
      // reused rather than re-detecting intent a second time server-side.
      categories,
      pageContext,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`ai-concierge request failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) {
      full += chunk;
      onToken?.(chunk);
    }
  }

  if (!full.trim()) throw new Error("ai-concierge returned an empty response");
  return full;
}

export const llmAssistantEngine: AssistantEngine = {
  async answer(
    question: string,
    history: AssistantMessage[],
    onToken?: (delta: string) => void
  ): Promise<AssistantResponse> {
    try {
      // True RAG, not "send everything": scope to the categories this
      // message (plus recent turns) actually touches, then rank within
      // that scope with the same retrieve() the fallback engine already
      // uses — reused, not reinvented. Keeps the prompt to ~10-15
      // relevant chunks instead of the whole ~80-chunk knowledge base.
      const categories = detectRelevantCategories(question, history);
      const scoped = getKnowledgeBase().filter((chunk) => categories.includes(chunk.category));
      const topChunks = retrieve(question, scoped, 15).map((s) => s.chunk);
      const knowledgeContext = serializeKnowledgeBase(topChunks.length > 0 ? topChunks : scoped);
      const pageContext = getPageContext();
      const system = buildSystemPrompt(knowledgeContext, pageContext);
      const text = await streamFromEdgeFunction(question, history, system, categories, pageContext, onToken);
      return { text, intent: "general", recommendedItemId: findMentionedItemId(text) };
    } catch (error) {
      console.error("llmAssistantEngine: falling back to retrieval engine:", error);
      return retrievalAssistantEngine.answer(question, history, onToken);
    }
  },

  async recommend(context: RecommendationContext): Promise<AssistantResponse> {
    // Route the fixed conversation-starter buttons through the same
    // natural-language path as free text, for one consistent voice
    // instead of two different response styles in the same conversation.
    const prompts: Record<RecommendationContext, string> = {
      "first-time": "I've never been here before — what would you recommend?",
      family: "I'm ordering for my family, what would you recommend?",
      breakfast: "What's good for breakfast?",
      "quick-lunch": "I need something quick for lunch.",
      healthy: "What's a lighter, healthier option?",
      favourites: "What's popular today?",
    };
    return this.answer(prompts[context], []);
  },
};
