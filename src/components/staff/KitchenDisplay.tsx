// src/components/staff/KitchenDisplay.tsx
//
// The chef's ticket queue. Tickets themselves are never created here —
// they appear automatically the instant an order is accepted (the
// on_order_accepted DB trigger, tested live in the order-processing
// milestone). This only progresses what already exists.
import { useEffect, useState } from "react";
import { ChefHat, Clock, Hand } from "lucide-react";
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
import { StatusPill, type PillTone } from "./StatusPill";

const STATUS_LABELS: Record<KitchenTicketStatus, string> = {
  queued: "Queued",
  in_progress: "In Progress",
  ready: "Ready",
  served: "Served",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<KitchenTicketStatus, PillTone> = {
  queued: "amber",
  in_progress: "blue",
  ready: "emerald",
  served: "neutral",
  cancelled: "red",
};

const NEXT_ACTION_LABEL: Partial<Record<KitchenTicketStatus, string>> = {
  queued: "Start",
  in_progress: "Mark Ready",
  ready: "Mark Served",
};

function nextItemStatus(status: KitchenTicketStatus): KitchenTicketStatus | null {
  return KITCHEN_TICKET_STATUS_TRANSITIONS[status].find((s) => s !== "cancelled") ?? null;
}

/** Urgency accent — a ticket sitting for a while should visually stand out without staff having to read the timer. */
function urgencyBorder(minutes: number): string {
  if (minutes >= 20) return "border-red-300";
  if (minutes >= 10) return "border-amber-300";
  return "border-[#14100D]/10";
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
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-[#14100D]/50">
          <span className="font-semibold text-[#14100D]">{tickets.length}</span> active ticket{tickets.length === 1 ? "" : "s"}
        </p>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {tickets.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#14100D]/15 bg-white py-16 text-center">
          <ChefHat size={26} className="text-[#14100D]/25" />
          <p className="text-sm text-[#14100D]/50">No active tickets — the queue is clear.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tickets.map((ticket) => {
          const minutes = elapsedMinutes(ticket);
          return (
            <div
              key={ticket.id}
              className={`rounded-2xl border-2 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(20,16,13,0.4)] ${urgencyBorder(minutes)}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <StatusPill label={STATUS_LABELS[ticket.status]} tone={STATUS_TONE[ticket.status]} />
                <span className={`flex items-center gap-1 text-xs font-medium ${minutes >= 20 ? "text-red-600" : minutes >= 10 ? "text-amber-700" : "text-[#14100D]/50"}`}>
                  <Clock size={12} strokeWidth={2.25} />
                  {minutes} min
                </span>
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
                  className={getButtonClasses({ variant: "solid", size: "sm", className: "mt-3 flex w-full items-center justify-center gap-1.5" })}
                >
                  <Hand size={14} strokeWidth={2.25} />
                  Claim Ticket
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
