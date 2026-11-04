-- Personajes ampliables: la lista permitida vive en la app (lib/characters.ts),
-- no en un CHECK cerrado. La BD solo exige un identificador con formato válido.
-- (La tabla estaba vacía al aplicar este cambio.)

alter table public.rooms drop constraint if exists rooms_king_check;
alter table public.rooms rename column king to character_id;
alter table public.rooms
  add constraint rooms_character_id_check check (character_id ~ '^[a-z][a-z0-9_]{1,30}$');
