// src/components/staff/ReservationsDashboard.tsx
//
// Tables and reservations together — assigning a table to a reservation
// needs the tables list right there, not a separate screen. Per RBAC,
// only branch_manager/owner can create tables or reservations directly;
// waiter/cashier can read and progress an existing reservation (confirm,
// seat, cancel) but not create one — that's not an oversight, it's
// lib/rbac.ts's `reservation` grants exactly.
import { useEffect, useState, type SyntheticEvent } from "react";
import { CalendarCheck, Table2, Users, Clock, Phone } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { DashboardCard } from "./DashboardCard";
import { StatusPill, type PillTone } from "./StatusPill";
import type { Branch } from "../../types/branch";
import type { Table } from "../../types/table";
import type { Reservation, ReservationStatus } from "../../types/reservation";
import { supabaseBranchRepository } from "../../repositories/supabase/SupabaseBranchRepository";
import { supabaseTableRepository } from "../../repositories/supabase/SupabaseTableRepository";
import { supabaseReservationRepository } from "../../repositories/supabase/SupabaseReservationRepository";
import { supabaseReservationService } from "../../services/supabase/SupabaseReservationService";
import { canTransitionReservation } from "../../models/ReservationModel";
import { RESERVATION_STATUS_TRANSITIONS } from "../../lib/state-machines";
import { useFormState } from "../../hooks/useFormState";
import { getButtonClasses } from "../../lib/button-variants";
import { FORM_INPUT_CLASSES, FORM_LABEL_CLASSES } from "../../lib/constants";

const STATUS_LABELS: Record<ReservationStatus, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  seated: "Seated",
  completed: "Completed",
  no_show: "No Show",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<ReservationStatus, PillTone> = {
  requested: "amber",
  confirmed: "blue",
  seated: "emerald",
  completed: "neutral",
  no_show: "red",
  cancelled: "red",
};

interface NewReservationForm {
  guestName: string;
  guestPhone: string;
  partySize: string;
  reservedFor: string;
}

const NEW_RESERVATION_INITIAL: NewReservationForm = { guestName: "", guestPhone: "", partySize: "2", reservedFor: "" };

export function ReservationsDashboard() {
  const { role, branchId: ownBranchId } = useAuth();
  const canCreate = role === "branch_manager" || role === "owner";

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<string | null>(ownBranchId);
  const [tables, setTables] = useState<Table[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTableLabel, setNewTableLabel] = useState("");
  const [newTableSeats, setNewTableSeats] = useState("2");

  const { form, updateField, setForm } = useFormState<NewReservationForm>(NEW_RESERVATION_INITIAL);

  useEffect(() => {
    if (role === "owner") {
      supabaseBranchRepository.list({ pageSize: 50 }).then(({ data }) => setBranches(data?.items ?? []));
    }
  }, [role]);

  useEffect(() => {
    if (!branchId) return;
    refreshTables();
    refreshReservations();
  }, [branchId]);

  function refreshTables() {
    if (!branchId) return;
    supabaseTableRepository.listByBranch(branchId).then(({ data }) => setTables(data ?? []));
  }

  function refreshReservations() {
    if (!branchId) return;
    supabaseReservationRepository.list({ branchId, pageSize: 50, sortBy: "reserved_for", sortDirection: "asc" }).then(({ data }) => {
      setReservations((data?.items ?? []).filter((r) => r.status !== "completed" && r.status !== "cancelled" && r.status !== "no_show"));
    });
  }

  async function handleCreateTable(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!branchId || !newTableLabel) return;
    const result = await supabaseTableRepository.create({ branchId, label: newTableLabel, seats: Number(newTableSeats) });
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setNewTableLabel("");
    refreshTables();
  }

  async function handleCreateReservation(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!branchId) return;

    setIsSubmitting(true);
    const result = await supabaseReservationService.requestReservation({
      branchId,
      customerId: null,
      guestName: form.guestName,
      guestPhone: form.guestPhone,
      partySize: Number(form.partySize),
      reservedFor: form.reservedFor ? new Date(form.reservedFor).toISOString() : "",
    });
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }
    setForm(NEW_RESERVATION_INITIAL);
    refreshReservations();
  }

  async function handleTransition(reservation: Reservation, to: ReservationStatus) {
    setError(null);
    const result = await supabaseReservationService.transitionStatus(reservation.id, to);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    refreshReservations();
  }

  async function handleAssignTable(reservation: Reservation, tableId: string) {
    if (!tableId) return;
    setError(null);
    const result = await supabaseReservationRepository.assignTable(reservation.id, tableId);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    refreshReservations();
  }

  if (role === "owner" && !branchId) {
    return (
      <div className="mx-auto max-w-sm">
        <label htmlFor="resv-branch" className={FORM_LABEL_CLASSES}>
          Select A Branch
        </label>
        <select id="resv-branch" className={`${FORM_INPUT_CLASSES} mt-1.5`} onChange={(e) => setBranchId(e.target.value || null)} defaultValue="">
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
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr]">
      <DashboardCard title="Reservations" icon={CalendarCheck}>
        {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="flex flex-col gap-3">
          {reservations.length === 0 && <p className="text-sm text-[#14100D]/50">No upcoming reservations.</p>}
          {reservations.map((reservation) => (
            <div key={reservation.id} className="rounded-xl border border-[#14100D]/10 bg-[#F5EFE4]/40 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#14100D]">{reservation.guestName}</p>
                <StatusPill label={STATUS_LABELS[reservation.status]} tone={STATUS_TONE[reservation.status]} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#14100D]/50">
                <span className="flex items-center gap-1"><Users size={12} /> {reservation.partySize} guests</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {new Date(reservation.reservedFor).toLocaleString()}</span>
                <span className="flex items-center gap-1"><Phone size={12} /> {reservation.guestPhone}</span>
              </div>

              {reservation.status === "requested" && (
                <select
                  className={`${FORM_INPUT_CLASSES} mt-2`}
                  defaultValue=""
                  onChange={(e) => handleAssignTable(reservation, e.target.value)}
                >
                  <option value="">Assign a table…</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.label} ({table.seats} seats)
                    </option>
                  ))}
                </select>
              )}

              <div className="mt-2 flex flex-wrap gap-2">
                {RESERVATION_STATUS_TRANSITIONS[reservation.status]
                  .filter((to) => canTransitionReservation(reservation, to))
                  .map((to) => (
                    <button
                      key={to}
                      type="button"
                      onClick={() => handleTransition(reservation, to)}
                      className={getButtonClasses({ variant: "outline", tone: "light", size: "sm" })}
                    >
                      Mark {STATUS_LABELS[to]}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {canCreate && (
          <form onSubmit={handleCreateReservation} className="mt-6 flex flex-col gap-3 rounded-xl border border-[#14100D]/10 bg-[#F5EFE4]/40 p-5">
            <p className="text-sm font-semibold text-[#14100D]">New Reservation</p>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Guest name" value={form.guestName} onChange={(e) => updateField("guestName", e.target.value)} className={FORM_INPUT_CLASSES} />
              <input placeholder="Phone" value={form.guestPhone} onChange={(e) => updateField("guestPhone", e.target.value)} className={FORM_INPUT_CLASSES} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" min={1} placeholder="Party size" value={form.partySize} onChange={(e) => updateField("partySize", e.target.value)} className={FORM_INPUT_CLASSES} />
              <input type="datetime-local" value={form.reservedFor} onChange={(e) => updateField("reservedFor", e.target.value)} className={FORM_INPUT_CLASSES} />
            </div>
            <button type="submit" disabled={isSubmitting} className={getButtonClasses({ variant: "solid", size: "sm", className: "disabled:opacity-60" })}>
              {isSubmitting ? "Requesting…" : "Request Reservation"}
            </button>
          </form>
        )}
      </DashboardCard>

      <DashboardCard title="Tables" icon={Table2}>
        <div className="flex flex-col gap-2">
          {tables.map((table) => (
            <div key={table.id} className="flex items-center justify-between rounded-xl border border-[#14100D]/10 bg-[#F5EFE4]/40 p-4 text-sm">
              <span className="font-medium text-[#14100D]">
                {table.label} ({table.seats} seats)
              </span>
              <StatusPill label={table.status} tone={table.status === "available" ? "emerald" : table.status === "occupied" ? "amber" : "neutral"} />
            </div>
          ))}
        </div>

        {canCreate && (
          <form onSubmit={handleCreateTable} className="mt-4 flex gap-2">
            <input placeholder="Label" value={newTableLabel} onChange={(e) => setNewTableLabel(e.target.value)} className={FORM_INPUT_CLASSES} />
            <input type="number" min={1} value={newTableSeats} onChange={(e) => setNewTableSeats(e.target.value)} className={`${FORM_INPUT_CLASSES} w-24`} />
            <button type="submit" className={getButtonClasses({ variant: "outline", tone: "light", size: "sm" })}>
              Add
            </button>
          </form>
        )}
      </DashboardCard>
    </div>
  );
}
