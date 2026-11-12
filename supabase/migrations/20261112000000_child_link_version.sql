-- Los padres pueden cambiar el enlace del niño si se comparte por error.
-- El enlace del niño se deriva del de los padres y de este contador (0 = el actual, no cambia).
-- Aditiva: columna con valor por defecto, sin tocar las filas existentes.
alter table public.rooms add column if not exists child_link_version smallint not null default 0;
