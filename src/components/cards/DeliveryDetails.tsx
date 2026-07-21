// src/components/cards/DeliveryDetails.tsx
import { Truck } from "lucide-react";
import { DELIVERY_CURRENCY, type DeliveryInfo } from "../../data/delivery";

interface DeliveryDetailsProps {
  delivery: DeliveryInfo;
}

const feeFormatter = new Intl.NumberFormat("en-UG");

/** Presentational only — every fee and the delivery area come from data/delivery.ts, never hardcoded here. */
export function DeliveryDetails({ delivery }: DeliveryDetailsProps) {
  if (!delivery.available) return null;

  return (
    <div className="mt-5 rounded-xl border border-[#C89A4B]/25 bg-[#C89A4B]/5 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#14100D]">
        <Truck className="h-4 w-4 text-[#C89A4B]" aria-hidden="true" />
        Delivery Available
      </div>
      <p className="mt-1.5 text-xs text-[#14100D]/60">{delivery.area}</p>
      <ul className="mt-3 flex flex-col gap-1.5">
        {delivery.zones.map((zone) => (
          <li key={zone.id} className="flex items-center justify-between gap-4 text-xs text-[#14100D]/70">
            <span>{zone.label}</span>
            <span className="font-semibold text-[#14100D]">
              {DELIVERY_CURRENCY} {feeFormatter.format(zone.fee)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
