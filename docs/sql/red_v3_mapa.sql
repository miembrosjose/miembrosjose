-- ============================================================================
-- LA RED · VERTICAL 3 — MAPA DE LA RED    PREPARADA, NO EJECUTADA
-- ============================================================================
-- Añade al directorio el emblema destacado de cada miembro, para poder
-- filtrar el mapa por emblema y dibujarlo junto a la foto al máximo zoom.
--
-- Correr DESPUÉS de red_v2_directorio.sql.
--
-- GARANTÍAS
--   · Una columna nueva en member_location y una línea añadida a dos triggers
--     que ya existen. Nada más.
--   · No toca RLS, ni el catálogo de ciudades, ni el Mapa Cósmico.
--   · Idempotente.
--
-- NOTA SOBRE PRIVACIDAD — no cambia nada de lo anterior
--   El mapa sigue trabajando a nivel de CIUDAD. Las coordenadas que se guardan
--   son las del centro de la ciudad, compartidas por todos sus miembros. Al
--   máximo zoom las fotos se reparten en un anillo alrededor de ese centro:
--   ese anillo es una disposición VISUAL para que no se solapen, no una
--   afirmación sobre dónde vive nadie.
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════
-- 1 · EMBLEMA DESTACADO EN EL DIRECTORIO
-- ════════════════════════════════════════════════════════════════════════
-- Es el mismo featured_badge_id que ya vive en auth.users.raw_user_meta_data
-- y que el perfil usa hoy. Copiarlo aquí permite filtrar el mapa por emblema
-- en SQL, sin traerse a todos los miembros al navegador.

alter table public.member_location add column if not exists featured_badge_id text;

-- Filtro «miembros de esta ciudad con tal emblema».
create index if not exists idx_ml_dir_badge
  on public.member_location (city_id, featured_badge_id) where show_city;


-- ════════════════════════════════════════════════════════════════════════
-- 2 · SINCRONIZACIÓN
-- ════════════════════════════════════════════════════════════════════════
-- Se reescriben las dos funciones de la Vertical 2 añadiendo el emblema.
-- Son CREATE OR REPLACE: los triggers existentes siguen apuntando a ellas sin
-- necesidad de recrearse.

create or replace function public.member_location_sync()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $fn$
declare
  meta jsonb;
  email text;
begin
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
    if new.featured_badge_id is null then
      new.featured_badge_id := nullif(meta->>'featured_badge_id', '');
    end if;
  end if;

  new.display_name_norm := lower(translate(coalesce(new.display_name, ''),
    'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
    'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'));

  new.updated_at := now();
  return new;
end $fn$;


create or replace function public.sync_directory_from_auth()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $fn$
begin
  update public.member_location ml
     set display_name = coalesce(
           nullif(new.raw_user_meta_data->>'full_name', ''),
           nullif(new.raw_user_meta_data->>'name', ''),
           split_part(coalesce(new.email, ''), '@', 1),
           'Miembro'),
         avatar_url        = nullif(new.raw_user_meta_data->>'avatar_url', ''),
         username          = nullif(new.raw_user_meta_data->>'username', ''),
         featured_badge_id = nullif(new.raw_user_meta_data->>'featured_badge_id', '')
   where ml.user_id = new.id;
  return new;
end $fn$;


-- ════════════════════════════════════════════════════════════════════════
-- 3 · RELLENO DE LAS FILAS EXISTENTES
-- ════════════════════════════════════════════════════════════════════════

update public.member_location ml
   set featured_badge_id = nullif(u.raw_user_meta_data->>'featured_badge_id', '')
  from auth.users u
 where u.id = ml.user_id
   and ml.featured_badge_id is null;


-- ════════════════════════════════════════════════════════════════════════
-- 4 · VERIFICACIÓN (solo lectura)
-- ════════════════════════════════════════════════════════════════════════

select
  count(*)                                         as filas,
  count(*) filter (where show_city)                as visibles,
  count(*) filter (where featured_badge_id is not null) as con_emblema,
  count(distinct featured_badge_id)                as emblemas_distintos
from public.member_location;

-- Reparto por país y ciudad, tal como lo verá el mapa.
select
  country_code as pais,
  count(*)     as miembros,
  count(distinct city_id) as ciudades
from public.member_location
where show_city
group by country_code
order by count(*) desc;
