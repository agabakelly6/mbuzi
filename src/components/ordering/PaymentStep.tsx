// src/components/ordering/PaymentStep.tsx
//
// The pay-first checkout step: the order isn't created in the database
// until the guest confirms payment here (see place_guest_order's
// p_payment_method param) — CheckoutPanel only collects details up to
// this point. Mobile money is the only functional option (reuses the
// same placeholder MERCHANT_PAYMENT_OPTIONS the booking page's
// PaymentOptions.astro already shows — informational only, no "Pay Now"
// button, no gateway; a guest dials the code themselves). Card is listed
// but disabled — no processor is integrated yet, and pretending
// otherwise would be dishonest. Confirming here creates the order at
// status 'pending' with a 'pending' payment; a cashier manually flips it
// to 'paid' once the money actually lands (OrdersDashboard.tsx's
// existing "Mark As Paid"), which is what the DB's
// enforce_payment_before_accept trigger gates kitchen prep on.
import { useState } from "react";
import { CreditCard, Smartphone } from "lucide-react";
import type { Branch } from "../../types/branch";
import type { Order } from "../../types/order";
import type { GuestOrderDraft } from "./CheckoutPanel";
import { supabaseOrderService } from "../../services/supabase/SupabaseOrderService";
import { MERCHANT_PAYMENT_OPTIONS } from "../../data/booking";
import { getButtonClasses } from "../../lib/button-variants";
import { formatUgx } from "../../lib/helpers";

interface PaymentStepProps {
  branch: Branch;
  details: GuestOrderDraft;
  total: number;
  onConfirmed: (order: Order) => void;
  onBack: () => void;
}

export function PaymentStep({ branch, details, total, onConfirmed, onBack }: PaymentStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirmPayment() {
    setError(null);
    setIsSubmitting(true);
    const result = await supabaseOrderService.placeGuestOrder({
      ...details,
      paymentMethod: "mobile_money",
    });
    setIsSubmitting(false);

    if (result.error || !result.data) {
      setError(result.error?.message ?? "Couldn't place your order. Please try again.");
      return;
    }

    onConfirmed(result.data);
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-[#14100D]">Payment</h2>
        <p className="mt-1 text-sm text-[#14100D]/60">{branch.name}</p>
      </div>

      <div className="rounded-2xl border border-[#14100D]/10 bg-white p-5">
        <div className="flex items-center justify-between text-base font-semibold">
          <span className="text-[#14100D]">Amount To Pay</span>
          <span className="text-[#14100D]">{formatUgx(total)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {MERCHANT_PAYMENT_OPTIONS.map((option) => (
          <div key={option.provider} className="rounded-2xl border border-[#C89A4B]/40 bg-[#C89A4B]/5 p-5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C89A4B]">
              <Smartphone size={13} />
              {option.provider}
            </p>
            <p className="mt-2 select-all font-mono text-2xl font-semibold tracking-wider text-[#14100D]">
              {option.merchantCode}
            </p>
            <p className="mt-1 text-xs text-[#14100D]/50">{option.merchantName}</p>
            <p className="mt-3 text-sm leading-relaxed text-[#14100D]/70">{option.instructions}</p>
          </div>
        ))}

        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[#14100D]/15 bg-[#14100D]/[0.02] p-5 opacity-60">
          <CreditCard size={18} className="text-[#14100D]/40" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-[#14100D]/60">Card</p>
            <p className="text-xs text-[#14100D]/40">Coming soon — not available yet.</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-[#14100D]/50">
        Send the payment using the details above, then confirm below. We'll notify the branch the moment it's
        confirmed on our side, and your order goes to the kitchen right after.
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
          disabled={isSubmitting}
          className={getButtonClasses({ variant: "outline", tone: "light", size: "md", className: "disabled:opacity-60" })}
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleConfirmPayment}
          disabled={isSubmitting}
          className={getButtonClasses({ variant: "solid", size: "md", className: "flex-1 disabled:opacity-60" })}
        >
          {isSubmitting ? "Confirming…" : "I've Sent The Payment — Confirm"}
        </button>
      </div>
    </div>
  );
}
