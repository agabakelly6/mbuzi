// src/lib/assistant/skills/brandIdentitySkill.ts
//
// "What makes YPA different?" — an abstract question pure keyword
// retrieval can't answer well (the literal word "different" rarely
// appears in the source content it should draw from). This skill
// recognizes the question shape and combines founder story + brand
// story + food philosophy — three real content sources — into one
// answer, exactly as the brief's example asks for.
import { FARM_STORY_CONTENT } from "../../../content/farm-story";
import { MENU_CONTENT } from "../../../content/menu";
import type { AssistantSkill, SkillResult } from "./types";

const PATTERN =
  /\b(what makes|what'?s different|different from|stand out|why choose|why ypa|special about|what makes you)\b/i;

export const brandIdentitySkill: AssistantSkill = {
  id: "brand-identity",

  matches(ctx) {
    return PATTERN.test(ctx.query);
  },

  run(): SkillResult {
    const { brandStory, founderMessage } = FARM_STORY_CONTENT;
    return {
      text: `${brandStory.description} ${founderMessage.paragraphs[0]} ${MENU_CONTENT.foodQualityStory.description}`,
    };
  },
};
