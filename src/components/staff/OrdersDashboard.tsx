// src/components/staff/OrdersDashboard.tsx
//
// Live order board for one branch — the piece that was missing entirely:
// until now, an order placed through /order had nowhere to be seen or
// acted on by staff. Every action here goes through the same
// SupabaseOrderService/SupabasePaymentService already built and tested
// against the live project, not new logic.
import { useEffect, useState } from "react";
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

const STATUS_TONE: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-blue-100 text-blue-800",
  preparing: "bg-blue-100 text-blue-800",
  ready: "bg-emerald-100 text-emerald-800",
  served: "bg-emerald-100 text-emerald-800",
  out_for_delivery: "bg-emerald-100 text-emerald-800",
  delivered: "bg-emerald-100 text-emerald-800",
  completed: "bg-[#14100D]/10 text-[#14100D]/70",
  cancelled: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
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
      <div className="flex flex-col gap-3">
        <h2 className="font-serif text-lg font-semibold text-[#14100D]">
          Orders {role === "owner" && branches.find((b) => b.id === branchId)?.name}
        </h2>
        {orders.length === 0 && <p className="text-sm text-[#14100D]/50">No orders yet.</p>}
        {orders.map((order) => (
          <button
            key={order.id}
            type="button"
            onClick={() => setSelectedOrderId(order.id)}
            className={`flex items-center justify-between rounded-xl border p-4 text-left transition-colors ${
              selectedOrderId === order.id ? "border-[#C89A4B] bg-[#C89A4B]/5" : "border-[#14100D]/10 bg-white"
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-[#14100D]">{order.orderNumber}</p>
              <p className="text-xs text-[#14100D]/50">
                {order.channel} · {order.items.length} item{order.items.length === 1 ? "" : "s"} · {formatUgx(order.total)}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] ${STATUS_TONE[order.status]}`}>
              {STATUS_LABELS[order.status]}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[#14100D]/10 bg-white p-6">
        {!selectedOrder && <p className="text-sm text-[#14100D]/50">Select an order to view details.</p>}

        {selectedOrder && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#14100D]">{selectedOrder.orderNumber}</h3>
              <p className="text-sm text-[#14100D]/50">
                {selectedOrder.channel} · {STATUS_LABELS[selectedOrder.status]}
              </p>
            </div>

            <div>
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-[#14100D]/80">
                    {item.quantity}× {item.nameSnapshot}
                    {item.variationLabel ? ` (${item.variationLabel})` : ""}
                  </span>
                  <span className="text-[#14100D]">{formatUgx(item.subtotal)}</span>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-[#14100D]/10 pt-2 text-sm font-semibold">
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
                  className="rounded-full border border-red-200 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-red-600 transition-colors hover:border-red-400"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="border-t border-[#14100D]/10 pt-4">
              <h4 className="text-sm font-semibold text-[#14100D]">Payments</h4>
              {payments.length === 0 && <p className="mt-1 text-xs text-[#14100D]/50">No payments recorded yet.</p>}
              {payments.map((payment) => (
                <div key={payment.id} className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-[#14100D]/70">
                    {payment.method} · {payment.status}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#14100D]">{formatUgx(payment.amount)}</span>
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
      </div>
    </div>
  );
}
