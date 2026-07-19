// src/components/cards/EventPackageCard.tsx
import { Check } from "lucide-react";
import type { EventPackage } from "../../data/catering";
import { getButtonClasses } from "../../lib/button-variants";

interface EventPackageCardProps {
  pkg: EventPackage;
  serviceLabels: string[];
  quoteHref: string;
  ctaLabel: string;
}

export function EventPackageCard({ pkg, serviceLabels, quoteHref, ctaLabel }: EventPackageCardProps) {
  return (
    <article
      className={`relative flex h-full flex-col rounded-2xl border p-6 ${
        pkg.featured ? "border-[#C89A4B] bg-[#C89A4B]/[0.04]" : "border-[#14100D]/10 bg-white"
      }`}
    >
      {pkg.featured && (
        <span className="absolute -top-3 left-6 rounded-full bg-[#C89A4B] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#14100D]">
          Most Popular
        </span>
      )}
      <h3 className="font-serif text-xl font-semibold text-[#14100D]">{pkg.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#14100D]/65">{pkg.description}</p>
      <p className="mt-4 text-sm font-semibold text-[#C89A4B]">
        {pkg.minGuests}–{pkg.maxGuests} Guests
      </p>

      <ul className="mt-4 flex flex-1 flex-col gap-2">
        {serviceLabels.map((label) => (
          <li key={label} className="flex items-start gap-2 text-sm text-[#14100D]/75">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C89A4B]" aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>

      <a
        href={quoteHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-6 ${getButtonClasses({
          variant: pkg.featured ? "solid" : "outline",
          tone: "light",
          size: "sm",
        })}`}
      >
        {ctaLabel}
      </a>
    </article>
  );
}
