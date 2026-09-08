-- ============================================================================
-- ACTIVIDAD DE LA RED — community_events
-- ============================================================================
-- 1 fila por evento comunitario (NO fan-out). Sustituye el patrón de crear una
-- notificación por cada usuario. Los avisos PERSONALES siguen en `notifications`.
-- Ejecutar PRIMERO este archivo, luego refactor_fanout_to_events.sql.
-- Idempotente.
-- ============================================================================

create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  actor_user_id uuid,
  actor_name text,
  actor_avatar_url text,
  actor_display_mode text not null default 'name',   -- name | anonymous
  title text not null,
  preview text,
  link text,
  visibility text not null default 'members',         -- public | members | country | city | anonymous | admin
  category text not null default 'system',            -- progress | season | badge | rank | streak | forum | map | node | message | system
  priority text not null default 'normal',            -- low | normal | important | highlight
  country text,
  city text,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  metadata jsonb
);

create index if not exists community_events_created_idx  on public.community_events (created_at desc);
create index if not exists community_events_category_idx on public.community_events (category);
create index if not exists community_events_visibility_idx on public.community_events (visibility);

alter table public.community_events enable row level security;

-- Lectura: autenticados ven public/members; el admin ve todo (incl. 'admin').
drop policy if exists "community_events read" on public.community_events;
create policy "community_events read" on public.community_events
  for select to authenticated
  using (
    visibility in ('public','members')
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Sin policy de INSERT/UPDATE/DELETE → los usuarios no pueden crear eventos.
-- Los triggers (SECURITY DEFINER) y el backend (service_role) sí insertan.

select 'community_events lista' as status;
