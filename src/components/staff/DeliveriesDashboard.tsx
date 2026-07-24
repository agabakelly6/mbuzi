// src/components/staff/DeliveriesDashboard.tsx
//
// Shared by two roles with different scopes, not two separate components:
// a rider sees only their own assigned deliveries (matching the RLS
// policy, which restricts them the same way) and can only progress
// status; a branch_manager/owner sees every delivery for the branch and
// can also assign a rider. The delivery record itself is still created
// automatically by SupabaseOrderService.placeOrder when a delivery order
// is placed — nothing here creates one.
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import type { Branch } from "../../types/branch";
import type { Delivery, DeliveryStatus } from "../../types/delivery";
import type { User } from "../../types/user";
import { supabaseBranchRepository } from "../../repositories/supabase/SupabaseBranchRepository";
import { supabaseDeliveryRepository } from "../../repositories/supabase/SupabaseDeliveryRepository";
import { supabaseDeliveryService } from "../../services/supabase/SupabaseDeliveryService";
import { supabaseUserRepository } from "../../repositories/supabase/SupabaseUserRepository";
import { canTransitionDelivery, canReassignRider } from "../../models/DeliveryModel";
import { DELIVERY_STATUS_TRANSITIONS } from "../../lib/state-machines";
import { getButtonClasses } from "../../lib/button-variants";
import { FORM_INPUT_CLASSES, FORM_LABEL_CLASSES } from "../../lib/constants";
import { formatUgx } from "../../lib/helpers";

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  unassigned: "Unassigned",
  assigned: "Assigned",
  picked_up: "Picked Up",
  en_route: "En Route",
  delivered: "Delivered",
  failed: "Failed",
  cancelled: "Cancelled",
};

export function DeliveriesDashboard() {
  const { user, role, branchId: ownBranchId } = useAuth();
  const isRider = role === "rider";

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<string | null>(ownBranchId);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [riders, setRiders] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role === "owner") {
      supabaseBranchRepository.list({ pageSize: 50 }).then(({ data }) => setBranches(data?.items ?? []));
    }
  }, [role]);

  useEffect(() => {
    if (isRider) {
      if (!user) return;
      supabaseDeliveryRepository.list({ riderId: user.id, pageSize: 50 }).then(({ data }) => setDeliveries(data?.items ?? []));
      const unsubscribe = supabaseDeliveryRepository.subscribe({ riderId: user.id }, (updated) => {
        setDeliveries((prev) => (prev.some((d) => d.id === updated.id) ? prev.map((d) => (d.id === updated.id ? updated : d)) : [updated, ...prev]));
      });
      return unsubscribe;
    }

    if (!branchId) return;
    supabaseDeliveryRepository.list({ branchId, pageSize: 50 }).then(({ data }) => setDeliveries(data?.items ?? []));
    supabaseUserRepository.list({ branchId, role: "rider", pageSize: 50 }).then(({ data }) => setRiders(data?.items ?? []));
    const unsubscribe = supabaseDeliveryRepository.subscribe({ branchId }, (updated) => {
      setDeliveries((prev) => (prev.some((d) => d.id === updated.id) ? prev.map((d) => (d.id === updated.id ? updated : d)) : [updated, ...prev]));
    });
    return unsubscribe;
  }, [isRider, user, branchId]);

  async function handleAssign(delivery: Delivery, riderId: string) {
    if (!riderId) return;
    setError(null);
    const result = await supabaseDeliveryService.assignRider(delivery.id, riderId);
    if (result.error) setError(result.error.message);
  }

  async function handleTransition(delivery: Delivery, to: DeliveryStatus) {
    setError(null);
    const result = await supabaseDeliveryService.transitionStatus(delivery.id, to);
    if (result.error) setError(result.error.message);
  }

  if (!isRider && role === "owner" && !branchId) {
    return (
      <div className="mx-auto max-w-sm">
        <label htmlFor="deliveries-branch" className={FORM_LABEL_CLASSES}>
          Select A Branch
        </label>
        <select
          id="deliveries-branch"
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

  return (
    <div>
      <h2 className="mb-4 font-serif text-lg font-semibold text-[#14100D]">
        {isRider ? "My Deliveries" : "Deliveries"}
      </h2>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      {deliveries.length === 0 && <p className="text-sm text-[#14100D]/50">Nothing here right now.</p>}

      <div className="flex flex-col gap-3">
        {deliveries.map((delivery) => (
          <div key={delivery.id} className="rounded-2xl border border-[#14100D]/10 bg-white p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full bg-[#C89A4B]/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#14100D]">
                {STATUS_LABELS[delivery.status]}
              </span>
              <span className="text-sm font-medium text-[#14100D]">{formatUgx(delivery.fee)}</span>
            </div>
            <p className="text-sm text-[#14100D]/80">{delivery.address}</p>
            <p className="text-xs text-[#14100D]/50">{delivery.customerPhone}</p>

            {!isRider && canReassignRider(delivery) && (
              <div className="mt-3 flex items-center gap-2">
                <select
                  className={`${FORM_INPUT_CLASSES} flex-1`}
                  defaultValue=""
                  onChange={(e) => handleAssign(delivery, e.target.value)}
                >
                  <option value="">Assign a rider…</option>
                  {riders.map((rider) => (
                    <option key={rider.id} value={rider.id}>
                      {rider.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {DELIVERY_STATUS_TRANSITIONS[delivery.status]
                .filter((to) => to !== "cancelled" && to !== "failed" && canTransitionDelivery(delivery, to))
                .map((to) => (
                  <button
                    key={to}
                    type="button"
                    onClick={() => handleTransition(delivery, to)}
                    className={getButtonClasses({ variant: "outline", tone: "light", size: "sm" })}
                  >
                    Mark {STATUS_LABELS[to]}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
