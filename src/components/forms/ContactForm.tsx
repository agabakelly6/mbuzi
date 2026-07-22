// src/components/forms/ContactForm.tsx
//
// Same principle as BookingForm.tsx: no submission API of any kind.
// Validates the form, then either opens WhatsApp or the user's email
// client with a pre-filled message — both real, working handoffs to a
// person, not a fake "Message Sent" state backed by nothing.
import type { SyntheticEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DEPARTMENTS } from "../../data/contact";
import { ACTIVE_LOCATIONS } from "../../data/locations";
import { getWhatsAppUrl, getMailtoUrl } from "../../config/site";
import { getButtonClasses } from "../../lib/button-variants";
import { FORM_INPUT_CLASSES, FORM_ERROR_INPUT_CLASSES, FORM_LABEL_CLASSES } from "../../lib/constants";
import { isValidName, isValidPhone, isValidEmail } from "../../lib/helpers";
import { useFormState } from "../../hooks/useFormState";
import type { ContactFieldCopy } from "../../content/contact";

interface FormState {
  name: string;
  phone: string;
  email: string;
  subjectId: string;
  branchId: string;
  message: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const INITIAL_STATE: FormState = {
  name: "",
  phone: "",
  email: "",
  subjectId: "",
  branchId: "",
  message: "",
};

interface ContactFormProps {
  fields: {
    name: ContactFieldCopy;
    phone: ContactFieldCopy;
    email: ContactFieldCopy;
    subject: ContactFieldCopy;
    branch: ContactFieldCopy;
    message: ContactFieldCopy;
  };
  whatsappCtaLabel: string;
  emailCtaLabel: string;
}

function buildMessageBody(form: FormState, subjectLabel: string, branchName?: string): string {
  const lines = [
    `Subject: ${subjectLabel}`,
    `Name: ${form.name.trim()}`,
    `Phone: ${form.phone.trim()}`,
    `Email: ${form.email.trim()}`,
  ];
  if (branchName) lines.push(`Branch: ${branchName}`);
  lines.push("", form.message.trim());
  return lines.join("\n");
}

export function ContactForm({ fields, whatsappCtaLabel, emailCtaLabel }: ContactFormProps) {
  const { form, errors, setErrors, updateField } = useFormState<FormState>(INITIAL_STATE);
  const shouldReduceMotion = useReducedMotion();

  function validate(values: FormState): FormErrors {
    const next: FormErrors = {};
    if (!isValidName(values.name)) next.name = "Enter your full name.";
    if (!isValidPhone(values.phone)) next.phone = "Enter a valid phone number.";
    if (!isValidEmail(values.email)) next.email = "Enter a valid email address.";
    if (!values.subjectId) next.subjectId = "Select a subject.";
    if (values.message.trim().length < 10) next.message = "Tell us a bit more — at least 10 characters.";
    return next;
  }

  function getValidatedContext(): { subjectLabel: string; branchName?: string } | null {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    const firstInvalidField = Object.keys(nextErrors)[0];
    if (firstInvalidField) {
      document.getElementById(`contact-${firstInvalidField}`)?.focus();
      return null;
    }
    const department = DEPARTMENTS.find((d) => d.id === form.subjectId);
    const branch = ACTIVE_LOCATIONS.find((l) => l.id === form.branchId);
    return { subjectLabel: department?.name ?? form.subjectId, branchName: branch?.name };
  }

  function handleWhatsAppSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const context = getValidatedContext();
    if (!context) return;

    const branch = ACTIVE_LOCATIONS.find((l) => l.id === form.branchId);
    const message = buildMessageBody(form, context.subjectLabel, context.branchName);
    const url = getWhatsAppUrl(message, branch?.whatsapp);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleEmailClick() {
    const context = getValidatedContext();
    if (!context) return;

    const department = DEPARTMENTS.find((d) => d.id === form.subjectId);
    const body = buildMessageBody(form, context.subjectLabel, context.branchName);
    const url = getMailtoUrl({
      subject: `${context.subjectLabel} — Website Enquiry`,
      body,
      emailOverride: department?.email,
    });
    window.location.href = url;
  }

  return (
    <motion.form
      onSubmit={handleWhatsAppSubmit}
      noValidate
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: shouldReduceMotion ? 0.01 : 0.6 }}
      className="mx-auto flex max-w-2xl flex-col gap-5"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-name" className={FORM_LABEL_CLASSES}>
            {fields.name.label}
          </label>
          <input
            id="contact-name"
            type="text"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder={fields.name.placeholder}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            className={`${FORM_INPUT_CLASSES} ${errors.name ? FORM_ERROR_INPUT_CLASSES : ""}`}
          />
          {errors.name && (
            <p id="contact-name-error" role="alert" className="text-xs text-red-600">
              {errors.name}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-phone" className={FORM_LABEL_CLASSES}>
            {fields.phone.label}
          </label>
          <input
            id="contact-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder={fields.phone.placeholder}
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "contact-phone-error" : undefined}
            className={`${FORM_INPUT_CLASSES} ${errors.phone ? FORM_ERROR_INPUT_CLASSES : ""}`}
          />
          {errors.phone && (
            <p id="contact-phone-error" role="alert" className="text-xs text-red-600">
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-email" className={FORM_LABEL_CLASSES}>
          {fields.email.label}
        </label>
        <input
          id="contact-email"
          type="email"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder={fields.email.placeholder}
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "contact-email-error" : undefined}
          className={`${FORM_INPUT_CLASSES} ${errors.email ? FORM_ERROR_INPUT_CLASSES : ""}`}
        />
        {errors.email && (
          <p id="contact-email-error" role="alert" className="text-xs text-red-600">
            {errors.email}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-subjectId" className={FORM_LABEL_CLASSES}>
            {fields.subject.label}
          </label>
          <select
            id="contact-subjectId"
            value={form.subjectId}
            onChange={(e) => updateField("subjectId", e.target.value)}
            aria-invalid={Boolean(errors.subjectId)}
            aria-describedby={errors.subjectId ? "contact-subjectId-error" : undefined}
            className={`${FORM_INPUT_CLASSES} ${errors.subjectId ? FORM_ERROR_INPUT_CLASSES : ""}`}
          >
            <option value="">{fields.subject.placeholder}</option>
            {DEPARTMENTS.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          {errors.subjectId && (
            <p id="contact-subjectId-error" role="alert" className="text-xs text-red-600">
              {errors.subjectId}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-branchId" className={FORM_LABEL_CLASSES}>
            {fields.branch.label}
          </label>
          <select
            id="contact-branchId"
            value={form.branchId}
            onChange={(e) => updateField("branchId", e.target.value)}
            className={FORM_INPUT_CLASSES}
          >
            <option value="">{fields.branch.placeholder}</option>
            {ACTIVE_LOCATIONS.map((location) => (
              <option key={location.id} value={location.id}>
                {location.city}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-message" className={FORM_LABEL_CLASSES}>
          {fields.message.label}
        </label>
        <textarea
          id="contact-message"
          value={form.message}
          onChange={(e) => updateField("message", e.target.value)}
          placeholder={fields.message.placeholder}
          rows={4}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          className={`${FORM_INPUT_CLASSES} resize-none ${errors.message ? FORM_ERROR_INPUT_CLASSES : ""}`}
        />
        {errors.message && (
          <p id="contact-message-error" role="alert" className="text-xs text-red-600">
            {errors.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button type="submit" className={getButtonClasses({ variant: "solid", size: "md" })}>
          {whatsappCtaLabel}
        </button>
        <button
          type="button"
          onClick={handleEmailClick}
          className={getButtonClasses({ variant: "outline", tone: "light", size: "md" })}
        >
          {emailCtaLabel}
        </button>
      </div>
    </motion.form>
  );
}
