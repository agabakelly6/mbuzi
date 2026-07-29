// src/components/ordering/CheckoutPanel.tsx
//
// Pickup and delivery only — dine-in is deliberately out of this first
// slice (it needs a restaurant_table selection, a separate feature this
// page doesn't build). Collects guest details and the cart contents,
// then hands off to PaymentStep — the order itself isn't placed until
// payment is confirmed there (see place_guest_order's p_payment_method
// param and the enforce_payment_before_accept trigger, which blocks
// kitchen prep until a cashier confirms payment).
//
// Guest checkout only — no customer account. Collects name + phone here
// directly (no email — matches the original pre-Supabase WhatsApp cart's
// CustomerDetails shape exactly), same as the older WhatsApp flow's
// checkout ever asked for.
//
// Delivery fee: the customer shares their live location, and
// calculate-delivery-fee (an Edge Function proxying OpenRouteService)
// returns the real routed road distance from the branch — not straight-
// line distance, which was tried first and rejected as inaccurate, and
// not a flat distance-band fee either (data/delivery.ts used to have one;
// it was inaccurate and has been removed). There is no fallback fee
// table anymore — if routed distance is beyond MAX_DELIVERY_RADIUS_KM,
// delivery isn't offered for that address at all. If the location call
// fails for some other reason (denied permission, no GPS, API outage),
// the guest can still proceed by entering their address manually; the
// fee then isn't computed automatically and the branch confirms it by
// phone before preparing the order, rather than charging a guessed flat
// rate.
import { useState, type SyntheticEvent } from "react";
import { LocateFixed, CircleAlert } from "lucide-react";
import type { Branch } from "../../types/branch";
import type { OrderChannel } from "../../types/order";
import type { UseOrderCartResult } from "../../hooks/useOrderCart";
import type { CreateGuestOrderInput } from "../../validators/order.schema";
import { calculateDeliveryFee, MAX_DELIVERY_RADIUS_KM } from "../../lib/geo";
import { getRoutedDeliveryDistance } from "../../lib/deliveryFee";
import { getButtonClasses } from "../../lib/button-variants";
import { FORM_INPUT_CLASSES, FORM_LABEL_CLASSES } from "../../lib/constants";
import { formatUgx } from "../../lib/helpers";

/** Everything CheckoutPanel collects before payment method is chosen on the next step. */
export type GuestOrderDraft = Omit<CreateGuestOrderInput, "paymentMethod">;

interface CheckoutPanelProps {
  branch: Branch;
  cart: UseOrderCartResult;
  onDetailsConfirmed: (details: GuestOrderDraft, total: number) => void;
  onBack: () => void;
}

export function CheckoutPanel({ branch, cart, onDetailsConfirmed, onBack }: CheckoutPanelProps) {
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [channel, setChannel] = useState<Extract<OrderChannel, "pickup" | "delivery">>("pickup");
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState<number | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "granted" | "error">("idle");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showManualAddress, setShowManualAddress] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const deliveryTooFar = deliveryDistanceKm !== null && deliveryDistanceKm > MAX_DELIVERY_RADIUS_KM;
  const deliveryFee =
    channel === "delivery" && deliveryDistanceKm !== null && !deliveryTooFar
      ? calculateDeliveryFee(deliveryDistanceKm)
      : 0;
  const total = cart.subtotal + deliveryFee;

  async function handleShareLocation() {
    // Every press re-acquires a fresh fix and clears whatever the last
    // press produced first — a stale distance/fee must never linger on
    // screen (or get submitted) while a new one is in flight, and
    // maximumAge: 0 below forces the browser to take a live GPS reading
    // instead of handing back a cached position.
    setDeliveryDistanceKm(null);
    setLocationStatus("requesting");
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationError("Location sharing isn't available on this device or browser.");
      setShowManualAddress(true);
      return;
    }
    if (branch.latitude === null || branch.longitude === null) {
      setLocationStatus("error");
      setLocationError("This branch doesn't have delivery coordinates set up yet — please enter your address instead.");
      setShowManualAddress(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { distanceKm } = await getRoutedDeliveryDistance(
            branch.id,
            position.coords.latitude,
            position.coords.longitude
          );
          setDeliveryDistanceKm(distanceKm);
          setLocationStatus("granted");
          setShowManualAddress(false);
        } catch {
          setLocationStatus("error");
          setLocationError("We couldn't calculate your exact delivery fee right now — please enter your address instead and we'll confirm the fee by phone.");
          setShowManualAddress(true);
        }
      },
      (geoError) => {
        setLocationStatus("error");
        setLocationError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location permission was denied. Enter your address instead, or allow location access to get an exact quote."
            : "Couldn't get your location — please enter your address instead and we'll confirm the fee by phone."
        );
        setShowManualAddress(true);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!guestName.trim() || !guestPhone.trim()) {
      setError("Enter your name and phone number.");
      return;
    }
    if (channel === "delivery" && deliveryTooFar) {
      setError(`This delivery address is outside our ${MAX_DELIVERY_RADIUS_KM} km delivery radius — please choose pickup instead.`);
      return;
    }
    if (channel === "delivery" && deliveryDistanceKm === null && !deliveryAddress.trim()) {
      setError("Share your location or enter your delivery address.");
      return;
    }

    onDetailsConfirmed(
      {
        branchId: branch.id,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        channel,
        items: cart.lines.map((line) => ({
          menuItemId: line.menuItem.id,
          variationLabel: line.variationLabel,
          quantity: line.quantity,
          specialInstructions: line.specialInstructions,
        })),
        deliveryZoneId:
          channel === "delivery"
            ? deliveryDistanceKm !== null
              ? `${deliveryDistanceKm.toFixed(1)} km`
              : "Address-based (fee pending)"
            : undefined,
        deliveryDistanceKm: channel === "delivery" && deliveryDistanceKm !== null ? deliveryDistanceKm : undefined,
        deliveryAddress: channel === "delivery" ? deliveryAddress.trim() || "No address provided." : undefined,
        promoCode: promoCode.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      total
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-[#14100D]">Checkout</h2>
        <p className="mt-1 text-sm text-[#14100D]/60">{branch.name}</p>
      </div>

      <div className="rounded-2xl border border-[#14100D]/10 bg-white p-5">
        {cart.lines.map((line) => (
          <div key={line.id} className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-[#14100D]/80">
              {line.quantity}× {line.menuItem.name}
              {line.variationLabel ? ` (${line.variationLabel})` : ""}
            </span>
            <span className="font-medium text-[#14100D]">{formatUgx(line.unitPrice * line.quantity)}</span>
          </div>
        ))}
        <div className="mt-3 flex items-center justify-between border-t border-[#14100D]/10 pt-3 text-sm">
          <span className="text-[#14100D]/60">Subtotal</span>
          <span className="text-[#14100D]">{formatUgx(cart.subtotal)}</span>
        </div>
        {channel === "delivery" && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#14100D]/60">
              Delivery fee{deliveryDistanceKm !== null ? ` (${deliveryDistanceKm.toFixed(1)} km)` : ""}
            </span>
            <span className={deliveryTooFar ? "font-semibold text-red-600" : "text-[#14100D]"}>
              {deliveryTooFar ? "Unavailable" : deliveryDistanceKm !== null ? formatUgx(deliveryFee) : "To be confirmed"}
            </span>
          </div>
        )}
        <div className="mt-1 flex items-center justify-between text-base font-semibold">
          <span className="text-[#14100D]">Total</span>
          <span className="text-[#14100D]">{formatUgx(total)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="checkout-name" className={FORM_LABEL_CLASSES}>
            Your Name
          </label>
          <input
            id="checkout-name"
            type="text"
            autoComplete="name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className={FORM_INPUT_CLASSES}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="checkout-guest-phone" className={FORM_LABEL_CLASSES}>
            Phone Number
          </label>
          <input
            id="checkout-guest-phone"
            type="tel"
            autoComplete="tel"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className={FORM_INPUT_CLASSES}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={FORM_LABEL_CLASSES}>How Would You Like Your Order?</span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setChannel("pickup")}
            className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
              channel === "pickup" ? "border-[#C89A4B] bg-[#C89A4B]/10 text-[#14100D]" : "border-[#14100D]/15 text-[#14100D]/60"
            }`}
          >
            Pickup
          </button>
          <button
            type="button"
            onClick={() => setChannel("delivery")}
            className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
              channel === "delivery" ? "border-[#C89A4B] bg-[#C89A4B]/10 text-[#14100D]" : "border-[#14100D]/15 text-[#14100D]/60"
            }`}
          >
            Delivery
          </button>
        </div>
      </div>

      {channel === "delivery" && (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#14100D]/10 bg-[#F5EFE4]/50 p-5">
          <div>
            <p className={FORM_LABEL_CLASSES}>Delivery Location</p>
            <p className="mt-1 text-sm text-[#14100D]/60">
              Share your live location and we'll calculate the delivery fee from real road distance to the branch.
            </p>
          </div>

          {locationStatus === "granted" && deliveryDistanceKm !== null ? (
            deliveryTooFar ? (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <CircleAlert size={16} className="shrink-0" />
                Delivery location too far — about {deliveryDistanceKm.toFixed(1)} km from {branch.name}, outside our{" "}
                {MAX_DELIVERY_RADIUS_KM} km delivery radius. Please choose pickup instead.
                <button
                  type="button"
                  onClick={handleShareLocation}
                  className="ml-auto text-xs font-semibold underline underline-offset-4"
                >
                  Update
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <LocateFixed size={16} className="shrink-0" />
                Location shared — about {deliveryDistanceKm.toFixed(1)} km from {branch.name} ({formatUgx(deliveryFee)}
                ).
                <button
                  type="button"
                  onClick={handleShareLocation}
                  className="ml-auto text-xs font-semibold underline underline-offset-4"
                >
                  Update
                </button>
              </div>
            )
          ) : (
            <button
              type="button"
              onClick={handleShareLocation}
              disabled={locationStatus === "requesting"}
              className={getButtonClasses({ variant: "outline", tone: "light", size: "md", className: "disabled:opacity-60" })}
            >
              <LocateFixed size={16} className="mr-1.5" />
              {locationStatus === "requesting" ? "Getting Your Location…" : "Share My Location"}
            </button>
          )}

          {locationStatus === "error" && locationError && (
            <p role="alert" className="flex items-start gap-2 text-sm text-red-600">
              <CircleAlert size={16} className="mt-0.5 shrink-0" />
              {locationError}
            </p>
          )}

          {showManualAddress && !deliveryTooFar && (
            <p className="border-t border-[#14100D]/10 pt-3 text-xs text-[#14100D]/60">
              No problem — enter your delivery address below and our team will confirm the exact delivery fee by
              phone before your order is prepared.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="checkout-address" className={FORM_LABEL_CLASSES}>
              {deliveryDistanceKm !== null && !deliveryTooFar ? "Nearest Landmark (Optional)" : "Delivery Address"}
            </label>
            <input
              id="checkout-address"
              type="text"
              placeholder="e.g. blue gate opposite Total fuel station"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className={FORM_INPUT_CLASSES}
            />
            <p className="text-xs text-[#14100D]/50">
              {deliveryDistanceKm !== null && !deliveryTooFar
                ? "Helps the rider find you faster once they're close."
                : "Street, area, and a nearby landmark help our team confirm your fee and find you."}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="checkout-promo" className={FORM_LABEL_CLASSES}>
          Promo Code (Optional)
        </label>
        <input
          id="checkout-promo"
          type="text"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
          className={FORM_INPUT_CLASSES}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="checkout-notes" className={FORM_LABEL_CLASSES}>
          Notes (Optional)
        </label>
        <textarea
          id="checkout-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={`${FORM_INPUT_CLASSES} resize-none`}
        />
      </div>

      <p className="text-xs text-[#14100D]/50">
        Next, you'll choose a mobile money merchant code and confirm payment before your order is sent to the kitchen.
      </p>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className={getButtonClasses({ variant: "outline", tone: "light", size: "md" })}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={
            cart.lines.length === 0 ||
            (channel === "delivery" && deliveryTooFar) ||
            (channel === "delivery" && deliveryDistanceKm === null && !deliveryAddress.trim())
          }
          className={getButtonClasses({ variant: "solid", size: "md", className: "flex-1 disabled:opacity-60" })}
        >
          {`Continue To Payment — ${formatUgx(total)}`}
        </button>
      </div>
    </form>
  );
}
