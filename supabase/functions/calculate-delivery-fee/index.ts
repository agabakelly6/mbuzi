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
