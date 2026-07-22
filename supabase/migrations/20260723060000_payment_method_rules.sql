-- ============================================================================
-- Payment method restriction by order channel — "for now" starting rule.
-- ============================================================================
-- Mirrors models/PaymentModel.ts's getAllowedPaymentMethods() exactly:
-- delivery orders require mobile_money (a merchant code); dine_in, pickup,
-- and whatsapp orders accept mobile_money or cash. `card`/`bank_transfer`
-- remain valid enum values (not removed from payment_method) but are
-- rejected here — this is a business rule, not a permanent schema
-- restriction, and is meant to loosen later without another enum change.
--
-- This trigger is defense-in-depth, not the primary enforcement —
-- SupabasePaymentService.collectPayment already checks the same rule in
-- TypeScript before ever reaching the database. Keep both in sync if this
-- rule changes.

create or replace function public.validate_payment_method()
returns trigger
language plpgsql
as $$
declare
  v_channel public.order_channel;
begin
  select channel into v_channel from public.orders where id = new.order_id;

  if v_channel = 'delivery' and new.method <> 'mobile_money' then
    raise exception 'delivery orders require a mobile_money (merchant code) payment';
  end if;

  if v_channel <> 'delivery' and new.method not in ('mobile_money', 'cash') then
    raise exception 'only mobile_money or cash payments are accepted for % orders', v_channel;
  end if;

  return new;
end;
$$;

create trigger validate_payment_method_before_insert
  before insert on public.payments
  for each row execute function public.validate_payment_method();
