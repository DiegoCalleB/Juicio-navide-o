-- Reembolsos y disputas: se guarda el identificador del pago de Stripe para poder retirar el pase si se devuelve el dinero.
-- Solo añade una columna (nula en los pases anteriores): no borra ni modifica nada existente.
alter table public.passes add column if not exists stripe_payment_intent text;
create unique index if not exists passes_payment_intent_idx on public.passes (stripe_payment_intent) where stripe_payment_intent is not null;
