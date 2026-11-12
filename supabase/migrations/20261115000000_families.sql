-- Familias: un enlace de familia reconstruye el panel de cada sala (solo se guardan huellas).
--   enlace de familia → enlace del panel de cada sala (con family_seed) → enlace del niño
-- Solo añade columnas: las salas existentes siguen igual (sin familia).
alter table public.rooms
  add column if not exists family_hash text check (family_hash is null or family_hash ~ '^[0-9a-f]{64}$'),
  add column if not exists family_seed text check (family_seed is null or char_length(family_seed) between 16 and 64),
  add column if not exists family_name text check (family_name is null or char_length(family_name) <= 30);

create index if not exists rooms_family_idx on public.rooms (family_hash) where family_hash is not null;
