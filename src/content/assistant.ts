// src/content/assistant.ts
//
// Copy only — greetings, conversation starters, FAQ, fallback responses.
// Recommendation defaults live in data/assistant.ts instead, matching
// this project's content/data split. Typed via types/content.ts's
// FAQItem, same as every other page's FAQ array. These FAQ_ITEMS are
// also indexed into the retrieval engine's knowledge base
// (lib/assistant/knowledgeBase.ts) alongside every other page's FAQ.
import type { FAQItem } from "../types/content";
import type { RecommendationContext } from "../types/assistant";

export const GREETING =
  "Hi, I'm the YPA assistant 👋 Ask me about locations, hours, delivery, or let me recommend a dish.";

export interface ConversationStarter {
  id: string;
  icon: "MapPin" | "Flame" | "Truck" | "Calendar" | "PartyPopper" | "Sparkles";
  label: string;
  question: string;
  /** Set when the starter should trigger a recommendation directly instead of a free-text answer. */
  context?: RecommendationContext;
}

export const CONVERSATION_STARTERS: ConversationStarter[] = [
  { id: "locations", icon: "MapPin", label: "📍 Where are you located?", question: "Where are you located?" },
  {
    id: "recommend",
    icon: "Flame",
    label: "🍖 Recommend a meal",
    question: "What do you recommend?",
    context: "first-time",
  },
  { id: "delivery", icon: "Truck", label: "🚚 Delivery", question: "Do you deliver?" },
  { id: "reserve", icon: "Calendar", label: "📅 Reserve a table", question: "How do I reserve a table?" },
  { id: "catering", icon: "PartyPopper", label: "🎉 Catering", question: "Do you do catering?" },
  {
    id: "favourites",
    icon: "Sparkles",
    label: "🔥 Today's favourites",
    question: "What's popular today?",
    context: "favourites",
  },
];

export const FALLBACK_RESPONSES: string[] = [
  "I couldn't find information about that in YPA's current information. I can help with locations, hours, delivery, reservations, the menu, or catering — or continue on WhatsApp and ask our team directly.",
  "I couldn't find that in what I currently know about YPA. Try asking about our menu, branches, delivery, or catering — or hand this off to our team on WhatsApp.",
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What are your opening hours?",
    answer: "We're open Sun–Thu 06:00–23:00, Friday 06:00–18:00, and Saturday 18:00–23:00.",
  },
  {
    question: "Do you deliver?",
    answer:
      "Yes, at every active branch — delivery fees depend on distance from the branch, from UGX 5,000 to UGX 15,000.",
  },
  {
    question: "How do I reserve a table?",
    answer: "Use the Reserve Table page, or continue this chat on WhatsApp and we'll confirm directly.",
  },
  {
    question: "What payment options do you have?",
    answer: "MTN Mobile Money and Airtel Money merchant codes for reservations/catering deposits, or cash in-restaurant.",
  },
  {
    question: "Do you cater for events?",
    answer: "Yes — corporate meetings, birthdays, weddings, and private celebrations, from 10 to 250 guests.",
  },
  {
    question: "Where does the food come from?",
    answer: "Our own family farm outside Kampala — every goat is raised, selected, and grilled by us, farm to fire.",
  },
];

export const WHATSAPP_HANDOFF_LABEL = "Continue on WhatsApp";
export const INPUT_PLACEHOLDER = "Ask about hours, delivery, a dish...";
export const PANEL_TITLE = "YPA Assistant";
