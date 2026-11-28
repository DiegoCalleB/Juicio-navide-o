-- Correo de los padres (opcional): para reenviar el enlace guardado y, solo si lo aceptan expresamente, novedades.
-- Nunca se enlaza con datos de los niños: solo el ámbito (huella de la familia o id del portal) y el correo.
create table if not exists public.parent_contacts (
  id               uuid primary key default gen_random_uuid(),
  scope            text not null,
  email            text not null check (char_length(email) <= 120 and email = lower(email)),
  marketing_opt_in boolean not null default false,
  consent_at       timestamptz,
  consent_version  text,
  created_at       timestamptz not null default now(),
  unique (scope, email)
);
create index if not exists parent_contacts_created_idx on public.parent_contacts (created_at);
create index if not exists parent_contacts_marketing_idx on public.parent_contacts (marketing_opt_in) where marketing_opt_in;

alter table public.parent_contacts enable row level security; -- sin políticas: solo el servidor (clave secreta)
revoke all on public.parent_contacts from anon, authenticated;
