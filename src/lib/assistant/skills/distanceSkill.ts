// src/lib/assistant/skills/distanceSkill.ts
//
// "I'm coming from Entebbe. Which branch is closest?" — this static site
// has no geocoding or routing capability, so this skill is honest about
// that instead of guessing a distance, and lists real branch
// locations so the customer can judge for themselves.
import { ACTIVE_LOCATIONS } from "../../../data/locations";
import type { AssistantSkill, SkillResult } from "./types";

const DISTANCE_PATTERN = /\b(closest|nearest|how far|distance|coming from|travel(l)?ing from)\b/i;

export const distanceSkill: AssistantSkill = {
  id: "distance",

  matches(ctx) {
    return DISTANCE_PATTERN.test(ctx.query);
  },

  run(): SkillResult {
    const list = ACTIVE_LOCATIONS.map((location) => `${location.city} (${location.address})`).join("; ");
    return {
      text: `I can't calculate real driving distance or travel time — that's outside what this assistant can do. Here's where every branch actually is, so you can judge what's closest: ${list}. Each branch's page links to real Google Maps directions.`,
    };
  },
};
