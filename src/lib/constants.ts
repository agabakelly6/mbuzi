// src/lib/constants.ts
//
// Shared Tailwind class strings used by more than one component. Not a
// dumping ground for every repeated class — only for strings that were
// found copy-pasted verbatim across files, so a change lands in one place.

/** Shared by BookingForm and ContactForm for every text/email/tel/select/textarea input. */
export const FORM_INPUT_CLASSES =
  "w-full rounded-xl border border-[#14100D]/15 bg-white px-4 py-3 text-sm text-[#14100D] transition-colors duration-300 placeholder:text-[#14100D]/35 focus:border-[#C89A4B] focus:outline-none focus:ring-2 focus:ring-[#C89A4B]/30";

/** Appended to FORM_INPUT_CLASSES when a field has a validation error. */
export const FORM_ERROR_INPUT_CLASSES = "border-red-400 focus:border-red-400 focus:ring-red-200";

/** Shared label styling for every form field in BookingForm and ContactForm. */
export const FORM_LABEL_CLASSES = "text-[13px] font-semibold text-[#14100D]";
