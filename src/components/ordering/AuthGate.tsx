// src/components/ordering/AuthGate.tsx
//
// Sign in / sign up gate for the ordering page — placing a real order
// requires an authenticated 'customer' account (RLS has no anonymous
// insert path on orders), unlike the existing WhatsApp cart, which never
// required an account at all.
import { useState, type SyntheticEvent } from "react";
import { useAuthActions } from "../../hooks/useAuthActions";
import { signInInputSchema, signUpCustomerInputSchema } from "../../validators/user.schema";
import { useFormState } from "../../hooks/useFormState";
import { getButtonClasses } from "../../lib/button-variants";
import { FORM_INPUT_CLASSES, FORM_LABEL_CLASSES } from "../../lib/constants";

interface SignInFormState {
  email: string;
  password: string;
}

interface SignUpFormState {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export function AuthGate() {
  const { signIn, signUp } = useAuthActions();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const signInState = useFormState<SignInFormState>({ email: "", password: "" });
  const signUpState = useFormState<SignUpFormState>({ fullName: "", email: "", phone: "", password: "" });

  async function handleSignIn(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setNotice(null);

    const parsed = signInInputSchema.safeParse(signInState.form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Check your details and try again.");
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(parsed.data);
    setIsSubmitting(false);
    if (result.error) setFormError(result.error.message);
  }

  async function handleSignUp(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setNotice(null);

    const parsed = signUpCustomerInputSchema.safeParse(signUpState.form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Check your details and try again.");
      return;
    }

    setIsSubmitting(true);
    const result = await signUp(parsed.data);
    setIsSubmitting(false);
    if (result.error?.code === "confirmation_required") {
      setNotice(result.error.message);
      return;
    }
    if (result.error) setFormError(result.error.message);
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-[#14100D]/10 bg-white p-8">
      <div className="mb-6 flex gap-2 rounded-full bg-[#14100D]/5 p-1">
        <button
          type="button"
          onClick={() => setMode("sign-in")}
          className={`flex-1 rounded-full py-2 text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors ${
            mode === "sign-in" ? "bg-white text-[#14100D] shadow-sm" : "text-[#14100D]/50"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode("sign-up")}
          className={`flex-1 rounded-full py-2 text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors ${
            mode === "sign-up" ? "bg-white text-[#14100D] shadow-sm" : "text-[#14100D]/50"
          }`}
        >
          Create Account
        </button>
      </div>

      {notice && <p className="mb-4 rounded-lg bg-[#C89A4B]/10 p-3 text-sm text-[#14100D]">{notice}</p>}
      {formError && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {formError}
        </p>
      )}

      {mode === "sign-in" ? (
        <form onSubmit={handleSignIn} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="order-signin-email" className={FORM_LABEL_CLASSES}>
              Email
            </label>
            <input
              id="order-signin-email"
              type="email"
              autoComplete="email"
              value={signInState.form.email}
              onChange={(e) => signInState.updateField("email", e.target.value)}
              className={FORM_INPUT_CLASSES}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="order-signin-password" className={FORM_LABEL_CLASSES}>
              Password
            </label>
            <input
              id="order-signin-password"
              type="password"
              autoComplete="current-password"
              value={signInState.form.password}
              onChange={(e) => signInState.updateField("password", e.target.value)}
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
      ) : (
        <form onSubmit={handleSignUp} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="order-signup-name" className={FORM_LABEL_CLASSES}>
              Full Name
            </label>
            <input
              id="order-signup-name"
              type="text"
              autoComplete="name"
              value={signUpState.form.fullName}
              onChange={(e) => signUpState.updateField("fullName", e.target.value)}
              className={FORM_INPUT_CLASSES}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="order-signup-email" className={FORM_LABEL_CLASSES}>
              Email
            </label>
            <input
              id="order-signup-email"
              type="email"
              autoComplete="email"
              value={signUpState.form.email}
              onChange={(e) => signUpState.updateField("email", e.target.value)}
              className={FORM_INPUT_CLASSES}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="order-signup-phone" className={FORM_LABEL_CLASSES}>
              Phone
            </label>
            <input
              id="order-signup-phone"
              type="tel"
              autoComplete="tel"
              value={signUpState.form.phone}
              onChange={(e) => signUpState.updateField("phone", e.target.value)}
              className={FORM_INPUT_CLASSES}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="order-signup-password" className={FORM_LABEL_CLASSES}>
              Password
            </label>
            <input
              id="order-signup-password"
              type="password"
              autoComplete="new-password"
              value={signUpState.form.password}
              onChange={(e) => signUpState.updateField("password", e.target.value)}
              className={FORM_INPUT_CLASSES}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={getButtonClasses({ variant: "solid", size: "md", className: "mt-2 w-full disabled:opacity-60" })}
          >
            {isSubmitting ? "Creating Account…" : "Create Account"}
          </button>
        </form>
      )}
    </div>
  );
}
