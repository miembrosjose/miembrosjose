-- ============================================================
-- public.member_subscriptions — acceso de compradores del embudo.
--
-- Fuente de verdad del acceso a la plataforma. La escritura la hace
-- EXCLUSIVAMENTE el service_role (webhook del embudo, integrado más
-- adelante). El frontend SOLO puede LEER su propia fila (RLS).
--
-- Estados: pending | active | past_due | canceled
-- Aplicar en el proyecto Supabase de la plataforma (kjozrcugsywykpuvuqzu).
-- ============================================================

create table if not exists public.member_subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  email                  text not null,   -- unicidad case-insensitive vía índice UNIQUE (abajo)
  status                 text not null default 'pending'
                           check (status in ('pending','active','past_due','canceled')),
  stripe_customer_id     text,
  stripe_subscription_id text unique,
  subscription_status    text,
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Unicidad del email CASE-INSENSITIVE: impide duplicados como
-- Jose@email.com y jose@email.com. Migración idempotente y segura
-- (no borra tabla ni datos):
--   - elimina la unicidad case-sensitive heredada (constraint email UNIQUE) si existe;
--   - elimina el índice no-único anterior sobre lower(email) si existe;
--   - crea el índice UNIQUE sobre lower(email).
alter table public.member_subscriptions drop constraint if exists member_subscriptions_email_key;
drop index if exists public.member_subscriptions_email_lower_idx;
create unique index if not exists member_subscriptions_email_lower_key
  on public.member_subscriptions (lower(email));

-- updated_at automático (función con nombre dedicado para no pisar otras).
create or replace function public.member_subscriptions_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_member_subscriptions_updated_at on public.member_subscriptions;
create trigger trg_member_subscriptions_updated_at
  before update on public.member_subscriptions
  for each row execute function public.member_subscriptions_touch_updated_at();

-- ============================================================
-- RLS
-- ============================================================
alter table public.member_subscriptions enable row level security;

-- Cerramos la tabla a los roles del frontend; solo la política de SELECT
-- de abajo reabre la lectura de la fila propia. El service_role omite RLS.
revoke all on public.member_subscriptions from anon, authenticated;
grant select on public.member_subscriptions to authenticated;

-- SELECT: un usuario autenticado solo ve la fila cuyo email == email de su sesión (JWT).
drop policy if exists "read own subscription" on public.member_subscriptions;
create policy "read own subscription"
  on public.member_subscriptions
  for select
  to authenticated
  using ( lower(email) = lower(auth.jwt() ->> 'email') );

-- Sin políticas de INSERT / UPDATE / DELETE:
--   → anon y authenticated NO pueden escribir (denegado por defecto con RLS activo).
--   → solo el service_role (server-side, webhook futuro) escribe.
