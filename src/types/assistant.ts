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
