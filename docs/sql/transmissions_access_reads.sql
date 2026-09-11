-- ============================================================================
-- TRANSMISIONES — Acceso por categoría (paywall) + marcado de "leído"
-- ============================================================================
-- · Categorías bloqueables: VIDA Y PROPÓSITO gratis; las demás se desbloquean
--   con un link de pago ($9.99). Admin/testers ven todo.
-- · Marcado de leído por usuario (para la insignia "Leído" en las tarjetas).
-- Ejecutar en Supabase → SQL Editor → Run. Idempotente. RLS activado.
-- ============================================================================

-- ── Columnas de bloqueo en las categorías ────────────────────────────────
alter table public.transmission_categories add column if not exists is_locked boolean not null default false;
alter table public.transmission_categories add column if not exists unlock_url text;        -- link de checkout ($9.99)
alter table public.transmission_categories add column if not exists price_usd numeric(6,2) default 9.99;

-- VIDA Y PROPÓSITO gratis; el resto bloqueado por defecto.
update public.transmission_categories set is_locked = false where slug = 'vida-proposito';
update public.transmission_categories set is_locked = true  where slug <> 'vida-proposito';

-- ── Acceso por usuario a categorías (lo llena el pago/admin, no el cliente) ─
create table if not exists public.user_category_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  category_slug text not null references public.transmission_categories(slug),
  granted_at timestamptz not null default now(),
  primary key (user_id, category_slug)
);
alter table public.user_category_access enable row level security;

drop policy if exists "uca read own" on public.user_category_access;
create policy "uca read own" on public.user_category_access
  for select to authenticated using (user_id = auth.uid());
-- Sin insert/update/delete para authenticated → solo service_role concede acceso.

-- ── Marcado de "leído" por usuario ───────────────────────────────────────
create table if not exists public.transmission_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  transmission_slug text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, transmission_slug)
);
alter table public.transmission_reads enable row level security;

drop policy if exists "tx_reads read own" on public.transmission_reads;
create policy "tx_reads read own" on public.transmission_reads
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "tx_reads upsert own" on public.transmission_reads;
create policy "tx_reads upsert own" on public.transmission_reads
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "tx_reads delete own" on public.transmission_reads;
create policy "tx_reads delete own" on public.transmission_reads
  for delete to authenticated using (user_id = auth.uid());

select 'transmissions access + reads listo' as status;
