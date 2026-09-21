-- ============================================================================
-- LA RED · VERTICAL 4 — ENCUENTROS PRESENCIALES    PREPARADA, NO EJECUTADA
-- ============================================================================
-- Dos tablas nuevas: los encuentros y quién asiste. Más la función is_admin()
-- que hasta ahora solo existía en el código de la aplicación.
--
-- Correr DESPUÉS de red_v1_identidad.sql, red_v2_directorio.sql y
-- red_v3_mapa.sql.
--
-- GARANTÍAS
--   · Solo CREA. No modifica ni borra ninguna tabla, fila, policy o grant que
--     ya exista.
--   · Las dos tablas nacen con RLS activado y con policies desde el primer
--     momento. Nunca quedan abiertas ni un instante.
--   · Idempotente.
--
-- POR QUÉ IMPORTA EL ORDEN DE LAS POLICIES
--   En PostgreSQL las policies permisivas se combinan con OR: cada una que se
--   añade AMPLÍA el acceso, nunca lo reduce. Por eso estas tablas se crean con
--   su juego completo de una vez, en lugar de irlo ampliando después.
--
-- PRIVACIDAD
--   Un encuentro se ancla a una CIUDAD del catálogo, igual que el resto de la
--   Red. El lugar concreto es texto libre que escribe quien organiza, pensado
--   para un sitio público: una plaza, un parque, un local. No se geocodifica,
--   no se guardan coordenadas propias y no hay ningún campo de domicilio.
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════
-- 1 · QUIÉN ES ADMINISTRADOR
-- ════════════════════════════════════════════════════════════════════════
-- La fuente de verdad sigue siendo profiles.is_admin, la misma que usa
-- lib/admin-auth.ts. Aquí solo se envuelve para poder consultarla desde una
-- policy.
--
-- Tiene que ser SECURITY DEFINER: las subconsultas de una policy se ejecutan
-- con los privilegios de quien invoca, y `authenticated` solo puede leer su
-- PROPIA fila de profiles desde el endurecimiento de seguridad. Sin DEFINER,
-- la comprobación fallaría en silencio para cualquier fila ajena.
--
-- search_path fijado: sin eso, quien pueda crear objetos en otro esquema
-- podría colar su propia tabla `profiles` y volverse administrador.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$fn$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;


-- ════════════════════════════════════════════════════════════════════════
-- 2 · ENCUENTROS
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.network_meetings (
  id            bigserial primary key,
  created_by    uuid not null references auth.users(id) on delete cascade,

  -- Dónde, al nivel de siempre: la ciudad del catálogo.
  city_id       bigint not null references public.network_cities(id) on delete restrict,
  country_code  char(2) not null,
  -- Sitio público, en palabras de quien organiza. Nunca un domicilio.
  lugar         text not null default '',

  titulo        text not null,
  descripcion   text not null default '',

  starts_at     timestamptz not null,
  ends_at       timestamptz,

  -- null = sin límite declarado.
  cupo          int,

  -- borrador  → solo lo ve quien lo creó
  -- publicado → visible para toda la Red
  -- cancelado → sigue visible, marcado, para quien ya se había apuntado
  estado        text not null default 'borrador'
                check (estado in ('borrador', 'publicado', 'cancelado')),

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint network_meetings_titulo_no_vacio check (length(btrim(titulo)) > 0),
  constraint network_meetings_fin_despues check (ends_at is null or ends_at >= starts_at),
  constraint network_meetings_cupo_positivo check (cupo is null or cupo > 0)
);

-- El caso de uso real: «próximos encuentros publicados, por ciudad».
create index if not exists idx_meetings_ciudad_fecha
  on public.network_meetings (city_id, starts_at) where estado = 'publicado';
create index if not exists idx_meetings_pais_fecha
  on public.network_meetings (country_code, starts_at) where estado = 'publicado';
create index if not exists idx_meetings_autor
  on public.network_meetings (created_by, starts_at desc);

create or replace function public.network_meetings_touch()
returns trigger language plpgsql as $fn$
begin
  new.updated_at := now();
  return new;
end $fn$;

drop trigger if exists trg_network_meetings_touch on public.network_meetings;
create trigger trg_network_meetings_touch
  before update on public.network_meetings
  for each row execute function public.network_meetings_touch();


-- ════════════════════════════════════════════════════════════════════════
-- 3 · ASISTENCIA
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.network_meeting_participants (
  meeting_id  bigint not null references public.network_meetings(id) on delete cascade,
  user_id     uuid   not null references auth.users(id) on delete cascade,
  estado      text   not null default 'voy' check (estado in ('voy', 'quizas')),
  created_at  timestamptz not null default now(),
  primary key (meeting_id, user_id)
);

create index if not exists idx_meeting_participants_user
  on public.network_meeting_participants (user_id);


-- ════════════════════════════════════════════════════════════════════════
-- 4 · RLS — ENCUENTROS
-- ════════════════════════════════════════════════════════════════════════
-- El permiso de organizar es REAL: vive aquí, no en el frontend. Aunque
-- alguien llame a PostgREST directamente, sin pasar por la aplicación, sigue
-- necesitando el rol vigente.

alter table public.network_meetings enable row level security;

-- anon no tiene nada que hacer en la Red.
revoke all on public.network_meetings from anon;
grant select, insert, update, delete on public.network_meetings to authenticated;
grant usage, select on sequence public.network_meetings_id_seq to authenticated;

-- Lectura: lo publicado (y lo cancelado, que también está publicado en su
-- momento) lo ve toda la Red; los borradores, solo su autor.
drop policy if exists "meetings read" on public.network_meetings;
create policy "meetings read" on public.network_meetings
  for select to authenticated
  using (
    estado in ('publicado', 'cancelado')
    or created_by = auth.uid()
    or public.is_admin()
  );

-- Creación: hace falta el rol de Organizador vigente. Y solo se puede crear a
-- nombre propio: sin esto, cualquiera podría atribuir un encuentro a otra
-- persona.
drop policy if exists "meetings create" on public.network_meetings;
create policy "meetings create" on public.network_meetings
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.has_network_role(auth.uid(), 'organizador')
      or public.is_admin()
    )
  );

-- Edición: solo quien lo creó, y solo mientras conserve el rol. Si se le
-- retira, deja de poder tocarlo — el permiso no se queda pegado al encuentro.
-- El WITH CHECK repetido impide traspasárselo a otra persona por UPDATE.
drop policy if exists "meetings update" on public.network_meetings;
create policy "meetings update" on public.network_meetings
  for update to authenticated
  using (
    (created_by = auth.uid() and public.has_network_role(auth.uid(), 'organizador'))
    or public.is_admin()
  )
  with check (
    (created_by = auth.uid() and public.has_network_role(auth.uid(), 'organizador'))
    or public.is_admin()
  );

-- Borrado: solo borradores. Un encuentro ya publicado se CANCELA, nunca se
-- hace desaparecer: hay gente que se apuntó y merece ver qué pasó con él.
drop policy if exists "meetings delete" on public.network_meetings;
create policy "meetings delete" on public.network_meetings
  for delete to authenticated
  using (
    (created_by = auth.uid() and estado = 'borrador')
    or public.is_admin()
  );


-- ════════════════════════════════════════════════════════════════════════
-- 5 · RLS — ASISTENCIA
-- ════════════════════════════════════════════════════════════════════════

alter table public.network_meeting_participants enable row level security;

revoke all on public.network_meeting_participants from anon;
grant select, insert, update, delete on public.network_meeting_participants to authenticated;

-- Lectura: quién va a un encuentro que puedas ver. La subconsulta se apoya en
-- la policy de lectura de arriba, así que los borradores ajenos no filtran ni
-- su lista de asistentes.
drop policy if exists "participants read" on public.network_meeting_participants;
create policy "participants read" on public.network_meeting_participants
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.network_meetings m
      where m.id = meeting_id
        and (m.estado in ('publicado', 'cancelado') or m.created_by = auth.uid())
    )
    or public.is_admin()
  );

-- Apuntarse: solo a uno mismo, y solo a encuentros publicados. Nadie apunta a
-- nadie.
drop policy if exists "participants join" on public.network_meeting_participants;
create policy "participants join" on public.network_meeting_participants
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.network_meetings m
      where m.id = meeting_id and m.estado = 'publicado'
    )
  );

-- Cambiar de «voy» a «quizás»: solo la propia respuesta.
drop policy if exists "participants update own" on public.network_meeting_participants;
create policy "participants update own" on public.network_meeting_participants
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Borrarse: uno mismo. Quien organiza también puede quitar a alguien de su
-- encuentro, que es parte de moderar lo que convocó.
drop policy if exists "participants leave" on public.network_meeting_participants;
create policy "participants leave" on public.network_meeting_participants
  for delete to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.network_meetings m
      where m.id = meeting_id and m.created_by = auth.uid()
    )
    or public.is_admin()
  );


-- ════════════════════════════════════════════════════════════════════════
-- 6 · VERIFICACIÓN (solo lectura)
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
where n.nspname = 'public'
  and c.relname in ('network_meetings', 'network_meeting_participants')
order by c.relname;

-- Se espera: rls_activo = true, policies = 4, anon_lee = false, anon_escribe = false.
