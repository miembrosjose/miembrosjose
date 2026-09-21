-- ============================================================================
-- LA RED · VERTICAL 5 — SOLICITUDES DE FUNCIÓN    PREPARADA, NO EJECUTADA
-- ============================================================================
-- Hasta ahora las funciones se concedían a dedo: el administrador tenía que
-- adivinar quién quería organizar encuentros en su ciudad. Esto permite que
-- alguien DÉ UN PASO AL FRENTE y lo pida.
--
-- Correr DESPUÉS de red_v4_encuentros.sql (necesita public.is_admin()).
--
-- GARANTÍAS
--   · Solo CREA una tabla. No modifica ni borra nada existente.
--   · Nace con RLS activado y con sus policies desde el primer momento.
--   · Idempotente.
--
-- LO QUE DELIBERADAMENTE NO LLEVA
--   Ni puntuaciones, ni méritos, ni ranking de candidatos, ni historial de
--   rechazos que pese sobre nadie. Rechazar no es un castigo: se puede volver
--   a pedir más adelante y la solicitud anterior no deja marca visible.
--
-- CONCEDER SIGUE SIENDO UNA SOLA PUERTA
--   Aprobar una solicitud NO escribe en network_role_assignments desde aquí.
--   La aplicación llama al mismo endpoint de siempre, para que el permiso
--   tenga un único sitio por donde pasa.
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════
-- 1 · LA TABLA
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.network_role_requests (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role_code   text not null references public.network_roles(code),

  -- Qué se propone hacer. Es lo único que se le pide a quien solicita.
  mensaje     text not null default '',

  estado      text not null default 'pendiente'
              check (estado in ('pendiente', 'aprobada', 'rechazada')),

  -- Quién decidió y qué respondió. La respuesta la lee quien solicitó.
  decided_by  uuid references auth.users(id) on delete set null,
  decided_at  timestamptz,
  respuesta   text,

  created_at  timestamptz not null default now()
);

-- Una sola solicitud PENDIENTE por persona y función. El histórico ya decidido
-- puede repetirse tantas veces como haga falta: volver a pedir está permitido.
-- Misma técnica que el índice de asignaciones vigentes de la Vertical 1.
create unique index if not exists idx_nrr_pendiente
  on public.network_role_requests (user_id, role_code)
  where estado = 'pendiente';

-- El caso de uso del panel: «las pendientes, las más antiguas primero».
create index if not exists idx_nrr_bandeja
  on public.network_role_requests (created_at) where estado = 'pendiente';

create index if not exists idx_nrr_usuario
  on public.network_role_requests (user_id, created_at desc);


-- ════════════════════════════════════════════════════════════════════════
-- 2 · RLS
-- ════════════════════════════════════════════════════════════════════════

alter table public.network_role_requests enable row level security;

revoke all on public.network_role_requests from anon;
grant select, insert, update, delete on public.network_role_requests to authenticated;
grant usage, select on sequence public.network_role_requests_id_seq to authenticated;

-- Lectura: lo propio. El administrador ve todo.
drop policy if exists "requests read own" on public.network_role_requests;
create policy "requests read own" on public.network_role_requests
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Solicitar: solo a nombre propio, solo en estado pendiente, y solo una
-- función que exista y esté activa. Además NO se puede pedir algo que ya se
-- tiene: sin esto, la bandeja se llenaría de solicitudes sin sentido.
drop policy if exists "requests create own" on public.network_role_requests;
create policy "requests create own" on public.network_role_requests
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and estado = 'pendiente'
    and decided_by is null
    and decided_at is null
    and exists (
      select 1 from public.network_roles r
      where r.code = role_code and r.is_active
    )
    and not public.has_network_role(auth.uid(), role_code)
  );

-- Decidir: únicamente el administrador. Quien solicitó NO puede cambiar el
-- estado de su propia solicitud — si pudiera, se aprobaría solo.
drop policy if exists "requests decide" on public.network_role_requests;
create policy "requests decide" on public.network_role_requests
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Retirar la solicitud: quien la hizo, mientras siga pendiente. Una vez
-- decidida queda como histórico. El administrador puede borrar cualquiera.
drop policy if exists "requests withdraw" on public.network_role_requests;
create policy "requests withdraw" on public.network_role_requests
  for delete to authenticated
  using (
    (user_id = auth.uid() and estado = 'pendiente')
    or public.is_admin()
  );


-- ════════════════════════════════════════════════════════════════════════
-- 3 · VERIFICACIÓN (solo lectura)
-- ════════════════════════════════════════════════════════════════════════
-- El editor de Supabase muestra solo el ÚLTIMO resultado: este es el que verás.

select
  c.relname::text  as tabla,
  c.relrowsecurity as rls_activo,
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname) as policies,
  has_table_privilege('anon', c.oid, 'SELECT') as anon_lee,
  has_table_privilege('anon', c.oid, 'INSERT') as anon_escribe
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'network_role_requests';

-- Se espera: rls_activo = true, policies = 4, anon_lee = false, anon_escribe = false.
