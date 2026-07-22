// src/data/assistant.ts
//
// Structured assistant knowledge — intent keywords and recommendation
// rules. Copy (greetings, FAQ text, fallback strings) lives in
// content/assistant.ts instead, matching this project's content/data
// split. Nothing here is hardcoded into a component; lib/assistant/
// assistantEngine.ts is the only consumer.
import { MENU_ITEMS, type MenuCategory, type MenuItem } from "./menu";
import type { AssistantIntent, RecommendationContext, RecommendationRule } from "../types/assistant";

export const INTENT_KEYWORDS: Record<Exclude<AssistantIntent, "greeting" | "fallback">, string[]> = {
  hours: ["hour", "open", "close", "time", "when are you"],
  locations: ["location", "branch", "where", "address", "directions"],
  reservation: ["book", "reserve", "reservation", "table"],
  delivery: ["deliver", "delivery", "zone", "fee"],
  menu: ["menu", "category", "categories", "dish", "dishes", "food"],
  recommendation: ["recommend", "suggestion", "suggest", "what should i", "popular", "favourite", "favorite"],
  payment: ["pay", "payment", "mobile money", "mtn", "airtel", "cash", "visa"],
  events: ["event", "party", "birthday", "wedding", "corporate"],
  catering: ["cater", "catering"],
  farmStory: ["farm", "raise", "raised", "source", "sourced"],
  founderStory: ["founder", "obed", "who started", "who founded"],
  faq: ["faq", "question"],
};

/**
 * ids verified against data/menu.ts. One rule per conversation-starter
 * recommendation context, plus a keyword list so the same rule can also
 * be reached from free-text ("what's good for breakfast?").
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

export function findRecommendationByKeyword(question: string): RecommendationRule | undefined {
  const lower = question.toLowerCase();
  return RECOMMENDATION_RULES.find((rule) => rule.triggers.some((trigger) => lower.includes(trigger)));
}

export function getMenuItemById(itemId: string): MenuItem | undefined {
  return MENU_ITEMS.find((item) => item.id === itemId);
}

/** Today's favourites — chef picks and featured dishes, for the "🔥 Today's Favourites" starter. */
export function getPopularDishes(): MenuItem[] {
  return MENU_ITEMS.filter((item) => item.chefPick || item.featured);
}

export function getMenuCategorySummary(): { category: MenuCategory; count: number; sampleNames: string[] }[] {
  const categories = Array.from(new Set(MENU_ITEMS.map((item) => item.category)));
  return categories.map((category) => {
    const items = MENU_ITEMS.filter((item) => item.category === category);
    return {
      category,
      count: items.length,
      sampleNames: items.slice(0, 3).map((item) => item.name),
    };
  });
}

/** Detects the most likely intent from free text via simple keyword matching — the v1 rule-based "understanding" layer. */
export function detectIntent(question: string): AssistantIntent {
  const lower = question.toLowerCase();

  if (findRecommendationByKeyword(question)) return "recommendation";

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [
    Exclude<AssistantIntent, "greeting" | "fallback">,
    string[]
  ][]) {
    if (keywords.some((keyword) => lower.includes(keyword))) return intent;
  }

  return "fallback";
}
