-- Cada familia puede ponerle nombre a su elfo y elegir si es chico o chica.
-- Aditiva: columnas opcionales, sin tocar las filas existentes.
alter table public.rooms add column if not exists character_alias text;
alter table public.rooms add column if not exists character_gender text;

alter table public.rooms drop constraint if exists rooms_character_alias_check;
alter table public.rooms add constraint rooms_character_alias_check
  check (character_alias is null or (char_length(character_alias) between 1 and 20));

alter table public.rooms drop constraint if exists rooms_character_gender_check;
alter table public.rooms add constraint rooms_character_gender_check
  check (character_gender is null or character_gender in ('m', 'f'));
