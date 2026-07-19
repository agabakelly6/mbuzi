// src/lib/helpers.ts
//
// Shared form-field validators used by BookingForm and ContactForm.
// Pulled out once both forms were found validating name/phone/email with
// the identical rules — a change to what counts as "a valid phone number"
// should only ever need to happen here.

export function isValidName(value: string): boolean {
  return value.trim().length >= 2;
}

export function isValidPhone(value: string): boolean {
  return /^[0-9+()\-\s]{7,}$/.test(value.trim());
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
