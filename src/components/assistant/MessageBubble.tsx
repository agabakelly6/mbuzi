// src/components/assistant/MessageBubble.tsx
//
// Renders one AssistantMessage. Restyled for the full-screen conversation
// column (more breathing room than the old small-popover sizing) — same
// data shape, same recommendation-card mechanic. `rule` only resolves for
// the old fixed recommendation contexts; llmAssistantEngine's free-text
// dish detection (findMentionedItemId) has no matching rule, so the card
// renders without the extra reason caption in that case — the LLM's own
// message text already explains the recommendation.
import { motion } from "framer-motion";
import { getMenuItemById, RECOMMENDATION_RULES } from "../../data/assistant";
import type { AssistantMessage } from "../../types/assistant";

export function MessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === "user";
  const recommendedItem = message.recommendedItemId ? getMenuItemById(message.recommendedItemId) : undefined;
  const rule = message.recommendedItemId
    ? RECOMMENDATION_RULES.find((r) => r.itemId === message.recommendedItemId)
    : undefined;

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] rounded-2xl bg-[#C89A4B] px-5 py-3 text-[15px] leading-relaxed text-[#14100D]">
          {message.text}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-start"
    >
      <div className="max-w-[85%] text-[15px] leading-[1.7] text-white/90">
        <p className="whitespace-pre-wrap">
          {message.text}
          {message.streaming && message.text && (
            <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-[#C89A4B]" />
          )}
        </p>
        {recommendedItem && (
          <a
            href={`/menu#${recommendedItem.category}`}
            className="mt-3 flex max-w-sm items-center justify-between gap-3 rounded-xl border border-[#C89A4B]/30 bg-[#C89A4B]/10 px-4 py-3 text-[13px] font-semibold text-[#C89A4B] transition-colors duration-300 hover:bg-[#C89A4B]/20"
          >
            <span>{recommendedItem.name}</span>
            <span className="whitespace-nowrap">{recommendedItem.price}</span>
          </a>
        )}
        {rule && recommendedItem && <p className="mt-1.5 text-[12px] text-white/40">{rule.reason}</p>}
      </div>
    </motion.div>
  );
}
