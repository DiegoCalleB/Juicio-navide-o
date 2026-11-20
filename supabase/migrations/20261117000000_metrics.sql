-- Métricas propias, sin cookies ni terceros: contadores por día, evento y origen.
-- «metrics_seen» guarda un hash que cambia cada día (no sirve para seguir a nadie de un día a otro) y se borra a diario.
create table if not exists public.metrics_daily (
  day   date not null,
  event text not null check (event ~ '^[a-z0-9_]{2,40}$'),
  src   text not null default 'directo' check (src ~ '^[a-z0-9_]{1,20}$'),
  total integer not null default 0,
  uniq  integer not null default 0,
  primary key (day, event, src)
);
create table if not exists public.metrics_seen (
  day     date not null,
  event   text not null,
  visitor text not null check (visitor ~ '^[0-9a-f]{16,64}$'),
  primary key (day, event, visitor)
);
alter table public.metrics_daily enable row level security;
alter table public.metrics_seen enable row level security;
revoke all on public.metrics_daily, public.metrics_seen from anon, authenticated;

create or replace function public.metrics_bump(p_day date, p_event text, p_src text, p_visitor text)
returns void language plpgsql security definer set search_path = public as $$
declare n integer; is_new boolean;
begin
  insert into public.metrics_seen(day, event, visitor) values (p_day, p_event, p_visitor) on conflict do nothing;
  get diagnostics n = row_count;
  is_new := n > 0;
  insert into public.metrics_daily(day, event, src, total, uniq)
  values (p_day, p_event, p_src, 1, case when is_new then 1 else 0 end)
  on conflict (day, event, src) do update
    set total = public.metrics_daily.total + 1,
        uniq  = public.metrics_daily.uniq + (case when is_new then 1 else 0 end);
end $$;
revoke all on function public.metrics_bump(date, text, text, text) from public, anon, authenticated;
grant execute on function public.metrics_bump(date, text, text, text) to service_role;

create or replace function public.metrics_purge_seen() returns void language sql security definer set search_path = public as $$
  delete from public.metrics_seen where day < (now() at time zone 'Europe/Madrid')::date - 1;
$$;
revoke all on function public.metrics_purge_seen() from public, anon, authenticated;
grant execute on function public.metrics_purge_seen() to service_role;
