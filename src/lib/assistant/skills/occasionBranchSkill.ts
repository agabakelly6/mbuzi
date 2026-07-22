// src/lib/assistant/skills/occasionBranchSkill.ts
//
// "Where should I sit for a birthday?" — inspects real branch services
// (data/locations.ts) and catering copy (content/catering.ts) to pick
// the best-suited branch and explain why, rather than guessing.
import { ACTIVE_LOCATIONS } from "../../../data/locations";
import { LOCATIONS_CONTENT } from "../../../content/locations";
import { CATERING_CONTENT } from "../../../content/catering";
import type { BranchService } from "../../../types/location";
import type { AssistantSkill, SkillResult } from "./types";

const OCCASION_PATTERN = /\b(birthday|celebrat\w*|party|anniversary|special occasion)\b/i;
const WHERE_PATTERN = /\b(where|which branch|which location|best (branch|place|spot)|should i sit|host)\b/i;

const WEIGHTED_SERVICES: { service: BranchService; weight: number }[] = [
  { service: "privateDining", weight: 2 },
  { service: "familyFriendly", weight: 1 },
  { service: "outdoorSeating", weight: 1 },
];

export const occasionBranchSkill: AssistantSkill = {
  id: "occasion-branch",

  matches(ctx) {
    return OCCASION_PATTERN.test(ctx.query) && WHERE_PATTERN.test(ctx.query);
  },

  run(): SkillResult | null {
    const serviceLabels = LOCATIONS_CONTENT.features.serviceLabels;

    const ranked = ACTIVE_LOCATIONS.map((location) => {
      const score = WEIGHTED_SERVICES.reduce(
        (sum, { service, weight }) => sum + (location.services.includes(service) ? weight : 0),
        0
      );
      return { location, score };
    }).sort((a, b) => b.score - a.score);

    const best = ranked[0];
    if (!best) return null;

    const matchedServices = WEIGHTED_SERVICES.map((w) => w.service).filter((service) =>
      best.location.services.includes(service)
    );
    const reasonText =
      matchedServices.length > 0
        ? ` It offers ${matchedServices.map((s) => serviceLabels[s]).join(", ").toLowerCase()}, which suits a celebration well.`
        : "";

    return {
      text: `For a birthday or celebration, our ${best.location.city} branch would be a great fit. ${best.location.description}${reasonText} For a bigger group, our catering team can also set up a private event — ${CATERING_CONTENT.eventsOverview.description}`,
      branchId: best.location.id,
    };
  },
};
