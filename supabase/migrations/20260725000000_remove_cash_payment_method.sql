-- supabase/migrations/20260725000000_remove_cash_payment_method.sql
--
-- Cash is removed entirely per explicit owner decision: every order now
-- pays upfront (mobile money merchant code, or card once a processor
-- exists) before the kitchen prep cycle begins — see
-- 20260725010000_payment_gate_and_guest_checkout_payment.sql for the
-- acceptance gate this enables. `card`/`bank_transfer` remain valid
-- payment_method enum values (unchanged) but only mobile_money/card are
-- accepted here now; mirrors models/PaymentModel.ts's
-- getAllowedPaymentMethods() exactly. Keep both in sync if this changes.

create or replace function public.validate_payment_method()
returns trigger
language plpgsql
as $$
begin
  if new.method not in ('mobile_money', 'card') then
    raise exception 'only mobile_money or card payments are accepted';
  end if;
  return new;
end;
$$;
