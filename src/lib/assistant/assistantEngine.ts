// src/lib/assistant/assistantEngine.ts
//
// The AI provider abstraction. Named `AssistantEngine` (not
// `AssistantProvider`) specifically to avoid colliding with the React
// context component in context/AssistantContext.tsx — this is the
// service layer, that is the UI-state layer. `ruleBasedAssistantEngine`
// is the v1 implementation: pure keyword matching over live site data,
// no external API call. Swapping in a real LLM later (Claude/OpenAI/
// Gemini) means writing a new object satisfying the same `AssistantEngine`
// interface and changing getAssistantEngine()'s return value — nothing
// else in the widget, context, or components needs to change.
import { SITE, BUSINESS_HOURS } from "../../config/site";
import { ACTIVE_LOCATIONS } from "../../data/locations";
import { getDeliveryInfo, DELIVERY_ZONES } from "../../data/delivery";
import { MERCHANT_PAYMENT_OPTIONS } from "../../data/booking";
import { CATERING_CONTENT } from "../../content/catering";
import { FARM_STORY_CONTENT } from "../../content/farm-story";
import {
  detectIntent,
  findRecommendationByKeyword,
  getMenuCategorySummary,
  getMenuItemById,
  getPopularDishes,
  getRecommendationForContext,
} from "../../data/assistant";
import { FAQ_ITEMS, FALLBACK_RESPONSES, INTENT_INTROS } from "../../content/assistant";
import type { AssistantIntent, AssistantMessage, AssistantResponse, RecommendationContext } from "../../types/assistant";

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

function answerByIntent(intent: AssistantIntent, question: string): AssistantResponse {
  const intro = INTENT_INTROS[intent];

  switch (intent) {
    case "hours": {
      const lines = BUSINESS_HOURS.map((entry) => `${entry.days}: ${entry.hours}`).join(" · ");
      return { text: `${intro} ${lines}`, intent };
    }

    case "locations": {
      const names = ACTIVE_LOCATIONS.map((location) => `${location.city} (${location.address})`).join(", ");
      return { text: `${intro} ${names}. Ask about a specific branch for its phone/WhatsApp number.`, intent };
    }

    case "reservation": {
      return {
        text: `${intro} Use the Reserve Table page (${SITE.reservationUrl}), or tell me your branch and I'll hand you to WhatsApp to confirm.`,
        intent,
      };
    }

    case "delivery": {
      const zoneLines = DELIVERY_ZONES.map((zone) => `${zone.label}: UGX ${zone.fee.toLocaleString()}`).join(
        ", "
      );
      const availableBranches = ACTIVE_LOCATIONS.filter((location) => getDeliveryInfo(location)?.available)
        .map((location) => location.city)
        .join(", ");
      return {
        text: `${intro} ${zoneLines}. Available for delivery from: ${availableBranches}.`,
        intent,
      };
    }

    case "menu": {
      const summary = getMenuCategorySummary()
        .map((category) => `${category.category} (${category.count} items, e.g. ${category.sampleNames.join(", ")})`)
        .join(" · ");
      return { text: `${intro} ${summary}`, intent };
    }

    case "recommendation": {
      const rule = findRecommendationByKeyword(question) ?? getRecommendationForContext("first-time");
      if (!rule) return { text: FALLBACK_RESPONSES[0], intent: "fallback" };
      const { text, recommendedItemId } = formatRecommendation(rule.itemId, rule.reason);
      return { text: `${intro} ${text}`, intent, recommendedItemId };
    }

    case "payment": {
      const options = MERCHANT_PAYMENT_OPTIONS.map(
        (option) => `${option.provider} (merchant code ${option.merchantCode})`
      ).join(", ");
      return { text: `${intro} ${options}, or cash when dining in-restaurant.`, intent };
    }

    case "events":
    case "catering": {
      return {
        text: `${intro} ${CATERING_CONTENT.eventsOverview.description} Packages range from ${CATERING_CONTENT.packages.description}`,
        intent,
      };
    }

    case "farmStory": {
      return { text: `${intro} ${FARM_STORY_CONTENT.brandStory.description}`, intent };
    }

    case "founderStory": {
      return { text: `${intro} ${FARM_STORY_CONTENT.founderMessage.paragraphs[0]}`, intent };
    }

    case "faq": {
      const match = FAQ_ITEMS.find((faq) => question.toLowerCase().includes(faq.question.toLowerCase().slice(0, 10)));
      return { text: match ? match.answer : FAQ_ITEMS.map((faq) => faq.question).join(" · "), intent };
    }

    case "greeting":
      return { text: intro, intent };

    default: {
      const random = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
      return { text: random, intent: "fallback" };
    }
  }
}

export const ruleBasedAssistantEngine: AssistantEngine = {
  answer(question: string): AssistantResponse {
    const intent = detectIntent(question);
    return answerByIntent(intent, question);
  },

  recommend(context: RecommendationContext): AssistantResponse {
    if (context === "favourites") {
      const popular = getPopularDishes();
      if (popular.length === 0) return { text: FALLBACK_RESPONSES[0], intent: "fallback" };
      const names = popular.map((item) => `${item.name} (${item.price})`).join(", ");
      return {
        text: `${INTENT_INTROS.recommendation} Today's favourites: ${names}.`,
        intent: "recommendation",
        recommendedItemId: popular[0].id,
      };
    }

    const rule = getRecommendationForContext(context);
    if (!rule) {
      return { text: FALLBACK_RESPONSES[0], intent: "fallback" };
    }
    const { text, recommendedItemId } = formatRecommendation(rule.itemId, rule.reason);
    return { text: `${INTENT_INTROS.recommendation} ${text}`, intent: "recommendation", recommendedItemId };
  },
};

/** The single call site every component uses — swap this to return an LLM-backed engine later without touching UI code. */
export function getAssistantEngine(): AssistantEngine {
  return ruleBasedAssistantEngine;
}
