// supabase/functions/ai-concierge/index.ts
//
// Thin, stateless streaming proxy to Google's Gemini API (the free
// AI-Studio tier — no billing on this project's account yet, and unlike
// every other provider, Gemini's free tier genuinely requires no card).
// GEMINI_API_KEY is the only place that key can live (never in a
// browser bundle). Publicly callable by anonymous site visitors
// (verify_jwt: false, same reasoning as place_guest_order's
// anon-callable RPC: real customers browsing the site have no login of
// any kind), so there's no user auth to check here — only basic
// input-size guardrails against runaway free-tier quota use. No real
// rate-limiting yet; a known open risk, not solved by this function —
// worth watching given the free tier's daily request cap.
//
// Does NOT build the knowledge base itself — src/lib/assistant/
// knowledgeBase.ts already flattens every real data/content source
// client-side with zero duplication; this function just receives that
// serialized text (as the `system` field) plus the conversation, calls
// Gemini's streamGenerateContent with alt=sse, and re-parses Gemini's
// SSE frames into a plain text stream (no SSE framing the client needs
// to parse — just read and append).
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_MESSAGES = 20;
const MAX_HISTORY_MESSAGE_LENGTH = 2000;
const MAX_KNOWLEDGE_CONTEXT_LENGTH = 40000;
const MODEL = "gemini-3.6-flash";

interface HistoryMessage {
  role: "user" | "assistant";
  text: string;
}

interface RequestBody {
  message?: string;
  history?: HistoryMessage[];
  system?: string;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "validation_error" }, 400);
  }

  const message = body.message?.trim();
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return json({ error: "validation_error", message: "message is required and must be reasonably short." }, 400);
  }
  if (!body.system || body.system.length > MAX_KNOWLEDGE_CONTEXT_LENGTH) {
    return json({ error: "validation_error", message: "system prompt is required and within size limits." }, 400);
  }

  // Gemini uses "model" where Anthropic/OpenAI-style APIs use "assistant".
  const history = (body.history ?? [])
    .slice(-MAX_HISTORY_MESSAGES)
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.text === "string")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text.slice(0, MAX_HISTORY_MESSAGE_LENGTH) }],
    }));

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return json({ error: "unknown", message: "AI concierge is not configured." }, 500);

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: body.system }] },
        contents: [...history, { role: "user", parts: [{ text: message }] }],
        generationConfig: { maxOutputTokens: 700, temperature: 0.8 },
      }),
    }
  );

  if (!geminiRes.ok || !geminiRes.body) {
    const errorText = await geminiRes.text().catch(() => "");
    console.error("ai-concierge: Gemini request failed:", geminiRes.status, errorText);
    return json({ error: "unknown", message: "The AI concierge is temporarily unavailable." }, 502);
  }

  // Gemini's SSE frames ("data: {...}\n\n") are parsed here and re-emitted
  // as plain text deltas — the client never needs to know this is SSE at
  // all, just a readable stream of text.
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const reader = geminiRes.body!.getReader();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const parsed = JSON.parse(payload);
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (typeof text === "string" && text.length > 0) {
                controller.enqueue(encoder.encode(text));
              }
            } catch {
              // A partial/malformed SSE frame — skip it rather than fail the whole stream.
            }
          }
        }
      } catch (error) {
        console.error("ai-concierge stream error:", error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { ...CORS_HEADERS, "Content-Type": "text/plain; charset=utf-8" },
  });
});
