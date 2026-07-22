// src/lib/assistant/skills/recommendationSkill.ts
//
// "Which tea would you recommend?" — reasons over whatever menu chunks
// retrieval already surfaced (so a query naming a specific drink/dish
// type naturally narrows to it), explaining the pick from the item's
// real `description`, never invented copy. Falls back to the site's
// real chef-pick/featured dishes (getPopularDishes) when the question
// is a vague "what do you recommend" with no specific menu match.
import { getMenuItemById, getPopularDishes } from "../../../data/assistant";
import type { AssistantSkill, SkillResult } from "./types";

const TRIGGER = /\b(recommend|suggest\w*|what should i|which .*(would|should)|what.*best|favou?rite)\b/i;

export const recommendationSkill: AssistantSkill = {
  id: "recommendation",

  matches(ctx) {
    return TRIGGER.test(ctx.query);
  },

  run(ctx): SkillResult | null {
    const menuMatches = ctx.topChunks
      .filter((scored) => scored.chunk.category === "menu")
      .slice(0, 2)
      .map((scored) => getMenuItemById(scored.chunk.sourceRef ?? ""))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const candidates = menuMatches.length > 0 ? menuMatches : getPopularDishes().slice(0, 2);
    if (candidates.length === 0) return null;

    if (candidates.length === 1) {
      const item = candidates[0];
      return {
        text: `${item.name} (${item.price}) is a great pick — ${item.description}`,
        recommendedItemId: item.id,
      };
    }

    const [first, second] = candidates;
    return {
      text: `You might enjoy ${first.name} or ${second.name}. ${first.name}: ${first.description} ${second.name}: ${second.description}`,
      recommendedItemId: first.id,
    };
  },
};
