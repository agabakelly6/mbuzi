// src/components/ordering/OrderingApp.tsx
//
// Root of the customer-facing ordering page — a separate, self-contained
// React island. No login of any kind: per explicit decision, only staff
// have a login UI. A customer just browses the menu and states their
// name/phone at checkout (see CheckoutPanel.tsx) — no account, no
// AuthProvider, no NotificationBell (there's no persistent identity to
// notify). This replaces an earlier version that required a customer
// account to place an order.
import { useEffect, useState } from "react";
import { useOrderCart } from "../../hooks/useOrderCart";
import type { Branch } from "../../types/branch";
import type { Order } from "../../types/order";
import { supabaseBranchRepository } from "../../repositories/supabase/SupabaseBranchRepository";
import { MenuBrowser } from "./MenuBrowser";
import { CheckoutPanel, type GuestOrderDraft } from "./CheckoutPanel";
import { PaymentStep } from "./PaymentStep";
import { OrderStatusTracker } from "./OrderStatusTracker";

type Step = "browsing" | "checkout" | "payment" | "confirmed";

export function OrderingApp() {
  const cart = useOrderCart();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [step, setStep] = useState<Step>("browsing");
  const [pendingOrderDetails, setPendingOrderDetails] = useState<GuestOrderDraft | null>(null);
  const [pendingOrderTotal, setPendingOrderTotal] = useState(0);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Set from ?branch=<slug>&addItem=<name> when arriving via an
  // OrderNowButton on the public /menu page — resolved to a real branch
  // once `branches` loads below, and handed to MenuBrowser to auto-add
  // the matching live item the moment its (branch-scoped) menu loads.
  const [autoAddItemName, setAutoAddItemName] = useState<string | null>(null);

  useEffect(() => {
    supabaseBranchRepository.list({ pageSize: 50 }).then(({ data, error }) => {
      if (error) {
        setLoadError(error.message);
        return;
      }
      const loaded = data?.items ?? [];
      setBranches(loaded);

      const params = new URLSearchParams(window.location.search);
      const branchSlug = params.get("branch");
      const addItem = params.get("addItem");
      if (branchSlug) {
        const match = loaded.find((b) => b.slug === branchSlug);
        if (match) setSelectedBranch(match);
      }
      if (addItem) setAutoAddItemName(addItem);
    });
  }, []);

  if (loadError) {
    return <p className="text-center text-sm text-red-600">{loadError}</p>;
  }

  return (
    <div>
      {step === "confirmed" && confirmedOrder && (
        <div className="mx-auto max-w-lg rounded-2xl border border-[#14100D]/10 bg-white p-8 text-center">
          <h2 className="font-serif text-2xl font-semibold text-[#14100D]">Order Placed!</h2>
          <p className="mt-2 text-sm text-[#14100D]/60">
            Order <span className="font-semibold text-[#14100D]">{confirmedOrder.orderNumber}</span> has been sent to
            the branch.
          </p>
          <p className="mt-4 text-lg font-semibold text-[#14100D]">
            UGX {confirmedOrder.total.toLocaleString("en-UG")}
          </p>

          {confirmedOrder.guestPhone && (
            <OrderStatusTracker
              order={{ id: confirmedOrder.id, channel: confirmedOrder.channel, guestPhone: confirmedOrder.guestPhone }}
              initialStatus={confirmedOrder.status}
            />
          )}

          <button
            type="button"
            onClick={() => {
              setConfirmedOrder(null);
              setStep("browsing");
            }}
            className="mt-6 text-sm font-semibold text-[#C89A4B] underline underline-offset-4"
          >
            Place Another Order
          </button>
        </div>
      )}

      {step === "checkout" && selectedBranch && (
        <CheckoutPanel
          branch={selectedBranch}
          cart={cart}
          onDetailsConfirmed={(details, total) => {
            setPendingOrderDetails(details);
            setPendingOrderTotal(total);
            setStep("payment");
          }}
          onBack={() => setStep("browsing")}
        />
      )}

      {step === "payment" && selectedBranch && pendingOrderDetails && (
        <PaymentStep
          branch={selectedBranch}
          details={pendingOrderDetails}
          total={pendingOrderTotal}
          onConfirmed={(order) => {
            cart.clear();
            setConfirmedOrder(order);
            setStep("confirmed");
          }}
          onBack={() => setStep("checkout")}
        />
      )}

      {step === "browsing" && (
        <MenuBrowser
          branches={branches}
          selectedBranch={selectedBranch}
          onSelectBranch={setSelectedBranch}
          cart={cart}
          onProceedToCheckout={() => setStep("checkout")}
          autoAddItemName={autoAddItemName}
          onAutoAdded={() => setAutoAddItemName(null)}
        />
      )}
    </div>
  );
}
