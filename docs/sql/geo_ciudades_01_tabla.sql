-- ═══════════════════════════════════════════════════════════════════════════
--  TODAS LAS CIUDADES DEL MUNDO
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Correr ESTE archivo PRIMERO. Después se importan los CSV (ver al final).
--
-- ── POR QUÉ HACE FALTA ────────────────────────────────────────────────────
-- El buscador usaba `city-timezones`: 7.329 ciudades. Para la Cartografía
-- servía. Para una carta astral no, porque el Ascendente depende del sitio
-- exacto y pedirle a alguien «usa la ciudad grande más cercana» es pedirle
-- que aproxime justo donde la herramienta presume de precisar.
--
-- ── TRES FORMAS DISTINTAS DE NO ENCONTRAR UN SITIO ────────────────────────
-- Al probarlo con pueblos de verdad aparecieron tres fallos que parecían el
-- mismo y no lo eran. Los tres están resueltos aquí, y conviene saber cuál es
-- cuál antes de tocar nada:
--
--   1. QUE NO ESTÉ. `cities500` solo trae localidades de más de 500
--      habitantes. Purmamarca y Pisco Elqui daban cero. Por eso ahora los
--      datos salen del volcado COMPLETO de GeoNames filtrado a lugares
--      habitados, y no del recortado.
--
--   2. QUE SE LLAME DE OTRA FORMA. Bogotá también es «Santa Fe de Bogotá».
--      GeoNames trae una columna de nombres alternativos que en la primera
--      versión se descartó. Ahora se guardan en `alias_norm` y se buscan.
--
--   3. QUE SE ESCRIBA PARECIDO PERO NO IGUAL. Mompox está como «Mompós»,
--      con ese. Ni el prefijo ni los alias lo encuentran: hace falta
--      búsqueda DIFUSA, que es la tercera pasada de la función de abajo.
--
-- ── DE DÓNDE SALEN LOS DATOS, Y QUÉ OBLIGA ────────────────────────────────
-- GeoNames (geonames.org). Licencia CREATIVE COMMONS BY 4.0: vale para
-- cualquier uso, también comercial, pero EXIGE atribución visible.
--
-- No es como las librerías AGPL que se descartaron —aquí no hay que publicar
-- nada ni pagar nada— pero el crédito hay que ponerlo. Está bajo el buscador
-- del formulario. Si se quita de ahí, se incumple la licencia.
--
-- ── Y UNA COSA QUE CAMBIA ─────────────────────────────────────────────────
-- Buscar aquí significa que el NOMBRE DE LA CIUDAD viaja al servidor. La
-- fecha y la hora de nacimiento NO: siguen sin salir del navegador y el
-- cálculo sigue ocurriendo allí. El aviso del formulario está reescrito para
-- decir exactamente eso.

create table if not exists public.geo_ciudades (
  id bigserial primary key,

  -- Como se escribe de verdad, con tildes: «Bogotá», «Mompós».
  nombre text not null,

  -- El mismo, sin tildes y en minúsculas. Se guarda ya calculado porque así
  -- se puede indexar: normalizar al vuelo obligaría a recorrer la tabla
  -- entera en cada tecla.
  --
  -- OJO: lo calcula el mismo criterio que `normalizar()` en el cliente y en
  -- la ruta de la API. Si uno cambia y los otros no, la búsqueda local y la
  -- del servidor encontrarán cosas distintas y nadie sabrá por qué.
  nombre_norm text not null,

  -- Los otros nombres del mismo sitio, normalizados y separados por espacio:
  -- «santa fe de bogota bogota bog». Aquí es donde se encuentra un lugar que
  -- la gente llama de una forma y el callejero de otra.
  alias_norm text not null default '',

  provincia text,
  pais text not null,
  pais_codigo text not null,

  lat double precision not null,
  lon double precision not null,

  -- Identificador IANA. Sin esto no se puede pasar la hora local a universal.
  zona text not null,

  -- Para ordenar: entre varios «Santiago», primero el que más gente tiene.
  -- Muchos pueblos pequeños vienen con 0 porque GeoNames no lo sabe; eso NO
  -- los descarta, solo los pone después.
  poblacion integer not null default 0
);

-- ── SI LA TABLA YA EXISTÍA ────────────────────────────────────────────────
-- `create table if not exists` no añade columnas: si la tabla ya estaba de
-- una versión anterior, se la salta entera y `alias_norm` nunca aparece. El
-- resultado es un «column alias_norm does not exist» doscientas líneas más
-- abajo, al crear la función, que no se parece en nada a la causa.
--
-- Pasó. Estas líneas lo arreglan y no molestan si la tabla es nueva.
alter table public.geo_ciudades
  add column if not exists alias_norm text not null default '';

-- Por si acaso también faltara alguna de las otras.
alter table public.geo_ciudades add column if not exists provincia text;
alter table public.geo_ciudades add column if not exists poblacion integer not null default 0;

-- ── ÍNDICES ───────────────────────────────────────────────────────────────
-- `text_pattern_ops` es lo que hace que `LIKE 'bogot%'` use el índice. Con el
-- operador por defecto no lo usaría y recorrería la tabla entera.
create index if not exists geo_ciudades_prefijo
  on public.geo_ciudades (nombre_norm text_pattern_ops);

-- Trigramas: para buscar por el medio («angeles» → «Los Angeles») y, sobre
-- todo, para la búsqueda difusa que encuentra «Mompós» escribiendo «Mompox».
create extension if not exists pg_trgm;

create index if not exists geo_ciudades_trigramas
  on public.geo_ciudades using gin (nombre_norm gin_trgm_ops);

create index if not exists geo_ciudades_alias_trigramas
  on public.geo_ciudades using gin (alias_norm gin_trgm_ops);

create index if not exists geo_ciudades_pais
  on public.geo_ciudades (pais_codigo);

-- ── QUIÉN PUEDE LEER ──────────────────────────────────────────────────────
alter table public.geo_ciudades enable row level security;

-- Es un callejero público: no hay nada que proteger en el dato. Lo que se
-- protege es que no lo use un robot ajeno como API gratis a costa de esta
-- cuenta, y para eso basta con exigir sesión.
drop policy if exists "geo_ciudades_leer" on public.geo_ciudades;
create policy "geo_ciudades_leer"
  on public.geo_ciudades for select
  to authenticated
  using (true);

-- Nadie escribe desde la aplicación. La tabla se rellena importando el CSV.

-- ═══════════════════════════════════════════════════════════════════════════
--  LA BÚSQUEDA · tres pasadas, en este orden
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Va en una función de la base y no en la aplicación por dos razones: son
-- tres consultas que se cortan en cuanto hay suficiente —hacerlas desde
-- fuera serían tres viajes— y el criterio de ordenación queda en UN sitio.
--
-- El orden importa y no es casual:
--
--   1. EMPIEZA POR. Lo que casi siempre se busca, y lo más barato: usa el
--      índice de prefijo.
--   2. CONTIENE, en el nombre o en los alias. Más caro y con más ruido.
--   3. SE PARECE. La red de seguridad, solo si las dos anteriores no
--      llenaron la lista. Es la que encuentra «Mompós» escribiendo «Mompox»,
--      y también la que traería basura si se usara antes de tiempo.
--
-- Dentro de cada pasada manda la población: entre dos coincidencias igual de
-- buenas, la que más gente tiene es la que casi siempre se buscaba.
create or replace function public.buscar_ciudad(
  q text,
  lugar text default null,
  limite int default 8
)
returns table (
  nombre text,
  provincia text,
  pais text,
  pais_codigo text,
  lat double precision,
  lon double precision,
  zona text,
  poblacion integer
)
language plpgsql
stable
-- `search_path` fijado: sin esto, quien pudiera crear objetos en otro esquema
-- podría colar una función que se ejecutara en lugar de las de aquí.
set search_path = public, pg_temp
as $$
declare
  patron text := replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_');
begin
  if q is null or length(q) < 2 then
    return;
  end if;

  return query
  with candidatas as (
    -- 1 · empieza por
    select c.*, 1 as pasada, 1.0::real as parecido
    from public.geo_ciudades c
    where c.nombre_norm like patron || '%'
      and (lugar is null or lugar = '' or c.pais ilike '%' || lugar || '%' or c.provincia ilike '%' || lugar || '%')

    union all

    -- 2 · contiene, en el nombre o en algún alias
    select c.*, 2 as pasada, 0.9::real as parecido
    from public.geo_ciudades c
    where length(q) >= 3
      and (c.nombre_norm like '%' || patron || '%' or c.alias_norm like '%' || patron || '%')
      and c.nombre_norm not like patron || '%'
      and (lugar is null or lugar = '' or c.pais ilike '%' || lugar || '%' or c.provincia ilike '%' || lugar || '%')

    union all

    -- 3 · se parece.
    --
    -- `%` es el operador de pg_trgm y es el que usa el índice GIN; sin él,
    -- `similarity()` a secas recorrería el millón trescientas mil filas.
    --
    -- El 0,45 va escrito aquí y no como ajuste de sesión a propósito: un
    -- ajuste de sesión no viaja con la función, y el día que alguien llame a
    -- esto desde otro sitio se encontraría el umbral por defecto de Postgres
    -- —0,3—, que con nombres cortos devuelve media tabla.
    --
    -- 0,45 deja pasar «mompox»→«mompós» y corta el ruido. Bajarlo trae más
    -- resultados y peores.
    select c.*, 3 as pasada, similarity(c.nombre_norm, q) as parecido
    from public.geo_ciudades c
    where length(q) >= 4
      and c.nombre_norm % q
      and similarity(c.nombre_norm, q) >= 0.45
      and c.nombre_norm not like '%' || patron || '%'
      and (lugar is null or lugar = '' or c.pais ilike '%' || lugar || '%' or c.provincia ilike '%' || lugar || '%')
  )
  select
    distinct on (x.nombre, x.pais_codigo, round(x.lat::numeric, 2), round(x.lon::numeric, 2))
    x.nombre, x.provincia, x.pais, x.pais_codigo, x.lat, x.lon, x.zona, x.poblacion
  from (
    select * from candidatas
    order by pasada, parecido desc, poblacion desc
    limit limite * 4
  ) x
  order by
    x.nombre, x.pais_codigo, round(x.lat::numeric, 2), round(x.lon::numeric, 2),
    x.pasada, x.parecido desc, x.poblacion desc;
end;
$$;

-- Quien llame a esto desde fuera necesita permiso. Es una función de solo
-- lectura sobre datos públicos.
grant execute on function public.buscar_ciudad(text, text, int) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
--  CÓMO IMPORTAR LOS DATOS
-- ═══════════════════════════════════════════════════════════════════════════
--
-- En el Escritorio, carpeta `ciudades-geonames`, hay ONCE archivos de unos
-- 11 MB: `geo_ciudades_00.csv` … `geo_ciudades_10.csv`. Son 1.305.742
-- lugares de América y Europa occidental, hasta la última aldea.
--
-- Están troceados porque el importador del panel no traga un archivo de
-- ciento trece megas de una vez.
--
-- En Supabase: Table Editor → geo_ciudades → Insert → Import data from CSV.
-- Se suben UNO POR UNO, los once. Todos llevan cabecera, así que el orden da
-- igual y no pasa nada si se repite alguno por error: se duplicarían filas,
-- y para eso está el `truncate` de abajo.
--
-- Son once subidas seguidas. No es rápido, pero es una sola vez.
--
-- Para empezar de cero si algo sale mal:
--
--   truncate table public.geo_ciudades restart identity;
--
-- ── COMPROBACIÓN ──────────────────────────────────────────────────────────
-- Las tres consultas de abajo son los tres fallos que había. Las tres tienen
-- que devolver algo.

select count(*) as filas from public.geo_ciudades;

-- 1 · un pueblo pequeño que antes no estaba
select * from public.buscar_ciudad('purmamarca');

-- 2 · un nombre que se escribe distinto: «Mompox» debe encontrar «Mompós»
select * from public.buscar_ciudad('mompox');

-- 3 · lo de siempre, que no se haya roto
select * from public.buscar_ciudad('bogota');
