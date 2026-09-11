-- ============================================================================
-- TRANSMISIONES — Reacciones y comentarios de miembros
-- ============================================================================
-- Da vida a la página de lectura: los miembros pueden reaccionar y comentar.
-- Ejecutar en Supabase → SQL Editor → Run. Idempotente. RLS activado.
-- ============================================================================

-- ── Reacciones (una por miembro + emoji + transmisión) ───────────────────
create table if not exists public.transmission_reactions (
  id uuid primary key default gen_random_uuid(),
  transmission_slug text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (transmission_slug, user_id, emoji)
);
create index if not exists tx_reactions_slug_idx on public.transmission_reactions (transmission_slug);

-- ── Comentarios ──────────────────────────────────────────────────────────
create table if not exists public.transmission_comments (
  id uuid primary key default gen_random_uuid(),
  transmission_slug text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text,
  author_avatar text,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists tx_comments_slug_idx on public.transmission_comments (transmission_slug, created_at desc);

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.transmission_reactions enable row level security;
alter table public.transmission_comments enable row level security;

-- Reacciones: miembros autenticados leen todo; cada uno crea/borra las suyas.
drop policy if exists "tx_reactions read" on public.transmission_reactions;
create policy "tx_reactions read" on public.transmission_reactions
  for select to authenticated using (true);

drop policy if exists "tx_reactions insert own" on public.transmission_reactions;
create policy "tx_reactions insert own" on public.transmission_reactions
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "tx_reactions delete own" on public.transmission_reactions;
create policy "tx_reactions delete own" on public.transmission_reactions
  for delete to authenticated using (user_id = auth.uid());

-- Comentarios: miembros autenticados leen todo; cada uno crea los suyos;
-- borra los suyos o, si es admin, cualquiera.
drop policy if exists "tx_comments read" on public.transmission_comments;
create policy "tx_comments read" on public.transmission_comments
  for select to authenticated using (true);

drop policy if exists "tx_comments insert own" on public.transmission_comments;
create policy "tx_comments insert own" on public.transmission_comments
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "tx_comments delete own or admin" on public.transmission_comments;
create policy "tx_comments delete own or admin" on public.transmission_comments
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

select 'transmissions engagement listo' as status;
