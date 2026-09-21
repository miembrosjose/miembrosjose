-- ============================================================================
-- LA RED · VERTICAL 1 — IDENTIDAD    PREPARADA, NO EJECUTADA
-- ============================================================================
-- Añade ubicación estructurada (país + ciudad), su privacidad, y los roles
-- funcionales de La Red con permisos reales.
--
-- GARANTÍAS
--   · Solo CREATE. No altera ni borra ninguna tabla, columna o policy existente.
--   · No toca profiles ni el hardening de RLS aplicado el 15-09.
--   · Idempotente: create if not exists + on conflict do nothing.
--   · Rollback en docs/sql/red_v1_identidad_rollback.sql
--
-- PRIVACIDAD POR DISEÑO
--   Nunca se guarda domicilio, GPS ni posición en tiempo real. El dato más
--   fino es la CIUDAD, y sus coordenadas son las del centro de la ciudad,
--   compartidas por todos sus miembros.
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════
-- 1 · CIUDADES NORMALIZADAS
-- ════════════════════════════════════════════════════════════════════════
-- En tabla y no en un archivo del código: añadir ciudades pasa a ser un
-- INSERT, sin recompilar ni desplegar. Importa con Actions bloqueado.
--
-- name_norm: nombre sin tildes y en minúsculas, para que buscar «cuenca»
-- encuentre «Cuenca». Lo rellena un trigger, no el cliente.

create table if not exists public.network_cities (
  id            bigserial primary key,
  country_code  char(2) not null,
  name          text    not null,
  name_norm     text    not null default '',
  admin1        text,                       -- provincia / estado / región
  lat           double precision not null,  -- centro de la ciudad
  lon           double precision not null,
  population    integer,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (country_code, name, admin1)
);

create index if not exists idx_network_cities_country on public.network_cities (country_code) where is_active;
create index if not exists idx_network_cities_search  on public.network_cities (country_code, name_norm) where is_active;

-- Normalización automática del nombre de búsqueda.
create or replace function public.network_cities_norm()
returns trigger language plpgsql as $fn$
begin
  new.name_norm := lower(translate(new.name,
    'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
    'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'));
  return new;
end $fn$;

drop trigger if exists trg_network_cities_norm on public.network_cities;
create trigger trg_network_cities_norm
  before insert or update of name on public.network_cities
  for each row execute function public.network_cities_norm();

alter table public.network_cities enable row level security;

-- Catálogo público para miembros: hace falta para el selector.
drop policy if exists "cities read members" on public.network_cities;
create policy "cities read members" on public.network_cities
  for select to authenticated using (is_active);
-- Sin insert/update/delete: el catálogo lo mantiene service_role.


-- ════════════════════════════════════════════════════════════════════════
-- 2 · UBICACIÓN DEL MIEMBRO
-- ════════════════════════════════════════════════════════════════════════
-- Una fila por miembro. country_code se guarda siempre: permite estadísticas
-- agregadas por país aunque la persona oculte su ciudad.
--
-- show_city por defecto FALSE. Nadie aparece en el directorio sin haberlo
-- elegido: la ubicación se pide para encontrarse, no para exponerse por
-- omisión.

create table if not exists public.member_location (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  country_code  char(2) not null,
  city_id       bigint references public.network_cities(id) on delete set null,
  show_city     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_member_location_country on public.member_location (country_code);
create index if not exists idx_member_location_city    on public.member_location (city_id) where city_id is not null;
-- Índice del caso de uso real: «miembros visibles de esta ciudad».
create index if not exists idx_member_location_visible on public.member_location (city_id, country_code) where show_city;

alter table public.member_location enable row level security;

-- Lectura: la fila propia siempre; las ajenas solo si su dueño lo permitió.
drop policy if exists "location read own or visible" on public.member_location;
create policy "location read own or visible" on public.member_location
  for select to authenticated
  using (user_id = auth.uid() or show_city);

-- Escritura: únicamente la fila propia.
drop policy if exists "location insert own" on public.member_location;
create policy "location insert own" on public.member_location
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "location update own" on public.member_location;
create policy "location update own" on public.member_location
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "location delete own" on public.member_location;
create policy "location delete own" on public.member_location
  for delete to authenticated using (user_id = auth.uid());


-- ════════════════════════════════════════════════════════════════════════
-- 3 · ROLES FUNCIONALES DE LA RED
-- ════════════════════════════════════════════════════════════════════════
-- Son FUNCIONES, no jerarquía espiritual, y viven APARTE de los emblemas de
-- progreso (user_unlocked_achievements), que no se tocan.
--
-- El emblema es la representación visual; el permiso real es la asignación
-- vigente en network_role_assignments, comprobada en servidor y por RLS.

create table if not exists public.network_roles (
  code        text primary key,
  name        text not null,
  description text not null default '',
  sort_order  int  not null default 0,
  is_active   boolean not null default true
);

insert into public.network_roles (code, name, description, sort_order) values
  ('organizador', 'Organizador de Encuentros', 'Puede crear y gestionar encuentros oficiales de la Red.',   10),
  ('facilitador', 'Facilitador de Círculo',    'Acompaña y modera un círculo.',                             20),
  ('embajador',   'Embajador de 144 mil',      'Ayuda a expandir la Red e incorpora nuevos miembros.',       30),
  ('colaborador', 'Colaborador',               'Aporta conocimiento, investigación, material o apoyo.',      40),
  ('cartografo',  'Cartógrafo',                'Propone y documenta lugares para el Mapa Cósmico.',          50),
  ('guardian',    'Guardián de Nodo',          'Sostiene la responsabilidad comunitaria de un nodo local.',  60)
on conflict (code) do nothing;

alter table public.network_roles enable row level security;

drop policy if exists "roles read members" on public.network_roles;
create policy "roles read members" on public.network_roles
  for select to authenticated using (is_active);


-- Asignaciones. Se conserva el histórico: revocar pone revoked_at, no borra.
create table if not exists public.network_role_assignments (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role_code   text not null references public.network_roles(code),
  granted_by  uuid references auth.users(id) on delete set null,
  granted_at  timestamptz not null default now(),
  revoked_at  timestamptz,
  note        text
);

-- Una sola asignación VIGENTE por (miembro, rol). El histórico revocado puede
-- repetirse tantas veces como haga falta.
create unique index if not exists idx_nra_vigente
  on public.network_role_assignments (user_id, role_code)
  where revoked_at is null;

create index if not exists idx_nra_user on public.network_role_assignments (user_id) where revoked_at is null;
create index if not exists idx_nra_role on public.network_role_assignments (role_code) where revoked_at is null;

alter table public.network_role_assignments enable row level security;

-- Los roles son funciones públicas dentro de la Red: se muestran en el perfil.
-- Solo se exponen las vigentes.
drop policy if exists "assignments read active" on public.network_role_assignments;
create policy "assignments read active" on public.network_role_assignments
  for select to authenticated using (revoked_at is null);

-- Sin insert/update/delete para authenticated: conceder y retirar roles pasa
-- SIEMPRE por service_role, tras comprobar en servidor que quien lo pide es
-- admin. Así tener el emblema nunca alcanza para auto-asignarse el permiso.


-- ════════════════════════════════════════════════════════════════════════
-- 4 · HELPER DE PERMISOS
-- ════════════════════════════════════════════════════════════════════════
-- security definer para poder usarse dentro de las policies de las tablas que
-- vendrán (encuentros, círculos, nodos) sin exigir SELECT sobre las
-- asignaciones ni provocar recursión.

create or replace function public.has_network_role(p_user uuid, p_role text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select exists (
    select 1 from public.network_role_assignments a
    where a.user_id = p_user
      and a.role_code = p_role
      and a.revoked_at is null
  );
$fn$;

revoke all on function public.has_network_role(uuid, text) from public, anon;
grant execute on function public.has_network_role(uuid, text) to authenticated, service_role;


-- ════════════════════════════════════════════════════════════════════════
-- 5 · VERIFICACIÓN (solo lectura)
-- ════════════════════════════════════════════════════════════════════════
select
  c.relname::text  as tabla,
  c.relrowsecurity as rls,
  (select count(*) from pg_policies p
     where p.schemaname = 'public' and p.tablename = c.relname) as policies,
  case when has_table_privilege('anon', c.oid, 'INSERT')
         or has_table_privilege('anon', c.oid, 'UPDATE')
         or has_table_privilege('anon', c.oid, 'DELETE')
       then 'FALLO: anon escribe' else 'ok' end as anon
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('network_cities','member_location','network_roles','network_role_assignments')
order by c.relname;
-- Esperado: 4 filas, rls = true, anon = 'ok'.
-- policies: member_location 4 · network_cities 1 · network_role_assignments 1 · network_roles 1
