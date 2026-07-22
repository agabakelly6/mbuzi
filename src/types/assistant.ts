// src/types/assistant.ts
//
// Shared shapes for the AI restaurant assistant. Mirrors the split used
// elsewhere: these are structural types, the actual knowledge/copy that
// fills them lives in data/assistant.ts (structured) and
// content/assistant.ts (copy).

export type AssistantIntent =
  | "greeting"
  | "hours"
  | "locations"
  | "reservation"
  | "delivery"
  | "menu"
  | "recommendation"
  | "payment"
  | "events"
  | "catering"
  | "farmStory"
  | "founderStory"
  | "faq"
  | "fallback";

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
  /** Set when this assistant message includes a dish recommendation — MenuItem["id"]. */
  recommendedItemId?: string;
  /** Set when this assistant message is scoped to a specific branch — Location["id"]. */
  branchId?: string;
}

export type RecommendationContext =
  | "first-time"
  | "family"
  | "breakfast"
  | "quick-lunch"
  | "healthy"
  | "favourites";

export interface RecommendationRule {
  id: string;
  context: RecommendationContext;
  /** MenuItem["id"] this rule recommends. */
  itemId: string;
  /** Free-text keywords that also trigger this rule from a typed question. */
  triggers: string[];
  reason: string;
}

export interface AssistantResponse {
  text: string;
  intent: AssistantIntent;
  recommendedItemId?: string;
  branchId?: string;
}

// --- Retrieval knowledge base -----------------------------------------
// Added when the assistant moved from keyword-intent matching to a
// retrieval engine (lib/assistant/retrieval.ts) over a knowledge base
// built from the project's real content/data (lib/assistant/knowledgeBase.ts).

export type KnowledgeCategory =
  | "menu"
  | "location"
  | "delivery"
  | "booking"
  | "payment"
  | "catering"
  | "contact"
  | "farm"
  | "founder"
  | "faq"
  | "hours"
  | "expansion"
  | "general";

/** One retrievable, natural-language fact — always derived from an existing content/data source, never authored standalone. */
export interface KnowledgeChunk {
  id: string;
  category: KnowledgeCategory;
  /** Short label, also searched — a question, a dish name, a branch name, etc. */
  title: string;
  /** The actual sentence(s) a synthesized answer can quote or include verbatim. */
  text: string;
  /** Extra searchable terms not necessarily present verbatim in text/title. */
  keywords?: string[];
  /** MenuItem id (category "menu") or Location id (category "location") — lets a matched chunk drive AssistantResponse.recommendedItemId/branchId. */
  sourceRef?: string;
}

export interface ScoredChunk {
  chunk: KnowledgeChunk;
  score: number;
}
