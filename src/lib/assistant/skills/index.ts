// src/lib/assistant/skills/index.ts
//
// The skill registry — a flat array, not a switch. Adding a new kind of
// reasoning later means pushing one more object here; nothing else in
// the engine needs to change. Order matters only in that the first
// matching skill wins, so the more narrowly-scoped skills are listed
// before recommendationSkill, which matches a broader trigger.
import { distanceSkill } from "./distanceSkill";
import { groupOrderSkill } from "./groupOrderSkill";
import { occasionBranchSkill } from "./occasionBranchSkill";
import { brandIdentitySkill } from "./brandIdentitySkill";
import { recommendationSkill } from "./recommendationSkill";
import type { AssistantSkill, SkillContext, SkillResult } from "./types";

export const SKILLS: AssistantSkill[] = [
  distanceSkill,
  groupOrderSkill,
  occasionBranchSkill,
  brandIdentitySkill,
  recommendationSkill,
];

export function runSkills(ctx: SkillContext): SkillResult | null {
  for (const skill of SKILLS) {
    if (skill.matches(ctx)) {
      const result = skill.run(ctx);
      if (result) return result;
    }
  }
  return null;
}

export type { SkillContext, SkillResult, AssistantSkill };
