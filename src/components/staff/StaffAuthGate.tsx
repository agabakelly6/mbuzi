// src/components/staff/StaffAuthGate.tsx
//
// Sign-in only, no self-service sign-up tab — staff accounts are
// provisioned (seeded, or invited via AuthService.inviteStaff), never
// created by the person signing in. The only login UI on the whole site —
// customers never see one; /order is a no-login guest checkout.
import { useState, type SyntheticEvent } from "react";
import { useAuthActions } from "../../hooks/useAuthActions";
import { signInInputSchema } from "../../validators/user.schema";
import { useFormState } from "../../hooks/useFormState";
import { getButtonClasses } from "../../lib/button-variants";
import { FORM_INPUT_CLASSES, FORM_LABEL_CLASSES } from "../../lib/constants";

interface SignInFormState {
  email: string;
  password: string;
}

export function StaffAuthGate() {
  const { signIn } = useAuthActions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { form, updateField } = useFormState<SignInFormState>({ email: "", password: "" });

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = signInInputSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Check your details and try again.");
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(parsed.data);
    setIsSubmitting(false);
    if (result.error) setFormError(result.error.message);
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-[#14100D]/10 bg-white p-8">
      <h1 className="mb-1 font-serif text-xl font-semibold text-[#14100D]">Staff Sign In</h1>
      <p className="mb-6 text-sm text-[#14100D]/60">Front desk / cashier access.</p>

      {formError && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {formError}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="staff-email" className={FORM_LABEL_CLASSES}>
            Email
          </label>
          <input
            id="staff-email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className={FORM_INPUT_CLASSES}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="staff-password" className={FORM_LABEL_CLASSES}>
            Password
          </label>
          <input
            id="staff-password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            className={FORM_INPUT_CLASSES}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={getButtonClasses({ variant: "solid", size: "md", className: "mt-2 w-full disabled:opacity-60" })}
        >
          {isSubmitting ? "Signing In…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
