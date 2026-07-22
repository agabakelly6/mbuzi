// src/lib/assistant/skills/types.ts
//
// Shared shapes for the skill registry (./index.ts). Internal to the
// assistant's reasoning layer — not part of the public AssistantEngine
// interface, so these aren't in types/assistant.ts.
import type { ScoredChunk } from "../../../types/assistant";

export interface SkillContext {
  query: string;
  tokens: string[];
  /** Top chunks retrieval already found relevant, before any skill runs. */
  topChunks: ScoredChunk[];
}

export interface SkillResult {
  text: string;
  recommendedItemId?: string;
  branchId?: string;
}

/**
 * One unit of "reasoning that pure retrieval can't do alone" — light
 * computation over already-retrieved, real data (never invented facts).
 * A skill either declines (matches() false, or run() returns null) or
 * fully answers the question. Adding a new skill later means adding one
 * more object to the SKILLS array in ./index.ts — never editing a switch.
 */
export interface AssistantSkill {
  id: string;
  matches(ctx: SkillContext): boolean;
  run(ctx: SkillContext): SkillResult | null;
}
