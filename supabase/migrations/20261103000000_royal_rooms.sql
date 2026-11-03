-- Mensajería Real de Oriente: salas niño ↔ padres (Paje Real), asíncronas.
-- Seguridad: tablas y bucket SIN acceso para anon/authenticated. Solo el servidor
-- (clave secreta, server-only) accede, tras validar el token de capacidad de la URL.
-- Los tokens nunca se guardan en claro: solo su SHA-256.

create table public.rooms (
  id                uuid primary key default gen_random_uuid(),
  child_token_hash  text not null unique check (child_token_hash ~ '^[0-9a-f]{64}$'),
  parent_token_hash text not null unique check (parent_token_hash ~ '^[0-9a-f]{64}$'),
  child_name        text not null check (char_length(child_name) between 1 and 30),
  king              text not null check (king in ('melchor', 'gaspar', 'baltasar')),
  creator_hash      text not null check (creator_hash ~ '^[0-9a-f]{64}$'),
  created_at        timestamptz not null default now(),
  expires_at        timestamptz not null default now() + interval '45 days'
);

create table public.room_messages (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.rooms(id) on delete cascade,
  sender      text not null check (sender in ('child', 'king', 'system')),
  kind        text not null check (kind in ('text', 'voice')),
  body        text check (body is null or char_length(body) between 1 and 600),
  audio_path  text check (audio_path is null or audio_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webm|mp4|m4a|ogg|mp3)$'),
  duration_s  numeric(5, 1) check (duration_s is null or duration_s between 0 and 120),
  deliver_at  timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  check ((kind = 'text' and body is not null) or (kind = 'voice' and audio_path is not null))
);

create index room_messages_room_deliver_idx on public.room_messages (room_id, deliver_at);
create index rooms_creator_created_idx on public.rooms (creator_hash, created_at desc);
create index rooms_expires_idx on public.rooms (expires_at);

alter table public.rooms enable row level security;
alter table public.room_messages enable row level security;
revoke all on public.rooms, public.room_messages from anon, authenticated;
-- Sin policies: denegado por defecto a la API pública.

-- Anti-abuso en BD (barrera autoritativa, además del rate limit del servidor).
create function public.rooms_rate_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.rooms
        where creator_hash = new.creator_hash and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'RATE_LIMIT' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger rooms_rate_limit_trg before insert on public.rooms
  for each row execute function public.rooms_rate_limit();

create function public.room_messages_rate_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.sender <> 'system' and (select count(*) from public.room_messages
        where room_id = new.room_id and sender = new.sender
          and created_at > now() - interval '1 hour') >= 40 then
    raise exception 'RATE_LIMIT' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger room_messages_rate_limit_trg before insert on public.room_messages
  for each row execute function public.room_messages_rate_limit();

revoke execute on function public.rooms_rate_limit(), public.room_messages_rate_limit()
  from public, anon, authenticated;

-- Audios: bucket PRIVADO. Se sirven solo con URLs firmadas de corta duración.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('voices', 'voices', false, 2097152,
        array['audio/webm', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/mpeg'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
-- Sin policies en storage.objects para 'voices': solo la clave secreta del servidor.
