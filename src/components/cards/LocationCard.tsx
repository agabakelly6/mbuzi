// src/components/cards/LocationCard.tsx
import { MapPin, Phone, Clock } from "lucide-react";
import type { Location } from "../../types/location";
import { WhatsAppButton } from "../ui/WhatsAppButton";
import { getWhatsAppUrl, getTelUrl } from "../../config/site";
import { getButtonClasses } from "../../lib/button-variants";

interface LocationCardProps {
  location: Location;
  heroImageSrc: string;
  heroImageAlt: string;
  reserveLabel: string;
  directionsLabel: string;
}

/**
 * Presentational — no internal state, ships zero client JS on its own.
 * Every action (directions, reserve, WhatsApp) is a real, working link
 * today, not a placeholder.
 */
export function LocationCard({
  location,
  heroImageSrc,
  heroImageAlt,
  reserveLabel,
  directionsLabel,
}: LocationCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-[#14100D]/10 bg-white transition-shadow duration-300 hover:shadow-[0_20px_45px_-15px_rgba(20,16,13,0.25)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={heroImageSrc}
          alt={heroImageAlt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {location.featured && (
          <span className="absolute left-4 top-4 rounded-full bg-[#C89A4B] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#14100D]">
            Main Branch
          </span>
        )}
      </div>

      <div className="p-6">
        <h3 className="font-serif text-xl font-semibold text-[#14100D]">{location.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#14100D]/65">{location.description}</p>

        <div className="mt-5 flex flex-col gap-2.5 text-sm text-[#14100D]/70">
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C89A4B]" aria-hidden="true" />
            <span>{location.address}</span>
          </div>
          <div className="flex items-start gap-2.5">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#C89A4B]" aria-hidden="true" />
            <div className="flex flex-col">
              {location.openingHours.map((entry) => (
                <span key={entry.days}>
                  {entry.days}: {entry.hours}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Phone className="h-4 w-4 shrink-0 text-[#C89A4B]" aria-hidden="true" />
            <a
              href={getTelUrl(location.phone.replace(/\D/g, ""))}
              className="transition-colors duration-300 hover:text-[#14100D]"
            >
              {location.phone}
            </a>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={location.googleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className={getButtonClasses({ variant: "outline", tone: "light", size: "sm" })}
          >
            {directionsLabel}
          </a>
          <a href="/booking" className={getButtonClasses({ variant: "solid", size: "sm" })}>
            {reserveLabel}
          </a>
          <WhatsAppButton
            href={getWhatsAppUrl(undefined, location.whatsapp)}
            label="WhatsApp"
            variant="solid"
          />
        </div>
      </div>
    </article>
  );
}
