// src/components/assistant/ConversationStarters.tsx
//
// Renders the CONVERSATION_STARTERS chips from content/assistant.ts —
// never hardcoded here. Every starter is just a natural-language
// question through the same sendQuestion()/engine.answer() path a typed
// message takes — the old context-based direct-recommendation branch
// was only needed for the old deterministic rule engine; the LLM engine
// answers "what do you recommend?" and "what's popular today?" naturally
// as free text, so there's no separate path to maintain anymore.
import { CONVERSATION_STARTERS } from "../../content/assistant";
import { useAssistant } from "../../context/AssistantContext";

export function ConversationStarters() {
  const { sendQuestion } = useAssistant();

  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      {CONVERSATION_STARTERS.map((starter) => (
        <button
          key={starter.id}
          type="button"
          onClick={() => sendQuestion(starter.question)}
          className="rounded-full border border-white/15 bg-white/[0.03] px-4 py-2.5 text-[13px] text-white/85 transition-colors duration-300 hover:border-[#C89A4B] hover:bg-[#C89A4B]/10 hover:text-[#C89A4B]"
        >
          {starter.label}
        </button>
      ))}
    </div>
  );
}
