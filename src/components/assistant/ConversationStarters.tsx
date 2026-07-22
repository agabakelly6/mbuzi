// src/components/assistant/ConversationStarters.tsx
//
// Renders the CONVERSATION_STARTERS chips from content/assistant.ts —
// never hardcoded here. A starter with a `context` triggers a direct
// recommendation; otherwise it's treated as a free-text question through
// the same engine.answer() path a typed message would take.
import { CONVERSATION_STARTERS } from "../../content/assistant";
import { useAssistant } from "../../context/AssistantContext";

export function ConversationStarters() {
  const { sendQuestion, sendRecommendation } = useAssistant();

  return (
    <div className="flex flex-wrap gap-2">
      {CONVERSATION_STARTERS.map((starter) => (
        <button
          key={starter.id}
          type="button"
          onClick={() => (starter.context ? sendRecommendation(starter.context) : sendQuestion(starter.question))}
          className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-[12px] text-white/85 transition-colors duration-300 hover:border-[#C89A4B] hover:text-[#C89A4B]"
        >
          {starter.label}
        </button>
      ))}
    </div>
  );
}
