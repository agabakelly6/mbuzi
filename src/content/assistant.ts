// src/content/assistant.ts
//
// Copy only — greetings, conversation starters, FAQ, fallback responses,
// intent intros. Structured knowledge (recommendation rules, intent
// keywords) lives in data/assistant.ts instead, matching this project's
// content/data split. Typed via types/content.ts's FAQItem, same as
// every other page's FAQ array.
import type { FAQItem } from "../types/content";
import type { AssistantIntent, RecommendationContext } from "../types/assistant";

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

export const INTENT_INTROS: Record<AssistantIntent, string> = {
  greeting: GREETING,
  hours: "Here are our opening hours:",
  locations: "Here's where you can find us:",
  reservation: "Happy to help you reserve a table:",
  delivery: "Here's our delivery info:",
  menu: "Here's what's on the menu:",
  recommendation: "Here's what I'd suggest:",
  payment: "Here's how you can pay:",
  events: "Here's what we can do for your event:",
  catering: "Here's how our catering works:",
  farmStory: "Here's a bit about our farm:",
  founderStory: "Here's the story behind YPA:",
  faq: "Here's what I know:",
  fallback: "",
};

export const FALLBACK_RESPONSES: string[] = [
  "I'm not sure about that one — but I can help with locations, hours, delivery, reservations, or a dish recommendation. Or continue on WhatsApp and ask our team directly.",
  "I don't have an answer for that yet. Try asking about our menu, branches, or delivery — or hand this off to our team on WhatsApp.",
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
