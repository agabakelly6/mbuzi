// src/components/cards/TestimonialCard.tsx
import { Star } from "lucide-react";
import type { Testimonial } from "../../data/testimonials";

interface TestimonialCardProps {
  testimonial: Testimonial;
}

/**
 * Presentation-only, assumes a dark section background (see
 * Testimonials.astro). Static — no client JS of its own.
 */
export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <figure className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-8">
      <div>
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className={`h-4 w-4 ${
                index < testimonial.rating
                  ? "fill-[#C89A4B] text-[#C89A4B]"
                  : "text-white/20"
              }`}
            />
          ))}
        </div>
        <blockquote className="mt-5 font-serif text-lg leading-relaxed text-white/90">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>
      </div>
      <figcaption className="mt-6 text-sm text-white/60">
        <span className="font-semibold text-white/85">{testimonial.name}</span>
        {" — "}
        {testimonial.location}
      </figcaption>
    </figure>
  );
}
