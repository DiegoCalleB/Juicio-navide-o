-- Variante de idioma de la sala: 'es' (España) o 'es-419' (Latinoamérica).
-- Solo añade una columna con valor por defecto: las salas existentes siguen igual.
alter table public.rooms
  add column if not exists locale text not null default 'es'
    check (locale in ('es', 'es-419'));
