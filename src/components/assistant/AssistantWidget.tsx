// src/components/assistant/AssistantWidget.tsx
//
// Mounted once via client:load in Layout.astro. AssistantProvider is a
// real React Context here — this is one island, so unlike the cart,
// there's no cross-island sharing problem to work around.
import { AssistantProvider } from "../../context/AssistantContext";
import { AssistantFAB } from "./AssistantFAB";
import { AssistantPanel } from "./AssistantPanel";

export function AssistantWidget() {
  return (
    <AssistantProvider>
      <AssistantFAB />
      <AssistantPanel />
    </AssistantProvider>
  );
}
