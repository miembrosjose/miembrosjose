-- ============================================================================
-- Los 144.000 — Progreso de meditaciones (audio)
-- ============================================================================
-- Crea SOLO la tabla de progreso de meditaciones + sus políticas RLS.
--
-- Seguro:
--   • No borra datos.
--   • No modifica usuarios existentes.
--   • No elimina ni altera ninguna tabla (episodios, temporadas, subs, etc.).
--   • Usa "create table if not exists" (idempotente: re-ejecutar no rompe).
--   • RLS activado: cada usuario solo lee/escribe SU propio progreso.
--
-- Cómo ejecutarlo:
--   Supabase → SQL Editor → New query → pega TODO esto → Run.
-- ============================================================================

create table if not exists public.user_meditation_progress (
  user_id          uuid        not null references auth.users(id) on delete cascade,
  meditation_id    text        not null,
  position_seconds integer     not null default 0,
  duration_seconds integer     not null default 0,
  percent          integer     not null default 0,
  completed        boolean     not null default false,
  updated_at       timestamptz not null default now(),
  primary key (user_id, meditation_id)
);

alter table public.user_meditation_progress enable row level security;

-- Cada usuario solo VE su propio progreso.
drop policy if exists "own med progress select" on public.user_meditation_progress;
create policy "own med progress select"
  on public.user_meditation_progress
  for select
  using (auth.uid() = user_id);

-- Cada usuario solo INSERTA filas suyas.
drop policy if exists "own med progress insert" on public.user_meditation_progress;
create policy "own med progress insert"
  on public.user_meditation_progress
  for insert
  with check (auth.uid() = user_id);

-- Cada usuario solo ACTUALIZA filas suyas.
drop policy if exists "own med progress update" on public.user_meditation_progress;
create policy "own med progress update"
  on public.user_meditation_progress
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
