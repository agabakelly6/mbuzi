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
import { useState, type SyntheticEvent } from "react";
import type { Branch } from "../../types/branch";
import type { OrderChannel } from "../../types/order";
import type { UseOrderCartResult } from "../../hooks/useOrderCart";
import type { CreateGuestOrderInput } from "../../validators/order.schema";
import { DELIVERY_ZONES } from "../../data/delivery";
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
  const [deliveryZoneId, setDeliveryZoneId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const deliveryFee = channel === "delivery" ? DELIVERY_ZONES.find((z) => z.id === deliveryZoneId)?.fee ?? 0 : 0;
  const total = cart.subtotal + deliveryFee;

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!guestName.trim() || !guestPhone.trim()) {
      setError("Enter your name and phone number.");
      return;
    }
    if (channel === "delivery" && (!deliveryZoneId || !deliveryAddress)) {
      setError("Fill in your delivery zone and address.");
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
        deliveryZoneId: channel === "delivery" ? deliveryZoneId : undefined,
        deliveryAddress: channel === "delivery" ? deliveryAddress : undefined,
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
            <span className="text-[#14100D]/60">Delivery fee</span>
            <span className="text-[#14100D]">{formatUgx(deliveryFee)}</span>
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
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="checkout-zone" className={FORM_LABEL_CLASSES}>
              Delivery Zone
            </label>
            <select
              id="checkout-zone"
              value={deliveryZoneId}
              onChange={(e) => setDeliveryZoneId(e.target.value)}
              className={FORM_INPUT_CLASSES}
            >
              <option value="">Select the band closest to you…</option>
              {DELIVERY_ZONES.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.label} — {formatUgx(zone.fee)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="checkout-address" className={FORM_LABEL_CLASSES}>
              Delivery Address
            </label>
            <input
              id="checkout-address"
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className={FORM_INPUT_CLASSES}
            />
          </div>
        </>
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
          disabled={cart.lines.length === 0}
          className={getButtonClasses({ variant: "solid", size: "md", className: "flex-1 disabled:opacity-60" })}
        >
          {`Continue To Payment — ${formatUgx(total)}`}
        </button>
      </div>
    </form>
  );
}
