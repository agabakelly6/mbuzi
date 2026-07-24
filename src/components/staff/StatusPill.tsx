// src/components/staff/StatusPill.tsx
//
// One consistent status-badge look shared across Orders/Kitchen/
// Deliveries/Reservations, instead of each dashboard hand-rolling its own
// STATUS_TONE color map with slightly different styling.
export type PillTone = "amber" | "blue" | "emerald" | "red" | "neutral";

const TONE_CLASSES: Record<PillTone, string> = {
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-blue-100 text-blue-800",
  emerald: "bg-emerald-100 text-emerald-800",
  red: "bg-red-100 text-red-700",
  neutral: "bg-[#14100D]/8 text-[#14100D]/70",
};

interface StatusPillProps {
  label: string;
  tone: PillTone;
  className?: string;
}

export function StatusPill({ label, tone, className }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] ${TONE_CLASSES[tone]} ${className ?? ""}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
