// src/components/assistant/MessageBubble.tsx
//
// Renders one AssistantMessage. Recommendation blocks are text-only —
// this island is client-only and can't call astro:assets like FoodCard's
// .astro parent does, so there's no resolved image to show here.
import type { AssistantMessage } from "../../types/assistant";
import { getMenuItemById, RECOMMENDATION_RULES } from "../../data/assistant";

export function MessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === "user";
  const recommendedItem = message.recommendedItemId ? getMenuItemById(message.recommendedItemId) : undefined;
  const rule = message.recommendedItemId
    ? RECOMMENDATION_RULES.find((r) => r.itemId === message.recommendedItemId)
    : undefined;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
          isUser
            ? "bg-[#C89A4B] text-[#14100D]"
            : "border border-white/10 bg-white/[0.05] text-white/90"
        }`}
      >
        <p>{message.text}</p>
        {recommendedItem && (
          <a
            href={`/menu#${recommendedItem.category}`}
            className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-[#C89A4B]/30 bg-[#C89A4B]/10 px-3 py-2 text-[12px] font-semibold text-[#C89A4B] transition-colors duration-300 hover:bg-[#C89A4B]/20"
          >
            <span>{recommendedItem.name}</span>
            <span className="whitespace-nowrap">{recommendedItem.price}</span>
          </a>
        )}
        {rule && recommendedItem && <p className="mt-1 text-[11px] text-white/50">{rule.reason}</p>}
      </div>
    </div>
  );
}
