// src/components/forms/BookingForm.tsx
//
// No submission API of any kind — there isn't one, and pretending
// otherwise (a fake "Booking Confirmed" state) would be dishonest.
// Two real, direct actions instead:
//   1. "Send Booking via WhatsApp" — validates the form, then opens
//      WhatsApp with a pre-filled message to the selected branch.
//   2. "Call To Book" — a plain tel: link, always available, dials the
//      selected branch (or the site's main number if none is chosen
//      yet). Doesn't need the form filled in — you're just talking to
//      a person.
import type { SyntheticEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ACTIVE_LOCATIONS } from "../../data/locations";
import { TIME_SLOTS, PARTY_SIZES, OCCASION_TYPES } from "../../data/booking";
import { getWhatsAppUrl, getTelUrl, SITE } from "../../config/site";
import { getButtonClasses } from "../../lib/button-variants";
import { FORM_INPUT_CLASSES, FORM_ERROR_INPUT_CLASSES, FORM_LABEL_CLASSES } from "../../lib/constants";
import { isValidName, isValidPhone, isValidEmail } from "../../lib/helpers";
import { useFormState } from "../../hooks/useFormState";
import { BookingSummary } from "./BookingSummary";
import type { BookingFieldCopy } from "../../content/booking";

interface FormState {
  name: string;
  phone: string;
  email: string;
  branchId: string;
  date: string;
  time: string;
  guests: string;
  occasion: string;
  specialRequests: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const INITIAL_STATE: FormState = {
  name: "",
  phone: "",
  email: "",
  branchId: "",
  date: "",
  time: "",
  guests: "",
  occasion: "",
  specialRequests: "",
};

interface BookingFormProps {
  fields: {
    name: BookingFieldCopy;
    phone: BookingFieldCopy;
    email: BookingFieldCopy;
    branch: BookingFieldCopy;
    date: BookingFieldCopy;
    time: BookingFieldCopy;
    guests: BookingFieldCopy;
    occasion: BookingFieldCopy;
    specialRequests: BookingFieldCopy;
  };
  whatsappCtaLabel: string;
  callCtaLabel: string;
  summaryHeading: string;
  summaryEmptyMessage: string;
}

function buildWhatsAppMessage(form: FormState, branchName: string): string {
  const timeLabel = TIME_SLOTS.find((slot) => slot.value === form.time)?.label ?? form.time;
  const guestsLabel =
    PARTY_SIZES.find((size) => String(size.value) === form.guests)?.label ?? form.guests;
  const occasionLabel =
    OCCASION_TYPES.find((occasion) => occasion.value === form.occasion)?.label ?? form.occasion;

  const lines = [
    "Hi YPA, I'd like to reserve a table:",
    `Name: ${form.name.trim()}`,
    `Phone: ${form.phone.trim()}`,
    `Email: ${form.email.trim()}`,
    `Branch: ${branchName}`,
    `Date: ${form.date}`,
    `Time: ${timeLabel}`,
    `Guests: ${guestsLabel}`,
    `Occasion: ${occasionLabel}`,
  ];
  if (form.specialRequests.trim()) {
    lines.push(`Special Requests: ${form.specialRequests.trim()}`);
  }
  return lines.join("\n");
}

export function BookingForm({
  fields,
  whatsappCtaLabel,
  callCtaLabel,
  summaryHeading,
  summaryEmptyMessage,
}: BookingFormProps) {
  const { form, errors, setErrors, updateField } = useFormState<FormState>(INITIAL_STATE);
  const shouldReduceMotion = useReducedMotion();

  const todayIso = new Date().toISOString().slice(0, 10);

  function validate(values: FormState): FormErrors {
    const next: FormErrors = {};
    if (!isValidName(values.name)) next.name = "Enter your full name.";
    if (!isValidPhone(values.phone)) next.phone = "Enter a valid phone number.";
    if (!isValidEmail(values.email)) next.email = "Enter a valid email address.";
    if (!values.branchId) next.branchId = "Select a branch.";
    if (!values.date) next.date = "Select a date.";
    else if (values.date < todayIso) next.date = "Choose a date from today onward.";
    if (!values.time) next.time = "Select a time.";
    if (!values.guests) next.guests = "Select your party size.";
    if (!values.occasion) next.occasion = "Select an occasion.";
    return next;
  }

  function handleWhatsAppSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);

    const firstInvalidField = Object.keys(nextErrors)[0];
    if (firstInvalidField) {
      document.getElementById(`booking-${firstInvalidField}`)?.focus();
      return;
    }

    const branch = ACTIVE_LOCATIONS.find((location) => location.id === form.branchId);
    const message = buildWhatsAppMessage(form, branch?.name ?? form.branchId);
    const url = getWhatsAppUrl(message, branch?.whatsapp);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const selectedBranch = ACTIVE_LOCATIONS.find((location) => location.id === form.branchId);
  const selectedTimeLabel = TIME_SLOTS.find((slot) => slot.value === form.time)?.label;
  const selectedGuestsLabel = PARTY_SIZES.find((size) => String(size.value) === form.guests)?.label;
  const selectedOccasionLabel = OCCASION_TYPES.find((o) => o.value === form.occasion)?.label;

  // "Call to Book" needs no validation — it's just dialing a phone,
  // available with or without the form filled in. Falls back to the
  // site's main number until a branch is chosen.
  const callHref = getTelUrl(selectedBranch?.phone.replace(/\D/g, "") ?? SITE.phoneDigits);
  const callLabel = selectedBranch ? `Call ${selectedBranch.city} To Book` : callCtaLabel;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
      <motion.form
        onSubmit={handleWhatsAppSubmit}
        noValidate
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: shouldReduceMotion ? 0.01 : 0.6 }}
        className="flex flex-col gap-5"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="booking-name" className={FORM_LABEL_CLASSES}>
              {fields.name.label}
            </label>
            <input
              id="booking-name"
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder={fields.name.placeholder}
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "booking-name-error" : undefined}
              className={`${FORM_INPUT_CLASSES} ${errors.name ? FORM_ERROR_INPUT_CLASSES : ""}`}
            />
            {errors.name && (
              <p id="booking-name-error" role="alert" className="text-xs text-red-600">
                {errors.name}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="booking-phone" className={FORM_LABEL_CLASSES}>
              {fields.phone.label}
            </label>
            <input
              id="booking-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder={fields.phone.placeholder}
              autoComplete="tel"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "booking-phone-error" : undefined}
              className={`${FORM_INPUT_CLASSES} ${errors.phone ? FORM_ERROR_INPUT_CLASSES : ""}`}
            />
            {errors.phone && (
              <p id="booking-phone-error" role="alert" className="text-xs text-red-600">
                {errors.phone}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="booking-email" className={FORM_LABEL_CLASSES}>
            {fields.email.label}
          </label>
          <input
            id="booking-email"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder={fields.email.placeholder}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "booking-email-error" : undefined}
            className={`${FORM_INPUT_CLASSES} ${errors.email ? FORM_ERROR_INPUT_CLASSES : ""}`}
          />
          {errors.email && (
            <p id="booking-email-error" role="alert" className="text-xs text-red-600">
              {errors.email}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="booking-branchId" className={FORM_LABEL_CLASSES}>
            {fields.branch.label}
          </label>
          <select
            id="booking-branchId"
            value={form.branchId}
            onChange={(e) => updateField("branchId", e.target.value)}
            aria-invalid={Boolean(errors.branchId)}
            aria-describedby={errors.branchId ? "booking-branchId-error" : undefined}
            className={`${FORM_INPUT_CLASSES} ${errors.branchId ? FORM_ERROR_INPUT_CLASSES : ""}`}
          >
            <option value="">{fields.branch.placeholder}</option>
            {ACTIVE_LOCATIONS.map((location) => (
              <option key={location.id} value={location.id}>
                {location.city}
              </option>
            ))}
          </select>
          {errors.branchId && (
            <p id="booking-branchId-error" role="alert" className="text-xs text-red-600">
              {errors.branchId}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="booking-date" className={FORM_LABEL_CLASSES}>
              {fields.date.label}
            </label>
            <input
              id="booking-date"
              type="date"
              min={todayIso}
              value={form.date}
              onChange={(e) => updateField("date", e.target.value)}
              aria-invalid={Boolean(errors.date)}
              aria-describedby={errors.date ? "booking-date-error" : undefined}
              className={`${FORM_INPUT_CLASSES} ${errors.date ? FORM_ERROR_INPUT_CLASSES : ""}`}
            />
            {errors.date && (
              <p id="booking-date-error" role="alert" className="text-xs text-red-600">
                {errors.date}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="booking-time" className={FORM_LABEL_CLASSES}>
              {fields.time.label}
            </label>
            <select
              id="booking-time"
              value={form.time}
              onChange={(e) => updateField("time", e.target.value)}
              aria-invalid={Boolean(errors.time)}
              aria-describedby={errors.time ? "booking-time-error" : undefined}
              className={`${FORM_INPUT_CLASSES} ${errors.time ? FORM_ERROR_INPUT_CLASSES : ""}`}
            >
              <option value="">{fields.time.placeholder}</option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
            {errors.time && (
              <p id="booking-time-error" role="alert" className="text-xs text-red-600">
                {errors.time}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="booking-guests" className={FORM_LABEL_CLASSES}>
              {fields.guests.label}
            </label>
            <select
              id="booking-guests"
              value={form.guests}
              onChange={(e) => updateField("guests", e.target.value)}
              aria-invalid={Boolean(errors.guests)}
              aria-describedby={errors.guests ? "booking-guests-error" : undefined}
              className={`${FORM_INPUT_CLASSES} ${errors.guests ? FORM_ERROR_INPUT_CLASSES : ""}`}
            >
              <option value="">{fields.guests.placeholder}</option>
              {PARTY_SIZES.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
            {errors.guests && (
              <p id="booking-guests-error" role="alert" className="text-xs text-red-600">
                {errors.guests}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="booking-occasion" className={FORM_LABEL_CLASSES}>
            {fields.occasion.label}
          </label>
          <select
            id="booking-occasion"
            value={form.occasion}
            onChange={(e) => updateField("occasion", e.target.value)}
            aria-invalid={Boolean(errors.occasion)}
            aria-describedby={errors.occasion ? "booking-occasion-error" : undefined}
            className={`${FORM_INPUT_CLASSES} ${errors.occasion ? FORM_ERROR_INPUT_CLASSES : ""}`}
          >
            <option value="">{fields.occasion.placeholder}</option>
            {OCCASION_TYPES.map((occasion) => (
              <option key={occasion.value} value={occasion.value}>
                {occasion.label}
              </option>
            ))}
          </select>
          {errors.occasion && (
            <p id="booking-occasion-error" role="alert" className="text-xs text-red-600">
              {errors.occasion}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="booking-specialRequests" className={FORM_LABEL_CLASSES}>
            {fields.specialRequests.label}
          </label>
          <textarea
            id="booking-specialRequests"
            value={form.specialRequests}
            onChange={(e) => updateField("specialRequests", e.target.value)}
            placeholder={fields.specialRequests.placeholder}
            rows={3}
            className={`${FORM_INPUT_CLASSES} resize-none`}
          />
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button type="submit" className={getButtonClasses({ variant: "solid", size: "md" })}>
            {whatsappCtaLabel}
          </button>
          <a href={callHref} className={getButtonClasses({ variant: "outline", tone: "light", size: "md" })}>
            {callLabel}
          </a>
        </div>
      </motion.form>

      <BookingSummary
        heading={summaryHeading}
        emptyMessage={summaryEmptyMessage}
        name={form.name || undefined}
        branch={selectedBranch}
        date={form.date || undefined}
        time={selectedTimeLabel}
        guests={selectedGuestsLabel}
        occasion={selectedOccasionLabel}
        specialRequests={form.specialRequests || undefined}
      />
    </div>
  );
}
