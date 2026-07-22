// src/lib/assistant/skills/groupOrderSkill.ts
//
// "I have five friends. What should we order?" — parses the group size
// from the question and reasons over the REAL sharing-platter tiers
// already in data/menu.ts (LUSANIYA_ITEMS' "2 People"/"4 People"
// variations) rather than inventing quantities or prices.
import { LUSANIYA_ITEMS } from "../../../data/menu";
import type { AssistantSkill, SkillResult } from "./types";

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12,
};

const GROUP_PATTERN =
  /\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|twelve)\b[^.?!]{0,25}\b(friends?|people|guests?|of us|colleagues|family members?)\b/i;
const PARTY_OF_PATTERN = /\bparty of (\d{1,2})\b/i;

function extractCount(query: string): number | null {
  const match = query.match(GROUP_PATTERN) ?? query.match(PARTY_OF_PATTERN);
  if (!match) return null;
  const raw = match[1].toLowerCase();
  const count = NUMBER_WORDS[raw] ?? Number.parseInt(raw, 10);
  return Number.isFinite(count) && count > 0 ? count : null;
}

export const groupOrderSkill: AssistantSkill = {
  id: "group-order",

  matches(ctx) {
    return extractCount(ctx.query) !== null;
  },

  run(ctx): SkillResult | null {
    const count = extractCount(ctx.query);
    if (!count) return null;

    const platters = LUSANIYA_ITEMS.filter((item) => item.variations && item.variations.length > 0);
    if (platters.length === 0) return null;

    const primary = platters.find((p) => p.featured) ?? platters[0];
    const twoPersonTier = primary.variations?.find((v) => v.label.includes("2"));
    const fourPersonTier = primary.variations?.find((v) => v.label.includes("4"));

    if (count <= 2 && twoPersonTier) {
      return {
        text: `For ${count}, the ${primary.name} (${twoPersonTier.label}, ${twoPersonTier.price}) is a generous choice on its own.`,
        recommendedItemId: primary.id,
      };
    }

    if (count <= 4 && fourPersonTier) {
      return {
        text: `For ${count}, the ${primary.name} (${fourPersonTier.label}, ${fourPersonTier.price}) is built exactly for a table your size.`,
        recommendedItemId: primary.id,
      };
    }

    if (fourPersonTier) {
      const other = platters.find((p) => p.id !== primary.id);
      const otherTier = other?.variations?.find((v) => v.label.includes("4"));
      const text = otherTier
        ? `For a group of ${count}, we'd suggest the ${primary.name} (${fourPersonTier.label}, ${fourPersonTier.price}) alongside the ${other!.name} (${otherTier.label}, ${otherTier.price}) for variety — between the two sharing platters, that comfortably covers a table your size.`
        : `For a group of ${count}, order the ${primary.name} in the ${fourPersonTier.label} size (${fourPersonTier.price}) and add a couple of à la carte mains alongside it for a table your size.`;
      return { text, recommendedItemId: primary.id };
    }

    return null;
  },
};
