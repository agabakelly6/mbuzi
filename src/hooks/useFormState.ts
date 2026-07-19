// src/hooks/useFormState.ts
//
// BookingForm and ContactForm each hand-rolled the same
// state-plus-per-field-error-clearing setter. Extracted once both were
// found to be identical implementations of the same pattern.
import { useState } from "react";

export function useFormState<T extends object>(initialState: T) {
  const [form, setForm] = useState<T>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  function updateField<K extends keyof T>(field: K, value: T[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  return { form, setForm, errors, setErrors, updateField };
}
