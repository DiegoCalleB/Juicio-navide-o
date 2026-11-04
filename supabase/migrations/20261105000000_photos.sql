-- Fotos en la mensajería (ambos sentidos). Bucket privado 'media', URLs firmadas.

alter table public.room_messages drop constraint if exists room_messages_kind_check;
alter table public.room_messages drop constraint if exists room_messages_check;

alter table public.room_messages
  add column if not exists image_path text
  check (image_path is null or image_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg)$');

alter table public.room_messages
  add constraint room_messages_kind_check check (kind in ('text', 'voice', 'photo'));

alter table public.room_messages
  add constraint room_messages_payload_check check (
    (kind = 'text'  and body is not null)
    or (kind = 'voice' and audio_path is not null)
    or (kind = 'photo' and image_path is not null)
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 1572864, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
-- Sin policies en storage.objects para 'media': solo la clave secreta del servidor.
