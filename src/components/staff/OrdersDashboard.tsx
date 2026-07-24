// src/components/staff/OrdersDashboard.tsx
//
// Live order board for one branch — the piece that was missing entirely:
// until now, an order placed through /order had nowhere to be seen or
// acted on by staff. Every action here goes through the same
// SupabaseOrderService/SupabasePaymentService already built and tested
// against the live project, not new logic.
import { useEffect, useState } from "react";
import { ClipboardList, Store, Truck, UtensilsCrossed, Wallet, Receipt, Ban } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import type { Branch } from "../../types/branch";
import type { Order, OrderStatus } from "../../types/order";
import type { Payment, PaymentMethod } from "../../types/payment";
import { supabaseBranchRepository } from "../../repositories/supabase/SupabaseBranchRepository";
import { supabaseOrderRepository } from "../../repositories/supabase/SupabaseOrderRepository";
import { supabaseOrderService } from "../../services/supabase/SupabaseOrderService";
import { supabasePaymentRepository } from "../../repositories/supabase/SupabasePaymentRepository";
import { supabasePaymentService } from "../../services/supabase/SupabasePaymentService";
import { ORDER_STATUS_TRANSITIONS } from "../../lib/state-machines";
import { canRoleTransitionOrder, isOrderCancellable } from "../../models/OrderModel";
import { getAllowedPaymentMethods } from "../../models/PaymentModel";
import { getButtonClasses } from "../../lib/button-variants";
import { FORM_INPUT_CLASSES, FORM_LABEL_CLASSES } from "../../lib/constants";
import { formatUgx } from "../../lib/helpers";
import { DashboardCard } from "./DashboardCard";
import { StatusPill, type PillTone } from "./StatusPill";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  out_for_delivery: "Out For Delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

const STATUS_TONE: Record<OrderStatus, PillTone> = {
  pending: "amber",
  accepted: "blue",
  preparing: "blue",
  ready: "emerald",
  served: "emerald",
  out_for_delivery: "emerald",
  delivered: "emerald",
  completed: "neutral",
  cancelled: "red",
  rejected: "red",
};

const CHANNEL_ICON: Record<Order["channel"], typeof Store> = {
  pickup: Store,
  delivery: Truck,
  dine_in: UtensilsCrossed,
  whatsapp: ClipboardList,
};

export function OrdersDashboard() {
  const { role, branchId: ownBranchId } = useAuth();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<string | null>(ownBranchId);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Owner has no branchId of their own — needs a branch picker. Everyone
  // else is locked to the branch on their own account (matches RLS, which
  // would reject anything else anyway).
  useEffect(() => {
    if (role === "owner") {
      supabaseBranchRepository.list({ pageSize: 50 }).then(({ data }) => setBranches(data?.items ?? []));
    }
  }, [role]);

  useEffect(() => {
    if (!branchId) return;

    let isMounted = true;
    supabaseOrderRepository.list({ branchId, pageSize: 50, sortBy: "created_at", sortDirection: "desc" }).then(({ data }) => {
      if (isMounted && data) setOrders(data.items);
    });

    const unsubscribe = supabaseOrderRepository.subscribe({ branchId }, (updated) => {
      if (!isMounted) return;
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === updated.id);
        return exists ? prev.map((o) => (o.id === updated.id ? updated : o)) : [updated, ...prev];
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [branchId]);

  useEffect(() => {
    if (!selectedOrderId) {
      setPayments([]);
      return;
    }
    supabasePaymentRepository.list({ orderId: selectedOrderId }).then(({ data }) => setPayments(data?.items ?? []));
  }, [selectedOrderId]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) ?? null;

  // The <select> below only lists methods allowed for the order's channel
  // (e.g. delivery orders only allow mobile_money). If the current
  // paymentMethod state isn't one of them, the browser silently renders
  // its first option while React's state stays on the old value — so on
  // submit the wrong method gets sent. Keep state in sync with whatever's
  // actually selectable.
  useEffect(() => {
    if (!selectedOrder) return;
    const allowed = getAllowedPaymentMethods(selectedOrder.channel);
    if (!allowed.includes(paymentMethod)) {
      setPaymentMethod(allowed[0]);
    }
  }, [selectedOrder?.channel]);

  async function handleTransition(order: Order, to: OrderStatus) {
    setActionError(null);
    if (!role) return;
    const result = await supabaseOrderService.transitionStatus(order.id, to, role);
    if (result.error) {
      setActionError(result.error.message);
      return;
    }
    if (result.data) setOrders((prev) => prev.map((o) => (o.id === order.id ? result.data! : o)));
  }

  async function handleCancel(order: Order) {
    setActionError(null);
    if (!role) return;
    const reason = window.prompt("Reason for cancelling this order?");
    if (!reason) return;
    const result = await supabaseOrderService.cancelOrder(order.id, { reason }, role);
    if (result.error) {
      setActionError(result.error.message);
      return;
    }
    if (result.data) setOrders((prev) => prev.map((o) => (o.id === order.id ? result.data! : o)));
  }

  async function handleCollectPayment(order: Order) {
    setActionError(null);
    setIsSubmittingPayment(true);
    const result = await supabasePaymentService.collectPayment({
      branchId: order.branchId,
      orderId: order.id,
      method: paymentMethod,
      amount: order.total,
      currency: "UGX",
    });
    setIsSubmittingPayment(false);
    if (result.error) {
      setActionError(result.error.message);
      return;
    }
    if (result.data) setPayments((prev) => [result.data!, ...prev]);
  }

  // No payment gateway exists to auto-confirm a mobile money payment (see
  // SupabasePaymentService's header comment) — this is the manual stand-in:
  // staff checks their own merchant SMS/app for the money, then confirms it
  // here. Same trust model already used for cash, just one extra step
  // because mobile money isn't handed over in person.
  async function handleMarkPaymentPaid(payment: Payment) {
    setActionError(null);
    const result = await supabasePaymentRepository.updateStatus(payment.id, "paid");
    if (result.error) {
      setActionError(result.error.message);
      return;
    }
    if (result.data) setPayments((prev) => prev.map((p) => (p.id === payment.id ? result.data! : p)));
  }

  if (role === "owner" && !branchId) {
    return (
      <div className="mx-auto max-w-sm">
        <label htmlFor="dashboard-branch" className={FORM_LABEL_CLASSES}>
          Select A Branch
        </label>
        <select
          id="dashboard-branch"
          className={`${FORM_INPUT_CLASSES} mt-1.5`}
          onChange={(e) => setBranchId(e.target.value || null)}
          defaultValue=""
        >
          <option value="">Choose…</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (!branchId) {
    return <p className="text-center text-sm text-[#14100D]/60">Your account isn't assigned to a branch.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
      <DashboardCard
        title={`Orders${role === "owner" ? ` — ${branches.find((b) => b.id === branchId)?.name ?? ""}` : ""}`}
        icon={ClipboardList}
        className="lg:self-start"
      >
        <div className="flex flex-col gap-2.5">
          {orders.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#14100D]/15 py-10 text-center">
              <ClipboardList size={24} className="text-[#14100D]/25" />
              <p className="text-sm text-[#14100D]/50">No orders yet.</p>
            </div>
          )}
          {orders.map((order) => {
            const ChannelIcon = CHANNEL_ICON[order.channel];
            const isSelected = selectedOrderId === order.id;
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelectedOrderId(order.id)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-[#C89A4B] bg-[#C89A4B]/6 shadow-[0_8px_20px_-14px_rgba(200,154,75,0.6)]"
                    : "border-[#14100D]/10 bg-white hover:border-[#14100D]/20"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isSelected ? "bg-[#C89A4B] text-white" : "bg-[#14100D]/5 text-[#14100D]/60"
                  }`}
                >
                  <ChannelIcon size={16} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#14100D]">{order.orderNumber}</p>
                  <p className="truncate text-xs text-[#14100D]/50">
                    {order.channel} · {order.items.length} item{order.items.length === 1 ? "" : "s"} · {formatUgx(order.total)}
                  </p>
                </div>
                <StatusPill label={STATUS_LABELS[order.status]} tone={STATUS_TONE[order.status]} />
              </button>
            );
          })}
        </div>
      </DashboardCard>

      <DashboardCard title={selectedOrder ? selectedOrder.orderNumber : "Order Details"} icon={Receipt}>
        {!selectedOrder && <p className="text-sm text-[#14100D]/50">Select an order to view details.</p>}

        {selectedOrder && (
          <div className="flex flex-col gap-5">
            <StatusPill label={STATUS_LABELS[selectedOrder.status]} tone={STATUS_TONE[selectedOrder.status]} className="w-fit" />

            <div className="rounded-xl bg-[#F5EFE4]/60 p-4">
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-[#14100D]/80">
                    {item.quantity}× {item.nameSnapshot}
                    {item.variationLabel ? ` (${item.variationLabel})` : ""}
                  </span>
                  <span className="text-[#14100D]">{formatUgx(item.subtotal)}</span>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-[#14100D]/10 pt-2 text-sm font-semibold text-[#14100D]">
                <span>Total</span>
                <span>{formatUgx(selectedOrder.total)}</span>
              </div>
            </div>

            {actionError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{actionError}</p>}

            <div className="flex flex-wrap gap-2">
              {role &&
                ORDER_STATUS_TRANSITIONS[selectedOrder.status]
                  .filter((to) => to !== "cancelled" && role && canRoleTransitionOrder(role, selectedOrder, to))
                  .map((to) => (
                    <button
                      key={to}
                      type="button"
                      onClick={() => handleTransition(selectedOrder, to)}
                      className={getButtonClasses({ variant: "outline", tone: "light", size: "sm" })}
                    >
                      Mark {STATUS_LABELS[to]}
                    </button>
                  ))}
              {isOrderCancellable(selectedOrder) && role && canRoleTransitionOrder(role, selectedOrder, "cancelled") && (
                <button
                  type="button"
                  onClick={() => handleCancel(selectedOrder)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-red-600 transition-colors hover:border-red-400 hover:bg-red-50"
                >
                  <Ban size={13} strokeWidth={2.25} />
                  Cancel
                </button>
              )}
            </div>

            <div className="border-t border-[#14100D]/10 pt-4">
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-[#14100D]">
                <Wallet size={15} className="text-[#C89A4B]" />
                Payments
              </h4>
              {payments.length === 0 && <p className="mt-1 text-xs text-[#14100D]/50">No payments recorded yet.</p>}
              {payments.map((payment) => (
                <div key={payment.id} className="mt-2 flex items-center justify-between rounded-lg bg-[#F5EFE4]/60 px-3 py-2 text-sm">
                  <span className="text-[#14100D]/70">
                    {payment.method === "mobile_money" ? "Mobile Money" : "Cash"} · {payment.status}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-[#14100D]">{formatUgx(payment.amount)}</span>
                    {payment.method === "mobile_money" && payment.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => handleMarkPaymentPaid(payment)}
                        className="text-xs font-semibold text-[#C89A4B] underline underline-offset-4"
                      >
                        Mark As Paid
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="mt-3 flex items-center gap-2">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className={`${FORM_INPUT_CLASSES} flex-1`}
                >
                  {getAllowedPaymentMethods(selectedOrder.channel).map((method) => (
                    <option key={method} value={method}>
                      {method === "mobile_money" ? "Merchant Code (Mobile Money)" : "Cash"}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={isSubmittingPayment}
                  onClick={() => handleCollectPayment(selectedOrder)}
                  className={getButtonClasses({ variant: "solid", size: "sm", className: "disabled:opacity-60" })}
                >
                  {isSubmittingPayment ? "Recording…" : "Collect"}
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
