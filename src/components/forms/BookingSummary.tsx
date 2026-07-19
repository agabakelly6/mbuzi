// src/components/forms/BookingSummary.tsx
import { MapPin, Calendar, Clock, Users, PartyPopper } from "lucide-react";
import type { Location } from "../../types/location";

interface BookingSummaryProps {
  heading: string;
  emptyMessage: string;
  name?: string;
  branch?: Location;
  date?: string;
  time?: string;
  guests?: string;
  occasion?: string;
  specialRequests?: string;
}

function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toLocaleDateString("en-UG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Presentational — receives already-resolved display values from
 * BookingForm (which owns the actual form state) rather than raw form
 * values, so it never needs to know about validation or field names.
 */
export function BookingSummary({
  heading,
  emptyMessage,
  name,
  branch,
  date,
  time,
  guests,
  occasion,
  specialRequests,
}: BookingSummaryProps) {
  const formattedDate = formatDate(date);
  const hasAnyDetails = Boolean(name || branch || formattedDate || time || guests || occasion);

  return (
    <aside
      aria-label={heading}
      className="rounded-2xl border border-[#14100D]/10 bg-[#F5EFE4] p-6 lg:sticky lg:top-28"
    >
      <h3 className="font-serif text-lg font-semibold text-[#14100D]">{heading}</h3>

      {!hasAnyDetails ? (
        <p className="mt-3 text-sm text-[#14100D]/60">{emptyMessage}</p>
      ) : (
        <dl className="mt-4 flex flex-col gap-3 text-sm text-[#14100D]/80">
          {name && (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#14100D]/50">Name</dt>
              <dd className="text-right font-medium">{name}</dd>
            </div>
          )}
          {branch && (
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-1.5 text-[#14100D]/50">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                Branch
              </dt>
              <dd className="text-right font-medium">{branch.city}</dd>
            </div>
          )}
          {formattedDate && (
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-1.5 text-[#14100D]/50">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                Date
              </dt>
              <dd className="text-right font-medium">{formattedDate}</dd>
            </div>
          )}
          {time && (
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-1.5 text-[#14100D]/50">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Time
              </dt>
              <dd className="font-medium">{time}</dd>
            </div>
          )}
          {guests && (
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-1.5 text-[#14100D]/50">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                Guests
              </dt>
              <dd className="font-medium">{guests}</dd>
            </div>
          )}
          {occasion && (
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-1.5 text-[#14100D]/50">
                <PartyPopper className="h-3.5 w-3.5" aria-hidden="true" />
                Occasion
              </dt>
              <dd className="font-medium">{occasion}</dd>
            </div>
          )}
          {specialRequests && (
            <div className="flex flex-col gap-1 border-t border-[#14100D]/10 pt-3">
              <dt className="text-[#14100D]/50">Special Requests</dt>
              <dd className="font-medium">{specialRequests}</dd>
            </div>
          )}
        </dl>
      )}
    </aside>
  );
}
