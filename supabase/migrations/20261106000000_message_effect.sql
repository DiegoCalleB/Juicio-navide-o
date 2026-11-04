-- Efecto especial de un mensaje (modo sorpresa para grabar la reacción del niño).
alter table public.room_messages
  add column if not exists effect text
  check (effect is null or effect in ('surprise'));
