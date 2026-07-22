// src/lib/assistant/synthesize.ts
//
// Turns ranked knowledge chunks (plus an optional skill result) into the
// final AssistantResponse. Step 5 of the brief's "how it should think"
// lives here: below RELEVANCE_THRESHOLD, admit it honestly rather than
// guessing — never pad a weak match into a confident-sounding answer.
import { RELEVANCE_THRESHOLD } from "./retrieval";
import { FALLBACK_RESPONSES } from "../../content/assistant";
import type { AssistantIntent, AssistantResponse, KnowledgeCategory, ScoredChunk } from "../../types/assistant";
import type { SkillResult } from "./skills/types";

const CATEGORY_TO_INTENT: Record<KnowledgeCategory, AssistantIntent> = {
  menu: "menu",
  location: "locations",
  delivery: "delivery",
  booking: "reservation",
  payment: "payment",
  catering: "catering",
  contact: "faq",
  farm: "farmStory",
  founder: "founderStory",
  faq: "faq",
  hours: "hours",
  expansion: "locations",
  general: "faq",
};

/** Warm, varied lead-ins — phrasing aids, not per-topic content, so they never gate what the assistant is able to say. */
const CONNECTORS = ["Sure —", "Good question —", "Happy to help —", "Here's what I know:", "Glad you asked —"];

function pickConnector(): string {
  return CONNECTORS[Math.floor(Math.random() * CONNECTORS.length)];
}

function pickFallback(): string {
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
}

export function synthesize(scored: ScoredChunk[], skillResult: SkillResult | null): AssistantResponse {
  if (skillResult) {
    const topCategory = scored[0]?.chunk.category;
    return {
      text: skillResult.text,
      intent: topCategory ? CATEGORY_TO_INTENT[topCategory] : "recommendation",
      recommendedItemId: skillResult.recommendedItemId,
      branchId: skillResult.branchId,
    };
  }

  const top = scored[0];
  if (!top || top.score < RELEVANCE_THRESHOLD) {
    return { text: pickFallback(), intent: "fallback" };
  }

  // Only pull in a 2nd/3rd chunk if it's meaningfully relevant too (not
  // just the least-bad of what's left) — a crisp direct match should
  // read as one crisp answer, not a stitched-together ramble.
  const supporting = scored.slice(1, 3).filter((s) => s.score >= top.score * 0.55);
  const text = [pickConnector(), top.chunk.text, ...supporting.map((s) => s.chunk.text)].join(" ");

  return {
    text,
    intent: CATEGORY_TO_INTENT[top.chunk.category],
    recommendedItemId: top.chunk.category === "menu" ? top.chunk.sourceRef : undefined,
    branchId: top.chunk.category === "location" ? top.chunk.sourceRef : undefined,
  };
}
