-- ============================================================================
-- LA RED · VERTICAL 2 — DIRECTORIO    PREPARADA, NO EJECUTADA
-- ============================================================================
-- Hace posible explorar la Red con consultas reales: filtrar por país y ciudad,
-- buscar por nombre y paginar, todo en SQL y con índices.
--
-- Correr DESPUÉS de red_v1_identidad.sql y red_v1_ciudades_seed.sql.
--
-- GARANTÍAS
--   · Solo añade columnas a member_location (tabla creada en la Vertical 1) y
--     crea un trigger e índices. No toca ninguna tabla anterior a La Red.
--   · No modifica RLS existente. Las policies de member_location siguen igual:
--     la fila propia siempre, las ajenas solo con show_city.
--   · Idempotente.
--   · Rollback en docs/sql/red_v2_directorio_rollback.sql
--
--
-- POR QUÉ DENORMALIZAR EL NOMBRE Y EL AVATAR
--
-- El nombre, el avatar y el username de un miembro viven en
-- auth.users.raw_user_meta_data, no en public. Sin copiarlos, listar «los
-- miembros de Cuenca» obligaría a: (1) consultar member_location, (2) pedir
-- uno por uno cada usuario a la API de Auth. Con 38 miembros son 38 llamadas;
-- con 144.000 es inviable.
--
-- Copiándolos aquí, la misma consulta filtra, busca, ordena y pagina. Es el
-- mismo patrón que el proyecto ya usa en forum_posts, que guarda author_name y
-- author_avatar_url junto al post.
--
-- La copia se mantiene sola con un trigger sobre auth.users: si alguien cambia
-- su nombre o su foto, el directorio se actualiza sin intervención de la app.
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════
-- 1 · COLUMNAS DE IDENTIDAD EN EL DIRECTORIO
-- ════════════════════════════════════════════════════════════════════════

alter table public.member_location add column if not exists display_name text;
alter table public.member_location add column if not exists display_name_norm text;
alter table public.member_location add column if not exists avatar_url text;
alter table public.member_location add column if not exists username text;
-- Fecha de alta del miembro, copiada para poder ordenar por «más recientes»
-- sin salir de esta tabla.
alter table public.member_location add column if not exists member_since timestamptz;


-- ════════════════════════════════════════════════════════════════════════
-- 2 · SINCRONIZACIÓN DESDE auth.users
-- ════════════════════════════════════════════════════════════════════════
-- Una sola función hace las dos cosas: normaliza el nombre de búsqueda y
-- rellena la identidad desde auth.users cuando falta.

create or replace function public.member_location_sync()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $fn$
declare
  meta jsonb;
  email text;
begin
  -- Identidad desde auth.users si el llamador no la trajo.
  if new.display_name is null or new.member_since is null then
    select u.raw_user_meta_data, u.email, u.created_at
      into meta, email, new.member_since
      from auth.users u where u.id = new.user_id;

    if new.display_name is null then
      new.display_name := coalesce(
        nullif(meta->>'full_name', ''),
        nullif(meta->>'name', ''),
        split_part(coalesce(email, ''), '@', 1),
        'Miembro'
      );
    end if;
    if new.avatar_url is null then new.avatar_url := nullif(meta->>'avatar_url', ''); end if;
    if new.username  is null then new.username  := nullif(meta->>'username', '');  end if;
  end if;

  -- Nombre normalizado para buscar sin tildes ni mayúsculas.
  new.display_name_norm := lower(translate(coalesce(new.display_name, ''),
    'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
    'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'));

  new.updated_at := now();
  return new;
end $fn$;

drop trigger if exists trg_member_location_sync on public.member_location;
create trigger trg_member_location_sync
  before insert or update on public.member_location
  for each row execute function public.member_location_sync();


-- Cuando alguien cambia su nombre o su foto, el directorio se entera solo.
-- Solo ACTUALIZA filas que ya existen: no crea directorio para quien no ha
-- completado su ubicación.
create or replace function public.sync_directory_from_auth()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $fn$
begin
  update public.member_location ml
     set display_name = coalesce(
           nullif(new.raw_user_meta_data->>'full_name', ''),
           nullif(new.raw_user_meta_data->>'name', ''),
           split_part(coalesce(new.email, ''), '@', 1),
           'Miembro'),
         avatar_url   = nullif(new.raw_user_meta_data->>'avatar_url', ''),
         username     = nullif(new.raw_user_meta_data->>'username', '')
   where ml.user_id = new.id;
  return new;
end $fn$;

drop trigger if exists trg_sync_directory_from_auth on auth.users;
create trigger trg_sync_directory_from_auth
  after update of raw_user_meta_data on auth.users
  for each row execute function public.sync_directory_from_auth();


-- ════════════════════════════════════════════════════════════════════════
-- 3 · RELLENO DE LAS FILAS YA EXISTENTES
-- ════════════════════════════════════════════════════════════════════════
-- Si alguien guardó su ubicación con la Vertical 1, su fila no tiene todavía
-- nombre ni avatar. Este UPDATE los trae desde auth.users. Solo escribe donde
-- falta: re-ejecutarlo no pisa nada.

update public.member_location ml
   set display_name = coalesce(
         nullif(u.raw_user_meta_data->>'full_name', ''),
         nullif(u.raw_user_meta_data->>'name', ''),
         split_part(coalesce(u.email, ''), '@', 1),
         'Miembro'),
       avatar_url   = coalesce(ml.avatar_url, nullif(u.raw_user_meta_data->>'avatar_url', '')),
       username     = coalesce(ml.username,   nullif(u.raw_user_meta_data->>'username', '')),
       member_since = coalesce(ml.member_since, u.created_at)
  from auth.users u
 where u.id = ml.user_id
   and ml.display_name is null;


-- ════════════════════════════════════════════════════════════════════════
-- 4 · ÍNDICES DE LAS CONSULTAS REALES
-- ════════════════════════════════════════════════════════════════════════
-- Todos parciales sobre show_city: el directorio nunca lee filas ocultas, así
-- que los índices solo cubren las visibles y quedan más pequeños.

-- «Miembros de esta ciudad, los más recientes primero»
create index if not exists idx_ml_dir_city
  on public.member_location (city_id, member_since desc) where show_city;

-- «Miembros de este país»
create index if not exists idx_ml_dir_country
  on public.member_location (country_code, member_since desc) where show_city;

-- Búsqueda por nombre dentro del directorio visible
create index if not exists idx_ml_dir_name
  on public.member_location (display_name_norm) where show_city;

-- Listado general sin filtros
create index if not exists idx_ml_dir_recent
  on public.member_location (member_since desc) where show_city;


-- ════════════════════════════════════════════════════════════════════════
-- 5 · VERIFICACIÓN (solo lectura)
-- ════════════════════════════════════════════════════════════════════════

-- Estado del directorio.
select
  count(*)                                   as filas_totales,
  count(*) filter (where show_city)          as visibles,
  count(*) filter (where display_name is null) as sin_nombre,
  count(distinct country_code)               as paises,
  count(distinct city_id)                    as ciudades
from public.member_location;
-- sin_nombre debe ser 0. Si no lo es, el relleno del bloque 3 no encontró
-- al usuario en auth.users (cuenta borrada).

-- Índices creados. Esperado: 4 filas idx_ml_dir_*.
select indexname from pg_indexes
where schemaname = 'public' and tablename = 'member_location' and indexname like 'idx_ml_dir%'
order by indexname;

-- Los triggers deben estar activos. Esperado: 2 filas.
select tgname from pg_trigger
where tgname in ('trg_member_location_sync', 'trg_sync_directory_from_auth')
  and not tgisinternal
order by tgname;
