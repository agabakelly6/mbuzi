// src/components/ordering/OrderingApp.tsx
//
// Root of the customer-facing ordering page — a separate, self-contained
// React island. Wraps AuthProvider itself (contexts/AuthContext.tsx)
// rather than requiring a site-wide provider tree, since nothing else on
// the marketing site uses it yet; this is the first screen that does.
// Doesn't use BranchContext — the branch being ordered from is this
// page's own local selection state, not "which branch is the signed-in
// staff member assigned to" (BranchContext's actual purpose).
import { useEffect, useState } from "react";
import { AuthProvider } from "../../contexts/AuthContext";
import { useAuth } from "../../hooks/useAuth";
import { useAuthBootstrap } from "../../hooks/useAuthBootstrap";
import { useOrderCart } from "../../hooks/useOrderCart";
import type { Branch } from "../../types/branch";
import type { Customer } from "../../types/customer";
import type { Order } from "../../types/order";
import { supabaseBranchRepository } from "../../repositories/supabase/SupabaseBranchRepository";
import { supabaseCustomerRepository } from "../../repositories/supabase/SupabaseCustomerRepository";
import { AuthGate } from "./AuthGate";
import { MenuBrowser } from "./MenuBrowser";
import { CheckoutPanel } from "./CheckoutPanel";

type Step = "browsing" | "checkout" | "confirmed";

function OrderingFlow() {
  useAuthBootstrap();
  const { user, isAuthenticated, role } = useAuth();
  const cart = useOrderCart();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [step, setStep] = useState<Step>("browsing");
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    supabaseBranchRepository.list({ pageSize: 50 }).then(({ data, error }) => {
      if (error) {
        setLoadError(error.message);
        return;
      }
      setBranches(data?.items ?? []);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setCustomer(null);
      return;
    }
    supabaseCustomerRepository.findByUserId(user.id).then(({ data }) => {
      setCustomer(data);
    });
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div>
        <p className="mb-6 text-center text-sm text-[#14100D]/60">
          Sign in or create an account to place an order — we'll remember your details for next time.
        </p>
        <AuthGate />
      </div>
    );
  }

  // A staff/owner account signed into their own work login shouldn't be
  // dropped into the ordering flow — this page is for customers.
  if (role !== "customer") {
    return (
      <p className="mx-auto max-w-md text-center text-sm text-[#14100D]/60">
        This account isn't set up for ordering. Sign in with a customer account instead.
      </p>
    );
  }

  if (loadError) {
    return <p className="text-center text-sm text-red-600">{loadError}</p>;
  }

  if (!customer) {
    return <p className="text-center text-sm text-[#14100D]/60">Loading your account…</p>;
  }

  if (step === "confirmed" && confirmedOrder) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-[#14100D]/10 bg-white p-8 text-center">
        <h2 className="font-serif text-2xl font-semibold text-[#14100D]">Order Placed!</h2>
        <p className="mt-2 text-sm text-[#14100D]/60">
          Order <span className="font-semibold text-[#14100D]">{confirmedOrder.orderNumber}</span> has been sent to the
          branch.
        </p>
        <p className="mt-4 text-lg font-semibold text-[#14100D]">
          UGX {confirmedOrder.total.toLocaleString("en-UG")}
        </p>
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
    );
  }

  if (step === "checkout" && selectedBranch) {
    return (
      <CheckoutPanel
        branch={selectedBranch}
        customer={customer}
        cart={cart}
        onOrderPlaced={(order) => {
          setConfirmedOrder(order);
          setStep("confirmed");
        }}
        onBack={() => setStep("browsing")}
      />
    );
  }

  return (
    <MenuBrowser
      branches={branches}
      selectedBranch={selectedBranch}
      onSelectBranch={setSelectedBranch}
      cart={cart}
      onProceedToCheckout={() => setStep("checkout")}
    />
  );
}

export function OrderingApp() {
  return (
    <AuthProvider>
      <OrderingFlow />
    </AuthProvider>
  );
}
