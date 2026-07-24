// src/components/staff/KitchenDisplay.tsx
//
// The chef's ticket queue. Tickets themselves are never created here —
// they appear automatically the instant an order is accepted (the
// on_order_accepted DB trigger, tested live in the order-processing
// milestone). This only progresses what already exists.
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import type { Branch } from "../../types/branch";
import type { KitchenTicket, KitchenTicketStatus } from "../../types/kitchen";
import { supabaseBranchRepository } from "../../repositories/supabase/SupabaseBranchRepository";
import { supabaseKitchenTicketRepository } from "../../repositories/supabase/SupabaseKitchenTicketRepository";
import { supabaseKitchenService } from "../../services/supabase/SupabaseKitchenService";
import { elapsedMinutes } from "../../models/KitchenModel";
import { KITCHEN_TICKET_STATUS_TRANSITIONS } from "../../lib/state-machines";
import { getButtonClasses } from "../../lib/button-variants";
import { FORM_INPUT_CLASSES, FORM_LABEL_CLASSES } from "../../lib/constants";

const STATUS_LABELS: Record<KitchenTicketStatus, string> = {
  queued: "Queued",
  in_progress: "In Progress",
  ready: "Ready",
  served: "Served",
  cancelled: "Cancelled",
};

const NEXT_ACTION_LABEL: Partial<Record<KitchenTicketStatus, string>> = {
  queued: "Start",
  in_progress: "Mark Ready",
  ready: "Mark Served",
};

function nextItemStatus(status: KitchenTicketStatus): KitchenTicketStatus | null {
  return KITCHEN_TICKET_STATUS_TRANSITIONS[status].find((s) => s !== "cancelled") ?? null;
}

export function KitchenDisplay() {
  const { user, role, branchId: ownBranchId } = useAuth();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<string | null>(ownBranchId);
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role === "owner") {
      supabaseBranchRepository.list({ pageSize: 50 }).then(({ data }) => setBranches(data?.items ?? []));
    }
  }, [role]);

  useEffect(() => {
    if (!branchId) return;
    let isMounted = true;

    supabaseKitchenTicketRepository.list({ branchId, pageSize: 50, sortBy: "fired_at", sortDirection: "asc" }).then(({ data }) => {
      if (isMounted && data) setTickets(data.items.filter((t) => t.status !== "served" && t.status !== "cancelled"));
    });

    const unsubscribe = supabaseKitchenTicketRepository.subscribe({ branchId }, (updated) => {
      if (!isMounted) return;
      setTickets((prev) => {
        if (updated.status === "served" || updated.status === "cancelled") {
          return prev.filter((t) => t.id !== updated.id);
        }
        const exists = prev.some((t) => t.id === updated.id);
        return exists ? prev.map((t) => (t.id === updated.id ? updated : t)) : [...prev, updated];
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [branchId]);

  async function handleClaim(ticket: KitchenTicket) {
    if (!user) return;
    setError(null);
    const result = await supabaseKitchenService.claimTicket(ticket.id, user.id);
    if (result.error) setError(result.error.message);
  }

  async function handleItemAdvance(ticket: KitchenTicket, orderItemId: string, currentStatus: KitchenTicketStatus) {
    const to = nextItemStatus(currentStatus);
    if (!to) return;
    setError(null);
    const result = await supabaseKitchenService.updateItemStatus(ticket.id, orderItemId, to);
    if (result.error) setError(result.error.message);
  }

  if (role === "owner" && !branchId) {
    return (
      <div className="mx-auto max-w-sm">
        <label htmlFor="kitchen-branch" className={FORM_LABEL_CLASSES}>
          Select A Branch
        </label>
        <select
          id="kitchen-branch"
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
    <div>
      <h2 className="mb-4 font-serif text-lg font-semibold text-[#14100D]">Kitchen Queue</h2>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      {tickets.length === 0 && <p className="text-sm text-[#14100D]/50">No active tickets.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="rounded-2xl border border-[#14100D]/10 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-[#C89A4B]/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#14100D]">
                {STATUS_LABELS[ticket.status]}
              </span>
              <span className="text-xs text-[#14100D]/50">{elapsedMinutes(ticket)} min</span>
            </div>

            {ticket.items.map((item) => (
              <div key={item.orderItemId} className="flex items-center justify-between border-b border-[#14100D]/5 py-2 text-sm last:border-0">
                <div>
                  <p className="text-[#14100D]">
                    {item.quantity}× {item.nameSnapshot}
                  </p>
                  {item.specialInstructions && <p className="text-xs text-[#14100D]/50">{item.specialInstructions}</p>}
                  <p className="text-xs text-[#14100D]/40">{STATUS_LABELS[item.status]}</p>
                </div>
                {NEXT_ACTION_LABEL[item.status] && (
                  <button
                    type="button"
                    onClick={() => handleItemAdvance(ticket, item.orderItemId, item.status)}
                    className={getButtonClasses({ variant: "outline", tone: "light", size: "sm" })}
                  >
                    {NEXT_ACTION_LABEL[item.status]}
                  </button>
                )}
              </div>
            ))}

            {!ticket.assignedChefId && (
              <button
                type="button"
                onClick={() => handleClaim(ticket)}
                className={getButtonClasses({ variant: "solid", size: "sm", className: "mt-3 w-full" })}
              >
                Claim Ticket
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
