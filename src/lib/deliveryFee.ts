// src/lib/deliveryFee.ts
//
// Thin client for the calculate-delivery-fee Edge Function — returns
// real routed road distance from a branch to a customer's shared live
// location via OpenRouteService, server-side (the API key can't live in
// the browser). Throws on any failure; CheckoutPanel.tsx is responsible
// for falling back to the flat-zone picker when it does, not this
// function — it only knows how to ask, not what to do if nobody answers.
export interface DeliveryFeeDistance {
  distanceKm: number;
  durationMin: number | null;
}

const CALCULATE_DELIVERY_FEE_URL = `${import.meta.env.PUBLIC_SUPABASE_URL}/functions/v1/calculate-delivery-fee`;

export async function getRoutedDeliveryDistance(
  branchId: string,
  customerLat: number,
  customerLng: number
): Promise<DeliveryFeeDistance> {
  const response = await fetch(CALCULATE_DELIVERY_FEE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${import.meta.env.PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ branchId, customerLat, customerLng }),
  });

  if (!response.ok) {
    throw new Error(`calculate-delivery-fee request failed: ${response.status}`);
  }

  const { data } = await response.json();
  if (typeof data?.distanceKm !== "number") {
    throw new Error("calculate-delivery-fee returned an unexpected response");
  }

  return data;
}
