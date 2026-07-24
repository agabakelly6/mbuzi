// src/components/ordering/OrderStatusTracker.tsx
//
// Live status tracker for the guest confirmation screen — polls
// get_guest_order_status every 5s rather than a true Realtime push
// subscription. Anonymous Realtime subscriptions need their own RLS/
// authorization handling this project hasn't set up yet, and a 5s poll
// is imperceptible for "is my order ready" — not worth the extra risk
// right before a live demo. Stops polling once the order reaches a
// terminal status (completed/delivered/cancelled/rejected).
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, XCircle } from "lucide-react";
import type { Order, OrderStatus } from "../../types/order";
import { supabaseOrderService } from "../../services/supabase/SupabaseOrderService";

const POLL_INTERVAL_MS = 5000;

const PICKUP_STEPS: OrderStatus[] = ["pending", "accepted", "preparing", "ready", "completed"];
const DELIVERY_STEPS: OrderStatus[] = ["pending", "accepted", "preparing", "ready", "out_for_delivery", "delivered"];

const STEP_LABELS: Partial<Record<OrderStatus, string>> = {
  pending: "Received",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Picked Up",
  out_for_delivery: "Out For Delivery",
  delivered: "Delivered",
};

const TERMINAL_STATUSES: OrderStatus[] = ["completed", "delivered", "cancelled", "rejected"];

interface OrderStatusTrackerProps {
  order: Pick<Order, "id" | "channel"> & { guestPhone: string };
  initialStatus: OrderStatus;
}

export function OrderStatusTracker({ order, initialStatus }: OrderStatusTrackerProps) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);

  useEffect(() => {
    if (TERMINAL_STATUSES.includes(status)) return;

    const interval = setInterval(async () => {
      const result = await supabaseOrderService.getGuestOrderStatus(order.id, order.guestPhone);
      if (result.data) setStatus(result.data.status);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [order.id, order.guestPhone, status]);

  if (status === "cancelled" || status === "rejected") {
    return (
      <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600">
        <XCircle size={18} strokeWidth={2} />
        This order was {status === "cancelled" ? "cancelled" : "not accepted"}. Contact the branch if you have questions.
      </div>
    );
  }

  const steps = order.channel === "delivery" ? DELIVERY_STEPS : PICKUP_STEPS;
  const currentIndex = steps.indexOf(status);

  return (
    <div className="mt-6">
      <div className="flex items-center">
        {steps.map((step, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={step} className="flex flex-1 flex-col items-center last:flex-none">
              <div className="flex w-full items-center">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isDone
                      ? "border-[#C89A4B] bg-[#C89A4B] text-white"
                      : isCurrent
                        ? "border-[#C89A4B] bg-white text-[#C89A4B]"
                        : "border-[#14100D]/15 bg-white text-[#14100D]/25"
                  }`}
                >
                  {isDone ? <CheckCircle2 size={16} strokeWidth={2.5} /> : <Circle size={10} fill="currentColor" strokeWidth={0} />}
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 transition-colors ${isDone ? "bg-[#C89A4B]" : "bg-[#14100D]/10"}`} />
                )}
              </div>
              <p className={`mt-1.5 text-center text-[10px] font-semibold uppercase tracking-wide ${isCurrent ? "text-[#C89A4B]" : isDone ? "text-[#14100D]/70" : "text-[#14100D]/30"}`}>
                {STEP_LABELS[step]}
              </p>
            </div>
          );
        })}
      </div>
      {!TERMINAL_STATUSES.includes(status) && (
        <p className="mt-4 text-center text-xs text-[#14100D]/40">Updating automatically — no need to refresh.</p>
      )}
    </div>
  );
}
