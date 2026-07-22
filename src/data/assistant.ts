// src/data/assistant.ts
//
// Curated recommendation defaults for the assistant's 6 fixed
// conversation-starter buttons (content/assistant.ts's
// CONVERSATION_STARTERS) — a deliberate, small set of default
// suggestions per button, not a database of hardcoded question/answer
// pairs. Free-text questions are answered by the retrieval engine
// instead (lib/assistant/knowledgeBase.ts + retrieval.ts + skills/),
// which reasons over the project's real content/data rather than
// matching keywords — see lib/assistant/assistantEngine.ts.
import { MENU_ITEMS, type MenuItem } from "./menu";
import type { RecommendationContext, RecommendationRule } from "../types/assistant";

/**
 * ids verified against data/menu.ts. One rule per conversation-starter
 * recommendation context (except "favourites", handled separately via
 * getPopularDishes() since it isn't a single fixed dish).
 */
export const RECOMMENDATION_RULES: RecommendationRule[] = [
  {
    id: "first-time",
    context: "first-time",
    itemId: "mbuzi-choma-special",
    triggers: ["first time", "new here", "never been", "what's your best"],
    reason: "Our signature dish — tender goat grilled the chef's way, the best introduction to YPA.",
  },
  {
    id: "family",
    context: "family",
    itemId: "nyama-fest",
    triggers: ["family", "sharing", "group", "table"],
    reason: "A generous sharing platter of mixed grilled goat cuts, built for the whole table.",
  },
  {
    id: "breakfast",
    context: "breakfast",
    itemId: "goat-katogo",
    triggers: ["breakfast", "morning"],
    reason: "A rich, hearty vegetable stew to start the day — our most popular breakfast order.",
  },
  {
    id: "quick-lunch",
    context: "quick-lunch",
    itemId: "mbuzi-choma-burger",
    triggers: ["quick", "lunch", "fast", "burger"],
    reason: "Goat patty with fresh tomato, onions, and lettuce — ready fast without skipping flavour.",
  },
  {
    id: "healthy",
    context: "healthy",
    itemId: "goat-stew",
    triggers: ["healthy", "light", "diet"],
    reason: "Tender goat simmered with fresh vegetables — lighter than a grill plate, still full of flavour.",
  },
];

export function getRecommendationForContext(
  context: RecommendationContext
): RecommendationRule | undefined {
  return RECOMMENDATION_RULES.find((rule) => rule.context === context);
}

export function getMenuItemById(itemId: string): MenuItem | undefined {
  return MENU_ITEMS.find((item) => item.id === itemId);
}

/** Today's favourites — chef picks and featured dishes, for the "🔥 Today's Favourites" starter and as the recommendation skill's fallback when a free-text question doesn't name anything specific. */
export function getPopularDishes(): MenuItem[] {
  return MENU_ITEMS.filter((item) => item.chefPick || item.featured);
}
