// src/lib/assistant/assistantMessage.ts
//
// WhatsApp handoff builder, same line-array-joined-with-"\n" style as
// BookingForm.tsx's buildWhatsAppMessage and cart/cartUtils.ts's
// buildOrderWhatsAppMessage — this project's one established pattern for
// turning structured data into a WhatsApp-ready message.
import type { Location } from "../../types/location";
import type { MenuItem } from "../../data/menu";

interface AssistantHandoffParams {
  question: string;
  summary: string;
  branch?: Location;
  recommendedItem?: MenuItem;
}

export function buildAssistantWhatsAppMessage({
  question,
  summary,
  branch,
  recommendedItem,
}: AssistantHandoffParams): string {
  const lines = [
    "Hi YPA, I was chatting with your website assistant:",
    `Question: ${question}`,
    `Summary: ${summary}`,
  ];
  if (branch) lines.push(`Branch: ${branch.name}`);
  if (recommendedItem) lines.push(`Recommended: ${recommendedItem.name} (${recommendedItem.price})`);
  lines.push("Could you help me with this?");
  return lines.join("\n");
}
