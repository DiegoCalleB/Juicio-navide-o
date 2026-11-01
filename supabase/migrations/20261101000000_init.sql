-- Juicio Navideño — esquema inicial. RLS + grants por columna + triggers anti-abuso.

create extension if not exists pgcrypto;

-- ───────────── TABLAS ─────────────
create table public.trials (
  id              uuid primary key default gen_random_uuid(),
  short_id        text not null unique check (short_id ~ '^[A-Za-z0-9]{8}$'),
  defendant_name  text not null check (char_length(defendant_name) between 2 and 40),
  charge          text not null check (char_length(charge) between 5 and 140),
  sentence        text not null check (char_length(sentence) between 5 and 140),
  photo_path      text check (photo_path is null or photo_path ~ '^[0-9a-f-]{36}\.webp$'),
  signature_count integer not null default 0 check (signature_count >= 0),
  creator_hash    text not null check (creator_hash ~ '^[0-9a-f]{64}$'),
  created_at      timestamptz not null default now()
);

create table public.signatures (
  id               uuid primary key default gen_random_uuid(),
  trial_id         uuid not null references public.trials(id) on delete cascade,
  signer_name      text not null check (char_length(signer_name) between 2 and 30),
  fingerprint_hash text not null check (fingerprint_hash ~ '^[0-9a-f]{64}$'),
  created_at       timestamptz not null default now(),
  unique (trial_id, fingerprint_hash)          -- 1 firma por dispositivo y juicio
);

create index signatures_trial_created_idx on public.signatures (trial_id, created_at desc);
create index trials_creator_created_idx   on public.trials (creator_hash, created_at desc);
create index signatures_fp_created_idx    on public.signatures (fingerprint_hash, created_at desc);

-- ───────────── RLS ─────────────
alter table public.trials     enable row level security;
alter table public.signatures enable row level security;

-- Grants por columna: los hashes nunca son legibles y el contador no es escribible.
revoke all on public.trials, public.signatures from anon, authenticated;
grant select (id, short_id, defendant_name, charge, sentence, photo_path, signature_count, created_at)
  on public.trials to anon, authenticated;
grant insert (short_id, defendant_name, charge, sentence, photo_path, creator_hash)
  on public.trials to anon, authenticated;
grant select (id, trial_id, signer_name, created_at) on public.signatures to anon, authenticated;
grant insert (trial_id, signer_name, fingerprint_hash) on public.signatures to anon, authenticated;

create policy trials_read_public on public.trials
  for select to anon, authenticated using (true);

create policy trials_insert_public on public.trials
  for insert to anon, authenticated
  with check (
    char_length(defendant_name) between 2 and 40
    and char_length(charge) between 5 and 140
    and char_length(sentence) between 5 and 140
    and defendant_name !~ '[<>]' and charge !~ '[<>]' and sentence !~ '[<>]'
    and signature_count = 0
  );

create policy signatures_read_public on public.signatures
  for select to anon, authenticated using (true);

create policy signatures_insert_public on public.signatures
  for insert to anon, authenticated
  with check (
    char_length(signer_name) between 2 and 30
    and signer_name !~ '[<>]'
    and exists (select 1 from public.trials t where t.id = trial_id)
  );
-- Sin policies de UPDATE/DELETE: inmutable desde la API pública.

-- ───────────── TRIGGERS ─────────────
create function public.trials_rate_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.trials
        where creator_hash = new.creator_hash and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'RATE_LIMIT' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger trials_rate_limit_trg before insert on public.trials
  for each row execute function public.trials_rate_limit();

create function public.signatures_rate_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.signatures
        where fingerprint_hash = new.fingerprint_hash and created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'RATE_LIMIT' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger signatures_rate_limit_trg before insert on public.signatures
  for each row execute function public.signatures_rate_limit();

create function public.bump_signature_count() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.trials set signature_count = signature_count + 1 where id = new.trial_id;
  return new;
end $$;

create trigger signatures_count_trg after insert on public.signatures
  for each row execute function public.bump_signature_count();

revoke execute on function public.trials_rate_limit(), public.signatures_rate_limit(),
  public.bump_signature_count() from public, anon, authenticated;

-- ───────────── STORAGE (fotos ya comprimidas a WebP ≤600px) ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidence', 'evidence', true, 262144, array['image/webp'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy evidence_insert_public on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'evidence' and name ~ '^[0-9a-f-]{36}\.webp$');
