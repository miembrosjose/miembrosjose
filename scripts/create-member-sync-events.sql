-- ============================================================
-- Sincronización embudo → plataforma: idempotencia + orden de eventos.
--
--  1) public.member_sync_events  → registro idempotente de cada evento Stripe
--     reenviado por el webhook del embudo (una fila por source_event_id).
--  2) member_subscriptions.last_status_event_created_at → epoch (segundos) del
--     último evento de estado aplicado, para descartar eventos fuera de orden.
--
-- NO borra ni recrea member_subscriptions. Escritura EXCLUSIVA del service_role.
-- ============================================================

-- 1) Tabla de idempotencia --------------------------------------------------
create table if not exists public.member_sync_events (
  source_event_id     text primary key,
  source_event_type   text,
  action              text,
  processing_status   text not null default 'processing'
                        check (processing_status in ('processing','completed','failed')),
  created_at          timestamptz not null default now(),
  completed_at        timestamptz,
  error_at            timestamptz
);

create index if not exists member_sync_events_status_idx
  on public.member_sync_events (processing_status);

alter table public.member_sync_events enable row level security;

-- Cerrada por completo a los roles del frontend. Sin políticas → sin acceso.
-- Solo el service_role (server-side, este endpoint) escribe/lee (omite RLS).
revoke all on public.member_sync_events from anon, authenticated;

-- 2) Orden de eventos en member_subscriptions -------------------------------
--    epoch en segundos del evento Stripe (source_event_created_at).
alter table public.member_subscriptions
  add column if not exists last_status_event_created_at bigint;
