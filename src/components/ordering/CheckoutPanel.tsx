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
// Delivery fee is calculated from real distance (haversine, lib/geo.ts)
// between the branch's coordinates and the customer's shared live
// location — not the old flat "pick your distance band" picker
// (data/delivery.ts's DELIVERY_ZONES, no longer used here). Live
// location is required for delivery; there's no typed-address fallback
// since there's no geocoding to turn free text into a distance.
import { useState, type SyntheticEvent } from "react";
import { LocateFixed, CircleAlert } from "lucide-react";
import type { Branch } from "../../types/branch";
import type { OrderChannel } from "../../types/order";
import type { UseOrderCartResult } from "../../hooks/useOrderCart";
import type { CreateGuestOrderInput } from "../../validators/order.schema";
import { haversineDistanceKm, calculateDeliveryFee } from "../../lib/geo";
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
  const [deliveryLandmark, setDeliveryLandmark] = useState("");
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "granted" | "error">("idle");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const deliveryFee = channel === "delivery" && deliveryDistanceKm !== null ? calculateDeliveryFee(deliveryDistanceKm) : 0;
  const total = cart.subtotal + deliveryFee;

  function handleShareLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationError("Location sharing isn't available on this device or browser.");
      return;
    }
    if (branch.latitude === null || branch.longitude === null) {
      setLocationStatus("error");
      setLocationError("This branch doesn't have delivery coordinates set up yet — please choose pickup instead.");
      return;
    }
    setLocationStatus("requesting");
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const distanceKm = haversineDistanceKm(
          branch.latitude as number,
          branch.longitude as number,
          position.coords.latitude,
          position.coords.longitude
        );
        setDeliveryDistanceKm(distanceKm);
        setLocationStatus("granted");
      },
      (geoError) => {
        setLocationStatus("error");
        setLocationError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location permission was denied. Allow location access to get a delivery quote, or choose pickup instead."
            : "Couldn't get your location. Please try again."
        );
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!guestName.trim() || !guestPhone.trim()) {
      setError("Enter your name and phone number.");
      return;
    }
    if (channel === "delivery" && deliveryDistanceKm === null) {
      setError("Share your live location so we can calculate the delivery fee.");
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
        deliveryZoneId: channel === "delivery" ? `${(deliveryDistanceKm as number).toFixed(1)} km` : undefined,
        deliveryDistanceKm: channel === "delivery" ? (deliveryDistanceKm as number) : undefined,
        // deliveries.address is NOT NULL in the DB — the landmark field
        // above is optional from the customer's side, but this still
        // needs a real value to send, since GPS coordinates alone aren't
        // stored anywhere on the delivery row today.
        deliveryAddress:
          channel === "delivery"
            ? deliveryLandmark.trim() || "No landmark provided — location shared via GPS."
            : undefined,
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
            <span className="text-[#14100D]">
              {deliveryDistanceKm !== null ? formatUgx(deliveryFee) : "Share location below"}
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
              Share your live location and we'll calculate the delivery fee from the branch to you.
            </p>
          </div>

          {locationStatus === "granted" && deliveryDistanceKm !== null ? (
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

          <div className="flex flex-col gap-1.5">
            <label htmlFor="checkout-landmark" className={FORM_LABEL_CLASSES}>
              Nearest Landmark (Optional)
            </label>
            <input
              id="checkout-landmark"
              type="text"
              placeholder="e.g. blue gate opposite Total fuel station"
              value={deliveryLandmark}
              onChange={(e) => setDeliveryLandmark(e.target.value)}
              className={FORM_INPUT_CLASSES}
            />
            <p className="text-xs text-[#14100D]/50">Helps the rider find you faster once they're close.</p>
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
          disabled={cart.lines.length === 0 || (channel === "delivery" && deliveryDistanceKm === null)}
          className={getButtonClasses({ variant: "solid", size: "md", className: "flex-1 disabled:opacity-60" })}
        >
          {`Continue To Payment — ${formatUgx(total)}`}
        </button>
      </div>
    </form>
  );
}
