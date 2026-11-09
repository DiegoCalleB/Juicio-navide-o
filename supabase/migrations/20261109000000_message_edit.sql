-- Los padres pueden corregir el texto de un mensaje del personaje.
-- Se guarda cuándo, para que el sondeo del niño detecte el cambio.
-- Aditiva y sin datos: no reescribe filas existentes.
alter table public.room_messages add column if not exists edited_at timestamptz;

create index if not exists room_messages_room_edited_idx on public.room_messages (room_id, edited_at) where edited_at is not null;
