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
//
// Also logs anonymous analytics (assistant_analytics table) — the
// question plus the knowledge categories the client already detected
// for retrieval scoping (src/lib/assistant/intentDetection.ts), reused
// here rather than re-running the same heuristic a second time in Deno.
// No customer identifier of any kind is stored. The insert is handed to
// EdgeRuntime.waitUntil() so it runs in the background without adding
// latency to the actual reply, and without the function's isolate being
// torn down before it finishes (a real risk for genuinely fire-and-forget
// work here — a plain unawaited promise isn't reliably safe on this
// runtime).
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined;

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_MESSAGES = 20;
const MAX_HISTORY_MESSAGE_LENGTH = 2000;
const MAX_KNOWLEDGE_CONTEXT_LENGTH = 40000;
// gemini-3.6-flash (the newest model) has a free-tier cap of just 20
// requests/day — unusable even for testing, confirmed by exhausting it
// during development. gemini-3.5-flash-lite's free tier is 1,000/day,
// 15/minute — the actually-usable choice for a real small-business
// concierge on the free tier. Slightly lower reasoning ceiling than the
// full Flash tier, not noticeably so for this use case in testing.
const MODEL = "gemini-3.5-flash-lite";

interface HistoryMessage {
  role: "user" | "assistant";
  text: string;
}

interface RequestBody {
  message?: string;
  history?: HistoryMessage[];
  system?: string;
  categories?: string[];
  pageContext?: string;
}

function logAnalytics(message: string, categories: string[], pageContext: string | undefined): void {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return;

  const admin = createClient(supabaseUrl, serviceKey);
  const insert = admin.from("assistant_analytics").insert({
    question: message.slice(0, 1000),
    categories: Array.isArray(categories) ? categories.slice(0, 20) : [],
    page_context: pageContext ?? null,
  });

  if (typeof EdgeRuntime !== "undefined") {
    EdgeRuntime.waitUntil(insert.then(() => {}).catch((error) => console.error("assistant_analytics insert failed:", error)));
  } else {
    void insert.catch((error) => console.error("assistant_analytics insert failed:", error));
  }
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

  logAnalytics(message, body.categories ?? [], body.pageContext);

  return new Response(stream, {
    headers: { ...CORS_HEADERS, "Content-Type": "text/plain; charset=utf-8" },
  });
});
