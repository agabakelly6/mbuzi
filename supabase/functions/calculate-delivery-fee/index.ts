// supabase/functions/calculate-delivery-fee/index.ts
//
// Real routed road distance (not straight-line — see CheckoutPanel.tsx's
// header comment for why that distinction mattered) from a branch to a
// customer's shared live location, via OpenRouteService's free tier
// (~2,000-2,500 requests/day, 40/min — confirmed comfortably enough for
// this business's scale). ORS_API_KEY is the only place that key can
// live, never the browser. Publicly callable by anonymous site visitors
// (verify_jwt: false, same reasoning as place_guest_order/ai-concierge:
// real customers have no login).
//
// Deliberately returns only { distanceKm, durationMin } — NOT a fee.
// The pricing formula (calculateDeliveryFee in src/lib/geo.ts) stays a
// single client-side source of truth; duplicating it here in Deno would
// mean two places to keep in sync. SupabaseOrderService.placeGuestOrder
// re-derives the actual fee server-side from whatever distance the
// client sends before trusting it — this function only has to get the
// distance right, not the money.
//
// "driving-car" is the routing profile used, not "cycling-regular" —
// closer to how a boda actually moves (staying on named, drivable
// roads) than a bicycle profile, which can route through bike/footpaths
// a boda can't use. Still an approximation of real boda behavior, not
// exact, and said as much anywhere this number reaches a customer.
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
}

interface RequestBody {
  branchId?: string;
  customerLat?: number;
  customerLng?: number;
}

// Per-IP, per-minute cap via the check_rate_limit DB function — this
// endpoint is anonymously callable and proxies a metered OpenRouteService
// call, so with no limit a scripted caller could burn through the free
// tier's daily quota. 10/min per IP is generous for a real checkout flow
// (one call per "Share My Location" press) while capping abuse.
async function checkRateLimit(req: Request, admin: ReturnType<typeof createClient>): Promise<boolean> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  const { data, error } = await admin.rpc("check_rate_limit", {
    p_bucket: "calculate-delivery-fee",
    p_client_key: ip,
    p_max_per_minute: 10,
  });
  if (error) {
    console.error("calculate-delivery-fee: rate limit check failed:", error);
    return true; // fail open — a limiter outage shouldn't block real checkouts
  }
  return data === true;
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

  const { branchId, customerLat, customerLng } = body;
  if (
    !branchId ||
    typeof customerLat !== "number" ||
    typeof customerLng !== "number" ||
    Number.isNaN(customerLat) ||
    Number.isNaN(customerLng) ||
    customerLat < -90 ||
    customerLat > 90 ||
    customerLng < -180 ||
    customerLng > 180
  ) {
    return json({ error: "validation_error", message: "branchId and valid customerLat/customerLng are required." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  if (!(await checkRateLimit(req, admin))) {
    return json({ error: "rate_limited", message: "Too many requests — please wait a moment and try again." }, 429);
  }

  const { data: branch, error: branchError } = await admin
    .from("branches")
    .select("latitude, longitude")
    .eq("id", branchId)
    .maybeSingle();

  if (branchError || !branch || branch.latitude === null || branch.longitude === null) {
    return json({ error: "not_found", message: "This branch doesn't have delivery coordinates set up." }, 404);
  }

  const apiKey = Deno.env.get("ORS_API_KEY");
  if (!apiKey) return json({ error: "unknown", message: "Delivery fee calculation is not configured." }, 500);

  // ORS uses [lng, lat] order (GeoJSON convention), not [lat, lng].
  const url = new URL("https://api.openrouteservice.org/v2/directions/driving-car");
  url.searchParams.set("start", `${branch.longitude},${branch.latitude}`);
  url.searchParams.set("end", `${customerLng},${customerLat}`);

  const orsRes = await fetch(url, {
    headers: { Authorization: apiKey },
  });

  if (!orsRes.ok) {
    const errorText = await orsRes.text().catch(() => "");
    console.error("calculate-delivery-fee: ORS request failed:", orsRes.status, errorText);
    return json({ error: "unknown", message: "Couldn't calculate the delivery distance right now." }, 502);
  }

  const data = await orsRes.json();
  const segment = data?.features?.[0]?.properties?.segments?.[0];
  const distanceMeters = segment?.distance;
  const durationSeconds = segment?.duration;

  if (typeof distanceMeters !== "number") {
    console.error("calculate-delivery-fee: unexpected ORS response shape:", JSON.stringify(data).slice(0, 500));
    return json({ error: "unknown", message: "Couldn't calculate the delivery distance right now." }, 502);
  }

  return json(
    {
      data: {
        distanceKm: distanceMeters / 1000,
        durationMin: typeof durationSeconds === "number" ? durationSeconds / 60 : null,
      },
    },
    200
  );
});
