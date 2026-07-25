// src/lib/assistant/intentDetection.ts
//
// "Intent detection" here means: which of getKnowledgeBase()'s
// KnowledgeCategory partitions does this message actually need? That's
// the concrete, actionable form the requirement takes — a message maps
// to what should be retrieved, not to a free-standing label nobody
// reads. Deliberately a cheap local heuristic, not a second LLM call:
// an extra round-trip to classify intent before the real one would
// double API usage against Gemini's free-tier quota to make a decision
// this keyword map handles well enough. Looks at the last few turns too
// (not just the latest message) so a topic already under discussion
// ("what about delivery?" after "do you deliver to Ntinda?") doesn't
// drop retrieval for it. Errs generous on no confident match — under-
// retrieving risks the model inventing something; over-retrieving just
// costs a few extra tokens.
import type { AssistantMessage, KnowledgeCategory } from "../../types/assistant";

const CATEGORY_KEYWORDS: Partial<Record<KnowledgeCategory, string[]>> = {
  menu: [
    "menu", "dish", "dishes", "food", "eat", "eating", "meal", "meals", "price", "prices",
    "cost", "cheap", "cheapest", "expensive", "spicy", "mild", "grill", "grilled", "fry",
    "fried", "boneless", "protein", "vegetarian", "goat", "chicken", "drink", "drinks",
    "dessert", "sides", "side", "recommend", "recommendation", "order", "ordering",
    "hungry", "snack", "portion", "budget", "taste", "flavor", "flavour", "ingredient",
    "ingredients", "sandwich", "burger", "pizza", "smoothie", "juice", "breakfast",
    "lunch", "dinner", "signature", "popular", "favourite", "favorite", "best seller",
  ],
  location: [
    "where", "location", "branch", "branches", "address", "directions", "nearby",
    "kampala", "rubaga", "ntinda", "mbarara", "maddu", "nansana", "parking", "find you",
    "closest", "nearest",
  ],
  delivery: [
    "deliver", "delivery", "zone", "fee", "how long", "bring", "dispatch", "rider",
    "boda",
  ],
  booking: [
    "book", "booking", "reserve", "reservation", "table", "party size", "availability",
    "date night", "seats",
  ],
  payment: ["pay", "payment", "mobile money", "mtn", "airtel", "cash", "deposit", "momo"],
  catering: [
    "cater", "catering", "event", "events", "wedding", "birthday", "corporate", "party",
    "large group", "meeting", "guests",
  ],
  contact: [
    "contact", "phone", "call", "email", "whatsapp", "reach", "support", "talk to",
    "number",
  ],
  farm: [
    "farm", "raise", "raised", "goats come from", "source", "sourced", "fresh",
    "farm-to-table", "sustainab", "grazing",
  ],
  founder: ["founder", "started", "history", "who owns", "owner", "family business"],
  faq: ["faq", "policy", "policies", "refund", "cancel", "cancellation", "allerg"],
  hours: [
    "hour", "hours", "open", "opening", "close", "closing", "closed", "time", "today",
    "tonight", "morning", "when are you", "still open",
  ],
  expansion: ["new branch", "opening soon", "coming soon", "expand", "expanding"],
};

/** Categories cheap enough (a handful of short chunks each) and broadly useful enough to include on every request, regardless of what else is detected — avoids the model needing to ask "which branch" for context it could already have. */
const ALWAYS_INCLUDE: KnowledgeCategory[] = ["hours", "location"];

/** No confident category match at all — greeting, small talk, or something genuinely novel. These three cover the large majority of real conversations without over-including the whole knowledge base. */
const GENERALIST_DEFAULT: KnowledgeCategory[] = ["menu", "hours", "location"];

const RECENT_TURNS_CONSIDERED = 4;

export function detectRelevantCategories(
  message: string,
  history: AssistantMessage[]
): KnowledgeCategory[] {
  const recentText = [...history.slice(-RECENT_TURNS_CONSIDERED).map((m) => m.text), message]
    .join(" ")
    .toLowerCase();

  const matched = (Object.keys(CATEGORY_KEYWORDS) as KnowledgeCategory[]).filter((category) =>
    CATEGORY_KEYWORDS[category]!.some((keyword) => recentText.includes(keyword))
  );

  const categories = matched.length > 0 ? matched : GENERALIST_DEFAULT;
  return [...new Set([...categories, ...ALWAYS_INCLUDE])];
}
