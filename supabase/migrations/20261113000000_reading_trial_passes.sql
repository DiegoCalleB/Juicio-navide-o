-- Nivel de lectura del niño, prueba gratuita de 3 días y Pases de Navidad (Stripe).
-- Solo añade cosas: las salas existentes siguen igual (sin límite de prueba).

alter table public.rooms
  add column if not exists reading_level text not null default 'yes'
    check (reading_level in ('yes', 'learning', 'no')),
  -- null = sin límite (salas anteriores o con pase). Si tiene fecha y no hay pase, al pasarla se bloquea.
  add column if not exists trial_ends_at timestamptz;

create table if not exists public.passes (
  id                uuid primary key default gen_random_uuid(),
  token_hash        text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  kind              text not null check (kind in ('paid', 'gift')),
  -- Solo los pagados: id de la sesión de Stripe Checkout (idempotencia del cobro).
  stripe_session_id text unique,
  -- El pase regalado apunta al pase que lo regaló.
  parent_pass_id    uuid references public.passes (id) on delete set null,
  amount_cents      integer check (amount_cents is null or amount_cents >= 0),
  rooms_limit       smallint not null default 10 check (rooms_limit between 1 and 50),
  expires_at        timestamptz not null,
  created_at        timestamptz not null default now()
);

alter table public.passes enable row level security; -- sin políticas: solo el servidor (clave secreta)
revoke all on public.passes from anon, authenticated;

alter table public.rooms
  add column if not exists pass_id uuid references public.passes (id) on delete set null;

create index if not exists rooms_pass_idx on public.rooms (pass_id) where pass_id is not null;
create index if not exists passes_expires_idx on public.passes (expires_at);
