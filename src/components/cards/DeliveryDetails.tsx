// src/components/cards/DeliveryDetails.tsx
import { Truck } from "lucide-react";
import type { DeliveryInfo } from "../../data/delivery";

interface DeliveryDetailsProps {
  delivery: DeliveryInfo;
}

/** Presentational only — no fee is shown here since the real fee depends on the customer's shared location at checkout, not a fixed table. */
export function DeliveryDetails({ delivery }: DeliveryDetailsProps) {
  if (!delivery.available) return null;

  return (
    <div className="mt-5 rounded-xl border border-[#C89A4B]/25 bg-[#C89A4B]/5 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#14100D]">
        <Truck className="h-4 w-4 text-[#C89A4B]" aria-hidden="true" />
        Delivery Available
      </div>
      <p className="mt-1.5 text-xs text-[#14100D]/60">{delivery.area}</p>
      <p className="mt-1.5 text-xs text-[#14100D]/60">
        Exact fee is calculated from your shared location at checkout. Addresses beyond {delivery.maxRadiusKm} km aren't eligible for delivery.
      </p>
    </div>
  );
}
