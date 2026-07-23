// src/components/ordering/CheckoutPanel.tsx
//
// Pickup and delivery only — dine-in is deliberately out of this first
// slice (it needs a restaurant_table selection, a separate feature this
// page doesn't build). Ends at "order placed"; payment collection is a
// staff/cashier action once the order is accepted, not part of checkout —
// there's no payment gateway integration to collect a merchant-code
// payment from a customer directly yet.
import { useState, type SyntheticEvent } from "react";
import type { Branch } from "../../types/branch";
import type { Customer } from "../../types/customer";
import type { Order, OrderChannel } from "../../types/order";
import type { UseOrderCartResult } from "../../hooks/useOrderCart";
import { supabaseOrderService } from "../../services/supabase/SupabaseOrderService";
import { DELIVERY_ZONES } from "../../data/delivery";
import { getButtonClasses } from "../../lib/button-variants";
import { FORM_INPUT_CLASSES, FORM_LABEL_CLASSES } from "../../lib/constants";

function formatUgx(amount: number): string {
  return `UGX ${amount.toLocaleString("en-UG")}`;
}

interface CheckoutPanelProps {
  branch: Branch;
  customer: Customer;
  cart: UseOrderCartResult;
  onOrderPlaced: (order: Order) => void;
  onBack: () => void;
}

export function CheckoutPanel({ branch, customer, cart, onOrderPlaced, onBack }: CheckoutPanelProps) {
  const [channel, setChannel] = useState<Extract<OrderChannel, "pickup" | "delivery">>("pickup");
  const [deliveryZoneId, setDeliveryZoneId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState(customer.defaultDeliveryAddress ?? "");
  const [deliveryPhone, setDeliveryPhone] = useState(customer.phone);
  const [promoCode, setPromoCode] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deliveryFee = channel === "delivery" ? DELIVERY_ZONES.find((z) => z.id === deliveryZoneId)?.fee ?? 0 : 0;
  const total = cart.subtotal + deliveryFee;

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (channel === "delivery" && (!deliveryZoneId || !deliveryAddress || !deliveryPhone)) {
      setError("Fill in your delivery zone, address, and phone number.");
      return;
    }

    setIsSubmitting(true);
    const result = await supabaseOrderService.placeOrder({
      branchId: branch.id,
      customerId: customer.id,
      channel,
      items: cart.lines.map((line) => ({
        menuItemId: line.menuItem.id,
        variationLabel: line.variationLabel,
        quantity: line.quantity,
        specialInstructions: line.specialInstructions,
      })),
      deliveryZoneId: channel === "delivery" ? deliveryZoneId : undefined,
      deliveryAddress: channel === "delivery" ? deliveryAddress : undefined,
      deliveryPhone: channel === "delivery" ? deliveryPhone : undefined,
      promoCode: promoCode.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setIsSubmitting(false);

    if (result.error || !result.data) {
      setError(result.error?.message ?? "Couldn't place your order. Please try again.");
      return;
    }

    cart.clear();
    onOrderPlaced(result.data);
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
          <div className="flex flex-col gap-1.5">
            <label htmlFor="checkout-phone" className={FORM_LABEL_CLASSES}>
              Contact Phone
            </label>
            <input
              id="checkout-phone"
              type="tel"
              value={deliveryPhone}
              onChange={(e) => setDeliveryPhone(e.target.value)}
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
        Pay by mobile money merchant code{channel === "pickup" ? " or cash" : ""} when your order{" "}
        {channel === "pickup" ? "is ready" : "arrives"} — nothing is charged now.
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
          disabled={isSubmitting || cart.lines.length === 0}
          className={getButtonClasses({ variant: "solid", size: "md", className: "flex-1 disabled:opacity-60" })}
        >
          {isSubmitting ? "Placing Order…" : `Place Order — ${formatUgx(total)}`}
        </button>
      </div>
    </form>
  );
}
